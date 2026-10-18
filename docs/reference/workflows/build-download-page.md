*Reference, for people running the frontend-web-developer plugin's workflows who need the exact inputs and outputs.*

# build-download-page

| Field | Value |
|---|---|
| File | [`workflows/build-download-page.js`](../../../workflows/build-download-page.js) |
| Invoke | `/frontend-web-developer:build-download-page` |
| Purpose | Build or update a landing/download page from release data, verify, fix, document |
| Skills used | `download-pages`, `web-accessibility`, `web-performance`, `seo-and-metadata` |

## Arguments

| Arg | Required | Type | Example |
|---|---|---|---|
| `releaseData` | yes | string: path or URL of the release manifest or API | `"data/releases.json"` |
| `page` | no (default `/download/`) | string | `"/download/"` |
| `platforms` | no (default: all in release data) | string array | `["windows", "macos", "linux", "android", "ios"]` |

Missing `releaseData` returns the usage string.

## Phases

| Phase | Agents | Does |
|---|---|---|
| Plan | 1 | Platform fields, missing data, files, detection test table, doc pages via the compass |
| Build | 1 | Sole editor: page, detection function and its unit test, badges; commits |
| Verify | 4 in parallel, read-only | detection, links-and-data, accessibility, performance-seo |
| Fix | 1 per round, at most 2 rounds | Fixes blocker and major issues, then Verify re-runs |
| Docs | 1 | Writes the planned pages in the same branch |
| Docs check | 1 | One kind per page, titles, links |

A checker that fails is recorded as a blocker ("check did not run"), so the page is never shipped unverified.

## Output

| `status` | Fields |
|---|---|
| `ready` | `page`, `built`, `minor_issues`, `missing_data`, `docs`, `docs_check` |
| `blocked` | `page`, `open_items` (blocker/major issues after the last round) or `reason`, `minor` |
| string | Usage, or a planning/build failure message |

## Run modes

Run modes v2. Besides its own args, the workflow takes the optional `run` arg defined in the engineering-practices
[workflow run modes reference](https://github.com/opsroller/engineering-practices/blob/main/docs/reference/workflow-run-modes.md):
`run: { mode: "inline" }` runs every phase in the calling session with no subagents, `run.only` runs chosen phases or steps,
and `run.from` with `run.results` resumes a stopped run. Without `run`, the workflow and its outputs are as above.
See [how to run a workflow inline](https://github.com/opsroller/engineering-practices/blob/main/docs/how-to/how-to-run-a-workflow-inline.md).

Step labels, for `run.only` and `run.results`: `plan`, `build`, `<check>#<round>` (`detection`, `links-and-data`, `accessibility`, `performance-seo`), `fix#<round>`, `docs`, `docs-check`, `docs-fix` and `docs-recheck` (when the docs check finds problems).

Independent steps: `<check>#<round>`, `docs-check`, `docs-recheck`. They review work this run produced, so in inline mode send each to a reviewer with no part in the work and name them in `run.reviewers`; a step you answer yourself is reported in `self_reviewed`.
