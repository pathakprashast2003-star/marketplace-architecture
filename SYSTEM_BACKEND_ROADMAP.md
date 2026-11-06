# NEXUS MARKETPLACE: LIVING ENGINEERING & BACKEND ROADMAP

> **Operating Principle**: Frontend-First UI/UX Crafting & Visual Brainstorming → Backend System Execution.  
> Every UI/UX component created on the frontend maps directly to an underlying database model, business algorithm, media pipeline, or API service. This document is updated as the interface evolves so any engineer or AI agent in subsequent sessions knows exactly what was built, why it was designed that way, and how to implement the backend.

---

## 1. Executive Product Vision & Architecture

* **Product**: Nexus (`nexus.build`)
* **Business Model**: **Hybrid Enterprise Marketplace Economics (Contra & The Knot Reverse-Engineered)**:
  * **Tier 1 (Creator SaaS Pro)**: \$39–\$49/month Creator Pro subscription for custom portfolios, zero-commission invoices, and priority directory ranking.
  * **Tier 2 (Client Protection & Escrow)**: 3.5%–5% milestone payment protection fee paid by hiring clients (guarantees funds on milestone lock, eliminating non-payment risk and managing 1099 tax paperwork).
  * **Tier 3 (Enterprise Concierge)**: 15%–20% fee for fully managed brand crew assembly, Net-30 invoicing, master service agreements, and \$5M production liability insurance.
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
| **03. Curated 5-Operator Roster** | Top 5 weekly featured cards: Full-bleed edge-to-edge media with frosted glass scrim, tabular day rate, verified check, and direct inquiry CTA | **Weekly Spotlight Ranking Algorithm (The 5 Curation Rules)** | Background Cron (`0 0 * * 1`) executing the ranking formula; stores current active slots in `featured_roster_slots`. |
| **04. Dual-Media Engine** | Seamless toggle: `[ ► Client Reels ]` (full-bleed cinema stills) vs `[ 3D Personas ]` (ambient character art) | Media Transcoding & Storage Pipeline | Cloudflare Stream / Mux for 4s H.264 video loops + AWS S3 for 1080p WebP stills + fallback persona selector. |
| **05. Streamlined Control Dock** | Unified control bar: Category filter pills + live search input + view mode toggle (zero stacked clutter) | High-Performance Search Index | PostgreSQL `pg_trgm` / Meilisearch / Typesense. Full-text inverted index over `name`, `craft`, `gear_locker`, `cities`. |
| **06. Direct 30-Second Inquiry Modal** | Direct inquiry popup (Shoot window, budget bracket, scope, email) | Structured Lead Dispatch Service | Postmark/SendGrid transactional email API + Twilio SMS webhook to creator. Direct routing, zero middleman escrow. |
| **07. Zero-Commission Calculator** | Interactive slider ($20k–$200k) comparing 20% platform cut vs Nexus $0 | Value Proposition Engine & ROI Proof | Pure client-side mathematical projection. Logs lead conversion telemetry. |
| **08. Founding Roster Intake Modal** | Creator application modal (Name, craft, reel URL, day rate) | Creator Vetting & Onboarding Pipeline | Intake webhook to PostgreSQL `creator_applications`. Admin approval dashboard with status flags (`pending`, `vetted`, `active`). |

---

## 3. Visual System Standards & Editorial Architecture (Reverse-Engineered Taste)

### A. The Seamless Sculptural Craft Architecture (Impeccable Production Standard)
To eliminate the visual clutter of box-on-box directory cards and achieve the pure, tactile, editorial aesthetic of the Oat & Mill reference, the roster talent cards implement a seamless, monolithic craft structure:

1. **Bespoke Seamless Sculptural Canvases (`.nx-talent-card`)**:
   - Each creator sits on a single, continuous, monolithic tactile chassis (`border-radius: 36px`) customized to their discipline, with zero nested white boxes:
     - **Marcus Vance (Commercial Cinema)**: Warm terracotta-blush (`#FAF2EC` with amber ambient glow).
     - **Maya Lin (Aerial FPV)**: Soft coastal sky & cloud blue (`#EFF6FB` with cyan ambient glow).
     - **Elena Rostova (Character & World Art)**: Velvet lilac & royal blush (`#F7EFF9` with violet ambient glow).
     - **Kai Takahashi (Realtime Spatial 3D)**: Fresh matcha-mint (`#EEF8F3` with emerald ambient glow).
     - **Samuel Cross (Action & Motion)**: Champagne warm sand (`#F5F2EB` with warm slate ambient glow).

