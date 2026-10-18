---
name: web-performance
description: Use when a page must load and respond fast, when setting or checking performance budgets, or when diagnosing Core Web Vitals (LCP, INP, CLS) from lab tools or field data.
---

# Web performance and Core Web Vitals

## Targets

Core Web Vitals, assessed at the **75th percentile of real page loads**,
mobile and desktop separately:

| Metric | Measures | Good | Poor |
|---|---|---|---|
| LCP Largest Contentful Paint | loading | ≤ 2.5 s | > 4.0 s |
| INP Interaction to Next Paint | responsiveness | ≤ 200 ms | > 500 ms |
| CLS Cumulative Layout Shift | visual stability | ≤ 0.1 | > 0.25 |

Plus a **budget** the project sets (default for a landing page: ≤ 500 KB
total transfer, ≤ 170 KB compressed HTML+CSS+JS on the critical path, ≤ 3
third-party origins, LCP ≤ 2.5 s in a lab run with mobile throttling). Put
the budget in CI so a regression fails the build.

## Lab vs field

- **Lab** (Lighthouse, browser DevTools performance panel, WebPageTest-style
  tools): repeatable, use for debugging and CI. Test with mobile CPU and
  network throttling, not your fast laptop.
- **Field** (real-user data: the browser's public field dataset if the site
  has enough traffic, or the `web-vitals` measurements sent to the
  project's approved analytics): the truth. Lab INP does not exist (use
  Total Blocking Time as a proxy).

## Method

1. Measure the current state (lab and, if available, field). Identify the
   LCP element and the worst interaction.
2. Fix in this order (the highest-yield changes for most sites):

**LCP**
- Make the LCP resource discoverable in the HTML: a real `<img>` (not a CSS
  background or script-inserted), never `loading="lazy"`, with
  `fetchpriority="high"`; preload only if it is discovered late.
- Fast server response: static files from a CDN, HTML cacheable at the edge.
- Remove render-blocking CSS/JS: inline critical CSS for small sites,
  `defer` scripts.
- Right-size images: modern formats (AVIF/WebP with fallback),
  `srcset`/`sizes`, compressed; posters for video.

**INP**
- Ship less JavaScript: native elements (`<details>`, `<dialog>`, CSS
  instead of script), remove unused code and old tags.
- Break up long tasks (> 50 ms); yield to the main thread; do non-urgent
  work after the next paint.
- Keep the DOM small; avoid forced synchronous layouts; use
  `content-visibility` for long off-screen sections.

**CLS**
- `width` and `height` (or `aspect-ratio`) on every image, video, iframe and
  embed; reserve space for banners and late content.
- Fonts: `font-display: swap` or `optional`, preloaded only for the one
  critical face, metric-matched fallbacks (`size-adjust`) to limit shift.
- Animate `transform`/`opacity`, never `top`/`left`/`height`.
- Keep pages eligible for the back/forward cache (no `unload` handlers, no
  `Cache-Control: no-store`).

3. Re-measure; record before/after numbers in the PR.

**Also:** lazy-load below-the-fold images and iframes (`loading="lazy"`),
use speculation rules or prefetch for the likely next page (e.g. home →
download) where supported, and load heavy embeds (video players, web
builds) only on click with a lightweight facade.

## Quality bar

- Lab: budgets met under mobile throttling on every page template.
- Field (when data exists): all three metrics "good" at p75.
- Each third-party request justified and approved.
- Before/after numbers in every performance PR.

## Failure modes

- Lazy-loading the hero image; hero as CSS background.
- Testing only on a fast desktop on office Wi-Fi.
- A video or web-build embed loaded eagerly on the landing page.
- Web fonts from a third-party CDN with no `font-display`.
- Optimising a score instead of the user experience (and metrics) it stands
  for.

## Docs this work owes

- **Reference:** the budget values and where they are enforced.
- **Explanation** of any significant trade-off (e.g. dropping a framework,
  click-to-load embeds): "About website performance budgets".
