import { after, type NextRequest } from 'next/server'
import { requireUser } from '@/lib/auth'
import { rpc } from '@/lib/db'
import { flushSoon } from '@/lib/email'
import { rateLimitIp, verifyTurnstile } from '@/lib/guards'
import { json, readJson, route } from '@/lib/http'
import { inquiryCreate } from '@/lib/schemas'

// The core product. Limits: per network address here; per account, per creator and per pair
// inside the database. The inquiry is saved first; the email is queued and retried on its own.
export const POST = route(async (req: NextRequest) => {
  const user = await requireUser()
  const body = await readJson(req, inquiryCreate)
  const ipHash = await rateLimitIp(req, 'inquiry', 20, 3600)
  await verifyTurnstile(body.turnstileToken, req)
  const id = await rpc<string>('send_inquiry', {
    p_user_id: user.id,
    p_creator_id: body.creator_id,
    p_name: body.name,
    p_event_date: body.event_date ?? null,
    p_date_flexible: body.date_flexible,
    p_budget: body.budget ?? null,
    p_phone: body.phone ?? null,
    p_people: body.people ?? null,
    p_message: body.message,
    p_ip_hash: ipHash,
  })
  after(flushSoon)
  return json({ ok: true, id }, 201)
})
