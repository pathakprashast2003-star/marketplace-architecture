import './setup-env'
import { NextRequest } from 'next/server'
import { describe, expect, it } from 'vitest'
import { z } from 'zod'
import { toHttpError } from '@/lib/db'
import { render, unsubscribeToken } from '@/lib/email'
import { hashIp, HttpError, json, readJson, route, safeEqual } from '@/lib/http'
import { scrub } from '@/lib/observe'
import { nextForIntent, safeNext } from '@/lib/redirects'
import * as S from '@/lib/schemas'

const req = (method: string, headers: Record<string, string> = {}, body?: string) =>
  new NextRequest('https://nexus.test/api/x', { method, headers, body })

describe('redirect allow-list', () => {
  it('only ever sends people to our own listed pages', () => {
    expect(safeNext('/apply')).toBe('/apply')
    for (const bad of ['https://evil.com', '//evil.com', '/\\evil.com', '/apply/../admin', '/apply?next=https://evil.com', 'javascript:alert(1)', '/unknown', '', null, undefined]) {
      expect(safeNext(bad as string)).toBe('/dashboard')
    }
    expect(nextForIntent('creator')).toBe('/signup?intent=creator')
    expect(nextForIntent('https://evil.com')).toBe('/signup?intent=client')
    expect(safeNext('/signup?intent=creator')).toBe('/signup?intent=creator')
    expect(safeNext('/signup?intent=creator&next=https://evil.com')).toBe('/dashboard')
  })
})

describe('request wrapper', () => {
  const ok = route(async () => json({ ok: true }))

  it('refuses writes posted from another website', async () => {
    expect((await ok(req('POST', { origin: 'https://evil.com' }), {})).status).toBe(403)
    expect((await ok(req('POST', { 'sec-fetch-site': 'cross-site' }), {})).status).toBe(403)
    expect((await ok(req('POST', { origin: 'https://nexus.test.evil.com' }), {})).status).toBe(403)
    expect((await ok(req('POST', { origin: 'https://nexus.test' }), {})).status).toBe(200)
    expect((await ok(req('POST', { origin: 'https://landing.nexus.test' }), {})).status).toBe(200)
    expect((await ok(req('GET', { origin: 'https://evil.com' }), {})).status).toBe(200) // reads carry no cookies' power to change anything
  })

  it('only adds cross-site headers for allowed sites', async () => {
    const open = route(async () => json({ ok: true }), { cors: true })
    expect((await open(req('GET', { origin: 'https://landing.nexus.test' }), {})).headers.get('access-control-allow-origin')).toBe('https://landing.nexus.test')
    expect((await open(req('GET', { origin: 'https://evil.com' }), {})).headers.get('access-control-allow-origin')).toBeNull()
  })

  it('hides internal error details from the caller', async () => {
    const boom = route(async () => {
      throw new Error('connection to db at 10.0.0.5 failed for user postgres password hunter2')
    })
    const res = await boom(req('GET'), {})
    expect(res.status).toBe(500)
    expect(await res.text()).toBe('{"error":"server_error"}')
  })

  it('turns bad input into a 400 that names fields, not values', async () => {
    const r = route(async (q) => json(await readJson(q, z.object({ email: z.email() }))))
    const res = await r(req('POST', { origin: 'https://nexus.test' }, JSON.stringify({ email: 'secret-not-an-email' })), {})
    expect(res.status).toBe(400)
    const text = await res.text()
    expect(text).toContain('"email"')
    expect(text).not.toContain('secret-not-an-email')
  })

  it('refuses oversized and malformed bodies', async () => {
    const schema = z.object({ a: z.string() })
    await expect(readJson(req('POST', {}, JSON.stringify({ a: 'x'.repeat(30_000) })), schema)).rejects.toMatchObject({ status: 413 })
    await expect(readJson(req('POST', { 'content-length': '999999999' }, '{}'), schema)).rejects.toMatchObject({ status: 413 })
    await expect(readJson(req('POST', {}, '{not json'), schema)).rejects.toMatchObject({ status: 400 })
    await expect(readJson(req('POST', {}, ''), schema)).rejects.toMatchObject({ status: 400 })
    await expect(readJson(req('POST', {}, '[]'), schema)).rejects.toBeInstanceOf(z.ZodError)
    await expect(readJson(req('POST', {}, '{"a":"x\\u0000y"}'), schema)).rejects.toMatchObject({ status: 400 })
  })

  it('helpers behave', () => {
    expect(safeEqual('abc', 'abc')).toBe(true)
    expect(safeEqual('abc', 'abd')).toBe(false)
    expect(safeEqual('abc', 'abcd')).toBe(false)
    expect(hashIp('1.2.3.4')).toBe(hashIp('1.2.3.4'))
    expect(hashIp('1.2.3.4')).not.toContain('1.2.3.4')
    expect(scrub('failed for jo@example.com with sk_live_abcdefgh1234')).toBe('failed for [email] with [secret]')
  })
})

