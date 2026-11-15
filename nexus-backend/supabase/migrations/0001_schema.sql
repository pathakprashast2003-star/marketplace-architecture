-- Nexus backend: tables.
-- Rule: clients (anon / authenticated) only ever READ through row-level security.
-- Every write goes through the server (service role) calling the functions in 0002.
begin;

-- Supabase grants everything on new public objects to anon/authenticated by default.
-- Turn that off so nothing is exposed unless this migration grants it on purpose.
alter default privileges in schema public revoke all on tables from anon, authenticated;
alter default privileges in schema public revoke all on sequences from anon, authenticated;
alter default privileges in schema public revoke execute on functions from anon, authenticated;
-- PUBLIC's default right to run new functions can only be removed globally (not per schema).
alter default privileges revoke execute on functions from public;

create type public.creator_status as enum
  ('applied', 'approved', 'trialing', 'active', 'past_due', 'hidden', 'canceled', 'rejected');
create type public.user_role as enum ('client', 'creator', 'admin');
create type public.age_gate as enum ('pending', 'passed', 'blocked');

-- ── Settings the admin can change without a deploy ──────────────────────────
create table public.app_settings (
  key text primary key,
  value jsonb not null,
  updated_at timestamptz not null default now()
);
insert into public.app_settings (key, value) values
  ('grace_days', '7'),
  ('min_completeness', '40'),
  ('ranking_mode', '"launch"'),          -- "launch" or "weighted"
  ('founding_limit', '100'),
  ('founding_trial_days', '90'),
  ('standard_trial_days', '30'),
  ('approval_expiry_days', '30');

-- ── People ──────────────────────────────────────────────────────────────────
create table public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  display_name text check (char_length(display_name) between 1 and 80),
  date_of_birth date,
  age_gate public.age_gate not null default 'pending',
  created_at timestamptz not null default now()
);

-- Roles live here, never in user_metadata (users can edit their own metadata).
create table public.user_roles (
  user_id uuid primary key references auth.users (id) on delete cascade,
  role public.user_role not null default 'client',
  updated_at timestamptz not null default now()
);

-- ── Catalogue ───────────────────────────────────────────────────────────────
create table public.categories (
  slug text primary key check (slug ~ '^[a-z0-9-]{2,40}$'),
  name text not null,
  grp text not null check (grp in ('pro', 'learn')),
  sort int not null default 0
);
insert into public.categories (slug, name, grp, sort) values
  ('film', 'Film & video', 'pro', 1),
  ('aerial', 'Aerial & drone', 'pro', 2),
  ('photo', 'Photography', 'pro', 3),
  ('art', 'Illustration & art', 'pro', 4),
  ('d3', '3D & motion', 'pro', 5),
  ('other', 'Other creative', 'pro', 9),
  ('class', 'Classes', 'learn', 10),
  ('pottery', 'Pottery', 'learn', 11),
  ('crochet', 'Crochet & knitting', 'learn', 12),
  ('painting', 'Painting & drawing', 'learn', 13),
  ('cooking', 'Cooking & baking', 'learn', 14),
  ('music', 'Music lessons', 'learn', 15);

