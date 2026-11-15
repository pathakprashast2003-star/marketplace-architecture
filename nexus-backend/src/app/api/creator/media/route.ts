import type { NextRequest } from 'next/server'
import { requireUser } from '@/lib/auth'
import { rpc } from '@/lib/db'
import { rateLimit } from '@/lib/guards'
import { json, readJson, route } from '@/lib/http'
import { mediaAdd } from '@/lib/schemas'

// Registers an uploaded image (already in the creator's own storage folder) or a YouTube/Vimeo/TikTok
// link. New media waits for approval before the public sees it.
export const POST = route(async (req: NextRequest) => {
  const user = await requireUser()
  const body = await readJson(req, mediaAdd)
  await rateLimit(`media:user:${user.id}`, 40, 3600)
  const id = await rpc<string>('add_media', {
    p_user_id: user.id,
    p_kind: body.kind,
    p_storage_path: body.kind === 'image' ? body.storage_path : null,
    p_url: body.kind === 'video_link' ? body.url : null,
  })
  return json({ ok: true, id, status: 'pending' }, 201)
})
