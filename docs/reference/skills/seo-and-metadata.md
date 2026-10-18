*Reference, for people using the frontend-web-developer plugin who need the facts about one skill.*

# seo-and-metadata

| Field | Value |
|---|---|
| File | [`skills/seo-and-metadata/SKILL.md`](../../../skills/seo-and-metadata/SKILL.md) |
| Use when | Titles, descriptions, canonical URLs, sitemaps, robots rules, Open Graph tags, structured data, multilingual pages |
| Sections | Every page · Site level · Social previews · Structured data · Several languages · Verify · Quality bar · Failure modes · Docs this work owes |

## Per page

`<html lang>`, unique `<title>`, unique `<meta name="description">`, `<link rel="canonical">`, viewport meta, `og:title`, `og:description`, `og:image` (1200×630, absolute URL), `og:image:alt`, `og:url`, `og:type`, `twitter:card`.

## Site level

`sitemap.xml` (canonical 200 URLs only), `robots.txt`, preview deployments `X-Robots-Tag: noindex`, 404 page with status 404, `hreflang` alternates plus `x-default` for each language.

## Structured data

`SoftwareApplication` (or `MobileApplication`, or `VideoGame` with a second app type): `name`, `operatingSystem`, `applicationCategory`, `offers.price`, `offers.priceCurrency`. Rich results need a genuine `aggregateRating` or `review`. Must match visible content.

## Not used by search engines

`meta keywords`; word-count targets; heading order as a ranking signal.

## Docs owed

Reference (metadata conventions, sitemap and robots rules); how-to for adding a page with correct metadata.
