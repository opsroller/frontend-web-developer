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
    { schema: ISSUES, phase: 'Verify', label: `${name}#${round}`, independent: true })
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
const DOCCHECK = { type: 'object', properties: { ok: { type: 'boolean' }, problems: { type: 'array', items: { type: 'string' } } }, required: ['ok'] }
// The check only reads, so it stays independent of the writing; small
// fixes are their own step, followed by a fresh check.
const docCheckPrompt = `Review the doc pages just written for the embedded web build (report: ${docs}). Check each page holds one Diataxis kind only, titles follow the patterns, and the kinds link to each other. Read-only: do not edit anything; report every problem with its page.`
let check = await agent(docCheckPrompt, { schema: DOCCHECK, phase: 'Docs check', label: 'docs-check', independent: true })
if (check && !check.ok && (check.problems || []).length) {
  const docFix = await agent(`Fix these documentation problems with the smallest edits, touching only the pages they name; leave anything that needs a content decision:\n- ${check.problems.join('\n- ')}`, { phase: 'Docs check', label: 'docs-fix' })
  if (docFix) check = await agent(docCheckPrompt, { schema: DOCCHECK, phase: 'Docs check', label: 'docs-recheck', independent: true })
}

return {
  status: 'ready',
  page,
  bridge: plan.bridge,
  built,
  minor_issues: minor,
  questions_for_build_owner: plan.questions_for_build_owner || [],
  docs,
  docs_check: !check ? 'docs check failed: pages unverified' : check.ok ? 'ok' : check.problems || ['docs check failed without details'],
}
})(RUN.agent, RUN.phase, RUN.log)]); return RUN.finish(RUN_OUT)
