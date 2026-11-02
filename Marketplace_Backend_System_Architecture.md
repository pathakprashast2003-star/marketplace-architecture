# In-Depth Backend System Architecture & Engineering Specification
**Target System:** High-Concurrency Creator & Business Directory Platform  
**Target Core Stack:** Node.js / Next.js API Layer, PostgreSQL (with Trigram & GIN), Redis (optional for rate-limiting/cache), Stripe Billing API, Cloudflare R2 / AWS S3 (Direct Uploads)

---

## 1. High-Level Backend Data Flow & Component Topology

```
                     ┌────────────────────────────────────────────────────────┐
                     │                  CLIENT REQUESTS                       │
                     └───────┬───────────────────────────────┬────────────────┘
                             │                               │
                      HTTPS / JSON                     Presigned PUT
                             │                               │
                             ▼                               ▼
                 ┌───────────────────────┐       ┌───────────────────────┐
                 │  Next.js API Gateway  │       │ Cloudflare R2 / S3    │
                 │  (JWT / Session Auth) │       │ (Zero-Load Media CDN) │
                 └───────────┬───────────┘       └───────────────────────┘
                             │
     ┌───────────────────────┼───────────────────────┐
     ▼                       ▼                       ▼
┌───────────────┐   ┌─────────────────┐   ┌──────────────────────┐
│  Search & DB  │   │  Stripe Webhook │   │  Messaging & Events  │
│  Query Engine │   │  Handler Queue  │   │  Engine              │
└───────┬───────┘   └────────┬────────┘   └──────────┬───────────┘
        │                    │                       │
        ▼                    ▼                       ▼
┌────────────────────────────────────────────────────────────────┐
│                   PostgreSQL Relational DB                     │
│    (Row-Level Security, GIN Indexes, Transactional Triggers)    │
└────────────────────────────────┬───────────────────────────────┘
                                 │
                                 ▼
                     ┌───────────────────────┐
                     │ Background Worker     │
                     │ (Daily Crons, Trials) │
                     └───────────────────────┘
```

---

## 2. Complete Database Architecture & DDL (PostgreSQL)

This schema handles strict data integrity, foreign key cascades, automatic timestamp updating via triggers, and high-performance search indexes.

