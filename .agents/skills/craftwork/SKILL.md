---
name: craftwork-design
description: Design system and architectural standards for high-end digital marketplaces, creator portfolios, and modern dark-mode platforms. Enforces Apple-grade spatial elegance, concentric radii, midnight obsidian palette (#080C14 / #0B0F19), vibrant orange accents (#FF6B00), glassmorphic specular borders, responsive typography (Inter / Plus Jakarta Sans), and strict anti-slop rules.
license: MIT
metadata:
  version: "1.0.0"
---

# Craftwork Design System (Apple-Grade Marketplace Edition)

This skill governs the visual direction, component architecture, and interaction design for the Nexus Creator & Business Marketplace. It synthesizes the visual portfolio elegance of **Contra.com** with the clean directory mechanics of **The Knot**.

---

## 1. Visual Foundation & Color Tokens

```css
:root {
  /* Surfaces */
  --bg-void: #080C14;        /* Deep Obsidian Void */
  --bg-base: #0B0F19;        /* Base Background */
  --bg-surface: #111827;     /* Card & Section Surface */
  --bg-glass: rgba(17, 24, 39, 0.70); /* Glassmorphic Card */
  
  /* Brand Accent */
  --accent-orange: #FF6B00;  /* Vibrant Signal Orange */
  --accent-orange-hover: #EA580C;
  --accent-glow: rgba(255, 107, 0, 0.15);

  /* Borders & Specular Highlights */
  --border-glass: rgba(255, 255, 255, 0.08);
  --border-focus: rgba(255, 107, 0, 0.50);

  /* Typography Colors */
  --text-primary: #FFFFFF;
  --text-secondary: #94A3B8; /* Muted Slate */
  --text-tertiary: #64748B;  /* Captions & Metadata */
  
  /* Status Indicators */
  --status-emerald: #10B981; /* Verified / Active */
  --status-amber: #F59E0B;   /* Fast-Responder / SLA */
  --status-crimson: #EF4444; /* Past Due / Alert */
}
```

---

## 2. Concentric Radii & Spatial Harmony

Never use random rounded corners. All nested surfaces must satisfy:
$$\text{Outer Radius} = \text{Inner Radius} + \text{Padding}$$

* **Containers / Modal Cards:** `rounded-3xl` (`24px`) with `16px` padding $\rightarrow$ Child cards: `rounded-2xl` (`16px`).
* **Interactive Buttons / Pills:** Full pill (`9999px`) or refined `12px` (`rounded-xl`).
* **Active Press Feedback:** Tactile micro-depression `scale(0.97)` on click. Never use `transition: all`.

---

## 3. Typographic Hierarchy (Zero Slop)

* **Display Headings (`h1`, `h2`):** Tight tracking (`letter-spacing: -0.025em`), leading `1.05`, `text-wrap: balance`. Maximum 2 lines on desktop and mobile.
* **Body & Running Text:** `Inter` / `Plus Jakarta Sans`, font size `16px`, line-height `1.55`. Running text stays in full ink (`--text-primary` or high-contrast `--text-secondary`).
* **Tabular Figures:** Always apply `font-variant-numeric: tabular-nums` to prices, countdown clocks, review ratings, and quotas.

---

## 4. The 6 Anti-Slop Rules

1. **No Generic Purple/Pink Gradients:** Stick to obsidian black surfaces with purposeful orange accents.
2. **No Icon-Topped Feature Cards:** Let the creators' real showreels, photography, and services speak.
3. **No Decorative Blobs or Artificial Clip-Art:** No random 3D globes, floating clouds, or irrelevant illustrations.
4. **No Cliché Corporate Marketing Copy:** Avoid "Unlock your potential", "All in one place", or "In today's fast-paced world". Use concrete, high-intent statements.
5. **No Cluttered Sticky Headers:** Plain glass navigation: Wordmark, 3–4 clean links, one clear action CTA.
6. **No Unbounded Video Uploads:** Strict file size caps (75MB, MP4/WebM) uploaded directly to Cloudflare R2 via presigned URLs.
