# Diorama world: local verification, 30 October 2026

## Scope and behavior

Original procedural Three0.186.1 world on the public homepage: scroll camera poses, layered assembly, pause/resume, reduced-motion/static fallback and disposal on unmount/failure. Matching matte emerald CRM navigation and task-first overview; actual leads/tasks receive presentation wrappers only. No new records, seeds, metrics, dependencies, provider credentials, migrations or messaging behavior. Dioramas MIT attribution is pinned in THIRD_PARTY_NOTICES.md; no bundled assets or paid generation pipeline imported.

## Actual checks

- Credential-free exact Git-index snapshot under this repository, using existing node_modules. Node22.23.3/private pnpm10.28.1. Production command `next build --webpack`: exit0, compilation, TypeScript, static generation and tracing complete. 129unit tests across17files pass. These results exclude unrelated hosted-chat/globals/package/Supabase work.
- Three lifecycle tests observed red then green: paused resize repaints, failed first render releases owned resources, disposal is idempotent and stale resize callbacks inert.
- Built snapshot `next start` on127.0.0.1:4318 with APP_MODE=demo, CONTENT_SOURCE=fixtures, no copied real env/auth stores. `playwright test tests/e2e/diorama-world.spec.ts --workers=1`: v3 five passes, including real canvas/first-frame assertions at390/1440, controls, WCAG2A/AA/2.1AA Axe scans, no overflow, inquiry href, empty CRM/dashes/no canvas, zero mutation/paid-asset requests, reduced motion, forced no-WebGL, no-JS inquiry and synthetic context loss.
- Initial v2 viewport cases timed out inside Axe during animation (three other cases passed); pausing through the real UI before inspection retained every assertion. V4 recaptured from scroll0: mobile and three keyboard/short-navigation cases passed, desktop exceeded90s late in the combined flow. Final v5 desktop retry passed with120s test budget, unchanged assertions. Real hardware/mobile FPS and GPU-loss recovery are not benchmarked.
- `workspace-overview.spec.ts --grep 'mobile drawer|short desktop'`: focus containment/restoration, short-height mobile final-link reachability and short desktop sidebar all pass in v4. Populated fixture overview checks and authenticated live CRM not rerun in this slice.
- Fresh exact-snapshot ESLint:13changed TypeScript/TSX files,0errors and0warnings, exit0. Two earlier attempts were interrupted while loading/running without diagnostics; the final completed run is recorded independently. No assertions/rules disabled.

## Independent review and credential checks

Independent read-only reviewer inspected source/client boundaries, auth/agency/query seams, tests and all6screenshots. TwoP2renderer defects fixed and re-reviewed; no remaining actionable finding in reviewed scope. Screenshots show only public content and empty CRM; no customer/account/credential details.

Known-format index scan, ignore verification and built browser-text-asset scan are recorded separately before publication. Build scan:86JS/CSS/JSONassets,0source maps,0findings. No full Git-history, provider account, deployed bundle or dependency audit; pattern scans and visual review cannot guarantee zero leaks. Binary screenshots are manually reviewed, not credential-pattern scanned.

## Delivery and rollback

Feature branch codex/diorama-world-ui includes fetched main6ae9aac and previewee59f93; PR explicitly targets preview. Owner controls merge and production. No production deployment/database change in this run. No paid costs enabled. Draft until remote CI and preview gates are resolved; known remote Deno setup2.5.5 issue is not fixed by this UI slice. Revert this scoped feature through preview/main review to restore the previous homepage/workbench; no migration/data rollback needed.

## Scheduled-run distinction

Daily heartbeat configuration was read back ACTIVE at09:00Asia/Manila. No delivered9AMheartbeat observed in this chat; exact scheduler cause unavailable. This work is a manual catch-up and does not establish scheduler repair. No duplicate job, schedule change or global configuration change.
