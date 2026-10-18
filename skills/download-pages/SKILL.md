---
name: download-pages
description: Use when building a download or store-links page for an app or game.
---

# Download pages

- Detect platform from the user agent (and `navigator.userAgentData`
  where available) only to choose the primary button; always list all
  platforms below it, so detection errors never block anyone.
- Desktop: link release assets by stable URL (latest release),
  showing version, size and checksum.
- Mobile: official store badges used per each store's brand
  guidelines, linking to the store listing.
- Generate links from release data at build time; never hand-edit
  version numbers.
