import type { NextRequest } from 'next/server'
import { rateLimit, rateLimitIp, verifyTurnstile } from '@/lib/guards'
import { json, readJson, route, hashKey } from '@/lib/http'
import { report } from '@/lib/observe'
import { otpRequest } from '@/lib/schemas'
import { serverClient } from '@/lib/supabase-server'

// "Email me a sign-in code". Always answers the same way, so nobody can test which emails have accounts.
export const POST = route(async (req: NextRequest) => {
  const body = await readJson(req, otpRequest)
  await rateLimitIp(req, 'otp', 6, 600)
  await verifyTurnstile(body.turnstileToken, req)
  let allowed = true
  try {
    await rateLimit(`otp:email:${hashKey(body.email)}`, 3, 600)
  } catch {
    allowed = false // stay silent: the answer must not reveal anything about this address
  }
  if (allowed) {
    const supabase = await serverClient()
    const { error } = await supabase.auth.signInWithOtp({ email: body.email, options: { shouldCreateUser: true } })
    if (error) report(error, 'auth.otp')
  }
  return json({ ok: true })
})
