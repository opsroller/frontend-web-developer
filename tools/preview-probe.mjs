// SPDX-License-Identifier: GPL-2.0-or-later
// Serve an undeployed site locally and probe an embedded web build in a real
// browser: what loads before the click, the ready event, progress, canvas
// backing-store size, keyboard focus, and the page's answer to a failed
// fetch of each build file. Prints a JSON report; exits 1 when it finds a
// problem, 2 on a usage error.
// Usage:
//   node tools/preview-probe.mjs --root <site dir> --page /play/ [options]
//   node tools/preview-probe.mjs --url <deployed page URL> [options]
//   node tools/preview-probe.mjs --root <site dir> --serve-only [--port 8080]
// Spec: docs/reference/tools/preview-probe.md.
import { createServer } from 'node:http'
import { createReadStream, existsSync, readFileSync, statSync, writeFileSync } from 'node:fs'
import { extname, join, normalize, resolve, sep } from 'node:path'
import { createRequire } from 'node:module'
import { execSync } from 'node:child_process'

const USAGE = `usage: node tools/preview-probe.mjs (--root <dir> [--page /play/] | --url <page URL>)
  [--play <selector>] [--ready <event name> | --ready-js <expression>] [--error <selector>]
  [--retry <selector>] [--canvas <selector>] [--progress <selector>] [--release-key <key>]
  [--header '<path glob>|<Name>: <value>']... [--headers-file <_headers file>]
  [--fail auto|none|<url part>,...] [--build-pattern <regex>] [--timeout <ms>] [--browser chromium|firefox|webkit]
  [--viewport <w>x<h>[@<dpr>]]... [--out <report.json>] [--port <n>] [--serve-only]`

const opt = { header: [], viewport: [], fail: 'auto', timeout: 30000, browser: 'chromium', canvas: 'canvas', port: 0, page: '/', buildPattern: '\\.(wasm|pck|data|bin)(\\?|$)' }
const argv = process.argv.slice(2)
for (let i = 0; i < argv.length; i++) {
  const flag = argv[i]
  if (!flag.startsWith('--')) { console.error(`unexpected ${flag}\n${USAGE}`); process.exit(2) }
  const name = flag.slice(2).replace(/-([a-z])/g, (_, c) => c.toUpperCase())
  if (name === 'serveOnly') { opt.serveOnly = true; continue }
  const val = argv[++i]
  if (val === undefined) { console.error(`${flag} needs a value\n${USAGE}`); process.exit(2) }
  if (name === 'header' || name === 'viewport') opt[name].push(val)
  else if (name === 'timeout' || name === 'port') opt[name] = Number(val)
  else if (['root', 'page', 'url', 'play', 'ready', 'readyJs', 'error', 'retry', 'canvas', 'progress', 'releaseKey', 'headersFile', 'fail', 'browser', 'out', 'buildPattern'].includes(name)) opt[name] = val
  else { console.error(`unknown flag ${flag}\n${USAGE}`); process.exit(2) }
}
if (!opt.root === !opt.url) { console.error(`give exactly one of --root and --url\n${USAGE}`); process.exit(2) }
if (opt.serveOnly && !opt.root) { console.error(`--serve-only needs --root\n${USAGE}`); process.exit(2) }

