// SPDX-License-Identifier: GPL-2.0-or-later
export const meta = {
  name: 'site-audit',
  description: 'Audit a website in parallel for accessibility, performance, SEO, downloads, embedded builds, licensing and privacy, then produce a prioritised fix list and record the results in the project docs. Use before a release or launch. args: { site: "<local build path or URL>", pages?: ["/", "/download/", ...] }',
  phases: [
    { title: 'Plan', detail: 'pages to audit, dimensions, doc kinds affected (compass)' },
    { title: 'Audit', detail: 'one read-only agent per dimension' },
    { title: 'Fix list', detail: 'merge, deduplicate, prioritise by visitor impact' },
    { title: 'Docs', detail: 'write the affected Diataxis pages in the project docs' },
    { title: 'Docs check', detail: 'one kind per page, titles, links' },
  ],
}

const USAGE = 'usage: site-audit { site: "<local build path or URL>", pages?: ["/", "/download/"] }'
if (!args || !args.site) return USAGE
const site = args.site
const pagesHint = Array.isArray(args.pages) && args.pages.length ? `Audit these pages: ${args.pages.join(', ')}.` : 'Audit every page template (home, download, credits/licences, any page with an embedded build, 404).'

const DOCS_FRAGMENT = 'Classify every user-visible change in this work with the Diataxis compass (action/cognition x study/work). For each, update or add exactly one page of that kind under the project docs/<kind>/ directory named in the project profile, keep each page to one kind, title it by the project pattern (tutorial "Build your first ...", how-to "How to <goal>", reference = the thing\'s name, explanation "About <topic>"), and link to the related pages of the other kinds. Report pages touched and any change you left undocumented and why.'

const PLAN = {
  type: 'object',
  properties: {
    pages: { type: 'array', items: { type: 'string' } },
    has_downloads: { type: 'boolean' },
    has_embedded_build: { type: 'boolean' },
    doc_pages: { type: 'array', items: { type: 'object', properties: { kind: { type: 'string' }, path: { type: 'string' }, why: { type: 'string' } }, required: ['kind', 'path'] } },
  },
  required: ['pages', 'doc_pages'],
}
const FINDINGS = {
  type: 'object',
  properties: {
    dimension: { type: 'string' },
    findings: {
      type: 'array',
      items: {
        type: 'object',
        properties: {
          where: { type: 'string' }, problem: { type: 'string' }, who_affected: { type: 'string' },
          standard: { type: 'string' }, severity: { type: 'string', enum: ['blocker', 'major', 'minor'] }, fix: { type: 'string' },
        },
        required: ['where', 'problem', 'severity', 'fix'],
      },
    },
    checked: { type: 'array', items: { type: 'string' } },
  },
  required: ['dimension', 'findings'],
}

phase('Plan')
const plan = await agent(
  `You are the frontend-web-developer. Onboard on the project (engineering-practices project-onboarding skill), then plan an audit of ${site}. ${pagesHint} List the pages, whether the site has a download page and an embedded web build. Then plan the docs with the Diataxis compass: the audit results are reference (e.g. an accessibility and performance status page with the test matrix); list every doc page that will be written or updated (kind, path in the project docs, why). Do not edit anything.`,
  { schema: PLAN, phase: 'Plan', label: 'plan' },
)
if (!plan) return 'site-audit: planning failed; no audit was run. Re-run, or check that the site path or URL is reachable.'

