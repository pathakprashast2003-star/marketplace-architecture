import { requireUser } from '@/lib/auth'
import { json, route } from '@/lib/http'
import { serverClient } from '@/lib/supabase-server'

// Everything the dashboard needs about the signed-in person. Read with their own permissions (RLS).
export const GET = route(async () => {
  const user = await requireUser()
  const supabase = await serverClient()
  const [profile, role, creator] = await Promise.all([
    supabase.from('profiles').select('display_name, age_gate').eq('id', user.id).maybeSingle(),
    supabase.from('user_roles').select('role').eq('user_id', user.id).maybeSingle(),
    supabase
      .from('creators')
      .select('id, slug, status, hidden_reason, canceled_reason, display_name, founding_number, approved_at, reject_reason, needs_review, referral_code')
      .eq('user_id', user.id)
      .maybeSingle(),
  ])
  const billing = creator.data
    ? await supabase
        .from('creator_billing')
        .select('trial_days, trial_ends_at, approval_expires_at, stripe_status, cancel_at_period_end, past_due_since')
        .eq('creator_id', creator.data.id)
        .maybeSingle()
    : { data: null }
  return json({
    email_verified: Boolean(user.email_confirmed_at),
    profile: profile.data,
    role: role.data?.role ?? 'client',
    creator: creator.data,
    billing: billing.data,
  })
})
