import type { NextRequest } from 'next/server'
import { requireAdmin } from '@/lib/auth'
import { rpc } from '@/lib/db'
import { json, parseId, readJson, route } from '@/lib/http'
import { adminCreator } from '@/lib/schemas'
import { revalidateCreator } from '@/lib/stripe'

type Ctx = { params: Promise<{ id: string }> }

export const POST = route<Ctx>(async (req: NextRequest, ctx) => {
  const admin = await requireAdmin()
  const id = parseId((await ctx.params).id)
  const body = await readJson(req, adminCreator)
  if (body.action === 'clear_review') {
    await rpc('clear_needs_review', { p_admin_id: admin.id, p_creator_id: id })
    return json({ ok: true })
  }
  const slug = await rpc<string>('admin_set_hidden', {
    p_admin_id: admin.id,
    p_creator_id: id,
    p_hidden: body.action === 'hide',
    p_reason: body.action === 'hide' ? (body.reason ?? null) : null,
  })
  revalidateCreator(slug) // cached pages for this profile are cleared at once
  return json({ ok: true })
})
