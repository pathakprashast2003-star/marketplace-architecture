import { requireUser } from '@/lib/auth'
import { rpc } from '@/lib/db'
import { json, parseId, route } from '@/lib/http'

type Ctx = { params: Promise<{ id: string }> }

// A creator blocks the sender of an inquiry. That person can no longer write to them.
export const POST = route<Ctx>(async (_req, ctx) => {
  const user = await requireUser()
  const inquiryId = parseId((await ctx.params).id)
  await rpc('block_sender', { p_user_id: user.id, p_inquiry_id: inquiryId })
  return json({ ok: true })
})
