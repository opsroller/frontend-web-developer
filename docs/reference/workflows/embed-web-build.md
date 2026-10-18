*Reference, for people running the frontend-web-developer plugin's workflows who need the exact inputs and outputs.*

# embed-web-build

| Field | Value |
|---|---|
| File | [`workflows/embed-web-build.js`](../../../workflows/embed-web-build.js) |
| Invoke | `/frontend-web-developer:embed-web-build` |
| Purpose | Host and embed an interactive web build with an event bridge, verify, fix, document |
| Skills used | `embedding-web-builds`, `static-sites-and-hosting`, `web-accessibility`, `web-performance` |

## Arguments

| Arg | Required | Type | Example |
|---|---|---|---|
| `build` | yes | string: path to the web build output | `"dist/web"` |
| `page` | yes | string: site path of the hosting page | `"/play/"` |
| `contract` | no | string: path to an existing event contract doc | `"docs/reference/web-build-events.md"` |

Missing `build` or `page` returns the usage string.

## Phases

| Phase | Agents | Does |
|---|---|---|
| Plan | 1 | Build file inventory (size, MIME, encoding), isolation need, bridge choice, event contract, questions for the build's owner, doc pages via the compass |
| Build | 1 | Sole editor: host headers for the build page only, page, bridge; commits |
| Verify | 5 in parallel, read-only | hosting-headers, loading-and-failure, contract, accessibility, performance |
| Fix | 1 per round, at most 2 rounds | Fixes blocker and major issues; problems inside the build go to its owner as requests |
| Docs | 1 | Contract and headers (reference), bridge reasoning (explanation), update procedure (how-to) |
| Docs check | 1 | One kind per page, titles, links |
| Handoff | 1 | Commits and pushes the host config, page, bridge and docs on a feature branch, runs the site checks on the pushed head; never opens or merges a PR |

## Output

| `status` | Fields |
|---|---|
| `ready` | `page`, `bridge`, `built`, `minor_issues`, `questions_for_build_owner`, `docs` (`pages`, `undocumented`), `docs_check`, `handoff`, `next` |
| `blocked` | `open_items` or `reason`, `minor`, `questions_for_build_owner`; `reason` also names a handoff that returned no branch or checks that fail on the pushed head |
| string | Usage, or a planning/build failure message |

## Handoff

`handoff` is the object engineering-practices
[deliver-package](https://github.com/opsroller/engineering-practices/blob/main/docs/reference/workflow-deliver-package.md)
takes as `prior`, so pass the whole result and the embed ships without
being built again: `from` (`frontend-web-developer:embed-web-build`), `branch`,
`pr`, `head_sha`, `tests_pass`, `docs`, `undocumented`, `notes` (open questions for the build owner).
The Handoff phase commits and pushes on a feature branch and runs the
project's checks on the pushed head; it never opens or merges a PR. With
no work package, land the branch with land-pr instead; `next` names both.

## Run modes

Run modes v2. Besides its own args, the workflow takes the optional `run` arg defined in the engineering-practices
[workflow run modes reference](https://github.com/opsroller/engineering-practices/blob/main/docs/reference/workflow-run-modes.md):
`run: { mode: "inline" }` runs every phase in the calling session with no subagents, `run.only` runs chosen phases or steps,
and `run.from` with `run.results` resumes a stopped run. Without `run`, the workflow and its outputs are as above.
See [how to run a workflow inline](https://github.com/opsroller/engineering-practices/blob/main/docs/how-to/how-to-run-a-workflow-inline.md).

Step labels, for `run.only` and `run.results`: `plan`, `build`, `<check>#<round>` (`hosting-headers`, `loading-and-failure`, `contract`, `accessibility`, `performance`), `fix#<round>`, `docs`, `docs-check`, `docs-fix` and `docs-recheck` (when the docs check finds problems), `handoff`.

Independent steps: `<check>#<round>`, `docs-check`, `docs-recheck`. They review work this run produced, so in inline mode send each to a reviewer with no part in the work and name them in `run.reviewers`; a step you answer yourself is reported in `self_reviewed`.
