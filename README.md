# Frontend Web Developer

Front-end web developer: builds fast, accessible static websites, such as a product's landing and download site, with platform detection, store links and credits.

This plugin is a **job function**, not a project. It says how the job is done; the project it works on says with which tools, in its `CLAUDE.md` and project profile.

## Skills

| Skill | Use when |
|---|---|
| `static-sites` | Use when building or changing a website's structure, styling or deployment. |
| `download-pages` | Use when building a download or store-links page for an app or game. |
| `credits-and-licensing-pages` | Use when publishing credits, license text, source links or third-party notices on the web. |
| `web-accessibility-seo` | Use when checking a page's accessibility, metadata or discoverability. |

## Workflows

Multi-agent workflows (Claude Code Workflow scripts in `workflows/`).

| Workflow | Does |
|---|---|
| `/frontend-web-developer:site-audit` | Audit a website in parallel for accessibility, performance, downloads, metadata and links |

## Agent

`agents/frontend-web-developer.md` defines the role as a subagent.

## Install

```
/plugin marketplace add opsroller/claude-plugins
/plugin install frontend-web-developer@opsroller
```

Versioned on its own with semver tags (`v0.1.0`). Changes follow Conventional Commits.