const pages = plan.pages.join(', ')
const dims = [
  ['accessibility', 'web-accessibility', 'WCAG 2.2 AA with all three passes: automated engine, manual keyboard/zoom/contrast/forms, and screen-reader reading order and names. Include the 2.2 additions (focus not obscured, target size, dragging, consistent help).'],
  ['performance', 'web-performance', 'Core Web Vitals in lab with mobile throttling (LCP element and whether it is lazy-loaded or late-discovered, long tasks, layout shifts), page weight against the budget, caching headers, image formats and sizes, third-party requests.'],
  ['seo-metadata', 'seo-and-metadata', 'unique titles and descriptions, canonical, lang, Open Graph tags and image, sitemap and robots, preview deployments noindex, structured data validity and truthfulness, 404 status.'],
  ['hosting', 'static-sites-and-hosting', 'HTTPS and HSTS, security headers (CSP, nosniff, referrer, permissions), compression, cache-control on HTML vs fingerprinted assets, redirects, broken internal links, works with JavaScript disabled.'],
  ['licensing', 'credits-and-licensing-pages', 'credits match the single credits source, licence page, source link per release, third-party notices cover the site bundle, fonts, images and store badges, footer links on every page.'],
  ['privacy', 'privacy-respecting-analytics', 'every third-party request and cookie, analytics configuration and payloads, privacy note accuracy, analytics disabled on previews.'],
]
if (plan.has_downloads) dims.push(['downloads', 'download-pages', 'detection only picks the primary button and every platform stays listed and reachable in one click (including with JavaScript off and for an iPad reporting as Mac); every link resolves; versions, sizes, checksums come from release data; store badges official, sized and spaced per store rules, with alt text.'])
if (plan.has_embedded_build) dims.push(['embedded-build', 'embedding-web-builds', 'MIME types, Content-Encoding, cross-origin isolation scoped to the build page, click-to-load, progress and failure states, fallback when unsupported, keyboard can enter and leave, postMessage origin checks, every contract event handled.'])

phase('Audit')
const results = await parallel(dims.map(([dim, skill, what]) => () =>
  agent(
    `Audit ${site} (pages: ${pages}) for ${dim}, following the frontend-web-developer ${skill} skill. Check: ${what} Read-only: change no files. Return each problem with where (URL or file and element), who it affects, the standard or rule, severity (blocker = a visitor cannot complete a task or a legal/security duty is unmet; major; minor), and the fix. Also list what you checked and found fine.`,
    { schema: FINDINGS, phase: 'Audit', label: dim },
  ).then(r => r || { dimension: dim, findings: [], unverified: true }),
))

const unverified = results.filter(r => r.unverified).map(r => r.dimension)

phase('Fix list')
const fixList = await agent(
  `Merge these audit findings for ${site} into one prioritised fix list: blockers first, then by number of visitors affected. Deduplicate findings reported by several dimensions. Dimensions marked unverified were not audited (the auditor failed): list them at the top as NOT CHECKED, never as passing.\n${JSON.stringify(results)}\nReturn markdown: summary line (counts by severity), NOT CHECKED list, then the table.`,
  { phase: 'Fix list', label: 'fix-list' },
)
if (!fixList) return { status: 'incomplete', reason: 'fix-list agent failed', unverified, results }

phase('Docs')
const docs = await agent(
  `You are the frontend-web-developer. Record the audit of ${site} in the project's docs, following the planned doc pages:\n${JSON.stringify(plan.doc_pages)}\n${DOCS_FRAGMENT}\nThe audit results belong in reference (status and test matrix: pages x checks x result, date-free, linked from the docs index). Do not put instructions in it; if the audit revealed a missing procedure, add or update a how-to. Fix list:\n${fixList}`,
  { phase: 'Docs', label: 'docs' },
)
if (!docs) return { status: 'incomplete', reason: 'docs step failed', fixList, unverified }

phase('Docs check')
const check = await agent(
  `Review the doc pages just written for the ${site} audit (report: ${docs}). Check each page holds one Diataxis kind only (no instructions in reference or explanation), titles follow the patterns, and the kinds link to each other. Fix small issues yourself; report anything left.`,
  { phase: 'Docs check', label: 'docs-check' },
)

return {
  status: unverified.length ? 'partial' : 'complete',
  not_checked: unverified,
  fix_list: fixList,
  docs: docs,
  docs_check: check || 'docs check failed: pages unverified',
}
