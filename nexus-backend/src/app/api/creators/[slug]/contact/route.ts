import { requireUser } from '@/lib/auth'
import { adminClient, rpc } from '@/lib/db'
import { HttpError, json, route } from '@/lib/http'

type Ctx = { params: Promise<{ slug: string }> }

// A creator's own email/phone: signed-in, verified adults only, and limited per day.
export const GET = route<Ctx>(async (_req, ctx) => {
  const user = await requireUser()
  const slug = (await ctx.params).slug
  if (!/^[a-z0-9-]{3,80}$/.test(slug)) throw new HttpError(404, 'not_found')
  const { data, error } = await adminClient().from('creators').select('id').eq('slug', slug).maybeSingle()
  if (error) throw new Error(`creator lookup failed: ${error.message}`)
  if (!data) throw new HttpError(404, 'not_found')
  const contact = await rpc('get_creator_contact', { p_user_id: user.id, p_creator_id: data.id })
  return json(contact)
})
