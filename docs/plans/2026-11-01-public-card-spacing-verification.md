# Public card layout verification — 1 November 2026

## Observed cause and final behavior

A credential-free production baseline reproduced the owner's screenshots at390/1280/1440px on `/services`, `/services/business-websites` and `/case-studies`. Computed service-wrapper left/right padding was0px; service scope cards had0px horizontal/24px top/0px bottom; sample-project rows had0px horizontal/24px vertical. A broad theme selector painted these divider rows and the final CTA as cards. The guide trigger was fixed over content. Three regression cases failed as expected before source changes (exit1), with actual before screenshots.

The source now uses explicit card classes:32px desktop/20px phone insets,24px between cards and16-24px internal gaps, separated content/actions, wrapped readable text/buttons and natural heights. Services use a two-column desktop catalog; existing sample projects use three equal desktop cards; both stack below900px. Service scope stays one column. The closing inquiry/demo row is outside card styling. On only these three catalog routes, the guide trigger is in footer flow rather than over a card. Dialog behavior/homepage/CRM remain unchanged.

No content, records, service destinations, sample labels, authentication, RLS, database/API/outbound behavior, dependencies or provider settings were changed. No reference code/data/infrastructure or external design service was used. Existing public fictional scenarios remain explicitly labeled; no new records/metrics/testimonials were added.

## Exact local evidence

Isolated checkout `.local/public-spacing-pr-worktree`, branch `codex/public-card-spacing`. Current fetched mainf6ff043 and preview6c95bfa were normally merged into feature9d43ead before implementation. Root unfinished work and other feature checkouts were preserved. The earlier CRM PR8 was already owner-merged; it was not recopied or rewritten.

- Baseline and fixed `pnpm build --webpack`, APP_MODE=demo, CONTENT_SOURCE=fixtures, no real env files: both exit0. Fixed build includes Next production compilation, TypeScript, static generation and tracing. Webpack avoids the local dependency-junction Turbopack limitation; production configuration is unchanged.
- Current unit suite:211tests/28files pass, exit0. No database/Edge/provider tests were rerun for this markup/CSS-only change.
- Explicit `tsc --noEmit`:exit0. Scoped ESLint API, cwd isolated checkout:5changedTS/TSXfiles,0errors/0warnings,exit0; not a full-repo lint claim.
- Serialized built-browser verification:7cases pass,exit0. Three padding/overflow/link/label/accessibility cases cover3routes at390/1280/1440px. One390x400guide/inquiry navigation case verifies reachable controls and focus return. Three existing guide cases verify service selection, inquiry preparation, email/WhatsApp consent unchecked and Escape/focus restoration. Axe A/AA checks report0violations in the tested scope. No customer record was created, message sent, appointment made or live model invoked.
- Eight actual before/after screenshots for services/sample projects at390/1440px were manually inspected, contain only existing public content/fictional labels, and were shown before push. Source defects were fixed rather than hidden with test CSS or altered screenshots.
- Independent read-only security/final reviewer found no actionable source correctness/security issue in the five-file diff and relevant callers. It confirmed public-only class/CSS scope and unchanged auth/RLS/actions/provider boundaries. Parent owns browser/scanner/image verification; review was not a credential/history/provider audit.
- Known-format built browser scan:88textassets/0maps,0findings. Staged/current-index scan counts and exact allowlist equality are recorded in the PR/handoff after staging. Real env/.local/dependency paths must remain ignored. Binary skips require manual image review; pattern scans do not guarantee zero leaks and do not cover history/private stores/server/deployed artifacts/providers.

## Delivery / limits

This is local layout and public-flow evidence, not certification of the whole CRM or a production release. PR targets preview; owner alone merges/promotes. No production/database/deployment changes are made by this slice. Existing Netlify preview and Actions are checked on the actual pushed SHA. Current CI pins Deno2.5.5; isolated GitHub scopes gist/read:org/repo lack workflow. Do not bypass that independent permission gate or claim green CI when setup fails. Keep draft for red/missing checks and record actual results.

Access recovery: the default sandbox could not inspect Git worktrees, but an authorized AgencyDesk-only elevated write/delete probe and isolated identity/push checks passed. No credential switch/global configuration change was needed. Repository tool approval is distinct from GitHub authentication.

Costs enabled:none. No migration/config/credential step. Owner reviews responsive pages and guide relocation, then handles approval/merge after required checks. Rollback: revert this feature commit; no schema/provider rollback. Detailed private logs are under `.local/public-spacing-20261101` and excluded from Git.
