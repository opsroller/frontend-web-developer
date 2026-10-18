*Reference, for people using the frontend-web-developer plugin who need the facts about one skill.*

# web-performance

| Field | Value |
|---|---|
| File | [`skills/web-performance/SKILL.md`](../../../skills/web-performance/SKILL.md) |
| Use when | Setting or checking performance budgets; diagnosing LCP, INP or CLS |
| Sections | Targets · Lab vs field · Method (LCP, INP, CLS) · Quality bar · Failure modes · Docs this work owes |

## Core Web Vitals (75th percentile of page loads)

| Metric | Good | Needs improvement | Poor |
|---|---|---|---|
| LCP | ≤ 2.5 s | 2.5–4.0 s | > 4.0 s |
| INP | ≤ 200 ms | 200–500 ms | > 500 ms |
| CLS | ≤ 0.1 | 0.1–0.25 | > 0.25 |

## Default landing-page budget (the project may override)

| Item | Limit |
|---|---|
| Total transfer | 500 KB |
| Critical-path HTML + CSS + JS (compressed) | 170 KB |
| Third-party origins | 3 |
| Lab LCP with mobile throttling | 2.5 s |

## Docs owed

Reference (budget values, where enforced); explanation for significant trade-offs.
