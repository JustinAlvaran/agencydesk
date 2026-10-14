# Initial checkout verification

Checked 14 October 2026 in `C:/Users/paule/OneDrive/Documents/ChatGPT/agencydesk`.

This records the original checkout before feature implementation. For the subsequent lead/automation changes, see [integration verification](integration-verification.md).

## Scope

Story: a visitor or recruiter opens the local fictional website/demo, explores leads/proposals/projects/tasks/client views, and gets read-only behavior; actual CRM transaction and authorization logic are separately exercised inside embedded PostgreSQL.

Application source, dependencies, lockfile and existing infrastructure configuration were preserved. New files are the analysis reports; `.env.local`, generated content, build output, test output, and preview image are ignored local files. No feature implementation, live database writes, production deployment, GitHub push, account invitation, or provider send was performed. ApartmentHub was read only and none of its credentials were copied or used.

## Environment and checkout

- Original GitHub branch: `codex/directus-cms`.
- Original commit: `861f4039761b7eb3ea9de01a93ab48c4f07a1649`.
- 143 tracked blobs, all tree objects, and original commit verified against GitHub hashes; `git fsck --full` passed.
- One-commit shallow checkout via the connected GitHub app, with `origin` and tracking branch configured. Local native Git authentication is a separate account and needs adjustment for future private fetch/pull.
- Verification runtime: Node.js 22.20.0, pnpm 10.28.1, frozen original lockfile. Pinned tools are available locally; a private `.git/toolchain/pnpm.cmd` shim was used for this session because the default machine runtime/package manager differ.
- Local `.env.local` was copied from `.env.example`: demo mode and fixture content, with blank service credentials. Runtime checks explicitly set `APP_MODE=demo` and `CONTENT_SOURCE=fixtures`.

## Results

| Check | Result | Evidence |
| --- | --- | --- |
| Dependency installation | Passed | `pnpm install --frozen-lockfile`, 423 packages installed; tracked lockfile unchanged. |
| Lint | Passed | `pnpm lint`, exit 0. |
| Type checking | Passed | `pnpm typecheck`, Next route generation and `tsc --noEmit`, exit 0. |
| Unit tests | Passed | `pnpm test`, 5 files and 22 tests passed. |
| Database rules | Passed | `pnpm test:database`, 44 assertions using embedded PostgreSQL and the actual migrations. |
| Production build | Passed | `pnpm build`, successful compilation/type checking and all 27 static pages generated. |
| Demo response | Passed | `GET /demo` returned HTTP 200. |
| Read-only inquiry guard | Passed | `POST /api/inquiries` with empty test body returned HTTP 503 in demo mode before any service call. |
| Desktop rendering | Passed | Chromium screenshot of `/demo`, visible Overview heading, no JavaScript page errors. |
| Initial browser suite | 3 passed, 4 skipped, 1 timed out | `pnpm test:e2e --grep-invert 'anonymous visitors'`: desktop accessibility, demo navigation/search/client isolation, and mobile keyboard navigation passed; the 390px 16-page accessibility sweep exceeded its shared 30-second timeout. |
| Mobile accessibility retry | Passed | Same 390px test rerun with one worker and a 120-second timeout; all 16 pages passed in 23.4 seconds. Source tests unchanged. |

Across the initial run and targeted retry, all four demo browser tests passed. Four live tests were skipped; the live-mode anonymous-access test was excluded. The initial timeout is retained above as a local test-timing limitation rather than presented as an entirely clean first run.

The demo is running at [http://localhost:3000/demo](http://localhost:3000/demo). Opening it in the Codex browser panel was requested. [Local preview image](C:/Users/paule/OneDrive/Documents/ChatGPT/agencydesk/.local/demo-preview.png) records the fresh desktop inspection; navigation screenshots are under ignored `.local/browser-evidence/`.

## Limits

Embedded PostgreSQL emulates only Supabase's external Auth schema and does not verify real OAuth, email/WhatsApp delivery, hosted database state, or deployment infrastructure. Its single connection does not establish simultaneous hosted accepts. Those remain separate tests against the user's dedicated test resources.

Live browser tests require ignored invited test accounts and are skipped here. The anonymous-CRM test expects live mode to redirect to login; in demo mode CRM intentionally redirects to the demo, so that test is excluded consistently with the repository CI configuration. This does not imply live access was verified.

Node/Vite emitted nonblocking module/config warnings; all completed checks above exited successfully. Historical `artifacts/` verification files were not treated as fresh results and were not rewritten. All 143 tracked files remain identical to the imported commit.

Automatic messaging is absent in the baseline and has not been implemented or tested. A future messaging change needs fake-provider and database tests for event rollback, idempotence, concurrent claims, lease recovery, current consent, cancellations, uncertain sends, partial-channel failures, retries, and authenticated duplicate/out-of-order receipts.
