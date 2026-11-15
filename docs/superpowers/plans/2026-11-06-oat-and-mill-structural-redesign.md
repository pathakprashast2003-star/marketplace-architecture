# Oat & Mill Structural Redesign Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Transform the cluttered, text-stuffed talent cards (currently 8 vertical competing layers) into the pure, architectural, 3-zone structure of the Oat & Mill reference mobile application (`media_1793983044227_b1afa004.jpg`), establishing geometric sans typography, generous visual breathing room, and moving dense secondary metadata into an interactive drawer.

**Architecture:** Adopt Oat & Mill's proven 3-screen spatial hierarchy: Screen 1 becomes our high-end browse gallery with 3-zone cards (Masthead Title + Pill, Floating Hero Stage, Telemetry Rate + Circular Arrow Button); Screen 2 becomes our interactive Creator Detail Sheet (revealing the full bio, equipment matrix, and 30-second inquiry form upon card tap); Screen 3 integrates with the client booking drawer. All typography is standardized to crisp geometric sans (`Plus Jakarta Sans` / `SF Pro Display`), completely eliminating Times New Roman and serif fallbacks.

**Tech Stack:** Modern Vanilla CSS3 (Custom Properties, Flexbox, Grid, concentric border radii, drop shadows), Semantic HTML5, Vanilla JavaScript ES6+, Playwright for visual regression testing.

**Spec:** Visual design contract derived from `media_1793983044227_b1afa004.jpg` (Oat & Mill App) and user critique of `media_1793983032754_3f3967ac.jpg` ("not even structured... content for the sake of it... see how the typing is, how the spacing is, how everything looks. So freaking structured here").

## Global Constraints

- `--font-display` MUST be `'Plus Jakarta Sans', -apple-system, BlinkMacSystemFont, 'SF Pro Display', 'Inter', system-ui, sans-serif` — zero serif or Times New Roman fonts anywhere in UI.
- Card border-radius MUST be concentric `36px` on desktop and `32px` on mobile.
- Card internal padding MUST be generous (`28px 24px 22px`).
- Card face MUST NOT contain bio paragraphs, equipment tag pills, or multiple competing buttons.
- Card face MUST consist of exactly 3 clean zones: Masthead (Name + pill), Hero Stage (3D Character or Cinematic Reel), and Footer (Rate + Star Rating on left, 48px Circular Action Button on right).
- Full bio, equipment chips, and inquiry form MUST be fully preserved and accessible via the Creator Detail Modal/Drawer on card click.
- Both `index.html` and `ninjax.html` MUST remain in identical parity.

## Review Focus

1. **Card Visual Clutter & Structural Purity:** Cards must not feel stuffed; visual breathing room around the hero asset must match Oat & Mill Screen 1.
2. **Typography Consistency:** All headlines, names, and numbers must render in clean, bold geometric sans with tight line-height and letter-spacing (`-0.03em`).
3. **Switching Views:** Toggling between "3D Personas" and "Client Reels" in the control bar must smoothly swap the visual asset inside the hero stage without breaking layout.
4. **Interactive Preservation:** Clicking any card or its circular button must open the Creator Detail Sheet containing all creator specs, bio, equipment chips, and booking flow.
5. **Mobile Responsiveness:** Viewports down to 360px must display cards cleanly with minimum 44px touch targets and zero horizontal overflow.

---

### Task 1: Typography & Token Reset (Eliminate Serif, Lock Geometric Sans)

**Files:**
- Modify: `index.html:45-65`
- Test: `test-typography.js`

**Interfaces:**
- Consumes: CSS `:root` token variables.
- Produces: Normalized geometric sans tokens for `--font-display`, `--font-body`, and font weights.

- [ ] **Step 1: Write the failing test**

Create `test-typography.js` to assert that `--font-display` contains no serif fonts and that `.nx-card-name` computed font family evaluates to sans-serif.

```javascript
const { chromium } = require('playwright');
const assert = require('assert');

(async () => {
  const browser = await chromium.launch();
  const page = await browser.newPage();
  await page.goto('http://localhost:3000');
  const fontDisplay = await page.evaluate(() => {
    return getComputedStyle(document.documentElement).getPropertyValue('--font-display').trim();
  });
  assert(!fontDisplay.toLowerCase().includes('times'), 'Times New Roman found in --font-display');
  assert(!fontDisplay.toLowerCase().includes('serif'), 'Serif found in --font-display');
  assert(fontDisplay.includes('Plus Jakarta Sans') || fontDisplay.includes('apple-system'), 'Expected geometric sans');
  await browser.close();
  console.log('Task 1 typography test passed');
})();
```

