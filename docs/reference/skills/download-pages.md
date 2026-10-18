*Reference, for people using the frontend-web-developer plugin who need the facts about one skill.*

# download-pages

| Field | Value |
|---|---|
| File | [`skills/download-pages/SKILL.md`](../../../skills/download-pages/SKILL.md) |
| Use when | Building or changing a landing or download page: platform detection, platform list, release links, store badges, versions, sizes, checksums |
| Sections | Golden rule · Gather the data · Lay out the page · Detect the platform · Store badges · Make the buttons good controls · Quality bar · Failure modes · Docs this work owes |

## Rules it sets

- Platform detection only picks the primary button. It never hides the other platforms. Without JavaScript the full list shows with no guess.
- Versions, URLs, sizes and SHA-256 checksums are generated from the release data at build time.
- Detection order: `navigator.userAgentData.platform`, then user-agent tokens (`Android` before `Linux`). "Mac" with `navigator.maxTouchPoints > 1` is treated as iPad. Unknown gives no guess.
- Store badges: official artwork only, unmodified, localized where available. App Store badge at least 40 px high on screen; Google Play badge at least 28 px high and not smaller than other badges beside it; clear space a quarter of badge height.
- Download controls are `<a href>` links with an accessible name naming platform, version and size.

## Docs owed

Reference (data source, platform keys, detection rules); how-to for adding a platform; explanation for link-strategy choices.