```sql
-- Enable necessary extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pg_trgm"; -- Crucial for fast full-text substring search

-- ============================================================================
-- 1. ENUMS & DOMAINS
-- ============================================================================
CREATE TYPE user_role AS ENUM ('CUSTOMER', 'SELLER', 'ADMIN');
CREATE TYPE seller_verification_status AS ENUM ('DRAFT', 'PENDING_REVIEW', 'APPROVED', 'REJECTED', 'SUSPENDED');
CREATE TYPE subscription_status AS ENUM ('TRIALING', 'ACTIVE', 'PAST_DUE', 'CANCELED', 'INCOMPLETE');
CREATE TYPE subscription_tier AS ENUM ('FOUNDING_90', 'STANDARD_30');

-- ============================================================================
-- 2. USERS TABLE (Identity & Authentication)
-- ============================================================================
CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    email VARCHAR(255) UNIQUE NOT NULL,
    hashed_password VARCHAR(255) NOT NULL,
    role user_role NOT NULL DEFAULT 'CUSTOMER',
    is_email_verified BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_users_email ON users(email);

-- ============================================================================
-- 3. SELLER PROFILES (Storefront Core Entity)
-- ============================================================================
CREATE TABLE seller_profiles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL UNIQUE REFERENCES users(id) ON DELETE CASCADE,
    business_name VARCHAR(120) NOT NULL,
    slug VARCHAR(140) UNIQUE NOT NULL, -- URL path: /storefront/:slug
    headline VARCHAR(200) NOT NULL,    -- e.g. "Award-Winning Drone Videographer"
    bio TEXT,
    category VARCHAR(60) NOT NULL,     -- e.g. "Videography", "Barber", "Fitness"
    location_city VARCHAR(100) NOT NULL,
    location_state VARCHAR(50) NOT NULL,
    starting_price NUMERIC(10,2) NOT NULL DEFAULT 0.00,
    avatar_url TEXT,
    banner_url TEXT,
    verification_status seller_verification_status NOT NULL DEFAULT 'DRAFT',
    rejection_reason TEXT,
    is_founding_member BOOLEAN NOT NULL DEFAULT FALSE,
    is_directory_visible BOOLEAN NOT NULL DEFAULT FALSE, -- Flips to TRUE ONLY IF (APPROVED AND (TRIALING OR ACTIVE))
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Compound index for public directory queries (Filters out unapproved or delinquent accounts immediately)
CREATE INDEX idx_sellers_directory_query 
ON seller_profiles(category, location_city, starting_price) 
WHERE is_directory_visible = TRUE;

-- Trigram GIN indexes for fuzzy search on name, headline, and bio
CREATE INDEX idx_sellers_business_name_trgm ON seller_profiles USING GIN (business_name gin_trgm_ops);
CREATE INDEX idx_sellers_headline_trgm ON seller_profiles USING GIN (headline gin_trgm_ops);

-- ============================================================================
-- 4. SERVICES TABLE (Seller's Menu of Offerings)
-- ============================================================================
CREATE TABLE seller_services (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    seller_id UUID NOT NULL REFERENCES seller_profiles(id) ON DELETE CASCADE,
    title VARCHAR(150) NOT NULL,
    description TEXT,
    price NUMERIC(10,2) NOT NULL CHECK (price >= 0),
    delivery_estimate_days INT CHECK (delivery_estimate_days > 0),
    sort_order INT DEFAULT 0,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_services_seller ON seller_services(seller_id, sort_order) WHERE is_active = TRUE;

-- ============================================================================
-- 5. MEDIA ASSETS TABLE (Direct Cloudflare R2 / S3 Trackers)
-- ============================================================================
CREATE TABLE media_assets (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    seller_id UUID NOT NULL REFERENCES seller_profiles(id) ON DELETE CASCADE,
    media_type VARCHAR(10) NOT NULL CHECK (media_type IN ('IMAGE', 'VIDEO')),
    storage_key TEXT NOT NULL UNIQUE, -- S3/R2 object key: "sellers/{id}/{uuid}.webp"
    public_cdn_url TEXT NOT NULL,
    thumbnail_url TEXT,
    byte_size BIGINT NOT NULL,
    sort_order INT DEFAULT 0,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_media_seller ON media_assets(seller_id, sort_order);

-- ============================================================================
-- 6. SUBSCRIPTIONS TABLE (Stripe Synchronization Entity)
-- ============================================================================
CREATE TABLE subscriptions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    seller_id UUID NOT NULL UNIQUE REFERENCES seller_profiles(id) ON DELETE CASCADE,
    stripe_customer_id VARCHAR(100) NOT NULL UNIQUE,
    stripe_subscription_id VARCHAR(100) UNIQUE,
    tier subscription_tier NOT NULL,
    status subscription_status NOT NULL DEFAULT 'TRIALING',
    trial_start TIMESTAMPTZ NOT NULL,
    trial_end TIMESTAMPTZ NOT NULL,
    current_period_end TIMESTAMPTZ,
    cancel_at_period_end BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_subscriptions_status ON subscriptions(status, trial_end);

-- ============================================================================
-- 7. MESSAGING & CHAT ENGINE (Relational Model)
-- ============================================================================
CREATE TABLE conversations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    customer_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    seller_id UUID NOT NULL REFERENCES seller_profiles(id) ON DELETE CASCADE,
    last_message_preview TEXT,
    last_message_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE (customer_id, seller_id)
);

CREATE INDEX idx_conversations_user ON conversations(customer_id, last_message_at DESC);
CREATE INDEX idx_conversations_seller ON conversations(seller_id, last_message_at DESC);

CREATE TABLE messages (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    conversation_id UUID NOT NULL REFERENCES conversations(id) ON DELETE CASCADE,
    sender_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    content TEXT NOT NULL CHECK (length(trim(content)) > 0),
    is_read BOOLEAN NOT NULL DEFAULT FALSE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_messages_conversation ON messages(conversation_id, created_at ASC);
CREATE INDEX idx_messages_unread ON messages(conversation_id, is_read) WHERE is_read = FALSE;

-- ============================================================================
-- 8. CUSTOMER FAVORITES (Bookmarks)
-- ============================================================================
CREATE TABLE favorites (
    customer_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    seller_id UUID NOT NULL REFERENCES seller_profiles(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    PRIMARY KEY (customer_id, seller_id)
);

-- ============================================================================
-- 9. AUTOMATIC TRIGGER: Directory Visibility Sync
-- Automatically sets `is_directory_visible = TRUE` ONLY IF approved AND billing is good.
-- ============================================================================
CREATE OR REPLACE FUNCTION sync_seller_directory_visibility()
RETURNS TRIGGER AS $$
BEGIN
    UPDATE seller_profiles sp
    SET is_directory_visible = (
        sp.verification_status = 'APPROVED' AND 
        EXISTS (
            SELECT 1 FROM subscriptions s 
            WHERE s.seller_id = sp.id 
            AND s.status IN ('TRIALING', 'ACTIVE')
            AND (s.status != 'TRIALING' OR s.trial_end > NOW())
        )
    )
    WHERE sp.id = NEW.seller_id;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_sync_sub_visibility
AFTER INSERT OR UPDATE OF status, trial_end ON subscriptions
FOR EACH ROW
EXECUTE FUNCTION sync_seller_directory_visibility();
```

