import type { NextRequest } from 'next/server'
import { handleStripeWebhook } from '@/lib/billing'
import { json } from '@/lib/http'
import { report } from '@/lib/observe'
import { billingDeps } from '@/lib/stripe'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

// Stripe calls this. The signature is checked on the exact bytes Stripe sent.
export async function POST(req: NextRequest) {
  try {
    const raw = await req.text()
    if (raw.length > 1_000_000) return json({ error: 'too_large' }, 413)
    const out = await handleStripeWebhook(billingDeps(), raw, req.headers.get('stripe-signature'))
    return json(out.body, out.status)
  } catch (e) {
    report(e, 'stripe.webhook')
    return json({ error: 'server_error' }, 500) // Stripe will retry
  }
}