2. **3D Character Hero Stage (`.nx-card-media-frame`)**:
   - Expanded height (`285px`) with seamless `36px` top radii flowing continuously into the card body.
   - Persona layer (`.nx-media-persona`) with radiant ambient aura and large-scale transparent busts (`height: 98%`).
   - Multi-tier ambient drop-shadows: `filter: drop-shadow(0 22px 30px rgba(59, 10, 36, 0.22)) drop-shadow(0 6px 12px rgba(59, 10, 36, 0.08))`.
   - Tactile elevation on hover: `transform: scale(1.08) translateY(-8px)`.
   - Dual-media compatibility: In Cinema Reels mode, displays 16:9 production reels with 24px inner radii and subtle drop shadow.

3. **Floating Oat & Mill White Rate Pill & Badges**:
   - Elevated pure white rate pill: `$650/day`, `$550/day`, etc. (`background: #FFFFFF; color: #220514; font-weight: 850; box-shadow: 0 8px 22px rgba(59, 10, 36, 0.14); border-radius: 9999px;`).
   - Translucent white craft pills (`8K Cinema Reel`) and SLA badges (`⚡ < 1h SLA`).

4. **Monolithic Editorial Content Body (`.nx-card-body`)**:
   - Sits directly on the sculptural canvas (`background: transparent; margin: 0; padding: 6px 22px 24px 22px;`).
   - **Director Title**: Set in **Outfit** (`1.45rem`, weight 850, `#220514`) with blue verified badge.
   - **Role & Location**: `Commercial Cinema · Austin, TX` (`color: #735965; font-size: 12.5px; font-weight: 650;`).
   - **Editorial Bio**: Single un-slopped human sentence (`font-size: 13px; line-height: 1.5; color: #3B2330;`).
   - **Porcelain Gear Chips**: Floating pure white pills (`background: #FFFFFF; color: #3B0A24; border-radius: 9999px; font-size: 11px; font-weight: 650; box-shadow: 0 2px 6px rgba(59, 10, 36, 0.04);`).
   - **Horizontal Stat Ribbon (`.nx-card-stat-ribbon`)**:
     - Single horizontal stat ribbon bounded by delicate hairline dividers:
       `★★★★★ 5.0  •  42 Projects  •  $140k+ Earned`
     - Replaces bulky accounting tables with calm editorial rhythm.
   - **Full Pill Action Stack**:
     - Primary button: Deep wine (`#3B0A24`) pill button `[ Hire Marcus → ]` (`height: 48px; border-radius: 9999px; color: #FFFFFF; font-weight: 750; box-shadow: 0 8px 22px rgba(59, 10, 36, 0.22);`).
     - Sub-action row: Pure white pill `[ ✉ Message ]` (`background: #FFFFFF; color: #3B0A24; border-radius: 9999px;`) + `[ 🔖 ]` bookmark.

5. **Dynamic Symmetrical Centering**:
   - Row 1 features 3 cards; Row 2 features 2 cards symmetrically centered beneath Row 1 (3+2 museum composition).
   - 100% responsive down to 390px mobile viewports with WCAG 2.2 AA contrast compliance.

### B. Tactile 3D Mobile Experience Architecture (Oat & Mill Reference)
Implemented in [`artisan_experience.html`](artisan_experience.html) with 4 bespoke 3D assets:
1. **Screen 1 (Discover & Featured Product)**:
   - Slogan: `Better Ice cream, better planet` with circular avatar.
   - Filter chips: `All`, `🍨 Ice-Cream`, `🍦 Popsicles`, `🍬 Confections`.
   - 3D Pop-Out Card: `assets/oat_rocky_road_pint.png` rendered at a 15-degree tilt breaking out of the blush-pink card container with drop shadow.
   - Price tag `$12.00` + rounded wine button with shopping cart icon.
   - Floating persistent dock: `(2) Cart / 2 Items` with mini tub thumbnails.
2. **Screen 2 (Product Detail)**:
   - Centered 3D hero tub (`assets/oat_turtle_crossing_hero.png`) with speckled apricot lid and tactile lighting.
   - Organic wave stepper container (`− 02 +`) with dynamic subtotal price pill (`$16.00`).
   - Deep wine full-width `Add To Cart` button with shopping cart icon box.