// --- local preview server ---------------------------------------------------
const MIME = {
  '.html': 'text/html; charset=utf-8', '.js': 'text/javascript', '.mjs': 'text/javascript', '.css': 'text/css',
  '.json': 'application/json', '.wasm': 'application/wasm', '.png': 'image/png', '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg', '.webp': 'image/webp', '.avif': 'image/avif', '.svg': 'image/svg+xml', '.ico': 'image/x-icon',
  '.woff2': 'font/woff2', '.txt': 'text/plain; charset=utf-8', '.xml': 'application/xml', '.pck': 'application/octet-stream',
  '.data': 'application/octet-stream', '.bin': 'application/octet-stream', '.mp3': 'audio/mpeg', '.ogg': 'audio/ogg', '.wav': 'audio/wav',
}
const ENCODING = { '.br': 'br', '.gz': 'gzip' }
const glob = (pattern) => new RegExp('^' + pattern.split('*').map((s) => s.replace(/[.+?^${}()|[\]\\]/g, '\\$&')).join('.*').replace(/:splat/g, '.*') + '$')
// Header rules: --header 'glob|Name: value' plus a Netlify/Cloudflare-style
// _headers file (a path line, then indented "Name: value" lines).
const rules = []
for (const h of opt.header) {
  const bar = h.indexOf('|')
  const [path, line] = bar > 0 ? [h.slice(0, bar), h.slice(bar + 1)] : ['/*', h]
  const colon = line.indexOf(':')
  if (colon < 1) { console.error(`--header needs "Name: value", got "${h}"`); process.exit(2) }
  rules.push({ re: glob(path), name: line.slice(0, colon).trim(), value: line.slice(colon + 1).trim() })
}
if (opt.headersFile) {
  let path = null
  for (const raw of readFileSync(opt.headersFile, 'utf8').split('\n')) {
    if (!raw.trim() || raw.trim().startsWith('#')) continue
    if (!/^\s/.test(raw)) { path = raw.trim(); continue }
    const colon = raw.indexOf(':')
    if (path && colon > 0) rules.push({ re: glob(path), name: raw.slice(0, colon).trim(), value: raw.slice(colon + 1).trim() })
  }
}
const serve = (root) => new Promise((ok) => {
  const base = resolve(root)
  const server = createServer((req, res) => {
    const url = new URL(req.url, 'http://x')
    let rel = decodeURIComponent(url.pathname)
    let file = normalize(join(base, rel))
    if (file !== base && !file.startsWith(base + sep)) { res.writeHead(403).end(); return }
    if (existsSync(file) && statSync(file).isDirectory()) {
      if (!rel.endsWith('/')) { res.writeHead(301, { Location: rel + '/' + url.search }).end(); return }
      file = join(file, 'index.html'); rel += 'index.html'
    }
    const headers = {}
    // A missing file with a pre-compressed sibling is served the way a host
    // with Content-Encoding support would serve it.
    let enc = null
    if (!existsSync(file)) {
      const accept = String(req.headers['accept-encoding'] || '')
      for (const [ext, name] of Object.entries(ENCODING)) if (accept.includes(name) && existsSync(file + ext)) { file += ext; enc = name; break }
    }
    if (!existsSync(file) || statSync(file).isDirectory()) { res.writeHead(404, { 'Content-Type': 'text/plain' }).end('not found'); return }
    const ext = extname(enc ? file.slice(0, -extname(file).length) : file).toLowerCase()
    headers['Content-Type'] = MIME[ext] || 'application/octet-stream'
    if (enc) headers['Content-Encoding'] = enc
    headers['Content-Length'] = statSync(file).size
    headers['Cache-Control'] = 'no-store'
    for (const r of rules) if (r.re.test(url.pathname)) headers[r.name] = r.value
    res.writeHead(200, headers)
    if (req.method === 'HEAD') res.end(); else createReadStream(file).pipe(res)
  })
  server.listen(opt.port, '127.0.0.1', () => ok(server))
})

let server = null
let pageUrl = opt.url
if (opt.root) {
  if (!existsSync(opt.root)) { console.error(`--root ${opt.root} does not exist`); process.exit(2) }
  server = await serve(opt.root)
  const origin = `http://127.0.0.1:${server.address().port}`
  pageUrl = origin + (opt.page.startsWith('/') ? opt.page : '/' + opt.page)
  if (opt.serveOnly) {
    console.log(`serving ${resolve(opt.root)} at ${origin}/ (Ctrl+C to stop)`)
    await new Promise(() => {})
  }
}

