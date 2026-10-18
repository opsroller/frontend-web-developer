// SPDX-License-Identifier: GPL-2.0-or-later
export const meta = {
  name: 'embed-web-build',
  description: 'Embed an interactive web build (e.g. WebAssembly) in a page: agree the event contract, configure hosting headers, build the click-to-load host page and event bridge, verify in parallel, fix until clean, and document. args: { build: "<path to the web build output>", page: "<site path of the hosting page, e.g. /play/>", contract?: "<path to an existing event contract doc>" }',
  phases: [
    { title: 'Plan', detail: 'build files, events, headers, bridge choice, doc kinds affected (compass)' },
    { title: 'Build', detail: 'one agent edits host config, page and bridge' },
    { title: 'Verify', detail: 'parallel read-only checks' },
    { title: 'Fix', detail: 'up to two fix rounds; blocked if blockers remain' },
    { title: 'Docs', detail: 'write the planned Diataxis pages in the same PR' },
    { title: 'Docs check', detail: 'one kind per page, titles, links' },
  ],
}

const USAGE = 'usage: embed-web-build { build: "<path to web build output>", page: "/play/", contract?: "<path to event contract doc>" }'
if (!args || !args.build || !args.page) return USAGE
const build = args.build
const page = args.page
const contractHint = args.contract ? `The existing event contract is at ${args.contract}; use it and report any gap.` : 'No contract document exists yet: derive the events from the build\'s code and exports, draft the contract table, and list questions for the role that owns the build.'

const DOCS_FRAGMENT = 'Classify every user-visible change in this work with the Diataxis compass (action/cognition x study/work). For each, update or add exactly one page of that kind under the project docs/<kind>/ directory named in the project profile, keep each page to one kind, title it by the project pattern (tutorial "Build your first ...", how-to "How to <goal>", reference = the thing\'s name, explanation "About <topic>"), and link to the related pages of the other kinds. Report pages touched and any change you left undocumented and why.'

const PLAN = {
  type: 'object',
  properties: {
    build_files: { type: 'array', items: { type: 'object', properties: { path: { type: 'string' }, bytes: { type: 'number' }, mime: { type: 'string' }, encoding: { type: 'string' } }, required: ['path'] } },
    needs_cross_origin_isolation: { type: 'boolean' },
    bridge: { type: 'string', enum: ['same-document', 'iframe'] },
    contract: { type: 'array', items: { type: 'object', properties: { direction: { type: 'string' }, name: { type: 'string' }, payload: { type: 'string' }, when: { type: 'string' } }, required: ['direction', 'name'] } },
    questions_for_build_owner: { type: 'array', items: { type: 'string' } },
    files_to_change: { type: 'array', items: { type: 'string' } },
    doc_pages: { type: 'array', items: { type: 'object', properties: { kind: { type: 'string' }, path: { type: 'string' }, why: { type: 'string' } }, required: ['kind', 'path'] } },
  },
  required: ['build_files', 'bridge', 'contract', 'files_to_change', 'doc_pages'],
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
  `You are the frontend-web-developer. Onboard on the project (engineering-practices project-onboarding skill). Plan embedding the web build at ${build} into ${page}, following the embedding-web-builds skill. Inventory the build files with sizes, required MIME types and whether they are pre-compressed. Decide whether threads require cross-origin isolation, and choose the bridge (same-document or iframe) with a one-line reason. ${contractHint} List files you will change (host header config, page, bridge script). Plan the docs with the Diataxis compass: reference for the event contract and required headers; explanation for the bridge and click-to-load choices; a how-to "How to update the embedded web build". Do not edit anything yet.`,
  { schema: PLAN, phase: 'Plan', label: 'plan' },
)
if (!plan) return 'embed-web-build: planning failed; nothing was changed.'
if (!plan.contract.length) return { status: 'blocked', reason: 'no event contract could be derived; agree one with the role that owns the build', questions: plan.questions_for_build_owner || [] }