- [ ] **Step 2: Run test to verify it fails**

Run: `node test-typography.js`
Expected: FAIL with "Serif found in --font-display" or "Times New Roman found in --font-display".

- [ ] **Step 3: Implement typography token reset in `index.html`**

Update `:root` in `index.html`:
```css
--font-display: 'Plus Jakarta Sans', -apple-system, BlinkMacSystemFont, 'SF Pro Display', 'Inter', system-ui, sans-serif;
--font-serif: 'Plus Jakarta Sans', -apple-system, BlinkMacSystemFont, 'SF Pro Display', 'Inter', system-ui, sans-serif;
--font-body: 'Plus Jakarta Sans', -apple-system, BlinkMacSystemFont, 'SF Pro Text', 'Inter', system-ui, sans-serif;
```
Ensure `.nx-card-name`, `.nx-h2`, `.headline-stack`, `.nx-tile h3`, and `.nx-table-name` inherit this clean sans with `font-weight: 850; letter-spacing: -0.03em;`.

- [ ] **Step 4: Run test to verify it passes**

Run: `node test-typography.js`
Expected: PASS with "Task 1 typography test passed".

- [ ] **Step 5: Commit**

```bash
git add index.html test-typography.js
git commit -m "style: reset typography tokens to Oat & Mill geometric sans"
```

---

### Task 2: Oat & Mill 3-Zone Card Architecture Implementation

**Files:**
- Modify: `index.html` (CSS lines ~1780-2420, HTML cards lines ~3115-3520)
- Test: `test-card-structure.js`

**Interfaces:**
- Consumes: Talent dataset (names, craft tags, rates, images).
- Produces: Pure 3-zone card anatomy (`.nx-card-masthead`, `.nx-card-stage`, `.nx-card-footer`).

- [ ] **Step 1: Write the failing test**

Create `test-card-structure.js` to assert that each card in `.nx-talent-grid` contains exactly the 3 Oat & Mill structural zones and has no bio paragraphs or cluttered chip clusters on the card face.

```javascript
const { chromium } = require('playwright');
const assert = require('assert');

(async () => {
  const browser = await chromium.launch();
  const page = await browser.newPage();
  await page.goto('http://localhost:3000');
  
  const cards = await page.$$('.nx-talent-card');
  assert(cards.length >= 6, 'Expected at least 6 talent cards');
  
  for (let i = 0; i < cards.length; i++) {
    const card = cards[i];
    const masthead = await card.$('.nx-card-masthead');
    const stage = await card.$('.nx-card-stage');
    const footer = await card.$('.nx-card-footer');
    assert(masthead !== null, `Card ${i} missing .nx-card-masthead`);
    assert(stage !== null, `Card ${i} missing .nx-card-stage`);
    assert(footer !== null, `Card ${i} missing .nx-card-footer`);
    
    // Ensure cluttered elements are not on card face
    const bio = await card.$('.nx-card-bio');
    assert(bio === null, `Card ${i} should not have .nx-card-bio on face`);
    const chipRow = await card.$('.nx-card-chips');
    assert(chipRow === null, `Card ${i} should not have .nx-card-chips on face`);
  }
  
  await browser.close();
  console.log('Task 2 card structure test passed');
})();
```

- [ ] **Step 2: Run test to verify it fails**

Run: `node test-card-structure.js`
Expected: FAIL with `.nx-card-masthead missing` or `.nx-card-bio found`.

- [ ] **Step 3: Implement Oat & Mill 3-Zone Card HTML & CSS in `index.html`**