// --- browser probe ----------------------------------------------------------
const load = () => {
  const tries = [createRequire(resolve('package.json'))]
  for (const dir of String(process.env.NODE_PATH || '').split(process.platform === 'win32' ? ';' : ':').filter(Boolean)) tries.push(createRequire(join(resolve(dir), 'x')))
  try { tries.push(createRequire(join(execSync('npm root -g', { encoding: 'utf8' }).trim(), 'x'))) } catch {}
  for (const req of tries) for (const name of ['playwright', '@playwright/test']) { try { return req(name) } catch {} }
  return null
}
const pw = load()
if (!pw) {
  console.error('Playwright is not installed: npm install --no-save playwright, then npx playwright install chromium (or use a preinstalled browser).')
  if (server) server.close()
  process.exit(2)
}

const problems = []
const problem = (check, severity, detail) => problems.push({ check, severity, detail })
const viewports = (opt.viewport.length ? opt.viewport : ['1280x720@2', '390x844']).map((v) => {
  const m = /^(\d+)x(\d+)(?:@([\d.]+))?$/.exec(v)
  if (!m) { console.error(`--viewport needs <w>x<h>[@<dpr>], got "${v}"`); process.exit(2) }
  return { width: Number(m[1]), height: Number(m[2]), dpr: Number(m[3] || 1) }
})
const readyName = opt.ready || null
// Records the ready event, layout shift and progress before any page script runs.
const INIT = `(() => {
  window.__probe = { ready: null, cls: 0, progress: [] };
  const name = ${JSON.stringify(readyName)};
  if (name) for (const t of [window, document]) t.addEventListener(name, (e) => { if (!window.__probe.ready) window.__probe.ready = { at: performance.now(), detail: (() => { try { return JSON.parse(JSON.stringify(e.detail ?? null)) } catch { return String(e.detail) } })() } }, true);
  try { new PerformanceObserver((l) => { for (const e of l.getEntries()) if (!e.hadRecentInput) window.__probe.cls += e.value }).observe({ type: 'layout-shift', buffered: true }) } catch {}
  // Progress changes, on the page's own clock so they line up with resource timing.
  const sel = ${JSON.stringify(opt.progress || null)};
  if (sel) {
    const read = () => { const p = document.querySelector(sel); if (!p) return; const value = Number(p.getAttribute('aria-valuenow') ?? p.value); const max = Number(p.getAttribute('aria-valuemax') ?? p.max ?? 1); const last = window.__probe.progress[window.__probe.progress.length - 1]; if (!last || last.value !== value || last.max !== max) window.__probe.progress.push({ at: performance.now(), value, max }) };
    const watch = () => new MutationObserver(read).observe(document.documentElement, { subtree: true, attributes: true, attributeFilter: ['value', 'max', 'aria-valuenow', 'aria-valuemax'] });
    if (document.documentElement) watch(); else document.addEventListener('DOMContentLoaded', watch);
  }
})()`
const browserType = pw[opt.browser]
if (!browserType) { console.error(`unknown --browser ${opt.browser}`); process.exit(2) }
const browser = await browserType.launch()
const vp0 = viewports[0]
const newPage = async (vp = vp0) => {
  const ctx = await browser.newContext({ viewport: { width: vp.width, height: vp.height }, deviceScaleFactor: vp.dpr })
  await ctx.addInitScript(INIT)
  const page = await ctx.newPage()
  const log = { requests: [], console: [], pageErrors: [] }
  page.on('console', (m) => { if (m.type() === 'error') log.console.push(m.text()) })
  page.on('pageerror', (e) => log.pageErrors.push(String(e)))
  page.on('requestfinished', async (r) => {
    let bytes = null
    try { bytes = (await r.sizes()).responseBodySize } catch {}
    const resp = await r.response().catch(() => null)
    log.requests.push({ url: r.url(), at: Date.now(), bytes, status: resp ? resp.status() : null, type: resp ? resp.headers()['content-type'] || '' : '', encoding: resp ? resp.headers()['content-encoding'] || '' : '' })
  })
  return { ctx, page, log }
}
const ready = (page) => opt.readyJs
  ? page.evaluate(opt.readyJs).then(Boolean).catch(() => false)
  : page.evaluate(() => !!(window.__probe && window.__probe.ready)).catch(() => false)
