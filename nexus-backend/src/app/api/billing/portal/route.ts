import { requireUser } from '@/lib/auth'
import { adminClient } from '@/lib/db'
import { env } from '@/lib/env'
import { rateLimit } from '@/lib/guards'
import { HttpError, json, route } from '@/lib/http'
import { stripe } from '@/lib/stripe'

// Stripe's own page for updating the card, seeing invoices and cancelling.
export const POST = route(async () => {
  const user = await requireUser()
  await rateLimit(`portal:user:${user.id}`, 20, 3600)
  const { data, error } = await adminClient()
    .from('creators')
    .select('id, creator_billing(stripe_customer_id)')
    .eq('user_id', user.id)
    .maybeSingle()
  if (error) throw new Error(`creator lookup failed: ${error.message}`)
  const billing = (Array.isArray(data?.creator_billing) ? data?.creator_billing[0] : data?.creator_billing) as { stripe_customer_id: string | null } | null | undefined
  if (!billing?.stripe_customer_id) throw new HttpError(409, 'no_billing_account')
  const session = await stripe().billingPortal.sessions.create({
    customer: billing.stripe_customer_id,
    return_url: `${env().APP_URL.replace(/\/$/, '')}/billing`,
  })
  return json({ url: session.url })
})