1. Restructure the 6 talent cards in HTML:
```html
<article class="nx-talent-card nx-reveal" data-craft="film" data-city="austin" data-name="marcus vance" onclick="openCreatorDrawer('Marcus Vance')">
  <!-- Zone 1: Masthead -->
  <div class="nx-card-masthead">
    <div class="nx-card-title-group">
      <h3 class="nx-card-name">Marcus<br>Vance</h3>
      <div class="nx-card-spec-pill">Commercial Cinema · Austin</div>
    </div>
    <div class="nx-card-badge" title="Verified Creator">
      <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#FFFFFF" stroke-width="3"><polyline points="20 6 9 17 4 12"></polyline></svg>
    </div>
  </div>

  <!-- Zone 2: Staged Visual Hero (Unconfined, generous breathing room) -->
  <div class="nx-card-stage">
    <div class="nx-stage-layer nx-media-persona">
      <img class="nx-stage-img" src="assets/marcus_bust.webp" alt="Marcus Vance 3D model" loading="lazy">
    </div>
    <div class="nx-stage-layer nx-media-reel">
      <img class="nx-stage-img nx-reel-img" src="assets/cinema_posters/poster_0_director.jpg" alt="Marcus Vance cinema reel still" loading="lazy">
    </div>
  </div>

  <!-- Zone 3: Footer Telemetry & Circular Action -->
  <div class="nx-card-footer">
    <div class="nx-card-pricing-block">
      <div class="nx-card-rate">$650<span class="nx-card-unit">/day</span></div>
      <div class="nx-card-rating"><span class="nx-star">★</span> 5.0</div>
    </div>
    <button type="button" class="nx-card-action-circle" aria-label="Book Marcus Vance" onclick="event.stopPropagation(); openCreatorDrawer('Marcus Vance')">
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><line x1="5" y1="12" x2="19" y2="12"></line><polyline points="12 5 19 12 12 19"></polyline></svg>
    </button>
  </div>
</article>
```

2. Implement CSS styling in `index.html`:
- Card container: `border-radius: 36px; padding: 26px 24px 22px; display: flex; flex-direction: column; justify-content: space-between; min-height: 440px; cursor: pointer; transition: transform 0.25s cubic-bezier(0.16, 1, 0.3, 1), box-shadow 0.25s ease;`
- Zone 1 `.nx-card-masthead`: `display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 12px;`
- Title `.nx-card-name`: `font-family: var(--font-display); font-size: 24px; font-weight: 850; line-height: 1.15; letter-spacing: -0.03em; color: #220514; margin: 0 0 8px;`
- Pill `.nx-card-spec-pill`: `display: inline-flex; align-items: center; padding: 5px 12px; border-radius: 9999px; background: #FFFFFF; font-size: 11.5px; font-weight: 650; color: #5B404E; box-shadow: 0 2px 8px rgba(34, 5, 20, 0.05); border: 1px solid rgba(34, 5, 20, 0.06);`
- Zone 2 `.nx-card-stage`: `position: relative; flex: 1; display: flex; align-items: center; justify-content: center; min-height: 240px; margin: 12px 0;`
- Hero Image `.nx-stage-img`: `max-height: 220px; width: auto; object-fit: contain; filter: drop-shadow(0 16px 24px rgba(34, 5, 20, 0.14)); transition: transform 0.3s cubic-bezier(0.16, 1, 0.3, 1);`
- Zone 3 `.nx-card-footer`: `display: flex; justify-content: space-between; align-items: center; margin-top: auto; padding-top: 14px; border-top: 1px solid rgba(34, 5, 20, 0.06);`
- Rate `.nx-card-rate`: `font-family: var(--font-display); font-size: 22px; font-weight: 850; letter-spacing: -0.02em; color: #220514; font-variant-numeric: tabular-nums;`
- Circular Button `.nx-card-action-circle`: `width: 48px; height: 48px; border-radius: 50%; background: #3B0A24; color: #FFFFFF; border: none; display: flex; align-items: center; justify-content: center; cursor: pointer; box-shadow: 0 8px 18px rgba(59, 10, 36, 0.28); transition: transform 0.2s ease, background 0.2s ease;`

- [ ] **Step 4: Run test to verify it passes**

Run: `node test-card-structure.js`
Expected: PASS with "Task 2 card structure test passed".

- [ ] **Step 5: Commit**

```bash
git add index.html test-card-structure.js
git commit -m "feat: implement Oat & Mill 3-zone card structure"
```

---

### Task 3: Interactive Creator Detail Sheet (Preserving Specs, Bio & Inquiry Flow)

**Files:**
- Modify: `index.html` (Modal markup and JS controller `openCreatorDrawer`)
- Test: `test-creator-sheet.js`

**Interfaces:**
- Consumes: Card click event or circular action button click.
- Produces: Populated high-fidelity drawer/modal (Screen 2 of Oat & Mill) with bio, gear matrix, and booking form.

- [ ] **Step 1: Write the failing test**

Create `test-creator-sheet.js` to simulate clicking Marcus Vance's card and verifying the modal drawer opens with full gear specs, bio, and inquiry inputs.

