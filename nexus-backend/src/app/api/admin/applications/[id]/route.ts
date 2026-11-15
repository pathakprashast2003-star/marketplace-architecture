import { after, type NextRequest } from 'next/server'
import { requireAdmin } from '@/lib/auth'
import { rpc } from '@/lib/db'
import { flushSoon } from '@/lib/email'
import { json, parseId, readJson, route } from '@/lib/http'
import { adminApplication } from '@/lib/schemas'

type Ctx = { params: Promise<{ id: string }> }

// Approve or reject. Approval hands out the Founding number (if any are left) inside one
// locked database step and starts the free-trial clock.
export const POST = route<Ctx>(async (req: NextRequest, ctx) => {
  const admin = await requireAdmin()
  const id = parseId((await ctx.params).id)
  const body = await readJson(req, adminApplication)
  if (body.action === 'approve') {
    const out = await rpc<{ founding_number: number | null; trial_days: number }>('approve_application', {
      p_admin_id: admin.id,
      p_creator_id: id,
      p_seen_updated_at: body.seen_updated_at, // refused if the profile changed after the admin opened it
    })
    after(flushSoon)
    return json({ ok: true, ...out })
  }
  await rpc('reject_application', { p_admin_id: admin.id, p_creator_id: id, p_reason: body.reason })
  after(flushSoon)
  return json({ ok: true })
})