-- ── Creators (one row per creator, one status that everything reads) ─────────
create table public.creators (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null unique references auth.users (id) on delete cascade,
  slug text not null unique check (slug ~ '^[a-z0-9-]{3,80}$'),
  status public.creator_status not null default 'applied',
  hidden_reason text check (hidden_reason in ('payment', 'admin')),
  canceled_reason text check (canceled_reason in ('subscription_ended', 'approval_expired')),
  -- public profile
  display_name text not null check (char_length(display_name) between 2 and 80),
  headline text check (char_length(headline) <= 140),
  about text check (char_length(about) <= 4000),
  category_slug text not null references public.categories (slug),
  city text not null check (char_length(city) between 2 and 80),
  region text check (char_length(region) <= 80),
  country text check (char_length(country) <= 80),
  works_remote boolean not null default false,
  starting_price_cents int check (starting_price_cents between 0 and 100000000),
  price_on_request boolean not null default false,
  portfolio_url text check (portfolio_url ~* '^https?://[^\s]+$' and char_length(portfolio_url) <= 500),
  website_url text check (website_url ~* '^https?://[^\s]+$' and char_length(website_url) <= 500),
  instagram_url text check (instagram_url ~* '^https://(www\.)?instagram\.com/[^\s]+$' and char_length(instagram_url) <= 300),
  avatar_path text check (char_length(avatar_path) <= 300),
  cover_path text check (char_length(cover_path) <= 300),
  -- founding + review
  founding_number int unique check (founding_number between 1 and 100),
  approved_at timestamptz,
  reviewed_by uuid references auth.users (id) on delete set null,
  reviewed_at timestamptz,
  reject_reason text check (char_length(reject_reason) <= 500),
  applications_count int not null default 1,
  needs_review boolean not null default false,   -- big edits after approval
  portfolio_key text,                             -- normalised portfolio link, for duplicate checks
  duplicate_of uuid references public.creators (id) on delete set null,
  -- where they came from
  utm_source text check (char_length(utm_source) <= 100),
  ref_code text check (char_length(ref_code) <= 40),
  referral_code text not null unique default substr(replace(gen_random_uuid()::text, '-', ''), 1, 10),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check (hidden_reason is null or status = 'hidden'),
  check (founding_number is null or approved_at is not null)
);
create index creators_status_idx on public.creators (status);
create index creators_category_city_idx on public.creators (category_slug, lower(city));
create index creators_portfolio_key_idx on public.creators (portfolio_key);

-- Private to the creator and the server: billing state, contact details.
create table public.creator_billing (
  creator_id uuid primary key references public.creators (id) on delete cascade,
  trial_days int,
  trial_ends_at timestamptz,
  approval_expires_at timestamptz,
  stripe_customer_id text unique,
  stripe_subscription_id text unique,
  stripe_status text,
  cancel_at_period_end boolean not null default false,
  synced_at timestamptz,            -- when Stripe was last read for this creator
  sync_gen bigint not null default 0,    -- every read of Stripe takes a number; only the newest may write
  applied_gen bigint not null default 0,
  past_due_since timestamptz,
  had_trial boolean not null default false,
  card_fingerprint text,
  trial_abuse boolean not null default false,
  apply_ip_hash text,
  contact_email text check (char_length(contact_email) <= 254),
  contact_phone text check (char_length(contact_phone) <= 40)
);
create index creator_billing_fp_idx on public.creator_billing (card_fingerprint);
create index creator_billing_past_due_idx on public.creator_billing (past_due_since) where past_due_since is not null;

-- Card fingerprints that already had a free trial. Kept after account deletion (no personal data:
-- an opaque Stripe hash), so deleting and re-joining does not buy a second trial.
create table public.used_card_fingerprints (
  fingerprint text primary key,
  creator_id uuid,                       -- no foreign key on purpose: must outlive the creator
  first_seen timestamptz not null default now()
);

-- The Founding counter: one row, locked while a number is handed out.
create table public.founding_counter (
  id boolean primary key default true check (id),
  next_number int not null default 1 check (next_number between 1 and 101)
);
insert into public.founding_counter default values;

create table public.creator_claims (
  id uuid primary key default gen_random_uuid(),
  creator_id uuid not null references public.creators (id) on delete cascade,
  claim text not null check (char_length(claim) between 2 and 80),
  verified boolean not null default false,       -- false is shown as "self-reported"
  verified_by uuid references auth.users (id) on delete set null,
  created_at timestamptz not null default now(),
  unique (creator_id, claim)
);