---

## 3. The Seller Lifecycle & Billing State Machine

```
              ┌────────────────────────────────────────────────┐
              │ 1. Seller Signs Up & Builds Profile (DRAFT)    │
              └───────────────────────┬────────────────────────┘
                                      │
                                [Submits Form]
                                      │
                                      ▼
              ┌────────────────────────────────────────────────┐
              │ 2. Status: PENDING_REVIEW                      │
              │    (Hidden from public search: is_visible=F)   │
              └───────────────────────┬────────────────────────┘
                                      │
                         ┌────────────┴────────────┐
                         ▼                         ▼
                  [Admin Rejects]           [Admin Approves]
                         │                         │
                         ▼                         ▼
                 [Status: REJECTED]   [Atomic Founding Counter Check]
                 (Reason emailed)                  │
                                                   ├─ Count < 100  --> Set 90-Day Trial (FOUNDING_90)
                                                   └─ Count >= 100 --> Set 30-Day Trial (STANDARD_30)
                                                   │
                                                   ▼
                                      ┌────────────────────────┐
                                      │ 3. Status: APPROVED    │
                                      │    is_visible = TRUE   │
                                      └────────────┬───────────┘
                                                   │
                                         [Stripe Card on File]
                                                   │
                                                   ▼
                                      ┌────────────────────────┐
                                      │ 4. TRIALING            │
                                      │    (90 or 30 days)     │
                                      └────────────┬───────────┘
                                                   │
                                             [Trial Ends]
                                                   │
                         ┌─────────────────────────┴─────────────────────────┐
                         ▼                                                   ▼
               [Stripe Card Charged: OK]                          [Stripe Card Fails]
                         │                                                   │
                         ▼                                                   ▼
             ┌───────────────────────┐                           ┌───────────────────────┐
             │ Status: ACTIVE        │                           │ Status: PAST_DUE      │
             │ is_visible = TRUE     │                           │ Grace period (3 days) │
             └───────────────────────┘                           └───────────┬───────────┘
                                                                             │
                                                                   [Failed Retries]
                                                                             │
                                                                             ▼
                                                                 ┌───────────────────────┐
                                                                 │ Status: CANCELED      │
                                                                 │ is_visible = FALSE    │
                                                                 │ (Delisted from Search)│
                                                                 └───────────────────────┘
```

### 3.1 Atomic Concurrency-Safe Founding Member Counter
When an admin approves a seller, two admins clicking "Approve" at the same moment must **never** result in 101 founding members. We enforce this with a PostgreSQL row lock:

```sql
-- Executed inside a SERIALIZABLE transaction in Next.js API
BEGIN;

-- Lock the table counter
SELECT COUNT(*) FROM seller_profiles 
WHERE is_founding_member = TRUE 
FOR UPDATE;

-- If count < 100:
UPDATE seller_profiles 
SET verification_status = 'APPROVED', 
    is_founding_member = TRUE,
    updated_at = NOW()
WHERE id = :seller_id;

-- Insert subscription with 90 days trial
INSERT INTO subscriptions (seller_id, stripe_customer_id, tier, status, trial_start, trial_end)
VALUES (:seller_id, :stripe_cust_id, 'FOUNDING_90', 'TRIALING', NOW(), NOW() + INTERVAL '90 days');

COMMIT;
```

