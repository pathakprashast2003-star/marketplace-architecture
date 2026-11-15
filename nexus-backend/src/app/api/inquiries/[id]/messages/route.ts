import { after, type NextRequest } from 'next/server'
import { requireUser } from '@/lib/auth'
import { rpc } from '@/lib/db'
import { flushSoon } from '@/lib/email'
import { json, parseId, readJson, route } from '@/lib/http'
import { messageCreate } from '@/lib/schemas'

type Ctx = { params: Promise<{ id: string }> }

export const POST = route<Ctx>(async (req: NextRequest, ctx) => {
  const user = await requireUser()
  const inquiryId = parseId((await ctx.params).id)
  const body = await readJson(req, messageCreate)
  const id = await rpc<string>('post_message', { p_user_id: user.id, p_inquiry_id: inquiryId, p_body: body.body })
  after(flushSoon)
  return json({ ok: true, id }, 201)
})
