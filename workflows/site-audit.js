export const meta = {
  name: 'site-audit',
  description: 'Audit a website in parallel for accessibility, performance, downloads, metadata and links',
  whenToUse: 'Before deploying site changes. args: { site: "<local path or URL>" }',
  phases: [{ title: 'Audit', detail: 'one agent per dimension' }, { title: 'Fix list', detail: 'prioritised' }],
}
const site = (args && args.site) || 'the project website'
const R = { type: 'object', properties: { dimension: { type: 'string' }, problems: { type: 'array', items: { type: 'string' } } }, required: ['dimension', 'problems'] }
const dims = [
  ['accessibility', 'WCAG 2.2 AA: landmarks, alt text, contrast, focus order, keyboard-only use, 320 px width'],
  ['performance', 'page weight against the static-sites budgets, render-blocking resources, image sizes, layout shift'],
  ['downloads', 'every platform reachable, platform detection only picks the primary button, links come from release data, store badges per brand rules'],
  ['metadata', 'title, description, Open Graph and card images, canonical, sitemap, structured data'],
  ['links-and-credits', 'broken links, credits and license pages match their single sources, source link per release'],
]
const res = await pipeline(dims, ([d, what]) => agent(`Audit ${site} for ${what}, following the frontend-web-developer skills. Return concrete problems with file or URL.`, { schema: R, phase: 'Audit', label: d }))
phase('Fix list')
return await agent(`Prioritise these into a fix list, visitor impact first:\n${JSON.stringify(res.filter(Boolean))}`, { label: 'fixes' })
