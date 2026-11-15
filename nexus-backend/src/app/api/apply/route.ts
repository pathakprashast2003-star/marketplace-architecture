import { after, type NextRequest } from 'next/server'
import { requireUser } from '@/lib/auth'
import { adminClient, rpc } from '@/lib/db'
import { flushSoon } from '@/lib/email'
import { rateLimit, rateLimitIp, verifyTurnstile } from '@/lib/guards'
import { json, readJson, route } from '@/lib/http'
import { application } from '@/lib/schemas'
import { stripe } from '@/lib/stripe'

// Creator application. Needs a verified email and a passed age check (18+). Goes to a person for review.
export const POST = route(async (req: NextRequest) => {
  const user = await requireUser()
  const body = await readJson(req, application)
  const ipHash = await rateLimitIp(req, 'apply', 10, 3600)
  await rateLimit(`apply:user:${user.id}`, 5, 3600)
  await verifyTurnstile(body.turnstileToken, req)
  // Re-applying: close any Stripe checkout page left open from an earlier approval, so nobody can
  // pay while their application is back in review.
  const { data: prior, error: priorError } = await adminClient()
    .from('creators')
    .select('id, creator_billing(stripe_customer_id)')
    .eq('user_id', user.id)
    .maybeSingle()
  if (priorError) throw new Error(`creator lookup failed: ${priorError.message}`)
  const pb = (Array.isArray(prior?.creator_billing) ? prior?.creator_billing[0] : prior?.creator_billing) as { stripe_customer_id: string | null } | null | undefined
  if (pb?.stripe_customer_id) {
    const open = await stripe().checkout.sessions.list({ customer: pb.stripe_customer_id, status: 'open', limit: 20 })
    for (const o of open.data) await stripe().checkout.sessions.expire(o.id)
  }
  const id = await rpc<string>('submit_application', {
    p_user_id: user.id,
    p_display_name: body.display_name,
    p_category: body.category,
    p_city: body.city,
    p_region: body.region ?? null,
    p_country: body.country ?? null,
    p_portfolio_url: body.portfolio_url,
    p_works_remote: body.works_remote,
    p_starting_price_cents: body.starting_price_cents ?? null,
    p_headline: body.headline ?? null,
    p_utm_source: body.utm_source ?? null,
    p_ref_code: body.ref ?? null,
    p_ip_hash: ipHash,
  })
  after(flushSoon)
  return json({ ok: true, creator_id: id }, 201)
})
