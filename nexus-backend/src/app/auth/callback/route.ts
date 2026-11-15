import type { NextRequest } from 'next/server'
import { env } from '@/lib/env'
import { safeNext } from '@/lib/redirects'
import { serverClient } from '@/lib/supabase-server'

// Google sends people back here. The one-time code is exchanged for a session (PKCE).
export async function GET(req: NextRequest) {
  const url = new URL(req.url)
  const base = env().APP_URL.replace(/\/$/, '')
  const code = url.searchParams.get('code')
  const next = safeNext(url.searchParams.get('next')) // exact allow-list, never an outside address
  if (!code || code.length > 512) return Response.redirect(`${base}/login?error=sign_in_failed`, 302)
  const supabase = await serverClient()
  const { error } = await supabase.auth.exchangeCodeForSession(code)
  if (error) return Response.redirect(`${base}/login?error=sign_in_failed`, 302)
  return Response.redirect(`${base}${next}`, 302)
}
