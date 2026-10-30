# AgencyDesk n8n research and local pilot — 30 October 2026

> Follow-up: the queue boundary and manual n8n draft are prepared for review. See [the queue integration contract](2026-10-30-n8n-queue-boundary.md) for implemented behavior, evidence and activation gates. Original pilot observations below are historical.

## Decision and scope

Use local n8n Community as an internal orchestration service with official project-local n8n skills and native instance-level MCP. This is a reversible local pilot, not production CRM integration. No SaaS trial, subscription, license key, paid gateway, customer data or delivery credentials required. User chose local n8n/MCP; primary recommends retaining existing AgencyDesk queue and guards.

Alternatives reviewed: (1) native MCP + official Apache-2.0 skills (selected: fewer processors and no extra management server); (2) czlonkowski n8n-mcp/n8n-skills MIT tooling (optional later for offline node documentation/validation, not installed; current third-party MCP telemetry includes sanitized workflow structures and needs explicit opt-out); (3) keep only current code queue (lowest runtime burden, less visual orchestration). No second CRM or outbound queue.

n8n core is source-available under its Sustainable Use License, distinct from the Apache-2.0 skills. Pilot use is the owner's internal agency operation. This is not permission to resell n8n editor access or embed it in a customer SaaS; OEM/product-backend terms must be reviewed before such scope. Local PC/Docker must be running for jobs; installation does not provide hosted uptime or a free messaging/AI allowance.

## Observed repository behavior

- Public intake:src/app/api/inquiries/route.ts and supabase/functions/inquiry/index.ts validate service/budget/channel preferences and configured agency. Existing intake sources are website/website_chatbot; new integrations need truthful provenance.
- supabase/migrations/20261015092017_website_intake_idempotency.sql implements submission-id replay handling, not general person/contact identity merging. Stable event IDs and changed-payload conflicts must be preserved.
- Transactional automation migrations/outbox already generate uniquely keyed event/rule/channel jobs. src/app/crm/automations/actions.ts retains staff approval/cancel/admin controls.
- supabase/functions/automation-worker/index.ts authorizes an agency-bound cron secret or verified admin JWT, claims one job at a time (maximum5/invocation), revalidates and finishes a lease. Never duplicate provider calls in n8n or auto-approve jobs.
- Worker mode comes from server AUTOMATION_DELIVERY_MODE. JSON{mode:dry_run} does not override it; checking the returned mode after a dispatch would be too late. No scheduler is connected in this pilot.
- The untracked 20261020005201_automation_operating_limits.sql is0bytes as observed locally. It establishes no operating caps or deployed guarantee.
- Signed delivery receipts ignore incoming chat; they are not a shared inbox. Lead callback tasks are not calendar bookings. Shared inbound identity/state, human takeover and authoritative booking remain separate implementation work.
- Current source evidence only: no Supabase account/provider/database/deployment access during this research.

## Installed and prepared

- Official image2.45.6, released29October; pinned registry digest sha256:45edf89655fd66dd55ea9336c1791ad14777599fdbf6c5aec6db583ede99a40b.
- infra/n8n/compose.yaml:one n8n service, SQLite, loopback127.0.0.1:5678, own Docker-managed named volume agencydesk-n8n-state (outside the OneDrive repository), Manila timezone, no automatic boot restart, read-only root/tmpfs, dropped capabilities, resource/log caps. No privileged Docker-in-Docker, SearXNG, Docker socket, repo mount, WAHA/provider mount or public tunnel. Independent review identified OneDrive sync as an unverified risk for a repository bind mount; switched to this dedicated Docker volume before first startup, without reading/moving any existing credential stores or changing global sync settings.
- Telemetry/templates/version notices and community packages disabled; environment/internal-file access blocked. Command/local-file/read-write/code nodes excluded for this pilot. This reduces capabilities; it is not a network air gap or complete sandbox for untrusted workflows.
- Fifteen plain official skill directories under .agents/skills, pinned27b6b9f429ac0be90cae764512dbc579d7107e95, Apache license/provenance retained. No upstream plugin scripts/hooks/global installation run. Owner free-only/consent/approval policy overrides upstream Gateway-credit or other defaults.
- .codex/config.toml configures native endpoint http://localhost:5678/mcp-server/http. Initially disabled; enabled after the owner completed setup and explicitly approved persistent MCP authorization. Strict OS keyring storage, workflow:read/workflow:write only, fixed generated callback port51989 and prompt approval mode. No tokens/staticheaders/clientsecret in Git or OneDrive. Native tools have not loaded in the current chat; reload is still needed before authoring-tool verification.

