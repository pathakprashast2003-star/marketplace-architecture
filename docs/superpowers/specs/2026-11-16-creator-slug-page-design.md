# Design Document: Creator Portfolio & Direct Booking Slug Page (`/c/<slug>`)

**Date**: 2026-11-16  
**Status**: Ready for Approval  
**Target Routes**: `/c/<slug>`, `/creator.html`  
**Dataset**: `js/creators-data.js` (34 Curated Visual Artists)

---

## 1. Intent & Purpose

Nexus provides direct, 0% commission access to top independent visual artists (commercial DPs, drone pilots, virtual production artists, and creative directors). 

When a client clicks a creator card from `/explore` or receives a direct portfolio link, they land on `/c/<slug>`. This page must immediately prove the creator's artistic caliber and technical competence through a cinematic portfolio experience while making direct booking frictionless.

---

## 2. Approaches Considered & Trade-offs

### Approach 1: Cinematic Portfolio First (Selected by User)
* **Description**: Lead with a cinematic showreel video player with ambient playback, followed by a curated high-res stills gallery, verified camera/software gear rack (e.g., ARRI Alexa 35, Cooke Anamorphic, Unreal Engine 5.4), production credits, transparent day rate packages, and an ambient floating booking dock.
* **Pros**: Aligns directly with how commercial agency producers, ad agencies, and brand directors hire visual talent—evaluating visual taste, reel motion, and camera gear before reviewing logistics.
* **Cons**: Requires reliable video loop fallback to high-res still photography when video assets are missing or buffering.

### Approach 2: Transactional Rate & Services First (Rejected)
* **Description**: Lead with pricing calculators, multi-day buyout matrices, calendar availability heatmaps, and formal quotation request forms before showing visual work.
* **Pros**: Highly structured for procurement and transactional clients.
* **Cons**: Sterile and uninspiring for creative directors and luxury brands who demand visual proof of craft before discussing budget.

---

## 3. Builder Review Decisions & Resolved Questions

Following architectural and builder review, the following implementation choices are finalized:

1. **Hero Layout (Split 2-Column Hero)**:
   * On desktop (>= 1024px), the hero uses a high-impact 2-column layout:
     * **Left Stage (58% width)**: Cinematic media player framed in 4:5 / 16:9 responsive aspect ratio with subtle ambient blur backdrop, status pill (`• REEL` / `• PHOTO`), audio toggle (mute/unmute), and fullscreen button.
     * **Right Stage (42% width)**: Sticky-positioned identity panel with discipline kicker, verified badge, creator name in Playfair Display serif, location, bio blurb, live trust ribbon (`★ 5.0 · ARRI Certified`, `🟢 Live SLA: Replies under 1h`, `0% Commission`), day rate badge, and primary "Book [Name] →" CTA + Bookmark toggle.
   * On mobile (< 1024px), sections stack naturally into full-width mobile view.

2. **Reel & Poster Media Adaptation**:
   * Uses existing vertical 4:5 reels (`assets/reels/reel_0_director.mp4`, `reel_1_drone.mp4`) and high-res stills (`assets/cinema_posters/`, `assets/card/`).
   * Autoplay muted with user-triggered sound button; graceful instant fallback to high-res WebP still if video fails or buffers.

3. **Multi-Image Stills Gallery Data Pool**:
   * Extends `js/creators-data.js` (or a helper map) with a curated 4-item gallery per creator leveraging the repository's 20+ high-res stills in `assets/cinema_posters/` and `assets/card/`.
   * Each still includes caption, aspect ratio tag, and client/brand credit.
   * Fullscreen Lightbox modal with keyboard navigation (`Esc` close, `ArrowLeft` / `ArrowRight` prev/next) and mobile swipe support.

4. **Discipline-Aware Gear & Hardware Rack**:
   * For Camera DPs & Aerial Pilots: Verified camera bodies (*ARRI Alexa 35*, *Sony VENICE 2*, *Inspire 3*), anamorphic & spherical lenses (*Cooke Anamorphic*, *Master Primes*), and stabilization (*Steadicam M2*, *Tilta Float*).
   * For Virtual Production & LookDev Artists: Digital pipeline & workstation kit (*Unreal Engine 5.4*, *AOTO LED Volume*, *Mo-Sys StarTracker*, *DaVinci Resolve Studio*).

