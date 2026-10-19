---
name: web-accessibility
description: 'Use when building, changing or auditing any web page for accessibility: meeting WCAG 2.2 level AA, testing with keyboard, zoom and screen readers, and writing up issues with who they affect.'
---

# Web accessibility (WCAG 2.2 AA)

Level AA of WCAG 2.2 is the floor, not the goal. Automated tools find only
part of the problems; most need a human with a keyboard, a zoomed browser
and a screen reader. Full criterion list with tests: [checklist.md](checklist.md).

## 1. Build it right (prevention beats audit)

- **Native HTML first.** `<button>` for actions, `<a href>` for navigation,
  `<label for>` on every input, `<table>` for tables. First rule of ARIA: do
  not use ARIA when a native element does the job; wrong ARIA is worse than
  none.
- **Structure:** one `h1`, headings in order, landmarks, `lang` set, a "Skip
  to main content" link, unique descriptive `<title>`.
- **Text alternatives:** meaningful `alt` for informative images, `alt=""`
  for decorative ones; captions for video with speech; transcripts for
  audio.
- **Colour:** text contrast 4.5:1 (3:1 for large text ≥ 24 px or 19 px bold);
  UI components and focus indicators 3:1; never colour alone for meaning.
- **Focus:** visible on everything interactive (do not remove `outline`
  without a better replacement); never hidden behind sticky headers or
  cookie bars (2.4.11, new in 2.2; use `scroll-padding-top`).
- **Targets:** at least 24×24 CSS px or enough spacing (2.5.8, new in 2.2).
- **Dragging:** any drag action has a single-pointer alternative (2.5.7).
- **Reflow and zoom:** works at 320 CSS px width and 400% zoom without
  horizontal scrolling; text resizes to 200%; text spacing overrides don't
  break layout.
- **Motion:** honour `prefers-reduced-motion`; nothing flashes more than 3
  times a second; auto-playing media can be paused.
- **Forms:** labels, instructions, errors in text next to the field and
  announced; don't make users re-enter information (3.3.7); no cognitive
  tests to log in (3.3.8).
- **Consistent help:** contact/help links in the same place on every page
  (3.2.6).

## 2. Test in three passes

**Pass 1 — automated (minutes).** Run an engine such as axe or a
Lighthouse accessibility audit on every page template and in CI. Fix every
violation; treat a clean result as "no obvious errors", not "accessible".

**Pass 2 — manual (per page template).**
1. Keyboard only: Tab through everything; order follows reading order;
   focus always visible and never obscured; Enter/Space activate; Escape
   closes overlays; no trap (including embedded builds).
2. Zoom 400% and 320 CSS px width: no lost content or horizontal scroll.
3. Contrast of text, icons, focus rings, badge backgrounds.
4. Images: alt text describes purpose; link text makes sense out of context.
5. Forms: every control has a visible label tied to it; errors announced.
6. Reduced motion and dark mode (if supported) behave.

**Pass 3 — assistive technology (before release and for new patterns).**
Minimum set to rotate through: NVDA with Firefox or Chrome, VoiceOver on
macOS Safari, VoiceOver on iOS Safari, TalkBack on Android Chrome, plus
browser zoom/magnifier. Read the page by headings and landmarks, operate
every control, complete every form. Add speech-recognition testing for
interactive pages where possible. Real disabled users find what you cannot;
recommend user research or a formal audit for major launches.

## 3. Report issues usefully

For each issue: page/URL, element, WCAG criterion and level, who is
affected (e.g. "screen-reader users cannot tell which platform a button
downloads"), steps to reproduce, browser/AT/OS versions, severity
(blocker: task impossible; major: task hard; minor: annoyance), and the
fix. Before filing, confirm it is not your own test error or a known AT bug.

## Quality bar

- Zero automated violations; all manual checks pass; AT pass done for new
  templates and before release.
- If the project publishes an accessibility statement, it states the
  standard (WCAG 2.2 AA), known exceptions and a contact.

## Failure modes

- "Lighthouse says 100" treated as done.
- `div` with click handlers instead of buttons; ARIA roles sprinkled on.
- Focus ring removed for looks; sticky header covering the focused link.
- Icon-only buttons with no accessible name; "Click here" links.
- Canvas or embedded build that traps the keyboard.

## Docs this work owes

- **Reference:** the accessibility statement or conformance notes, the
  test matrix (pages × AT × result).
- **How-to:** "How to test a page with a screen reader" if the project
  lacks one.
- **Explanation** for any deliberate exception and its reasoning.
