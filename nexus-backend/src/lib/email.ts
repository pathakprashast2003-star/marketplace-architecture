import { rpc } from './db'
import { env } from './env'
import { sign } from './http'
import { report } from './observe'

type Payload = Record<string, unknown>
type Rendered = { subject: string; lines: string[]; cta?: { label: string; path: string } }

const s = (v: unknown, fallback = ''): string => (v === null || v === undefined ? fallback : String(v))
const day = (v: unknown): string => {
  const d = new Date(s(v))
  return Number.isNaN(d.getTime()) ? '' : d.toISOString().slice(0, 10)
}

// One function per email. Plain words, no promises the product does not keep.
const TEMPLATES: Record<string, (p: Payload) => Rendered> = {
  waitlist_confirm: (p) => ({
    subject: "You're on the Nexus list",
    lines: [
      p.role === 'creator' ? 'Thanks for your interest in listing on Nexus.' : 'We saved your request.',
      "We'll email you when matching creators near you are approved.",
      'We only email you about this request.',
    ],
  }),
  application_received: (p) => ({
    subject: 'We got your Nexus application',
    lines: [`Hi ${s(p.name, 'there')},`, 'A person reviews every application. You can keep building your profile while you wait.'],
    cta: { label: 'Check your application', path: '/application-status' },
  }),
  application_approved: (p) => ({
    subject: p.founding_number ? `You're Founding creator #${s(p.founding_number)}` : "You're approved on Nexus",
    lines: [
      `Hi ${s(p.name, 'there')}, your profile is approved.`,
      `Your ${s(p.trial_days)} free days started today. Add a card to go live: nothing is charged until the free days end.`,
      'Please finish within 30 days or the approval lapses.',
    ],
    cta: { label: 'Go live', path: '/billing' },
  }),
  application_rejected: (p) => ({
    subject: 'About your Nexus application',
    lines: [`Hi ${s(p.name, 'there')},`, "We can't approve your profile yet.", p.reason ? `Reviewer's note: ${s(p.reason)}` : '', 'You can update it and apply again.'],
    cta: { label: 'Update and re-apply', path: '/apply' },
  }),
  approval_reminder: (p) => ({
    subject: 'Your Nexus profile is approved but not live yet',
    lines: [`Hi ${s(p.name, 'there')},`, `Add a card to go live. Your approval lapses on ${day(p.expires_at)}.`],
    cta: { label: 'Go live', path: '/billing' },
  }),
  approval_expired: (p) => ({
    subject: 'Your Nexus approval has lapsed',
    lines: [`Hi ${s(p.name, 'there')},`, 'You did not finish setting up within 30 days, so the approval lapsed. You can apply again any time.'],
    cta: { label: 'Apply again', path: '/apply' },
  }),
  trial_ending: (p) => ({
    subject: `Your free days end in ${s(p.days_left)} days`,
    lines: [
      `Hi ${s(p.name, 'there')},`,
      `So far your profile has received ${s(p.inquiries, '0')} inquiries and ${s(p.saves, '0')} saves.`,
      `Your free period ends on ${day(p.trial_ends_at)}. After that it is $19.99 a month, 0% commission. You can cancel any time.`,
    ],
    cta: { label: 'Manage billing', path: '/billing' },
  }),
  profile_hidden_payment: (p) => ({
    subject: 'Your Nexus profile is hidden',
    lines: [`Hi ${s(p.name, 'there')},`, 'Your payment did not go through, so your profile is hidden for now. Update your card and it comes back straight away.'],
    cta: { label: 'Update card', path: '/billing' },
  }),
  inquiry_new: (p) => ({
    subject: `New inquiry from ${s(p.client_name, 'a client')}`,
    lines: [
      `Hi ${s(p.creator_name, 'there')}, you have a new inquiry.`,
      p.event_date ? `Date: ${s(p.event_date)}` : '',
      p.budget ? `Budget: ${s(p.budget)}` : '',
      `"${s(p.snippet)}"`,
      'Reply from your Nexus inbox. Fast replies rank higher.',
    ],
    cta: { label: 'Open inbox', path: `/inbox?i=${encodeURIComponent(s(p.inquiry_id))}` },
  }),
  message_new: (p) => ({
    subject: `New message from ${s(p.from_name, 'Nexus')}`,
    lines: [`"${s(p.snippet)}"`],
    cta: { label: 'Reply', path: `/inbox?i=${encodeURIComponent(s(p.inquiry_id))}` },
  }),
  weekly_digest: (p) => ({
    subject: `You got ${s(p.inquiries, '0')} inquiries this week`,
    lines: [
      `Hi ${s(p.name, 'there')},`,
      `Inquiries this week: ${s(p.inquiries, '0')}. Waiting for your reply: ${s(p.unanswered, '0')}.`,
      Number(p.inquiries) === 0 ? 'Tip: profiles with a cover image, three or more photos and a price get found more often.' : '',
    ],
    cta: { label: 'Open inbox', path: '/inbox' },
  }),
}

