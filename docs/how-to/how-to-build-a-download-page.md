*How-to guide, for people already using the frontend-web-developer plugin who need to ship or update a download page.*

# How to build or update a download page

This guide shows you how to get a download page built from your release
data and verified. For field and argument lists see the
[build-download-page reference](../reference/workflows/build-download-page.md).

1. Make sure the project's `CLAUDE.md` or profile names where the release
   data lives (a manifest file, a release API URL) and where the site and
   docs live.
2. If store listings exist, put their URLs in the release data or the
   profile. If badge artwork is not in the repository, ask the
   graphic-designer for the current official files.
3. Run `/frontend-web-developer:build-download-page` with
   `{ "releaseData": "<path or URL>" }`. Add `"page"` if the page is not
   `/download/`, and `"platforms"` to limit which platforms appear.
4. Read the result:
   - `status: "ready"`: open the preview and check the primary button on
     your own device, then open the PR.
   - `status: "blocked"`: work through `open_items`. Data problems
     (missing checksums, sizes) go to the devops-engineer; then run again.
   - `missing_data` not empty: the page shows what exists; ask for the rest.
5. If the project adds a platform later, add it to the release data and run
   the workflow again; do not edit the page by hand.
6. After merge, check the deployed page with JavaScript off: every platform
   must be listed.
