import { rpc } from '@/lib/db'
import { json, route } from '@/lib/http'

type Ctx = { params: Promise<{ slug: string }> }

// Public profile. A hidden or ended profile answers "unavailable" (410), not "not found",
// so saved and shared links explain themselves.
export const GET = route<Ctx>(async (_req, ctx) => {
  const slug = (await ctx.params).slug
  if (!/^[a-z0-9-]{3,80}$/.test(slug)) return json({ state: 'not_found' }, 404)
  const page = await rpc<{ state: string }>('creator_public', { p_slug: slug })
  if (page.state === 'visible') return json(page, 200, { 'cache-control': 'public, s-maxage=30, stale-while-revalidate=120' })
  return json(page, page.state === 'unavailable' ? 410 : 404)
})
