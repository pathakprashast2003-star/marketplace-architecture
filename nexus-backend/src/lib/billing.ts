// Billing logic, written against small interfaces so it can be tested without Stripe or a database.
// Rule: an event is only a hint that something changed. We always re-read the live state from Stripe.

export type SubLike = {
  id: string
  status: string
  created: number
  cancel_at_period_end?: boolean | null
  default_payment_method?: string | { id: string } | null
}

export interface StripeLike {
  webhooks: { constructEvent(body: string, signature: string, secret: string): StripeEventLike }
  subscriptions: {
    list(p: { customer: string; status: 'all'; limit: number }): Promise<{ data: SubLike[] }>
    update(id: string, p: { trial_end: 'now' }): Promise<SubLike>
    cancel(id: string): Promise<unknown>
  }
  customers: { retrieve(id: string): Promise<unknown> }
  paymentMethods: { retrieve(id: string): Promise<{ card?: { fingerprint?: string | null } | null }> }
}

export type StripeEventLike = {
  id: string
  type: string
  created: number
  data: { object: Record<string, unknown> }
}

export interface BillingDb {
  claimEvent(id: string, type: string, created: Date): Promise<'new' | 'retry' | 'done'>
  finishEvent(id: string, error: string | null): Promise<void>
  creatorByCustomer(customerId: string): Promise<{ creatorId: string; hasFingerprint: boolean; trialAbuse: boolean } | null>
  /** Takes the next sync number for this creator. Must be called before reading Stripe. */
  beginSync(creatorId: string): Promise<number>
  registerFingerprint(creatorId: string, fingerprint: string): Promise<boolean>
  applyState(a: {
    creatorId: string
    subscriptionId: string | null
    status: string | null
    cancelAtPeriodEnd: boolean
    gen: number
  }): Promise<{ changed: boolean; status: string; slug: string; stale?: boolean; covered?: boolean; orphan?: boolean }>
}

export type BillingDeps = {
  stripe: StripeLike
  db: BillingDb
  webhookSecret: string
  /** Clears cached pages for a creator whose visibility changed. */
  revalidate: (slug: string) => void | Promise<void>
  /** Called when a subscription had to be cancelled for someone not approved (possible refund). */
  onOrphan?: (creatorId: string, subscriptionId: string) => void | Promise<void>
}

const LIVE = new Set(['active', 'trialing', 'past_due', 'unpaid'])
const ORDER = ['active', 'trialing', 'past_due', 'unpaid', 'paused', 'incomplete', 'canceled', 'incomplete_expired']

/** A customer can have old canceled subscriptions next to a new one. Pick the one that counts. */
export function pickCurrentSubscription(subs: SubLike[]): SubLike | null {
  if (subs.length === 0) return null
  const rank = (s: SubLike) => {
    const i = ORDER.indexOf(s.status)
    return i === -1 ? ORDER.length : i
  }
  return [...subs].sort((a, b) => rank(a) - rank(b) || b.created - a.created)[0] ?? null
}

function isMissing(e: unknown): boolean {
  const x = e as { code?: string; statusCode?: number }
  return x?.code === 'resource_missing' || x?.statusCode === 404
}

function idOf(v: unknown): string | null {
  if (typeof v === 'string') return v
  if (v && typeof v === 'object' && typeof (v as { id?: unknown }).id === 'string') return (v as { id: string }).id
  return null
}

