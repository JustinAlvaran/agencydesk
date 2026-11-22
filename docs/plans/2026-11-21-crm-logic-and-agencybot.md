# AgencyDesk accounts, lead discovery, and AgencyBot plan

Status: proposed implementation, grounded in local source and independently reviewed architecture. No feature implementation, hosted Supabase inspection, migration, provider connection, or production deployment is claimed by this document.

## Owner decisions

- One internal agency, with staff and invited clients. No self-service multi-agency SaaS onboarding.
- Bigin-inspired name/email/password account entry, HubSpot-inspired product presentation, original AgencyDesk logo, and AgencyBot.
- Gmail, WhatsApp, and Instagram belong to the later integration roadmap. Do not connect or activate them in this slice.
- Target industry/geography remains unspecified. Discovery must accept user-entered criteria rather than silently target a market.
- Work within existing Next.js 16.3.8, React 19.2.8, TypeScript, Tailwind 4, Supabase JS 2.117.2 and SSR 0.12.7. No orchestration service or dependency is required merely to write this plan.

## Existing foundations and limitations

| Area | Evidence in repository | Design consequence |
| --- | --- | --- |
| Authentication | `src/lib/auth.ts`, `src/app/login/actions.ts`, `src/lib/login-destination.ts` | Password/Google login exists. Unassigned accounts do not gain workspace access. |
| Invitations | `supabase/functions/admin-invite/index.ts`, `src/app/auth/confirm/route.ts`, `src/app/auth/password/page.tsx` | Invites already create an Auth identity and membership, then allow password setup. Do not call signUp again for that identity. |
| Isolation | `supabase/migrations/20261005031707_agency_workspaces.sql` and later policy migrations | Staff belongs to one agency. Clients see assigned companies. Preserve agency IDs, RLS and parent-record guards even for the owner's single-agency deployment. |
| Leads | `src/lib/leads/workflow.ts`, `src/app/crm/lead-actions.ts`, `src/app/crm/lead-stage-action.ts` | Operational leads require contact name, email, service and brief. Manual creation and stage changes have existing guarded commands. Won remains proposal-driven. |
| Messaging | `supabase/functions/_shared/automation-worker.ts`, `_shared/delivery.ts`, outbox migrations | Source includes permission, suppression, approval, leases, receipts, retry and uncertain-outcome safeguards. Do not duplicate or bypass them. Hosted configuration is unverified. |
| Public assistant | `src/components/service-assistant.tsx`, `src/app/api/service-chat/route.ts`, `docs/service-assistant.md` | Guided services help exists. Public AI activation is separately gated. A2UI is a demonstration, not an authenticated agent backend. |

## 1. Accounts and access

Recommended first implementation is invitation completion, matching the chosen internal-agency model. Present name, email and password in the requested sign-up design. After a valid invite is exchanged, show the verified account email read-only, accept a display name and new password, and preserve the assigned membership. Use Supabase Auth for passwords. Store only a bounded nonprivileged display name in user metadata or an owner-readable profile, never in authorization claims.

Flow: administrator selects existing agency/company and role → invitation → verified invitation session → name/password setup → existing membership-aware destination. Invite/recovery tokens must not enter analytics, screenshots, chat, logs or browser persistent storage. Keep allowlisted redirects and no-store responses.

Unauthenticated visitors without an invitation see an access-request explanation or contact path, not a fake successful registration. If public account registration is later explicitly chosen, implement verified identity → pending access, plus a separate admin-only way to assign an existing identity. Do not grant first-user admin, auto-create agencies, infer access from email domains, or trust browser role/agency values. The present generateLink flow is not an existing-user membership assignment API.

Sign-in uses email/password and retains existing routing and denial behavior. New-password setup follows the existing 12–128 character rule; do not raise the login minimum and lock out older valid passwords. Add a proper recovery-request screen with generic responses and rate limits; reuse verified recovery/password routes. Email delivery, redirect settings and hosted Auth configuration require separate verification before claiming end-to-end readiness.

Acceptance: valid and expired invitation, wrong-session email, missing membership, disabled staff, client-only access, replays, recovery, edited role metadata, external redirect attempts, and name/password errors. A client cannot open staff routes or another company's records. Recovery cannot grant membership.

## 2. Prospect discovery and qualification

Separate business research from existing leads. Add a staff-only Discover page and review inbox. First release supports manually supplied business URLs and validated CSV import with fictional fixtures for tests. A real search adapter follows only after a provider/source, permitted use and free quota are verified; an unconfigured provider must report unavailable, not invent results.