create table public.services (
  id uuid primary key default gen_random_uuid(),
  creator_id uuid not null references public.creators (id) on delete cascade,
  kind text not null default 'service' check (kind in ('service', 'class')),
  title text not null check (char_length(title) between 2 and 100),
  description text check (char_length(description) <= 1000),
  price_cents int check (price_cents between 0 and 100000000),
  price_on_request boolean not null default false,
  -- class fields
  duration_minutes int check (duration_minutes between 5 and 6000),
  group_size int check (group_size between 1 and 500),
  skill_level text check (skill_level in ('beginner', 'intermediate', 'advanced', 'all')),
  format text check (format in ('in_person', 'online', 'both')),
  sort int not null default 0,
  created_at timestamptz not null default now()
);
create index services_creator_idx on public.services (creator_id);

create table public.media (
  id uuid primary key default gen_random_uuid(),
  creator_id uuid not null references public.creators (id) on delete cascade,
  kind text not null check (kind in ('image', 'video_link')),
  storage_path text check (char_length(storage_path) <= 300),
  url text check (url ~* '^https://[^\s]+$' and char_length(url) <= 500),
  provider text check (provider in ('youtube', 'vimeo', 'tiktok')),
  status text not null default 'pending' check (status in ('pending', 'approved', 'removed')),
  sort int not null default 0,
  created_at timestamptz not null default now(),
  check ((kind = 'image' and storage_path is not null and url is null and provider is null)
      or (kind = 'video_link' and url is not null and provider is not null and storage_path is null))
);
create index media_creator_idx on public.media (creator_id);
-- one row per file: a second row for the same file could be used to delete and swap an approved image
create unique index media_storage_path_key on public.media (storage_path) where storage_path is not null;

-- ── Pre-launch waitlist (no account needed) ─────────────────────────────────
create table public.waitlist_leads (
  id uuid primary key default gen_random_uuid(),
  edit_token uuid not null unique default gen_random_uuid(),
  role text not null check (role in ('client', 'creator')),
  email text not null check (email = lower(email) and char_length(email) between 5 and 254),
  need text check (char_length(need) <= 300),
  craft text check (char_length(craft) <= 60),
  city text check (char_length(city) <= 80),
  event_date_text text check (char_length(event_date_text) <= 80),
  budget text check (char_length(budget) <= 40),
  utm_source text check (char_length(utm_source) <= 100),
  utm_medium text check (char_length(utm_medium) <= 100),
  utm_campaign text check (char_length(utm_campaign) <= 100),
  ref_code text check (char_length(ref_code) <= 40),
  landing text check (char_length(landing) <= 200),
  referral_code text not null unique default substr(replace(gen_random_uuid()::text, '-', ''), 1, 10),
  need_key text not null default '',
  ip_hash text,
  created_at timestamptz not null default now(),
  unique (email, role, need_key)
);
create index waitlist_city_idx on public.waitlist_leads (lower(city));

