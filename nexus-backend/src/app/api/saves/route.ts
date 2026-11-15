import type { NextRequest } from 'next/server'
import { requireUser } from '@/lib/auth'
import { rpc } from '@/lib/db'
import { rateLimit } from '@/lib/guards'
import { json, readJson, route } from '@/lib/http'
import { saveSet } from '@/lib/schemas'

export const POST = route(async (req: NextRequest) => {
  const user = await requireUser()
  const body = await readJson(req, saveSet)
  await rateLimit(`save:user:${user.id}`, 120, 3600)
  await rpc('set_save', { p_user_id: user.id, p_creator_id: body.creator_id, p_on: body.on })
  return json({ ok: true, saved: body.on })
})
