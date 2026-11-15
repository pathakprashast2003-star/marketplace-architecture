import type { NextRequest } from 'next/server'
import { syncCustomer } from '@/lib/billing'
import { adminClient, rpc } from '@/lib/db'
import { processOutbox } from '@/lib/email'
import { env } from '@/lib/env'
import { HttpError, json, route, safeEqual } from '@/lib/http'
import { report } from '@/lib/observe'
import { billingDeps, revalidateCreator } from '@/lib/stripe'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'
export const maxDuration = 300

type Ctx = { params: Promise<{ job: string }> }

async function graceDays(): Promise<number> {
  const { data } = await adminClient().from('app_settings').select('value').eq('key', 'grace_days').maybeSingle()
  const n = Number(data?.value)
  return Number.isFinite(n) && n >= 0 ? n : 7
}

const JOBS: Record<string, () => Promise<Record<string, unknown>>> = {
  // every few minutes: send queued email
  outbox: async () => processOutbox(50),

  // hourly: hide profiles whose payment has been failing longer than the grace period.
  // Stripe is re-read for each one first, so a card fixed a minute ago keeps the profile up.
  grace: async () => {
    const cutoff = new Date(Date.now() - (await graceDays()) * 86400_000).toISOString()
    const { data, error } = await adminClient()
      .from('creator_billing')
      .select('creator_id, stripe_customer_id, creators!inner(status, slug)')
      .lte('past_due_since', cutoff)
      .eq('creators.status', 'past_due')
      .limit(200)
    if (error) throw new Error(`grace query failed: ${error.message}`)
    let hidden = 0
    let failed = 0
    for (const row of data ?? []) {
      try {
        if (row.stripe_customer_id) await syncCustomer(billingDeps(), row.stripe_customer_id)
        const didHide = await rpc<boolean>('hide_if_overdue', { p_creator_id: row.creator_id })
        if (didHide) {
          hidden++
          const c = (Array.isArray(row.creators) ? row.creators[0] : row.creators) as { slug: string } | undefined
          if (c?.slug) revalidateCreator(c.slug)
        }
      } catch (e) {
        failed++ // Stripe unreachable: leave the profile up and try again next hour
        report(e, 'cron.grace')
      }
    }
    return { checked: data?.length ?? 0, hidden, failed }
  },

  // nightly: compare every billing account with Stripe, least recently checked first
  reconcile: async () => {
    const { data, error } = await adminClient()
      .from('creator_billing')
      .select('stripe_customer_id')
      .not('stripe_customer_id', 'is', null)
      .order('synced_at', { ascending: true, nullsFirst: true })
      .limit(300)
    if (error) throw new Error(`reconcile query failed: ${error.message}`)
    let changed = 0
    let failed = 0
    for (const row of data ?? []) {
      try {
        const r = await syncCustomer(billingDeps(), row.stripe_customer_id as string)
        if (!r.skipped && r.changed) changed++
      } catch (e) {
        failed++
        report(e, 'cron.reconcile')
      }
    }
    return { checked: data?.length ?? 0, corrected: changed, failed }
  },

  // nightly: lapsed approvals, reminders, ranking, tidy-up
  nightly: async () => ({
    approvals_expired: await rpc('expire_approvals'),
    approval_reminders: await rpc('enqueue_approval_reminders'),
    trial_reminders: await rpc('enqueue_trial_reminders'),
    ranked: await rpc('recompute_ranks'),
    cleanup: await rpc('cleanup_old_rows').then(() => true),
  }),

  // weekly: "you got N inquiries"
  weekly: async () => ({ digests: await rpc('enqueue_weekly_digests') }),
}

// Scheduled jobs. Only callable with the CRON_SECRET (Vercel Cron sends it automatically).
export const GET = route<Ctx>(async (req: NextRequest, ctx) => {
  const auth = req.headers.get('authorization') ?? ''
  if (!safeEqual(auth, `Bearer ${env().CRON_SECRET}`)) throw new HttpError(401, 'unauthenticated')
  const job = JOBS[(await ctx.params).job]
  if (!job) throw new HttpError(404, 'not_found')
  return json({ ok: true, ...(await job()) })
})
