*Reference, for people running the frontend-web-developer plugin's workflows who need the exact inputs and outputs.*

# site-audit

| Field | Value |
|---|---|
| File | [`workflows/site-audit.js`](../../../workflows/site-audit.js) |
| Invoke | `/frontend-web-developer:site-audit` |
| Purpose | Parallel audit of a website, a prioritised fix list, and the results recorded in the project docs |
| Edits site files | No (audit agents are read-only); writes doc pages only |

## Arguments

| Arg | Required | Type | Example |
|---|---|---|---|
| `site` | yes | string: local build path or URL | `"https://preview.example.org"` |
| `pages` | no | string array | `["/", "/download/", "/credits/"]` |

Missing `site` returns the usage string.

## Phases

| Phase | Agents | Does |
|---|---|---|
| Plan | 1 | Lists pages, detects download page and embedded build, plans doc pages with the compass |
| Audit | 6 to 8 in parallel | accessibility, performance, seo-metadata, hosting, licensing, privacy; plus downloads and embedded-build when present |
| Fix list | 1 | Merges, deduplicates, orders by severity and visitors affected |
| Docs | 1 | Writes the planned Diataxis pages (audit status is reference) |
| Docs check | 1 | One kind per page, title patterns, links |

## Output

| Field | Content |
|---|---|
| `status` | `complete`, or `partial` when an auditor failed; `incomplete` if fix list or docs failed |
| `not_checked` | Dimensions whose auditor failed (never reported as passing) |
| `fix_list` | Markdown table: where, problem, who affected, standard, severity, fix |
| `docs` | Pages touched and anything left undocumented |
| `docs_check` | Reviewer report, or `docs check failed: pages unverified` |

Severity: `blocker` (task impossible, or legal/security duty unmet), `major`, `minor`.

## Run modes

Run modes v2. Besides its own args, the workflow takes the optional `run` arg defined in the engineering-practices
[workflow run modes reference](https://github.com/opsroller/engineering-practices/blob/main/docs/reference/workflow-run-modes.md):
`run: { mode: "inline" }` runs every phase in the calling session with no subagents, `run.only` runs chosen phases or steps,
and `run.from` with `run.results` resumes a stopped run. Without `run`, the workflow and its outputs are as above.
See [how to run a workflow inline](https://github.com/opsroller/engineering-practices/blob/main/docs/how-to/how-to-run-a-workflow-inline.md).

Step labels, for `run.only` and `run.results`: `plan`, one per dimension (`accessibility`, `performance`, `seo-metadata`, `hosting`, `licensing`, `privacy`, `downloads`, `embedded-build`), `fix-list`, `docs`, `docs-check`, `docs-fix` and `docs-recheck` (when the docs check finds problems).

Independent steps: `docs-check`, `docs-recheck`. They review work this run produced, so in inline mode send each to a reviewer with no part in the work and name them in `run.reviewers`; a step you answer yourself is reported in `self_reviewed`.
