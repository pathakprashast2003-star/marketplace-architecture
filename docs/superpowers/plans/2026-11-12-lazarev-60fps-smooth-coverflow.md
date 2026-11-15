# Lazarev 60fps Non-Overlapping Smooth Coverflow Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Eliminate compositor jank, overlapping card collision, and choppy pacing in `#lzStage` so cards telescope end-to-end across `#showcase` on crisp `#FFFFFF` paper with exact measured 60fps kinematics from `lazarevagency_pindown.io_1794474968.mp4`.

**Architecture:** Extract static layout reads (`ResizeObserver` cache of `#lzStage` width) and expensive CSS filters/backdrop-filters out of the per-frame `requestAnimationFrame` hot path so `tickLz()` animates strictly GPU-composited `transform: translate3d(...) scale(...)` and `opacity`. Replace overlapping fixed `x` coordinates with a cumulative gap-preserving curve derived directly from the 60fps `f_0075.png` measurements (`scale: 1.00 -> 0.75 -> 0.65 -> 0.56` with `10–16px` air gaps between adjacent borders), driven by the asymmetric `cubic-bezier(0.65, 0, 0.25, 1)` envelope measured across `f079 -> f128` (plus zero-hitch continuous-cruise fallback toggle).

**Tech Stack:** Vanilla ES6, CSS3 GPU transforms (`translate3d`, `scale`), `ResizeObserver`, Playwright (Google Chrome 1440×900 & 375×812 visual/RAF verification).

## Global Constraints
- Single-file edit boundary: all markup, CSS, and runtime changes stay inside `index-v2.html` (`< 500 KB`, currently `484,517` bytes).
- Maintain Option A layout (`#showcase` white ticker `#FFFFFF` + `.cr-head` title + unified `.dir-bar` + `#lzStage` + expandable `#dirGridPanel`).
- Zero end-bleeding and zero white washout edge masks: outer cards dissolve smoothly inside `safeEdge` (`opacity -> 0` before touching `.lz-wrap` container edges).
- Strictly `0` console errors, `0` page errors, `0` failed requests, and `0` horizontal overflow on `1440×900` and `375×812`.

## Review Focus
- Hover/unhover handoff mid-glide: pointer leaving `#lzStage` must smoothly resume without snapping or teleporting cards backward.
- Shortlist/search filter shrinking roster to `<= 3` items: virtual ring padding (`>= 9` slots) must keep both wings populated cleanly with no popping.
- Mobile `375×812` touch drag: horizontal swipe (`> 6px`) engages `setPointerCapture` cleanly; tap (`<= 6px`) centers a wing or opens `#fxModal`.
- `prefers-reduced-motion: reduce`: disables automatic advancement while keeping prev/next/click/drag functional.
- First-paint layout stability: `#lzStage` computes initial `stageW` synchronously before first frame so cards do not flash stacked at `x=0`.

---

## Empirical 60fps Reference Findings (`lazarevagency_pindown.io_1794474968.mp4`)

Measured from `400` extracted `60fps` (`720×540`) PNG frames via `ffprobe`/`ffmpeg` + pixel boundary/MAE analysis:

1. **Zero Card Overlap (Air-Gap Ribbon Geometry, `f_0075.png`):**
   - Center card (`d = 0`): `top = 129`, `height ≈ 281`, `width = 198px` (`scale = 1.00`).
   - Wing `±1` (`d = ±1`): `top = 164` (`width = 148px`, `scale = 0.75`). **Visible `8–10px` gap** between `±1` inner edge (`252px`/`468px`) and Center outer edge (`260px`/`458px`).
   - Wing `±2` (`d = ±2`): `top = 178` (`scale = 0.65`). **Visible `8–12px` gap** behind `±1` (`0` pill/badge collision across wings).
   - **Root cause in `index-v2.html`:** Our `sampleDepthCurve()` placed Wing `±1` inside Hero half-width (`x1 < halfW(0) + halfW(1)`), causing cards and top pills to collide/overlap mid-stage.

2. **Asymmetric Liquid Glide Curve (`f079 -> f128` tracking & `MAE` bell):**
   - Every `1.333s` (`80` frames) beat splits into:
     - `~850ms` glide (`f079 -> f128`): soft ease-in ramp (`~280ms`), velocity peak at **`~35–38%`** (`p ≈ 0.39..0.48`), followed by an extra-long **`~570ms` feather deceleration tail** (`cubic-bezier(0.65, 0, 0.25, 1)`).
     - `~450ms` soft dwell pause (just enough to read/play center reel before the next smooth surge).
   - **Root cause in `index-v2.html`:** Continuous linear `0.38 cards/s` lacked visual phrasing, while `v33` `easeOutQuart` snapped out too abruptly at `t = 0`.

3. **Compositor Jank Audit (`index-v2.html:7796, 7859, 13788`):**
   - `.lz-card` triggers per-frame `filter: brightness(...) saturate(...)` mutations alongside `backdrop-filter: blur(10px)` on nested `.lz-craft`, `.lz-rate`, and `.lz-tags span` pills, plus reading `lzStage.clientWidth` inside the `60fps` RAF loop.

---

### Task 1: GPU-Pure Card Styling (Remove Compositor Bottlenecks)

**Files:**
- Modify: `index-v2.html:7781-7955` (`.lz-card`, `.lz-craft`, `.lz-rate`, `.lz-tags span`, `@media (max-width: 640px)`)

