import './setup-env'
import { randomUUID } from 'node:crypto'
import Stripe from 'stripe'
import { afterAll, beforeAll, describe, expect, it } from 'vitest'
import { type BillingDb, type BillingDeps, handleStripeWebhook, pickCurrentSubscription, type SubLike, syncCustomer, trialEndFor } from '@/lib/billing'
import { apply, type Db, freshDb, hasPg, makeAdmin, makeUser } from '../db/helpers'

const SECRET = 'whsec_test'
const signer = new Stripe('sk_test_x')

/** A signed webhook body exactly as Stripe would send it. */
function signed(event: object, secret = SECRET) {
  const payload = JSON.stringify(event)
  return { payload, header: signer.webhooks.generateTestHeaderString({ payload, secret }) }
}

/** A pretend Stripe whose subscriptions we control. Signature checking is the real Stripe code. */
function fakeStripe() {
  const state = {
    subs: new Map<string, SubLike[]>(),
    down: false,
    fingerprints: new Map<string, string>(),
    trialEnded: [] as string[],
    cancelled: [] as string[],
    updateDown: false,
    listCalls: 0,
  }
  const api = {
    webhooks: { constructEvent: (b: string, s: string, sec: string) => signer.webhooks.constructEvent(b, s, sec) as never },
    subscriptions: {
      list: async ({ customer }: { customer: string }) => {
        state.listCalls++
        if (state.down) throw new Error('stripe timeout')
        return { data: state.subs.get(customer) ?? [] }
      },
      cancel: async (id: string) => {
        state.cancelled.push(id)
        for (const list of state.subs.values()) for (const s of list) if (s.id === id) s.status = 'canceled'
      },
      update: async (id: string) => {
        if (state.updateDown) throw new Error('stripe 500')
        state.trialEnded.push(id)
        for (const list of state.subs.values()) for (const s of list) if (s.id === id) s.status = 'active'
        return { id, status: 'active', created: 0 }
      },
    },
    customers: { retrieve: async () => ({ invoice_settings: { default_payment_method: null } }) },
    paymentMethods: { retrieve: async (id: string) => ({ card: { fingerprint: state.fingerprints.get(id) ?? null } }) },
  }
  return { state, api }
}

/** The same database calls the server makes, pointed at the test database. */
function pgBillingDb(db: Db): BillingDb {
  return {
    claimEvent: async (id, type, created) => (await db.svc.query('select public.claim_stripe_event($1, $2, $3) as s', [id, type, created])).rows[0].s,
    finishEvent: async (id, error) => void (await db.svc.query('select public.finish_stripe_event($1, $2)', [id, error])),
    creatorByCustomer: async (customer) => {
      const { rows } = await db.svc.query('select creator_id, card_fingerprint, trial_abuse from public.creator_billing where stripe_customer_id = $1', [customer])
      return rows[0] ? { creatorId: rows[0].creator_id, hasFingerprint: Boolean(rows[0].card_fingerprint), trialAbuse: Boolean(rows[0].trial_abuse) } : null
    },
    beginSync: async (creatorId) => Number((await db.svc.query('select public.begin_billing_sync($1) as g', [creatorId])).rows[0].g),
    registerFingerprint: async (creatorId, fp) => (await db.svc.query('select public.register_card_fingerprint($1, $2) as d', [creatorId, fp])).rows[0].d,
    applyState: async (a) => (await db.svc.query('select public.apply_billing_state($1, $2, $3, $4, $5) as r', [a.creatorId, a.subscriptionId, a.status, a.cancelAtPeriodEnd, a.gen])).rows[0].r,
  }
}

describe('billing helpers', () => {
  it('picks the subscription that counts when old canceled ones exist', () => {
    const subs: SubLike[] = [
      { id: 'old', status: 'canceled', created: 300 },
      { id: 'live', status: 'active', created: 100 },
      { id: 'dead', status: 'incomplete_expired', created: 400 },
    ]
    expect(pickCurrentSubscription(subs)?.id).toBe('live')
    expect(pickCurrentSubscription([{ id: 'a', status: 'canceled', created: 1 }, { id: 'b', status: 'canceled', created: 2 }])?.id).toBe('b')
    expect(pickCurrentSubscription([])).toBeNull()
    expect(pickCurrentSubscription([{ id: 'x', status: 'brand_new_status', created: 9 }, { id: 'y', status: 'past_due', created: 1 }])?.id).toBe('y')
  })

  it('gives a trial end only when at least two days of the free period remain', () => {
    const now = new Date('2027-01-01T00:00:00Z')
    expect(trialEndFor('2027-03-01T00:00:00Z', now)).toBe(Math.floor(Date.parse('2027-03-01T00:00:00Z') / 1000))
    expect(trialEndFor('2027-01-02T00:00:00Z', now)).toBeUndefined() // under 48h: Stripe would refuse
    expect(trialEndFor('2026-12-01T00:00:00Z', now)).toBeUndefined() // already over: no free days
    expect(trialEndFor(null, now)).toBeUndefined()
    expect(trialEndFor('garbage', now)).toBeUndefined()
  })
})

