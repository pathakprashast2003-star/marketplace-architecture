import type { NextRequest } from 'next/server'
import { env } from '@/lib/env'
import { rateLimitIp } from '@/lib/guards'
import { HttpError, route } from '@/lib/http'
import { nextForIntent } from '@/lib/redirects'
import { serverClient } from '@/lib/supabase-server'

// Starts Google sign-in. The return address is fixed here; it never comes from the visitor.
export const GET = route(async (req: NextRequest) => {
  await rateLimitIp(req, 'oauth', 20, 600)
  const intent = new URL(req.url).searchParams.get('intent')
  const next = nextForIntent(intent)
  const supabase = await serverClient()
  const { data, error } = await supabase.auth.signInWithOAuth({
    provider: 'google',
    options: { redirectTo: `${env().APP_URL.replace(/\/$/, '')}/auth/callback?next=${encodeURIComponent(next)}` },
  })
  if (error || !data.url) throw new HttpError(502, 'sign_in_unavailable')
  return Response.redirect(data.url, 302)
})
