*Reference, for people using the frontend-web-developer plugin who need the facts about one skill.*

# privacy-respecting-analytics

| Field | Value |
|---|---|
| File | [`skills/privacy-respecting-analytics/SKILL.md`](../../../skills/privacy-respecting-analytics/SKILL.md) |
| Use when | Measuring traffic, downloads or field Core Web Vitals; adding any third-party script, embed or font |
| Default | No analytics until the owner approves a tool |
| Sections | Start from the question · Data-minimal kind · Consent and law · Implement · Keep everything else first-party · Quality bar · Failure modes · Docs this work owes |

## Required properties of an analytics tool

No cookies or device storage identifiers; no stored personal data; no cross-site or cross-day tracking; aggregate data only; owner-approved hosting; small deferred script; production only.

## Example events

| Event | Properties |
|---|---|
| `download` | `platform` |
| `store_click` | `store` |
| `build_loaded` | none |
| web vitals | `LCP`, `INP`, `CLS` values |

No free text or identifiers in properties or URLs.

## Docs owed

Reference (events, tool, retention, privacy note); explanation of the measurement decision.
