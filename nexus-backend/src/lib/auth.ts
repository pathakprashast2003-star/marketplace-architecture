import type { User } from '@supabase/supabase-js'
import { adminClient } from './db'
import { HttpError } from './http'
import { serverClient } from './supabase-server'

/** Who is calling? Checked with the auth server every time (never trusted from the cookie alone). */
export async function requireUser(): Promise<User> {
  const supabase = await serverClient()
  const { data, error } = await supabase.auth.getUser()
  if (error || !data.user) throw new HttpError(401, 'unauthenticated')
  return data.user
}

export async function optionalUser(): Promise<User | null> {
  try {
    return await requireUser()
  } catch {
    return null
  }
}

/**
 * Admin = role in the protected user_roles table AND signed in with a second factor (MFA).
 * The database functions check the role again on their side.
 */
export async function requireAdmin(): Promise<User> {
  const supabase = await serverClient()
  const { data, error } = await supabase.auth.getUser()
  if (error || !data.user) throw new HttpError(401, 'unauthenticated')
  const { data: claims, error: claimsError } = await supabase.auth.getClaims()
  if (claimsError || !claims || claims.claims.sub !== data.user.id) throw new HttpError(401, 'unauthenticated')
  const { data: role, error: roleError } = await adminClient()
    .from('user_roles')
    .select('role')
    .eq('user_id', data.user.id)
    .maybeSingle()
  if (roleError) throw new Error(`role lookup failed: ${roleError.message}`)
  if (role?.role !== 'admin') throw new HttpError(403, 'forbidden')
  if (claims.claims.aal !== 'aal2') throw new HttpError(403, 'mfa_required')
  return data.user
}