-- ── Saves ───────────────────────────────────────────────────────────────────
create table public.saves (
  user_id uuid not null references auth.users (id) on delete cascade,
  creator_id uuid not null references public.creators (id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (user_id, creator_id)
);

-- ── Inquiries (the core product) ────────────────────────────────────────────
create table public.inquiries (
  id uuid primary key default gen_random_uuid(),
  creator_id uuid not null references public.creators (id) on delete cascade,
  client_user_id uuid not null references auth.users (id) on delete cascade,
  client_name text not null check (char_length(client_name) between 1 and 80),
  event_date date,
  date_flexible boolean not null default false,
  budget text check (char_length(budget) <= 40),
  phone text check (char_length(phone) <= 40),
  people_count int check (people_count between 1 and 10000),
  status text not null default 'new' check (status in ('new', 'replied', 'closed', 'blocked')),
  ip_hash text,
  first_reply_at timestamptz,
  created_at timestamptz not null default now()
);
create index inquiries_creator_idx on public.inquiries (creator_id, created_at desc);
create index inquiries_client_idx on public.inquiries (client_user_id, created_at desc);

create table public.messages (
  id uuid primary key default gen_random_uuid(),
  inquiry_id uuid not null references public.inquiries (id) on delete cascade,
  sender_user_id uuid references auth.users (id) on delete set null,
  body text not null check (char_length(body) between 1 and 4000),
  created_at timestamptz not null default now()
);
create index messages_inquiry_idx on public.messages (inquiry_id, created_at);

create table public.blocks (
  creator_id uuid not null references public.creators (id) on delete cascade,
  blocked_user_id uuid not null references auth.users (id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (creator_id, blocked_user_id)
);

create table public.reports (
  id uuid primary key default gen_random_uuid(),
  reporter_user_id uuid references auth.users (id) on delete set null,
  target_type text not null check (target_type in ('creator', 'inquiry', 'message', 'media', 'review')),
  target_id uuid not null,
  reason text not null check (char_length(reason) between 5 and 1000),
  status text not null default 'open' check (status in ('open', 'actioned', 'dismissed')),
  handled_by uuid references auth.users (id) on delete set null,
  created_at timestamptz not null default now()
);
create index reports_open_idx on public.reports (created_at) where status = 'open';

-- ── Reviews (one per inquiry, held for moderation) ──────────────────────────
create table public.reviews (
  id uuid primary key default gen_random_uuid(),
  inquiry_id uuid not null unique references public.inquiries (id) on delete cascade,
  creator_id uuid not null references public.creators (id) on delete cascade,
  author_user_id uuid not null references auth.users (id) on delete cascade,
  rating int not null check (rating between 1 and 5),
  body text check (char_length(body) <= 2000),
  status text not null default 'pending' check (status in ('pending', 'published', 'rejected')),
  suspect boolean not null default false,
  dispute_reason text check (char_length(dispute_reason) <= 1000),
  disputed_at timestamptz,               -- a creator may dispute once; the review stays public meanwhile
  dispute_open boolean not null default false,
  created_at timestamptz not null default now()
);
create index reviews_creator_idx on public.reviews (creator_id) where status = 'published';

-- ── Ranking (written nightly, read by search) ───────────────────────────────
create table public.creator_rank (
  creator_id uuid primary key references public.creators (id) on delete cascade,
  completeness int not null default 0,
  launch_score numeric not null default 0,
  weighted_score numeric not null default 0,
  computed_at timestamptz not null default now()
);

-- ── Plumbing ────────────────────────────────────────────────────────────────
create table public.stripe_events (
  id text primary key,
  type text not null,
  created timestamptz not null,
  received_at timestamptz not null default now(),
  processed_at timestamptz,
  attempts int not null default 1,
  last_error text
);

create table public.email_outbox (
  id uuid primary key default gen_random_uuid(),
  to_email text not null check (char_length(to_email) between 5 and 254),
  template text not null,
  payload jsonb not null default '{}',
  stream text not null check (stream in ('inquiry', 'account', 'marketing')),
  status text not null default 'queued' check (status in ('queued', 'sending', 'sent', 'failed', 'dead')),
  attempts int not null default 0,
  next_attempt_at timestamptz not null default now(),
  locked_at timestamptz,
  last_error text,
  dedupe_key text unique,
  created_at timestamptz not null default now(),
  sent_at timestamptz
);
create index email_outbox_due_idx on public.email_outbox (next_attempt_at) where status in ('queued', 'failed', 'sending');

create table public.email_suppressions (
  email text primary key check (email = lower(email)),
  created_at timestamptz not null default now()
);

create table public.rate_limits (
  key text not null,
  window_start timestamptz not null,
  count int not null default 1,
  primary key (key, window_start)
);

create table public.admin_log (
  id bigint generated always as identity primary key,
  admin_user_id uuid references auth.users (id) on delete set null,
  action text not null,
  target_type text,
  target_id text,
  detail jsonb not null default '{}',
  created_at timestamptz not null default now()
);

commit;
