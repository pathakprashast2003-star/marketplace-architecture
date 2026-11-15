import { requireUser } from '@/lib/auth'
import { adminClient, rpc } from '@/lib/db'
import { rateLimit } from '@/lib/guards'
import { HttpError, json, route } from '@/lib/http'
import { report } from '@/lib/observe'
import { stripe } from '@/lib/stripe'
import { serverClient } from '@/lib/supabase-server'

// Deletes the account for good: subscriptions cancelled, uploaded files removed, every database
// row deleted, then the Stripe customer record. If Stripe cannot be reached nothing is deleted.
export const DELETE = route(async () => {
  const user = await requireUser()
  await rateLimit(`delete:user:${user.id}`, 5, 3600)
  const db = adminClient()
  const { data: creator, error } = await db
    .from('creators')
    .select('id, creator_billing(stripe_customer_id)')
    .eq('user_id', user.id)
    .maybeSingle()
  if (error) throw new Error(`creator lookup failed: ${error.message}`)
  const billing = (Array.isArray(creator?.creator_billing) ? creator?.creator_billing[0] : creator?.creator_billing) as { stripe_customer_id: string | null } | null | undefined

  // 1. Stop billing. Subscriptions are cancelled but the customer is kept for now, so if a later
  //    step fails the account still works and the person can simply try again.
  const customerId = billing?.stripe_customer_id ?? null
  if (customerId) {
    try {
      const subs = await stripe().subscriptions.list({ customer: customerId, status: 'all', limit: 20 })
      for (const sub of subs.data) {
        if (!['canceled', 'incomplete_expired'].includes(sub.status)) await stripe().subscriptions.cancel(sub.id)
      }
    } catch (e) {
      if ((e as { code?: string }).code !== 'resource_missing') {
        report(e, 'account.delete.stripe')
        throw new HttpError(502, 'billing_unavailable', { 'retry-after': '30' })
      }
    }
  }

  if (creator) {
    const bucket = db.storage.from('media')
    for (let i = 0; i < 20; i++) {
      const { data: files, error: listError } = await bucket.list(creator.id, { limit: 100 })
      if (listError) throw new Error(`storage list failed: ${listError.message}`)
      if (!files || files.length === 0) break
      const { error: removeError } = await bucket.remove(files.map((f) => `${creator.id}/${f.name}`))
      if (removeError) throw new Error(`storage remove failed: ${removeError.message}`)
    }
  }

  await rpc('purge_user_data', { p_user_id: user.id })
  const { error: deleteError } = await db.auth.admin.deleteUser(user.id)
  if (deleteError) throw new Error(`user delete failed: ${deleteError.message}`)
  // Last: remove the Stripe customer record. The account is already gone, so a failure here is
  // only reported (the customer has no subscription left and can be removed by hand).
  if (customerId) {
    await stripe().customers.del(customerId).catch((e) => {
      if ((e as { code?: string }).code !== 'resource_missing') report(e, 'account.delete.stripe_customer')
    })
  }
  const supabase = await serverClient()
  await supabase.auth.signOut().catch(() => {})
  return json({ ok: true })
})
