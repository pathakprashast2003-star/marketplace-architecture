import { z } from 'zod'

const text = (max: number, min = 0) => z.string().trim().min(min).max(max)
const optText = (max: number) => z.string().trim().max(max).optional().nullable()
const email = z.string().trim().toLowerCase().max(254).pipe(z.email())
const token = z.string().max(2048).optional()
const httpUrl = z.url({ protocol: /^https?$/ }).max(500)
const cents = z.number().int().min(0).max(100_000_000)
const CATEGORIES = ['film', 'aerial', 'photo', 'art', 'd3', 'other', 'class', 'pottery', 'crochet', 'painting', 'cooking', 'music'] as const

export const waitlistCreate = z.object({
  role: z.enum(['client', 'creator']).default('client'),
  email,
  need: text(300, 3),
  craft: optText(60),
  city: text(80, 2),
  utm_source: optText(100),
  utm_medium: optText(100),
  utm_campaign: optText(100),
  ref: optText(40),
  landing: optText(200),
  turnstileToken: token,
})

export const waitlistDetails = z.object({
  edit_token: z.uuid(),
  date: optText(80),
  budget: optText(40),
})

export const otpRequest = z.object({ email, intent: z.enum(['creator', 'client']).optional(), turnstileToken: token })
export const otpVerify = z.object({ email, code: z.string().regex(/^\d{6}$/), intent: z.enum(['creator', 'client']).optional() })

export const profileComplete = z.object({
  display_name: text(80, 1),
  date_of_birth: z.iso.date(),
})

export const application = z.object({
  display_name: text(80, 2),
  category: z.enum(CATEGORIES),
  city: text(80, 2),
  region: optText(80),
  country: optText(80),
  portfolio_url: httpUrl,
  works_remote: z.boolean().default(false),
  starting_price_cents: cents.optional().nullable(),
  headline: optText(140),
  utm_source: optText(100),
  ref: optText(40),
  turnstileToken: token,
})

export const creatorPatch = z
  .object({
    display_name: text(80, 2),
    headline: text(140).nullable(),
    about: text(4000).nullable(),
    category_slug: z.enum(CATEGORIES),
    city: text(80, 2),
    region: text(80).nullable(),
    country: text(80).nullable(),
    works_remote: z.boolean(),
    starting_price_cents: cents.nullable(),
    price_on_request: z.boolean(),
    portfolio_url: httpUrl,
    website_url: httpUrl.nullable(),
    instagram_url: z.url({ protocol: /^https$/, hostname: /^(www\.)?instagram\.com$/ }).max(300).nullable(),
    avatar_path: text(300).nullable(),
    cover_path: text(300).nullable(),
    contact_email: email.nullable(),
    contact_phone: text(40).nullable(),
  })
  .partial()
  .strict()

export const service = z
  .object({
    kind: z.enum(['service', 'class']).default('service'),
    title: text(100, 2),
    description: optText(1000),
    price_cents: cents.optional().nullable(),
    price_on_request: z.boolean().default(false),
    duration_minutes: z.number().int().min(5).max(6000).optional().nullable(),
    group_size: z.number().int().min(1).max(500).optional().nullable(),
    skill_level: z.enum(['beginner', 'intermediate', 'advanced', 'all']).optional().nullable(),
    format: z.enum(['in_person', 'online', 'both']).optional().nullable(),
    sort: z.number().int().min(0).max(1000).default(0),
  })
  .strict()

export const mediaAdd = z.discriminatedUnion('kind', [
  z.object({ kind: z.literal('image'), storage_path: text(300, 10) }),
  z.object({ kind: z.literal('video_link'), url: z.url({ protocol: /^https$/ }).max(500) }),
])

export const claimAdd = z.object({ claim: text(80, 2) })

export const inquiryCreate = z.object({
  creator_id: z.uuid(),
  name: text(80, 1),
  event_date: z.iso.date().optional().nullable(),
  date_flexible: z.boolean().default(false),
  budget: optText(40),
  phone: optText(40),
  people: z.number().int().min(1).max(10_000).optional().nullable(),
  message: text(4000, 20),
  turnstileToken: token,
})

export const messageCreate = z.object({ body: text(4000, 1) })
export const saveSet = z.object({ creator_id: z.uuid(), on: z.boolean() })
export const reportCreate = z.object({
  target_type: z.enum(['creator', 'inquiry', 'message', 'media', 'review']),
  target_id: z.uuid(),
  reason: text(1000, 5),
})
export const reviewCreate = z.object({
  inquiry_id: z.uuid(),
  rating: z.number().int().min(1).max(5),
  body: optText(2000),
})
export const disputeCreate = z.object({ reason: text(1000, 5) })

export const adminApplication = z.discriminatedUnion('action', [
  z.object({ action: z.literal('approve'), seen_updated_at: z.iso.datetime({ offset: true }) }),
  z.object({ action: z.literal('reject'), reason: text(500, 3) }),
])
export const adminCreator = z.discriminatedUnion('action', [
  z.object({ action: z.literal('hide'), reason: optText(500) }),
  z.object({ action: z.literal('unhide') }),
  z.object({ action: z.literal('clear_review') }),
])
export const adminModeration = z.discriminatedUnion('type', [
  z.object({ type: z.literal('media'), id: z.uuid(), status: z.enum(['approved', 'removed']) }),
  z.object({ type: z.literal('review'), id: z.uuid(), status: z.enum(['published', 'rejected']) }),
  z.object({ type: z.literal('report'), id: z.uuid(), status: z.enum(['actioned', 'dismissed']) }),
  z.object({ type: z.literal('claim'), id: z.uuid(), verified: z.boolean() }),
])

export const searchQuery = z.object({
  q: z.string().max(80).optional(),
  category: z.enum(CATEGORIES).optional(),
  city: z.string().max(80).optional(),
  remote: z.enum(['true', 'false']).optional(),
  min_price: z.coerce.number().int().min(0).max(100_000_000).optional(),
  max_price: z.coerce.number().int().min(0).max(100_000_000).optional(),
  page: z.coerce.number().int().min(1).max(200).default(1),
})
