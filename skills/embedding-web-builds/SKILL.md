---
name: embedding-web-builds
description: Use when putting an interactive web build (e.g. a WebAssembly app or game exported for the browser) on a page: hosting its files with the right headers, loading it with progress and error states, sizing and focus, and connecting the page to events the build emits or commands it accepts.
---

# Embedding interactive web builds

The build (a loader script, a `.wasm` binary, data packs) comes from the
programming role that owns it. You make it load reliably, look intentional
while loading, stay accessible around it, and talk to the page through a
contract both sides wrote down.

## 1. Agree the event contract first

Before writing host code, write (with the build's owner) a short contract:

| Direction | Name | Payload | When |
|---|---|---|---|
| build → page | `ready` | `{ version }` | first frame shown |
| build → page | `progress` | `{ loaded, total }` | while loading |
| build → page | `error` | `{ message }` | fatal failure |
| build → page | product events, e.g. `levelComplete`, `requestFullscreen` | small JSON | as they happen |
| page → build | commands, e.g. `pause`, `resume`, `setVolume` | small JSON | on page events |

Rules: names are stable strings; payloads are JSON-serialisable and
versioned; unknown events are ignored, not fatal; the contract lives in the
project's reference docs.

## 2. Choose the bridge

| Embedding | Bridge |
|---|---|
| Build runs in the page itself (same document) | The build dispatches `CustomEvent`s on a known element or `window`; the page calls a documented function the build exposes (e.g. on the module object). |
| Build runs in an `<iframe>` (isolation, other origin, or its own headers) | `postMessage` both ways. Always pass an explicit `targetOrigin` (never `"*"` for anything sensitive) and on receipt check `event.origin` and `event.source` and validate the payload shape before acting. |

Prefer the iframe when the build needs headers the rest of the site should
not have (see cross-origin isolation below) or comes from another origin.

## 3. Host the files correctly

- **MIME types:** `.wasm` → `application/wasm` (needed for streaming
  compilation); `.js` → `text/javascript`; data packs as the build documents.
- **Compression:** serve pre-compressed files (Brotli/gzip) with the matching
  `Content-Encoding` header, or let the host compress. A pre-compressed file
  served without `Content-Encoding` fails to load; check the deployed headers.
- **Caching:** fingerprinted build files can be cached long and immutable;
  the loader that references them must not be.
- **Cross-origin isolation:** builds using threads (`SharedArrayBuffer`)
  need `Cross-Origin-Opener-Policy: same-origin` and
  `Cross-Origin-Embedder-Policy: require-corp` (or `credentialless`) on the
  document. These block cross-origin resources that do not opt in (CORS or
  `Cross-Origin-Resource-Policy`), so scope them to the build's page or
  iframe only. Verify with `self.crossOriginIsolated === true` in the console.
- **CSP:** WebAssembly compilation may need `'wasm-unsafe-eval'` in
  `script-src` for the build's page only.

## 4. Load it like a product, not a black box

1. Reserve the space: fixed `aspect-ratio` on the container so nothing shifts
   (CLS) when the canvas appears.
2. **Click to load** on landing pages: show a poster image and a "Play in
   browser (35 MB)" button; download the build only after the click. This
   keeps the landing page fast and respects metered connections.
3. Show progress from `progress` events (or byte counts) in a
   `<progress>` element with a label; announce completion politely
   (`aria-live="polite"`).
4. Check capabilities before loading (`typeof WebAssembly === 'object'`,
   WebGL/WebGPU availability as the build needs) and show a clear fallback:
   what is missing, and links to the native downloads.
5. Handle the `error` event and load failures (network, out of memory) with a
   message and a retry button; never leave a spinner forever.
6. `<noscript>`: say the build needs JavaScript and link to downloads.

## 5. Be a good guest on the page

- **Sizing:** responsive container; handle `resize` and device pixel ratio;
  a fullscreen button using the Fullscreen API (only on user gesture).
- **Focus and keyboard:** the canvas is focusable (`tabindex="0"`) with an
  accessible name ("Game: press Escape to release keyboard"); the build must
  release focus on a documented key so keyboard users are never trapped
  (WCAG 2.1.2). Prevent page scrolling on arrow keys only while the canvas
  has focus.
- **Visibility:** on `visibilitychange` to hidden, send `pause`; resume only
  when the user returns.
- **Audio:** browsers block audio until a user gesture; start audio from the
  click that loads or focuses the build.
- **Text around the canvas:** controls and instructions as HTML beside the
  build, since canvas content is invisible to assistive technology.

## Quality bar

- Loads on the deployed host in current Chromium, Firefox and Safari
  (desktop and mobile where supported), with correct MIME, encoding and
  isolation headers verified by `curl -sI`.
- The landing page's Core Web Vitals do not change when the build is added
  (click-to-load).
- Every contract event is handled or deliberately ignored; origin checks in
  place for `postMessage`.
- Keyboard user can enter and leave the build; fallback shown when
  unsupported.

## Failure modes

- `.wasm` served as `application/octet-stream` or pre-compressed without
  `Content-Encoding`: slow or failed load.
- COOP/COEP set site-wide, silently breaking embeds and images elsewhere.
- `postMessage(msg, "*")` and listeners that trust any origin.
- Auto-loading a 50 MB build on the landing page.
- Infinite spinner on failure; keyboard trapped in the canvas.

## Docs this work owes

- **Reference:** the event contract table, required headers, file list and
  sizes, the page URL.
- **Explanation:** why same-document vs iframe, why click-to-load ("About
  embedding the web build").
- **How-to:** "How to update the embedded web build to a new release".
