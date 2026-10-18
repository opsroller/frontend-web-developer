*Reference, for people using the frontend-web-developer plugin who need the facts about its agent.*

# frontend-web-developer agent

| Field | Value |
|---|---|
| File | [`agents/frontend-web-developer.md`](../../agents/frontend-web-developer.md) |
| Name | `frontend-web-developer` |
| Triggers | Website work: static sites, landing/download pages, embedded web builds, credits and licensing pages, accessibility, SEO, performance, privacy-respecting analytics, hosting and deployment |
| First action | Loads `engineering-practices` and follows its `project-onboarding` skill |

## Body sections

| Section | Content |
|---|---|
| Mission | Fast, accessible sites that get the visitor to the right build in one click |
| Responsibilities | One line per skill plus documentation |
| How you work | Onboard · Frame the page · Build from the content out · Verify · Ship · Document (Plan, Do, Check) |
| Quality bar | HTML, WCAG 2.2 AA, Core Web Vitals, downloads, metadata, privacy, credits |
| Not your job | graphic-designer, ui-developer, devops-engineer, build-owning programmer role, project-manager, code-reviewer |
| Never | Unapproved third parties; detection-dependent downloads; hand-copied data; failing WCAG; altered badges; committed secrets; legal conclusions |

## Plugin manifest (`.claude-plugin/plugin.json`)

| Field | Value |
|---|---|
| `name` | `frontend-web-developer` |
| `version` | `0.2.0` |
| `author.name` | `opsroller` |
| `repository` | `https://github.com/opsroller/frontend-web-developer` |
| `license` | `GPL-2.0-or-later` |
| `keywords` | `role`, `job-function`, `frontend`, `web`, `accessibility`, `wcag`, `seo`, `performance`, `core-web-vitals`, `static-site`, `webassembly` |
