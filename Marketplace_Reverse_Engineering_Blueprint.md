# Forensic Reverse-Engineering Blueprint: Contra.com & The Knot / StyleSeat

**Target Architecture:** Bespoke Creator & Business Marketplace Web Platform ($7,200 Scope)**Engineering Stack:** Next.js (App Router), Tailwind CSS, PostgreSQL / Supabase, Stripe Billing, Cloudflare R2**Analyzed Benchmark Platforms:**

1. **Contra.com** *(Visual Engine, Creator Storefronts, Portfolio UX, Direct Chat)*
2. **The Knot / StyleSeat / Booksy** *(Directory Subscription Model, Vendor Vetting, Search Architecture)*

---

## 1. Executive Synthesis & Architectural Mapping

Tyrone’s specification is a fusion of two proven marketplace architectures:

```
┌────────────────────────────────────────────────────────────────────────┐
│                   TYRONE'S MARKETPLACE ARCHITECTURE                    │
└───────────────────────────────────┬────────────────────────────────────┘
                                    │
           ┌────────────────────────┴────────────────────────┐
           ▼                                                 ▼
┌───────────────────────────────┐         ┌───────────────────────────────┐
│       CONTRA.COM ENGINE       │         │   THE KNOT / STYLESEAT ENGINE │
├───────────────────────────────┤         ├───────────────────────────────┤
│ • Midnight-Dark UI System     │         │ • Paid Listing Subscriptions  │
│ • Creator Storefront Profiles │         │ • Zero Transaction Fee Cuts  │
│ • Photo/Video Portfolio Reels │         │ • Search by City & Category   │
│ • Structured Service Menus    │         │ • Admin Vetting / Gatekeeper  │
│ • In-Platform Direct Chat     │         │ • 90-Day Founding Supply Hook │
└───────────────────────────────┘         └───────────────────────────────┘
```

---

## 2. Platform 1 Reverse-Engineering: Contra.com (The Visual & Profile Engine)

Contra is the gold standard for independent creator discovery. Here is how their core frontend and profile subsystems are architected:

### 2.1 Design Tokens & Aesthetics

Contra uses high-contrast dark surfaces to make visual portfolios pop:

* **Background Primaries:** `#0B0F19` (Deep Obsidian / Midnight Navy) and `#111827` (Card Surface).
* **Accent & Interactive:** `#FF6B00` / `#F97316` (High-Energy Vibrant Orange for CTAs, active badges, and focus rings).
* **Borders & Dividers:** `1px solid rgba(255, 255, 255, 0.08)` — subtle glassmorphic separators that give depth without visual clutter.
* **Typography:** Clean geometric sans-serif (Inter / Plus Jakarta Sans) with high typographic hierarchy:
  * Section Headers: `font-semibold text-white tracking-tight`
  * Secondary Metadata: `text-sm text-slate-400 font-medium`

### 2.2 The Creator Storefront Anatomy (The `/[username]` Page)

Contra’s storefront layout is divided into 4 stacked modules:

```
┌────────────────────────────────────────────────────────────────────────┐
│ [Banner Image: 1200x320 Cover Photo / Video Loop]                      │
│                                                                        │
│  ┌──────────┐                                                          │
│  │  Avatar  │  Creator Name  [Verified Badge] [Founding Member Badge]  │
│  │ 120x120  │  Headline: "Commercial Videographer & Motion Director"   │
│  └──────────┘  Location: Austin, TX  •  Response Time: < 2 hours       │
│                [Message Seller (Orange CTA)]  [Save to Favorites]      │
└────────────────────────────────────────────────────────────────────────┘
│ Tabs: [ Services & Pricing ]  [ Portfolio / Media ]  [ About & Bio ]   │
├────────────────────────────────────────────────────────────────────────┤
│ SERVICE CARDS (Grid 2-col)             │ PORTFOLIO MEDIA REEL          │
│ ┌────────────────────────────────────┐ │ ┌────────────┐ ┌────────────┐ │
│ │ 4K Brand Commercial Reel          │ │ │ Video Reel │ │ High-Res   │ │
│ │ Starting at $1,200  •  5 Days Del. │ │ │ 16:9 WebM  │ │ Photo Grid │ │
│ │ [View Service & Inquire]           │ │ └────────────┘ └────────────┘ │
│ └────────────────────────────────────┘ │                               │
└────────────────────────────────────────────────────────────────────────┘
```

### 2.3 Discovery & Search Flow

Contra treats discoverability as a dynamic filter funnel:

