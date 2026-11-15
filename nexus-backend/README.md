# Nexus backend

Next.js (App Router) + Supabase + Stripe + Resend. Built with the robust-backend-loop skill:
plan, tests first, adversarial review, fix, gate.

## How it is put together

- **Browsers can only read.** Row-level security is on for every table and clients have no
  write permission anywhere. Every change goes through an API route, which checks who is
  calling (plus bot check and rate limits) and then calls a database function as the server.
- **The rules live in the database** (`supabase/migrations/0002_functions.sql`), so a bug in
  app code cannot skip them: the Founding 100 counter, the creator status machine, inquiry
  limits, review rules, the age gate.
- **One creator status**: `applied → approved → trialing → active → past_due → hidden → canceled`
  (plus `rejected`). Public = `trialing`, `active`, `past_due`.
- **Stripe events are hints.** Each one makes the server re-read the live subscription from
  Stripe; an older read can never overwrite a newer one. Events are recorded by id.
- **Email is queued** in `email_outbox`, sent by a worker, retried with backoff.

## Folders

| Path | What |
|---|---|
| `supabase/migrations/` | Tables, functions, security rules, storage. Run in order. |
| `supabase/rollback/down.sql` | Undoes the migrations (destroys data). |
| `src/lib/` | Shared server code: auth, validation, billing, email, guards. |
| `src/app/api/` | The routes (list below). |
| `tests/db/` | Database tests on a real Postgres (security, concurrency, billing, inquiries). |
| `tests/unit/` | Webhook, validation, redirect, email tests. |

## Routes

| Route | Who | What |
|---|---|---|
| `POST/PATCH /api/waitlist` | anyone | Pre-launch request; optional date and budget |
| `GET /api/founding` | anyone | Real number of Founding spots open |
| `POST /api/auth/otp`, `/api/auth/verify` | anyone | Email sign-in code |
| `GET /api/auth/google`, `/auth/callback` | anyone | Google sign-in |
| `POST /api/profile` | signed in | Name + date of birth (age gate) |
| `GET /api/me` | signed in | Dashboard data |
| `POST /api/apply` | verified adult | Creator application |
| `PATCH /api/creator`, `/api/creator/services`, `/media`, `/claims` | creator | Edit own profile |
| `GET /api/creators`, `/api/creators/[slug]` | anyone | Search and public profile |
| `GET /api/creators/[slug]/contact` | verified adult | Creator contact details |
| `POST /api/saves`, `/api/reports`, `/api/reviews` | signed in | Save, report, review |
| `POST /api/inquiries`, `/[id]/messages`, `/[id]/block` | verified adult | Inquiry pipeline |
| `POST /api/billing/checkout`, `/portal` | creator | Stripe Checkout and Customer Portal |
| `POST /api/stripe/webhook` | Stripe | Signature-checked, idempotent |
| `GET /api/cron/[outbox|grace|reconcile|nightly|weekly]` | scheduler | Needs `CRON_SECRET` |
| `/api/admin/*` | admin + MFA | Review queue, hide/unhide, moderation |
| `DELETE /api/account` | signed in | Delete everything |
| `GET/POST /api/unsubscribe` | link in email | Stop update emails |

## Setup (once the accounts exist)

1. **Supabase**: create a project. Run the four files in `supabase/migrations/` in order
   (SQL editor or `supabase db push`). Turn on point-in-time recovery / daily backups.
2. **Supabase Auth**:
   - Enable Email (set the email template to show the 6-digit `{{ .Token }}`) and Google.
   - Site URL = your domain. Redirect URLs: exactly `https://YOUR-DOMAIN/auth/callback` (no wildcards).
   - Turn on MFA (TOTP). Make Tyrone an admin:
     `update public.user_roles set role = 'admin' where user_id = '<his user id>';`
     He must enrol an authenticator app; admin routes refuse without it.
3. **Stripe** (test mode first): one product, one recurring price of $19.99/month → `STRIPE_PRICE_ID`.
   Webhook endpoint `https://YOUR-DOMAIN/api/stripe/webhook` with events:
   `checkout.session.completed`, `customer.subscription.*`, `invoice.paid`,
   `invoice.payment_failed`, `invoice.payment_action_required`, `customer.deleted`.
   Enable the Customer Portal (update card, cancel). Turn on Stripe's trial-ending and failed-payment emails.
4. **Resend**: verify two sending subdomains (one for account/billing email, one for inquiry
   email) with SPF, DKIM and DMARC.
5. **Cloudflare Turnstile**: create a widget; the secret goes in `TURNSTILE_SECRET_KEY`.
6. **Vercel**: import the repo, set every variable from `.env.example`. `vercel.json` schedules
   the jobs (the 5-minute and hourly ones need a paid Vercel plan; on the free plan point any
   scheduler at the same URLs with the `Authorization: Bearer <CRON_SECRET>` header).

## Tests

```
npm install
npm test            # needs a local Postgres; set TEST_PG_URL=postgres://user@host:port
npm run typecheck
npm run build
```

Without a Postgres the database tests are skipped and say so.

## Settings an admin can change without a deploy

Table `app_settings`: `grace_days` (7), `min_completeness` (40), `ranking_mode`
(`launch` or `weighted`), `founding_trial_days` (90), `standard_trial_days` (30),
`approval_expiry_days` (30).

## Not built yet

- Pages (sign-up, login, apply, dashboard, inbox, admin). Only the API exists.
- Sentry: `src/lib/observe.ts` logs scrubbed errors; run the Sentry wizard to forward them.
- City + category SEO pages, sitemap, structured data.
- Learner plan ($11.99) is waitlist only, as agreed.
