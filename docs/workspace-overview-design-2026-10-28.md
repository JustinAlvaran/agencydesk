# Workspace overview redesign - 28-29 October 2026

## Result and scope

The shared workspace uses an ink navigation rail, violet accents and a light canvas. The overview replaces the old table-first layout with authoritative metric cards, a due-ordered open-task preview, a bounded active-lead snapshot and active-project cards. Empty/inactive-only datasets have explicit states. Demo records remain visibly fictional/read-only; the live dashboard requires supplied data and cannot silently substitute demo records. Previews describe the loaded page; global totals still come from the existing loader/RPC.

Staff/client routes, sign-out action, auth/RLS, queries/actions, filters and pagination remain intact. Mobile navigation retains Radix focus trapping/restoration and Escape behavior. Both short mobile drawers and short desktop sidebars scroll so lower navigation remains reachable. CSS Modules isolate the visual changes from the existing unfinished globals/hosted-chat work.

The owner rejected GetLayers. This slice deletes its project MCP configuration and prohibits reactivation in project rules/runbook. No global MCP settings or old private auth stores were accessed or changed; removal of a project file is not proof that a previously loaded desktop session stopped. Superpowers and existing React/Radix/Lucide components provide the workflow and UI. MIT-licensed UI/UX Pro Max official guidance informed the free direction; no skill/runtime package was installed and no private source or customer data was sent to a design service.

## Acceptance and actual verification

Historical28October evidence: preview4 intended assertion failures followed by4 passes, render4 passes, working-tree134 unit tests, scoped/full lint and types, and4 new UI browser cases passed before the final readability changes. Earlier browser failures exposed contrast and invalid definition-list grouping, both fixed. The later readability browser rerun had2 passes/2 navigation timeouts; it is not represented as4 passes. Broad legacy sweeps encountered timeouts/network suspension, and the earlier snapshot build was interrupted.

Fresh29October evidence:

- Isolated staged snapshot314a9f43:122 unit tests in15 files passed; configured ESLint on7 changed source/test files passed with0 errors/warnings. `pnpm build --webpack` passed, including TypeScript and38 static pages. This export contains no real env file or MCP configuration and uses fictional provider settings. It predates only the final desktop scrolling CSS and its regression test; final snapshot verification is recorded below.
- Independent review identified short desktop sidebar clipping. At1440x600, the new test first failed because the focused bottom link had viewport ratio0. Scoped desktop scrolling/nonshrinking navigation fixed it; the unchanged test then passed. Logs distinguish this assertion failure from the earlier cold snapshot navigation timeout.
- Final new browser suite:5 passed in44.9s on the working-tree development server at127.0.0.1:4317, using fictional data/settings. Includes390/1440px overview rendering, Axe WCAG2A/AA/2.1AA, no overflow, pipeline search, no demo mutation requests, keyboard focus/trapping/restoration, Escape/route selection,844x390 mobile drawer and1440x600 desktop sidebar reachability.
- The exact snapshot development server did not serve its first cold demo route after more than11 minutes. A browser navigation and a60s route warm-up timed out. Its owned compiler was stopped; the existing working-tree development cache served the demo in16.7s. Root browser results and snapshot build/unit results are deliberately distinct. Browser assertions were not weakened; routes were warmed serially and test artifacts were separate.
- Existing unmodified interface regressions:3 passed in42.8s (anonymous CRM redirect, staff/client demo search/isolation with no mutations, mobile focus/Escape/Projects routing), after serial route warm-up. Full16-page sweeps remain an explicit gap.
- No production-mode browser, authenticated live account or deployed verification is claimed. Production-loopback startup was blocked by automatic approval review on26October and was not retried or bypassed.

Full local logs remain Git-ignored under `.local/implementation-20261019/`, including `ui-snapshot-build-20261029.log`, `ui-snapshot-unit-20261029.log`, `ui-snapshot-lint-20261029.log`, `ui-desktop-short-red-warm-20261029.log`, `ui-desktop-short-green-20261029.log` and `ui-browser-final-20261029.log`.

## Independent security/correctness review

The28October reviewer checked UI/auth seams and fictional screenshots but could not inspect Git through its sandbox. The independent29October reviewer successfully inspected the staged diff and ignore metadata, current UI/tests, authenticated data callers and screenshots. Its desktop P2 was reproduced/fixed and the followup found no remaining concrete code/security blocker. Runtime test results are primary-agent evidence, not tests run by the reviewer. No new API route, provider access, env import, raw HTML sink or data query is introduced.

Bounded primary credential checks cover exact staged files/private-path tracking, known credential patterns and public browser assets from the fictional build. Initial renewed staged scan:13 text files/2 PNGs skipped/0 candidates. Public `.next/static` scan:79 text assets/0 source maps/0 candidates. Images were manually reviewed and contain fictional demo data only. Final pre-publication counts are recorded below. Ignored private paths remain ignored. These checks do not audit full history, private auth stores, server artifacts, dependencies, deployed assets or provider state, and do not guarantee zero leaks.

## Visual evidence

Local working-tree development screenshots, not production or customer records:

- [390px overview](images/workspace-overview-390.png)
- [1440px overview](images/workspace-overview-1440.png)

The visible Next development indicator belongs to the local test environment.

## Release, owner steps and rollback

This UI PR is stacked on the setup branch while setup PR1 awaits owner review. Review both together: the UI slice removes the rejected MCP config introduced by that historical setup. Owner alone approves/merges/retargets. No production deployment or database change is made. No new packages, migrations, env configuration, paid plan or subscription is required; cost enabled:$0.

Remaining release limits: full legacy mobile/desktop16-page sweeps are not newly green, authenticated live/client rendering and deployed evidence remain unverified, and hosted model/inbox/booking/message automation work is outside this UI slice. Supabase account/project identity remains gated; local UI work required no provider access. Customer sending stays dry-run under existing controls.

Rollback:revert this UI slice's presentation/helper/test changes through owner review. Keep the rejected MCP removed. Existing queries/actions and unrelated globals/chat edits were preserved. One UI slice does not establish whole-CRM production readiness.


## Final publication checks - 29 October

Final staged source export1186c1f01c9910b2826e824e0b446487cb7e267a matched all245 indexed blobs before verification. After the desktop fix:122 unit tests/15files passed; configured ESLint7files had0 errors/warnings; `pnpm build --webpack` passed exit0 including TypeScript/static generation. Final generated browser scan again covered79 text assets,0 source maps,0 candidates. Results were then appended to documentation; the new browser test's line endings were normalized to LF. Application behavior/test assertions were not changed after verification.

One interim unit invocation incorrectly supplied the build-only loopback APP_URL to origin-sensitive fixture tests:119 passed/3 returned protective403 responses. Removing that process setting for unit tests restored122 passes; no application security check or assertion changed. Build settings remain fictional loopback providers. Logs:`ui-snapshot-unit-final-clean-20261029.log`, `ui-snapshot-lint-final-20261029.log`, `ui-snapshot-build-final-20261029.log`, `ui-interface-targeted-20261029.log`.

Current tracked index scan:241 text files,4 binary/large files skipped,0 known-format/private-path candidates. Scoped final staged scan:13 text files,2 PNGs skipped,0 candidates; deleted config has no content to scan. Exact16-file staged allowlist and whitespace checks are required before commit. Binary screenshots were manually reviewed; existing skipped binaries were not comprehensively audited. Full history and deployed systems were not scanned. Independent29October final/security followup found no remaining concrete blocker after the desktop fix.
