# NEXUS MARKETPLACE: LIVING ENGINEERING & BACKEND ROADMAP

> **Operating Principle**: Frontend-First UI/UX Crafting & Visual Brainstorming → Backend System Execution.  
> Every UI/UX component created on the frontend maps directly to an underlying database model, business algorithm, media pipeline, or API service. This document is updated as the interface evolves so any engineer or AI agent in subsequent sessions knows exactly what was built, why it was designed that way, and how to implement the backend.

---

## 1. Executive Product Vision & Architecture

* **Product**: Nexus (`nexus.build`)
* **Business Model**: **Zero-Escrow Direct Creator Marketplace**. Flat \$49/month creator membership. 0% platform take-rate on client billings.
* **Target Audience**:
  * **Demand (Buyers)**: Enterprise Creative Directors, Heads of Production, Brand Leads (Nike, Apple, Porsche, Netflix, Spotify, A24, Wieden+Kennedy).
  * **Supply (Creators)**: Hand-vetted commercial directors, aerial FPV pilots, world illustrators, spatial 3D directors, action motion operators.
* **Aesthetic Standard**: Apple-grade studio off-white drafting grid board (`#F8F9FA` with 48px tactile grid lines), concentric radii, Navora-style profile cards, and high-contrast typography.

---

## 2. Frontend-to-Backend Architecture Mapping

| Frontend UI/UX Component | User Experience State | Backend Implementation Requirement | Database & Algo Specification |
| :--- | :--- | :--- | :--- |
| **01. Top Hero Stage** | Theme capsule switcher (Sage, Slate, Lilac, Amber, Coral) with 3D character bust fader | Multi-tenant craft routing; CDN asset delivery pipeline for transparent WebP/PNG assets | `craft_disciplines` table. Fastly/Cloudflare Edge caching for `<100ms` hero swap. |
| **02. Live Architectural Ticker** | Infinite kinetic marquee showing live specs, certified standards, active cities | Dynamic platform metrics ticker service | Background Redis pub/sub aggregating live verified creator count and active cities. |
| **03. Curated 5-Operator Roster** | Top 5 weekly featured cards with verified blue badges and client tags | **Weekly Spotlight Ranking Algorithm (The 5 Curation Rules)** | Background Cron (`0 0 * * 1`) executing the ranking formula; stores current active slots in `featured_roster_slots`. |
| **04. Dual-Media Engine** | Toggle: `[ ► Client Reels ]` vs `[ 3D Personas ]` | Media Transcoding & Storage Pipeline | Cloudflare Stream / Mux for 4s H.264 video loops + AWS S3 for 1080p WebP stills + fallback persona selector. |
| **05. Omni-Search & Filters** | Real-time search by craft, equipment, director name, city filter tabs | High-Performance Search Index | PostgreSQL `pg_trgm` / Meilisearch / Typesense. Full-text inverted index over `name`, `craft`, `gear_locker`, `cities`. |
| **06. Direct 30-Second Inquiry Modal** | Direct inquiry popup (Shoot window, budget bracket, scope, email) | Structured Lead Dispatch Service | Postmark/SendGrid transactional email API + Twilio SMS webhook to creator. Direct routing, zero middleman escrow. |
| **07. Zero-Commission Calculator** | Interactive slider ($20k–$200k) comparing 20% platform cut vs Nexus $0 | Value Proposition Engine & ROI Proof | Pure client-side mathematical projection. Logs lead conversion telemetry. |
| **08. Founding Roster Intake Modal** | Creator application modal (Name, craft, reel URL, day rate) | Creator Vetting & Onboarding Pipeline | Intake webhook to PostgreSQL `creator_applications`. Admin approval dashboard with status flags (`pending`, `vetted`, `active`). |

---

## 3. Algorithmic Specifications (What Needs to Be Built in Backend)

### A. The 5-Operator Curation Algorithm (Weekly Monday Cron)
The homepage features only 5 operators per weekly cycle. The backend selection engine runs every Monday at 00:00 UTC:

$$\text{Curation Score} = (0.35 \times \text{Inquiry Velocity}) + (0.25 \times \text{Response SLA Score}) + (0.25 \times \text{Tier-1 Client Weight}) + (0.15 \times \text{Rating})$$

* **Discipline Constraint**: Exactly 1 top candidate selected per discipline:
  1. `commercial_cinema`
  2. `aerial_drone`
  3. `visual_illustration`
  4. `spatial_3d`
  5. `action_motion`
* **Hard Gates**:
  * Must have verified hardware on file (ARRI, RED, Inspire 3, or VisionOS).
  * Average response SLA must be $< 2.0\text{ hours}$.
  * Minimum 2 verified Tier-1 client references (`client_brands`).

### B. The Media Ingestion & Auto-Card Pipeline
When a creator onboards, they do not provide a 3D model:
```
1. Creator submits Portfolio URL / Vimeo Link / 16:9 Image Still
2. Webhook triggers Headless Worker (FFmpeg / Sharp / Mux)
3. Generates:
   - 480p WebM/MP4 4-second preview loop (hover scrub)
   - 1080p WebP poster keyframe
   - Dominant hex palette extraction for card accents
   - Monogram initials extraction (e.g. "Marcus Vance" -> "MV")
4. If no custom photo provided, auto-assigns matching Craft Persona Mascot.
```

