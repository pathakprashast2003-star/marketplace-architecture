import { rpc } from '@/lib/db'
import { json, preflight, route } from '@/lib/http'

export const OPTIONS = preflight

// The real number of Founding spots still open. Never a made-up figure.
export const GET = route(
  async () => {
    const open = await rpc<number>('founding_spots_open')
    return json({ open, total: 100 }, 200, { 'cache-control': 'public, s-maxage=60, stale-while-revalidate=300' })
  },
  { cors: true },
)
