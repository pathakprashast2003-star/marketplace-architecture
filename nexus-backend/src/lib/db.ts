import { createClient, type SupabaseClient } from '@supabase/supabase-js'
import { env } from './env'
import { HttpError } from './http'

let admin: SupabaseClient | null = null

/** The server's own database client (service role). Never import this into browser code. */
export function adminClient(): SupabaseClient {
  if (!admin) {
    admin = createClient(env().NEXT_PUBLIC_SUPABASE_URL, env().SUPABASE_SERVICE_ROLE_KEY, {
      auth: { persistSession: false, autoRefreshToken: false },
      global: { fetch: (input, init) => fetch(input, { ...init, signal: init?.signal ?? AbortSignal.timeout(10_000) }) },
    })
  }
  return admin
}

const STATUS: Record<string, number> = {
  unauthenticated: 401,
  forbidden: 403,
  email_not_verified: 403,
  age_gate_required: 403,
  age_restricted: 403,
  not_a_creator: 403,
  not_found: 404,
  already_applied: 409,
  already_reviewed: 409,
  invalid_state: 409,
  changed_since_viewed: 409,
  too_many_applications: 409,
  limit_reached: 409,
  too_early: 409,
  not_eligible: 409,
  rate_limited: 429,
}

type PgError = { code?: string; message?: string }

/** Turns a database error into a clean HTTP error. Unknown errors stay 500 and get reported. */
export function toHttpError(error: PgError): Error {
  const msg = error.message ?? ''
  if (error.code === 'P0001') {
    if (msg.startsWith('invalid:')) return new HttpError(400, 'invalid_input')
    if (STATUS[msg]) return new HttpError(STATUS[msg], msg)
  }
  // constraint, bad cast, value too long, bad date...
  if (['23514', '22P02', '22001', '22007', '22008', '23502', '22003', '22021', '22P05'].includes(error.code ?? '')) {
    return new HttpError(400, 'invalid_input')
  }
  if (error.code === '23505') return new HttpError(409, 'conflict')
  if (error.code === '23503') return new HttpError(404, 'not_found')
  return new Error(`db_error ${error.code ?? ''}: ${msg}`)
}

/** Calls a database function as the server. */
export async function rpc<T = unknown>(fn: string, args: Record<string, unknown> = {}): Promise<T> {
  const { data, error } = await adminClient().rpc(fn, args)
  if (error) throw toHttpError(error)
  return data as T
}
