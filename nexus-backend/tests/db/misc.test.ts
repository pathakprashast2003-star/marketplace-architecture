import { randomUUID } from 'node:crypto'
import { afterAll, beforeAll, describe, expect, it } from 'vitest'
import { apply, type Db, fails, freshDb, hasPg, liveCreator, makeAdmin, makeUser } from './helpers'

describe.skipIf(!hasPg)('waitlist, applications, profile edits, outbox, ranking, deletion', () => {
  let db: Db
  let admin: string
  beforeAll(async () => {
    db = await freshDb()
    admin = await makeAdmin(db)
  })
  afterAll(() => db.close())

  const lead = (email: string, need = 'Drone pilot for a wedding') =>
    db.svc.query(`select public.create_waitlist_lead('client', $1, $2, 'Aerial', 'Austin', 'tiktok', null, null, 'friend', '/', 'ip') as r`, [email, need])

  it('waitlist: the answer looks the same whether or not the email is already on the list', async () => {
    const email = `lead_${randomUUID().slice(0, 8)}@example.com`
    const first = (await lead(email.toUpperCase())).rows[0].r
    const second = (await lead(email)).rows[0].r
    expect(Object.keys(first).sort()).toEqual(Object.keys(second).sort())
    expect(second.edit_token).not.toBe(first.edit_token)
    expect((await db.root.query('select count(*)::int as n from public.waitlist_leads where email = $1', [email])).rows[0].n).toBe(1)
    expect((await db.root.query(`select count(*)::int as n from public.email_outbox where to_email = $1 and template = 'waitlist_confirm'`, [email])).rows[0].n).toBe(1)

    // the second (decoy) token changes nothing; the real one does; a different need is a new request
    await db.svc.query(`select public.update_waitlist_details($1, 'March', '$500-$1,500')`, [second.edit_token])
    expect((await db.root.query('select budget from public.waitlist_leads where email = $1', [email])).rows[0].budget).toBeNull()
    await db.svc.query(`select public.update_waitlist_details($1, 'March', '$500-$1,500')`, [first.edit_token])
    expect((await db.root.query('select budget, utm_source, ref_code from public.waitlist_leads where email = $1', [email])).rows[0]).toEqual({ budget: '$500-$1,500', utm_source: 'tiktok', ref_code: 'friend' })
    await lead(email, 'Pottery class')
    expect((await db.root.query('select count(*)::int as n from public.waitlist_leads where email = $1', [email])).rows[0].n).toBe(2)
  })

  it('waitlist: 20 identical submits at once store one row; oversized input is refused', async () => {
    const email = `burst_${randomUUID().slice(0, 8)}@example.com`
    await Promise.all(Array.from({ length: 20 }, () => lead(email)))
    expect((await db.root.query('select count(*)::int as n from public.waitlist_leads where email = $1', [email])).rows[0].n).toBe(1)
    await fails(lead('a@b.co', 'x'.repeat(301)), /check constraint/)
    await fails(lead('x'.repeat(250) + '@example.com'), /check constraint/)
    await fails(db.svc.query(`select public.create_waitlist_lead('hacker', 'a@b.co', 'x', null, null, null, null, null, null, null, null)`), /check constraint/)
  })

  it('rate limit: 60 hits at once against a limit of 10 lets exactly 10 through', async () => {
    const key = `t:${randomUUID()}`
    const out = await Promise.all(Array.from({ length: 60 }, () => db.svc.query('select public.check_rate_limit($1, 10, 3600) as ok', [key])))
    expect(out.filter((o) => o.rows[0].ok).length).toBe(10)
  })

  it('applications: need a verified adult; one per person even on a double submit', async () => {
    await fails(apply(db, await makeUser(db, { verified: false })), 'email_not_verified')
    await fails(apply(db, await makeUser(db, { dob: null })), 'age_gate_required')
    const teen = new Date(Date.now() - 16 * 365.25 * 86400e3).toISOString().slice(0, 10)
    await fails(apply(db, await makeUser(db, { dob: teen })), 'age_restricted')
    const u = await makeUser(db)
    const out = await Promise.allSettled([apply(db, u), apply(db, u), apply(db, u), apply(db, u)])
    expect(out.filter((o) => o.status === 'fulfilled').length).toBe(1)
    expect((await db.root.query('select count(*)::int as n from public.creators where user_id = $1', [u])).rows[0].n).toBe(1)
    expect((await db.root.query('select role from public.user_roles where user_id = $1', [u])).rows[0].role).toBe('creator')
    await fails(apply(db, u), 'already_applied')
    await fails(db.svc.query(`select public.submit_application($1, 'X Y', 'nope', 'Austin', null, null, 'https://a.co/x', false, null, null, null, null, null)`, [await makeUser(db)]), 'invalid:category')
    await fails(db.svc.query(`select public.submit_application($1, 'X Y', 'film', 'Austin', null, null, 'ftp://a.co/x', false, null, null, null, null, null)`, [await makeUser(db)]), /check constraint/)
    // applying never makes an admin a creator-only account, and never grants admin
    await apply(db, admin)
    expect((await db.root.query('select role from public.user_roles where user_id = $1', [admin])).rows[0].role).toBe('admin')
  })

  it('applications: a rejected creator can try again twice, then no more; same portfolio on a new account is flagged', async () => {
    const u = await makeUser(db)
    const id = await apply(db, u, { portfolio: 'https://www.Vimeo.com/jo-films/' })
    for (let i = 0; i < 2; i++) {
      await db.svc.query(`select public.reject_application($1, $2, 'More samples please')`, [admin, id])
      await apply(db, u, { portfolio: 'https://vimeo.com/jo-films' })
    }
    await db.svc.query(`select public.reject_application($1, $2, 'No')`, [admin, id])
    await fails(apply(db, u), 'too_many_applications')
    const copy = await apply(db, await makeUser(db), { portfolio: 'http://VIMEO.com/jo-films/#reel' })
    expect((await db.root.query('select duplicate_of from public.creators where id = $1', [copy])).rows[0].duplicate_of).toBe(id)
  })

  it('profile edits: only listed fields change; big edits on a live profile go back to review', async () => {
    const live = await liveCreator(db, admin)
    const other = await liveCreator(db, admin)
    const patch = (p: object) => db.svc.query('select public.update_creator_profile($1, $2)', [live.userId, JSON.stringify(p)])
    await patch({ status: 'active', founding_number: 1, user_id: other.userId, needs_review: false, city: 'Dallas' })
    const row = (await db.root.query('select status, city, user_id, needs_review from public.creators where id = $1', [live.creatorId])).rows[0]
    expect(row).toEqual({ status: 'trialing', city: 'Dallas', user_id: live.userId, needs_review: false })
    await patch({ about: 'I now sell something completely different. '.repeat(3) })
    expect((await db.root.query('select needs_review from public.creators where id = $1', [live.creatorId])).rows[0].needs_review).toBe(true)
    await db.svc.query('select public.clear_needs_review($1, $2)', [admin, live.creatorId])
    await fails(patch({ avatar_path: `${other.creatorId}/face.png` }), 'invalid:avatar_path')
    await fails(patch({ website_url: 'javascript:alert(1)' }), /check constraint/)
    await fails(patch({ instagram_url: 'https://instagram.com.evil.io/x' }), /check constraint/)
    await fails(patch({ display_name: 'x'.repeat(200) }), /check constraint/)
    await fails(db.svc.query('select public.update_creator_profile($1, $2)', [await makeUser(db), '{}']), 'not_a_creator')
    // approved but not yet paid: a rewrite is flagged too, so nobody goes live with unseen content
    const waiting = await makeUser(db)
    const wid = await apply(db, waiting)
    await db.svc.query('select public.approve_application($1, $2, (select updated_at from public.creators where id = $2))', [admin, wid])
    await db.svc.query('select public.update_creator_profile($1, $2)', [waiting, JSON.stringify({ display_name: 'Totally Different', about: 'Something else entirely, not what was reviewed.' })])
    expect((await db.root.query('select needs_review from public.creators where id = $1', [wid])).rows[0].needs_review).toBe(true)
    // services: cannot edit someone else's
    const svc = (await db.svc.query(`select public.save_service($1, null, $2) as id`, [other.userId, JSON.stringify({ title: 'Pottery class', kind: 'class', price_cents: 4500, group_size: 6, format: 'in_person' })])).rows[0].id
    await fails(db.svc.query(`select public.save_service($1, $2, $3)`, [live.userId, svc, JSON.stringify({ title: 'Hacked' })]), 'not_found')
    await fails(db.svc.query(`select public.delete_service($1, $2)`, [live.userId, svc]), 'not_found')
  })

  it('email outbox: two workers never send the same email; failures back off, then stop', async () => {
    await db.root.query('delete from public.email_outbox')
    for (let i = 0; i < 40; i++) await db.svc.query(`select public.enqueue_email($1, 't', '{}', 'account', $2)`, [`o${i}@example.com`, `k${i}`])
    await db.svc.query(`select public.enqueue_email('o0@example.com', 't', '{}', 'account', 'k0')`) // duplicate key: ignored
    const claims = await Promise.all(Array.from({ length: 6 }, () => db.svc.query('select id from public.claim_outbox(10)')))
    const ids = claims.flatMap((c) => c.rows.map((r) => r.id))
    expect(ids.length).toBe(40)
    expect(new Set(ids).size).toBe(40)
    await db.svc.query('select public.outbox_sent($1)', [ids[0]])
    await db.svc.query(`select public.outbox_failed($1, 'resend 500')`, [ids[1]])
    const f = (await db.root.query('select status, next_attempt_at > now() as later from public.email_outbox where id = $1', [ids[1]])).rows[0]
    expect(f).toEqual({ status: 'failed', later: true })
    expect((await db.svc.query('select id from public.claim_outbox(100)')).rows.length).toBe(0) // not due yet, others in flight
    for (let i = 0; i < 6; i++) {
      await db.root.query(`update public.email_outbox set next_attempt_at = now() - interval '1 second' where id = $1`, [ids[1]])
      await db.svc.query('select id from public.claim_outbox(100)')
      await db.svc.query(`select public.outbox_failed($1, 'still down')`, [ids[1]])
    }
    expect((await db.root.query('select status from public.email_outbox where id = $1', [ids[1]])).rows[0].status).toBe('dead')
    // a worker that died mid-send: its email is picked up again after 10 minutes
    await db.root.query(`update public.email_outbox set locked_at = now() - interval '11 minutes' where id = $1`, [ids[2]])
    expect((await db.svc.query('select id from public.claim_outbox(100)')).rows.map((r) => r.id)).toEqual([ids[2]])
  })

  it('unsubscribed people get no marketing email but still get account email', async () => {
    const email = `unsub_${randomUUID().slice(0, 6)}@example.com`
    await db.svc.query('insert into public.email_suppressions (email) values ($1)', [email])
    await db.svc.query(`select public.enqueue_email($1, 'weekly_digest', '{}', 'marketing', $2)`, [email, `m:${email}`])
    await db.svc.query(`select public.enqueue_email($1, 'inquiry_new', '{}', 'inquiry', $2)`, [email, `i:${email}`])
    expect((await db.root.query('select stream from public.email_outbox where to_email = $1', [email])).rows).toEqual([{ stream: 'inquiry' }])
  })

  it('weekly digest: one per live creator per week', async () => {
    const live = await liveCreator(db, admin)
    await db.svc.query('select public.enqueue_weekly_digests()')
    await db.svc.query('select public.enqueue_weekly_digests()')
    expect((await db.root.query(`select count(*)::int as n from public.email_outbox where template = 'weekly_digest' and dedupe_key like $1`, [`digest:${live.creatorId}:%`])).rows[0].n).toBe(1)
  })

  it('ranking: complete profiles first, then founders, then newest; thin profiles stay out of search', async () => {
    await db.root.query(`update public.creators set status = 'canceled', canceled_reason = 'subscription_ended' where status in ('trialing', 'active', 'past_due')`)
    await db.root.query('update public.founding_counter set next_number = 101')
    const late = await liveCreator(db, admin) // no founding number
    await db.root.query('update public.founding_counter set next_number = 7')
    await db.root.query('update public.creators set founding_number = null where founding_number = 7')
    const founder = await liveCreator(db, admin)
    const thinFounder = await liveCreator(db, admin)
    const fill = async (u: string) => {
      await db.svc.query('select public.update_creator_profile($1, $2)', [u, JSON.stringify({ about: 'a'.repeat(100), price_on_request: true })])
      await db.svc.query('select public.save_service($1, null, $2)', [u, JSON.stringify({ title: 'Half-day shoot', price_cents: 60000 })])
    }
    await fill(late.userId)
    await fill(founder.userId)
    await db.root.query(`update public.creators set headline = null, starting_price_cents = null where id = $1`, [thinFounder.creatorId])
    expect((await db.svc.query('select public.recompute_ranks() as n')).rows[0].n).toBe(3)
    const res = await db.asUser(null, (c) => c.query('select id, total from public.search_creators()'))
    expect(res.rows.map((r) => r.id)).toEqual([founder.creatorId, late.creatorId])
    expect(Number(res.rows[0].total)).toBe(2)
    // search input cannot be abused: wildcards are literal, limits are clamped
    const wild = await db.asUser(null, (c) => c.query(`select id from public.search_creators(p_q => '%', p_limit => 100000)`))
    expect(wild.rows.length).toBe(0)
    const city = await db.asUser(null, (c) => c.query(`select id from public.search_creators(p_city => ' austin ', p_q => 'TEST creator')`))
    expect(city.rows.length).toBe(2)
    const inj = await db.asUser(null, (c) => c.query(`select id from public.search_creators(p_q => $1)`, [`'; drop table creators; --`]))
    expect(inj.rows.length).toBe(0)
  })

  it('deleting an account removes the person, their profile, messages and queued email', async () => {
    const live = await liveCreator(db, admin)
    const client = await makeUser(db)
    const email = (await db.root.query('select email from auth.users where id = $1', [client])).rows[0].email
    await db.svc.query(`select public.create_waitlist_lead('client', $1, 'x', null, null, null, null, null, null, null, null)`, [email])
    const inq = (await db.svc.query(`select public.send_inquiry($1, $2, 'Sam', null, true, null, '+1 555', null, $3, null) as id`, [client, live.creatorId, 'Please film my birthday party next month.'])).rows[0].id
    await db.svc.query(`select public.post_message($1, $2, 'Sure')`, [live.userId, inq])
    await db.svc.query('select public.set_save($1, $2, true)', [client, live.creatorId])
    const info = (await db.svc.query('select public.purge_user_data($1) as r', [client])).rows[0].r
    expect(info).toEqual({ creator_id: null, stripe_customer_id: null })
    await db.root.query('delete from auth.users where id = $1', [client]) // what the auth admin API does
    for (const [sql, p] of [
      ['select 1 from public.profiles where id = $1', client],
      ['select 1 from public.inquiries where client_user_id = $1', client],
      ['select 1 from public.messages where inquiry_id = $1', inq],
      ['select 1 from public.saves where user_id = $1', client],
      ['select 1 from public.waitlist_leads where email = $1', email],
      [`select 1 from public.email_outbox where to_email = $1 and status <> 'sent'`, email],
    ] as const) {
      expect((await db.root.query(sql, [p])).rows, sql).toEqual([])
    }
    // deleting a creator removes their listing and billing row too
    await db.svc.query(`select public.set_stripe_customer($1, 'cus_del')`, [live.creatorId])
    expect((await db.svc.query('select public.purge_user_data($1) as r', [live.userId])).rows[0].r).toEqual({ creator_id: live.creatorId, stripe_customer_id: 'cus_del' })
    await db.root.query('delete from auth.users where id = $1', [live.userId])
    expect((await db.root.query('select 1 from public.creators where id = $1', [live.creatorId])).rows).toEqual([])
    expect((await db.root.query('select 1 from public.creator_billing where creator_id = $1', [live.creatorId])).rows).toEqual([])
  })
})
