*Reference, for anyone checking what research the frontend-web-developer role is built on.*

# Sources

## Standards and official guidance

- **What's New in WCAG 2.2** (W3C WAI) — https://www.w3.org/WAI/standards-guidelines/wcag/new-in-22/ — the nine new criteria and removal of 4.1.1; the accessibility skill and checklist.
- **Web Content Accessibility Guidelines 2.2** (W3C) — https://www.w3.org/TR/WCAG22/ — the A/AA criteria in `skills/web-accessibility/checklist.md`.
- **How the Core Web Vitals metrics thresholds were defined** (web.dev) — https://web.dev/articles/defining-core-web-vitals-thresholds — LCP/INP/CLS thresholds and the 75th-percentile rule.
- **The most effective ways to improve Core Web Vitals** (web.dev) — https://web.dev/top-cwv-2023/ — the prioritised LCP, INP and CLS fixes in the performance skill.
- **Browser detection using the user agent** (MDN) — https://developer.mozilla.org/en-US/docs/Web/HTTP/Guides/Browser_detection_using_the_user_agent — feature detection first, client hints, `Mobi`/OS token caveats; the detection rules on download pages.
- **SEO Starter Guide** (Google Search Central) — https://developers.google.com/search/docs/fundamentals/seo-starter-guide — titles, descriptions, canonicals, URLs, alt text, and the myths (meta keywords, word count).
- **Software app (SoftwareApplication) structured data** (Google Search Central) — https://developers.google.com/search/docs/appearance/structured-data/software-app — required and recommended properties, rating requirement.
- **Module object** (Emscripten docs) — https://emscripten.org/docs/api_reference/module.html — loader hooks (`locateFile`, `onRuntimeInitialized`, `onAbort`) behind the embedding skill's loading states.
- **Interacting with browser scripting** (a game engine's web-build manual, as an example of the category) — https://docs.unity3d.com/ja/Manual/webgl-interactingwithbrowserscripting.html — two-way page/build communication shaping the event contract.
- **Enable Wasm threads with COOP/COEP** — https://app.cinevva.com/tutorials/coop-coep-sharedarraybuffer — cross-origin isolation headers, their effect on embeds, `crossOriginIsolated` check.

## Brand rules

- **App Store Marketing Resources and Identity Guidelines** (Apple) — https://developer.apple.com/app-store/marketing/guidelines — badge artwork, 40 px minimum, clear space, localisation, order.
- **Google Play badges** (Google Partner Marketing Hub) — https://partnermarketinghub.withgoogle.com/brands/google-play/google-play/lockups-icons-badges/ — 28 px minimum, size parity with other badges, no modification.

## Testing practice

- **Testing for accessibility** (GOV.UK Service Manual) — https://www.gov.uk/service-manual/technology/testing-for-accessibility — automated plus manual testing, when to test, audits.
- **Testing with assistive technologies** (GOV.UK Service Manual) — https://www.gov.uk/service-manual/technology/testing-with-assistive-technologies — the minimum screen-reader/browser set and how to log issues.

## The job

- **Web Developers, 15-1254.00** (O*NET OnLine) — https://www.onetonline.org/link/summary/15-1254.00 — core tasks and skills of the occupation.
- **Frontend Developer Career Path: From Junior to Senior** (GreatFrontEnd) — https://www.greatfrontend.com/blog/frontend-developer-career-path — junior/mid/senior/staff expectations in the explanation page.
- **Sr. Front-End Marketing Engineer** (job posting, Jobgether via Lever) — https://jobs.lever.co/jobgether/2467db91-47ff-4fff-b0f8-34c9a6b92a3d — responsibilities of a marketing-site front-end role: static/hybrid frameworks, accessibility, SEO, performance, deployments, analytics.

## Practitioner writing

- **Discovering Resilient Web Design with Jeremy Keith** (Speckyboy) — https://speckyboy.com/discovering-resilient-web-design-jeremy-keith/ — HTML as the foundation, progressive enhancement as an approach.
- **Cookieless web analytics** (Plausible; vendor source, read critically) — https://plausible.io/cookieless-web-analytics — rotating identifiers and the consent argument; the privacy skill states it as facts for the owner, not legal advice.
- **Open source licensing notices in Web applications** (Journal of Open Law, Technology & Society) — https://www.jolts.world/index.php/jolts/article/download/47/102/379?inline=1 — how notice duties differ by licence for JavaScript served to browsers.

## Documentation method

- **Diátaxis** (Daniele Procida) — https://diataxis.fr — the four documentation kinds and the compass, applied through the project's Diataxis guide.