---

## 4. Stripe Webhook Architecture & Idempotency Engine

Never trust client-side checkout redirects for billing status. The backend must rely exclusively on **Stripe Webhooks** signed with `stripe-signature`.

### 4.1 Idempotency Ledger Table
Stripe may send the same webhook event 2 or 3 times during network retries. We use an **Idempotency Log** to prevent double-processing:

```sql
CREATE TABLE processed_webhook_events (
    event_id VARCHAR(100) PRIMARY KEY,
    event_type VARCHAR(100) NOT NULL,
    processed_at TIMESTAMPTZ DEFAULT NOW()
);
```

### 4.2 Webhook Event Routing Table

| Stripe Event | Backend Action | SQL Mutation |
| :--- | :--- | :--- |
| `checkout.session.completed` | Seller submitted card details during onboarding. | Links `stripe_subscription_id` to `seller_id`. |
| `customer.subscription.trial_will_end` | 3 days before Day 90 (or Day 30). | Queues automated transactional reminder email. |
| `invoice.payment_succeeded` | Recurring monthly charge cleared. | `UPDATE subscriptions SET status = 'ACTIVE', current_period_end = to_timestamp(:period_end) WHERE stripe_customer_id = :id;` |
| `invoice.payment_failed` | Card declined on renewal. | `UPDATE subscriptions SET status = 'PAST_DUE' WHERE stripe_customer_id = :id;` (Triggers warning email). |
| `customer.subscription.deleted` | Subscription canceled or exhausted retries. | `UPDATE subscriptions SET status = 'CANCELED' WHERE stripe_customer_id = :id;` (Trigger automatically flips `is_directory_visible = FALSE`). |

---

## 5. Direct-to-Storage Media Pipeline (Zero-Server-Load)

Creators uploading 4K videos or high-resolution photo portfolios must **never** stream raw bytes through your Next.js Node server memory. This will choke CPU and crash your container.

```
[Seller Browser] ── 1. Request Signed URL ──> [Next.js API: /api/upload/presign]
       │                                                      │
       │                                            (Generates Signed S3/R2 PUT URL)
       │                                                      │
       │ <────── 2. Return URL & Object Key ──────────────────┘
       │
       └── 3. Direct Binary PUT (Chunked) ──> [Cloudflare R2 / AWS S3 Bucket]
       │
       └── 4. Register Asset ───────────────> [Next.js API: /api/seller/media]
                                                              │
                                                    (Inserts to `media_assets` table)
```

### 5.1 Backend Presign Route (`/api/upload/presign`)
```typescript
import { S3Client, PutObjectCommand } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import { randomUUID } from "crypto";

const s3 = new S3Client({
  region: "auto",
  endpoint: process.env.R2_ENDPOINT,
  credentials: {
    accessKeyId: process.env.R2_ACCESS_KEY_ID!,
    secretAccessKey: process.env.R2_SECRET_ACCESS_KEY!,
  },
});

export async function POST(req: Request) {
  const session = await getAuthenticatedSeller(req);
  const { contentType, fileExtension } = await req.json();

  // Enforce MIME-type whitelist
  const allowedMime = ["image/jpeg", "image/png", "image/webp", "video/mp4", "video/webm"];
  if (!allowedMime.includes(contentType)) {
    return new Response("Invalid file type", { status: 400 });
  }

  const fileKey = `sellers/${session.sellerId}/${randomUUID()}.${fileExtension}`;

  const command = new PutObjectCommand({
    Bucket: process.env.R2_BUCKET_NAME,
    Key: fileKey,
    ContentType: contentType,
  });

  // Signed URL expires in 5 minutes
  const uploadUrl = await getSignedUrl(s3, command, { expiresIn: 300 });

  return Response.json({
    uploadUrl,
    fileKey,
    cdnUrl: `${process.env.PUBLIC_CDN_BASE}/${fileKey}`,
  });
}
```

---

## 6. Directory Search Engine & Query Execution

To achieve sub-50ms response times without paying for Elasticsearch or Algolia, we leverage PostgreSQL's native **GIN Trigram Indexing**:

