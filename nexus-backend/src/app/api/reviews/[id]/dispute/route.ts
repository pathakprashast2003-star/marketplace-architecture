import type { NextRequest } from 'next/server'
import { requireUser } from '@/lib/auth'
import { rpc } from '@/lib/db'
import { json, parseId, readJson, route } from '@/lib/http'
import { disputeCreate } from '@/lib/schemas'

type Ctx = { params: Promise<{ id: string }> }

export const POST = route<Ctx>(async (req: NextRequest, ctx) => {
  const user = await requireUser()
  const id = parseId((await ctx.params).id)
  const body = await readJson(req, disputeCreate)
  await rpc('dispute_review', { p_user_id: user.id, p_review_id: id, p_reason: body.reason })
  return json({ ok: true })
})
