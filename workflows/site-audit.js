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
const DOCCHECK = { type: 'object', properties: { ok: { type: 'boolean' }, problems: { type: 'array', items: { type: 'string' } } }, required: ['ok'] }
// The check only reads, so it stays independent of the writing; small
// fixes are their own step, followed by a fresh check.
const docCheckPrompt = `Review the doc pages just written for the ${site} audit (report: ${docs}). Check each page holds one Diataxis kind only (no instructions in reference or explanation), titles follow the patterns, and the kinds link to each other. Read-only: do not edit anything; report every problem with its page.`
let check = await agent(docCheckPrompt, { schema: DOCCHECK, phase: 'Docs check', label: 'docs-check', independent: true })
if (check && !check.ok && (check.problems || []).length) {
  const docFix = await agent(`Fix these documentation problems with the smallest edits, touching only the pages they name; leave anything that needs a content decision:\n- ${check.problems.join('\n- ')}`, { phase: 'Docs check', label: 'docs-fix' })
  if (docFix) check = await agent(docCheckPrompt, { schema: DOCCHECK, phase: 'Docs check', label: 'docs-recheck', independent: true })
}

return {
  status: unverified.length ? 'partial' : 'complete',
  not_checked: unverified,
  fix_list: fixList,
  docs: docs,
  docs_check: !check ? 'docs check failed: pages unverified' : check.ok ? 'ok' : check.problems || ['docs check failed without details'],
}
})(RUN.agent, RUN.phase, RUN.log)]); return RUN.finish(RUN_OUT)
