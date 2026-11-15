import type { NextRequest } from 'next/server'
import { requireUser } from '@/lib/auth'
import { rpc } from '@/lib/db'
import { rateLimit } from '@/lib/guards'
import { json, parseId, readJson, route } from '@/lib/http'
import { service } from '@/lib/schemas'

type Ctx = { params: Promise<{ id: string }> }

export const PUT = route<Ctx>(async (req: NextRequest, ctx) => {
  const user = await requireUser()
  const id = parseId((await ctx.params).id)
  const body = await readJson(req, service)
  await rateLimit(`creator_edit:user:${user.id}`, 60, 3600)
  await rpc('save_service', { p_user_id: user.id, p_service_id: id, p: body })
  return json({ ok: true })
})

export const DELETE = route<Ctx>(async (_req, ctx) => {
  const user = await requireUser()
  const id = parseId((await ctx.params).id)
  await rpc('delete_service', { p_user_id: user.id, p_service_id: id })
  return json({ ok: true })
})