describe.skipIf(!hasPg)('Stripe webhooks end to end (real signature check, real database, pretend Stripe)', () => {
  let db: Db
  let admin: string
  beforeAll(async () => {
    db = await freshDb()
    admin = await makeAdmin(db)
  })
  afterAll(() => db.close())

  async function approvedCreator() {
    const creatorId = await apply(db, await makeUser(db))
    await db.svc.query('select public.approve_application($1, $2, (select updated_at from public.creators where id = $2))', [admin, creatorId])
    const customer = `cus_${randomUUID().slice(0, 10)}`
    await db.svc.query('select public.set_stripe_customer($1, $2)', [creatorId, customer])
    return { creatorId, customer }
  }
  const statusOf = async (id: string) => (await db.root.query('select status from public.creators where id = $1', [id])).rows[0].status
  function deps(fake: ReturnType<typeof fakeStripe>, revalidated: string[] = []): BillingDeps {
    return { stripe: fake.api as never, db: pgBillingDb(db), webhookSecret: SECRET, revalidate: (s) => void revalidated.push(s) }
  }
  const sid = () => `sub_${randomUUID().slice(0, 12)}`
  const evt = (type: string, customer: string, id = `evt_${randomUUID()}`) => ({ id, type, created: Math.floor(Date.now() / 1000), data: { object: { id: 'sub_1', customer } } })

  it('rejects a forged or unsigned call and changes nothing', async () => {
    const fake = fakeStripe()
    const { creatorId, customer } = await approvedCreator()
    fake.state.subs.set(customer, [{ id: sid(), status: 'active', created: 1 }])
    const e = evt('customer.subscription.updated', customer)
    const bad = signed(e, 'whsec_attacker')
    expect((await handleStripeWebhook(deps(fake), bad.payload, bad.header)).status).toBe(400)
    expect((await handleStripeWebhook(deps(fake), JSON.stringify(e), null)).status).toBe(400)
    const good = signed(e)
    expect((await handleStripeWebhook(deps(fake), good.payload.replace('sub_1', 'sub_2').replace(customer, 'cus_other'), good.header)).status).toBe(400) // body changed after signing
    const old = signer.webhooks.generateTestHeaderString({ payload: good.payload, secret: SECRET, timestamp: Math.floor(Date.now() / 1000) - 3600 })
    expect((await handleStripeWebhook(deps(fake), good.payload, old)).status).toBe(400) // replay of an hour-old delivery
    expect(await statusOf(creatorId)).toBe('approved')
    expect(fake.state.listCalls).toBe(0)
    expect((await db.root.query('select count(*)::int as n from public.stripe_events where id = $1', [e.id])).rows[0].n).toBe(0)
  })

  it('checkout finished: the creator goes live on a trial and cached pages are cleared', async () => {
    const fake = fakeStripe()
    const revalidated: string[] = []
    const { creatorId, customer } = await approvedCreator()
    fake.state.subs.set(customer, [{ id: sid(), status: 'trialing', created: 1 }])
    const s = signed(evt('checkout.session.completed', customer))
    expect((await handleStripeWebhook(deps(fake, revalidated), s.payload, s.header)).status).toBe(200)
    expect(await statusOf(creatorId)).toBe('trialing')
    expect(revalidated.length).toBe(1)
  })

  it('the same event delivered ten times at once is applied once', async () => {
    const fake = fakeStripe()
    const { creatorId, customer } = await approvedCreator()
    fake.state.subs.set(customer, [{ id: sid(), status: 'active', created: 1 }])
    const s = signed(evt('invoice.paid', customer))
    const out = await Promise.all(Array.from({ length: 10 }, () => handleStripeWebhook(deps(fake), s.payload, s.header)))
    expect(out.every((o) => o.status === 200)).toBe(true)
    expect(await statusOf(creatorId)).toBe('active')
    const again = await handleStripeWebhook(deps(fake), s.payload, s.header)
    expect(again.body.duplicate).toBe(true)
  })

  it('events arriving in the wrong order still end on what Stripe says now', async () => {
    const fake = fakeStripe()
    const { creatorId, customer } = await approvedCreator()
    // Stripe's truth right now: the card failed and then was fixed → active.
    fake.state.subs.set(customer, [{ id: sid(), status: 'active', created: 1 }])
    // The "payment failed" event shows up last.
    for (const type of ['invoice.paid', 'customer.subscription.updated', 'invoice.payment_failed']) {
      const s = signed(evt(type, customer))
      expect((await handleStripeWebhook(deps(fake), s.payload, s.header)).status).toBe(200)
    }
    expect(await statusOf(creatorId)).toBe('active')
  })

  it('a late "subscription deleted" for an old subscription does not cancel the new one', async () => {
    const fake = fakeStripe()
    const { creatorId, customer } = await approvedCreator()
    fake.state.subs.set(customer, [
      { id: sid(), status: 'canceled', created: 1 },
      { id: sid(), status: 'active', created: 2 },
    ])
    const s = signed(evt('customer.subscription.deleted', customer))
    await handleStripeWebhook(deps(fake), s.payload, s.header)
    expect(await statusOf(creatorId)).toBe('active')
  })

  it('Stripe down: answers 500 so Stripe retries, and the retry then works', async () => {
    const fake = fakeStripe()
    const { creatorId, customer } = await approvedCreator()
    fake.state.subs.set(customer, [{ id: sid(), status: 'trialing', created: 1 }])
    const e = evt('customer.subscription.created', customer)
    const s = signed(e)
    fake.state.down = true
    expect((await handleStripeWebhook(deps(fake), s.payload, s.header)).status).toBe(500)
    expect(await statusOf(creatorId)).toBe('approved')
    const row = (await db.root.query('select processed_at, last_error from public.stripe_events where id = $1', [e.id])).rows[0]
    expect(row.processed_at).toBeNull()
    expect(row.last_error).toMatch(/timeout/)
    fake.state.down = false
    expect((await handleStripeWebhook(deps(fake), s.payload, s.header)).status).toBe(200)
    expect(await statusOf(creatorId)).toBe('trialing')
  })

  it('an event for a customer we do not know, or of a type we ignore, is acknowledged and harmless', async () => {
    const fake = fakeStripe()
    for (const e of [evt('invoice.paid', 'cus_unknown'), evt('charge.refunded', 'cus_unknown'), { id: `evt_${randomUUID()}`, type: 'invoice.paid', created: 1, data: { object: {} } }]) {
      const s = signed(e)
      expect((await handleStripeWebhook(deps(fake), s.payload, s.header)).status).toBe(200)
    }
  })

  it('the same card on a second account ends that trial at once (no second free trial)', async () => {
    const fake = fakeStripe()
    const a = await approvedCreator()
    const b = await approvedCreator()
    fake.state.fingerprints.set('pm_a', 'fp_same').set('pm_b', 'fp_same')
    fake.state.subs.set(a.customer, [{ id: `sub_a_${a.customer}`, status: 'trialing', created: 1, default_payment_method: 'pm_a' }])
    fake.state.subs.set(b.customer, [{ id: `sub_b_${b.customer}`, status: 'trialing', created: 1, default_payment_method: { id: 'pm_b' } }])
    await syncCustomer(deps(fake), a.customer)
    await syncCustomer(deps(fake), b.customer)
    expect(fake.state.trialEnded).toEqual([`sub_b_${b.customer}`])
    expect(await statusOf(a.creatorId)).toBe('trialing')
    expect(await statusOf(b.creatorId)).toBe('active') // paying from day one
    expect((await db.root.query('select trial_abuse from public.creator_billing where creator_id = $1', [b.creatorId])).rows[0].trial_abuse).toBe(true)
  })

  it('if Stripe fails while ending a repeat-card trial, the next attempt still ends it', async () => {
    const fake = fakeStripe()
    const a = await approvedCreator()
    const b = await approvedCreator()
    fake.state.fingerprints.set('pm_1', 'fp_retry').set('pm_2', 'fp_retry')
    fake.state.subs.set(a.customer, [{ id: `sub_ra_${a.customer}`, status: 'trialing', created: 1, default_payment_method: 'pm_1' }])
    fake.state.subs.set(b.customer, [{ id: `sub_rb_${b.customer}`, status: 'trialing', created: 1, default_payment_method: 'pm_2' }])
    await syncCustomer(deps(fake), a.customer)
    fake.state.updateDown = true
    await expect(syncCustomer(deps(fake), b.customer)).rejects.toThrow()
    fake.state.updateDown = false
    await syncCustomer(deps(fake), b.customer) // the webhook retry
    expect(fake.state.trialEnded).toEqual([`sub_rb_${b.customer}`])
    expect(await statusOf(b.creatorId)).toBe('active')
  })

  it('paid just after the approval lapsed: they go live, they are not cancelled', async () => {
    const fake = fakeStripe()
    const { creatorId, customer } = await approvedCreator()
    await db.root.query(`update public.creator_billing set approval_expires_at = now() - interval '1 day' where creator_id = $1`, [creatorId])
    await db.svc.query('select public.expire_approvals()')
    expect(await statusOf(creatorId)).toBe('canceled')
    fake.state.subs.set(customer, [{ id: sid(), status: 'active', created: 1 }])
    await syncCustomer(deps(fake), customer)
    expect(fake.state.cancelled).toEqual([])
    expect(await statusOf(creatorId)).toBe('active')
  })

  it('a subscription for someone whose application is back in review or rejected is cancelled and flagged', async () => {
    const fake = fakeStripe()
    const flagged: string[] = []
    const { creatorId, customer } = await approvedCreator()
    const user = (await db.root.query('select user_id from public.creators where id = $1', [creatorId])).rows[0].user_id
    await db.root.query(`update public.creator_billing set approval_expires_at = now() - interval '1 day' where creator_id = $1`, [creatorId])
    await db.svc.query('select public.expire_approvals()')
    await apply(db, user)
    const subId = sid()
    fake.state.subs.set(customer, [{ id: subId, status: 'trialing', created: 1 }])
    await syncCustomer({ ...deps(fake), onOrphan: (c) => void flagged.push(c) }, customer)
    expect(fake.state.cancelled).toEqual([subId])
    expect(flagged).toEqual([creatorId])
    expect(await statusOf(creatorId)).toBe('applied')
  })

  it('two checkout pages both completed: one subscription is kept, the other cancelled', async () => {
    const fake = fakeStripe()
    const { creatorId, customer } = await approvedCreator()
    const keep = sid()
    const extra = sid()
    fake.state.subs.set(customer, [{ id: extra, status: 'trialing', created: 1 }, { id: keep, status: 'trialing', created: 2 }])
    await syncCustomer(deps(fake), customer)
    expect(fake.state.cancelled).toEqual([extra])
    expect(await statusOf(creatorId)).toBe('trialing')
  })

  it('a webhook whose read was overtaken by a failed newer read is not marked done until it lands', async () => {
    const fake = fakeStripe()
    const { creatorId, customer } = await approvedCreator()
    fake.state.subs.set(customer, [{ id: sid(), status: 'trialing', created: 1 }])
    const d = deps(fake)
    // every Stripe read is overtaken once by another sync that then dies (takes a number, never writes)
    let overtakes = 2
    const realList = fake.api.subscriptions.list
    fake.api.subscriptions.list = async (p) => {
      const out = await realList(p)
      if (overtakes-- > 0) await db.svc.query('select public.begin_billing_sync($1)', [creatorId])
      return out
    }
    const s = signed(evt('checkout.session.completed', customer))
    expect((await handleStripeWebhook(d, s.payload, s.header)).status).toBe(200)
    expect(await statusOf(creatorId)).toBe('trialing')
    // and if it never lands, Stripe is asked to send the event again
    overtakes = 99
    const other = await approvedCreator()
    fake.state.subs.set(other.customer, [{ id: sid(), status: 'trialing', created: 1 }])
    fake.api.subscriptions.list = async (p) => {
      const out = await realList(p)
      await db.svc.query('select public.begin_billing_sync($1)', [other.creatorId])
      return out
    }
    const s2 = signed(evt('checkout.session.completed', other.customer))
    expect((await handleStripeWebhook(d, s2.payload, s2.header)).status).toBe(500)
  })

  it('reconciliation repairs a status that drifted (a webhook that never arrived)', async () => {
    const fake = fakeStripe()
    const { creatorId, customer } = await approvedCreator()
    const subId = sid()
    fake.state.subs.set(customer, [{ id: subId, status: 'trialing', created: 1 }])
    await syncCustomer(deps(fake), customer)
    fake.state.subs.set(customer, [{ id: subId, status: 'canceled', created: 1 }]) // canceled at Stripe, webhook lost
    expect(await statusOf(creatorId)).toBe('trialing')
    const r = await syncCustomer(deps(fake), customer)
    expect(r).toMatchObject({ changed: true, status: 'canceled' })
    // customer deleted at Stripe entirely
    const other = await approvedCreator()
    fake.state.subs.set(other.customer, [{ id: sid(), status: 'active', created: 1 }])
    await syncCustomer(deps(fake), other.customer)
    fake.api.subscriptions.list = async () => {
      throw Object.assign(new Error('No such customer'), { code: 'resource_missing' })
    }
    await syncCustomer(deps(fake), other.customer)
    expect(await statusOf(other.creatorId)).toBe('canceled')
  })
})
