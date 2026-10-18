*How-to guide, for people already using the frontend-web-developer plugin who need to check a website before a release or launch.*

# How to audit a site before a release

This guide shows you how to audit the site and act on the result. See the
[site-audit reference](../reference/workflows/site-audit.md) for the output
fields.

1. Deploy a preview of the release candidate, or build it locally.
2. Run `/frontend-web-developer:site-audit` with
   `{ "site": "<preview URL or build path>" }`. Add `"pages"` to limit the
   audit to certain pages.
3. If `not_checked` is not empty, re-run; those dimensions were not audited
   and are not passing.
4. Fix every `blocker` before release. Turn `major` items into work
   packages through the project-manager; `minor` items go in the backlog.
5. For a launch or a major redesign, also book screen-reader testing on real
   devices (see the [web-accessibility reference](../reference/skills/web-accessibility.md)
   for the minimum set) and, if possible, testing with disabled users.
6. Re-run the audit after fixes; the status page in the project docs updates
   with it.