const waitFor = async (page, test, ms) => {
  const end = Date.now() + ms
  while (Date.now() < end) { if (await test()) return true; await page.waitForTimeout(100) }
  return false
}
const visible = (page, sel) => sel ? page.locator(sel).first().isVisible().catch(() => false) : Promise.resolve(false)
// The canvas may sit in the page or in an iframe the page embeds.
const canvasInfo = async (page) => {
  for (const f of page.frames()) {
    const info = await f.evaluate((sel) => {
      const c = document.querySelector(sel)
      if (!c) return null
      const r = c.getBoundingClientRect()
      return { width: c.width, height: c.height, client_width: r.width, client_height: r.height, dpr: devicePixelRatio, focusable: c.tabIndex >= 0, name: c.getAttribute('aria-label') || c.getAttribute('title') || '', focused: document.activeElement === c && document.hasFocus() }
    }, opt.canvas).catch(() => null)
    if (info) return Object.assign(info, { frame: f === page.mainFrame() ? 'main' : f.url() })
  }
  return null
}
const checkCanvas = (info, label) => {
  if (!info) { problem('canvas', 'major', `${label}: no element matches ${opt.canvas}`); return }
  if (info.width === 300 && info.height === 150) problem('canvas', 'major', `${label}: backing store is the 300x150 default; the build never sized it, so it renders blurry and stretched (CSS ${Math.round(info.client_width)}x${Math.round(info.client_height)})`)
  const want = [Math.round(info.client_width * info.dpr), Math.round(info.client_height * info.dpr)]
  const off = Math.max(Math.abs(info.width - want[0]) / Math.max(want[0], 1), Math.abs(info.height - want[1]) / Math.max(want[1], 1))
  if (off > 0.05 && !(info.width === 300 && info.height === 150)) problem('canvas', off > 0.25 ? 'major' : 'minor', `${label}: backing store ${info.width}x${info.height} vs CSS size x DPR ${want[0]}x${want[1]}; when the page owns the layout, size the canvas to its box x devicePixelRatio and resize it with the box`)
}
const start = async (page) => {
  await page.goto(pageUrl, { waitUntil: 'load' })
  await page.waitForTimeout(300)
  if (opt.play) {
    const play = page.locator(opt.play).first()
    if (!(await play.isVisible().catch(() => false))) return false
    await play.click()
  }
  return true
}

const report = { url: pageUrl, served_from: opt.root ? resolve(opt.root) : null, browser: opt.browser, viewports, before_click: null, start: null, canvas: [], focus: null, failures: [], headers: [], problems }

