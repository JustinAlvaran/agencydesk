# AgencyDesk Launch-inspired emerald design

Owner selected the supplied Launch UI black/emerald screenshot and explicitly authorized integration on29October. This supersedes the earlier generic purple appearance. Scope:public homepage plus matching usable CRM, using the previously researched free source libraries. No additional design approval loop is needed for routine choices within this supplied direction.

## Approach and architecture

Adapt Launch UI's public MIT hero/glow/mockup composition, Magic UI's MIT ShineBorder mask effect, existing shadcn/Radix-style controls and one small lazy Three.js ambient field. Choose a screenshot-faithful emerald glow/tilted dashboard presentation, with restrained3D particles rather than importing a whole starter or insisting on52kgrass. The previous meadow is inspiration for depth/interaction; the selected Launch screenshot sets this implementation's composition/palette. Retain browser-native scroll and DOM content. No paid components, image assets, new MCPs or external inference calls.

Homepage:large left-aligned white-to-gray CMS heading, emerald atmospheric light, pill CTAs, layered tilted empty dashboard interface previews, four current services, inquiry-to-delivery workflow, semantic FAQ and clear final inquiry/demo action. No fabricated reviews, stars, customer logos, conversion/intent scores or prices. New public visual previews contain no seeded records, names, invented metrics, prices or testimonials; use structural placeholders/empty states only. Existing data and fixtures are not modified. No private CRM record is requested for a visual preview. Shared public services/case-study/inquiry surfaces get matching scoped dark styles; guide dialogs/consent flows stay intact.

CRM:matching charcoal surfaces, emerald actions/selected navigation, readable tables/forms, honest totals, useful task/lead/project previews and preserved empty states. Preserve all routes, filters, pagination, role isolation, auth/RLS, sign-out/actions and delivery protections. No canvas/scroll takeover inside staff tables. Login may share the visual language without changing authentication behavior.

Motion is decorative enhancement. Server headings/links/FAQ/preview remain useful with JavaScript disabled. Three loads lazily only when visible/motion allowed; pause, offscreen, hidden tab and reduced-motion stop it and release resources. WebGL failure leaves a gradient/static background and all content. Scope pointer effects to the hero and capDPR/particle counts. No FPS claim without measurements.

## Acceptance

-390px and1440px homepage/CRM have no document overflow, readable hierarchy and zero seriousWCAG2A/AA issues under Axe; visually compare against supplied Launch screenshot.
-Homepage service links/demo/inquiry remain correct; FAQ opens with keyboard; fictional preview clearly labeled; no customer-data/provider requests.
-Reduced-motion, noWebGL and noJavaScript preserve content and navigation. User can pause ambient motion; no sustained autoanimation without control.
-Existing CRM/search/client-isolation, guide/inquiry/consent and short-height navigation tests remain meaningful and pass.
-CI installs a resolvable pinnedDeno patch and all required GitHub Actions finish green. Unit tests explicitly isolate their fictional origin; production origin checks stay intact.
-Owner receives actual desktop/mobile preview images before push. Independent security/final review and redacted scans precede publication. Existing PR2 is updated on its feature branch; never merge/auto-merge/deploy.

## Delivery/isolation

Work in the current dedicated feature checkout, preserving unfinished hosted-chat/globals/package/Supabase edits. No other local project, Linear, global config/MCP, real credential reads, provider changes, sends or appointments. Stage only this slice, including a baseline-plus-new-dependency package manifest that excludes unfinished scripts. Verify an exact credential-free index snapshot separately from the mixed working tree. All software cost:$0; existing free hosting limits remain. Justin-only authorship. Rollback through owner review reverts this slice while keeping rejected GetLayers removed.

Owner steering:design first, CI after preview. No data additions/imports/seeds/fixture changes. Agency Agents selected role briefs are reference guidance inside existing agents, not global installs; use UI Designer/UX Architect for design, Evidence Collector/UI Finish-Gate for verification, and AppSec for independent credential review. Generic defaults (theme toggles, example content, installer/global writes, fabricated success metrics) do not override the selected design or owner restrictions.