- [ ] **Step 1:** Update `.lz-card` dimensions for non-overlapping `7`-card end-to-end fit inside `1320px` desktop stage (`width: 268px; height: 368px; margin-left: -134px; margin-top: -184px;`), keeping `230×314` proportions cleanly balanced on `@media (max-width: 640px)`.
- [ ] **Step 2:** Change `.lz-card` `will-change` from `transform, opacity, filter` to `transform, opacity` and add `contain: layout style paint;` so moving cards isolate their own paint layer.
- [ ] **Step 3:** Remove `backdrop-filter: blur(...)` / `-webkit-backdrop-filter` from `.lz-craft`, `.lz-rate`, and `.lz-tags span` (replace with crisp opaque/high-alpha pills: `rgba(9, 12, 22, 0.84)` and `rgba(255, 255, 255, 0.96)`), and add a dedicated lightweight `.lz-dim` overlay span inside `.lz-card` animated only via GPU `opacity` instead of CSS `filter`.
- [ ] **Step 4:** Verify zero visual regressions on static pill typography at desktop (`1440×900`) and mobile (`375×812`).

---

### Task 2: Non-Overlapping Cumulative Curve & Cached `stageW` Geometry

**Files:**
- Modify: `index-v2.html:13520-13635`, `13768-13832`, `14115-14135` (`sampleDepthCurve`, `layoutLazarevCards`, `ResizeObserver`)

- [ ] **Step 1:** Cache `lzStageW` via `ResizeObserver` on `#lzStage` (initialized synchronously in `buildLazarevCarousel()`) so `layoutLazarevCards()` never reads `clientWidth` inside RAF.
- [ ] **Step 2:** Replace hardcoded `x1/x2/x3` in `sampleDepthCurve(absD, stageW)` with cumulative gap-preserving placement parameterized directly from measured card widths (`baseHalf = isMobile ? 104 : 134`):
  - Scales: `s0 = 1.00`, `s1 = 0.76`, `s2 = 0.65`, `s3 = 0.56` (matching Lazarev's measured `1.00 : 0.75 : 0.65 : 0.56`).
  - Dynamic gap (`gap = Math.max(8, Math.min(18, (stageW - sumCardWidths) / 6))`) computes:
    - `x1 = baseHalf * (s0 + s1) + gap`
    - `x2 = x1 + baseHalf * (s1 + s2) + gap * 0.9`
    - `x3 = x2 + baseHalf * (s2 + s3) + gap * 0.8` (only shown when `x3 + baseHalf * s3 <= safeEdge`, otherwise dissolves cleanly between `d = 2..2.45`).
  - Zero overlap at `absD = 0, 1, 2, 3` AND across fractional mid-glide positions; outer wing fades `opacity -> 0` before touching `safeEdge`.
- [ ] **Step 3:** Update `layoutLazarevCards()` to set `transform: translate3d(x, 0, 0) scale(s)`, `opacity`, `zIndex`, and `.lz-dim` `opacity` only — zero `style.filter` writes per frame.

---

### Task 3: Lazarev 60fps Asymmetric S-Curve Glide & Drag Inertia Blending

**Files:**
- Modify: `index-v2.html:13555-13565`, `13834-13915` (`cubicBezier`, `tickLz`, `goToStep`)

- [ ] **Step 1:** Add an exact Newton-Raphson `cubicBezier(0.65, 0, 0.25, 1)` easing helper calibrated to the `f079 -> f128` tracking curve (`peak velocity at ~37% elapsed, 570ms feather tail`).
- [ ] **Step 2:** Update `tickLz(now)` auto-advance timing to `460ms` micro-dwell + `860ms` asymmetric S-curve advance (`1.32s` total beat matching Lazarev's `80`-frame period), ensuring clicking `Prev`/`Next`/flank card uses the same liquid S-curve (`720ms` when interactive).
- [ ] **Step 3:** Smoothly hand off drag-release inertia (`LZ_INERTIA_DECAY = 0.91`) straight into nearest-card S-curve lock (`goToStep(Math.round(lzCurrent + lzVelocity * 0.18), 540)` once velocity falls below `0.35`), eliminating any jarring post-drag snap.

---

### Task 4: Verification & Frame-Time / Gap Assertion Suite

**Files:**
- Modify/Verify: `index-v2.html` (`?v=41`), run temporary Playwright script (stdout only, no dirty repo test files)

- [ ] **Step 1:** Run `node --check` on all inline `<script>` blocks and verify `index-v2.html` size stays `< 500 KB`.
- [ ] **Step 2:** In headless Google Chrome Playwright (`1440×900` and `375×812`), sample `12` frames across one active `860ms` beat and verify:
  - **Zero Overlap:** At resting frame AND mid-glide (`p ≈ 0.5`), adjacent visible cards satisfy `next.left >= prev.right + 4px`.
  - **Zero End-Bleed:** Every card with `opacity > 0.05` satisfies `left >= wrapLeft` and `right <= wrapRight`.
  - **FPS / Frame Budget:** Average `requestAnimationFrame` callback delta on `1440×900` stays `<= 18ms` (`~60fps`) with `0` console/page/network errors.
- [ ] **Step 3:** Inspect captured desktop (`rest`, `midglide`, `settled`) and mobile JPEGs via `read_file` before reporting completion.

