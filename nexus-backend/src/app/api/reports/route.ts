import type { NextRequest } from 'next/server'
import { requireUser } from '@/lib/auth'
import { rpc } from '@/lib/db'
import { json, readJson, route } from '@/lib/http'
import { reportCreate } from '@/lib/schemas'

export const POST = route(async (req: NextRequest) => {
  const user = await requireUser()
  const body = await readJson(req, reportCreate)
  const id = await rpc<string>('submit_report', {
    p_user_id: user.id,
    p_target_type: body.target_type,
    p_target_id: body.target_id,
    p_reason: body.reason,
  })
  return json({ ok: true, id }, 201)
})
