*Reference, for people using the frontend-web-developer plugin who need the facts about one skill.*

# web-accessibility

| Field | Value |
|---|---|
| Files | [`skills/web-accessibility/SKILL.md`](../../../skills/web-accessibility/SKILL.md), [`checklist.md`](../../../skills/web-accessibility/checklist.md) (WCAG 2.2 A + AA criteria with quick tests) |
| Use when | Building, changing or auditing any page for accessibility |
| Standard | WCAG 2.2 level AA (4.1.1 Parsing removed in 2.2) |
| Sections | Build it right · Test in three passes · Report issues usefully · Quality bar · Failure modes · Docs this work owes |

## Key thresholds

| Item | Value |
|---|---|
| Text contrast | 4.5:1; large text 3:1 |
| UI components, focus indicator | 3:1 |
| Target size (2.5.8) | 24×24 CSS px or equivalent spacing |
| Reflow | 320 CSS px width, 400% zoom |
| Text resize | 200% |
| Flashing | no more than 3 per second |

## Test passes

1. Automated engine (e.g. axe) in CI.
2. Manual: keyboard, zoom and reflow, contrast, alt text, forms, reduced motion.
3. Assistive technology: NVDA + Firefox or Chrome, VoiceOver macOS Safari, VoiceOver iOS Safari, TalkBack Android Chrome, magnifier.

## Issue record fields

URL, element, criterion and level, who is affected, steps, browser/AT/OS versions, severity (blocker, major, minor), fix.

## Docs owed

Reference (statement, test matrix); how-to for screen-reader testing if missing; explanation for any deliberate exception.
