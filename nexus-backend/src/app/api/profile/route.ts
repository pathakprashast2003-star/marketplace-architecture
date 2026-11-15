import type { NextRequest } from 'next/server'
import { requireUser } from '@/lib/auth'
import { rpc } from '@/lib/db'
import { HttpError, json, readJson, route } from '@/lib/http'
import { profileComplete } from '@/lib/schemas'

// Name and date of birth, asked once after sign-up. Under-13s are blocked and cannot retry.
export const POST = route(async (req: NextRequest) => {
  const user = await requireUser()
  const body = await readJson(req, profileComplete)
  const result = await rpc<string>('complete_profile', {
    p_user_id: user.id,
    p_display_name: body.display_name,
    p_dob: body.date_of_birth,
  })
  if (result === 'blocked') throw new HttpError(403, 'age_restricted')
  return json({ ok: true })
})
