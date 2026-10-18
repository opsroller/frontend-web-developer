// SPDX-License-Identifier: GPL-2.0-or-later
export const meta = {
  name: 'build-download-page',
  description: 'Build or update a landing/download page from release data: platform detection that only picks the primary button, every platform listed, store badges, checksums; verified in parallel, fixed until clean, and documented. args: { releaseData: "<path or URL of the release manifest/API>", page?: "/download/", platforms?: ["windows", "macos", "linux", "android", "ios", ...] }',
  phases: [
    { title: 'Plan', detail: 'data fields, page outline, detection table, doc kinds affected (compass)' },
    { title: 'Build', detail: 'one agent edits the page' },
    { title: 'Verify', detail: 'parallel read-only checks' },
    { title: 'Fix', detail: 'up to two fix rounds; blocked if blockers remain' },
    { title: 'Docs', detail: 'write the planned Diataxis pages in the same PR' },
    { title: 'Docs check', detail: 'one kind per page, titles, links' },
  ],
}

const USAGE = 'usage: build-download-page { releaseData: "<path or URL>", page?: "/download/", platforms?: ["windows", "macos", "linux", "android", "ios"] }'
if (!args || !args.releaseData) return USAGE
const releaseData = args.releaseData
const page = args.page || '/download/'
const platformsHint = Array.isArray(args.platforms) && args.platforms.length ? `Platforms: ${args.platforms.join(', ')}.` : 'Platforms: every platform present in the release data.'

const DOCS_FRAGMENT = 'Classify every user-visible change in this work with the Diataxis compass (action/cognition x study/work). For each, update or add exactly one page of that kind under the project docs/<kind>/ directory named in the project profile, keep each page to one kind, title it by the project pattern (tutorial "Build your first ...", how-to "How to <goal>", reference = the thing\'s name, explanation "About <topic>"), and link to the related pages of the other kinds. Report pages touched and any change you left undocumented and why.'

const PLAN = {
  type: 'object',
  properties: {
    files: { type: 'array', items: { type: 'string' } },
    platforms: { type: 'array', items: { type: 'object', properties: { key: { type: 'string' }, kind: { type: 'string', enum: ['file', 'store'] }, fields_available: { type: 'array', items: { type: 'string' } } }, required: ['key', 'kind'] } },
    missing_data: { type: 'array', items: { type: 'string' } },
    detection_cases: { type: 'array', items: { type: 'string' } },
    doc_pages: { type: 'array', items: { type: 'object', properties: { kind: { type: 'string' }, path: { type: 'string' }, why: { type: 'string' } }, required: ['kind', 'path'] } },
  },
  required: ['files', 'platforms', 'doc_pages'],
}
const ISSUES = {
  type: 'object',
  properties: {
    check: { type: 'string' },
    issues: { type: 'array', items: { type: 'object', properties: { where: { type: 'string' }, problem: { type: 'string' }, severity: { type: 'string', enum: ['blocker', 'major', 'minor'] }, fix: { type: 'string' } }, required: ['where', 'problem', 'severity'] } },
  },
  required: ['check', 'issues'],
}

phase('Plan')
const plan = await agent(
  `You are the frontend-web-developer. Onboard on the project (engineering-practices project-onboarding skill). Plan the download page at ${page} from the release data at ${releaseData}, following the download-pages skill. ${platformsHint} Read the release data and list, per platform, its key, whether it is a file download or a store listing, and which fields exist (URL, version, size, SHA-256, requirements). List data that is missing (ask the devops-engineer for it; never invent it). List the files you will create or change, and a detection test table of user-agent cases (Windows, macOS, Linux, Android phone and tablet, iPhone, iPad reporting as Mac with touch, ChromeOS, unknown). Plan the docs with the Diataxis compass: reference for data source, platform keys and detection rules; a how-to such as "How to add a new platform to the download page"; explanation only if a design choice is made. Do not edit anything yet.`,
  { schema: PLAN, phase: 'Plan', label: 'plan' },
)
if (!plan) return 'build-download-page: planning failed; nothing was changed.'
if (!plan.platforms.length) return { status: 'blocked', reason: 'no platforms found in the release data', missing_data: plan.missing_data || [] }

