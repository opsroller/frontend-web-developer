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
        how: 'Do each brief in next, in order: follow its prompt in this session (it may tell you to edit files, commit or push), and shape your answer to its schema when one is given, with every required field. A brief marked independent reviews work this run produced, so do not answer it yourself: send its prompt to a reviewer with no part in the work (the project\'s code-reviewer role, a fresh session or a fresh subagent), use their answer, and name them in run.reviewers under its key; if you must answer it yourself, it is listed in self_reviewed and must be reported as self-reviewed. A brief with a note was answered before without the fields it names. Add each answer to results under its key, then run this workflow again with the same args, run.results set to the merged results and run.reviewers to the merged reviewers. Repeat until status is "done".',
      }
    }
    return { run: mode, status: 'done', result: value, results: out, reviewers: by, self_reviewed, skipped, logs }
  }
  return { agent, phase, log, finish, halted, error }
})(typeof args === 'undefined' ? undefined : args, agent, phase, log)
if (RUN.error) return RUN.error
const RUN_OUT = await Promise.race([RUN.halted, (async (agent, phase, log) => {
// --- run-modes v2 end (workflow body follows; close it with the tail line) ---

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
    { schema: ISSUES, phase: 'Verify', label: `${name}#${round}`, independent: true })
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
const DOCCHECK = { type: 'object', properties: { ok: { type: 'boolean' }, problems: { type: 'array', items: { type: 'string' } } }, required: ['ok'] }
// The check only reads, so it stays independent of the writing; small
// fixes are their own step, followed by a fresh check.
const docCheckPrompt = `Review the doc pages just written for the download page (report: ${docs}). Check each page holds one Diataxis kind only, titles follow the patterns, the how-to names a user goal, and the kinds link to each other. Read-only: do not edit anything; report every problem with its page.`
let check = await agent(docCheckPrompt, { schema: DOCCHECK, phase: 'Docs check', label: 'docs-check', independent: true })
if (check && !check.ok && (check.problems || []).length) {
  const docFix = await agent(`Fix these documentation problems with the smallest edits, touching only the pages they name; leave anything that needs a content decision:\n- ${check.problems.join('\n- ')}`, { phase: 'Docs check', label: 'docs-fix' })
  if (docFix) check = await agent(docCheckPrompt, { schema: DOCCHECK, phase: 'Docs check', label: 'docs-recheck', independent: true })
}

return {
  status: 'ready',
  page,
  built,
  minor_issues: minor,
  missing_data: plan.missing_data || [],
  docs,
  docs_check: !check ? 'docs check failed: pages unverified' : check.ok ? 'ok' : check.problems || ['docs check failed without details'],
}
})(RUN.agent, RUN.phase, RUN.log)]); return RUN.finish(RUN_OUT)