3. **Screen 3 (Cart & Checkout)**:
   - Deep wine canvas (`#3B0A24`) with cart items stack (`assets/oat_chocolate_chip_mini.png`, etc.).
   - Floating delivery summary card (`Delivery charge: $04.44`, `Total Amount USD 38.00`).
   - 3D overflow ice cream scoop (`assets/oat_ice_cream_scoop.png`) with dripping dark chocolate and bakery sprinkles.
   - Full pill CTA button: `Make Payment >>>`.
4. **Interactive Capabilities**:
   - Live quantity increment/decrement recalculating subtotals in real-time.
   - Toast notifications on item addition.
   - Triple-phone studio display mode vs single-device interactive simulator toggle.

### C. The 3 Production Edge-Cases Architecture (Real-World Creator Personas)
In real production marketplaces, not every creator has an existing 4K reel, an animated 3D persona, or wants to display their personal face. The frontend and backend architecturally solve the 3 critical edge cases:

1. **Case 1: No Content Yet / Junior Talent / First Gig (`David Kim`)**:
   - **The Problem**: A freshly certified 2nd Unit AC or film school graduate has real gear knowledge and technical competence, but zero polished commercial reels or 3D mascots.
   - **Frontend UI Pattern**:
     - **Architectural Craft Tool Silhouette**: Clean vector contour of professional equipment (e.g. cinema camera with Matte Box on heavy-duty tripod) rendered in deep wine (`#3B0A24`) with subtle rhythmic glow (`@keyframes silhouettePulse`).
     - **First-Job Rate Anchoring**: Transparent introductory day rate (`$350/day`) signaling accessible entry pricing.
     - **Telemetry Badges**: `⭐ New Talent · 0 Projects · < 1h Response`.
     - **Verified Credential Chips**: `ARRI Certified`, `RED DIT Prep`, `Dual-Slot Media` to prove technical competence despite zero on-platform history.
   - **Backend Schema & Logic**: `creators.profile_state = 'first_gig'`, `creators.is_new_talent = true`. Ranking boost for vetted new talent in search filters.

2. **Case 2: No Face / Anonymous Studio / Privacy (`Somatic Vision Studio`)**:
   - **The Problem**: High-end CGI, VFX, and Spatial Computing collectives operate as anonymous creative shops or technical operators who refuse to put a personal cartoon or selfie on their business listing.
   - **Frontend UI Pattern**:
     - **Work-First Media Stage**: Full-bleed 16:9 reel still showcasing output (e.g. liquid metallic VisionOS chrome stage) rather than human biology.
     - **Studio Monogram Badge**: Sculptural dual-letter monogram badge (`[ SV ]`) in deep obsidian plum and gold hairline stroke (`.nx-card-monogram`).
     - **KYC Identity Verification**: Blue verified checkmark confirming legal company incorporation and banking KYC.
     - **Day Rate & Telemetry**: `$750/day · 28 Projects · $195k+ Earned`.
   - **Backend Schema & Logic**: `creators.display_mode = 'studio_anonymous'`, `creators.studio_monogram = 'SV'`, `creators.company_number = 'UK-0847291'`.

3. **Case 3: Zero Effort / 30-Second Lazy Onboard (`Nova Capture`)**:
   - **The Problem**: Top pursuit operators and camera riggers are busy on set; they will not spend 45 minutes filling out forms, cropping headshots, or rendering mascots.
   - **Frontend UI Pattern**:
     - **Auto-Synthesized Palette & Contour**: Auto-generated tactile pursuit crane arm contour silhouette based on selected category (`Action & Motion`).
     - **Instant Initials Monogram**: `[ NC ]` extracted automatically from name string.
     - **Minimalist Telemetry**: `⭐ Verified Operator · Direct Terms · Ready to Shoot`.
     - **Day Rate**: `$600/day`.
   - **Backend Schema & Logic**: 3-field instant onboarding (`full_name`, `discipline`, `day_rate`). Automated worker infers tags (`RED Komodo-X`, `Ronin 4D 8K`, `Pursuit Arm`) from discipline defaults until custom equipment is registered.

---

## 4. Algorithmic Specifications (What Needs to Be Built in Backend)

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