phase('Build')
const built = await agent(
  `Build the download page at ${page} per this plan:\n${JSON.stringify(plan)}\nFollow the download-pages skill exactly. The golden rule: platform detection only picks the primary button; it never hides the other platforms, and without JavaScript the full platform list shows with no guess. Generate every version, link, size and checksum from ${releaseData} at build time. Put detection in one small function with a unit test over the detection table. Use official store badges per each store's rules with alt text. Meet web-accessibility and web-performance (hero image not lazy-loaded, sizes set). Commit with a Conventional Commit message. Return the files changed and how to preview the page.`,
  { phase: 'Build', label: 'build' },
)
if (!built) return 'build-download-page: build agent failed; check the working tree for partial changes.'

const CHECKS = [
  ['detection', 'download-pages', 'run the detection unit test; confirm every case in the table maps to the right key, unknown gives no guess, and every platform remains listed and reachable in one click in every case and with JavaScript disabled'],
  ['links-and-data', 'download-pages', 'every link resolves; version, size and checksum on the page equal the release data; nothing hand-typed; store badges official, at least the minimum size, with clear space and alt text'],
  ['accessibility', 'web-accessibility', 'WCAG 2.2 AA on the page: automated engine plus keyboard, 400% zoom and 320 px reflow, contrast, accessible names of download buttons, target size'],
  ['performance-seo', 'web-performance and seo-and-metadata', 'LCP element discoverable and not lazy-loaded, no layout shift, page weight within budget; unique title and description, canonical, Open Graph, structured data truthful'],
]
const verify = (round) => parallel(CHECKS.map(([name, skill, what]) => () =>
  agent(`Check the download page at ${page} (round ${round}) following the ${skill} skill: ${what}. Read-only: change no files. Return issues with where, problem, severity and fix.`,
    { schema: ISSUES, phase: 'Verify', label: `${name}#${round}` })
    .then(r => r || { check: name, issues: [{ where: page, problem: `${name} check did not run (agent failed)`, severity: 'blocker', fix: 're-run this check' }], unverified: true })))

phase('Verify')
let results = await verify(1)
let open = results.flatMap(r => r.issues.filter(i => i.severity !== 'minor'))
let round = 1
while (open.length && round <= 2) {
  phase('Fix')
  const fixed = await agent(`Fix these issues on the download page at ${page}, following the frontend-web-developer skills. You are the only agent editing files. Commit with Conventional Commit messages.\n${JSON.stringify(open)}`, { phase: 'Fix', label: `fix#${round}` })
  if (!fixed) break
  round++
  phase('Verify')
  results = await verify(round)
  open = results.flatMap(r => r.issues.filter(i => i.severity !== 'minor'))
}
const minor = results.flatMap(r => r.issues.filter(i => i.severity === 'minor'))
if (open.length) return { status: 'blocked', page, open_items: open, minor, note: 'Not ready to ship. Resolve the open items and re-run.' }

phase('Docs')
const docs = await agent(
  `You are the frontend-web-developer. Document the download page at ${page} in the same branch, following the planned doc pages:\n${JSON.stringify(plan.doc_pages)}\n${DOCS_FRAGMENT}\nWhat was built: ${built}`,
  { phase: 'Docs', label: 'docs' },
)
if (!docs) return { status: 'blocked', page, reason: 'docs step failed; the change is not done without its docs', built }

phase('Docs check')
const check = await agent(
  `Review the doc pages just written for the download page (report: ${docs}). Check each page holds one Diataxis kind only, titles follow the patterns, the how-to names a user goal, and the kinds link to each other. Fix small issues yourself and commit; report anything left.`,
  { phase: 'Docs check', label: 'docs-check' },
)

return {
  status: 'ready',
  page,
  built,
  minor_issues: minor,
  missing_data: plan.missing_data || [],
  docs,
  docs_check: check || 'docs check failed: pages unverified',
}
