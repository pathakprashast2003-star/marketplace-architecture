import { requireUser } from '@/lib/auth'
import { adminClient, rpc } from '@/lib/db'
import { json, parseId, route } from '@/lib/http'
import { report } from '@/lib/observe'

type Ctx = { params: Promise<{ id: string }> }

export const DELETE = route<Ctx>(async (_req, ctx) => {
  const user = await requireUser()
  const id = parseId((await ctx.params).id)
  const path = await rpc<string | null>('delete_media', { p_user_id: user.id, p_media_id: id })
  if (path) {
    const { error } = await adminClient().storage.from('media').remove([path])
    if (error) report(error, 'media.delete.storage')
  }
  return json({ ok: true })
})
