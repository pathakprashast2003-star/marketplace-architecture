import pg from 'pg'
import { randomUUID } from 'node:crypto'

const BASE = process.env.TEST_PG_URL ?? 'postgres://postgres@127.0.0.1:54329'
export const hasPg = !process.env.NEXUS_NO_PG

export type Db = {
  root: pg.Pool // superuser: test setup only
  svc: pg.Pool // the server (service_role): what the API uses
  close: () => Promise<void>
  asUser: <T>(uid: string | null, fn: (c: pg.PoolClient) => Promise<T>) => Promise<T>
}

/** A private copy of the template database for one test file. */
export async function freshDb(): Promise<Db> {
  const name = `nexus_t_${randomUUID().replace(/-/g, '').slice(0, 12)}`
  const admin = new pg.Client({ connectionString: `${BASE}/postgres` })
  await admin.connect()
  // Template copies cannot run at the same time; take a lock so parallel test files queue.
  await admin.query('select pg_advisory_lock(4242)')
  await admin.query(`create database ${name} template nexus_tpl`)
  await admin.query('select pg_advisory_unlock(4242)')
  await admin.end()
  const root = new pg.Pool({ connectionString: `${BASE}/${name}`, max: 5 })
  const svc = new pg.Pool({ connectionString: `${BASE}/${name}`, max: 40, options: '-c role=service_role' })
  root.on('error', () => {})
  svc.on('error', () => {})
  return {
    root,
    svc,
    async close() {
      await root.end()
      await svc.end()
      const a = new pg.Client({ connectionString: `${BASE}/postgres` })
      await a.connect()
      await a.query(`drop database if exists ${name} with (force)`)
      await a.end()
    },
    /** Runs queries exactly as a browser client would: role anon or authenticated, RLS on. */
    async asUser(uid, fn) {
      const c = await root.connect()
      try {
        await c.query('begin')
        await c.query(`set local role ${uid ? 'authenticated' : 'anon'}`)
        await c.query(`select set_config('request.jwt.claim.sub', $1, true)`, [uid ?? ''])
        return await fn(c)
      } finally {
        await c.query('rollback')
        c.release()
      }
    },
  }
}

let n = 0
export async function makeUser(
  db: Db,
  o: { verified?: boolean; dob?: string | null; ageDays?: number; email?: string } = {},
): Promise<string> {
  const email = o.email ?? `u${++n}_${randomUUID().slice(0, 8)}@example.com`
  const { rows } = await db.root.query(
    `insert into auth.users (email, email_confirmed_at, created_at)
     values ($1, case when $2 then now() else null end, now() - make_interval(days => $3)) returning id`,
    [email, o.verified ?? true, o.ageDays ?? 30],
  )
  const id = rows[0].id as string
  if (o.dob !== null) await db.svc.query('select public.complete_profile($1, $2, $3)', [id, 'Test User', o.dob ?? '1990-01-01'])
  return id
}

export async function makeAdmin(db: Db): Promise<string> {
  const id = await makeUser(db)
  await db.root.query(`update public.user_roles set role = 'admin' where user_id = $1`, [id])
  return id
}

export async function apply(db: Db, userId: string, o: { portfolio?: string; name?: string; ip?: string } = {}): Promise<string> {
  const { rows } = await db.svc.query(
    `select public.submit_application($1, $2, 'film', 'Austin', 'TX', 'US', $3, false, 50000, 'Wedding films', 'tiktok', null, $4) as id`,
    [userId, o.name ?? 'Test Creator', o.portfolio ?? `https://example.com/${randomUUID()}`, o.ip ?? null],
  )
  return rows[0].id as string
}

/** A creator who is approved and on a live trial (publicly visible). */
export async function liveCreator(db: Db, adminId: string): Promise<{ userId: string; creatorId: string }> {
  const userId = await makeUser(db)
  const creatorId = await apply(db, userId)
  await db.svc.query('select public.approve_application($1, $2, (select updated_at from public.creators where id = $2))', [adminId, creatorId])
  await syncState(db, creatorId, 'trialing', `sub_${randomUUID()}`)
  return { userId, creatorId }
}

/** Expects the query to fail with the given short error code. */
export async function fails(p: Promise<unknown>, code: string | RegExp): Promise<void> {
  let err: Error | null = null
  try {
    await p
  } catch (e) {
    err = e as Error
  }
  if (!err) throw new Error(`expected failure "${code}" but the call succeeded`)
  const ok = typeof code === 'string' ? err.message === code : code.test(err.message)
  if (!ok) throw new Error(`expected failure "${code}" but got "${err.message}"`)
}

/** What the server does on every Stripe sync: take a number, then write what Stripe said. */
export async function syncState(db: Db, creatorId: string, status: string | null, subId?: string, gen?: number) {
  const g = gen ?? (await beginSync(db, creatorId))
  return (await db.svc.query('select public.apply_billing_state($1, $2, $3, false, $4) as r', [creatorId, subId ?? `sub_x_${creatorId}`, status, g])).rows[0].r
}
export async function beginSync(db: Db, creatorId: string): Promise<number> {
  return Number((await db.svc.query('select public.begin_billing_sync($1) as g', [creatorId])).rows[0].g)
}
