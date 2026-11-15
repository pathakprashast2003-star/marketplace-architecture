import type { NextRequest } from 'next/server'
import { requireAdmin } from '@/lib/auth'
import { adminClient } from '@/lib/db'
import { json, route } from '@/lib/http'

// The review queue: new applications, plus live profiles whose big edits need a second look.
export const GET = route(async (req: NextRequest) => {
  await requireAdmin()
  const view = new URL(req.url).searchParams.get('view') === 'edits' ? 'edits' : 'applied'
  let q = adminClient()
    .from('creators')
    .select('id, slug, status, updated_at, avatar_path, cover_path, about, display_name, headline, category_slug, city, region, portfolio_url, works_remote, starting_price_cents, applications_count, duplicate_of, needs_review, utm_source, ref_code, created_at')
    .order('created_at', { ascending: true })
    .limit(100)
  q = view === 'edits' ? q.eq('needs_review', true) : q.eq('status', 'applied')
  const { data, error } = await q
  if (error) throw new Error(`queue query failed: ${error.message}`)
  return json({ view, items: data })
})
