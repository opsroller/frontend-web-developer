*How-to guide, for people already using the frontend-web-developer plugin who were asked to measure website use.*

# How to add privacy-respecting analytics

This guide shows you how to add measurement without tracking visitors. Rules
and event names are in the
[privacy-respecting-analytics reference](../reference/skills/privacy-respecting-analytics.md).

1. Write down the questions the project wants answered and who will act on
   each answer. Drop any question no one will act on.
2. Check whether existing numbers already answer them: release-host download
   counts, store consoles, CDN aggregate logs. If they do, stop here.
3. If a script is needed, give the owner the facts for a cookieless,
   aggregate tool (what it collects, where data lives, retention) and get a
   decision recorded in the project profile. Do not pick a vendor yourself.
4. Ask the role: "Add the approved analytics tool following the
   privacy-respecting-analytics skill." It adds the script on production
   only, the events for your questions, and the CSP entry.
5. Open the deployed site with the browser's network panel: confirm no
   cookies, no other third-party requests, and nothing personal in payloads.
6. Publish or update the privacy note; it is part of the reference docs.
