*Reference, for people checking an embedded web build in a browser, before or after it is deployed.*

# preview-probe

| Field | Value |
|---|---|
| File | [`tools/preview-probe.mjs`](../../../tools/preview-probe.mjs) |
| Self-test | [`tools/test-preview-probe.mjs`](../../../tools/test-preview-probe.mjs) (`node tools/test-preview-probe.mjs`) |
| Needs | Node 18+, Playwright (`playwright` or `@playwright/test`, found from the current directory, each `NODE_PATH` entry, or the global modules) with the browser to run. A scratch install (`npm install --no-save playwright` in a scratch directory) is found with `NODE_PATH=<scratch>/node_modules`, or by running the probe from that directory with absolute `--root` and `--out` paths |
| Used by | `embed-web-build` (Preview phase), `site-audit` (embedded-build dimension), the [embedding-web-builds](../skills/embedding-web-builds.md) skill |
| Exit code | 0 no problems; 1 problems found (listed in the report); 2 usage error or Playwright missing |

## Usage

```
node tools/preview-probe.mjs --root <built site dir> --page /play/ [options]
node tools/preview-probe.mjs --url <deployed page URL> [options]
node tools/preview-probe.mjs --root <built site dir> --serve-only [--port 8080]
```

## Options

| Option | Default | Meaning |
|---|---|---|
| `--root <dir>` | | Serve this directory on `127.0.0.1` (one of `--root`, `--url`) |
| `--page <path>` | `/` | Page to open on the local server |
| `--url <URL>` | | Probe a deployed or preview URL instead of serving |
| `--play <selector>` | none | Control to click to start the build |
| `--ready <event>` | none | Event name the build dispatches on `window` or `document` when ready |
| `--ready-js <expression>` | none | Page expression that is truthy when ready, instead of `--ready` |
| `--error <selector>` | none | Error element that must become visible after a failed fetch |
| `--retry <selector>` | none | Retry control; clicked with the failure removed, must reach ready |
| `--progress <selector>` | none | `<progress>` or ARIA progressbar the page updates while loading |
| `--canvas <selector>` | `canvas` | The build's canvas, in the page or an iframe |
| `--release-key <key>` | none | Key that releases keyboard focus from the canvas (e.g. `Escape`) |
| `--header '<glob>\|<Name>: <value>'` | none | Header the local server adds on matching paths; repeatable |
| `--headers-file <file>` | none | Netlify/Cloudflare-style `_headers` file the local server applies |
| `--fail auto\|none\|<parts>` | `auto` | Files to fail one at a time: every first-party file fetched after the click, none, or a comma list of URL parts |
| `--flaky auto\|none\|<parts>` | `auto` | Files to fail once each (then serve normally), same choices as `--fail` |
| `--flaky-modes <modes>` | `abort,503,truncate` | How the first request fails: `abort` (network error), `503` (error response), `truncate` (full headers, half the body, then the connection drops; needs `--root`) |
| `--build-pattern <regex>` | `\.(wasm\|pck\|data\|bin)(\?\|$)` | URLs that count as build bytes for the before-click check |
| `--viewport <w>x<h>[@<dpr>]` | `1280x720@2`, `390x844` | Viewports for the canvas check; the first sets the DPR, later ones resize the same page |
| `--browser <name>` | `chromium` | `chromium`, `firefox` or `webkit` |
| `--timeout <ms>` | `30000` | Wait for ready; a failed-fetch or fail-once run waits at most 15 s for ready or the error |
| `--out <file>` | none | Also write the report to this file |
| `--port <n>` | random | Port for the local server |
| `--serve-only` | | Only serve `--root` until stopped |

The local server serves `.wasm` as `application/wasm`, serves a missing
file's `.br` or `.gz` sibling with `Content-Encoding`, and sends
`Cache-Control: no-store`. It shows what the page does with the given
headers, not what the host sends.

## Checks

| Check | Problem when |
|---|---|
| `performance` | build bytes (`--build-pattern`) load before the click; layout shift above 0.1 by ready |
| `loading` | play control missing; no ready signal before the timeout; a build file returns 4xx/5xx; progress never changes; a download over 100 KB finishes after progress shows complete |
| `hosting-headers` | a `.wasm` file is not served as `application/wasm` |
| `canvas` | backing store is the 300x150 default, or differs from CSS size x DPR by more than 5% (major above 25%) at a viewport |
| `accessibility` | canvas not focusable or unnamed; with `--release-key`, the probe focuses the canvas first, then the release key then Tab must move focus off it (problem if focus stays, or if the canvas cannot be focused) |
| `loading-and-failure` | a failed fetch shows no error within the wait (start() left pending); retry missing or does not reach ready; after a one-time failure of a file: no ready and no error (blocker), ready with only the failed response so the page used it as the file, or retry does not reach ready although the file now serves (the report says when retry never requested it again) |

## Report

JSON on stdout: `url`, `served_from`, `browser`, `viewports`,
`before_click` (requests, bytes, urls), `start` (ready, ms, detail, files
with status, type and encoding, console and page errors, cls, progress),
`canvas` (per viewport: backing store, CSS size, DPR, frame), `focus`,
`failures` (per file: outcome `error-shown`, `ready-anyway`, `hung` or
`no-play-control`, ms, retry), `partial_failures` (per file and mode:
outcome `recovered` (the page's own retry), `recovered-after-retry`,
`ready-on-bad-data`, `retry-failed`, `hung`, `error-shown` (no `--retry`
given), `no-retry-control`, `no-play-control` or `skipped`, ms, requests
for the file, `refetched` after the retry click, note), `headers` (per build file: content type,
encoding, COOP, COEP), `cross_origin_isolated`, `problems` (check,
severity, detail).