## Dependency order and acceptance

1. Local prerequisite:validate Compose, image digest and confined mounts/loopback port, start only AgencyDesk service, GET health/readiness and owner setup UI. Owner completed local account creation privately; no Google/n8n Cloud subscription or emailed password needed. No SMTP means no email reset flow.
2. Owner enables native MCP in Settings > Instance-level MCP. Leave automatic workflow exposure off. In Connect choose Codex/OAuth, use its actual callback URI in Only trusted URLs, grant only needed permissions. Owner explicitly approved enablement and the final native OAuth grant succeeded. Only workflow:read/workflow:write were requested and granted through Custom scope selection. CLI used an AgencyDesk-local scratch CODEX_HOME with explicit server/keyring overrides; Windows Credential Manager holds the grant for the exact server name/URL, with no credential-file fallback. UI confirms Enabled, one trusted callback http://127.0.0.1:51989/callback, one Codex client with list/create/update rights and0enabled workflows/agents. No global MCP/CLI configuration modified. Missing execution scope does not mechanically prevent every side effect: workflow write tools may publish/activate; keep pilot workflows manual-only/unpublished and review actual tool semantics before any change. Current-chat tool reload and actual authoring-tool calls remain pending; this is not an executed workflow test.
3. First workflow after authentication:inactive Manual Trigger with fictional event, schema/consent checks, a mock adapter on the AgencyDesk-only Docker network (container localhost is not the Windows host) and redacted dry-run result. No live CRM write/provider node. Replay same stable event twice:one simulated proposed action; changed payload conflicts; opted-out/invalid/foreign-agency cases refused. Validate, inspect saved connections, run with fictional data and keep unpublished. No claim that this workflow exists yet.
4. Before recurring queue integration:implement real operating caps/safe cap deferral and a fail-closed dry-run-only worker/health boundary. No service-role key in n8n. Verify scheduler credential/agency binding, pending-approval unclaimed, consent/suppression/foreign-agency skipped, simultaneous/replayed invocation doesn't duplicate and uncertain lease never automatically resends. Assert0provider HTTP calls. Keep activation off until tested and owner credential approval.
5. Later:reviewed external lead-source adapter with signed event envelope and durable dedupe; minimal source/agency provenance, no personal-data scraping. Then authenticated inbound state/cross-channel cancellation and human takeover. Booking needs calendar authorization and authoritative slot/idempotency handling. AI only proposes reviewed actions; no broad CRM/SQL/provider tools on public chat.

## Owner steps and rollback

Open http://localhost:5678 and complete local owner setup using the owner's AgencyDesk email and a password entered only in that page. Optional free registration is not a Cloud trial. Account setup and scoped OAuth are now complete. Reload this trusted AgencyDesk chat/session to load its project-local MCP and skills; then verify native tools before creating the fictional pilot workflow. No paid upgrade needed for this pilot. Do not connect Gmail/WhatsApp/Supabase credentials yet.

