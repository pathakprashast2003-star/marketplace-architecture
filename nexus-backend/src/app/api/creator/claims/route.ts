import type { NextRequest } from 'next/server'
import { requireUser } from '@/lib/auth'
import { rpc } from '@/lib/db'
import { json, readJson, route } from '@/lib/http'
import { claimAdd } from '@/lib/schemas'

// A claim such as "FAA Part 107 certified". Shown as "self-reported" until an admin verifies it.
export const POST = route(async (req: NextRequest) => {
  const user = await requireUser()
  const body = await readJson(req, claimAdd)
  const id = await rpc<string>('add_claim', { p_user_id: user.id, p_claim: body.claim })
  return json({ ok: true, id, verified: false }, 201)
})