Input: industry, location, service need, optional business keywords, exclusions and bounded result count. Proposed initial server caps: 25 candidates per run, 3 concurrent fetches, 10-second fetch deadline, 1 MB response limit and 5-minute run deadline. These are implementation defaults to tune, not existing limits. Free capacity exhaustion stops work without upgrades or automatic spending.

Pipeline: validate criteria → collect permitted public business sources → normalize facts → detect duplicates → evaluate explicit fit criteria → show reviewable candidates → import selected candidates. Every displayed fact needs a source URL and observation time. Distinguish observed facts from inferred fit reasons. Unknown email/contact/service need stays unknown; no guessed emails or fabricated briefs. Explain scoring criteria and evidence coverage; do not present an opaque model score as certainty.

Proposed additions, subject to migration review:

- `prospect_runs`: agency, requesting staff, criteria, status, cursor, timestamps, bounded usage and redacted failure category.
- `prospect_candidates`: agency/run, business name, normalized website/domain, location, optional contact information, review status, version and eventual lead link.
- `prospect_evidence`: agency/candidate, public source URL, observed fields, retrieval time and short relevant excerpt. Avoid storing whole pages.
- `prospect_imports`: agency, command UUID, payload hash, candidate/version and resulting lead ID. Unique command keys prevent replay duplication.

Candidate states: discovered → needs information / ready for review → imported / dismissed. Run states: queued → running → completed / partial / failed / cancelled. Cancellation prevents future batches; preserve already committed results with their status.

Use agency-scoped normalized domain/contact keys for duplicate suggestions. Shared domains alone must not automatically merge distinct people or business locations. On import, recheck membership and candidate version, validate the existing required lead fields, choose a valid staff owner, then create the lead and mark the candidate imported in one transaction. Reuse or factor the current manual-lead command contract; do not POST discovered records through public inquiry intake. Staff enters an honest research brief. Missing required details keep the candidate in review.

Publicly listed contact information is not channel permission. Imported records start without email/WhatsApp opt-in unless documented permission is recorded through existing controls. Importing never queues outreach.

Fetch controls: HTTP(S) only, public destinations only, block loopback/private/link-local/metadata addresses, revalidate DNS/redirect destinations, reject credentialed URLs and unsupported content, bound redirects/body/time, sanitize displayed output. Imported pages cannot change tool permissions. CSV preview must show field errors and escaped content; guard formula injection on later exports. Proposed abandoned-candidate retention is 30 days, subject to owner approval and an actual cleanup mechanism before promising deletion.

Acceptance: missing contacts, unsupported source, source failure, duplicates within and across runs, concurrent/replayed import, stale candidate, cross-agency candidate ID, malicious page instructions, private-address URL, cancellation, limits and no-consent conversion. Existing lead stage/proposal/project behavior must still pass.

## 3. AgencyBot and orchestration

Use one server coordinator with small typed tools. Specialist roles are bounded steps, not separate agents with database credentials:

1. Research step collects source-backed business facts.
2. Qualification step explains fit and missing information.
3. CRM assistant reads authorized pipeline/tasks and prepares proposed changes.
4. Policy/command layer validates scope, confirmation and current record state before applying an allowed change.

Public mode has published service knowledge and explicit inquiry handoff only. Staff mode rechecks session, active agency membership and permissions on every call. Client mode, if added later, can read only shared company records and cannot call discovery or staff tools. Do not share conversation memory across users or agencies.

Proposed tool contracts: `searchProspects(criteria)`, `getProspectEvidence(candidateId)`, `searchLeads(filters)`, `getLeadSummary(leadId)`, `listFollowUps(filters)`, `proposeLeadImport(candidateId, version, fields)`, `proposeFollowUp(leadId, draft)`. Each server implementation derives agency/user scope; a model-supplied agency ID is ignored. Do not offer arbitrary SQL, shell, browser credentials, role changes, bulk export, message send or approval tools.

Mutation protocol: proposal created with exact changes, actor, agency, record version, expiry and input hash → human reviews that proposal → authenticated command revalidates it → idempotent application → explicit receipt. Editing, record changes, expiry, revocation or changed permissions invalidate approval. A model cannot mark its own proposal approved. Queueing a draft and successfully sending a message are separate outcomes.

Persist bounded run/tool audit metadata with correlation IDs and redacted errors; avoid raw prompts, tokens, passwords and full messages. An optional private action-proposal table must have agency/user scope, expiry and consumed-state checks. Start with structured actions and the existing guided assistant if no verified free model is available. Local subscriptions/plugins do not establish a free production model endpoint.