Start from AgencyDesk root:docker compose -f infra/n8n/compose.yaml up -d. Stop only this pilot:docker compose -f infra/n8n/compose.yaml stop. Never use down -v, remove the named state volume or export decrypted credentials. An unused .local/n8n/data directory created before review is not the runtime store. Persisted data/config/encryption key must be backed up together before upgrade, from the stopped instance, without printing private contents. Removing MCP/skills does not revoke grants; revoke a client in n8n settings when retiring it. Production AgencyDesk/PR4/UI remain separate and unchanged.

## Primary sources

- https://github.com/n8n-io/n8n/releases/tag/n8n%402.45.6
- https://github.com/n8n-io/n8n/blob/master/docker/images/n8n/README.md
- https://docs.n8n.io/deploy/host-n8n/install-options/install-using-docker-compose
- https://github.com/n8n-io/n8n/blob/master/LICENSE.md
- https://docs.n8n.io/deploy/host-n8n/community-edition-features
- https://docs.n8n.io/deploy/host-n8n/deploy-as-an-oem-integration
- https://github.com/n8n-io/skills/tree/27b6b9f429ac0be90cae764512dbc579d7107e95
- https://docs.n8n.io/connect/connect-to-n8n-mcp-server.md
- https://docs.n8n.io/connect/connect-to-n8n-mcp-server/mcp-client-examples.md
- https://docs.n8n.io/hosting/configuration/configuration-examples/isolation/
- https://github.com/czlonkowski/n8n-mcp/blob/main/PRIVACY.md
- https://learn.chatgpt.com/docs/config-file/config-reference
- https://learn.chatgpt.com/docs/build-skills

## Actual local verification and limitations

Compose configuration validates; official registry digest matches downloaded2.45.6 image. Own containeragencydesk-n8n-local is running/healthy; only5678/tcp is published to127.0.0.1. GET /healthz, /healthz/readiness and /setup all200. Anonymous browser verifies local owner form/email/password controls,0mutating requests and an inspected blank-form screenshot; user subsequently created the owner account themselves. The signed-in native browser confirms version2.45.6 and saved CodexMCP grant/exposure counts. No existing credential/data volume contents inspected.

First startup failed because read-only root lacked /home/node/.cache; fixed by a bounded owner-only tmpfs at that exact path. An external-runner experiment failed without an auth token and was reverted; no extra token/runner service created. Current internal mode uses n8n defaults and emits a missing-Python-runner warning despite the Python-node flag; Code node is excluded, so Python/Code execution is not a verified pilot capability. This is not whole-runtime/production readiness. No paid gateway, customer message, actual lead, appointment or CRM/provider credentials added.

Fifteen skills/82public files installed plain/project-local. Representative router, lifecycle and credentials skill byte hashes exactly match pinned upstream. Independent reviewer addressed the OneDrive storage concern and deprecated webhook variable; final source review found no remaining actionable defect in reviewed scope. A reported encoding issue was retracted after raw-byte equality verification. No global plugin hook installation or third-party MCP processor. No full dependency/image-history/Git-history/deployed-asset audit.

Publication scope is tooling/configuration/research only, separated from PR4 and all hosted-chat/globals/Supabase WIP. Fresh app build/UI tests are not claimed for this configuration-only slice; existing remote CI has a separate Deno setup/authorization gate. No production or Supabase state changed.

Pinned skill reference TypeScript examples are documentation. Compiler file discovery reports0.agents files; eslint.config.mjs explicitly ignores.agents/** so lint does not treat upstream examples as app code. All80upstream skill files match pinned GitHub Git-blob hashes byte-for-byte; LICENSE/provenance are retained separately. Whole-vendor git diff --check reports existing upstream whitespace/EOF warnings; owner-authored configuration/docs pass the scoped whitespace check. No upstream bytes normalized or hooks executed.

Final scoped checks: own verification checkout typecheck (fixture content preparation, Next route type generation, tsc --noEmit) exits0. Fresh full lint was interrupted after stalling without diagnostics; no lint pass or full app build/e2e claim. The n8n local runtime/readiness/blank-form/OAuth verification is separate from Next app checks.
