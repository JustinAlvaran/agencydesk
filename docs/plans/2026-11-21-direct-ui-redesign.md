# Direct AgencyDesk UI implementation plan

**Goal:** Implement the approved Bigin/HubSpot direction directly in the existing app.
**Spec:** 2026-11-21-lovable-design-prompt.md. Owner authorized direct implementation after Lovable was unavailable.
**Architecture:** Next 16 / React 19 with scoped CSS modules, existing routes and data contracts. Original reusable SVG identity; no new packages. Inline Superpowers execution and one independent security/code review before publication.

## Acceptance and implementation

- [x] Original shared AgencyDesk mark; forest-green introduction, white account form surface, coral actions and neutral workspace. Remove editorial italic homepage styling.
- [x] Homepage retains working service links, workflow navigation, demo preview and progressive interactive illustration. Public examples remain explicitly fictional.
- [x] Account shell and password visibility controls preserve the existing sign-in and password actions. Demo deployment remains account-free. No public signup, membership grants or simulated account success.
- [x] AgencyBot reuses the existing service guide with keyboard-safe dialog controls; no CRM tools, prospect discovery or provider connections are enabled.
- [x] CRM and portal share readable tables, clear navigation, responsive spacing and original identity. Portal receives only explicitly scoped caller data.
- [x] Check desktop/mobile rendering, keyboard navigation, overflow, axe, existing inquiry/guide and workspace flows; run typecheck, lint and targeted unit/browser suites.
- [ ] Independent review, exact staged allowlist/secret scan, preserve original staged work, push preview and update draft PR17. Owner reviews before production.

## Consequential rulings

Name/email/password invitation completion requires a separate authenticated profile change. This UI slice styles existing sign-in and password setup only; it does not add a fake registration form. Access requests go through the existing inquiry/contact path. Gmail/WhatsApp/Instagram and lead discovery remain in the CRM logic plan.

Retain existing CMS headline and functional routes, because replacing product copy or auth contracts is unnecessary to deliver the visual redesign. Existing uncommitted portal presentation work belongs to this UI slice; unrelated staged world/runtime work stays untouched.

## Owner addition: connection carousel and simpler logo

Add a manually controlled, touch-scrollable “Connect with” rail near the top, showing n8n, GoHighLevel, Zapier, Make, Shopify, Zoko, Zoho, HubSpot, Slack, Jira, Apollo and Trello. Deduplicate GHL and interpret “Appolo” as Apollo. Mark them as planned integrations, with no enabled-provider or partnership claim. Local image assets and provenance are in `public/brands`; no third-party image calls or provider connections are introduced.

Replace the first boxed logo concept with a standalone minimalist geometric A. Use the lighter model for these bounded presentation edits, with parent integration/checks and independent security review for publication. Logic remains deferred and requires deeper review.

## Verification record

- Scoped ESLint and TypeScript no-emit checks pass. Portal, dashboard, login destination, OAuth and auth-confirm unit suites: 23 tests pass.
- Focused browser coverage: 30 distinct cases pass across homepage/carousel, account entry, workspace/portal, public catalog, service-guide/AI fallback, and interactive-world checks. Includes 390/1280/1440 widths, axe, overflow, keyboard menus, lead search/detail, no fixture fallback, reduced motion, no JavaScript and carousel end/resize behavior. Demo records are fictional; hosted authenticated sessions were not used.
- Initial local runs encountered a Turbopack internal cache panic and slow dev navigation. Re-ran with webpack and isolated test output directories; local assertion timeout is 15 seconds. Repository CI still uses its production build and normal test configuration. No application workaround for the bundler crash was committed.
- Independent base and carousel-delta source/security reviews found no publication blocker. Redacted known-token scan of 77 generated browser JavaScript files: zero matches. Eleven local SVG assets contain no scripts, event handlers, foreignObject, external resources or entities; Apollo embeds a PNG. Final staged allowlist scan is performed by the publication script. These are scoped scans, not credential-history or deployed-account audits.
- Original 16 staged WIP entries must remain byte-identical. Publish only the scoped UI files and a HEAD-based illustration-test patch that scrolls the below-fold scene into view; do not publish the unrelated staged world implementation/test work.
- No new dependencies, migrations, paid service, backend/provider activation or production release. Roll back by reverting this presentation slice through preview and owner review. Lead discovery, invitation display-name setup and provider connections remain planned.

## 23 November: release follow-up

PR17 was owner-merged into main at `4909481e58fa4551cf0f7e0f2c08013875bbd3bf`; its tree matches the reviewed UI commit. The main CI run 45043890167 passed. Production verification found Vercel still serving the previous November 18 build, so the owner explicitly requested deployment of the reviewed main commit.

A flaky carousel edge test had failed on the earlier preview run: the loop could read an enabled arrow immediately before React disabled it at the scroll boundary. The follow-up registers `scrollend` before each real click and waits until rendered arrow states match scroll geometry. No runtime code, forced clicks, sleeps, retries or test timeouts change. Independent read-only review found no defect in the fix. Scoped ESLint passed. Local repeat run: nine consecutive passes after one initial cold-server navigation timeout before carousel interaction. Final CI will validate the normal production-build configuration.