```javascript
const { chromium } = require('playwright');
const assert = require('assert');

(async () => {
  const browser = await chromium.launch();
  const page = await browser.newPage();
  await page.goto('http://localhost:3000');
  
  // Click first card
  await page.click('.nx-talent-card:first-child');
  await page.waitForSelector('.nx-modal-overlay.is-active', { timeout: 3000 });
  
  // Verify modal contains creator details
  const modalTitle = await page.innerText('.nx-modal-title');
  assert(modalTitle.includes('Marcus Vance'), `Expected Marcus Vance in modal, got ${modalTitle}`);
  
  // Verify gear specs are displayed inside drawer
  const gearContent = await page.innerText('.nx-modal-gear-chips');
  assert(gearContent.includes('Cooke 2x Anamorphic') || gearContent.includes('RED V-Raptor'), 'Missing gear chips in modal');
  
  await browser.close();
  console.log('Task 3 creator sheet test passed');
})();
```

- [ ] **Step 2: Run test to verify it fails**

Run: `node test-creator-sheet.js`
Expected: FAIL if `.nx-modal-gear-chips` or drawer behavior is missing.

- [ ] **Step 3: Implement Creator Detail Sheet controller in `index.html`**

Update `openCreatorDrawer(creatorName)` in `index.html` to load the full creator profile:
- 3D Hero image / Reel preview
- Full Director/Operator bio
- Equipment inventory pills
- Historical telemetry (rating, completed projects, SLA)
- Fast 30-Second Inquiry submission form with real-time feedback

- [ ] **Step 4: Run test to verify it passes**

Run: `node test-creator-sheet.js`
Expected: PASS with "Task 3 creator sheet test passed".

- [ ] **Step 5: Commit**

```bash
git add index.html test-creator-sheet.js
git commit -m "feat: enhance creator detail drawer with complete equipment matrix and bio"
```

---

### Task 4: Mobile Responsiveness & Touch Purity

**Files:**
- Modify: `index.html` (Media queries `@media (max-width: 768px)`)
- Test: `test-mobile-visual.js`

**Interfaces:**
- Consumes: Viewport resize events (390px, 768px, 1440px).
- Produces: Single-column or card swipe layout with concentric radii and zero horizontal jitter.

- [ ] **Step 1: Write the failing test**

Create `test-mobile-visual.js` to verify viewport layout at 390px width.

```javascript
const { chromium } = require('playwright');
const assert = require('assert');

(async () => {
  const browser = await chromium.launch();
  const context = await browser.newContext({ viewport: { width: 390, height: 844 } });
  const page = await context.newPage();
  await page.goto('http://localhost:3000');
  
  const scrollWidth = await page.evaluate(() => document.documentElement.scrollWidth);
  const clientWidth = await page.evaluate(() => document.documentElement.clientWidth);
  assert(scrollWidth <= clientWidth, `Horizontal scroll overflow detected: ${scrollWidth} > ${clientWidth}`);
  
  await page.screenshot({ path: 'test_mobile_viewport.png', fullPage: false });
  await browser.close();
  console.log('Task 4 mobile test passed');
})();
```

- [ ] **Step 2: Run test to verify it fails**

Run: `node test-mobile-visual.js`
Expected: FAIL if horizontal overflow exists.

- [ ] **Step 3: Implement mobile card styling in `index.html`**

Ensure `.nx-talent-card` on mobile:
- Has `border-radius: 32px`
- Sets `padding: 22px 20px 18px`
- Circular action button maintains 48px touch diameter
- Maintains zero horizontal overflow

- [ ] **Step 4: Run test to verify it passes**

Run: `node test-mobile-visual.js`
Expected: PASS with "Task 4 mobile test passed".

- [ ] **Step 5: Commit**

```bash
git add index.html test-mobile-visual.js
git commit -m "style: optimize Oat & Mill card geometry for mobile touch"
```

---

### Task 5: Parity Sync & Final Visual Verification Gate

**Files:**
- Modify: `ninjax.html`
- Create: `verify-oat-mill-redesign.js`

**Interfaces:**
- Consumes: Verified `index.html`.
- Produces: Synced `ninjax.html` and visual proof screenshots.

- [ ] **Step 1: Sync `index.html` to `ninjax.html`**

Run: `cp index.html ninjax.html`

- [ ] **Step 2: Run full automated verification script**

Create and run `verify-oat-mill-redesign.js` to capture:
- `desktop_structured_roster.png` (1440x900)
- `mobile_structured_roster.png` (390x844)
- `creator_drawer_open.png` (Detail sheet)

- [ ] **Step 3: Verify visual output against user reference images**

Check that the cards on `localhost:3000` exhibit the structured, calm, spacious Oat & Mill aesthetic, completely free of the 8-layer vertical clutter.

- [ ] **Step 4: Commit**

```bash
git add ninjax.html verify-oat-mill-redesign.js
git commit -m "chore: sync ninjax.html and capture final verification evidence"
```

