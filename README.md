# Frontend Web Developer

A Claude Code plugin that gives your project a **front-end web developer**:
the person who builds the product's public website and keeps it fast,
accessible and honest. It builds static sites, landing and download pages
that pick the right download for the visitor's platform (without ever hiding
the others), pages that run an interactive web build and react to its
events, credits and licensing pages, and it holds the site to WCAG 2.2 AA,
Core Web Vitals, sound SEO and privacy-respecting measurement.

This plugin is a **job function**, not a project. It says how the job is
done well; your project's `CLAUDE.md` and profile say with which tools.

## Install

```
/plugin marketplace add opsroller/claude-plugins
/plugin install frontend-web-developer@opsroller
```

Install `engineering-practices` too: the role starts every task with its
`project-onboarding` skill.

## Documentation

**New to the plugin?** Start with the tutorial,
[Build your first download page](docs/tutorials/first-task.md): a practice
project from empty folder to a verified, documented page.

**Doing a job?** The how-to guides cover the common ones:
[build or update a download page](docs/how-to/how-to-build-a-download-page.md),
[embed a web build](docs/how-to/how-to-embed-a-web-build.md),
[audit a site before a release](docs/how-to/how-to-audit-a-site-before-release.md),
[add privacy-respecting analytics](docs/how-to/how-to-add-privacy-respecting-analytics.md)
and [fix a failing Core Web Vital](docs/how-to/how-to-fix-a-failing-core-web-vital.md).

**Looking something up?** The [reference](docs/reference/index.md) describes
the agent, each of the eight skills, the three workflows
(`site-audit`, `build-download-page`, `embed-web-build`) with their
arguments and outputs, and the `preview-probe` browser harness.

**Want the why?** [About the role](docs/explanation/about-the-role.md)
explains what the job is, where it stops and its neighbours begin, and the
trade-offs behind its methods. The research it rests on is in
[SOURCES.md](SOURCES.md).

Versioned on its own with semver tags (`v0.1.0`). Changes follow
Conventional Commits.

## License

Copyright (C) 2026 the contributors. Licensed under the GNU General Public License v2.0 or later (`GPL-2.0-or-later`); see `LICENSE`.
