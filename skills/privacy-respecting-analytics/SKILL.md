---
name: privacy-respecting-analytics
description: Use when a project wants to measure website traffic, downloads or Core Web Vitals, or when adding any script, embed or font that talks to a third party: choosing data-minimal, cookieless measurement and keeping the site free of trackers.
---

# Privacy-respecting analytics

Default: **no analytics**. Measure only what answers a question the project
actually has, with the least data, and only after the owner approves the
tool. The site's visitors are not the product.

## 1. Start from the question

Write down the questions first, e.g. "How many visitors reach the download
page?", "Which platform buttons are clicked?", "Are Core Web Vitals good in
the field?". If no one will act on the answer, do not collect it.

Often enough without any script: download counts from the release host,
store-console statistics, server/CDN aggregate logs.

## 2. If a script is needed, choose the data-minimal kind

| Property | Required |
|---|---|
| Cookies / localStorage identifiers | None |
| Personal data (full IP, user IDs, fingerprints) | Not stored; IPs at most used transiently for coarse country and discarded |
| Cross-site or cross-day tracking | Impossible by design (e.g. identifiers rotate daily) |
| Data | Aggregate counts: pages, referrers, countries, devices, custom events |
| Hosting | Self-hosted or a processor the owner has approved, ideally in the visitors' jurisdiction |
| Script | Small (a few KB), loaded with `defer`, first-party path if possible |
| Respect | Honour Do Not Track / Global Privacy Control signals if the tool supports it |

Examples of the category: Plausible, Umami, GoatCounter, Matomo in
cookieless mode. The project profile names the chosen tool; you never pick
a vendor alone.

## 3. Consent and law (facts to give the owner, not legal advice)

- Privacy laws (e.g. GDPR, ePrivacy rules on accessing a device, CCPA)
  attach duties to personal data and to storing or reading information on a
  visitor's device. Cookieless, aggregate tools are designed to avoid both,
  which is why many sites use them without a consent banner.
- Whether a given setup needs consent depends on jurisdiction and details.
  Present the facts (what is collected, where, for how long) and let the
  owner decide; record the decision in the project profile.
- Publish a short, plain privacy note: what is measured, which tool, where
  data lives, retention, contact.

## 4. Implement

1. Add the script only on production (not previews), behind a single
   config value.
2. Custom events for the questions asked: e.g. `download` with property
   `platform`, `store_click` with `store`, `build_loaded` for embedded
   builds. No free text, no identifiers in event properties or URLs.
3. Core Web Vitals in the field: send LCP/INP/CLS values (e.g. via the
   `web-vitals` library) as aggregate events if the tool supports it.
4. Update the Content-Security-Policy for the one analytics origin.
5. Verify in the browser's network panel: no cookies set, no other
   third-party requests, payloads contain nothing personal.

## 5. Keep everything else first-party

Each third-party request leaks the visitor's IP and page to someone else:
- Self-host fonts, icons and scripts.
- Video: self-host, or use a privacy-enhanced embed behind a click-to-load
  facade.
- No social-media widgets; use plain share links.
- No tag managers or ad pixels unless the owner explicitly decides
  otherwise, with the legal consequences stated.

## Quality bar

- Each metric maps to a written question.
- No cookies or device storage for measurement; no personal data stored.
- Privacy note published and accurate.
- Network panel shows only approved origins.

## Failure modes

- A full-featured ad-tech analytics suite for a three-page site, plus a
  consent banner that hurts accessibility and CLS.
- Email addresses or IDs leaked in URLs or event properties.
- Analytics firing on preview deployments, polluting data.
- Third-party font or embed added "temporarily" and never reviewed.

## Docs this work owes

- **Reference:** what is measured (event names and properties), the tool,
  retention: the published privacy note is part of it.
- **Explanation:** "About how the website measures without tracking", with
  the owner's decision and its reasoning.
