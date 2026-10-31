# CRM workspace verification — 31 October 2026

## Change and boundaries

Original English-only AgencyDesk implementation informed by a bounded read-only reference review. No ApartmentHub code was transplanted: no reusable license was established. No reference credentials, records, business content or infrastructure were used. No new dependency, schema, runtime, provider access, customer records, outbound activation or production change.

The real `/crm/leads` now defaults to a complete-column responsive board, retains table view and all existing filters/pagination, and carries whitelisted list context into detail/back navigation. Current-page stage counts remain distinct from the exact filtered total. Stage changes use a status-only authenticated compare-and-set; company/owner/archive are preserved, stale/archived rows fail, and Won remains proposal-driven. There is a deliberate keyboard-accessible stage form rather than drag-and-drop.

The real lead detail retains every existing contact, assignment/archive, call/callback, note, messaging/suppression and reviewed-draft form. Contact links explicitly open local apps. Its identity rail contains bounded, lead-scoped open tasks and existing task create/complete actions. Tasks and callbacks are internal reminders, not bookings or automatic sends. No consent or RLS changes.

The anonymous `/demo/design/leads` shares the real board component with an empty array and no mutation forms. It loads no CRM records. Published screenshots contain only this clearly labeled empty view.

## Evidence on isolated feature checkout

Checkout `.local/crm-pr-worktree`, branch `codex/agency-crm-workspace`, base preview `9a4cea0`; main `6ae9aac` and preview were verified ancestors. Root unfinished edits were not part of this checkout.

- `node vitest.mjs run --root .local/crm-pr-worktree`: **167 tests / 25 files pass, exit 0**. Stage action and lead-task-query regression tests were observed failing before implementation. Source mocks do not prove live OAuth/provider access.
- `node tests/database/leads.mjs` in the isolated checkout: **62 embedded PostgreSQL assertions, exit 0**, using isolated fictional test fixtures only. No hosted database access.
- Next route type generation: exit 0. Initial direct tsc before generation failed on missing generated `LayoutProps`; after generation, `tsc --noEmit`: **exit 0**.
- Scoped ESLint via Node API, cwd isolated checkout: **14 changed TS/TSX files, 0 errors, 0 warnings, exit 0**. This is not whole-repository lint.
- `pnpm build --webpack`, `APP_MODE=demo`, `CONTENT_SOURCE=fixtures`, no private env files: **exit 0**, including Next production compilation, TypeScript, static generation and tracing. Webpack is used for this local node_modules junction; production config is unchanged.
- Serialized `lead-workspace.spec.ts` on the built loopback server: **3 cases pass, exit 0**, at 390/1280/1440px. Complete stage columns, board/table links, page and column overflow, no forms/canvas/mutation requests, axe WCAG A/AA checks, and short-height mobile navigation close/focus restoration pass. Earlier horizontally scrolling composition was rejected after screenshot review and superseded by the rebuilt full-column layout.
- Additional private layout harness: actual detail server-render output from isolated unit fixtures inserted into the actual built shell at **390/850/900/1000/1440px**, all page/panel overflow assertions pass, exit 0. This is layout evidence, **not authenticated browser-to-database mutation E2E**. Private fixture artifacts are ignored and not published. Hermes UI was mocked in that harness; existing messaging behavior is preserved by source composition, not re-certified here.
- Independent read-only security/final review found one P2 timestamp-string comparison defect. Offset regression was observed red, fixed with numeric instant comparison, then green; reviewer confirmed resolution and no remaining concrete source findings. Review covered scoped source/auth/RLS/integration boundaries, not private credentials/history/providers.

Screenshots: `docs/images/crm-pipeline-{390,1280,1440}.png`, manually inspected and shown before push. No customers, secrets or fabricated operational metrics appear.

## Security scans and publication limits

Before commit, enforce exact staged allowlist and compare staged blobs to tested files. Run the existing project-local known-format credential/private-path scanner against staged files and the current index, and the browser-text scanner against `.next/static`. Confirm real env, `.local` and node_modules remain ignored. Record actual scan counts in the PR/handoff. Screenshots require manual review; binary skipped counts are not scans of image content.

These scans do not cover Git history, ignored auth stores, server artifacts, remote provider state or deployed assets and do not guarantee zero leaks. Do not read or print real credentials for this review.

PR targets `preview`; owner alone merges/promotes. Inspect Actions and Netlify on the pushed SHA. The existing Deno setup/workflow-permission blocker is outside this feature and must not be bypassed. Keep the PR draft for red/missing checks or unverified authenticated flows. A working preview is not a production release.

## Remaining work / rollback

- Owner reviews UI, then tests authenticated lead/task flows on their own approved environment before merge; no customer send or appointment is required.
- Screenshot-reported public service/project-card spacing is **not changed by this CRM slice**. It is saved as first priority in the existing next daily automation, preserving its daily 09:00 Asia/Manila schedule.
- Wider reference parity (drag-and-drop, consolidated proposal context) is follow-up scope. No fake buttons, imports or reference sync endpoints were added.
- No costs enabled. No migration/configuration/credential step is required for these UI/query changes. Roll back by reverting this feature commit. Production and delivery controls remain unchanged.
