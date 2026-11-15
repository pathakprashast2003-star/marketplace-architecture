import { afterAll, beforeAll, describe, expect, it } from 'vitest'
import { apply, type Db, fails, freshDb, hasPg, makeAdmin, makeUser } from './helpers'

describe.skipIf(!hasPg)('founding 100: numbers are handed out under a lock', () => {
  let db: Db
  let admin: string
  beforeAll(async () => {
    db = await freshDb()
    admin = await makeAdmin(db)
  })
  afterAll(() => db.close())

  const approve = (id: string) => db.svc.query('select public.approve_application($1, $2, (select updated_at from public.creators where id = $2)) as r', [admin, id])

  it('130 approvals at the same moment give exactly numbers 1 to 100, once each', async () => {
    const ids: string[] = []
    for (let i = 0; i < 130; i++) ids.push(await apply(db, await makeUser(db)))
    expect((await db.asUser(null, (c) => c.query('select public.founding_spots_open() as n'))).rows[0].n).toBe(100)
    const results = await Promise.all(ids.map((id) => approve(id)))
    const numbers = results.map((r) => r.rows[0].r.founding_number).filter((x) => x !== null).sort((a, b) => a - b)
    expect(numbers).toEqual(Array.from({ length: 100 }, (_, i) => i + 1))
    const late = results.filter((r) => r.rows[0].r.founding_number === null)
    expect(late.length).toBe(30)
    expect(late.every((r) => r.rows[0].r.trial_days === 30)).toBe(true)
    expect(results.filter((r) => r.rows[0].r.trial_days === 90).length).toBe(100)
    expect((await db.root.query('select next_number from public.founding_counter')).rows[0].next_number).toBe(101)
    expect((await db.asUser(null, (c) => c.query('select public.founding_spots_open() as n'))).rows[0].n).toBe(0)
  })

  it('the trial clock starts at approval: 90 days for founders', async () => {
    const { rows } = await db.root.query(
      `select extract(epoch from (b.trial_ends_at - c.approved_at)) / 86400 as days,
              extract(epoch from (b.approval_expires_at - c.approved_at)) / 86400 as expiry
         from public.creators c join public.creator_billing b on b.creator_id = c.id where c.founding_number = 1`,
    )
    expect(Math.round(rows[0].days)).toBe(90)
    expect(Math.round(rows[0].expiry)).toBe(30)
  })

  it('approving the same creator twice at once succeeds once and uses one number', async () => {
    await db.root.query('update public.founding_counter set next_number = 50')
    await db.root.query('update public.creators set founding_number = null where founding_number >= 50')
    const id = await apply(db, await makeUser(db))
    const out = await Promise.allSettled([approve(id), approve(id), approve(id)])
    expect(out.filter((o) => o.status === 'fulfilled').length).toBe(1)
    expect(out.filter((o) => o.status === 'rejected').every((o) => (o as PromiseRejectedResult).reason.message === 'invalid_state')).toBe(true)
    expect((await db.root.query('select next_number from public.founding_counter')).rows[0].next_number).toBe(51)
  })

  it('two approvals racing for spot 100 cannot both win', async () => {
    await db.root.query('update public.founding_counter set next_number = 100')
    await db.root.query('update public.creators set founding_number = null where founding_number >= 100')
    const a = await apply(db, await makeUser(db))
    const b = await apply(db, await makeUser(db))
    const [ra, rb] = await Promise.all([approve(a), approve(b)])
    const nums = [ra.rows[0].r.founding_number, rb.rows[0].r.founding_number]
    expect(nums.filter((n) => n === 100).length).toBe(1)
    expect(nums.filter((n) => n === null).length).toBe(1)
  })

  it('the database itself refuses a 101st number or a repeated number', async () => {
    const id = await apply(db, await makeUser(db))
    await fails(db.root.query('update public.creators set founding_number = 101, approved_at = now() where id = $1', [id]), /check constraint/)
    await fails(db.root.query('update public.creators set founding_number = 100, approved_at = now() where id = $1', [id]), /unique constraint/)
    await fails(db.root.query('update public.founding_counter set next_number = 102'), /check constraint/)
  })

  it('a founder whose approval lapsed keeps the same number when approved again', async () => {
    await db.root.query('update public.founding_counter set next_number = 60')
    await db.root.query('update public.creators set founding_number = null where founding_number >= 60')
    const user = await makeUser(db)
    const id = await apply(db, user)
    const first = (await approve(id)).rows[0].r.founding_number
    expect(first).toBe(60)
    await db.root.query(`update public.creator_billing set approval_expires_at = now() - interval '1 day' where creator_id = $1`, [id])
    expect((await db.svc.query('select public.expire_approvals() as n')).rows[0].n).toBe(1)
    const st = (await db.root.query('select status, canceled_reason from public.creators where id = $1', [id])).rows[0]
    expect(st).toEqual({ status: 'canceled', canceled_reason: 'approval_expired' })
    await apply(db, user)
    const again = (await approve(id)).rows[0].r
    expect(again.founding_number).toBe(60)
    expect((await db.root.query('select next_number from public.founding_counter')).rows[0].next_number).toBe(61)
  })

  it('reminds at 7 days without checkout, once', async () => {
    const id = await apply(db, await makeUser(db))
    await approve(id)
    await db.root.query(`update public.creators set approved_at = now() - interval '8 days' where id = $1`, [id])
    await db.svc.query('select public.enqueue_approval_reminders()')
    await db.svc.query('select public.enqueue_approval_reminders()')
    const { rows } = await db.root.query(`select count(*)::int as n from public.email_outbox where template = 'approval_reminder' and dedupe_key like $1`, [`%${id}%`])
    expect(rows[0].n).toBe(1)
  })
})
