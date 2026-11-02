# Backend Architecture & Flowchart Specification (v2.0)
## Reverse-Engineering Contra.com & The Knot for a Production Marketplace
**Document Type:** System Architecture & Operational Flowcharts (.md)  
**Target:** Tyrone Strickland's Creator & Business Marketplace ($7,200 Scope)  
**Core Upgrades:** Deferred card onboarding, dual-stage chargeback defense, transactional email loop, and bot protection.

---

## 1. High-Level System Topology (The Hardened Architecture)

```mermaid
flowchart TD
    subgraph Clients["1. Client Layer"]
        C1["Seeker Browser (Desktop/Mobile Web)"]
        C2["Founder Storefront Dashboard"]
        C3["Admin Command Center (Tyrone)"]
    end

    subgraph Edge["2. Edge & Security Layer"]
        CDN["Cloudflare Edge Network / DNS / SSL"]
        BotShield["Cloudflare Turnstile (Silent Bot Protection on Chat)"]
    end

    subgraph AppServer["3. Application & API Engine"]
        Gateway["Next.js Route Handlers & Auth Gate"]
        SearchEngine["Directory Query & Trigram Search Engine"]
        BillingEngine["Stripe Webhook Event Processor"]
        MsgEngine["Direct Messaging & Notification Service"]
        MediaSigner["Presigned Upload URL Generator"]
        EmailWorker["Transactional Email Worker (Resend / Postmark)"]
        OGWorker["Dynamic OpenGraph Meta Card Generator"]
    end

    subgraph StorageLayer["4. Data & Object Persistence"]
        DB[("PostgreSQL Database (Transactional Truth)")]
        R2[("Cloudflare R2 / AWS S3 (Media Storage)")]
        StripeCloud["Stripe Billing & Subscriptions Cloud"]
    end

    C1 & C2 & C3 --> CDN
    CDN --> BotShield
    BotShield --> Gateway

    Gateway --> SearchEngine
    Gateway --> BillingEngine
    Gateway --> MsgEngine
    Gateway --> MediaSigner
    Gateway --> EmailWorker
    Gateway --> OGWorker

    SearchEngine --> DB
    MsgEngine --> DB
    BillingEngine --> DB
    BillingEngine <--> StripeCloud

    MediaSigner -.->|"Returns 5-Min Upload Token"| C2
    C2 ==="Direct Video/Photo Upload (Bypasses Node Server)"===> R2
    R2 -.->|"Cached Media Delivery via Edge"| C1
    EmailWorker -.->|"Sends Approval / Lead / Warning Emails"| C2
```

---

## 2. Reverse-Engineering Contra.com: The Visual & Discovery Engine

Contra solves the "portfolio lag" problem and makes creator search feel instant:

```mermaid
sequenceDiagram
    autonumber
    actor Seeker
    participant Gateway as API Gateway
    participant Search as Search & Query Engine
    participant DB as PostgreSQL
    participant R2 as Media CDN (S3/R2)
    actor Founder as Founder / Seller

    Note over Seeker, Gateway: Discovery & Search Flow
    Seeker->>Gateway: Search Request: "Austin" + "Videography"
    Gateway->>Search: Execute Trigram & Indexed Query
    Search->>DB: Query seller_profiles (is_directory_visible = TRUE)
    DB-->>Search: Return Matched Ranked Profiles (Founding Members first)
    Search-->>Gateway: Lightweight JSON (Names, Slugs, CDN Image URLs)
    Gateway-->>Seeker: Render Responsive Storefront Cards

    Note over Seeker, R2: Media Optimization Flow
    Seeker->>R2: Request 4K Video Reel / Photo Portfolio
    R2-->>Seeker: Edge-Cached WebP/WebM Stream (Zero Load on Main DB)

    Note over Seeker, Founder: In-Platform Direct Messaging Flow
    Seeker->>Gateway: POST /api/messages (Body: "Need 2 video shoots")
    Gateway->>DB: Insert Message + Upsert Conversation (Atomic Transaction)
    DB-->>Gateway: Confirmed Insert
    Gateway-->>Seeker: UI Optimistically Updates ("Sent")
    Gateway->>Founder: Trigger In-App Notification Badge + Instant Resend Email
```

