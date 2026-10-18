---
name: seo-and-metadata
description: Use when making pages discoverable and shareable: titles, meta descriptions, canonical URLs, sitemaps, robots rules, social preview (Open Graph) tags, structured data for software, international pages, and checking how search engines see the site.
---

# SEO and metadata

Search engines reward pages that are crawlable, fast, accessible and
genuinely useful. Technical SEO is making sure nothing gets in the way and
that every page describes itself truthfully. There are no tricks worth
using; keyword stuffing and hidden text violate search engines' spam
policies.

## 1. Every page

```html
<html lang="en">
<title>Product name – what it is in a few words</title>
<meta name="description" content="One or two sentences unique to this page.">
<link rel="canonical" href="https://example.org/download/">
<meta name="viewport" content="width=device-width, initial-scale=1">
```

- **Title:** unique, accurate, concise, product name included; it becomes
  the search result's title link.
- **Description:** unique per page, summarises the page's most useful
  points; search engines may use it as the snippet.
- **Canonical:** one URL per piece of content; 301-redirect other forms
  (`http`, `www`, trailing slash variants) to it, and use `rel="canonical"`
  where you cannot redirect.
- **Headings and alt text** describe content (they help screen readers
  more than ranking; heading order itself is not a ranking factor).
- **Descriptive URLs** (`/download/`, not `/p?id=7`) and descriptive link
  text.
- Ignore myths: the `meta keywords` tag is unused; there is no minimum word
  count; keywords in the domain barely matter.

## 2. Site level

- `sitemap.xml` listing canonical URLs only, generated at build; referenced
  from `robots.txt`.
- `robots.txt` that allows crawling of pages and the CSS/JS needed to render
  them; preview deployments are `noindex` (header `X-Robots-Tag: noindex`)
  so they never compete with production.
- HTTPS, fast (`web-performance`), mobile-friendly, no intrusive
  interstitials.
- Custom 404 that returns status 404 (not 200).

## 3. Social previews

```html
<meta property="og:title" content="...">
<meta property="og:description" content="...">
<meta property="og:image" content="https://example.org/og/home.png">
<meta property="og:image:alt" content="...">
<meta property="og:url" content="https://example.org/">
<meta property="og:type" content="website">
<meta name="twitter:card" content="summary_large_image">
```

Preview image 1200×630 px, absolute URL, text large enough to read as a
thumbnail; artwork comes from the graphic-designer.

## 4. Structured data (JSON-LD)

- `SoftwareApplication` (or `MobileApplication`/`VideoGame` plus a second
  app type) for the product: `name`, `operatingSystem`,
  `applicationCategory` (e.g. `GameApplication`), `offers` with `price`
  (`0` if free) and `priceCurrency`. Search engines show rich results only
  with a genuine `aggregateRating` or `review`; never invent ratings.
- `Organization` with `logo` and `url` on the home page; `BreadcrumbList`
  on deep pages if the site has hierarchy.
- Structured data must match visible page content. Validate with a rich
  results test or schema validator.

## 5. Several languages

One URL per language (`/fr/download/`), `<html lang>` per page, and
`<link rel="alternate" hreflang="fr" href="...">` for every language plus
`x-default`. Never auto-redirect by IP or browser language without a
visible way back.

## 6. Verify

- Inspect the deployed page's head (view source) and response headers.
- Check indexing with the search engine's webmaster tools (the owner
  connects the site; you document what is needed) and `site:` queries.
- After launch, watch for crawl errors and pages excluded as duplicates.

## Quality bar

- Every indexable page: unique title and description, canonical,
  `lang`, Open Graph tags with image and alt.
- Sitemap valid and only canonical 200 URLs; previews `noindex`.
- Structured data validates and is truthful.

## Failure modes

- Same title and description on every page.
- Preview or staging sites indexed; canonical pointing at staging.
- JavaScript-only content and links that crawlers cannot see.
- Fake review stars in structured data (manual action risk).
- A 200 status on the "not found" page (soft 404).

## Docs this work owes

- **Reference:** metadata conventions (title pattern, image sizes),
  sitemap and robots rules, structured-data types used.
- **How-to:** "How to add a new page with correct metadata".