// 1. Successful load.
const { ctx, page, log } = await newPage()
await page.goto(pageUrl, { waitUntil: 'load' })
await page.waitForTimeout(500)
const firstParty = (u) => new URL(u).origin === new URL(pageUrl).origin
const before = log.requests.slice()
report.before_click = { requests: before.length, bytes: before.reduce((s, r) => s + (r.bytes || 0), 0), urls: before.map((r) => r.url) }
let clickAt = Date.now()
if (opt.play) {
  const play = page.locator(opt.play).first()
  if (!(await play.isVisible().catch(() => false))) problem('loading', 'blocker', `play control ${opt.play} is not visible`)
  else { clickAt = Date.now(); await play.click() }
}
const ok = (readyName || opt.readyJs) ? await waitFor(page, () => ready(page), opt.timeout) : (await page.waitForTimeout(3000), true)
const after = log.requests.filter((r) => r.at >= clickAt)
const readyAt = Date.now()
report.start = { ready: ok, ms: readyAt - clickAt, detail: await page.evaluate(() => window.__probe && window.__probe.ready && window.__probe.ready.detail).catch(() => null), files: after.map((r) => ({ url: r.url, bytes: r.bytes, status: r.status, type: r.type, encoding: r.encoding })), console_errors: log.console, page_errors: log.pageErrors, cls: await page.evaluate(() => window.__probe ? window.__probe.cls : null).catch(() => null) }
if (!ok) problem('loading', 'blocker', `no ready signal within ${opt.timeout} ms after start (${readyName ? `event "${readyName}"` : opt.readyJs || 'none'})`)
if (report.start.cls > 0.1) problem('performance', 'major', `layout shift ${report.start.cls.toFixed(3)} by the time the build is ready (budget 0.1); reserve the container's space`)
const buildRe = new RegExp(opt.buildPattern)
const big = before.filter((r) => buildRe.test(r.url))
if (opt.play && big.length) problem('performance', 'major', `build files fetched before the click: ${big.map((r) => r.url).join(', ')}`)
for (const r of after) {
  if (/\.wasm(\?|$)/.test(r.url) && !r.type.startsWith('application/wasm')) problem('hosting-headers', 'major', `${r.url} served as "${r.type}", not application/wasm`)
  if (r.status && r.status >= 400) problem('loading', 'major', `${r.url} returned ${r.status} during a normal start`)
}
// Downloads that finish after the progress display reached its end bypassed
// the progress the page shows (resource timing and progress share a clock).
if (opt.progress) {
  const progress = await page.evaluate(() => window.__probe ? window.__probe.progress : []).catch(() => [])
  const timing = await page.evaluate(() => performance.getEntriesByType('resource').map((e) => ({ url: e.name, end: e.responseEnd, bytes: e.encodedBodySize || e.transferSize || 0 }))).catch(() => [])
  const done = progress.find((p) => p.max && p.value >= p.max)
  const late = done ? timing.filter((t) => t.end > done.at && t.bytes > 100 * 1024) : []
  if (!progress.length) problem('loading', 'major', `the progress element ${opt.progress} never changed while loading`)
  else if (late.length) problem('loading', 'major', `downloads finished after progress showed complete, so they bypass the progress the page reports (route them through the engine's progress API or count their bytes): ${late.map((t) => `${t.url} (${t.bytes} B)`).join(', ')}`)
  report.start.progress = progress
}
for (const vp of viewports) {
  if (vp !== vp0) { await page.setViewportSize({ width: vp.width, height: vp.height }); await page.waitForTimeout(500) }
  const info = await canvasInfo(page)
  report.canvas.push(Object.assign({ viewport: `${vp.width}x${vp.height}@${vp.dpr}` }, info || { missing: true }))
  // Later viewports resize the same page (the DPR stays the first one's), so
  // they also catch a page that sizes the canvas once and never again.
  checkCanvas(info, `${vp.width}x${vp.height}`)
}
await page.setViewportSize({ width: vp0.width, height: vp0.height })
const c = await canvasInfo(page)
const focus = { focused_after_start: !!(c && c.focused), focusable: !!(c && c.focusable), accessible_name: c ? c.name : '' }
if (c && !c.focusable) problem('accessibility', 'major', 'canvas is not focusable (tabindex)')
if (c && !c.name) problem('accessibility', 'major', 'canvas has no accessible name (aria-label)')
if (opt.releaseKey && c) {
  // Put focus on the canvas first, as a player clicking into it would, so the
  // check tests the trap rather than keys landing on <body>.
  let focusedNow = false
  for (const f of page.frames()) {
    const el = await f.$(opt.canvas).catch(() => null)
    if (!el) continue
    await el.focus().catch(() => {})
    focusedNow = await f.evaluate((sel) => document.activeElement === document.querySelector(sel), opt.canvas).catch(() => false)
    break
  }
  focus.focused_for_release_check = focusedNow
}
if (opt.releaseKey && c && !focus.focused_for_release_check) problem('accessibility', 'major', `could not focus the canvas to test ${opt.releaseKey}; the keyboard-trap check did not run`)
if (opt.releaseKey && c && focus.focused_for_release_check) {
  await page.keyboard.press(opt.releaseKey)
  await page.keyboard.press('Tab')
  await page.waitForTimeout(200)
  const c2 = await canvasInfo(page)
  focus.released_by = opt.releaseKey
  focus.released = !(c2 && c2.focused)
  if (!focus.released) problem('accessibility', 'blocker', `${opt.releaseKey} then Tab leaves focus on the canvas (keyboard trap, WCAG 2.1.2)`)
}
report.focus = focus
// HEAD the build files for their served headers, so the report shows what
// this server (or the deployed host) sends.
for (const f of report.start.files.filter((x) => firstParty(x.url))) {
  const res = await fetch(f.url, { method: 'HEAD', headers: { 'Accept-Encoding': 'br, gzip' } }).catch(() => null)
  if (res) report.headers.push({ url: f.url, status: res.status, 'content-type': res.headers.get('content-type'), 'content-encoding': res.headers.get('content-encoding'), 'cross-origin-opener-policy': res.headers.get('cross-origin-opener-policy'), 'cross-origin-embedder-policy': res.headers.get('cross-origin-embedder-policy') })
}
report.cross_origin_isolated = await page.evaluate(() => self.crossOriginIsolated).catch(() => null)
await ctx.close()