---

## 3. Reverse-Engineering The Knot: The Vetting & Chargeback-Proof Subscription Engine

Here is the complete operational loop integrating **Deferred Card Collection** and the **Dual-Stage Chargeback Defense**:

```mermaid
flowchart TD
    subgraph SellerOnboarding["Phase 1: Frictionless Application (No Card Needed)"]
        S1["Founder Registers & Builds Storefront (Bio, Video Reel, Services)"] --> S2["Status: PENDING_REVIEW (is_visible = FALSE)"]
        S2 --> S3["Profile Queued in Tyrone's Review Queue"]
    end

    subgraph AdminGatekeeper["Phase 2: Tyrone's Gatekeeper Queue"]
        S3 --> A1{"Tyrone's Decision"}
        A1 -->|"Reject"| A2["Status: REJECTED (Reason Emailed)"]
        A1 -->|"Approve"| A3["Atomic Concurrency Check: Count Approved Sellers"]
    end

    subgraph TierBranch["Phase 3: Automated Plan Assignment & Activation"]
        A3 -->|"Count <= 100"| T1["Assigns Founding Member Tier (90-Day Free Trial)"]
        A3 -->|"Count > 100"| T2["Assigns Standard Tier (30-Day Free Trial)"]
        T1 & T2 --> T3["Automated Email via Resend: 'Claim Your 90-Day Founding Pass'"]
        T3 --> T4["Founder Clicks Link & Enters Card via Stripe ($0.00 Due Today)"]
        T4 --> T5["Status: APPROVED (is_visible = TRUE) - Storefront Goes Live!"]
    end

    subgraph BillingEngine["Phase 4: Chargeback-Proof Subscription Lifecycle"]
        T5 --> B1["Trial Running (90 or 30 Days)"]
        B1 -->|"Day 83 (7 Days Before)"| B2["Warning Email 1: 'Trial ending soon; renewal on [Date]'"]
        B1 -->|"Day 88 (3 Days Before)"| B3["Warning Email 2: Final Notice with 1-Click Cancel Link"]
        B1 -->|"Day 91: Trial Expires"| B4["Stripe Automatically Charges Card on File"]
        
        B4 -->|"Charge OK"| B5["Status: ACTIVE (Storefront Remains Live & Visible)"]
        B4 -->|"Charge Failed"| B6["Status: PAST_DUE (3-Day Grace Period + Email Alert)"]
        B6 -->|"Retries Exhausted"| B7["Stripe Webhook: customer.subscription.deleted"]
        B7 --> B8["Database Trigger Flips is_visible = FALSE (Automatically Delisted)"]
    end
```

---

## 4. How the System Calculates Without Breaking (The 5 Fail-Safes)

| Fail-Safe Mechanism | The Risk It Solves | How the Architecture Handles It |
| :--- | :--- | :--- |
| **1. Concurrency Row Lock** | Two admins approving at the same second creating 101 founding members. | Executes an atomic `SELECT ... FOR UPDATE` lock in PostgreSQL so the founding member counter never exceeds 100. |
| **2. Direct-to-Storage Media** | 20 videographers uploading 500MB reels crashing server memory. | Application server issues 5-minute temporary signed upload tickets. Files upload directly from the browser to cloud storage. |
| **3. Reactive Visibility Trigger** | Unpaid or delinquent sellers continuing to get leads. | A database-level trigger automatically enforces `is_directory_visible = TRUE` *only* while subscriptions are active. If a card declines, they disappear from search instantly. |
| **4. Dual-Stage Renewal Notice** | Bank chargebacks on Day 91 from creators claiming surprise renewal. | Automated emails at Day 83 and Day 88 provide clear renewal dates and cancellation links, satisfying US FTC and credit card network guidelines. |
| **5. Turnstile Bot Shield** | Competitors or automated bots spamming seller inboxes with crypto ads. | Cloudflare Turnstile blocks bot requests on the inquiry endpoint without annoying puzzle captchas. |
