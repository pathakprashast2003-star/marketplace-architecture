import type { NextRequest } from 'next/server'
import { requireUser } from '@/lib/auth'
import { rpc } from '@/lib/db'
import { rateLimitIp } from '@/lib/guards'
import { json, readJson, route } from '@/lib/http'
import { reviewCreate } from '@/lib/schemas'

// One review per answered inquiry, at least a week later. Always held for moderation first.
export const POST = route(async (req: NextRequest) => {
  const user = await requireUser()
  const body = await readJson(req, reviewCreate)
  const ipHash = await rateLimitIp(req, 'review', 10, 3600)
  const id = await rpc<string>('submit_review', {
    p_user_id: user.id,
    p_inquiry_id: body.inquiry_id,
    p_rating: body.rating,
    p_body: body.body ?? null,
    p_ip_hash: ipHash,
  })
  return json({ ok: true, id, status: 'pending' }, 201)
})
