# AgencyDesk Diorama World Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:executing-plans inline, one independent final security review.

**Goal:** Deliver an immersive original 3D homepage plus a matching task-first actual CRM without data additions or provider changes.
**Architecture:** Server-rendered public sections + lazy disposable Three scene; small client control boundary. Existing CRM views/actions remain authoritative, CSS modules isolate visual changes.
**Tech Stack:** Installed Next16.3.8, React19.2.8, TypeScript, Three0.186.1, Radix/Lucide/CSSModules.
**Spec:** docs/plans/2026-10-29-diorama-world-design.md

## Global constraints

AgencyDesk-only absolute cwd; no Linear/GetLayers/global configuration/other projects. Free-only, no generated assets, no credentials or customer data, no seeds/i18n/sends. Feature PR into preview and owner-controlled main releases. Preserve all unrelated WIP.

## Review focus

Reduced-motion/no-WebGL/no-JS retain content and static composition; navigation/pause/context failure cannot leak renderer/listeners; scroll camera never hijacks native navigation; CRM totals retain truth and current-page limitations; mobile/drawer controls remain reachable.

### Task1: Full world and public composition
Files:create src/components/diorama-world.ts, src/components/diorama-world-view.tsx, src/components/diorama-world.module.css; modify launch-home.tsx/module.css and launch-effects.tsx; remove old unused emerald-field.ts if no other consumer. Test tests/e2e/diorama-world.spec.ts and targeted state tests if a pure seam is needed.
Interface:createDioramaWorld(host,initial:{paused,exploded},onUnavailable) returns idempotent dispose; client component owns lazy import/motion/visibility/pause/exploded state; DOM data-world-step marks section positions. No server Three import.
- [x] Write meaningful browser acceptance and preserve initial failing evidence; assert a real canvas and successful first frame.
- [x] Implement original bounded physical world, stage camera interpolation, semantic controls/static fallback and transactional, idempotent disposal. Three lifecycle regressions observed red then green.
- [x] Verify viewport/scroll/control/fallback/navigation/zero-mutation behavior in built snapshot (v3 five passes); review actual screenshots. Later recapture/time-budget evidence is recorded separately; no mobile hardware performance claim.

### Task2: CRM operating workbench
Files:app-shell.tsx/module.css, workspace-dashboard.tsx/module.css, actual src/app/crm/leads/page.tsx and tasks/page.tsx, optional scoped workspace CSS module. Tests:existing workspace-dashboard-render and overview/navigation suites plus new task-before-totals render case.
- [x] Observe new hierarchy assertion fail, implement task-first workbench and navigation groups without removing links.
- [x] Add semantic framing/styling to actual live lead/task controls; retain forms/pagination/query code. No records added.
- [x] Verify authoritative values/fixture honesty through unit cases; built empty-state desktop/mobile browser checks and three keyboard/short-navigation cases pass. No authenticated provider verification.

### Task3: Verification and PR
- [ ] Fresh types/lint/unit/browser checks, exact clean staged snapshot build and appropriate database/Edge checks if integration seams change. No provider/live messaging tests.
- [ ] Independent read-only security/final review, exact staged allowlist, redacted secret scans/ignored paths and reviewed screenshots. Keep unrelatedWIP out.
- [ ] Show preview before push; fetch latest main/preview, merge as necessary and rerun affected checks; commit Justin-only and push dedicated branch; open PRbasepreview, attach it, inspect actual Actions/deploy results and state remaining gates truthfully.
- [ ] Record files/evidence/costs/rollback in project status and local ledger. No automatic merge/deployment.

## 30 October manual catch-up

The saved daily heartbeat is active at09:00Manila, but no delivered9AMrun was observed. This is manual continuation, not proof of scheduler execution or repair. Exact-snapshot unit/build and independent source/security review completed. Publication remains draft until remaining checks and owner review; see the scoped verification report. No production state or customer data changed.