If later using n8n, keep it an internal coordinator calling narrow AgencyDesk endpoints through its dedicated credential. Keep native provider sends and authoritative SQL outside the workflow. Existing server-side dry-run mode and outbox protections remain required; no scheduler or agent activation is included here. Pstack and REA were not found among available tools; no claim of using or installing them is made.

Acceptance: hostile instructions in a source, inaccessible lead IDs, client requests for staff data, revoked user mid-run, stale/replayed confirmation, expired proposals, cancelled run, model timeout and unavailable provider. UI must distinguish researched, proposed, applied, queued, delivered, failed and unknown outcomes.

## 4. Connections roadmap — deferred by owner

Design a Connections screen for Gmail, WhatsApp and Instagram, but keep actual account linking and synchronization out of the first implementation. Later verify each platform's official API, eligible account type, scopes, app-review requirements and costs. Google sign-in is not Gmail authorization. Do not promise full inbox access or Instagram discovery from a connector label.

Proposed connector metadata: agency/provider, owner, external account ID, granted scopes, state, last verified sync and redacted error. Secrets belong in a server-only approved secret store, not that public metadata row. OAuth state is bound to the current session/agency and expires; use PKCE where supported. Verify webhook signatures, timestamps and replay IDs. Sync needs cursors, idempotent external IDs, explicit field-conflict rules, cancellation and disconnect/revocation handling. Define consent and retention before importing conversations.

States: not configured, connecting, connected, reconnect required, syncing, failed, disconnected. Connected requires a successful scoped provider check. Disconnect blocks queued connector work before further calls. Any future outbound delivery reuses AgencyDesk's review/consent/suppression/outbox boundary.

## Delivery sequence and observable checks

1. **Invitation/account experience:** adapt `src/app/login/page.tsx`, `src/app/auth/password/page.tsx`; add a small name/password completion action and recovery request route; preserve `auth/confirm` and `loginDestination` boundaries. Add focused unit and browser tests for invitation completion, form errors and inaccessible accounts. No public self-service agency creation.
2. **Prospect inbox:** proposed `src/app/crm/discover/page.tsx`, `src/lib/prospects/{schema,normalize,import}.ts`, typed server actions, and reviewed migration generated with the installed CLI. Start with local fixtures/manual input. Add source URL validation, transactional duplicate/replay and RLS tests before an external search adapter.
3. **AgencyBot:** proposed `src/app/api/agency-bot/route.ts`, `src/lib/agency-bot/{tools,policy}.ts`, and UI adapted from existing assistant/A2UI patterns. Start read-only and proposal-only, then confirmation execution tests. Keep public help separate.
4. **Integration adapters:** Gmail, WhatsApp and Instagram only in a later owner-selected slice, with sandbox/account-specific tests and separately authorized activation.

Run appropriate existing lint, typecheck, unit, database, Edge and Playwright checks; do not claim pass results for work only planned. Test discovery imports with disposable database fixtures and no customer sends. Verify mobile/desktop forms and empty/error/loading states. Independent security review, exact staged allowlist, redacted secret scans and preview → main review apply to each publication. Owner controls merge and production deployment.

Supabase plugin tools are present, but this planning pass did not verify the required kinggucci195 account identity and AgencyDesk project binding. No hosted project enumeration, database access, token inspection or connection was attempted. Complete that verification before provider operations. Existing migrations are evidence of source behavior, not proof of deployed configuration.

Rollback: frontend changes revert through preview. Stop research/coordinator jobs before reverting command implementations. Preserve source provenance, import receipts and message history; use reviewed forward database migrations rather than deleting evidence or retrying unknown sends. No new paid service is approved.

## References and review

- [Supabase password authentication](https://supabase.com/docs/guides/auth/passwords): signup, confirmation and recovery semantics.
- [Supabase user data](https://supabase.com/docs/guides/auth/managing-user-data): profile data and Auth user references.
- [Supabase SSR client](https://supabase.com/docs/guides/auth/server-side/creating-a-client?queryGroups=framework&framework=nextjs): cookie/session integration.
- [Supabase changelog](https://supabase.com/changelog): checked for relevant Auth/tool changes; no dependency upgrade proposed.
- Independent read-only architecture review confirmed the membership model, discovery/lead separation and command/outbox invariants. Scope was local source/migrations only; no hosted-state or credential audit.
