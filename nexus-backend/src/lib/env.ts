import { z } from 'zod'

// Every secret comes from environment variables and is read on the server only.
const schema = z.object({
  APP_URL: z.url(),
  ALLOWED_ORIGINS: z.string().optional(), // extra origins allowed to call the waitlist (comma separated)
  NEXT_PUBLIC_SUPABASE_URL: z.url(),
  NEXT_PUBLIC_SUPABASE_ANON_KEY: z.string().min(20),
  SUPABASE_SERVICE_ROLE_KEY: z.string().min(20),
  STRIPE_SECRET_KEY: z.string().startsWith('sk_'),
  STRIPE_WEBHOOK_SECRET: z.string().startsWith('whsec_'),
  STRIPE_PRICE_ID: z.string().startsWith('price_'),
  RESEND_API_KEY: z.string().min(10),
  EMAIL_FROM_ACCOUNT: z.string().min(5), // e.g. "Nexus <hello@mail.nexus.com>"
  EMAIL_FROM_INQUIRY: z.string().min(5), // separate subdomain, e.g. "Nexus <inbox@msg.nexus.com>"
  TURNSTILE_SECRET_KEY: z.string().min(10).optional(),
  CRON_SECRET: z.string().min(24),
  HASH_SECRET: z.string().min(24), // for hashing IPs and signing unsubscribe links
})

export type Env = z.infer<typeof schema>
let cached: Env | null = null

export function env(): Env {
  if (cached) return cached
  const parsed = schema.safeParse(process.env)
  if (!parsed.success) {
    const missing = parsed.error.issues.map((i) => i.path.join('.')).join(', ')
    throw new Error(`Server is missing or has invalid settings: ${missing}`)
  }
  if (process.env.NODE_ENV === 'production' && !parsed.data.TURNSTILE_SECRET_KEY) {
    throw new Error('Server is missing TURNSTILE_SECRET_KEY')
  }
  cached = parsed.data
  return cached
}

export function allowedOrigins(): string[] {
  const e = env()
  const extra = (e.ALLOWED_ORIGINS ?? '').split(',').map((s) => s.trim()).filter(Boolean)
  return [new URL(e.APP_URL).origin, ...extra.map((o) => new URL(o).origin)]
}
