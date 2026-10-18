*How-to guide, for people already using the frontend-web-developer plugin whose page fails LCP, INP or CLS.*

# How to fix a failing Core Web Vital

This guide shows you how to bring one metric back to "good". Thresholds and
budgets are in the [web-performance reference](../reference/skills/web-performance.md).

1. Find which metric fails and on which page, from field data if the site
   has it, otherwise from a lab run with mobile throttling.
2. Ask the role: "Diagnose the failing <metric> on <page> following the
   web-performance skill and record before/after numbers."
3. Depending on the metric:
   - **LCP:** check the LCP element is a real image in the HTML, not
     lazy-loaded, with `fetchpriority="high"`, right-sized, and that HTML
     comes from a CDN.
   - **INP:** look for long tasks over 50 ms and JavaScript that native HTML
     could replace.
   - **CLS:** look for images, embeds or banners without reserved size, and
     web fonts swapping without metric-matched fallbacks.
4. Merge the fix with the numbers in the PR description.
5. Field data takes up to 28 days to reflect a change; re-check then before
   closing the work.
