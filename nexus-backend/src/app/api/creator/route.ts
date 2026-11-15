import type { NextRequest } from 'next/server'
import { requireUser } from '@/lib/auth'
import { rpc } from '@/lib/db'
import { rateLimit } from '@/lib/guards'
import { json, readJson, route } from '@/lib/http'
import { creatorPatch } from '@/lib/schemas'

// A creator edits their own profile. Only the listed fields can change; status, Founding number
// and billing can never be set from here. Big edits on a live profile go back to the review queue.
export const PATCH = route(async (req: NextRequest) => {
  const user = await requireUser()
  const body = await readJson(req, creatorPatch)
  await rateLimit(`creator_edit:user:${user.id}`, 60, 3600)
  await rpc('update_creator_profile', { p_user_id: user.id, p_patch: body })
  return json({ ok: true })
})