/** Reads one customer's live subscription from Stripe and writes the resulting status. */
export async function syncCustomer(deps: BillingDeps, customerId: string) {
  const creator = await deps.db.creatorByCustomer(customerId)
  if (!creator) return { skipped: true as const }

  // Take a number first, then read. Only the newest number may write (see apply_billing_state).
  const read = async () => {
    const gen = await deps.db.beginSync(creator.creatorId)
    try {
      const list = await deps.stripe.subscriptions.list({ customer: customerId, status: 'all', limit: 20 })
      return { gen, current: pickCurrentSubscription(list.data), all: list.data }
    } catch (e) {
      if (isMissing(e)) return { gen, current: null, all: [] as SubLike[] } // customer deleted at Stripe
      throw e
    }
  }

  let { gen, current, all } = await read()

  // Free-trial abuse: a card that already had a trial means this trial ends now.
  // Decided again on every sync, so a failed attempt to end the trial is retried.
  if (current?.status === 'trialing') {
    let abuse = creator.trialAbuse
    if (!creator.hasFingerprint) {
      const fingerprint = await cardFingerprint(deps, current, customerId)
      if (fingerprint) abuse = (await deps.db.registerFingerprint(creator.creatorId, fingerprint)) || abuse
    }
    if (abuse) {
      await deps.stripe.subscriptions.update(current.id, { trial_end: 'now' })
      ;({ gen, current, all } = await read())
    }
  }

  const result = await deps.db.applyState({
    creatorId: creator.creatorId,
    subscriptionId: current?.id ?? null,
    status: current?.status ?? null,
    cancelAtPeriodEnd: Boolean(current?.cancel_at_period_end),
    gen,
  })
  // Someone whose application is not approved has a live subscription (should be impossible:
  // re-applying closes open checkout pages). Cancel it so billing stops, and flag it for a person
  // to check whether a refund is due.
  if (result.orphan && current) {
    await deps.stripe.subscriptions.cancel(current.id)
    await deps.onOrphan?.(creator.creatorId, current.id)
  }
  // Two checkout pages completed: keep the one that counts, cancel any other live one.
  if (current && !result.stale) {
    for (const extra of all) {
      if (extra.id !== current.id && LIVE.has(extra.status)) await deps.stripe.subscriptions.cancel(extra.id)
    }
  }
  if (result.changed) await deps.revalidate(result.slug)
  return { skipped: false as const, ...result }
}

async function cardFingerprint(deps: BillingDeps, sub: SubLike, customerId: string): Promise<string | null> {
  let pm = idOf(sub.default_payment_method)
  if (!pm) {
    const customer = (await deps.stripe.customers.retrieve(customerId)) as {
      invoice_settings?: { default_payment_method?: unknown }
    }
    pm = idOf(customer?.invoice_settings?.default_payment_method)
  }
  if (!pm) return null
  const method = await deps.stripe.paymentMethods.retrieve(pm)
  return method.card?.fingerprint ?? null
}

const CUSTOMER_EVENTS = new Set([
  'checkout.session.completed',
  'customer.subscription.created',
  'customer.subscription.updated',
  'customer.subscription.deleted',
  'customer.subscription.paused',
  'customer.subscription.resumed',
  'customer.subscription.trial_will_end',
  'invoice.paid',
  'invoice.payment_failed',
  'invoice.payment_action_required',
  'customer.deleted',
])

/**
 * Handles one webhook delivery.
 *  - bad signature        → 400, nothing happens
 *  - already processed    → 200, nothing happens
 *  - anything fails       → 500, so Stripe delivers it again later
 */
export async function handleStripeWebhook(
  deps: BillingDeps,
  rawBody: string,
  signature: string | null,
): Promise<{ status: number; body: Record<string, unknown> }> {
  if (!signature) return { status: 400, body: { error: 'missing_signature' } }
  let event: StripeEventLike
  try {
    event = deps.stripe.webhooks.constructEvent(rawBody, signature, deps.webhookSecret)
  } catch {
    return { status: 400, body: { error: 'bad_signature' } }
  }

  const state = await deps.db.claimEvent(event.id, event.type, new Date(event.created * 1000))
  if (state === 'done') return { status: 200, body: { received: true, duplicate: true } }

  try {
    if (CUSTOMER_EVENTS.has(event.type)) {
      const obj = event.data.object
      const customerId = event.type === 'customer.deleted' ? idOf(obj.id) : idOf(obj.customer)
      if (customerId) {
        // If a newer read of Stripe started while ours was in flight, ours is dropped ("stale").
        // That newer read may have failed, so do not call this event done until one read of ours lands.
        let landed = false
        for (let attempt = 0; attempt < 5 && !landed; attempt++) {
          if (attempt > 0) await new Promise((r) => setTimeout(r, 100 * attempt + Math.random() * 200))
          const r = await syncCustomer(deps, customerId)
          landed = r.skipped || !r.stale || Boolean(r.covered)
        }
        if (!landed) throw new Error('sync kept being superseded')
      }
    }
    await deps.db.finishEvent(event.id, null)
    return { status: 200, body: { received: true } }
  } catch (e) {
    const message = e instanceof Error ? e.message : String(e)
    await deps.db.finishEvent(event.id, message).catch(() => {})
    return { status: 500, body: { error: 'processing_failed' } }
  }
}

/** When (if at all) a new subscription's free trial should end. Stripe needs at least 48 hours. */
export function trialEndFor(trialEndsAt: string | null, now: Date): number | undefined {
  if (!trialEndsAt) return undefined
  const end = new Date(trialEndsAt).getTime()
  if (Number.isNaN(end)) return undefined
  return end - now.getTime() > 49 * 3600 * 1000 ? Math.floor(end / 1000) : undefined
}