describe('database errors become clean responses', () => {
  it('maps known codes and hides unknown ones', () => {
    expect(toHttpError({ code: 'P0001', message: 'rate_limited' })).toMatchObject({ status: 429 })
    expect(toHttpError({ code: 'P0001', message: 'forbidden' })).toMatchObject({ status: 403 })
    expect(toHttpError({ code: 'P0001', message: 'invalid:portfolio_url' })).toMatchObject({ status: 400, code: 'invalid_input' })
    expect(toHttpError({ code: '23514', message: 'violates check constraint "creators_city_check"' })).toMatchObject({ status: 400, code: 'invalid_input' })
    const unknown = toHttpError({ code: '42P01', message: 'relation "secret_table" does not exist' })
    expect(unknown).not.toBeInstanceOf(HttpError)
  })
})

describe('input rules', () => {
  it('waitlist: cleans the email and refuses junk', () => {
    const ok = S.waitlistCreate.parse({ email: '  Jo@Example.COM ', need: 'Drone pilot for a wedding', city: 'Austin' })
    expect(ok.email).toBe('jo@example.com')
    expect(ok.role).toBe('client')
    for (const bad of [
      { email: 'nope', need: 'Drone pilot', city: 'Austin' },
      { email: 'a@b.co', need: 'x', city: 'Austin' },
      { email: 'a@b.co', need: 'x'.repeat(301), city: 'Austin' },
      { email: 'a@b.co', need: 'Drone pilot', city: '' },
      { email: 'a@b.co', need: 'Drone pilot', city: 'Austin', role: 'admin' },
      { email: ['a@b.co'], need: 'Drone pilot', city: 'Austin' },
      null,
    ]) {
      expect(S.waitlistCreate.safeParse(bad).success, JSON.stringify(bad)).toBe(false)
    }
  })

  it('profile edits: unknown fields are refused outright (no way to send status, role or founding number)', () => {
    expect(S.creatorPatch.safeParse({ city: 'Dallas' }).success).toBe(true)
    for (const extra of ['status', 'founding_number', 'user_id', 'needs_review', 'role', 'stripe_customer_id']) {
      expect(S.creatorPatch.safeParse({ city: 'Dallas', [extra]: 'x' }).success, extra).toBe(false)
    }
    expect(S.creatorPatch.safeParse({ website_url: 'javascript:alert(1)' }).success).toBe(false)
    expect(S.creatorPatch.safeParse({ instagram_url: 'https://instagram.com.evil.io/me' }).success).toBe(false)
    expect(S.creatorPatch.safeParse({ instagram_url: 'https://www.instagram.com/me' }).success).toBe(true)
    expect(S.creatorPatch.safeParse({ starting_price_cents: -1 }).success).toBe(false)
    expect(S.creatorPatch.safeParse({ starting_price_cents: 1.5 }).success).toBe(false)
  })

  it('applications, inquiries, codes and admin actions', () => {
    expect(S.application.safeParse({ display_name: 'Jo Films', category: 'film', city: 'Austin', portfolio_url: 'https://vimeo.com/jo' }).success).toBe(true)
    expect(S.application.safeParse({ display_name: 'Jo Films', category: 'film', city: 'Austin' }).success).toBe(false) // portfolio is required
    expect(S.application.safeParse({ display_name: 'Jo Films', category: 'hacking', city: 'Austin', portfolio_url: 'https://vimeo.com/jo' }).success).toBe(false)
    expect(S.application.safeParse({ display_name: 'Jo Films', category: 'film', city: 'Austin', portfolio_url: 'ftp://x.y/z' }).success).toBe(false)
    expect(S.inquiryCreate.safeParse({ creator_id: 'not-a-uuid', name: 'Sam', message: 'x'.repeat(30) }).success).toBe(false)
    expect(S.inquiryCreate.safeParse({ creator_id: '6f1c2b2e-58a4-4b6f-9d0f-2f1d0f7a9a11', name: 'Sam', message: 'short' }).success).toBe(false)
    expect(S.inquiryCreate.safeParse({ creator_id: '6f1c2b2e-58a4-4b6f-9d0f-2f1d0f7a9a11', name: 'Sam', message: 'x'.repeat(30), event_date: '2027-02-30' }).success).toBe(false)
    expect(S.otpVerify.safeParse({ email: 'a@b.co', code: '12345' }).success).toBe(false)
    expect(S.otpVerify.safeParse({ email: 'a@b.co', code: '123456' }).success).toBe(true)
    expect(S.profileComplete.safeParse({ display_name: 'Jo', date_of_birth: '01/02/1990' }).success).toBe(false)
    expect(S.adminApplication.safeParse({ action: 'reject' }).success).toBe(false) // a reason is required
    expect(S.adminApplication.safeParse({ action: 'delete_everything' }).success).toBe(false)
    expect(S.mediaAdd.safeParse({ kind: 'video_link', url: 'http://youtube.com/x' }).success).toBe(false)
    expect(S.searchQuery.parse({ page: '3', min_price: '100' })).toMatchObject({ page: 3, min_price: 100 })
    expect(S.searchQuery.safeParse({ page: '0' }).success).toBe(false)
    expect(S.searchQuery.safeParse({ q: 'x'.repeat(81) }).success).toBe(false)
  })
})