### C. Direct Lead Dispatch Protocol
Nexus does not hold client funds in escrow (avoiding money transmission licensing and 20% fee drag):
```
1. Client submits #inquiryModal (Window, Budget Bracket, Brief, Email)
2. Backend generates unique Cryptographic Deal Room link
3. Instant push notification to Director (Email + SMS + Discord/Slack Webhook)
4. Client and Director communicate directly via verified email bridge
```

---

## 4. Database Schema Blueprint (PostgreSQL / Supabase / Prisma)

```sql
-- 1. Core Creators Table
CREATE TABLE creators (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    slug VARCHAR(64) UNIQUE NOT NULL,
    full_name VARCHAR(128) NOT NULL,
    handle VARCHAR(64) UNIQUE NOT NULL,
    craft_discipline VARCHAR(32) NOT NULL, -- 'film', 'drone', 'art', '3d', 'action'
    city VARCHAR(64) NOT NULL,
    state_country VARCHAR(64) NOT NULL,
    bio TEXT NOT NULL,
    day_rate_cents INTEGER NOT NULL, -- e.g. 65000 = $650
    response_sla_minutes INTEGER NOT NULL, -- e.g. 45 = Under 1h
    verified BOOLEAN DEFAULT false,
    founding_member BOOLEAN DEFAULT false,
    membership_status VARCHAR(32) DEFAULT 'trial', -- 'trial', 'active', 'paused'
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 2. Verified Equipment Locker
CREATE TABLE equipment_lockers (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    creator_id UUID REFERENCES creators(id) ON DELETE CASCADE,
    primary_kit_label VARCHAR(64) NOT NULL, -- 'RED 8K Kit', 'Alexa LF'
    camera_body VARCHAR(128),
    glass_lenses VARCHAR(128),
    certifications TEXT[], -- ARRAY['FAA Part 107', 'OpenXR Native']
    verified_at TIMESTAMP WITH TIME ZONE
);

-- 3. Enterprise Client Credits
CREATE TABLE creator_client_credits (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    creator_id UUID REFERENCES creators(id) ON DELETE CASCADE,
    client_name VARCHAR(64) NOT NULL, -- 'Nike', 'Porsche', 'Apple'
    tier_level INTEGER DEFAULT 1, -- 1 = Fortune 500 / Global
    proof_url TEXT
);

-- 4. Direct Inquiries (Lead Routing)
CREATE TABLE direct_inquiries (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    creator_id UUID REFERENCES creators(id),
    client_email VARCHAR(255) NOT NULL,
    shoot_window VARCHAR(128) NOT NULL,
    budget_bracket VARCHAR(64) NOT NULL, -- '$1k to $2.5k', '$2.5k to $5k', '$5k+'
    project_scope TEXT NOT NULL,
    dispatched_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    creator_first_replied_at TIMESTAMP WITH TIME ZONE
);
```

---

## 5. Master Roadmap & Next Steps

- [x] **Phase 1: High-Craft Frontend UI/UX Architecture**
  - [x] Apple-grade studio off-white drafting grid board (`#F8F9FA` with 48px lines)
  - [x] Kinetic Platform Spec Ticker Ribbon
  - [x] 5-Creator Curated Spotlight Roster with zero text truncation
  - [x] Dual-Media Switcher: `[ ► Client Reels ]` vs `[ 3D Personas ]`
  - [x] Enterprise Client Social Proof Badges (`Nike`, `Porsche`, `Apple`, `HBO`)
  - [x] Curation Governance Modal (`#criteriaModal`) explaining selection rules
  - [x] Direct Structured Inquiry Modal (`#inquiryModal`)
  - [x] Zero-Commission Fee Comparison Visualizer (`#fees`)
  - [x] Founding Member Application Modal (`#foundingModal`)
- [ ] **Phase 2: Full UI/UX Surface Completion (All Remaining Pages & Views)**
  - [ ] Creator Profile Page (`/director/[slug]`): Full reel video player, equipment locker list, availability calendar, verified review threads.
  - [ ] Filter / Directory Full Search View: Expand from 5 curated cards to 50+ directory browser with sorting (Rate: Low to High, SLA, City).
  - [ ] Client Inquiry Brief Confirmation & Deal Room View (`/deal/[token]`).
  - [ ] Creator Dashboard / Onboarding Portal: Simple form to input day rate, kit, and link Vimeo reels.
- [ ] **Phase 3: Backend Infrastructure & API Services**
  - [ ] Supabase / PostgreSQL schema migration and database setup.
  - [ ] REST / GraphQL API endpoints for roster queries with full-text search.
  - [ ] Weekly curation cron job algorithm implementation.
  - [ ] Cloudflare Stream / Mux automated transcoding worker.
  - [ ] Stripe Billing \$49/month zero-commission membership subscription integration.
  - [ ] Postmark transactional lead notification email webhooks.