1. **Category Pills Carousel:** Horizontal sticky bar (`Videography`, `Barbers`, `Web Design`, `Tattoo Artists`, `Fitness`). Clicking immediately sets URL params (`?cat=videography`).
2. **Omni-Search Input:** Real-time debounced search filtering by name, service keywords, or city.
3. **Storefront Card Grid:** Cards feature a **media thumbnail preview**, avatar badge, hourly/service starting price, and an instant "Message" modal trigger.

---

## 3. Platform 2 Reverse-Engineering: The Knot & StyleSeat (The Business & Directory Engine)

The Knot and StyleSeat proved that **creators hate 20% platform commissions** (Upwork/Fiverr model). Instead, they built multi-hundred-million-dollar businesses on **Flat Monthly Subscriptions**.

### 3.1 The Business & Monetization Architecture

* **Why Sellers Pay:** A wedding photographer charges $3,000 per wedding. On Upwork, Upwork takes $600. On The Knot, the photographer pays a flat $150/month fee to be listed in the directory and keeps 100% of the client's money.
* **The "Zero Escrow" Simplicity:** Because the platform does not process payments between buyer and seller, you do **not** need multi-vendor Stripe Connect split payouts, escrow holding accounts, or chargeback dispute liability.
* **Tyrone's Stripe Hook:**
  * First 100 Approved Sellers: **90-Day Free Trial** (`trial_period_days = 90`).
  * Seller 101+: **30-Day Free Trial** (`trial_period_days = 30`).
  * On Day 91 (or 31), Stripe automatically charges the recurring monthly card on file. If payment fails, the seller's profile is automatically unpublished from the public directory.

### 3.2 The Gatekeeper Funnel (Admin Approval Queue)

Open directories get overwhelmed with spam. StyleSeat and Product Hunt maintain quality through an approval queue:

1. **Seller Signs Up:** Submits portfolio link, sample photos, service menu, and social handles.
2. **Status Set to `PENDING_REVIEW`:** Seller can edit their preview profile, but their storefront is hidden from public search (`is_published = false`).
3. **Admin Command Center:** Tyrone receives notification, inspects profile, and clicks **[Approve]** or **[Reject]**.
4. **Approval Trigger:** Sets `approved_at = NOW()`, increments the founding member counter, starts the 90-day Stripe trial, and flips `is_published = true`.

---

## 4. Production Database Schema (PostgreSQL DDL)

Here is the exact normalized database schema required to power this system:

```sql
-- 1. ENUMS
CREATE TYPE user_role AS ENUM ('CUSTOMER', 'SELLER', 'ADMIN');
CREATE TYPE seller_status AS ENUM ('PENDING', 'APPROVED', 'REJECTED', 'SUSPENDED');
CREATE TYPE subscription_tier AS ENUM ('FOUNDING_90', 'STANDARD_30');
CREATE TYPE sub_status AS ENUM ('TRIALING', 'ACTIVE', 'PAST_DUE', 'CANCELED');

-- 2. USERS (Core Auth & Accounts)
CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    email TEXT UNIQUE NOT NULL,
    hashed_password TEXT,
    role user_role DEFAULT 'CUSTOMER',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. SELLER PROFILES (Storefronts)
CREATE TABLE seller_profiles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE UNIQUE,
    slug TEXT UNIQUE NOT NULL, -- e.g. /john-doe
    business_name TEXT NOT NULL,
    headline TEXT NOT NULL, -- e.g. "Commercial Photographer & Drone Pilot"
    bio TEXT,
    category TEXT NOT NULL, -- e.g. "Photography", "Barber", "Design"
    location_city TEXT NOT NULL,
    location_state TEXT NOT NULL,
    starting_price NUMERIC(10, 2) DEFAULT 0.00,
    avatar_url TEXT,
    banner_url TEXT,
    status seller_status DEFAULT 'PENDING',
    is_founding_member BOOLEAN DEFAULT FALSE,
    is_published BOOLEAN DEFAULT FALSE,
    view_count INT DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX idx_sellers_search ON seller_profiles (category, location_city, is_published) 
WHERE is_published = TRUE;

-- 4. SELLER SERVICES (The Menu)
CREATE TABLE seller_services (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    seller_id UUID REFERENCES seller_profiles(id) ON DELETE CASCADE,
    title TEXT NOT NULL, -- "1-Hour Studio Session"
    description TEXT,
    price NUMERIC(10, 2) NOT NULL,
    delivery_time_days INT DEFAULT 3,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 5. PORTFOLIO MEDIA REEL
CREATE TABLE media_items (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    seller_id UUID REFERENCES seller_profiles(id) ON DELETE CASCADE,
    media_type TEXT CHECK (media_type IN ('IMAGE', 'VIDEO')),
    cdn_url TEXT NOT NULL,
    thumbnail_url TEXT,
    sort_order INT DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 6. SUBSCRIPTIONS (Stripe State Machine)
CREATE TABLE subscriptions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    seller_id UUID REFERENCES seller_profiles(id) ON DELETE CASCADE UNIQUE,
    stripe_customer_id TEXT UNIQUE NOT NULL,
    stripe_subscription_id TEXT UNIQUE,
    tier subscription_tier NOT NULL,
    status sub_status DEFAULT 'TRIALING',
    trial_start TIMESTAMPTZ,
    trial_end TIMESTAMPTZ NOT NULL,
    current_period_end TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 7. MESSAGING & LEADS
CREATE TABLE conversations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    customer_id UUID REFERENCES users(id) ON DELETE CASCADE,
    seller_id UUID REFERENCES seller_profiles(id) ON DELETE CASCADE,
    last_message_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE (customer_id, seller_id)
);

CREATE TABLE messages (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    conversation_id UUID REFERENCES conversations(id) ON DELETE CASCADE,
    sender_id UUID REFERENCES users(id) ON DELETE CASCADE,
    content TEXT NOT NULL,
    is_read BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 8. CUSTOMER FAVORITES
CREATE TABLE favorites (
    customer_id UUID REFERENCES users(id) ON DELETE CASCADE,
    seller_id UUID REFERENCES seller_profiles(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    PRIMARY KEY (customer_id, seller_id)
);
```

