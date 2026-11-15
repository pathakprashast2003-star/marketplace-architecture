import type { NextRequest } from 'next/server'
import { rateLimit, rateLimitIp } from '@/lib/guards'
import { HttpError, json, readJson, route, hashKey } from '@/lib/http'
import { nextForIntent } from '@/lib/redirects'
import { otpVerify } from '@/lib/schemas'
import { serverClient } from '@/lib/supabase-server'

// Checks the 6-digit code and signs the person in. Limited per address so codes cannot be guessed.
export const POST = route(async (req: NextRequest) => {
  const body = await readJson(req, otpVerify)
  // Limited per address+network (so a stranger cannot lock someone else out) ; Supabase Auth applies its own overall limits.
  const ipHash = await rateLimitIp(req, 'otp_verify', 15, 600)
  await rateLimit(`otp_verify:pair:${hashKey(body.email)}:${ipHash}`, 6, 600)
  const supabase = await serverClient()
  const { data, error } = await supabase.auth.verifyOtp({ email: body.email, token: body.code, type: 'email' })
  if (error || !data.user) throw new HttpError(400, 'invalid_code')
  return json({ ok: true, next: nextForIntent(body.intent) })
})
