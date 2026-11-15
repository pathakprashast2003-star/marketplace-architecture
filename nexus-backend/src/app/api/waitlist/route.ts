import { after, type NextRequest } from 'next/server'
import { rpc } from '@/lib/db'
import { flushSoon } from '@/lib/email'
import { rateLimit, rateLimitIp, verifyTurnstile } from '@/lib/guards'
import { json, preflight, readJson, route, hashKey } from '@/lib/http'
import { waitlistCreate, waitlistDetails } from '@/lib/schemas'

export const OPTIONS = preflight

// Pre-launch request from the homepage. No account. The answer is identical whether or not
// the email is already on the list.
export const POST = route(
  async (req: NextRequest) => {
    const body = await readJson(req, waitlistCreate)
    const ipHash = await rateLimitIp(req, 'waitlist', 8, 600)
    await verifyTurnstile(body.turnstileToken, req)
    await rateLimit(`waitlist:email:${hashKey(body.email)}`, 5, 3600)
    const out = await rpc<{ edit_token: string; referral_code: string }>('create_waitlist_lead', {
      p_role: body.role,
      p_email: body.email,
      p_need: body.need,
      p_craft: body.craft ?? null,
      p_city: body.city,
      p_utm_source: body.utm_source ?? null,
      p_utm_medium: body.utm_medium ?? null,
      p_utm_campaign: body.utm_campaign ?? null,
      p_ref_code: body.ref ?? null,
      p_landing: body.landing ?? null,
      p_ip_hash: ipHash,
    })
    after(flushSoon)
    return json({ ok: true, edit_token: out.edit_token, referral_code: out.referral_code })
  },
  { cors: true },
)

// Optional second step: date and budget.
export const PATCH = route(
  async (req: NextRequest) => {
    const body = await readJson(req, waitlistDetails)
    await rateLimitIp(req, 'waitlist_details', 20, 600)
    await rpc('update_waitlist_details', { p_token: body.edit_token, p_date_text: body.date ?? null, p_budget: body.budget ?? null })
    return json({ ok: true })
  },
  { cors: true },
)
