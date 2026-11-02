# Master Pages Roadmap & Implementation Checklist
**Platform:** Nexus — Creator & Business Discovery Marketplace (Tyrone Strickland Jr)  
**Standard:** Apple-Grade Midnight Obsidian Aesthetics (`#0B0F19`), Concentric Radii, Zero-Escrow Directory Model  
**Tracking Rule:** Each page is checked off `[x]` as soon as it is built and verified.

---

## 🎯 Current Sprint Focus: Page #2 (Directory & Search Explorer)

```
[x] Completed:   Page 1 — Homepage & Curated Talent Showcase (/) -> Running on http://localhost:3000
[ ] Next Up:     Page 2 — Directory & Search Explorer (/explore)
[ ] Queued:      Page 3 — Creator Storefront Profile (/[slug])
```

---

## 1. Public & Discovery Pages (The Front Showcase)

- [x] **1. Homepage / Talent Showcase (`/`)** `[COMPLETED & LIVE ON LOCALHOST:3000]`
  - *Route:* `/` (Live in `index.html`)
  - *Hero Section:* Dark obsidian void (`#080C14`), display typography (`Outfit` / `Plus Jakarta Sans`), high-contrast value proposition (*"Direct access to vetted creative talent. Zero platform markups."*).
  - *Floating Search Bar:* Frosted glass pill with live query input, location tag, and quick-filter category pills.
  - *Curated Showreel Reel:* 16:9 video reels auto-playing with hover zoom and concentric glass borders.
  - *Founding 100 Live Counter:* Live progress bar displaying claimed founding member spots (`42 / 100 Claimed`).
  - *Fee Comparison Calculator:* Interactive slider calculating annual savings over Upwork/Fiverr's 20% cut.
  - *30-Second Lead Modal:* Structured intake modal with live Resend relay simulation.
  - *Footer:* Clean minimalist footer with legal, directory hubs, and seller apply links.

- [ ] **2. Directory & Talent Explorer (`/explore`)**
  - *Route:* `/explore` or `/search`
  - *Components:* Real-time debounced search bar, faceted filter drawer (City, Category, Price, Equipment tags, Travel radius), responsive masonry card grid, fast-responder badges (`< 2 hrs`).

- [ ] **3. Programmatic Local SEO Pages (`/[city]/[category]`)**
  - *Route:* `/[city]/[category]` (e.g. `/austin/videography`, `/atlanta/brand-photography`)
  - *Components:* Server-rendered H1, localized Schema.org `LocalBusiness` JSON-LD, filtered creator grid for organic Google search traffic.

- [ ] **4. Creator Storefront Profile (`/[slug]`)**
  - *Route:* `/storefront/[slug]` (e.g. `/storefront/marcus-vance`)
  - *Components:* Full-bleed 4K showreel hero player, identity strip (avatar, verified badge, location, SLA badge), tabbed portfolio (WebP gallery, service packages, client reviews, equipment list), sticky mobile action dock.

- [ ] **5. Structured Lead Intake Modal (Storefront Overlay)**
  - *Route:* Modal on `/storefront/[slug]`
  - *Components:* 4-step progressive disclosure: (1) Select Service package or custom, (2) Target event date, (3) Budget bracket ($1k–$2.5k, $2.5k–$5k, $5k+), (4) Project scope + seamless 1-click Google OAuth conversion.

- [ ] **6. Pricing & For Creators Explainer (`/for-creators`)**
  - *Route:* `/for-creators` or `/pricing`
  - *Components:* Flat $49/mo membership pitch, 90-day free trial founding member hook, commission savings calculator, *"Apply as Founding Creator"* CTA.

---

## 2. Authentication & Identity Pages

- [ ] **7. Unified Login (`/login`)**
  - *Route:* `/login`
  - *Components:* Email/password form, passwordless magic link trigger, 1-click Google OAuth with PKCE, Turnstile bot shield.

- [ ] **8. 2-Card Sign-Up & Role Fork (`/signup`)**
  - *Route:* `/signup`
  - *Components:* Interactive role selector: *"I'm Looking to Hire"* (creates Seeker account) vs *"I'm a Creator / Business"* (launches Creator wizard).

- [ ] **9. Password Recovery & Verification (`/forgot-password`, `/reset-password`)**
  - *Route:* `/forgot-password`, `/reset-password`
  - *Components:* 256-bit secure token generation, email dispatch via Resend, new password strength meter.

---

## 3. Creator / Founder Operations (The Supply Engine)

