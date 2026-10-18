// SPDX-License-Identifier: GPL-2.0-or-later
// Self-test for tools/preview-probe.mjs: builds two throwaway sites, one that
// embeds a fake build well and one with the classic failure modes, probes
// both and checks the probe tells them apart. Needs Playwright with Chromium.
// Usage: node tools/test-preview-probe.mjs
import { mkdtempSync, mkdirSync, rmSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { spawnSync } from 'node:child_process'

const probe = join(dirname(fileURLToPath(import.meta.url)), 'preview-probe.mjs')
const dir = mkdtempSync(join(tmpdir(), 'preview-probe-'))
const write = (rel, body) => { mkdirSync(dirname(join(dir, rel)), { recursive: true }); writeFileSync(join(dir, rel), body) }

// kind: good, bad (classic failure modes), trap (good loading, but the canvas
// is not autofocused and swallows Tab and the release key).
const page = (kind) => { const good = kind !== 'bad'; return `<!doctype html><meta charset="utf-8"><title>play</title>
<style>#stage{width:100%;aspect-ratio:16/9}canvas{width:100%;height:100%;display:block}</style>
<button id="play">Play in browser</button> <a href="#help">Controls</a>
<progress id="bar" value="0" max="1"></progress>
<div id="error" hidden>Could not load. <button id="retry">Retry</button></div>
<div id="stage"><canvas ${good ? 'tabindex="0" aria-label="Game: press Escape to release keyboard"' : ''}></canvas></div>
<script>
const canvas = document.querySelector('canvas'), bar = document.getElementById('bar'), err = document.getElementById('error')
const size = () => { const r = canvas.getBoundingClientRect(); canvas.width = Math.round(r.width * devicePixelRatio); canvas.height = Math.round(r.height * devicePixelRatio) }
async function start () {
  err.hidden = true
  ${good
    ? `try {
    for (const [i, f] of ['build/app.wasm', 'build/app.pck', 'build/extra.bin'].entries()) { const r = await fetch(f); if (!r.ok) throw new Error(f); await r.arrayBuffer(); bar.value = (i + 1) / 3 }
  } catch (e) { err.hidden = false; return }
  size(); new ResizeObserver(size).observe(canvas)
  ${kind === 'trap'
    ? "canvas.addEventListener('keydown', (e) => { if (e.key === 'Tab' || e.key === 'Escape') e.preventDefault() })"
    : "canvas.addEventListener('keydown', (e) => { if (e.key === 'Escape') canvas.blur() }); canvas.focus()"}`
    : `// Engine-style start(): a failed fetch rejects nothing the page waits on.
  await new Promise((done) => { Promise.all(['build/app.wasm', 'build/app.pck'].map((f) => fetch(f).then((r) => r.arrayBuffer()))).then(done, () => {}) })
  bar.value = 1
  await fetch('build/extra.bin').then((r) => r.arrayBuffer())`}
  window.dispatchEvent(new CustomEvent('app:ready', { detail: { v: 1 } }))
}
document.getElementById('play').onclick = start
document.getElementById('retry').onclick = start
</script>` }
for (const kind of ['good', 'bad', 'trap']) {
  write(`${kind}/play/index.html`, page(kind))
  write(`${kind}/play/build/app.wasm`, Buffer.from([0, 97, 115, 109, 1, 0, 0, 0]))
  write(`${kind}/play/build/app.pck`, Buffer.alloc(4096, 1))
  write(`${kind}/play/build/extra.bin`, Buffer.alloc(300 * 1024, 2))
}

const run = (kind, extra = []) => {
  const r = spawnSync(process.execPath, [probe, '--root', join(dir, kind), '--page', '/play/', '--play', '#play', '--ready', 'app:ready',
    '--error', '#error', '--retry', '#retry', '--progress', '#bar', '--release-key', 'Escape', '--timeout', '4000', ...extra], { encoding: 'utf8' })
  if (r.status === 2) { console.error(r.stderr); process.exit(2) }
  return { code: r.status, report: JSON.parse(r.stdout) }
}
let failed = 0
const expect = (cond, what) => { console.log(`${cond ? 'ok' : 'FAIL'} ${what}`); if (!cond) failed++ }

const good = run('good')
expect(good.code === 0, `good site: no problems (got ${JSON.stringify(good.report.problems)})`)
expect(good.report.before_click.urls.every((u) => !u.includes('/build/')), 'good site: no build bytes before the click')
expect(good.report.failures.length === 3 && good.report.failures.every((f) => f.outcome === 'error-shown' && f.retry === 'recovered'), 'good site: each failed fetch shows the error and retry recovers')
expect(good.report.headers.some((h) => h.url.endsWith('.wasm') && h['content-type'] === 'application/wasm'), 'good site: .wasm served as application/wasm')

const bad = run('bad')
const has = (check, text) => bad.report.problems.some((p) => p.check === check && p.detail.includes(text))
expect(bad.code === 1, 'bad site: exits 1')
expect(has('canvas', '300x150'), 'bad site: default 300x150 backing store found')
expect(has('loading-and-failure', 'no error shown'), 'bad site: start() left pending on a failed fetch found')
expect(has('loading', 'bypass'), 'bad site: download outside the progress display found')
expect(has('accessibility', 'not focusable'), 'bad site: unfocusable canvas found')

const trap = run('trap', ['--fail', 'none'])
expect(trap.report.focus.focused_for_release_check === true, 'trap site: probe focuses the canvas before the release-key check')
expect(trap.report.problems.some((p) => p.check === 'accessibility' && p.detail.includes('keyboard trap')), 'trap site: keyboard trap found on a canvas that is not autofocused')

if (!process.env.KEEP) rmSync(dir, { recursive: true, force: true })
else console.log(`fixtures kept in ${dir}`)
console.log(failed ? `${failed} check(s) failed` : 'all checks passed')
process.exit(failed ? 1 : 0)
