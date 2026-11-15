import type { NextRequest } from 'next/server'
import { adminClient } from '@/lib/db'
import { unsubscribeToken } from '@/lib/email'
import { rateLimitIp } from '@/lib/guards'
import { HttpError, route, safeEqual } from '@/lib/http'

function emailFromToken(t: string | null): string {
  if (!t || t.length > 600) throw new HttpError(400, 'invalid_link')
  const [encoded] = t.split('.')
  let email = ''
  try {
    email = Buffer.from(encoded ?? '', 'base64url').toString('utf8').toLowerCase()
  } catch {
    throw new HttpError(400, 'invalid_link')
  }
  if (!email || !safeEqual(unsubscribeToken(email), t)) throw new HttpError(400, 'invalid_link')
  return email
}

const page = (body: string) =>
  new Response(`<!doctype html><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Nexus email</title><body style="font-family:system-ui;max-width:420px;margin:15vh auto;padding:0 16px;color:#0F172A">${body}</body>`, {
    headers: { 'content-type': 'text/html; charset=utf-8', 'cache-control': 'no-store' },
  })

// The link in the email opens a confirm button (so mail scanners that pre-open links do not unsubscribe people).
export const GET = route(async (req: NextRequest) => {
  const t = new URL(req.url).searchParams.get('t')
  emailFromToken(t)
  return page(`<h1 style="font-size:22px">Stop Nexus update emails?</h1><p>You will still get messages about your own inquiries and billing.</p><form method="post" action="/api/unsubscribe?t=${encodeURIComponent(t ?? '')}"><button style="padding:12px 20px;border:0;border-radius:999px;background:#3B54EE;color:#fff;font-size:16px">Unsubscribe</button></form>`)
})

// Also the target of one-click unsubscribe from mail apps (which post without our Origin).
export const POST = route(
  async (req: NextRequest) => {
    await rateLimitIp(req, 'unsub', 30, 600)
    const email = emailFromToken(new URL(req.url).searchParams.get('t'))
    const { error } = await adminClient().from('email_suppressions').upsert({ email }, { onConflict: 'email' })
    if (error) throw new Error(`unsubscribe failed: ${error.message}`)
    return page(`<h1 style="font-size:22px">Done.</h1><p>You will not get Nexus update emails any more.</p>`)
  },
  { sameOrigin: false },
)