- [ ] **10. 5-Step Storefront Onboarding Wizard (`/seller/onboarding`)**
  - *Route:* `/seller/onboarding`
  - *Components:* (1) Business identity & slug, (2) Direct-to-R2 presigned showreel/photo upload, (3) Service package menu, (4) Gear tags & socials, (5) Interactive live preview before submission.

- [ ] **11. Application Waiting Room (`/seller/pending-review`)**
  - *Route:* `/seller/pending-review`
  - *Components:* Live review status screen informing the creator their application is queued with Tyrone.

- [ ] **12. Reapplication & Feedback Screen (`/seller/reapply`)**
  - *Route:* `/seller/reapply`
  - *Components:* Displays Tyrone's specific rejection notes with a 1-click edit-and-resubmit workflow.

- [ ] **13. VIP Founding Trial Activation (`/seller/activate`)**
  - *Route:* `/seller/activate`
  - *Components:* Post-approval Stripe SetupIntent embed ($0.00 due today) to claim 90-day free pass and publish storefront to directory.

- [ ] **14. Creator Command Center Dashboard (`/seller/dashboard`)**
  - *Route:* `/seller/dashboard`
  - *Components:* Lead pipeline Kanban with glowing SLA response timers, profile impression telemetry, trial countdown badge, Stripe billing quick-link.

- [ ] **15. Storefront Customizer & Portfolio Editor (`/seller/storefront-editor`)**
  - *Route:* `/seller/storefront-editor`
  - *Components:* Drag-and-drop portfolio re-ordering, package price editor, "Vacation Mode" temporary visibility toggle.

- [ ] **16. Creator Lead Inbox & Direct Chat (`/seller/messages/[id]`)**
  - *Route:* `/seller/messages` & `/seller/messages/[id]`
  - *Components:* In-app messaging drawer, pinned project scope/budget card, file attachments, and email alert integration.

- [ ] **17. Stripe Billing & Subscription Portal (`/seller/billing`)**
  - *Route:* `/seller/billing`
  - *Components:* Direct launch into Stripe Customer Portal to update credit cards, download tax invoices, or cancel plan.

---

## 4. Seeker / Client Workspace Pages

- [ ] **18. Client Inquiries Dashboard (`/seeker/dashboard`)**
  - *Route:* `/seeker/dashboard`
  - *Components:* Visual tracker of all submitted inquiries (`Sent`, `Read`, `Proposal Received`, `Booked`), direct deep-links to active chat threads.

- [ ] **19. Saved Talent Board (`/seeker/saved`)**
  - *Route:* `/seeker/saved`
  - *Components:* Grid of bookmarked creator storefronts with live availability tags.

- [ ] **20. Client Chat Thread (`/seeker/messages/[id]`)**
  - *Route:* `/seeker/messages/[id]`
  - *Components:* Direct chat with creator, proposal inspection, file sharing.

---

## 5. Super Admin (Tyrone Strickland Jr) Command Center

- [ ] **21. Split-Screen Gatekeeper Vetting Workstation (`/admin/queue`)**
  - *Route:* `/admin/queue`
  - *Components:* Left panel queue of applicants, right panel inspection deck (showreel player, bio, gear, packages), 1-click `[Approve]` (with 100-member atomic row lock) and 1-click `[Reject]`.

- [ ] **22. Directory Moderation & Kill-Switch (`/admin/sellers`)**
  - *Route:* `/admin/sellers`
  - *Components:* Searchable master seller table with 1-click instant delisting kill-switch.

- [ ] **23. Revenue & Quota Analytics (`/admin/analytics`)**
  - *Route:* `/admin/analytics`
  - *Components:* Real-time Monthly Recurring Revenue (MRR) meter, Founding Member progress bar (`X / 100 Claimed`), upcoming Day 91 renewal debits.

---

## 6. Legal & System Pages

- [ ] **24. Terms of Service & Listing Agreement (`/terms`)**
  - *Route:* `/terms`
  - *Components:* Zero-escrow directory agreement, 100% creator fee retention, FTC negative-option automatic renewal compliance.

- [ ] **25. Privacy Policy & Security (`/privacy`)**
  - *Route:* `/privacy`
  - *Components:* CCPA/GDPR compliance, cookie management, zero data selling policy.

- [ ] **26. Apple-Grade 404 & Error Screen (`/not-found`)**
  - *Route:* `/not-found`
  - *Components:* Minimalist dark obsidian error screen with 1-click return to exploration directory.

---

## 📊 Progress Summary
- **Total Pages:** 26
- **Completed:** 0 / 26
- **Current Milestone:** Build Page #1 (Landing Page & Hero Showcase)
