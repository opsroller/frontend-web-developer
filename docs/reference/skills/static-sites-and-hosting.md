*Reference, for people using the frontend-web-developer plugin who need the facts about one skill.*

# static-sites-and-hosting

| Field | Value |
|---|---|
| File | [`skills/static-sites-and-hosting/SKILL.md`](../../../skills/static-sites-and-hosting/SKILL.md) |
| Use when | Creating or restructuring a site, choosing how pages are built and served, setting up deployment and previews, configuring caching, redirects and security headers |
| Sections | Decide the shape · Build in layers · Structure the repository · Deploy · Configure the host · Quality bar · Failure modes · Docs this work owes |

## Rules it sets

- Semantic HTML first; CSS for layout; JavaScript as enhancement only.
- One command builds the site from a clean checkout; generator version pinned.
- Deploy from CI on merge to the default branch; preview per pull request; atomic deploys; rollback in one step.
- Fingerprinted assets: `Cache-Control: public, max-age=31536000, immutable`. HTML: short cache or `no-cache`. Never `no-store` on pages.
- Minimum headers: `Content-Security-Policy`, `X-Content-Type-Options: nosniff`, `Referrer-Policy: strict-origin-when-cross-origin`, `Permissions-Policy`, HSTS once HTTPS is stable.
- Permanent URLs; 301 redirect when a URL changes; `404.html` returns status 404.

## Docs owed

Reference (build command, output, host, headers, redirects); explanation of the hosting choices; how-to for deploy and rollback procedures.
