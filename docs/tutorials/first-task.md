*Tutorial, for someone new to the frontend-web-developer plugin who wants to see it do one real job from start to finish.*

# Build your first download page with the frontend-web-developer role

In this tutorial we will give the role a tiny project with release data,
let it build a download page, and check the page ourselves.
It takes about twenty minutes. We need Claude Code with this plugin and
`engineering-practices` installed (see the [README](../../README.md)), Git, Python 3
and a browser.

## 1. Make the practice project

First, create an empty folder and a Git repository:

```
mkdir practice-site && cd practice-site
git init -b main
```

Now create `CLAUDE.md` so the role knows what it is working with:

```markdown
# practice-site
Static website, hand-written HTML and CSS, no build step.
Site root: `site/`. Release data: `data/releases.json`.
Docs live in `docs/` (Diataxis). No analytics.
```

Then create three small stand-in download files, so every link on our
page will work:

```
mkdir -p site/files data
for f in app-1.2.0-win-x64.zip app-1.2.0-mac.dmg app-1.2.0-linux-x64.tar.gz; do
  printf 'placeholder\n' > site/files/$f
done
sha256sum site/files/*
```

The output should show the same checksum three times:
`2f73349cfc4630255319c6c8dfc1b46a8996ace9d14d8e07563b165915918ec2`.

Now create `data/releases.json`:

```json
{
  "version": "1.2.0",
  "assets": [
    { "platform": "windows", "label": "Windows (64-bit)", "url": "/files/app-1.2.0-win-x64.zip", "size": 12, "sha256": "2f73349cfc4630255319c6c8dfc1b46a8996ace9d14d8e07563b165915918ec2" },
    { "platform": "macos", "label": "macOS", "url": "/files/app-1.2.0-mac.dmg", "size": 12, "sha256": "2f73349cfc4630255319c6c8dfc1b46a8996ace9d14d8e07563b165915918ec2" },
    { "platform": "linux", "label": "Linux (x86-64)", "url": "/files/app-1.2.0-linux-x64.tar.gz", "size": 12, "sha256": "2f73349cfc4630255319c6c8dfc1b46a8996ace9d14d8e07563b165915918ec2" }
  ],
  "stores": []
}
```

Commit it: `git add -A && git commit -m "chore: start practice site"`.

## 2. Ask the role to build the page

Start Claude Code in `practice-site` and run:

```
/frontend-web-developer:build-download-page
```

with the arguments `{ "releaseData": "data/releases.json", "page": "/download/" }`.

The progress view shows seven phases: **Plan, Build, Verify, Fix, Docs,
Docs check, Handoff**. Notice that Verify runs four checkers side by side:
`detection`, `links-and-data`, `accessibility` and `performance-seo`.

When it finishes, the result should start with `"status": "ready"`. Had
any checker found a blocker it could not fix, the result would read
`"blocked"` with the open items listed: the role never calls a page ready
while a check fails.

## 3. Look at the page

Serve the site with `python3 -m http.server -d site 8000` and
open `http://localhost:8000/download/` in the browser. We should see:

- one large button for the platform we are on (for example "Download for
  Windows (64-bit), version 1.2.0" on Windows);
- below it, a list of **every** platform in the release data, each with
  its size and checksum.

Now turn JavaScript off in the browser and reload. The large button is
gone, and the full list is still there. Notice that detection only chose the
primary button; it never hid anything.

## 4. Look at the docs it wrote

Open `docs/`. There should be a reference page describing the release data
fields and platform keys, and a how-to titled like "How to add a new platform
to the download page". Each starts with one line saying what kind of page it
is.

## 5. Change the data and see the page follow

Edit `data/releases.json`, change `"version"` to `"1.3.0"`, and ask the role:
"Regenerate the download page from the release data." Reload the page. The
version on every button now reads 1.3.0, and no one typed it into the HTML.

## What we did

We gave the role a project description and release data; it planned, built,
checked and documented a download page, and refused to call it ready while
links were broken. Next, try [How to audit a site before a release](../how-to/how-to-audit-a-site-before-release.md),
or read [About the role](../explanation/about-the-role.md) to see why it
works this way.