5. **Inquiry Modal & Endpoint Integration**:
   * Modal opens pre-populated with creator name and selected rate package.
   * Collects client name, company, email, shoot dates, shoot location, and scope notes.
   * POSTs to `/api/waitlist` with sanitized payload (`name`, `email`, `role: "Client Inquirer"`, `city`, `need: truncated scope`). Displays instant confirmation dialog and stores inquiry record locally.

---

## 4. Page Architecture & Detailed Sections

### A. Capsule Navigation Bar
* **Left**: Back pill (`← Explore Talent`) and `nexus.` brand dot wordmark.
* **Center**: Breadcrumb navigation (`Explore / Film & Video / [Creator Name]`).
* **Right**: Saved Shortlist counter button (`Saved [count]`) and "Join as a creator →" CTA.

### B. Cinematic Hero Stage & Creator Header
* Split stage with ambient video player and verified booking card.
* Synchronized bookmark button updating `localStorage['nexus_shortlist_v1']`.

### C. Verified Gear Rack & Technical Stack
* Visual hardware chips highlighting the artist's owned/operated cinema package or creative pipeline.

### D. Featured Commercial Work & Stills Lightbox
* Responsive editorial photo/stills grid showcasing recent commercial frames.
* Click-to-enlarge modal lightbox with high-res zoom, aspect ratio preservation, and keyboard navigation (`Esc`, `←`, `→`).

### E. Day Rate & Buyout Packages
* Clear 3-card transparent rate tiers:
  1. **Half-Day Shoot (Up to 5h)**: Quick turnaround, interview setups, pickups.
  2. **Full-Day Commercial (Up to 10h)**: Primary standard day rate including standard kit.
  3. **Multi-Day / Project Buyout (3+ Days)**: Narrative features, global campaigns, volume discount.
* Every card features an `Inquire about this tier →` CTA pre-filling the scope modal.

### F. Floating Action Dock (Persistent CTA)
* Appears smoothly when the user scrolls past the hero section.
* Desktop: Sleek bottom capsule showing creator avatar thumbnail, name, rate (`$650/day`), and `Book [Name] →` button.
* Mobile: Fixed bottom thumb zone bar with rate and full-width `Send Request →` button.

### G. Direct Inquiry Modal
* Pre-populates creator name, selected package, and day rate.
* Client Name, Work Email, Shoot Location, Target Dates, Scope Brief.
* Submits via fetch to `/api/waitlist` with zero page reload and displays an instant success toast.

### H. "More Like [Name]" Discovery Carousel
* Displays 3 relevant creators from the same discipline with live `/c/<slug>` routing, rate pills, and save buttons.

---

## 5. Technical Implementation & Data Flow

1. **Routing**: `dev_server.py` captures `/c/<slug>` and serves `creator.html`.
2. **Data Layer**: `js/creators-data.js` exposes `window.NEXUS_CREATORS` (34 records) and `window.NEXUS_CREATOR_URL(nameOrSlug)`.
3. **Controller**: `js/creator.js` extracts the slug from `window.location.pathname`, finds the matching creator object, and hydrates the DOM.
4. **Shortlist State**: Synchronized with `localStorage['nexus_shortlist_v1']` so saving on `/c/<slug>` reflects on `/explore` and vice versa.
5. **Explore Card Navigation**: Update `js/explore.js` so clicking a creator's card image or name navigates directly to `/c/<slug>`.

---

## 6. Non-Goals & Constraints
* **No Server-Side DB Required**: Built as a zero-dependency static/client-hydrated architecture compatible with current development setup.
* **No Authentication Wall**: Clients do not need an account to browse portfolios or send project briefs.
* **No Broken Links**: Invalid slugs gracefully show a branded 404 state with a `← Browse All Creators` button back to `/explore`.
