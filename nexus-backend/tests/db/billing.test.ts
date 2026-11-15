import { randomUUID } from 'node:crypto'
import { afterAll, beforeAll, describe, expect, it } from 'vitest'
import { apply, beginSync, type Db, freshDb, hasPg, liveCreator, makeAdmin, makeUser, syncState } from './helpers'

describe.skipIf(!hasPg)('billing: Stripe state becomes one creator status', () => {
  let db: Db
  let admin: string
  beforeAll(async () => {
    db = await freshDb()
    admin = await makeAdmin(db)
  })
  afterAll(() => db.close())

  const status = async (id: string) =>
    (await db.root.query('select status, hidden_reason, canceled_reason from public.creators where id = $1', [id])).rows[0]
  const sync = (id: string, s: string | null, _order?: string) => syncState(db, id, s)

  it('walks the whole life: trial, paid, failed card, grace, hidden, paid again, canceled', async () => {
    const { creatorId } = await liveCreator(db, admin)
    expect((await status(creatorId)).status).toBe('trialing')
    await sync(creatorId, 'active', `now() + interval '1 second'`)
    expect((await status(creatorId)).status).toBe('active')
    await sync(creatorId, 'past_due', `now() + interval '2 seconds'`)
    expect((await status(creatorId)).status).toBe('past_due')

    // inside the grace period: still visible, the hide job does nothing
    expect((await db.svc.query('select public.hide_if_overdue($1) as h', [creatorId])).rows[0].h).toBe(false)
    expect((await db.root.query('select public.is_creator_visible($1) as v', [creatorId])).rows[0].v).toBe(true)

    // day 8: hidden
    await db.root.query(`update public.creator_billing set past_due_since = now() - interval '8 days' where creator_id = $1`, [creatorId])
    expect((await db.svc.query('select public.hide_if_overdue($1) as h', [creatorId])).rows[0].h).toBe(true)
    expect(await status(creatorId)).toMatchObject({ status: 'hidden', hidden_reason: 'payment' })
    // still unpaid: stays hidden
    await sync(creatorId, 'past_due', `now() + interval '3 seconds'`)
    expect((await status(creatorId)).status).toBe('hidden')
    // pays: back at once
    await sync(creatorId, 'active', `now() + interval '4 seconds'`)
    expect(await status(creatorId)).toMatchObject({ status: 'active', hidden_reason: null })
    expect((await db.root.query('select past_due_since from public.creator_billing where creator_id = $1', [creatorId])).rows[0].past_due_since).toBeNull()

    await sync(creatorId, 'canceled', `now() + interval '5 seconds'`)
    expect(await status(creatorId)).toMatchObject({ status: 'canceled', canceled_reason: 'subscription_ended' })
    // rejoin
    await sync(creatorId, 'active', `now() + interval '6 seconds'`)
    expect((await status(creatorId)).status).toBe('active')
  })

  it('card fixed on day 6 (or at the last minute): the hide job leaves the profile up', async () => {
    const { creatorId } = await liveCreator(db, admin)
    await sync(creatorId, 'past_due', `now() + interval '1 second'`)
    await db.root.query(`update public.creator_billing set past_due_since = now() - interval '8 days' where creator_id = $1`, [creatorId])
    await sync(creatorId, 'active', `now() + interval '2 seconds'`) // the job re-read Stripe first
    expect((await db.svc.query('select public.hide_if_overdue($1) as h', [creatorId])).rows[0].h).toBe(false)
    expect((await status(creatorId)).status).toBe('active')
  })

  it('an older read of Stripe can never overwrite a newer one (out-of-order webhooks)', async () => {
    const { creatorId } = await liveCreator(db, admin)
    const older = await beginSync(db, creatorId) // started first, but slow
    const newer = await beginSync(db, creatorId) // started later: saw everything the first saw
    const lost = await syncState(db, creatorId, 'past_due', undefined, older)
    expect(lost.stale).toBe(true) // a newer read is in flight: the older one may not write
    await syncState(db, creatorId, 'active', undefined, newer)
    expect((await status(creatorId)).status).toBe('active')
    const late = await syncState(db, creatorId, 'canceled', undefined, older)
    expect(late.stale).toBe(true)
    expect((await status(creatorId)).status).toBe('active')
    // 20 syncs racing: whichever took the last number decides, the rest are dropped
    const gens = await Promise.all(Array.from({ length: 20 }, () => beginSync(db, creatorId)))
    const last = Math.max(...gens)
    await Promise.all(gens.map((g) => syncState(db, creatorId, g === last ? 'past_due' : 'canceled', undefined, g)))
    expect((await status(creatorId)).status).toBe('past_due')
  })

  it('billing can never make an unapproved or rejected creator visible', async () => {
    const applied = await apply(db, await makeUser(db))
    expect((await sync(applied, 'active')).orphan).toBe(true) // the server cancels this subscription at Stripe
    expect((await status(applied)).status).toBe('applied')
    const rej = await apply(db, await makeUser(db))
    await db.svc.query(`select public.reject_application($1, $2, 'Not enough work shown')`, [admin, rej])
    await sync(rej, 'trialing')
    expect((await status(rej)).status).toBe('rejected')
  })

  it('an admin hide is not undone by a payment; unhide restores the paid state', async () => {
    const { creatorId } = await liveCreator(db, admin)
    await db.svc.query('select public.admin_set_hidden($1, $2, true, $3)', [admin, creatorId, 'reported'])
    await sync(creatorId, 'active', `now() + interval '1 second'`)
    expect(await status(creatorId)).toMatchObject({ status: 'hidden', hidden_reason: 'admin' })
    await db.svc.query('select public.admin_set_hidden($1, $2, false, null)', [admin, creatorId])
    expect((await status(creatorId)).status).toBe('active')
  })

  it('subscription gone at Stripe: a live creator is canceled, an approved one keeps waiting', async () => {
    const { creatorId } = await liveCreator(db, admin)
    await sync(creatorId, null, `now() + interval '1 second'`)
    expect((await status(creatorId)).status).toBe('canceled')
    const waiting = await apply(db, await makeUser(db))
    await db.svc.query('select public.approve_application($1, $2, (select updated_at from public.creators where id = $2))', [admin, waiting])
    await sync(waiting, null)
    expect((await status(waiting)).status).toBe('approved')
  })

  it('the same card on a second account is flagged, even when both arrive together', async () => {
    const a = await liveCreator(db, admin)
    const b = await liveCreator(db, admin)
    const fp = `fp_${randomUUID()}`
    const out = await Promise.all([a, b].map((x) => db.svc.query('select public.register_card_fingerprint($1, $2) as dup', [x.creatorId, fp])))
    expect(out.map((o) => o.rows[0].dup).sort()).toEqual([false, true])
    // deleting the first account does not hand the card a fresh trial on a new account
    const first = out[0]!.rows[0].dup === false ? a : b
    await db.root.query('delete from auth.users where id = $1', [first.userId])
    const c = await liveCreator(db, admin)
    expect((await db.svc.query('select public.register_card_fingerprint($1, $2) as dup', [c.creatorId, fp])).rows[0].dup).toBe(true)
  })

  it('a Stripe event is recorded once however many times it is delivered', async () => {
    const id = `evt_${randomUUID()}`
    const out = await Promise.all(Array.from({ length: 12 }, () => db.svc.query(`select public.claim_stripe_event($1, 'customer.subscription.updated', now()) as s`, [id])))
    const states = out.map((o) => o.rows[0].s)
    expect(states.filter((s) => s === 'new').length).toBe(1)
    expect(states.filter((s) => s === 'retry').length).toBe(11)
    await db.svc.query('select public.finish_stripe_event($1, $2)', [id, 'stripe timeout'])
    expect((await db.svc.query(`select public.claim_stripe_event($1, 'x', now()) as s`, [id])).rows[0].s).toBe('retry')
    await db.svc.query('select public.finish_stripe_event($1, null)', [id])
    expect((await db.svc.query(`select public.claim_stripe_event($1, 'x', now()) as s`, [id])).rows[0].s).toBe('done')
  })

  it('the customer id is set once and a second writer gets the first value back', async () => {
    const { creatorId } = await liveCreator(db, admin)
    const out = await Promise.all(['cus_A', 'cus_B'].map((c) => db.svc.query('select public.set_stripe_customer($1, $2) as c', [creatorId, c + creatorId])))
    expect(new Set(out.map((o) => o.rows[0].c)).size).toBe(1)
  })

  it('trial-ending emails go out once each at 14, 7 and 3 days', async () => {
    const { creatorId } = await liveCreator(db, admin)
    const count = async () => (await db.root.query(`select count(*)::int as n from public.email_outbox where template = 'trial_ending' and dedupe_key like $1`, [`%${creatorId}%`])).rows[0].n
    for (const [days, expected] of [[20, 0], [13, 1], [13, 1], [6, 2], [2, 3], [2, 3]] as const) {
      await db.root.query(`update public.creator_billing set trial_ends_at = now() + make_interval(days => $2) where creator_id = $1`, [creatorId, days])
      await db.svc.query('select public.enqueue_trial_reminders()')
      expect(await count(), `at ${days} days left`).toBe(expected)
    }
  })
})

describe.skipIf(!hasPg)('billing: first checkout that never completes', () => {
  let db: Db
  beforeAll(async () => {
    db = await freshDb()
  })
  afterAll(() => db.close())

  it('an approved creator keeps their approval if the first checkout expires unpaid', async () => {
    const admin = await makeAdmin(db)
    const id = await apply(db, await makeUser(db))
    await db.svc.query('select public.approve_application($1, $2, (select updated_at from public.creators where id = $2))', [admin, id])
    for (const s of ['incomplete', 'incomplete_expired', 'canceled']) {
      await syncState(db, id, s, 'sub_first')
      expect((await db.root.query('select status from public.creators where id = $1', [id])).rows[0].status).toBe('approved')
    }
  })
})
