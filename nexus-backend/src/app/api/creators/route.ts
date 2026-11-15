import type { NextRequest } from 'next/server'
import { rpc } from '@/lib/db'
import { json, route } from '@/lib/http'
import { searchQuery } from '@/lib/schemas'

const PAGE = 24

// Public search. Only live creators with a complete-enough profile, ordered by the nightly ranking.
export const GET = route(async (req: NextRequest) => {
  const q = searchQuery.parse(Object.fromEntries(new URL(req.url).searchParams))
  const rows = await rpc<Array<Record<string, unknown> & { total: number }>>('search_creators', {
    p_q: q.q ?? null,
    p_category: q.category ?? null,
    p_city: q.city ?? null,
    p_remote: q.remote === undefined ? null : q.remote === 'true',
    p_min_price: q.min_price ?? null,
    p_max_price: q.max_price ?? null,
    p_limit: PAGE,
    p_offset: (q.page - 1) * PAGE,
  })
  const total = Number(rows?.[0]?.total ?? 0)
  return json(
    { results: (rows ?? []).map(({ total: _t, ...r }) => r), total, page: q.page, page_size: PAGE },
    200,
    { 'cache-control': 'public, s-maxage=60, stale-while-revalidate=300' },
  )
})
