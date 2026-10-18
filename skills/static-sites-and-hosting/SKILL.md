---
name: static-sites-and-hosting
description: Use when creating or restructuring a website, choosing how pages are built and served, setting up deployment and preview builds, or configuring caching, redirects and security headers on a static host.
---

# Static sites and hosting

A static site is pre-built HTML, CSS, JavaScript and media served from a host
or CDN. It is the default for landing, download, docs and credits pages:
fast, cheap, secure (no server code to attack) and easy to cache. Use the
site generator and host the project profile names; this skill is the method.

## 1. Decide the shape

| Need | Choose |
|---|---|
| A handful of pages, rare changes | Hand-written HTML/CSS, no build step |
| Shared layout, data-driven pages (releases, credits) | A static site generator (e.g. Eleventy, Hugo, Astro) |
| Highly interactive app on one page | A static shell plus a client-side island for that part only |
| Per-request personalisation, accounts | Not a static site: escalate to the project-manager |

Rule: pick the least machinery that meets the need. Every framework you add
is JavaScript the visitor downloads and a dependency someone must update.

## 2. Build in layers (progressive enhancement)

1. **Content and HTML.** Write the page as semantic HTML that works alone:
   headings in order, landmarks (`header`, `nav`, `main`, `footer`), real
   links and buttons, `lang` on `<html>`, a descriptive `<title>`.
2. **CSS.** Mobile-first, fluid layouts with flexbox/grid and `clamp()`;
   no fixed widths that break at 320 CSS px; respect
   `prefers-reduced-motion` and `prefers-color-scheme` if the design supports
   dark mode.
3. **JavaScript.** Only for what HTML and CSS cannot do, loaded with `defer`
   or `type="module"`, and failing safely: if the script errors, the page
   still shows its content and links.

Use feature detection (`'x' in navigator`, CSS `@supports`), not browser
sniffing, for capabilities. (Platform detection for downloads is the one
narrow exception; see `download-pages`.)

## 3. Structure the repository

- Content and data (release data, credits, copy) separate from templates.
- Generated output in a build directory that is never committed.
- One command builds the site from a clean checkout; the project profile
  records it. Pin the generator version (lockfile).
- URLs are permanent: lowercase, hyphenated, descriptive (`/download/`,
  `/credits/`). When a URL must change, add a 301 redirect.
- A custom `404.html` that links home and to downloads.

## 4. Deploy

- Build and deploy from CI on merge to the default branch; never upload from
  a laptop. The devops-engineer owns the CI system; you own the site's job in
  it.
- Preview deployment per pull request when the host supports it; put the
  preview link in the PR.
- Atomic deploys (all files switch at once) and one-step rollback.
- Deploy credentials live in the CI provider's secrets, added by the owner.
- After deploy, a smoke check: home, downloads, credits return 200; a known
  old URL redirects.

## 5. Configure the host

**Caching.** Fingerprint asset filenames (`app.3f9a1c.css`) and serve them
with `Cache-Control: public, max-age=31536000, immutable`. Serve HTML with a
short cache or `no-cache` so a deploy is visible at once. Do not send
`no-store` on pages: it blocks the back/forward cache.

**Compression.** Brotli or gzip for text (HTML, CSS, JS, SVG, JSON, Wasm).

**HTTPS** everywhere, HTTP redirected, then HSTS
(`Strict-Transport-Security: max-age=31536000`) once HTTPS is stable.

**Security headers** (set at the host; the minimum for a static site):

| Header | Starting value |
|---|---|
| `Content-Security-Policy` | `default-src 'self'; img-src 'self' data:; object-src 'none'; base-uri 'self'; frame-ancestors 'self'` then widen only for approved origins |
| `X-Content-Type-Options` | `nosniff` |
| `Referrer-Policy` | `strict-origin-when-cross-origin` |
| `Permissions-Policy` | deny features the site does not use, e.g. `camera=(), microphone=(), geolocation=()` |

Embedded web builds may need extra headers (MIME types, cross-origin
isolation); see `embedding-web-builds`.

**Fonts.** System font stack or self-hosted fonts whose licence allows web
embedding; no third-party font CDN unless approved (it is a request to a
third party on every visit).

## Quality bar

- Builds from a clean checkout with one command; output is reproducible.
- Every page valid HTML with landmarks and works with JavaScript off.
- Lighthouse-style lab checks pass the project's budgets (see
  `web-performance`, `web-accessibility`).
- Headers verified on the deployed URL (e.g. `curl -sI`), not just in config.
- No broken internal links (run a link checker in CI).

## Failure modes

- A framework for a three-page site; megabytes of JavaScript for static text.
- HTML cached for a year: visitors see the old version after a release.
- Content-Security-Policy added once and then disabled because it broke an
  embed; widen it for the specific origin instead.
- Deploys from a personal machine; no rollback.
- URLs changed without redirects; search results and store listings break.

## Docs this work owes

- New site, host or deploy setup → **reference** (build command, output
  directory, host, headers, redirects) and an **explanation** of the
  choices made ("About how the website is built and hosted").
- New deploy or rollback procedure → **how-to** ("How to roll back the
  website").
