# Creator Portfolio & Direct Booking Slug Page (`/c/<slug>`) Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a luxury editorial creator portfolio and direct booking slug page at `/c/<slug>` (served by `creator.html`), featuring a split ambient cinematic media stage, verified gear rack, commercial stills lightbox gallery, transparent rate tiers, sticky action dock, and direct brief submission.

**Architecture:** A zero-server-dependency, client-hydrated architecture powered by `js/creators-data.js` (34 curated visual artists), `creator.html`, `css/creator.css`, and `js/creator.js`. Dynamic URL routing (`/c/<slug>`) is served by `dev_server.py`. State synchronization with Explore is maintained via `localStorage['nexus_shortlist_v1']`, and inquiries submit via fetch to `/api/waitlist`.

**Tech Stack:** Vanilla JavaScript (ES6+), HTML5 Video/Picture, CSS3 Modern Grid & Custom Properties, Playfair Display serif & Plus Jakarta Sans typography, Python Playwright & pytest.

**Spec:** [docs/superpowers/specs/2026-11-16-creator-slug-page-design.md](file:///Users/prashastpathak/Downloads/marketplace-architecture/docs/superpowers/specs/2026-11-16-creator-slug-page-design.md)

## Global Constraints

- **Route Handling:** Served at `/c/<slug>` and `/creator.html?slug=<slug>`.
- **Database Dependency:** No server-side database required; hydrations sourced from `window.NEXUS_CREATORS`.
- **Shortlist Persistence:** Must share and synchronize with `localStorage['nexus_shortlist_v1']` used by `/explore`.
- **Design Tokens:** Strict alignment with luxury editorial aesthetic—Midnight Obsidian (`#0F172A`), cream/slate surfaces (`#F8FAFC`), electric accent (`#3B54EE`), concentric corner radii (`24px`/`28px`), and Playfair Display typography.
- **Resilience:** Invalid or unmapped slugs must show a branded 404 state with a clean `← Browse All Creators` link back to `/explore`.

## Review Focus

1. **Unrecognized or malformed slug (`/c/does-not-exist`):** Renders branded 404 state with "Creator not found" and a primary CTA button back to `/explore` with zero console crashes. Tested in Task 5.
2. **Video reel loading failure or missing video source:** When `<video>` fails or creator has only photos, displays high-res still poster with smooth crossfade and zero layout shifts. Tested in Task 2.
3. **Empty or corrupted `nexus_shortlist_v1` in `localStorage`:** JSON parse error or missing key defaults safely to empty Set and displays badge count `0`. Tested in Task 2.
4. **Inquiry brief payload truncation / formatting for `/api/waitlist`:** Respects backend 300-char limit for `need`, sends `role: 'client'`, and returns affirmative confirmation. Tested in Task 4.
5. **Mobile viewport (< 820px):** Split 2-column hero collapses to single-column; sticky booking dock pins to bottom thumb-zone without obscuring content. Tested in Task 5.

---

### Task 1: Dataset Enrichment (`js/creators-data.js`)

**Files:**
- Modify: `js/creators-data.js`
- Test: `tests/test_creators_data.py`

**Interfaces:**
- Consumes: Raw creator records in `js/creators-data.js`.
- Produces: `window.NEXUS_CREATORS` array of 34 objects, each guaranteed to contain:
  - `gear`: `string[]` (e.g. `['ARRI Alexa 35', 'Cooke 2x Anamorphic', 'Steadicam M2']` or `['Unreal Engine 5.4', 'AOTO LED Volume', 'Mo-Sys StarTracker']`).
  - `trust`: `{ rating: number, reviewsCount: number, billed: string, sla: string, direct: boolean }`.
  - `gallery`: `Array<{ src: string, caption: string, credit: string, tag: string }>` (4 high-res frames per creator).

- [ ] **Step 1: Write the failing test**

Create `tests/test_creators_data.py`:
```python
import pytest
from playwright.sync_api import sync_playwright

def test_nexus_creators_schema():
    with sync_playwright() as p:
        browser = p.chromium.launch(channel="chrome", headless=True)
        page = browser.new_page()
        page.goto("http://localhost:3000/creator.html?slug=marcus-vance")
        creators = page.evaluate("() => window.NEXUS_CREATORS")
        assert len(creators) == 34
        for c in creators:
            assert "gear" in c and isinstance(c["gear"], list) and len(c["gear"]) >= 3
            assert "trust" in c and isinstance(c["trust"], dict)
            assert c["trust"]["rating"] >= 4.5
            assert "gallery" in c and isinstance(c["gallery"], list) and len(c["gallery"]) == 4
            for g in c["gallery"]:
                assert "src" in g and "caption" in g and "credit" in g
        browser.close()
```

- [ ] **Step 2: Run test to verify it fails**

Run: `pytest tests/test_creators_data.py -v`  
Expected: FAIL with `AssertionError: assert 'gear' in c`

- [ ] **Step 3: Implement schema enrichment in `js/creators-data.js`**

Add craft-specific gear pools, trust metrics generator, and 4-item gallery mapping to `js/creators-data.js`:
- For camera/lighting crafts (`film`, `aerial`, `action`): assign cinema camera bodies, glass, and stabilizer packages.
- For 3D/virtual crafts (`d3`, `art`): assign virtual production volumes, render engines, and color grading suites.
- For gallery: generate 4 high-res image items per creator using existing sharp stills from `assets/cinema_posters/` and `assets/card/` with curated editorial captions.

- [ ] **Step 4: Run test to verify it passes**

Run: `pytest tests/test_creators_data.py -v`  
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add js/creators-data.js tests/test_creators_data.py
git commit -m "feat(data): enrich creator dataset with gear stack, trust metrics, and gallery pool"
```

---

### Task 2: Split Hero Stage & Ambient Media Player (`creator.html`, `css/creator.css`, `js/creator.js`)

**Files:**
- Modify: `creator.html`
- Modify: `css/creator.css`
- Modify: `js/creator.js`
- Test: `tests/test_hero_stage.py`

**Interfaces:**
- Consumes: `window.NEXUS_CREATORS` enriched dataset from Task 1, `localStorage['nexus_shortlist_v1']`.
- Produces:
  - Header capsule navigation: Breadcrumbs (`← Explore / [Craft] / [Name]`), Brand home link, Shortlist counter badge button.
  - Split 2-column hero (`.cp-hero`):
    - Left Stage (`.cp-media`): Responsive 4:5/16:9 frame, autoplay muted loop `<video>` with fallback `<img>`, `#cpAudioToggle` mute/unmute button, media status tag (`• REEL` / `• PHOTO`).
    - Right Panel (`.cp-panel`): Discipline kicker with verified icon, creator name in Playfair Display, bio italic blurb, Trust Ribbon (`★ 5.0 · ARRI Certified · $240k+ Billed`, `🟢 Replies under 1h`), rate badge (`$650/day · 0% Fee`), and primary action buttons (`Book [Name] →`, `#cpSave` shortlist toggle).

- [ ] **Step 1: Write the failing test**

Create `tests/test_hero_stage.py`:
```python
from playwright.sync_api import sync_playwright

def test_split_hero_and_shortlist():
    with sync_playwright() as p:
        browser = p.chromium.launch(channel="chrome", headless=True)
        page = browser.new_page()
        page.goto("http://localhost:3000/c/marcus-vance")
        
        # Check hero identity elements
        assert page.locator(".cp-name").inner_text().strip() == "Marcus Vance"
        assert "Commercial DP" in page.locator(".cp-kicker").inner_text()
        assert page.locator(".cp-trust-ribbon").is_visible()
        
        # Check audio toggle button exists for reels
        audio_btn = page.locator("#cpAudioToggle")
        assert audio_btn.is_visible()
        audio_btn.click()
        assert "Unmuted" in audio_btn.inner_text() or audio_btn.get_attribute("aria-label") == "Mute audio"
        
        # Check shortlist toggle updates localStorage
        save_btn = page.locator("#cpSave")
        save_btn.click()
        assert page.evaluate("() => JSON.parse(localStorage.getItem('nexus_shortlist_v1')).includes('marcus-vance')")
        
        browser.close()
```

- [ ] **Step 2: Run test to verify it fails**

Run: `pytest tests/test_hero_stage.py -v`  
Expected: FAIL with `waiting for locator(".cp-trust-ribbon")` or `#cpAudioToggle`

- [ ] **Step 3: Implement split hero stage in `creator.html`, `css/creator.css`, `js/creator.js`**

1. In `creator.html`: Refactor hero container structure and header capsule navigation.
2. In `css/creator.css`:
   - Implement desktop 2-column split grid (`grid-template-columns: minmax(0, 1.28fr) minmax(0, 1fr)`).
   - Style `.cp-trust-ribbon` with micro-badges, verified star rating, SLA indicator, and 0% commission badge.
   - Style `.cp-media` with ambient blur backdrop and audio control button overlay.
3. In `js/creator.js`:
   - Hydrate hero with enriched creator data.
   - Bind audio toggle button to video mute/unmute state.
   - Bind `#cpSave` to sync with `localStorage['nexus_shortlist_v1']` and toast notification.

- [ ] **Step 4: Run test to verify it passes**

Run: `pytest tests/test_hero_stage.py -v`  
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add creator.html css/creator.css js/creator.js tests/test_hero_stage.py
git commit -m "feat(profile): implement split cinematic hero stage, trust ribbon, and audio controls"
```

---

### Task 3: Verified Gear Rack & Commercial Stills Lightbox Gallery (`creator.html`, `css/creator.css`, `js/creator.js`)

**Files:**
- Modify: `creator.html`
- Modify: `css/creator.css`
- Modify: `js/creator.js`
- Test: `tests/test_gallery_lightbox.py`

**Interfaces:**
- Consumes: `c.gear` and `c.gallery` from enriched data.
- Produces:
  - `#cpGearRack`: Flex chip layout of verified cameras, optics, stabilizers, or virtual production engines with category icons.
  - `#cpGallery`: 4-frame commercial work mosaic with zoom hover effect and brand credits.
  - `#cpLightbox`: Fullscreen modal lightbox supporting:
    - High-res image display with caption and credit tag.
    - Prev / Next buttons.
    - Keyboard controls: `Escape` (close), `ArrowLeft` (previous), `ArrowRight` (next).

- [ ] **Step 1: Write the failing test**

Create `tests/test_gallery_lightbox.py`:
```python
from playwright.sync_api import sync_playwright

def test_gear_rack_and_lightbox():
    with sync_playwright() as p:
        browser = p.chromium.launch(channel="chrome", headless=True)
        page = browser.new_page()
        page.goto("http://localhost:3000/c/marcus-vance")
        
        # Verify gear chips
        gear_chips = page.locator(".cp-gear-chip")
        assert gear_chips.count() >= 3
        assert "ARRI Alexa 35" in page.locator(".cp-gear-rack").inner_text()
        
        # Verify gallery stills and lightbox
        shots = page.locator(".cp-shot")
        assert shots.count() == 4
        
        # Click second still to open lightbox
        shots.nth(1).click()
        lightbox = page.locator("#cpLightbox")
        assert lightbox.is_visible()
        assert lightbox.get_attribute("aria-hidden") == "false"
        
        # Navigate with ArrowRight
        img_before = page.locator("#lightboxImg").get_attribute("src")
        page.keyboard.press("ArrowRight")
        img_after = page.locator("#lightboxImg").get_attribute("src")
        assert img_before != img_after
        
        # Close with Escape
        page.keyboard.press("Escape")
        assert not lightbox.is_visible() or lightbox.get_attribute("aria-hidden") == "true"
        
        browser.close()
```

- [ ] **Step 2: Run test to verify it fails**

Run: `pytest tests/test_gallery_lightbox.py -v`  
Expected: FAIL with `waiting for locator(".cp-gear-chip")`

- [ ] **Step 3: Implement gear rack and lightbox modal**

1. In `creator.html`: Add `#cpLightbox` modal template with image container, caption, navigation arrows, and close button.
2. In `css/creator.css`:
   - Style `.cp-gear-rack` and `.cp-gear-chip` with glassmorphic styling, pill borders, and micro-icons.
   - Style 4-up `.cp-work` grid with responsive layout, subtle image zoom, and credit overlay.
   - Style `.cp-lightbox` with backdrop-filter blur, smooth fade transitions, and sleek navigation controls.
3. In `js/creator.js`:
   - Render gear chips and 4-item gallery from `c.gear` and `c.gallery`.
   - Implement lightbox controller: click open, index tracking, next/prev methods, and keyboard listeners (`Escape`, `ArrowLeft`, `ArrowRight`).

- [ ] **Step 4: Run test to verify it passes**

Run: `pytest tests/test_gallery_lightbox.py -v`  
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add creator.html css/creator.css js/creator.js tests/test_gallery_lightbox.py
git commit -m "feat(gallery): add verified gear rack and interactive stills lightbox with keyboard navigation"
```

---

### Task 4: Transparent Rate Tiers, Sticky Action Dock & Inquiry Modal (`creator.html`, `css/creator.css`, `js/creator.js`)

**Files:**
- Modify: `creator.html`
- Modify: `css/creator.css`
- Modify: `js/creator.js`
- Test: `tests/test_inquiry_packages.py`

**Interfaces:**
- Consumes: `c.numericRate`, `c.creator`, `c.craft`, `c.city`.
- Produces:
  - 3 rate package cards (Half-Day, Full-Day Featured Standard, Multi-Day Project Buyout) with `Inquire about this tier →` action.
  - Sticky bottom action dock (`#cpDock`) that appears smoothly when scrolled past the hero stage, displaying creator avatar, name, rate, and instant `Book [Name] →` CTA.
  - Direct inquiry modal pre-filling selected package scope, sending POST to `/api/waitlist` with client role, and showing confirmation toast.

- [ ] **Step 1: Write the failing test**

Create `tests/test_inquiry_packages.py`:
```python
from playwright.sync_api import sync_playwright

def test_packages_and_inquiry_flow():
    with sync_playwright() as p:
        browser = p.chromium.launch(channel="chrome", headless=True)
        page = browser.new_page()
        page.goto("http://localhost:3000/c/marcus-vance")
        
        # Verify 3 package tiers
        packages = page.locator(".cp-service")
        assert packages.count() == 3
        assert page.locator(".cp-service.is-main").is_visible()
        
        # Click inquiry button on Half-Day tier
        half_day_btn = packages.nth(0).locator("button[data-request]")
        half_day_btn.click()
        
        # Verify modal opens and scope is pre-populated
        modal = page.locator("#inquiryModal")
        assert modal.is_visible()
        scope_val = page.locator("#inqScope").input_value()
        assert "Half day" in scope_val or "Commercial DP" in scope_val
        
        # Close modal
        page.locator("#closeModalBtn").click()
        assert not modal.is_visible()
        
        # Scroll down and check floating dock appears
        page.evaluate("window.scrollTo(0, 1000)")
        page.wait_for_timeout(300)
        dock = page.locator("#cpDock")
        assert dock.is_visible()
        assert "Marcus" in dock.inner_text()
        
        browser.close()
```

- [ ] **Step 2: Run test to verify it fails**

Run: `pytest tests/test_inquiry_packages.py -v`  
Expected: FAIL with assertion on dock or package tier structure

- [ ] **Step 3: Implement package cards, scroll observer, and inquiry handler**

1. In `creator.html`: Update package cards container and floating dock HTML structure.
2. In `css/creator.css`:
   - Style `.cp-services` with 3 cards, giving the center Full-Day tier elevated border styling and featured tag.
   - Style `#cpDock` as a floating capsule dock with avatar thumbnail, rate, and booking CTA; animate with `transform` and `opacity`.
3. In `js/creator.js`:
   - Render package tiers with calculated rates (0.6x for Half-day, 1.0x for Full-day, 0.9x for Multi-day).
   - Implement IntersectionObserver on hero stage to toggle floating dock visibility on scroll.
   - Refactor modal submit handler: sanitize inputs, truncate `need` brief <= 300 chars, POST to `/api/waitlist`, show confirmation toast, and reset form.

- [ ] **Step 4: Run test to verify it passes**

Run: `pytest tests/test_inquiry_packages.py -v`  
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add creator.html css/creator.css js/creator.js tests/test_inquiry_packages.py
git commit -m "feat(booking): add transparent rate packages, floating action dock, and direct inquiry submission"
```

---

### Task 5: Explore Card Navigation, 404 Resilience & Responsive Layout Verification (`js/explore.js`, `creator.html`, `js/creator.js`, `tests/test_creator_page.py`)

**Files:**
- Modify: `js/explore.js`
- Modify: `creator.html`
- Modify: `js/creator.js`
- Test: `tests/test_creator_page.py`

**Interfaces:**
- Consumes: Explore cards, `/c/<slug>` routes.
- Produces: Direct navigation from `/explore` cards (thumbnail or name click) to `/c/<slug>`, graceful branded 404 view for non-existent creators, and flawless responsive layouts across desktop (1280px) and mobile (375px).

- [ ] **Step 1: Write the failing test**

Create `tests/test_creator_page.py`:
```python
from playwright.sync_api import sync_playwright

def test_explore_to_creator_navigation_and_404():
    with sync_playwright() as p:
        browser = p.chromium.launch(channel="chrome", headless=True)
        
        # 1. Desktop Explore -> Profile Navigation
        page = browser.new_page(viewport={"width": 1280, "height": 800})
        page.goto("http://localhost:3000/explore")
        first_card = page.locator(".dir-card").first
        first_name = first_card.locator(".ws-name").inner_text().strip()
        first_card.locator(".ws-stage").click()
        page.wait_for_url("**/c/*")
        assert page.locator(".cp-name").inner_text().strip() == first_name
        
        # 2. Check 404 view on unknown slug
        page.goto("http://localhost:3000/c/unknown-creator-xyz")
        assert "couldn't find that creator" in page.locator(".cp-name").inner_text().lower()
        browse_all_btn = page.locator(".cp-missing a")
        assert browse_all_btn.is_visible()
        browse_all_btn.click()
        page.wait_for_url("**/explore")
        
        # 3. Mobile Viewport Layout Verification
        mobile_page = browser.new_page(viewport={"width": 375, "height": 812})
        mobile_page.goto("http://localhost:3000/c/marcus-vance")
        assert mobile_page.locator(".cp-name").is_visible()
        mobile_page.evaluate("window.scrollTo(0, 800)")
        mobile_page.wait_for_timeout(200)
        assert mobile_page.locator("#cpDock").is_visible()
        
        # 4. Multi-creator profile checks (3D, Drone, Art)
        for slug in ["elena-rostova", "kai-tanaka", "maya-lin"]:
            page.goto(f"http://localhost:3000/c/{slug}")
            assert page.locator(".cp-name").is_visible()
            assert page.locator(".cp-gear-rack").is_visible()
            assert page.locator(".cp-shot").count() == 4
        
        browser.close()
```

- [ ] **Step 2: Run test to verify it fails**

Run: `pytest tests/test_creator_page.py -v`  
Expected: FAIL if explore click-through or 404 routing doesn't match assertions

- [ ] **Step 3: Implement explore navigation and polish 404 & mobile styling**

1. In `js/explore.js`: Ensure clicking `.ws-stage` or `.ws-name` navigates reliably to `/c/${item.slug}`.
2. In `js/creator.js` and `css/creator.css`:
   - Enhance `.cp-missing` branded 404 screen with centered typography, friendly copy, and a direct `Browse all creators →` button.
   - Adjust media queries for `@media (max-width: 820px)` and `@media (max-width: 480px)` ensuring seamless padding, font clamp sizing, and touch-target sizes.

- [ ] **Step 4: Run test to verify it passes**

Run: `pytest tests/test_creator_page.py -v`  
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add js/explore.js creator.html js/creator.js css/creator.css tests/test_creator_page.py
git commit -m "feat(integration): link explore cards to creator slug pages and verify responsive 404 resilience"
```
