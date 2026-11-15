import type { NextRequest } from 'next/server'
import { rpc } from './db'
import { env } from './env'
import { clientIp, hashIp, HttpError } from './http'

/** Server-side rate limit backed by the database (atomic). Fails closed if the database is down. */
export async function rateLimit(key: string, max: number, windowSeconds: number): Promise<void> {
  const ok = await rpc<boolean>('check_rate_limit', { p_key: key, p_max: max, p_window_seconds: windowSeconds })
  if (!ok) throw new HttpError(429, 'rate_limited', { 'retry-after': String(Math.min(windowSeconds, 3600)) })
}

export async function rateLimitIp(req: NextRequest, name: string, max: number, windowSeconds: number): Promise<string> {
  const ipHash = hashIp(clientIp(req))
  await rateLimit(`${name}:ip:${ipHash}`, max, windowSeconds)
  return ipHash
}

/** Cloudflare Turnstile bot check. If Cloudflare cannot be reached we refuse (fail closed). */
export async function verifyTurnstile(token: string | undefined, req: NextRequest): Promise<void> {
  const secret = env().TURNSTILE_SECRET_KEY
  if (!secret) {
    if (process.env.NODE_ENV === 'production') throw new Error('TURNSTILE_SECRET_KEY missing')
    return // local development only
  }
  if (!token || token.length > 2048) throw new HttpError(400, 'bot_check_failed')
  let ok = false
  try {
    const res = await fetch('https://challenges.cloudflare.com/turnstile/v0/siteverify', {
      method: 'POST',
      body: new URLSearchParams({ secret, response: token, remoteip: clientIp(req) }),
      signal: AbortSignal.timeout(5000),
    })
    const data = (await res.json()) as { success?: boolean }
    ok = data.success === true
  } catch {
    throw new HttpError(503, 'bot_check_unavailable', { 'retry-after': '10' })
  }
  if (!ok) throw new HttpError(400, 'bot_check_failed')
}