describe('emails', () => {
  it('escapes what people typed, so a message cannot inject HTML or headers', () => {
    const m = render('inquiry_new', { client_name: '<script>alert(1)</script>\r\nBcc: x@evil.com', snippet: '<img src=x onerror=1>', inquiry_id: 'abc' }, 'c@example.com', 'inquiry')
    expect(m.html).not.toContain('<script>')
    expect(m.html).not.toContain('<img')
    expect(m.subject).not.toMatch(/[\r\n]/)
    expect(m.headers).toEqual({})
  })

  it('marketing emails carry a working unsubscribe link; account emails do not need one', () => {
    const m = render('weekly_digest', { name: 'Jo', inquiries: 0, unanswered: 0 }, 'jo@example.com', 'marketing')
    expect(m.text).toContain('/api/unsubscribe?t=')
    expect(m.headers['List-Unsubscribe']).toContain(unsubscribeToken('jo@example.com'))
    expect(m.headers['List-Unsubscribe-Post']).toBe('List-Unsubscribe=One-Click')
    expect(unsubscribeToken('jo@example.com')).not.toBe(unsubscribeToken('joe@example.com'))
    expect(render('application_approved', { name: 'Jo', founding_number: 7, trial_days: 90 }, 'jo@example.com', 'account').subject).toBe("You're Founding creator #7")
    expect(() => render('nope', {}, 'a@b.co', 'account')).toThrow()
  })

  it('every template the database queues can be rendered', () => {
    for (const t of ['waitlist_confirm', 'application_received', 'application_approved', 'application_rejected', 'approval_reminder', 'approval_expired', 'trial_ending', 'profile_hidden_payment', 'inquiry_new', 'message_new', 'weekly_digest']) {
      const m = render(t, {}, 'a@b.co', 'account')
      expect(m.subject.length).toBeGreaterThan(3)
      expect(m.text).not.toMatch(/undefined|null|NaN|Invalid Date/)
    }
  })
})
