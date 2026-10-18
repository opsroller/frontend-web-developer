*Explanation, for anyone who wants to understand what the front-end web developer role is, where it stops, and why it works the way it does.*

# About the front-end web developer role

## What the job is

A front-end web developer builds the part of a website that runs in the
visitor's browser: the HTML, CSS and JavaScript, and increasingly the build
and hosting that deliver them. Job postings for the role, from marketing
sites to product teams, repeat the same core: turn designs into accessible,
semantic, responsive pages; keep them fast; protect SEO; deploy through
version control with previews and reviews; and work with design, marketing,
product and engineering. Occupational data (O*NET's "Web Developers")
describes the same work in plainer terms: write and maintain site code, test
across browsers and devices, analyse user needs, recommend performance
improvements and implement security measures.

In this team the role has a particular centre of gravity: the product's own
public site. That means landing and download pages, a page that may run the
product itself in the browser, the credits and licence pages that a
copyleft project owes its users, and the quality bars that make all of that
usable by everyone.

## Why the methods look the way they do

**HTML first, JavaScript as enhancement.** Jeremy Keith's *Resilient Web
Design* argues that the parts of a page other than HTML should be optional,
because every extra layer is something that can fail on someone's device.
MDN's guidance on browser detection says the same from the other side:
prefer feature detection and progressive enhancement over guessing. A
download page that only works if a script guesses the visitor's platform
correctly is fragile in exactly the way these sources warn against. Hence
the rule this role is known for: **detection only picks the primary button,
and never hides the other platforms.** The iPad that reports itself as a Mac
is the standing example of why.

**Data, not copy-paste.** Versions, links, checksums and credits change with
every release. Anything typed by hand drifts. The role therefore treats
release data and the credits source as inputs owned by other roles, and
generates pages from them.

**Accessibility as a floor, tested by people.** WCAG 2.2 level AA is the
current W3C standard most laws and procurement rules point at; 2.2 added
criteria that matter for ordinary sites (focus not hidden behind sticky
headers, 24 px targets, alternatives to dragging, consistent help). The UK
Government Digital Service's guidance is blunt that automated tools miss
much of what matters, which is why the skill insists on manual and
assistive-technology passes.

**Performance measured where users are.** Core Web Vitals thresholds
(LCP 2.5 s, INP 200 ms, CLS 0.1 at the 75th percentile) were chosen by
Google's web.dev team from user-experience research and what mobile devices
can achieve. A fast laptop on office Wi-Fi tells you little; field data and
throttled lab runs do. The highest-yield fixes are usually unglamorous:
make the hero image discoverable, ship less JavaScript, reserve space.

**Privacy by default.** Every third-party request leaks a visitor's IP and
the page they read. Cookieless, aggregate analytics exist precisely to
answer "how many people downloaded?" without building profiles. The role
states facts about privacy law and leaves decisions to the owner, because
whether a setup needs consent depends on jurisdiction.

**Licences are reference with legal weight.** A copyleft project owes its
users the licence and source for each release; permissive licences such as
MIT require the notice itself to travel with the code. The role does not
interpret licences; it makes sure the facts are published completely and
correctly.

## Boundaries with neighbouring roles

| Neighbour | They own | This role owns |
|---|---|---|
| graphic-designer | Identity, palette, type, store and social art, page visual design | Implementing it in HTML/CSS; flagging contrast and weight problems |
| ui-developer | Menus, HUD and screens inside the product | Pages on the website |
| devops-engineer | Release builds, artifacts, checksums, store submissions, licence inventory, CI system | The site's build and deploy job; pages generated from their data |
| Programming role that owns a web build | Code and events inside the build | Hosting, loading, the page around it, the event bridge |
| project-manager | Scope, staffing, decisions routed to the owner | Raising missing inputs instead of inventing them |
| code-reviewer | The verdict on every PR | Preview links and evidence (numbers, test results) in the PR |

## Trade-offs the role makes

- **Fewer tools over more features.** A static site with little JavaScript
  is less flexible than a single-page app but faster, cheaper, more secure
  and easier to keep accessible. The role reaches for a framework only when
  the page truly needs one.
- **Click-to-load embeds.** Making visitors click before a large web build
  downloads costs one interaction and buys a fast landing page and respect
  for metered connections.
- **Blocking over shipping.** The workflows return "blocked" rather than
  ship with open blockers or unverified checks. It is slower on bad days and
  far cheaper than a broken download page on release day.

## How the role grows (junior to staff)

Career ladders from the industry describe a consistent arc:

- **Junior:** builds pages from existing patterns, fixes small bugs, uses
  Git and pull requests, learns the stack.
- **Mid-level:** takes a feature from requirements to delivery; asks about
  edge cases (errors, mobile, tracking, contracts) before building; solid
  accessibility basics.
- **Senior:** owns ambiguous work and technical decisions: architecture,
  accessibility and performance as habits, cross-role contracts such as an
  event contract with a build's owner; reduces risk; mentors; reviews code.
- **Staff/lead:** sets standards (accessibility, testing, budgets) across
  sites, guides migrations, and is measured by how much they multiply other
  people's work.

This plugin aims at senior-level judgement: it frames the page before
building, writes contracts with neighbours, verifies with evidence, and
documents as part of the job.

See the [reference](../reference/index.md) for the exact skills and
workflows, and [SOURCES.md](../../SOURCES.md) for the research behind this
page.
