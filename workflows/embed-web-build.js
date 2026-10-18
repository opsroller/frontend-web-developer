// SPDX-License-Identifier: GPL-2.0-or-later
export const meta = {
  name: 'embed-web-build',
  description: 'Embed an interactive web build (e.g. WebAssembly) in a page: agree the event contract, configure hosting headers, build the click-to-load host page and event bridge, preview it locally (or on its deployed URL) with a browser probe, verify in parallel, fix until clean, fix the minor issues left, and document. args: { build: "<path to the web build output>", page: "<site path of the hosting page, e.g. /play/>", contract?: "<path to an existing event contract doc>", url?: "<deployed or preview URL of the page; omit to serve the built site locally>" }',
  phases: [
    { title: 'Plan', detail: 'build files, events, headers, bridge choice, doc kinds affected (compass)' },
    { title: 'Build', detail: 'one agent edits host config, page and bridge' },
    { title: 'Preview', detail: 'serve the undeployed site locally (or use the given URL) and run the preview-probe browser harness before each verify round' },
    { title: 'Verify', detail: 'parallel read-only checks on the probe report and the page' },
    { title: 'Fix', detail: 'up to two fix rounds for blocker and major issues; blocked if they remain' },
    { title: 'Polish', detail: 'fix the minor issues left, then a final preview and verify so the result lists only what is still open' },
    { title: 'Docs', detail: 'write the planned Diataxis pages in the same PR' },
    { title: 'Docs check', detail: 'one kind per page, titles, links' },
    { title: 'Handoff', detail: 'commit and push the host page, headers and bridge, run the site checks, return a handoff for engineering-practices deliver-package or land-pr' },
  ],
}

