# WCAG 2.2 level A + AA checklist for websites

Reference for the `web-accessibility` skill. Criteria grouped by principle,
with a quick test for a static or marketing site. Wording paraphrased; the
normative text is at https://www.w3.org/TR/WCAG22/. 4.1.1 Parsing was
removed in 2.2. ★ = new in 2.2.

## Perceivable

| SC | Level | Quick test |
|---|---|---|
| 1.1.1 Non-text content | A | Informative images have purposeful alt; decorative `alt=""`; icon buttons named |
| 1.2.1–1.2.3 Audio/video prerecorded | A | Transcript for audio-only; captions and description/alternative for video |
| 1.2.4 Captions (live) | AA | Live streams captioned |
| 1.2.5 Audio description | AA | Trailers with visual-only information have description |
| 1.3.1 Info and relationships | A | Headings, lists, tables, labels in markup, not just looks |
| 1.3.2 Meaningful sequence | A | DOM order = reading order |
| 1.3.3 Sensory characteristics | A | Instructions not only "the round button on the right" |
| 1.3.4 Orientation | AA | Works in portrait and landscape |
| 1.3.5 Identify input purpose | AA | `autocomplete` on personal-data fields |
| 1.4.1 Use of colour | A | Links distinguishable without colour (underline) |
| 1.4.2 Audio control | A | Auto-playing audio > 3 s can be stopped |
| 1.4.3 Contrast (minimum) | AA | 4.5:1 text, 3:1 large text |
| 1.4.4 Resize text | AA | 200% text zoom, nothing lost |
| 1.4.5 Images of text | AA | Real text, not pictures of text (logos excepted) |
| 1.4.10 Reflow | AA | 320 CSS px wide, no 2-D scrolling |
| 1.4.11 Non-text contrast | AA | 3:1 for controls, focus rings, meaningful graphics |
| 1.4.12 Text spacing | AA | Line height 1.5, letter 0.12em, word 0.16em, paragraph 2em: no clipping |
| 1.4.13 Content on hover/focus | AA | Tooltips dismissible, hoverable, persistent |

## Operable

| SC | Level | Quick test |
|---|---|---|
| 2.1.1 Keyboard | A | Everything works by keyboard |
| 2.1.2 No keyboard trap | A | Can always Tab/Escape out (canvas, iframes, modals) |
| 2.1.4 Character key shortcuts | A | Single-key shortcuts can be turned off or remapped |
| 2.2.1 Timing adjustable | A | No time limits, or adjustable |
| 2.2.2 Pause, stop, hide | A | Carousels, auto-moving content can pause |
| 2.3.1 Three flashes | A | Nothing flashes > 3 per second |
| 2.4.1 Bypass blocks | A | Skip link or landmarks |
| 2.4.2 Page titled | A | Unique descriptive `<title>` |
| 2.4.3 Focus order | A | Logical order; modals move and return focus |
| 2.4.4 Link purpose | A | Link text makes sense in context |
| 2.4.5 Multiple ways | AA | Navigation plus sitemap or search |
| 2.4.6 Headings and labels | AA | Descriptive |
| 2.4.7 Focus visible | AA | Always visible |
| 2.4.11 Focus not obscured (minimum) ★ | AA | Focused element not fully hidden by sticky header, banner or chat widget |
| 2.5.1 Pointer gestures | A | Multi-point/path gestures have single-tap alternative |
| 2.5.2 Pointer cancellation | A | Actions fire on up-event |
| 2.5.3 Label in name | A | Accessible name contains visible label text |
| 2.5.4 Motion actuation | A | Shake/tilt has alternative and can be disabled |
| 2.5.7 Dragging movements ★ | AA | Drag has single-pointer alternative |
| 2.5.8 Target size (minimum) ★ | AA | ≥ 24×24 CSS px or spaced so 24 px circles don't overlap |

## Understandable

| SC | Level | Quick test |
|---|---|---|
| 3.1.1 Language of page | A | `<html lang>` |
| 3.1.2 Language of parts | AA | `lang` on passages in other languages |
| 3.2.1 On focus / 3.2.2 On input | A | No surprise navigation or submission |
| 3.2.3 Consistent navigation | AA | Same order on every page |
| 3.2.4 Consistent identification | AA | Same function, same name |
| 3.2.6 Consistent help ★ | A | Help/contact in same relative place on each page |
| 3.3.1 Error identification | A | Errors described in text |
| 3.3.2 Labels or instructions | A | Every input labelled |
| 3.3.3 Error suggestion | AA | Say how to fix |
| 3.3.4 Error prevention | AA | Review/undo for legal or financial submissions |
| 3.3.7 Redundant entry ★ | A | Don't ask again for data already given in the flow |
| 3.3.8 Accessible authentication (minimum) ★ | AA | No memory/puzzle test to log in; allow paste and password managers |

## Robust

| SC | Level | Quick test |
|---|---|---|
| 4.1.2 Name, role, value | A | Custom controls expose name, role, state |
| 4.1.3 Status messages | AA | Progress, results, errors announced via live regions |