---

## 5. Stripe Subscription & Trial State Machine

This handles Tyrone's 100-Founding-Member logic automatically in code:

```
[New Seller Application Approved by Admin]
               │
               ▼
[Query: SELECT COUNT(*) FROM seller_profiles WHERE is_founding_member = TRUE]
               │
       ┌───────┴───────┐
       ▼               ▼
 [Count < 100]    [Count >= 100]
       │               │
       ▼               ▼
[Founding Tier]  [Standard Tier]
• 90 Days Free   • 30 Days Free
• is_founding=T  • is_founding=F
       │               │
       └───────┬───────┘
               ▼
[Call Stripe API: Create Subscription with trial_period_days]
               │
               ▼
[Stripe Webhook Listener: /api/webhooks/stripe]
  ├─ `customer.subscription.trial_will_end` ──> Send reminder email
  ├─ `invoice.payment_succeeded`           ──> Set status = ACTIVE
  └─ `customer.subscription.deleted`       ──> Flip is_published = FALSE
```

---

## 6. Next.js App Router Component Architecture

```
app/
├── (marketing)/
│   ├── page.tsx                    # Landing Page: Hero, Category Carousel, Featured Sellers
│   └── pricing/page.tsx            # Seller Membership Explanation (Founding 100 Hook)
├── (directory)/
│   └── search/page.tsx             # Main Discovery Feed (Filter by city, category, price)
├── [slug]/
│   └── page.tsx                    # Public Seller Storefront (/tyrone-media)
├── (dashboard)/
│   ├── seller/
│   │   ├── profile/page.tsx        # Storefront Editor (Bio, Headline, Banner, Avatar)
│   │   ├── portfolio/page.tsx      # Media Upload Uploader (Photos / Videos to R2)
│   │   ├── services/page.tsx       # Service Listings CRUD
│   │   ├── messages/page.tsx       # In-App Chat Inbox
│   │   └── billing/page.tsx        # Stripe Customer Portal Redirect & Trial Tracker
│   └── admin/
│       ├── applications/page.tsx   # Seller Approval Queue [Approve] / [Reject]
│       ├── listings/page.tsx       # Moderation Table
│       └── metrics/page.tsx        # Total Sellers, MRR, Trial Expirations
└── api/
    ├── upload/route.ts             # Cloudflare R2 Presigned URL Generator
    └── webhooks/stripe/route.ts    # Stripe Subscription Webhook Handler
```

---

## 7. Recommended Fast-Track Execution

1. **Frontend Styling:** Use Tailwind CSS with dark palette tokens (`bg-slate-950`, border `slate-800`, button `bg-orange-500 hover:bg-orange-600`).
2. **Media Engine:** Do NOT store images or videos in the Next.js filesystem. Use **Cloudflare R2** with direct client-side S3 presigned PUT uploads.
3. **Database & Auth:** Use **Supabase (PostgreSQL)** for built-in email auth, row-level security (RLS), and instant REST/GraphQL endpoints.
4. **Billing:** Use standard **Stripe Checkout Sessions** in `subscription` mode with `trial_period_days`.
