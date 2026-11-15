import type { NextRequest } from 'next/server'
import { requireUser } from '@/lib/auth'
import { rpc } from '@/lib/db'
import { rateLimit } from '@/lib/guards'
import { json, readJson, route } from '@/lib/http'
import { service } from '@/lib/schemas'

export const POST = route(async (req: NextRequest) => {
  const user = await requireUser()
  const body = await readJson(req, service)
  await rateLimit(`creator_edit:user:${user.id}`, 60, 3600)
  const id = await rpc<string>('save_service', { p_user_id: user.id, p_service_id: null, p: body })
  return json({ ok: true, id }, 201)
})
