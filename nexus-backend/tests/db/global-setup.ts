// Builds a template database (Supabase stand-in + all migrations) once per test run.
import pg from 'pg'
import fs from 'node:fs'
import path from 'node:path'

const BASE = process.env.TEST_PG_URL ?? 'postgres://postgres@127.0.0.1:54329'

export default async function setup() {
  const admin = new pg.Client({ connectionString: `${BASE}/postgres` })
  try {
    await admin.connect()
  } catch {
    console.warn('\n[tests] No Postgres at TEST_PG_URL; database tests will be skipped.\n')
    process.env.NEXUS_NO_PG = '1'
    return
  }
  await admin.query('drop database if exists nexus_tpl with (force)')
  await admin.query('create database nexus_tpl')
  await admin.end()
  const tpl = new pg.Client({ connectionString: `${BASE}/nexus_tpl` })
  await tpl.connect()
  const root = path.resolve(__dirname, '../..')
  const files = [
    'tests/db/supabase_stub.sql',
    ...fs.readdirSync(path.join(root, 'supabase/migrations')).sort().map((f) => `supabase/migrations/${f}`),
  ]
  for (const f of files) {
    try {
      await tpl.query(fs.readFileSync(path.join(root, f), 'utf8'))
    } catch (e) {
      throw new Error(`Migration ${f} failed: ${(e as Error).message}`)
    }
  }
  await tpl.end()
}
