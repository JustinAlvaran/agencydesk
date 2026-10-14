# Lead and automation implementation

Implemented locally 14 October 2026 on branch `codex/leads-automation`, extending original commit `861f4039761b7eb3ea9de01a93ab48c4f07a1649`. Three subagents handled the lead workflow, automation schema, and Hermes/provider research, with additional integration audits.

## Delivered

- Live lead table/board, validated owner/stage/search filters and stable 25-row pagination.
- Manual lead capture with actor/payload-bound retry protection; contact/phone/channel permission editing.
- Call outcomes, callback tasks, owner fallback, closed/Won protection, and transactional activity history.
- Optional website email/WhatsApp permissions persisted before inquiry event capture.
- Four disabled rules: inquiry acknowledgment, proposal notice, delayed proposal follow-up, accepted-project confirmation. Approval is required by default.
- Transactional frozen message jobs, signed-in staff preview/approval/cancellation, admin configuration and known-safe failure reset.
- A worker which claims one job at a time, revalidates eligibility, processes up to five jobs per invocation, records dry-run separately from acceptance, and never blindly retries ambiguous sends.
- Own-account Resend email and Meta positional-template adapters; bounded rate-limit retries, stable email idempotency key, sanitized error codes, HTTPS own-origin portal links.
- Authenticated delivery callbacks, complete atomic receipt batches, duplicate/early/out-of-order receipt handling, and staff-only history.
- Read-only interactive automation preview, setup pages, exact own-account activation documentation, and CI Edge tests.

ApartmentHub supplied lead outcome, callback, approval, reminder guard and durable-job concepts. Its credentials, destinations, sender identities, customers, real-estate data model, auth systems, n8n/Salesforce infrastructure, and i18n were not imported. Hermes was researched from official sources; it is optional for future drafting/triage and is not installed or connected.

## Fresh verification

| Check | Result |
| --- | --- |
| Lint | Passed across the project. |
| TypeScript / Next route types | Passed. |
| Unit tests | 44 passed across 7 files. |
| Embedded PostgreSQL | 275 passed: 44 baseline + 158 automation + 49 lead workflow + 24 intake/batch/reset assertions. |
| Edge worker / receipt tests | 11 passed with no network permission and own fictional fixtures. |
| Deno type checking | Inquiry, worker and receipt functions passed. |
| Production build | Passed with 32 static pages. |
| Browser | 6 passed on desktop/mobile; 4 live-account tests skipped. Live-mode anonymous-CRM test excluded consistently with existing demo CI. |
| Whitespace / diff | `git diff --check` passed. |

The browser suite verified that sample dry-run interactions issue no write requests, skip accepted proposals or missing permission, and remain accessible without horizontal page overflow. The wider demo flow, client sample isolation and mobile keyboard navigation also passed. After adding the shared workspace shell to the automation demo and setup pages, both automation browser tests passed again; desktop/mobile screenshots show the navigation, styled controls and simulated result, with no browser page errors. The existing multi-page accessibility sweep now has an explicit two-minute test timeout.

Database tests execute actual migrations, RLS, privilege checks and commands using embedded PostgreSQL; only Supabase Auth's external schema is emulated. They cover event rollback, approval/consent/expiry/archival/membership guards, duplicate attempts, current recipient changes, lease ownership/recovery, bounded retries, receipt replay and cross-role denial. Single-connection tests do not prove simultaneous multi-session lock behavior; retain the existing dedicated hosted verification process before production rollout.

## Activation and limits

All implementation is local. No hosted migration, deployment, account creation, real provider send, or GitHub push was performed. Frontend currently runs in demo/fixture mode with blank service values. Apply the three prepared migrations to the user's AgencyDesk database, deploy updated inquiry/worker/receipt functions, configure the user's own provider secrets and HTTPS origin, and add an authenticated scheduler before enabling delivery. [Exact setup guide](../docs/messaging-setup.md).

Live rules begin disabled. Simulated jobs never replay as real sends. Known configuration/rejection failures can be reset only by an administrator, remain bounded to five attempts, recheck eligibility and regain approval when required. Unknown outcomes and acknowledged/receipt-failed messages require provider reconciliation. A stale queue row can end a worker tick early; the next scheduled tick continues.

Provider tests use injected fake HTTP responses; they do not establish DNS/domain verification, real Meta template approval, account billing, real receipt delivery, hosted Auth or production state. Inbound replies, conversation handling, full marketing campaigns, dynamic pipeline creation, invoicing, and a Hermes AI connection are outside this first implementation. No i18n was added.

Local preview: [automations](http://localhost:3000/demo/automations). The live screen is `/crm/automations` after own-project setup.
