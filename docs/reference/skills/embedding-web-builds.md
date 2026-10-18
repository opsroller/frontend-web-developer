*Reference, for people using the frontend-web-developer plugin who need the facts about one skill.*

# embedding-web-builds

| Field | Value |
|---|---|
| File | [`skills/embedding-web-builds/SKILL.md`](../../../skills/embedding-web-builds/SKILL.md) |
| Use when | Putting an interactive web build (e.g. WebAssembly) on a page, hosting its files, loading it, and connecting to its events |
| Sections | Agree the event contract · Choose the bridge · Host the files · Load it like a product · Be a good guest · Quality bar · Failure modes · Docs this work owes |

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

## Docs owed

Reference (contract, headers, files); explanation (bridge and click-to-load choices); how-to for updating the build.