// 2. A failed fetch of each build file must end in a visible error, not a hang.
const targets = opt.fail === 'none' ? [] : opt.fail === 'auto'
  ? report.start.files.filter((f) => firstParty(f.url) && !/text\/html|text\/css/.test(f.type) && f.url !== pageUrl).map((f) => new URL(f.url).pathname)
  : opt.fail.split(',').map((s) => s.trim()).filter(Boolean)
for (const target of [...new Set(targets)]) {
  const run = await newPage()
  let hits = 0
  const match = (u) => u.href.includes(target)
  await run.page.route(match, (route) => { hits++; route.abort('failed') })
  const started = await start(run.page)
  const fail = { file: target, outcome: 'hung', ms: null, retry: null }
  const t0 = Date.now()
  if (!started) fail.outcome = 'no-play-control'
  else {
    const end = Date.now() + Math.min(opt.timeout, 15000)
    while (Date.now() < end) {
      if (opt.error && await visible(run.page, opt.error)) { fail.outcome = 'error-shown'; break }
      if (await ready(run.page)) { fail.outcome = 'ready-anyway'; break }
      await run.page.waitForTimeout(100)
    }
    fail.ms = Date.now() - t0
  }
  fail.requested = hits > 0
  if (fail.outcome === 'hung') problem('loading-and-failure', 'blocker', `failed fetch of ${target}: no error shown within ${fail.ms} ms; the engine's start() can stay pending on a failed fetch, so watch fetch/resource errors (or add a timeout) and show the error state`)
  if (fail.outcome === 'error-shown' && opt.retry) {
    await run.page.unroute(match)
    const retry = run.page.locator(opt.retry).first()
    if (await retry.isVisible().catch(() => false)) {
      await retry.click()
      fail.retry = (await waitFor(run.page, () => ready(run.page), opt.timeout)) ? 'recovered' : 'no-ready-after-retry'
    } else fail.retry = 'no-retry-control'
    if (fail.retry !== 'recovered') problem('loading-and-failure', 'major', `failed fetch of ${target}: retry ${fail.retry}`)
  }
  if (!opt.error && fail.outcome === 'hung') fail.note = 'pass --error <selector> so the probe can see the error state'
  report.failures.push(fail)
  await run.ctx.close()
}

await browser.close()
if (server) server.close()
const text = JSON.stringify(report, null, 2) + '\n'
if (opt.out) writeFileSync(opt.out, text)
process.stdout.write(text)
process.exit(problems.length ? 1 : 0)
