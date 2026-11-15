import { requireUser } from '@/lib/auth'
import { syncCustomer, trialEndFor } from '@/lib/billing'
import { adminClient, rpc } from '@/lib/db'
import { env } from '@/lib/env'
import { rateLimit } from '@/lib/guards'
import { HttpError, json, route } from '@/lib/http'
import { billingDeps, stripe } from '@/lib/stripe'

// Starts Stripe Checkout for an approved creator: card now, $0 today, first charge when the
// free days (counted from approval) run out. Coming back after cancelling gets no second trial.
export const POST = route(async () => {
  const user = await requireUser()
  await rateLimit(`checkout:user:${user.id}`, 10, 3600)
  await rateLimit(`checkout_lock:user:${user.id}`, 1, 15) // one checkout start at a time (double click, two tabs)
  const db = adminClient()
  const { data: creator, error } = await db
    .from('creators')
    .select('id, status, hidden_reason, canceled_reason, creator_billing(stripe_customer_id, trial_ends_at, had_trial, trial_abuse)')
    .eq('user_id', user.id)
    .maybeSingle()
  if (error) throw new Error(`creator lookup failed: ${error.message}`)
  if (!creator) throw new HttpError(403, 'not_a_creator')
  const billing = (Array.isArray(creator.creator_billing) ? creator.creator_billing[0] : creator.creator_billing) as {
    stripe_customer_id: string | null
    trial_ends_at: string | null
    had_trial: boolean
    trial_abuse: boolean
  } | null
  if (!billing) throw new Error('billing row missing')

  const canStart =
    creator.status === 'approved' ||
    (creator.status === 'canceled' && creator.canceled_reason === 'subscription_ended') ||
    (creator.status === 'hidden' && creator.hidden_reason === 'payment')
  if (['trialing', 'active', 'past_due'].includes(creator.status)) throw new HttpError(409, 'already_subscribed')
  if (!canStart) throw new HttpError(409, 'invalid_state')

  const s = stripe()
  let customerId = billing.stripe_customer_id
  if (!customerId) {
    const customer = await s.customers.create(
      { email: user.email ?? undefined, metadata: { creator_id: creator.id } },
      { idempotencyKey: `customer:${creator.id}` },
    )
    customerId = await rpc<string>('set_stripe_customer', { p_creator_id: creator.id, p_customer_id: customer.id })
  }

  // A second tab, or a webhook we have not seen yet: if Stripe already has a live subscription, do not sell another.
  const existing = await s.subscriptions.list({ customer: customerId, status: 'all', limit: 20 })
  if (existing.data.some((x) => ['trialing', 'active', 'past_due', 'unpaid'].includes(x.status))) {
    await syncCustomer(billingDeps(), customerId)
    throw new HttpError(409, 'already_subscribed')
  }

  // Close any checkout page still open from an earlier click, so two cannot both complete.
  const open = await s.checkout.sessions.list({ customer: customerId, status: 'open', limit: 20 })
  for (const o of open.data) await s.checkout.sessions.expire(o.id) // if this fails we stop: never two payable pages

  const firstTime = !billing.had_trial && !billing.trial_abuse
  const trialEnd = firstTime ? trialEndFor(billing.trial_ends_at, new Date()) : undefined
  const base = env().APP_URL.replace(/\/$/, '')
  const session = await s.checkout.sessions.create({
    mode: 'subscription',
    customer: customerId,
    client_reference_id: creator.id,
    line_items: [{ price: env().STRIPE_PRICE_ID, quantity: 1 }],
    payment_method_collection: 'always',
    subscription_data: { metadata: { creator_id: creator.id }, ...(trialEnd ? { trial_end: trialEnd } : {}) },
    success_url: `${base}/billing?checkout=done`,
    cancel_url: `${base}/billing?checkout=cancelled`,
  })
  if (!session.url) throw new HttpError(502, 'checkout_unavailable')
  return json({ url: session.url })
})
