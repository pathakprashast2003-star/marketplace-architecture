import { revalidatePath, revalidateTag } from 'next/cache'
import Stripe from 'stripe'
import type { BillingDb, BillingDeps, StripeLike } from './billing'
import { adminClient, rpc } from './db'
import { env } from './env'
import { report } from './observe'

let client: Stripe | null = null

export function stripe(): Stripe {
  if (!client) client = new Stripe(env().STRIPE_SECRET_KEY, { timeout: 10_000, maxNetworkRetries: 2 })
  return client
}

export const billingDb: BillingDb = {
  claimEvent: (id, type, created) =>
    rpc('claim_stripe_event', { p_id: id, p_type: type, p_created: created.toISOString() }),
  finishEvent: async (id, error) => {
    await rpc('finish_stripe_event', { p_id: id, p_error: error })
  },
  creatorByCustomer: async (customerId) => {
    const { data, error } = await adminClient()
      .from('creator_billing')
      .select('creator_id, card_fingerprint, trial_abuse')
      .eq('stripe_customer_id', customerId)
      .maybeSingle()
    if (error) throw new Error(`creator lookup failed: ${error.message}`)
    return data
      ? { creatorId: data.creator_id as string, hasFingerprint: Boolean(data.card_fingerprint), trialAbuse: Boolean(data.trial_abuse) }
      : null
  },
  beginSync: (creatorId) => rpc<number>('begin_billing_sync', { p_creator_id: creatorId }),
  registerFingerprint: (creatorId, fingerprint) =>
    rpc('register_card_fingerprint', { p_creator_id: creatorId, p_fingerprint: fingerprint }),
  applyState: (a) =>
    rpc('apply_billing_state', {
      p_creator_id: a.creatorId,
      p_subscription_id: a.subscriptionId,
      p_stripe_status: a.status,
      p_cancel_at_period_end: a.cancelAtPeriodEnd,
      p_gen: a.gen,
    }),
}

/** Hiding or showing a profile clears its cached pages straight away. */
export function revalidateCreator(slug: string) {
  try {
    revalidatePath(`/c/${slug}`)
    revalidateTag('creators')
  } catch {
    // outside a request (tests, scripts): nothing cached to clear
  }
}

export function billingDeps(): BillingDeps {
  return {
    stripe: stripe() as unknown as StripeLike,
    db: billingDb,
    webhookSecret: env().STRIPE_WEBHOOK_SECRET,
    revalidate: revalidateCreator,
    onOrphan: (creatorId, subscriptionId) =>
      report(new Error('orphan subscription cancelled: check for refund'), 'billing.orphan', { creatorId, subscriptionId }),
  }
}
