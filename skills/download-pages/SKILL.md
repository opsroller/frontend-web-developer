---
name: download-pages
description: Use when building or changing a landing or download page for an app or game: detecting the visitor's platform to choose the primary button, listing every platform, linking release files and store listings, and showing versions, sizes, checksums and system requirements.
---

# Landing and download pages

The page has one job: get the visitor to the right build for their device
with one click, and let anyone reach any other build with one more.

## The golden rule

**Platform detection only picks the primary button. It never hides the
other platforms.** Detection is a guess (user-agent strings lie, are frozen,
or are spoofed), so every platform stays listed and one click away. A wrong
guess costs a scroll, never a lost visitor.

## 1. Gather the data (never type it)

From the release data the devops-engineer publishes (a release API, a JSON
manifest or the release page, as the project profile names), take for each
platform: label, file URL, version, file size, checksum (SHA-256), minimum
OS / system requirements, and store URLs. Generate the page from that data
at build time. A version number typed by hand will be wrong after the next
release.

Prefer stable "latest" URLs only when the host guarantees them; otherwise
link the exact versioned asset and regenerate on each release.

## 2. Lay out the page

1. **Hero:** what the product is in one sentence, a screenshot or short
   muted video (with poster image and captions if it has speech), and the
   **primary download button** for the detected platform.
2. **Under the button:** version, size, "Other platforms" link to the
   section below.
3. **All platforms section:** every platform with its button or store
   badge, requirements, checksum, release notes link. Order is fixed (does
   not depend on detection).
4. **Help:** installation notes per platform (e.g. unsigned-app warnings),
   source code link, licence link, support link.

Without JavaScript, the page shows the all-platforms section with no
primary guess: that is a correct page, not a broken one.

## 3. Detect the platform (enhancement only)

Order of evidence, cheapest and most reliable first:

1. `navigator.userAgentData.platform` where present (Chromium browsers;
   values like `"Windows"`, `"macOS"`, `"Android"`, `"Linux"`, `"Chrome OS"`).
2. Otherwise `navigator.userAgent` tokens: `Android` (check before `Linux`),
   `iPhone`/`iPod`, `iPad`, `Windows`, `Mac`, `CrOS`, `Linux`.
3. **iPad caveat:** iPadOS Safari reports a desktop Mac user agent. Treat
   "Mac" with `navigator.maxTouchPoints > 1` as iPad/iOS.
4. Unknown or ambiguous → no primary guess; show the full list.

Architecture (e.g. arm64 vs x64) is unreliable in the browser; when builds
differ by architecture, offer both with plain labels ("Apple silicon",
"Intel") rather than guessing silently. `getHighEntropyValues(['architecture'])`
may help in Chromium browsers but must remain a hint.

Keep detection in one small, tested function returning a platform key; the
page template maps keys to data. Test it against a table of real UA strings,
including iPad desktop mode and Android tablets.

## 4. Store badges

- Use only the official badge artwork from each store's marketing site, in
  the visitor's language where the store provides it; never redraw, recolour,
  animate or crop.
- Respect minimum size and clear space: Apple App Store at least 40 px high
  on screen with clear space of a quarter of its height; Google Play at least
  28 px high with a quarter-height clear space, and the same size or larger
  than other badges shown beside it.
- Link to the store listing using the store's own link tools; give each badge
  `alt` text such as "Download on the App Store".
- Pre-order or pre-register badges only while that state is true.
- Badge artwork is the stores' trademark: it is not covered by the project's
  licence; list it as such on the credits/licensing page.
- Getting current artwork and checking brand rules can be done with the
  graphic-designer; layout is yours.

## 5. Make the buttons good controls

- Real `<a href>` links to the file or store, not script-only buttons.
- Accessible name says what and for whom: "Download for Windows (64-bit),
  version 1.4.0, 85 MB".
- Target at least 24×24 CSS px (aim for 44×44 on touch); visible focus.
- Optional `download` attribute only for same-origin files.

## Quality bar

- Every link returns 200 (or the store page) on the deployed site; checked
  in CI after each release.
- Detection test table passes; wrong or unknown detection still shows every
  platform.
- Checksums and sizes shown match the release data exactly.
- Page meets `web-accessibility` and `web-performance` bars; the hero image
  is the LCP element and is not lazy-loaded.

## Failure modes

- Only the detected platform shown ("Your OS is not supported" for an iPad
  that reported as Mac).
- Version and size typed by hand and out of date after the next release.
- Modified or home-made store badges; badge too small; badge as background
  image with no text alternative.
- Download starts automatically on page load (surprising, hostile to
  screen-reader users, blocked by browsers).
- Store links built by hand that break when the listing changes.

## Docs this work owes

- **Reference:** the page's data source and fields, the platform keys and the
  detection rules, the URL of each section.
- **How-to:** "How to add a new platform to the download page".
- **Explanation** if a choice was made (e.g. latest-URL vs versioned links).
