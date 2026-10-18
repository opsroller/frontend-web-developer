---
name: credits-and-licensing-pages
description: Use when publishing credits, the project's licence, source-code links, third-party notices or trademark attributions on a website, including notices for the site's own JavaScript, fonts, images and store badges.
---

# Credits and licensing pages

These pages are reference material with legal weight. They must be exactly
right, generated from the project's single sources, and easy to find.

## 1. Find the sources (never hand-copy)

- **Credits:** the project's single credits file (people, roles,
  contributions); the same source feeds the in-app credits screen, so site
  and product never disagree.
- **Product notices:** the dependency and asset licence inventory the
  devops-engineer maintains for releases.
- **Site notices:** the website's own third-party parts: JavaScript
  libraries in the bundle, fonts, icons, images, store badges, analytics
  script. Generate this list from the site's lockfile and asset metadata.
- **Project licence:** the repository's `LICENSE` and SPDX identifier.

If a source is missing, raise it with the project-manager; do not invent
entries.

## 2. Structure

| Page | Contains |
|---|---|
| `/credits/` | People and roles, grouped as the project's credits source groups them; thanks and inspirations as the project profile describes them |
| `/license/` (or `/licenses/`) | The project's licence name, SPDX ID and full text (or a link to it in the repository); how to get the source for each release |
| `/third-party/` (may be a section) | One entry per component: name, version, author/copyright line, licence (SPDX ID), licence text or link, homepage |
| Trademarks note | Store badges and platform names are trademarks of their owners and not covered by the project's licence |

Link these from every page's footer.

## 3. Rules by licence family (facts, not legal advice)

- **Permissive (MIT, BSD, ISC):** reproduce the copyright notice and licence
  text. MIT's "shall be included in all copies" is satisfied most safely by
  including the full text, not just a link.
- **Apache-2.0:** include the licence and any `NOTICE` file contents.
- **Copyleft (GPL, LGPL, MPL, AGPL):** state the licence and give access to
  the corresponding source for each released version (e.g. a link to the
  tagged source archive). Keep the source link per release, not only
  "latest".
- **Fonts (e.g. OFL):** include the licence; respect reserved font names.
- **Creative Commons media:** title, author, source, licence, and changes
  made (TASL).
- Minifiers strip comments: keep licence banners (`/*! ... */` or
  `@license`) or publish a licence page that covers bundled code.

When a licence question is unclear, write down the facts and flag it to the
owner; do not decide it.

## 4. Generate and check

- Render pages from data at build time; fail the build if an entry lacks a
  licence or copyright line.
- In CI, compare the site's third-party list with the lockfile so a new
  dependency without a notice fails the check.
- Inspirations and references: credit them by name as the profile says,
  never using their logos or branding.

## Quality bar

- Every component in the shipped site and product appears with its licence.
- Every release has a working source link when a copyleft licence applies.
- Pages are semantic (headings, lists, `<pre>` for licence text), searchable
  with the browser's find, and meet `web-accessibility`.
- Footer links to credits and licences on every page.

## Failure modes

- Credits on the site copied by hand and out of date with the product.
- Notices for the product but none for the site's own JavaScript and fonts.
- "Source code" link pointing only at the main branch.
- Store badges or platform logos presented as if under the project licence.

## Docs this work owes

- **Reference:** where each page's data comes from and the format of each
  entry.
- **How-to:** "How to add a credit or third-party notice".
