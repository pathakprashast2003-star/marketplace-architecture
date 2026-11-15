import type { NextRequest } from 'next/server'
import { requireAdmin } from '@/lib/auth'
import { adminClient, rpc } from '@/lib/db'
import { json, readJson, route } from '@/lib/http'
import { adminModeration } from '@/lib/schemas'

// What is waiting for a person: new media, new and disputed reviews, open reports, unverified claims.
export const GET = route(async () => {
  await requireAdmin()
  const db = adminClient()
  const [media, reviews, reports, claims] = await Promise.all([
    db.from('media').select('id, creator_id, kind, storage_path, url, provider, created_at').eq('status', 'pending').order('created_at').limit(100),
    db.from('reviews').select('id, creator_id, rating, body, status, suspect, dispute_reason, dispute_open, created_at').or('status.eq.pending,dispute_open.eq.true').order('created_at').limit(100),
    db.from('reports').select('id, target_type, target_id, reason, created_at').eq('status', 'open').order('created_at').limit(100),
    db.from('creator_claims').select('id, creator_id, claim, created_at').eq('verified', false).order('created_at').limit(100),
  ])
  for (const r of [media, reviews, reports, claims]) if (r.error) throw new Error(`moderation query failed: ${r.error.message}`)
  return json({ media: media.data, reviews: reviews.data, reports: reports.data, claims: claims.data })
})

export const POST = route(async (req: NextRequest) => {
  const admin = await requireAdmin()
  const body = await readJson(req, adminModeration)
  if (body.type === 'media') {
    const path = await rpc<string | null>('moderate_media', { p_admin_id: admin.id, p_media_id: body.id, p_status: body.status })
    if (path) {
      // a removed image is deleted from storage too, not just un-listed
      const { error } = await adminClient().storage.from('media').remove([path])
      if (error) throw new Error(`storage remove failed: ${error.message}`)
    }
  }
  if (body.type === 'review') await rpc('moderate_review', { p_admin_id: admin.id, p_review_id: body.id, p_status: body.status })
  if (body.type === 'report') await rpc('handle_report', { p_admin_id: admin.id, p_report_id: body.id, p_status: body.status })
  if (body.type === 'claim') await rpc('verify_claim', { p_admin_id: admin.id, p_claim_id: body.id, p_verified: body.verified })
  return json({ ok: true })
})