### 6.1 The Master Search Query
```sql
SELECT 
    sp.id,
    sp.business_name,
    sp.slug,
    sp.headline,
    sp.category,
    sp.location_city,
    sp.starting_price,
    sp.avatar_url,
    sp.banner_url,
    sp.is_founding_member,
    -- Match score calculated using trigram similarity
    GREATEST(
        similarity(sp.business_name, :query),
        similarity(sp.headline, :query)
    ) AS search_rank
FROM seller_profiles sp
WHERE 
    sp.is_directory_visible = TRUE
    AND (:category IS NULL OR sp.category = :category)
    AND (:city IS NULL OR sp.location_city ILIKE :city)
    AND (:max_price IS NULL OR sp.starting_price <= :max_price)
    AND (
        :query IS NULL OR 
        sp.business_name % :query OR 
        sp.headline % :query
    )
ORDER BY 
    sp.is_founding_member DESC, -- Founding members pinned to top
    search_rank DESC,
    sp.created_at DESC
LIMIT :limit OFFSET :offset;
```

---

## 7. In-App Messaging Architecture (Transactional Data Flow)

The messaging system is designed as an internal ticketing / chat inbox between prospective buyers and sellers:

```
[Buyer Sends Message] ──> POST /api/messages
                               │
            ┌──────────────────┴──────────────────┐
            ▼                                     ▼
[Insert row in `messages`]               [Upsert `conversations`]
                                         • Updates `last_message_preview`
                                         • Updates `last_message_at = NOW()`
                                         • Increments unread counter
                                                  │
                                                  ▼
                                         [Trigger Notification Event]
                                         (Sends email if seller offline > 15m)
```

### 7.1 Instant Unread Count Aggregation
```sql
-- Instant query for badge counter in navigation bar
SELECT COUNT(*) 
FROM messages m
JOIN conversations c ON m.conversation_id = c.id
WHERE (c.seller_id = :profile_id OR c.customer_id = :user_id)
  AND m.sender_id != :current_user_id
  AND m.is_read = FALSE;
```

---

## 8. Background Workers & Cron Lifecycle (Node.js / Vercel Cron)

A daily scheduled cron job handles trial expirations and warning notices:

```typescript
// GET /api/cron/billing-cycle (Runs daily at 00:00 UTC)
export async function handleDailyCron(req: Request) {
  verifyCronSecret(req);

  // 1. Send warning email to sellers whose 90-day / 30-day trial expires in 3 days
  const expiringTrials = await db.query(`
    SELECT sp.business_name, u.email, s.trial_end, s.tier
    FROM subscriptions s
    JOIN seller_profiles sp ON s.seller_id = sp.id
    JOIN users u ON sp.user_id = u.id
    WHERE s.status = 'TRIALING'
      AND s.trial_end BETWEEN NOW() + INTERVAL '3 days' AND NOW() + INTERVAL '4 days'
  `);

  for (const seller of expiringTrials.rows) {
    await sendEmail({
      to: seller.email,
      template: "TRIAL_EXPIRING_WARNING",
      vars: { name: seller.business_name, daysLeft: 3 },
    });
  }

  // 2. Identify expired trials that have no card on file
  const expiredWithoutCard = await db.query(`
    UPDATE subscriptions
    SET status = 'CANCELED', updated_at = NOW()
    WHERE status = 'TRIALING' 
      AND trial_end < NOW()
      AND stripe_subscription_id IS NULL
    RETURNING seller_id;
  `);

  // Notice: The PostgreSQL trigger `trg_sync_sub_visibility` will automatically
  // set `is_directory_visible = FALSE` for these sellers instantly.

  return Response.json({ success: true, processed: expiringTrials.rowCount });
}
```

---

## 9. Security & Row-Level Protection (RLS) Rules

1. **Profile Editing:** Only `user_id = auth.uid()` can execute `UPDATE` on `seller_profiles`.
2. **Approval Field Guard:** The column `verification_status` and `is_founding_member` can **only** be modified if `auth.jwt().role = 'ADMIN'`.
3. **Messaging Privacy:** Messages can only be read if `auth.uid()` matches either `conversation.customer_id` or the owner of `conversation.seller_id`.
4. **Stripe Webhook Defense:** Reject any webhook payload whose signature cannot be verified using `stripe.webhooks.constructEvent()`.
