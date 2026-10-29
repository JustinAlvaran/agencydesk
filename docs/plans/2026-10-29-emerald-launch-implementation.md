# AgencyDesk emerald Launch integration implementation plan

> Use Superpowers executing-plans inline; one independent final/security reviewer. Owner already selected the visual approach and authorized execution/PR delivery, with previews before push and green Actions required.

**Goal:**Ship the selected black/emerald homepage and matching CRM as a reviewed feature PR with fully green required checks.
**Architecture:**Scoped CSS Modules around existing server-rendered content/authenticated views; adapted licensed Glow/Mockup/ShineBorder primitives; one lazy client Three field with static fallback. Existing queue/auth/provider architecture is unchanged.
**Stack:**Next16.3.8,React19.2.8,Tailwind4,Radix/Lucide,Three0.186.1 with matching0.186 type package; no new designMCP/runtime or paid service.
**Spec:**docs/plans/2026-10-29-emerald-launch-design.md

## Global constraints and review focus

Preserve unrelated work and use only AgencyDesk paths/accounts. Free public MIT sources pinned with attribution. No customer/provider/private credential access. Preview before push; scoped Justin-authored PR updates only; no merge/production change. Review:origin spoofing/fixtureenv, noJS/motion/WebGL failure, small-screen overflow/focus, truthful public vsprivate data, exact staged source vsunfinished workingtree.

## Task1 - restore honest CI gates

Files:.github/workflows/ci.yml;tests/unit/service-inquiry.test.ts.
- [ ] Reproduce existing fixture failures with CIAPP_URL/http://localhost:3000 and APP_MODE/demo, preserving diagnostic log.
- [ ] Pin Deno2.5.6, independently verified resolvable by official version index/issue31130; do not skip installation or checks.
- [ ] Set fictionalAPP_URL in suite beforeEach; retain hostile-origin assertion and env cleanup. Full unit suite must pass under CIenvironment.

## Task2 - homepage/brand enhancement

Files:src/app/page.tsx;src/components/marketing.tsx;new launch-home.tsx,launch-home.module.css,public-theme.module.css,public-theme.tsx,launch-effects.tsx,emerald-field.ts,ui/shine-border.tsx;public page wrappers;package.json/pnpm-lock.yaml;THIRD_PARTY_NOTICES.md;tests/e2e/emerald-design.spec.ts.
- [ ] Add failing browser acceptance for new empty workflow preview/FAQ, reduced-motion/static fallback and navigation, run against old UI.
- [ ] Cache exact licensed upstream hero/glow/mockup/shine sources and notices in ignored project-local folder; record revisions. Install only pinned Three/type dependencies using existing private pnpm; preserve package script diff outside index.
- [ ] Implement supplied composition with CMS heading/services, readable DOM preview, native FAQ and scoped reusable public theme. No fake social proof.
- [ ] Implement lazy decorative field with cappedquality, pause/offscreen/tab/reduced-motion disposal and WebGL fallback. Retain meaningful page when script disabled.
- [ ] Run new browser suite, guide/inquiry regressions, accessibility/overflow at390/1440; capture real screenshots.

## Task3 - shared CRM theme and verified delivery

Files:src/components/app-shell.module.css;workspace-dashboard.module.css;shared public/login wrappers;tests/e2e existing regressions;docs/emerald-design-2026-10-29.md;project status/ledger.
- [ ] Apply matching dark/emerald scoped styles to shared shell/dashboard, tables, forms, badges and empty states without changing data/actions.
- [ ] Run all appropriate unit/DB/Edge/lint/type/build and full safe browser checks in exact index snapshot (no env/auth stores); preserve intentionally gated live-account tests as explicit skips, never call them coverage.
- [ ] Show owner actual desktop/mobile homepage andCRM preview BEFORE any push of this redesign. Address observed defects and independent credential/security/final review.
- [ ] Verify staged allowlist, ignored private paths and redacted index/browser scans, then commit only slice asJustin, push featurebranch and rewrite existing draftPR2 scope/screenshots/checks.
- [ ] Inspect GitHub Actions on actual pushedhead; repair concrete failures under same review/test discipline until green. Do not claim green from local checks or external hosting status. Owner alone merges/releases.

## Preflight dependencies / rulings

Task2 publictheme is consumed byTask3 and marketingpages; privateCRM must not load the canvas. Task1 fixture change affects fullCItests; do not weaken productionCSRF behavior. Current checkout has unrelated service-chat edits, so source snapshot gates require a selectively staged package manifest. Existing featurebranch and unfinishedwork ruling supersedes creating an external worktree. User selected screenshot/go authorization supersedes redundant plan-confirmation checkpoints. Keep one finalreview rather than per-task teams.

Owner steering:complete design/preview first; CI repair already made locally is held for later verification. No new data, seeds, imports or fixture changes. New previews are empty structural interfaces. Preserve existing records/content. Selected agency-agents role briefs are read-only references; no global installation.
