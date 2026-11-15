import { afterAll, beforeAll, describe, expect, it } from 'vitest'
import { apply, type Db, fails, freshDb, hasPg, liveCreator, makeAdmin, makeUser, syncState } from './helpers'

const MSG = 'Hello, we are getting married in June and would love a short film of the day.'

describe.skipIf(!hasPg)('inquiries, messages, blocks and reviews', () => {
  let db: Db
  let admin: string
  beforeAll(async () => {
    db = await freshDb()
    admin = await makeAdmin(db)
  })
  afterAll(() => db.close())

  const inquire = (user: string | null, creator: string, msg = MSG, ip: string | null = null) =>
    db.svc.query(`select public.send_inquiry($1, $2, 'Sam', '2027-06-14', true, '$500-$1,500', null, null, $3, $4) as id`, [user, creator, msg, ip])

  it('saves the inquiry, the first message and a queued email in one step', async () => {
    const { creatorId, userId } = await liveCreator(db, admin)
    const client = await makeUser(db)
    const id = (await inquire(client, creatorId)).rows[0].id
    const msgs = await db.root.query('select body, sender_user_id from public.messages where inquiry_id = $1', [id])
    expect(msgs.rows).toEqual([{ body: MSG, sender_user_id: client }])
    const mail = await db.root.query(`select to_email, stream, status from public.email_outbox where dedupe_key = $1`, [`inquiry:${id}`])
    const creatorEmail = (await db.root.query('select email from auth.users where id = $1', [userId])).rows[0].email
    expect(mail.rows).toEqual([{ to_email: creatorEmail, stream: 'inquiry', status: 'queued' }])
    // the creator sees it in their inbox even if the email never arrives
    const inbox = await db.asUser(userId, (c) => c.query('select id from public.inquiries'))
    expect(inbox.rows.map((r) => r.id)).toContain(id)
  })

  it('refuses people who are signed out, unverified, not age-checked or under 18', async () => {
    const { creatorId } = await liveCreator(db, admin)
    await fails(inquire(null, creatorId), 'unauthenticated')
    await fails(inquire(await makeUser(db, { verified: false }), creatorId), 'email_not_verified')
    await fails(inquire(await makeUser(db, { dob: null }), creatorId), 'age_gate_required')
    const teen = new Date(Date.now() - 15 * 365.25 * 86400e3).toISOString().slice(0, 10)
    await fails(inquire(await makeUser(db, { dob: teen }), creatorId), 'age_restricted')
  })

  it('under-13s are blocked for good and their birth date is not kept', async () => {
    const kid = await makeUser(db, { dob: null })
    const dob = new Date(Date.now() - 10 * 365.25 * 86400e3).toISOString().slice(0, 10)
    expect((await db.svc.query('select public.complete_profile($1, $2, $3) as r', [kid, 'Kid', dob])).rows[0].r).toBe('blocked')
    // trying again with an adult date does not work
    expect((await db.svc.query(`select public.complete_profile($1, 'Kid', '1990-01-01') as r`, [kid])).rows[0].r).toBe('blocked')
    const p = (await db.root.query('select age_gate, date_of_birth from public.profiles where id = $1', [kid])).rows[0]
    expect(p).toEqual({ age_gate: 'blocked', date_of_birth: null })
    const { creatorId } = await liveCreator(db, admin)
    await fails(inquire(kid, creatorId), 'age_restricted')
    await fails(apply(db, kid), 'age_restricted')
    // an adult cannot change their birth date later either
    const adult = await makeUser(db)
    await db.svc.query(`select public.complete_profile($1, 'New Name', '2020-01-01')`, [adult])
    expect((await db.root.query('select age_gate, date_of_birth::text as d from public.profiles where id = $1', [adult])).rows[0]).toEqual({ age_gate: 'passed', d: '1990-01-01' })
    await fails(db.svc.query(`select public.complete_profile($1, 'X', '2999-01-01')`, [await makeUser(db, { dob: null })]), 'invalid:date_of_birth')
  })

  it('refuses inquiries to creators who are not live, to yourself, and junk messages', async () => {
    const live = await liveCreator(db, admin)
    const client = await makeUser(db)
    const applied = await apply(db, await makeUser(db))
    await fails(inquire(client, applied), 'not_found')
    await fails(inquire(client, '00000000-0000-4000-8000-000000000000'), 'not_found')
    await fails(inquire(live.userId, live.creatorId), 'forbidden')
    await fails(inquire(client, live.creatorId, 'hi'), 'invalid:message')
    await fails(inquire(client, live.creatorId, 'x'.repeat(4001)), /check constraint/)
    await db.svc.query('select public.admin_set_hidden($1, $2, true, null)', [admin, live.creatorId])
    await fails(inquire(client, live.creatorId), 'not_found')
  })

  it('a double click sends one inquiry, and a second one the same day is refused', async () => {
    const { creatorId } = await liveCreator(db, admin)
    const client = await makeUser(db)
    const out = await Promise.allSettled(Array.from({ length: 8 }, () => inquire(client, creatorId)))
    expect(out.filter((o) => o.status === 'fulfilled').length).toBe(1)
    await fails(inquire(client, creatorId), 'rate_limited')
    expect((await db.root.query('select count(*)::int as n from public.inquiries where client_user_id = $1', [client])).rows[0].n).toBe(1)
  })

  it('one account cannot spray inquiries across many creators', async () => {
    const client = await makeUser(db)
    let sent = 0
    for (let i = 0; i < 12; i++) {
      const { creatorId } = await liveCreator(db, admin)
      try {
        await inquire(client, creatorId)
        sent++
      } catch (e) {
        expect((e as Error).message).toBe('rate_limited')
      }
    }
    expect(sent).toBe(10)
  })

  it('only the two people in a conversation can read or write it', async () => {
    const live = await liveCreator(db, admin)
    const client = await makeUser(db)
    const stranger = await makeUser(db)
    const otherCreator = await liveCreator(db, admin)
    const id = (await inquire(client, live.creatorId)).rows[0].id
    for (const who of [stranger, otherCreator.userId]) {
      const seen = await db.asUser(who, async (c) => [
        (await c.query('select id from public.inquiries where id = $1', [id])).rows.length,
        (await c.query('select id from public.messages where inquiry_id = $1', [id])).rows.length,
      ])
      expect(seen).toEqual([0, 0])
      await fails(db.svc.query(`select public.post_message($1, $2, 'let me in')`, [who, id]), 'not_found')
    }
    const mine = await db.asUser(client, (c) => c.query('select body from public.messages where inquiry_id = $1', [id]))
    expect(mine.rows.length).toBe(1)
  })

  it('response time starts only when the creator really replies', async () => {
    const live = await liveCreator(db, admin)
    const client = await makeUser(db)
    const id = (await inquire(client, live.creatorId)).rows[0].id
    await db.svc.query(`select public.post_message($1, $2, 'Any update?')`, [client, id])
    expect((await db.root.query('select first_reply_at, status from public.inquiries where id = $1', [id])).rows[0]).toEqual({ first_reply_at: null, status: 'new' })
    await db.svc.query(`select public.post_message($1, $2, 'Yes, I am free that day.')`, [live.userId, id])
    const row = (await db.root.query('select first_reply_at, status from public.inquiries where id = $1', [id])).rows[0]
    expect(row.status).toBe('replied')
    expect(row.first_reply_at).not.toBeNull()
    const mail = await db.root.query(`select count(*)::int as n from public.email_outbox where template = 'message_new' and payload ->> 'inquiry_id' = $1`, [id])
    expect(mail.rows[0].n).toBe(2)
  })

  it('a creator can block a sender, who can then neither write nor start again', async () => {
    const live = await liveCreator(db, admin)
    const client = await makeUser(db)
    const id = (await inquire(client, live.creatorId)).rows[0].id
    await fails(db.svc.query('select public.block_sender($1, $2)', [client, id]), 'not_found') // only the creator can block
    await db.svc.query('select public.block_sender($1, $2)', [live.userId, id])
    await fails(db.svc.query(`select public.post_message($1, $2, 'hello??')`, [client, id]), 'forbidden')
    await db.root.query(`delete from public.rate_limits`)
    await fails(inquire(client, live.creatorId), 'forbidden')
  })

  it('reports are saved and limited per person', async () => {
    const live = await liveCreator(db, admin)
    const u = await makeUser(db)
    for (let i = 0; i < 10; i++) await db.svc.query(`select public.submit_report($1, 'creator', $2, 'Stolen portfolio images')`, [u, live.creatorId])
    await fails(db.svc.query(`select public.submit_report($1, 'creator', $2, 'Stolen portfolio images')`, [u, live.creatorId]), 'rate_limited')
    await fails(db.svc.query(`select public.submit_report($1, 'planet', $2, 'Stolen portfolio images')`, [await makeUser(db), live.creatorId]), /check constraint/)
  })

  it('creator contact details need a verified adult account and cannot be harvested in bulk', async () => {
    const live = await liveCreator(db, admin)
    await db.svc.query('select public.update_creator_profile($1, $2)', [live.userId, JSON.stringify({ contact_email: 'Hello@Studio.com', contact_phone: '+1 555 0100' })])
    await fails(db.svc.query('select public.get_creator_contact($1, $2)', [null, live.creatorId]), 'unauthenticated')
    await fails(db.svc.query('select public.get_creator_contact($1, $2)', [await makeUser(db, { verified: false }), live.creatorId]), 'email_not_verified')
    const u = await makeUser(db)
    const got = (await db.svc.query('select public.get_creator_contact($1, $2) as c', [u, live.creatorId])).rows[0].c
    expect(got).toEqual({ email: 'hello@studio.com', phone: '+1 555 0100' })
    for (let i = 0; i < 29; i++) await db.svc.query('select public.get_creator_contact($1, $2)', [u, live.creatorId])
    await fails(db.svc.query('select public.get_creator_contact($1, $2)', [u, live.creatorId]), 'rate_limited')
  })

  describe('reviews', () => {
    const setup = async (o: { replied?: boolean; daysAgo?: number; accountDays?: number; ip?: string } = {}) => {
      const live = await liveCreator(db, admin)
      const client = await makeUser(db, { ageDays: o.accountDays ?? 60 })
      const id = (await inquire(client, live.creatorId, MSG, o.ip ?? null)).rows[0].id
      if (o.replied ?? true) await db.svc.query(`select public.post_message($1, $2, 'Happy to help!')`, [live.userId, id])
      await db.root.query(`update public.inquiries set created_at = now() - make_interval(days => $2) where id = $1`, [id, o.daysAgo ?? 10])
      return { live, client, id }
    }
    const review = (user: string, inquiry: string, ip: string | null = null) =>
      db.svc.query(`select public.submit_review($1, $2, 5, 'Lovely to work with', $3) as id`, [user, inquiry, ip])

    it('only after a real, answered inquiry, a week later, from an established account', async () => {
      const early = await setup({ daysAgo: 2 })
      await fails(review(early.client, early.id), 'too_early')
      const silent = await setup({ replied: false })
      await fails(review(silent.client, silent.id), 'not_eligible')
      const fresh = await setup({ accountDays: 1 })
      await fails(review(fresh.client, fresh.id), 'too_early')
      const ok = await setup()
      await fails(review(await makeUser(db), ok.id), 'not_found') // someone else's inquiry
      await fails(review(ok.live.userId, ok.id), 'not_found') // the creator themself
      await fails(db.svc.query(`select public.submit_review($1, $2, 6, 'x', null)`, [ok.client, ok.id]), /check constraint/)
      const id = (await review(ok.client, ok.id)).rows[0].id
      await fails(review(ok.client, ok.id), 'already_reviewed')

      // held for moderation: the public cannot see it yet
      const stranger = await makeUser(db)
      expect((await db.asUser(stranger, (c) => c.query('select id from public.reviews where id = $1', [id]))).rows).toEqual([])
      await db.svc.query(`select public.moderate_review($1, $2, 'published')`, [admin, id])
      expect((await db.asUser(stranger, (c) => c.query('select id from public.reviews where id = $1', [id]))).rows.length).toBe(1)

      // the creator can dispute it, a stranger cannot
      await fails(db.svc.query(`select public.dispute_review($1, $2, 'fake')`, [stranger, id]), 'not_found')
      await db.svc.query(`select public.dispute_review($1, $2, 'Never worked with this person')`, [ok.live.userId, id])
      // a dispute does NOT take the review down; it goes to a person, and can only be raised once
      expect((await db.asUser(stranger, (c) => c.query('select id from public.reviews where id = $1', [id]))).rows.length).toBe(1)
      expect((await db.root.query('select dispute_open from public.reviews where id = $1', [id])).rows[0].dispute_open).toBe(true)
      await fails(db.asUser(stranger, (c) => c.query('select dispute_reason from public.reviews')), /permission denied/)
      await db.svc.query(`select public.moderate_review($1, $2, 'published')`, [admin, id])
      await fails(db.svc.query(`select public.dispute_review($1, $2, 'again')`, [ok.live.userId, id]), 'not_found')
      // other people cannot see who wrote a review or which inquiry it came from
      await fails(db.asUser(stranger, (c) => c.query('select author_user_id from public.reviews')), /permission denied/)
      await fails(db.asUser(stranger, (c) => c.query('select inquiry_id from public.reviews')), /permission denied/)
    })

    it('two submits at once create one review', async () => {
      const ok = await setup()
      const out = await Promise.allSettled([review(ok.client, ok.id), review(ok.client, ok.id), review(ok.client, ok.id)])
      expect(out.filter((o) => o.status === 'fulfilled').length).toBe(1)
    })

    it("a review from the creator's own network address is flagged for the moderator", async () => {
      const user = await makeUser(db)
      const creatorId = await apply(db, user, { ip: 'iphash-1' })
      await db.svc.query('select public.approve_application($1, $2, (select updated_at from public.creators where id = $2))', [admin, creatorId])
      await syncState(db, creatorId, 'trialing', 'sub_sus')
      const sock = await makeUser(db, { ageDays: 60 })
      const id = (await inquire(sock, creatorId, MSG, 'iphash-1')).rows[0].id
      await db.svc.query(`select public.post_message($1, $2, 'Thanks me!')`, [user, id])
      await db.root.query(`update public.inquiries set created_at = now() - interval '10 days' where id = $1`, [id])
      const rid = (await review(sock, id, 'other')).rows[0].id
      expect((await db.root.query('select suspect, status from public.reviews where id = $1', [rid])).rows[0]).toEqual({ suspect: true, status: 'pending' })
    })
  })
})
