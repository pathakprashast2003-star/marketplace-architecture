import { afterAll, beforeAll, describe, expect, it } from 'vitest'
import { apply, type Db, fails, freshDb, hasPg, liveCreator, makeAdmin, makeUser } from './helpers'

describe.skipIf(!hasPg)('security: clients can only read what is theirs', () => {
  let db: Db
  let admin: string
  beforeAll(async () => {
    db = await freshDb()
    admin = await makeAdmin(db)
  })
  afterAll(() => db.close())

  it('every table has row-level security switched on', async () => {
    const { rows } = await db.root.query(
      `select relname from pg_class c join pg_namespace n on n.oid = c.relnamespace
        where n.nspname = 'public' and c.relkind = 'r' and not c.relrowsecurity`,
    )
    expect(rows).toEqual([])
  })

  it('clients cannot write to any table directly', async () => {
    const { rows } = await db.root.query(`select tablename from pg_tables where schemaname = 'public'`)
    expect(rows.length).toBeGreaterThan(20)
    const user = await makeUser(db)
    for (const { tablename } of rows) {
      for (const role of ['anon', 'authenticated']) {
        for (const priv of ['INSERT', 'UPDATE', 'DELETE', 'TRUNCATE']) {
          const r = await db.root.query(`select has_table_privilege($1, $2, $3) as ok`, [role, `public.${tablename}`, priv])
          expect(r.rows[0].ok, `${role} ${priv} ${tablename}`).toBe(false)
        }
      }
      // and no column-level write grants either
      const cols = await db.root.query(
        `select count(*)::int as n from information_schema.column_privileges
          where table_schema = 'public' and table_name = $1 and grantee in ('anon', 'authenticated')
            and privilege_type <> 'SELECT'`,
        [tablename],
      )
      expect(cols.rows[0].n, `column writes on ${tablename}`).toBe(0)
    }
    await fails(
      db.asUser(user, (c) => c.query(`update public.user_roles set role = 'admin' where user_id = $1`, [user])),
      /permission denied/,
    )
  })

  it('clients cannot call any function that changes data', async () => {
    const allowed = ['search_creators', 'creator_public', 'founding_spots_open', 'owns_creator', 'is_creator_visible', 'is_inquiry_participant', 'storage_creator_id', 'is_public_file', 'media_file_count', 'is_file_in_use', 'is_path_referenced']
    const { rows } = await db.root.query(
      `select p.proname, has_function_privilege('anon', p.oid, 'execute') as anon,
              has_function_privilege('authenticated', p.oid, 'execute') as auth
         from pg_proc p join pg_namespace n on n.oid = p.pronamespace where n.nspname = 'public'`,
    )
    expect(rows.length).toBeGreaterThan(40)
    const leaked = rows.filter((r) => (r.anon || r.auth) && !allowed.includes(r.proname)).map((r) => r.proname)
    expect(leaked).toEqual([])
  })

  it('anonymous visitors cannot read private tables', async () => {
    for (const t of ['creators', 'creator_billing', 'profiles', 'waitlist_leads', 'email_outbox', 'stripe_events', 'inquiries', 'messages', 'user_roles', 'admin_log', 'rate_limits', 'app_settings']) {
      await fails(db.asUser(null, (c) => c.query(`select * from public.${t} limit 1`)), /permission denied/)
    }
    const cats = await db.asUser(null, (c) => c.query('select count(*)::int as n from public.categories'))
    expect(cats.rows[0].n).toBeGreaterThan(5)
  })

  it("a user cannot read another user's profile, application, billing or role", async () => {
    const a = await makeUser(db)
    const b = await makeUser(db)
    const bCreator = await apply(db, b)
    const seen = await db.asUser(a, async (c) => ({
      profiles: (await c.query('select id from public.profiles')).rows.map((r) => r.id),
      creators: (await c.query('select id from public.creators')).rows,
      billing: (await c.query('select creator_id from public.creator_billing')).rows,
      roles: (await c.query('select user_id from public.user_roles')).rows.map((r) => r.user_id),
    }))
    expect(seen.profiles).toEqual([a])
    expect(seen.creators).toEqual([])
    expect(seen.billing).toEqual([])
    expect(seen.roles).toEqual([a])
    const own = await db.asUser(b, (c) => c.query('select id, status from public.creators'))
    expect(own.rows).toEqual([{ id: bCreator, status: 'applied' }])
  })

  it('internal columns are hidden even from the owner', async () => {
    const u = await makeUser(db)
    await apply(db, u)
    await fails(db.asUser(u, (c) => c.query('select duplicate_of from public.creators')), /permission denied/)
    await fails(db.asUser(u, (c) => c.query('select card_fingerprint from public.creator_billing')), /permission denied/)
    await fails(db.asUser(u, (c) => c.query('select stripe_customer_id from public.creator_billing')), /permission denied/)
    await fails(db.asUser(u, (c) => c.query('select date_of_birth from public.profiles')), /permission denied/)
    await fails(db.asUser(u, (c) => c.query('select ip_hash from public.inquiries')), /permission denied/)
  })

  it('a role written into user metadata gives no admin power', async () => {
    const u = await makeUser(db)
    await db.root.query(`update auth.users set raw_user_meta_data = '{"role":"admin"}' where id = $1`, [u])
    const target = await apply(db, await makeUser(db))
    await fails(db.svc.query('select public.approve_application($1, $2, (select updated_at from public.creators where id = $2))', [u, target]), 'forbidden')
    await fails(db.svc.query('select public.admin_set_hidden($1, $2, true, null)', [u, target]), 'forbidden')
    await fails(db.svc.query(`select public.reject_application($1, $2, 'x')`, [u, target]), 'forbidden')
    await fails(db.svc.query('select public.approve_application($1, $2, (select updated_at from public.creators where id = $2))', [null, target]), 'forbidden')
  })

  it('public search and profile pages only ever show live creators, with safe fields', async () => {
    const live = await liveCreator(db, admin)
    await db.svc.query(`select public.update_creator_profile($1, $2)`, [live.userId, JSON.stringify({ headline: 'Films', about: 'x'.repeat(90), price_on_request: true })])
    await db.svc.query(`select public.save_service($1, null, $2)`, [live.userId, JSON.stringify({ title: 'Wedding film', price_cents: 90000 })])
    const applied = await apply(db, await makeUser(db))
    const res = await db.asUser(null, (c) => c.query('select * from public.search_creators()'))
    const ids = res.rows.map((r) => r.id)
    expect(ids).toContain(live.creatorId)
    expect(ids).not.toContain(applied)
    expect(Object.keys(res.rows[0])).not.toContain('user_id')

    const slug = (await db.root.query('select slug from public.creators where id = $1', [live.creatorId])).rows[0].slug
    const page = await db.asUser(null, (c) => c.query('select public.creator_public($1) as p', [slug]))
    expect(page.rows[0].p.state).toBe('visible')
    expect(JSON.stringify(page.rows[0].p)).not.toMatch(/user_id|stripe|contact_email|portfolio_key/)

    await db.svc.query('select public.admin_set_hidden($1, $2, true, $3)', [admin, live.creatorId, 'test'])
    const hidden = await db.asUser(null, (c) => c.query('select public.creator_public($1) as p', [slug]))
    expect(hidden.rows[0].p).toEqual({ state: 'unavailable' })
    const res2 = await db.asUser(null, (c) => c.query('select id from public.search_creators()'))
    expect(res2.rows.map((r) => r.id)).not.toContain(live.creatorId)

    const appliedSlug = (await db.root.query('select slug from public.creators where id = $1', [applied])).rows[0].slug
    const np = await db.asUser(null, (c) => c.query('select public.creator_public($1) as p', [appliedSlug]))
    expect(np.rows[0].p).toEqual({ state: 'not_found' })
  })

  it('media waits for approval before anyone else can see it; hostile links are refused', async () => {
    const live = await liveCreator(db, admin)
    const other = await makeUser(db)
    const m = (await db.svc.query(`select public.add_media($1, 'video_link', null, 'https://www.youtube.com/watch?v=abc') as id`, [live.userId])).rows[0].id
    const before = await db.asUser(other, (c) => c.query('select id from public.media where creator_id = $1', [live.creatorId]))
    expect(before.rows).toEqual([])
    const mine = await db.asUser(live.userId, (c) => c.query('select id from public.media where creator_id = $1', [live.creatorId]))
    expect(mine.rows.length).toBe(1)
    await db.svc.query(`select public.moderate_media($1, $2, 'approved')`, [admin, m])
    const after = await db.asUser(other, (c) => c.query('select id from public.media where creator_id = $1', [live.creatorId]))
    expect(after.rows.length).toBe(1)

    await fails(db.svc.query(`select public.add_media($1, 'video_link', null, 'https://evil.example.com/x')`, [live.userId]), 'invalid:url')
    await fails(db.svc.query(`select public.add_media($1, 'video_link', null, 'https://youtube.com.evil.io/x')`, [live.userId]), 'invalid:url')
    await fails(db.svc.query(`select public.add_media($1, 'video_link', null, 'javascript:alert(1)')`, [live.userId]), 'invalid:url')
    await fails(db.svc.query(`select public.add_media($1, 'image', $2, null)`, [live.userId, `${randomOther()}/a.png`]), 'invalid:storage_path')
    await fails(db.svc.query(`select public.add_media($1, 'image', $2, null)`, [live.userId, `${live.creatorId}/../x/a.png`]), 'invalid:storage_path')
  })

  it('storage: own folder only, a cap per creator, and only approved images are public', async () => {
    const live = await liveCreator(db, admin)
    const other = await liveCreator(db, admin)
    const put = (uid: string, name: string) => db.asUser(uid, (c) => c.query(`insert into storage.objects (bucket_id, name) values ('media', $1)`, [name]))
    await fails(put(other.userId, `${live.creatorId}/evil.png`), /row-level security/)
    await fails(put(live.userId, `${live.creatorId}/sub/dir.png`), /row-level security/) // no sub-folders
    await fails(put(live.userId, `not-a-uuid/x.png`), /row-level security/)
    // one creator filling their folder does not stop anyone else uploading
    for (let i = 0; i < 58; i++) await db.root.query(`insert into storage.objects (bucket_id, name) values ('media', $1)`, [`${live.creatorId}/f${i}.png`])
    // parallel uploads cannot slip past the cap together: 2 places left, 6 tries
    const burst = await Promise.allSettled(Array.from({ length: 6 }, (_, i) => db.asUser(live.userId, async (c) => { await c.query(`insert into storage.objects (bucket_id, name) values ('media', $1)`, [`${live.creatorId}/b${i}.png`]); await c.query('commit') })))
    expect(burst.filter((b) => b.status === 'fulfilled').length).toBe(2)
    await fails(put(live.userId, `${live.creatorId}/one-too-many.png`), /row-level security/)
    await db.root.query(`insert into storage.objects (bucket_id, name) values ('media', $1)`, [`${other.creatorId}/ok.png`])

    // public: nothing until an image is approved
    const pub = () => db.asUser(null, (c) => c.query(`select name from storage.objects where name like $1`, [`${live.creatorId}/%`]))
    expect((await pub()).rows).toEqual([])
    const m = (await db.svc.query(`select public.add_media($1, 'image', $2, null) as id`, [live.userId, `${live.creatorId}/f1.png`])).rows[0].id
    expect((await pub()).rows).toEqual([])
    await db.svc.query(`select public.moderate_media($1, $2, 'approved')`, [admin, m])
    expect((await pub()).rows).toEqual([{ name: `${live.creatorId}/f1.png` }])
    // removed by an admin: the link dies and the server is told which file to delete
    const path = (await db.svc.query(`select public.moderate_media($1, $2, 'removed') as p`, [admin, m])).rows[0].p
    expect(path).toBe(`${live.creatorId}/f1.png`)
    expect((await pub()).rows).toEqual([])
    // a new avatar on a live profile is visible but sends the profile back to the review queue
    await db.svc.query('select public.update_creator_profile($1, $2)', [live.userId, JSON.stringify({ avatar_path: `${live.creatorId}/f2.png` })])
    expect((await db.root.query('select needs_review from public.creators where id = $1', [live.creatorId])).rows[0].needs_review).toBe(true)
    expect((await pub()).rows).toEqual([{ name: `${live.creatorId}/f2.png` }])
    // the owner cannot delete (and so cannot swap) a file the public can see; other files they can
    const del = (name: string) => db.asUser(live.userId, async (c) => (await c.query(`delete from storage.objects where bucket_id = 'media' and name = $1`, [name])).rowCount)
    expect(await del(`${live.creatorId}/f2.png`)).toBe(0)
    const m3 = (await db.svc.query(`select public.add_media($1, 'image', $2, null) as id`, [live.userId, `${live.creatorId}/f3.png`])).rows[0].id
    await db.svc.query(`select public.moderate_media($1, $2, 'approved')`, [admin, m3])
    expect(await del(`${live.creatorId}/f3.png`)).toBe(0)
    await fails(put(live.userId, `${live.creatorId}/f3.png`), /row-level security|unique constraint/)
    await fails(db.asUser(live.userId, (c) => c.query(`update storage.objects set name = name where name = $1 returning 1`, [`${live.creatorId}/f3.png`])).then((r) => { if (r.rowCount === 0) throw new Error('row-level security: no rows') }), /row-level security/)
    // the same file cannot be registered twice (a second row could be deleted to free the path for a swap)
    await fails(db.svc.query(`select public.add_media($1, 'image', $2, null)`, [live.userId, `${live.creatorId}/f3.png`]), 'invalid:storage_path')
    // deleting a gallery row that is also the avatar keeps the file; the server is told to delete nothing
    const m2 = (await db.svc.query(`select public.add_media($1, 'image', $2, null) as id`, [live.userId, `${live.creatorId}/f2.png`])).rows[0].id
    expect((await db.svc.query('select public.delete_media($1, $2) as p', [live.userId, m2])).rows[0].p).toBeNull()
    // a path must hold a file before it can be registered or used as avatar/cover...
    await fails(db.svc.query(`select public.add_media($1, 'image', $2, null)`, [live.userId, `${live.creatorId}/later.png`]), 'invalid:storage_path')
    await fails(db.svc.query('select public.update_creator_profile($1, $2)', [live.userId, JSON.stringify({ cover_path: `${live.creatorId}/later.png` })]), 'invalid:cover_path')
    // ...and once registered (even while pending), the file cannot be deleted and re-uploaded with other bytes
    const pend = (await db.svc.query(`select public.add_media($1, 'image', $2, null) as id`, [live.userId, `${live.creatorId}/f4.png`])).rows[0].id
    await db.asUser(live.userId, (c) => c.query(`delete from storage.objects where bucket_id = 'media' and name = $1`, [`${live.creatorId}/f4.png`]))
    await fails(put(live.userId, `${live.creatorId}/f4.png`), /row-level security/)
    void pend
    // approval is tied to the version the admin saw: a swap after they opened it is refused
    const applicant = await makeUser(db)
    const appId = await apply(db, applicant)
    await db.root.query(`insert into storage.objects (bucket_id, name) values ('media', $1), ('media', $2)`, [`${appId}/ok.png`, `${appId}/bad.png`])
    await db.svc.query('select public.update_creator_profile($1, $2)', [applicant, JSON.stringify({ avatar_path: `${appId}/ok.png` })])
    const seen = (await db.root.query('select updated_at from public.creators where id = $1', [appId])).rows[0].updated_at
    await db.svc.query('select public.update_creator_profile($1, $2)', [applicant, JSON.stringify({ avatar_path: `${appId}/bad.png` })])
    await fails(db.svc.query('select public.approve_application($1, $2, $3)', [admin, appId, seen]), 'changed_since_viewed')
    await fails(db.svc.query('select public.approve_application($1, $2, null)', [admin, appId]), 'changed_since_viewed')
    // hidden creator: nothing loads
    await db.svc.query('select public.admin_set_hidden($1, $2, true, null)', [admin, live.creatorId])
    expect((await pub()).rows).toEqual([])
  })
})

function randomOther() {
  return '11111111-1111-4111-8111-111111111111'
}
