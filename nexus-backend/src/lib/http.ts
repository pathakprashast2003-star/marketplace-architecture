import { createHmac, timingSafeEqual } from 'node:crypto'
import type { NextRequest } from 'next/server'
import { z } from 'zod'
import { allowedOrigins, env } from './env'
import { report } from './observe'

export class HttpError extends Error {
  constructor(
    public status: number,
    public code: string,
    public headers: Record<string, string> = {},
  ) {
    super(code)
  }
}

export function json(body: unknown, status = 200, headers: Record<string, string> = {}): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'content-type': 'application/json; charset=utf-8', 'cache-control': 'no-store', ...headers },
  })
}

type Handler<C> = (req: NextRequest, ctx: C) => Promise<Response>

/**
 * Wraps every route: blocks cross-site form posts, turns known errors into clean
 * responses, and reports unknown ones without leaking details to the caller.
 */
export function route<C = unknown>(fn: Handler<C>, opts: { sameOrigin?: boolean; cors?: boolean } = {}): Handler<C> {
  return async (req, ctx) => {
    const cors = opts.cors ? corsHeaders(req) : {}
    try {
      if (opts.sameOrigin !== false && !['GET', 'HEAD', 'OPTIONS'].includes(req.method)) assertOrigin(req)
      const res = await fn(req, ctx)
      for (const [k, v] of Object.entries(cors)) res.headers.set(k, v)
      return res
    } catch (e) {
      if (e instanceof HttpError) return json({ error: e.code }, e.status, { ...e.headers, ...cors })
      if (e instanceof z.ZodError) {
        return json({ error: 'invalid_input', fields: [...new Set(e.issues.map((i) => i.path.join('.')))] }, 400, cors)
      }
      report(e, `${req.method} ${new URL(req.url).pathname}`)
      return json({ error: 'server_error' }, 500, cors)
    }
  }
}

/** Cookie-authenticated writes must come from our own pages. */
function assertOrigin(req: NextRequest) {
  const origin = req.headers.get('origin')
  if (!origin) {
    // Browsers always send Origin on cross-site POSTs. No Origin + browser fetch metadata saying cross-site = refuse.
    if (req.headers.get('sec-fetch-site') === 'cross-site') throw new HttpError(403, 'bad_origin')
    return
  }
  if (!allowedOrigins().includes(origin)) throw new HttpError(403, 'bad_origin')
}

function corsHeaders(req: NextRequest): Record<string, string> {
  const origin = req.headers.get('origin')
  if (!origin || !allowedOrigins().includes(origin)) return {}
  return {
    'access-control-allow-origin': origin,
    'access-control-allow-methods': 'GET,POST,PATCH,OPTIONS',
    'access-control-allow-headers': 'content-type',
    'access-control-max-age': '600',
    vary: 'Origin',
  }
}

export const preflight = route(async () => new Response(null, { status: 204 }), { cors: true })

/** Reads a JSON body with a hard size cap, then validates it. */
export async function readJson<T>(req: NextRequest, schema: z.ZodType<T>, maxBytes = 20_000): Promise<T> {
  const declared = Number(req.headers.get('content-length') ?? '0')
  if (declared > maxBytes) throw new HttpError(413, 'too_large')
  const text = await req.text()
  if (Buffer.byteLength(text) > maxBytes) throw new HttpError(413, 'too_large')
  // Null characters cannot be stored in Postgres text; refuse them here.
  if (text.includes('\u0000') || /\\u0000/i.test(text)) throw new HttpError(400, 'invalid_input')
  let data: unknown
  try {
    data = JSON.parse(text)
  } catch {
    throw new HttpError(400, 'invalid_json')
  }
  return schema.parse(data)
}

export function clientIp(req: NextRequest): string {
  // On Vercel the platform sets these and callers cannot forge them. If this ever runs on another
  // host, make sure its proxy overwrites these headers, or IP limits can be dodged.
  const real = req.headers.get('x-vercel-forwarded-for')?.split(',')[0] ?? req.headers.get('x-real-ip')
  const fwd = req.headers.get('x-forwarded-for')?.split(',')[0]
  return (real ?? fwd ?? 'unknown').trim().slice(0, 64)
}

export function hashIp(ip: string): string {
  return createHmac('sha256', env().HASH_SECRET).update(`ip:${ip}`).digest('hex').slice(0, 32)
}

/** For rate-limit keys: never store a raw email address there. */
export function hashKey(value: string): string {
  return createHmac('sha256', env().HASH_SECRET).update(`key:${value}`).digest('hex').slice(0, 32)
}

export function sign(value: string): string {
  return createHmac('sha256', env().HASH_SECRET).update(value).digest('base64url')
}

export function safeEqual(a: string, b: string): boolean {
  const x = Buffer.from(a)
  const y = Buffer.from(b)
  return x.length === y.length && timingSafeEqual(x, y)
}

export const uuid = z.uuid()
export function parseId(id: string): string {
  const r = uuid.safeParse(id)
  if (!r.success) throw new HttpError(404, 'not_found')
  return r.data
}