// --- run-modes v2 begin ---
const RUN = ((a, realAgent, realPhase, realLog) => {
  const opted = !!(a && typeof a === 'object' && a.run && typeof a.run === 'object')
  const c = opted ? a.run : {}
  const mode = c.mode === 'inline' ? 'inline' : 'agents'
  const results = c.results && typeof c.results === 'object' ? c.results : {}
  const reviewers = c.reviewers && typeof c.reviewers === 'object' ? c.reviewers : {}
  const only = Array.isArray(c.only) && c.only.length ? c.only.map(String) : null
  const from = c.from ? String(c.from) : null
  const titles = typeof meta !== 'undefined' && meta && Array.isArray(meta.phases) ? meta.phases.map((p) => p.title) : []
  const unknown = titles.length ? (from ? [from] : []).filter((t) => !titles.includes(t)) : []
  const error = c.mode && !['agents', 'inline'].includes(c.mode)
    ? `run.mode must be "agents" or "inline", got "${c.mode}"`
    : unknown.length ? `run.from names no phase: ${unknown.join(', ')}. Phases: ${titles.join(', ')}` : null
  const has = (o, k) => Object.prototype.hasOwnProperty.call(o, k)
  // An answer must carry every required key of its schema, as the runtime
  // enforces for agents; returns the missing keys, or null when it fits.
  const missing = (v, schema) => {
    if (v === null || v === undefined) return 'an answer'
    if (!schema || schema.type !== 'object') return null
    if (typeof v !== 'object' || Array.isArray(v)) return 'a JSON object'
    const gap = (schema.required || []).filter((k) => !has(v, k) || v[k] === undefined)
    return gap.length ? gap.join(', ') : null
  }
  const seen = {}
  const out = {}
  // Who answered each step marked independent: "subagent" when this run
  // spawned it, else the reviewer named in run.reviewers, else "self".
  const by = {}
  const who = (k) => (typeof reviewers[k] === 'string' && reviewers[k].trim() ? reviewers[k].trim() : 'self')
  const skipped = []
  const next = []
  const logs = []
  let current = ''
  let reached = !from
  let halting = false
  let release = () => {}
  const halted = new Promise((r) => { release = r })
  const picked = (ph, label) => reached && (!only || only.some((s) => s === ph || s === label || label.startsWith(s + ':')))
  const agent = (prompt, opts) => {
    const op = opts || {}
    const independent = op.independent === true
    const ph = op.phase || current
    const base = op.label || ph || 'agent'
    seen[base] = (seen[base] || 0) + 1
    const key = seen[base] > 1 ? `${base}#${seen[base]}` : base
    let note = null
    if (has(results, key)) {
      const gap = missing(results[key], op.schema)
      if (!gap) { out[key] = results[key]; if (independent) by[key] = who(key); return Promise.resolve(results[key]) }
      note = `answer missing ${gap}; answer this brief again`
    }
    if (!picked(ph, base)) { skipped.push(key); return Promise.resolve(null) }
    if (mode === 'agents') {
      const pass = Object.assign({}, op)
      delete pass.independent
      return realAgent(prompt, opts ? pass : opts).then((r) => {
        if (r !== null && r !== undefined) { out[key] = r; if (independent) by[key] = 'subagent' }
        return r
      })
    }
    const brief = { key, phase: ph, prompt, schema: op.schema || null }
    if (independent) brief.independent = true
    if (note) brief.note = note
    next.push(brief)
    if (!halting) {
      halting = true
      // Wait 200 microtask turns before pausing, so every sibling in a
      // parallel() or pipeline() fan-out queues its brief into this pause.
      ;(async () => { for (let i = 0; i < 200; i++) await null; release('__run_halted__') })()
    }
    return new Promise(() => {})
  }
  const phase = (t) => { current = t; if (from && t === from) reached = true; return realPhase(t) }
  const log = (m) => { logs.push(String(m)); return realLog(m) }
  const finish = (value) => {
    if (!opted) return value
    const self_reviewed = Object.keys(by).filter((k) => by[k] === 'self')
    if (value === '__run_halted__') {
      return {
        run: 'inline', status: 'next', next, results: out, reviewers: by, self_reviewed, skipped, logs,
        how: 'Do each brief in next, in order: follow its prompt in this session (it may tell you to edit files, commit or push), and shape your answer to its schema when one is given, with every required field. A brief marked independent reviews work this run produced, so do not answer it yourself: send its prompt to a reviewer with no part in the work (the project\'s code-reviewer role, a fresh session or a fresh subagent), use their answer, and name them in run.reviewers under its key; if you must answer it yourself, it is listed in self_reviewed and must be reported as self-reviewed. A brief with a note was answered before without the fields it names. Add each answer to results under its key, then run this workflow again with the same args, run.results set to the merged results and run.reviewers to the merged reviewers. Repeat until status is "done". To avoid pasting results back on every call, drive the run with engineering-practices tools/run-inline.mjs and a state file instead: it stores each answer and prints only the next briefs.',
      }
    }
    return { run: mode, status: 'done', result: value, results: out, reviewers: by, self_reviewed, skipped, logs }
  }
  return { agent, phase, log, finish, halted, error }
})(typeof args === 'undefined' ? undefined : args, agent, phase, log)
if (RUN.error) return RUN.error
const RUN_OUT = await Promise.race([RUN.halted, (async (agent, phase, log) => {
// --- run-modes v2 end (workflow body follows; close it with the tail line) ---

const USAGE = 'usage: embed-web-build { build: "<path to web build output>", page: "/play/", contract?: "<path to event contract doc>", url?: "<deployed or preview URL of the page>" }'
if (!args || !args.build || !args.page) return USAGE
const build = args.build
const page = args.page
const url = args.url || null
const contractHint = args.contract ? `The existing event contract is at ${args.contract}; use it and report any gap.` : 'No contract document exists yet: derive the events from the build\'s code and exports, draft the contract table, and list questions for the role that owns the build.'

// Failure modes that only show in a real browser; Plan names how this build
// avoids each one and Build implements it.
const FAILURE_MODES = 'Known failure modes to design out: (1) canvas backing store: when the page owns the layout (CSS sizes the canvas) and the engine does not resize it, the canvas keeps its 300x150 default or a stale size and renders blurry; set canvas.width/height to its box x devicePixelRatio on start and on every resize (ResizeObserver), or let the engine own the canvas size, never both; (2) downloads that bypass the engine\'s progress API: files the build or loader fetches itself (extra wasm modules, data packs, side modules) are not counted, so progress reads complete while bytes still arrive; route every file through the engine\'s preload or progress hook, or count their bytes in the page\'s progress; (3) start() left pending: some engines never reject start() when a fetch fails, leaving the page waiting forever; listen for fetch and resource errors (wrap fetch, or watch the engine\'s error callback) and add a watchdog timeout that shows the error state with retry; (4) a one-time failure that never recovers: a file whose first request is aborted, answered 5xx or cut off mid-body and served normally after must still end in ready (by the loader\'s own retry or the retry control); check response.ok before using a body, let a body read error fail the load instead of swallowing it or keeping the partial bytes, and make retry start the load over (a new request, promise and stream, and a fresh engine instance if start() cannot run twice) instead of reusing the failed one, since a full block of the file cannot reveal these.'

const DOCS_FRAGMENT = 'Classify every user-visible change in this work with the Diataxis compass (action/cognition x study/work). For each, update or add exactly one page of that kind under the project docs/<kind>/ directory named in the project profile, keep each page to one kind, title it by the project pattern (tutorial "Build your first ...", how-to "How to <goal>", reference = the thing\'s name, explanation "About <topic>"), and link to the related pages of the other kinds. Report pages touched and any change you left undocumented and why.'

const PLAN = {
  type: 'object',
  properties: {
    build_files: { type: 'array', items: { type: 'object', properties: { path: { type: 'string' }, bytes: { type: 'number' }, mime: { type: 'string' }, encoding: { type: 'string' } }, required: ['path'] } },
    needs_cross_origin_isolation: { type: 'boolean' },
    bridge: { type: 'string', enum: ['same-document', 'iframe'] },
    contract: { type: 'array', items: { type: 'object', properties: { direction: { type: 'string' }, name: { type: 'string' }, payload: { type: 'string' }, when: { type: 'string' } }, required: ['direction', 'name'] } },
    questions_for_build_owner: { type: 'array', items: { type: 'string' } },
    layout_owner: { type: 'string', enum: ['page', 'engine'] },
    failure_modes: { type: 'array', items: { type: 'object', properties: { mode: { type: 'string' }, applies: { type: 'boolean' }, how: { type: 'string' } }, required: ['mode', 'applies'] } },
    preview: { type: 'object', properties: { site_build: { type: 'string' }, root: { type: 'string' }, play: { type: 'string' }, ready_event: { type: 'string' }, ready_js: { type: 'string' }, error: { type: 'string' }, retry: { type: 'string' }, progress: { type: 'string' }, canvas: { type: 'string' }, release_key: { type: 'string' }, headers_file: { type: 'string' } } },
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
  `You are the frontend-web-developer. Onboard on the project (engineering-practices project-onboarding skill). Plan embedding the web build at ${build} into ${page}, following the embedding-web-builds skill. Inventory the build files with sizes, required MIME types and whether they are pre-compressed. Decide whether threads require cross-origin isolation, and choose the bridge (same-document or iframe) with a one-line reason. ${contractHint} ${FAILURE_MODES} For each of the three, say whether it applies to this build and how the page will avoid it, and say who owns the canvas size (layout_owner: page or engine). Plan the preview: the command that builds the site (site_build), the built site directory to serve (root), and the selectors and names the probe needs: play control, the ready event the build dispatches (or a ready_js expression), error and retry elements, progress element, canvas, the key that releases focus, and the host's header file if it has one (e.g. _headers). List files you will change (host header config, page, bridge script). Plan the docs with the Diataxis compass: reference for the event contract and required headers; explanation for the bridge and click-to-load choices; a how-to "How to update the embedded web build". Do not edit anything yet.`,
  { schema: PLAN, phase: 'Plan', label: 'plan' },
)
if (!plan) return 'embed-web-build: planning failed; nothing was changed.'
if (!plan.contract.length) return { status: 'blocked', reason: 'no event contract could be derived; agree one with the role that owns the build', questions: plan.questions_for_build_owner || [] }

phase('Build')
const built = await agent(
  `Embed the web build per this plan:\n${JSON.stringify(plan)}\nFollow the embedding-web-builds skill: correct MIME types and Content-Encoding; cross-origin isolation headers only on ${page} (or its iframe) if needed; reserved aspect-ratio space; click-to-load with poster and the download size; labelled progress; capability check with fallback linking native downloads; error state with retry; noscript message; focusable canvas with an accessible name and a documented key to release focus; pause on visibilitychange; handle every contract event (ignore unknown ones); design out the failure modes the plan marks as applying (${FAILURE_MODES}); keep the elements the plan's preview section names (play, error, retry, progress, canvas) so the probe can find them; postMessage with explicit targetOrigin and origin/source/payload checks if the bridge is an iframe. Keep the rest of the site's headers unchanged. Commit with a Conventional Commit message. Return files changed and how to preview.`,
  { phase: 'Build', label: 'build' },
)
if (!built) return 'embed-web-build: build agent failed; check the working tree for partial changes.'

const CHECKS = [
  ['hosting-headers', 'embedding-web-builds and static-sites-and-hosting', 'on a deployed URL, check with curl -sI; on an undeployed build, the local preview server only shows what it sends, so read the host\'s header config (e.g. _headers, server or CDN config) for what the host will send and confirm the probe ran with it (--headers-file), and say which headers only a deploy can confirm. Check: .wasm is application/wasm, pre-compressed files have the right Content-Encoding, isolation headers present on the build page only and self.crossOriginIsolated is true there if needed, CSP allows exactly what the build needs, other pages unchanged'],
  ['loading-and-failure', 'embedding-web-builds', 'click-to-load works, progress shown and announced and no download finishes after progress shows complete (downloads that bypass the engine\'s progress API), unsupported browser shows the fallback with download links, a failed fetch of each build file shows an error with a retry that recovers and never leaves start() pending, a one-time failure of each build file (first request aborted, 503, or cut off mid-body; the probe\'s partial_failures) recovers by the loader\'s own retry or the retry control and never reaches ready on the failed response, the canvas backing store matches its box x devicePixelRatio at each probed viewport (not the 300x150 default), noscript message present'],
  ['contract', 'embedding-web-builds', `every event in the contract is handled or deliberately ignored, payloads validated, postMessage origin checks in place if an iframe is used. Contract: ${JSON.stringify(plan.contract)}`],
  ['accessibility', 'web-accessibility', 'keyboard can reach the build, enter it and leave it (no trap), canvas has an accessible name, instructions are HTML text, controls meet target size and contrast, reduced motion respected on the host page'],
  ['performance', 'web-performance', 'the hosting page Core Web Vitals in lab with mobile throttling are unaffected before the click: no build bytes fetched before the click, no layout shift when the canvas appears'],
]
// The probe runs the page in a real browser before each verify round, so
// the checks read evidence instead of assuming a deployed URL.
const PREVIEW = {
  type: 'object',
  properties: { url: { type: 'string' }, deployed: { type: 'boolean' }, command: { type: 'string' }, report: { type: 'string' }, problems: { type: 'array', items: { type: 'object' } }, ran: { type: 'boolean' }, why_not: { type: 'string' } },
  required: ['url', 'deployed', 'command', 'ran'],
}
const probeSetup = JSON.stringify(plan.preview || {})
const preview = (round) => agent(
  `Preview the embedded web build on ${page} (round ${round}) following the embedding-web-builds skill, "Auditing an undeployed build". ${url ? `Probe the given URL ${url} (deployed: say whether it is the live host or a preview).` : 'Nothing is deployed: build the site with the project\'s site build command, then serve the built site locally with the probe.'} Run this plugin's browser harness: node <frontend-web-developer plugin dir>/tools/preview-probe.mjs ${url ? `--url ${url}` : '--root <built site dir> --page ' + page} with --play, --ready (or --ready-js), --error, --retry, --progress, --canvas, --release-key and --headers-file from this setup: ${probeSetup}, and --out <a report file outside the repository>. It loads the page, clicks play, waits for the ready event, checks progress, canvas backing-store size at two viewports and focus, then injects a failed fetch of each build file and checks for an error with a working retry, then fails each build file once (aborted, 503, cut off mid-body; --flaky, --flaky-modes) and checks the page recovers. If Playwright or its browser is missing, install it outside the repository (npm install --no-save playwright in a scratch directory, then run the probe with NODE_PATH=<scratch>/node_modules and absolute paths), or report ran: false with why_not. Do not edit, commit or fix anything. Return the URL probed, whether it is deployed, the exact command, the report path, and the report's problems list.`,
  { schema: PREVIEW, phase: 'Preview', label: `preview#${round}` },
)
const verify = async (round) => {
  phase('Preview')
  const pv = await preview(round)
  const evidence = pv && pv.ran
    ? `Browser probe report (${pv.deployed ? 'deployed' : 'local preview'} ${pv.url}; command: ${pv.command}; report file: ${pv.report || 'not saved'}): problems ${JSON.stringify(pv.problems || [])}. Re-run the command yourself if you need more than the report shows.`
    : `The browser probe did not run (${(pv && pv.why_not) || 'preview step failed'}); run node <frontend-web-developer plugin dir>/tools/preview-probe.mjs yourself (setup: ${probeSetup}) or mark what you could not check as a blocker.`
  phase('Verify')
  return parallel(CHECKS.map(([name, skill, what]) => () =>
    agent(`Check the embedded web build on ${page} (round ${round}) following the ${skill} skill: ${what}. ${evidence} Read-only: change no files. Return issues with where, problem, severity and fix.`,
      { schema: ISSUES, phase: 'Verify', label: `${name}#${round}`, independent: true })
      .then(r => r || { check: name, issues: [{ where: page, problem: `${name} check did not run (agent failed)`, severity: 'blocker', fix: 're-run this check' }], unverified: true })))
}

let results = await verify(1)
let open = results.flatMap(r => r.issues.filter(i => i.severity !== 'minor'))
let round = 1
while (open.length && round <= 2) {
  phase('Fix')
  const fixed = await agent(`Fix these issues with the embedded web build on ${page}, following the frontend-web-developer skills. You are the only agent editing files. Problems inside the build itself go back to its owning role as a written request; do not patch build output. Commit with Conventional Commit messages.\n${JSON.stringify(open)}`, { phase: 'Fix', label: `fix#${round}` })
  if (!fixed) break
  round++
  results = await verify(round)
  open = results.flatMap(r => r.issues.filter(i => i.severity !== 'minor'))
}
let minor = results.flatMap(r => r.issues.filter(i => i.severity === 'minor'))
if (open.length) return { status: 'blocked', page, open_items: open, minor, questions_for_build_owner: plan.questions_for_build_owner || [] }

// Minor issues are fixed too, not handed off; a final preview and verify
// make the result list what is still open after the fixes, not before.
let polished = null
if (minor.length) {
  phase('Polish')
  polished = await agent(`Fix these minor issues with the embedded web build on ${page}, following the frontend-web-developer skills. You are the only agent editing files. Fix every one you can with a small change; leave one only when it needs a decision from another role or changes inside the build itself (send those to the owning role as a written request), and say why. Commit with Conventional Commit messages.\n${JSON.stringify(minor)}`,
    { schema: { type: 'object', properties: { fixed: { type: 'array', items: { type: 'string' } }, left: { type: 'array', items: { type: 'object', properties: { where: { type: 'string' }, problem: { type: 'string' }, why: { type: 'string' } }, required: ['problem', 'why'] } } }, required: ['fixed'] }, phase: 'Polish', label: 'polish' })
  if (polished) {
    round++
    results = await verify(round)
    open = results.flatMap(r => r.issues.filter(i => i.severity !== 'minor'))
    minor = results.flatMap(r => r.issues.filter(i => i.severity === 'minor'))
    if (open.length) return { status: 'blocked', page, reason: 'the final verify after fixing minor issues found blocker or major issues', open_items: open, minor, polished, questions_for_build_owner: plan.questions_for_build_owner || [] }
  }
}

phase('Docs')
const docs = await agent(
  `You are the frontend-web-developer. Document the embedded web build on ${page} in the same branch, following the planned doc pages:\n${JSON.stringify(plan.doc_pages)}\n${DOCS_FRAGMENT}\nThe event contract table and required headers are reference; the bridge and click-to-load reasoning is explanation; updating the build to a new release is a how-to. What was built: ${built}`,
  { schema: { type: 'object', properties: { pages: { type: 'array', items: { type: 'string' } }, undocumented: { type: 'array', items: { type: 'string' } } }, required: ['pages'] }, phase: 'Docs', label: 'docs' },
)
if (!docs) return { status: 'blocked', page, reason: 'docs step failed; the change is not done without its docs', built }

phase('Docs check')
const DOCCHECK = { type: 'object', properties: { ok: { type: 'boolean' }, problems: { type: 'array', items: { type: 'string' } } }, required: ['ok'] }
// The check only reads, so it stays independent of the writing; small
// fixes are their own step, followed by a fresh check.
const docCheckPrompt = `Review the doc pages just written for the embedded web build (report: ${JSON.stringify(docs)}). Check each page holds one Diataxis kind only, titles follow the patterns, and the kinds link to each other. Read-only: do not edit anything; report every problem with its page.`
let check = await agent(docCheckPrompt, { schema: DOCCHECK, phase: 'Docs check', label: 'docs-check', independent: true })
if (check && !check.ok && (check.problems || []).length) {
  const docFix = await agent(`Fix these documentation problems with the smallest edits, touching only the pages they name; leave anything that needs a content decision:\n- ${check.problems.join('\n- ')}`, { phase: 'Docs check', label: 'docs-fix' })
  if (docFix) check = await agent(docCheckPrompt, { schema: DOCCHECK, phase: 'Docs check', label: 'docs-recheck', independent: true })
}

// The handoff is what engineering-practices deliver-package takes as
// prior, so the embed ships without being built again.
phase('Handoff')
const HANDOFF = { type: 'object', properties: { branch: { type: 'string' }, pr: { type: 'string' }, head_sha: { type: 'string' }, tests_pass: { type: 'boolean' }, problem: { type: 'string' } }, required: ['branch', 'tests_pass'] }
const hand = await agent(
  `Hand off the embedded web build on ${page}. If you are on the default branch, cut a Conventional branch (feat/<slug>) from the latest remote default branch; otherwise stay on the current feature branch. Commit every file this run wrote (the host header config, page and bridge script: ${(plan.files_to_change || []).join(', ') || 'as built'}, never the build output itself; and the docs pages: ${(docs.pages || []).join(', ') || 'as written'}) as Conventional Commits, and push. Run the project's checks that apply on the pushed head: the site build and tests, and the header, link and docs checks the project profile names. Do not open, mark ready or merge a PR: the engineering-practices workflow named in the result does that. Follow the engineering-practices git-workflow skill. Return the branch, any open PR, the head commit SHA, whether the checks pass on that head, and the problem if not.`,
  { schema: HANDOFF, phase: 'Handoff', label: 'handoff' },
)
if (!hand || !hand.branch) return { status: 'blocked', page, reason: hand && hand.problem ? hand.problem : 'handoff step returned nothing; the work may be uncommitted or unpushed', built }
if (!hand.tests_pass) return { status: 'blocked', page, reason: `site checks fail on ${hand.branch}${hand.head_sha ? ' at ' + hand.head_sha : ''}: ${hand.problem || 'no details'}`, built }

return {
  status: 'ready',
  page,
  bridge: plan.bridge,
  built,
  minor_issues: minor,
  minor_fixed: polished ? polished.fixed || [] : [],
  minor_left: polished ? polished.left || [] : [],
  verify_rounds: round,
  questions_for_build_owner: plan.questions_for_build_owner || [],
  docs,
  docs_check: !check ? 'docs check failed: pages unverified' : check.ok ? 'ok' : check.problems || ['docs check failed without details'],
  handoff: {
    from: 'frontend-web-developer:embed-web-build',
    branch: hand.branch,
    pr: hand.pr || '',
    head_sha: hand.head_sha || '',
    tests_pass: true,
    docs: docs.pages || [],
    undocumented: docs.undocumented || [],
    notes: [
      ...((plan.questions_for_build_owner || []).length ? [`open questions for the build owner: ${plan.questions_for_build_owner.join('; ')}`] : []),
      ...(minor.length ? [`minor issues still open after the final verify (round ${round}): ${minor.map((i) => `${i.where}: ${i.problem}`).join('; ')}`] : []),
    ],
  },
  next: 'ship it without rebuilding: /engineering-practices:deliver-package { wp: "<the package>", prior: <this result> }; with no work package, /engineering-practices:land-pr { branch: "<handoff.branch>" }',
}
})(RUN.agent, RUN.phase, RUN.log)]); return RUN.finish(RUN_OUT)