const esc = (t: string) => t.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;')

export function unsubscribeToken(email: string): string {
  return `${Buffer.from(email).toString('base64url')}.${sign(`unsub:${email}`)}`
}

export function render(template: string, payload: Payload, to: string, stream: string) {
  const make = TEMPLATES[template]
  if (!make) throw new Error(`unknown email template: ${template}`)
  const r = make(payload)
  const base = env().APP_URL.replace(/\/$/, '')
  const lines = r.lines.filter(Boolean)
  const unsub = stream === 'marketing' ? `${base}/api/unsubscribe?t=${unsubscribeToken(to)}` : null
  const text = [...lines, r.cta ? `${r.cta.label}: ${base}${r.cta.path}` : '', unsub ? `Unsubscribe: ${unsub}` : ''].filter(Boolean).join('\n\n')
  const html =
    `<div style="font-family:system-ui,sans-serif;font-size:16px;line-height:1.5;color:#0F172A;max-width:520px">` +
    lines.map((l) => `<p>${esc(l)}</p>`).join('') +
    (r.cta ? `<p><a href="${esc(base + r.cta.path)}" style="display:inline-block;padding:12px 20px;border-radius:999px;background:#3B54EE;color:#fff;text-decoration:none">${esc(r.cta.label)}</a></p>` : '') +
    (unsub ? `<p style="font-size:13px;color:#64748B"><a href="${esc(unsub)}">Unsubscribe</a></p>` : '') +
    `</div>`
  const headers: Record<string, string> = unsub
    ? { 'List-Unsubscribe': `<${unsub}>`, 'List-Unsubscribe-Post': 'List-Unsubscribe=One-Click' }
    : {}
  // No line breaks in subjects (header injection).
  return { subject: r.subject.replace(/[\r\n]+/g, ' ').slice(0, 150), text, html, headers }
}

type OutboxRow = { id: string; to_email: string; template: string; payload: Payload; stream: string }

export type Sender = (m: { id: string; from: string; to: string; subject: string; text: string; html: string; headers: Record<string, string> }) => Promise<void>

export const resendSender: Sender = async (m) => {
  const res = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: {
      authorization: `Bearer ${env().RESEND_API_KEY}`,
      'content-type': 'application/json',
      'idempotency-key': `outbox-${m.id}`, // a retry after a crash cannot send twice
    },
    body: JSON.stringify({ from: m.from, to: [m.to], subject: m.subject, text: m.text, html: m.html, headers: m.headers }),
    signal: AbortSignal.timeout(8000),
  })
  if (!res.ok) throw new Error(`resend ${res.status}`)
}

/** Sends queued emails. Safe to run from several places at once: each email is claimed by one worker. */
export async function processOutbox(limit = 25, send: Sender = resendSender): Promise<{ sent: number; failed: number }> {
  const rows = await rpc<OutboxRow[]>('claim_outbox', { p_limit: limit })
  let sent = 0
  let failed = 0
  for (const row of rows ?? []) {
    try {
      const m = render(row.template, row.payload ?? {}, row.to_email, row.stream)
      const from = row.stream === 'inquiry' ? env().EMAIL_FROM_INQUIRY : env().EMAIL_FROM_ACCOUNT
      await send({ id: row.id, from, to: row.to_email, ...m })
      await rpc('outbox_sent', { p_id: row.id })
      sent++
    } catch (e) {
      failed++
      const message = e instanceof Error ? e.message : String(e)
      await rpc('outbox_failed', { p_id: row.id, p_error: message }).catch((err) => report(err, 'outbox_failed'))
    }
  }
  return { sent, failed }
}

/** Kick the queue right after a request finishes, so people are not waiting for the next scheduled run. */
export function flushSoon() {
  return processOutbox(10).catch((e) => report(e, 'flushSoon'))
}