phase('Build')
const built = await agent(
  `Embed the web build per this plan:\n${JSON.stringify(plan)}\nFollow the embedding-web-builds skill: correct MIME types and Content-Encoding; cross-origin isolation headers only on ${page} (or its iframe) if needed; reserved aspect-ratio space; click-to-load with poster and the download size; labelled progress; capability check with fallback linking native downloads; error state with retry; noscript message; focusable canvas with an accessible name and a documented key to release focus; pause on visibilitychange; handle every contract event (ignore unknown ones); postMessage with explicit targetOrigin and origin/source/payload checks if the bridge is an iframe. Keep the rest of the site's headers unchanged. Commit with a Conventional Commit message. Return files changed and how to preview.`,
  { phase: 'Build', label: 'build' },
)
if (!built) return 'embed-web-build: build agent failed; check the working tree for partial changes.'

const CHECKS = [
  ['hosting-headers', 'embedding-web-builds and static-sites-and-hosting', 'on the preview or deployed URL, check with curl -sI: .wasm is application/wasm, pre-compressed files have the right Content-Encoding, isolation headers present on the build page only and self.crossOriginIsolated is true there if needed, CSP allows exactly what the build needs, other pages unchanged'],
  ['loading-and-failure', 'embedding-web-builds', 'click-to-load works, progress shown and announced, unsupported browser shows the fallback with download links, a failed fetch shows an error with retry, noscript message present'],
  ['contract', 'embedding-web-builds', `every event in the contract is handled or deliberately ignored, payloads validated, postMessage origin checks in place if an iframe is used. Contract: ${JSON.stringify(plan.contract)}`],
  ['accessibility', 'web-accessibility', 'keyboard can reach the build, enter it and leave it (no trap), canvas has an accessible name, instructions are HTML text, controls meet target size and contrast, reduced motion respected on the host page'],
  ['performance', 'web-performance', 'the hosting page Core Web Vitals in lab with mobile throttling are unaffected before the click: no build bytes fetched before the click, no layout shift when the canvas appears'],
]
const verify = (round) => parallel(CHECKS.map(([name, skill, what]) => () =>
  agent(`Check the embedded web build on ${page} (round ${round}) following the ${skill} skill: ${what}. Read-only: change no files. Return issues with where, problem, severity and fix.`,
    { schema: ISSUES, phase: 'Verify', label: `${name}#${round}` })
    .then(r => r || { check: name, issues: [{ where: page, problem: `${name} check did not run (agent failed)`, severity: 'blocker', fix: 're-run this check' }], unverified: true })))

phase('Verify')
let results = await verify(1)
let open = results.flatMap(r => r.issues.filter(i => i.severity !== 'minor'))
let round = 1
while (open.length && round <= 2) {
  phase('Fix')
  const fixed = await agent(`Fix these issues with the embedded web build on ${page}, following the frontend-web-developer skills. You are the only agent editing files. Problems inside the build itself go back to its owning role as a written request; do not patch build output. Commit with Conventional Commit messages.\n${JSON.stringify(open)}`, { phase: 'Fix', label: `fix#${round}` })
  if (!fixed) break
  round++
  phase('Verify')
  results = await verify(round)
  open = results.flatMap(r => r.issues.filter(i => i.severity !== 'minor'))
}
const minor = results.flatMap(r => r.issues.filter(i => i.severity === 'minor'))
if (open.length) return { status: 'blocked', page, open_items: open, minor, questions_for_build_owner: plan.questions_for_build_owner || [] }

phase('Docs')
const docs = await agent(
  `You are the frontend-web-developer. Document the embedded web build on ${page} in the same branch, following the planned doc pages:\n${JSON.stringify(plan.doc_pages)}\n${DOCS_FRAGMENT}\nThe event contract table and required headers are reference; the bridge and click-to-load reasoning is explanation; updating the build to a new release is a how-to. What was built: ${built}`,
  { phase: 'Docs', label: 'docs' },
)
if (!docs) return { status: 'blocked', page, reason: 'docs step failed; the change is not done without its docs', built }

phase('Docs check')
const check = await agent(
  `Review the doc pages just written for the embedded web build (report: ${docs}). Check each page holds one Diataxis kind only, titles follow the patterns, and the kinds link to each other. Fix small issues yourself and commit; report anything left.`,
  { phase: 'Docs check', label: 'docs-check' },
)

return {
  status: 'ready',
  page,
  bridge: plan.bridge,
  built,
  minor_issues: minor,
  questions_for_build_owner: plan.questions_for_build_owner || [],
  docs,
  docs_check: check || 'docs check failed: pages unverified',
}
