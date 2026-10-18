*Reference, for people using the frontend-web-developer plugin who need the facts about one skill.*

# embedding-web-builds

| Field | Value |
|---|---|
| File | [`skills/embedding-web-builds/SKILL.md`](../../../skills/embedding-web-builds/SKILL.md) |
| Use when | Putting an interactive web build (e.g. WebAssembly) on a page, hosting its files, loading it, and connecting to its events |
| Sections | Agree the event contract · Choose the bridge · Host the files · Load it like a product · Be a good guest · Audit a build that is not deployed yet · Quality bar · Failure modes · Docs this work owes |

## Event contract format

| Direction | Name | Payload | When |
|---|---|---|---|
| build → page | `ready`, `progress`, `error`, product events | JSON | as emitted |
| page → build | commands such as `pause`, `resume` | JSON | on page events |

Unknown events are ignored, never fatal.

## Bridges

| Embedding | Mechanism |
|---|---|
| Same document | `CustomEvent` from the build; page calls a documented exported function |
| `<iframe>` | `postMessage` with explicit `targetOrigin`; receiver checks `event.origin`, `event.source` and payload shape |

## Hosting requirements

| Item | Value |
|---|---|
| `.wasm` MIME type | `application/wasm` |
| Pre-compressed files | matching `Content-Encoding` header |
| Threads (`SharedArrayBuffer`) | `Cross-Origin-Opener-Policy: same-origin` and `Cross-Origin-Embedder-Policy: require-corp` (or `credentialless`), on the build page only |
| CSP | `'wasm-unsafe-eval'` in `script-src` on the build page if compilation needs it |

## Failure modes it names

| Failure | Sign |
|---|---|
| `.wasm` with the wrong MIME type, or pre-compressed without `Content-Encoding` | slow or failed load |
| COOP/COEP site-wide | embeds and images break elsewhere |
| `postMessage(msg, "*")`, listeners trusting any origin | other origins can drive the build |
| Auto-loading the build on the landing page | landing page Core Web Vitals drop |
| Infinite spinner, keyboard trapped in the canvas | no error state, WCAG 2.1.2 failure |
| Canvas backing store not sized when the page owns layout | blurry 300x150 canvas |
| Downloads that bypass the engine's progress API | progress complete while bytes still arrive |
| Engine `start()` pending on a failed fetch | page waits forever, no error |
| Retry that reuses the failed request, promise or stream; unchecked status or swallowed body error | a one-time failure never recovers, or the build starts on an error page or partial bytes |

## Undeployed builds

Audited with [`tools/preview-probe.mjs`](../tools/preview-probe.md) against
the locally served site; deployed headers confirmed with `curl -sI` once a
URL exists.

## Docs owed

Reference (contract, headers, files); explanation (bridge and click-to-load choices); how-to for updating the build.
