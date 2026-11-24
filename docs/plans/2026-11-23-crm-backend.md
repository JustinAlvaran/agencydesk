# AgencyDesk backend implementation plan

**Goal:** Connect the owner's existing crimson CITC-based frontend to the established AgencyDesk backend, with real login, agency isolation and durable CRM mutations.
**Spec:** Owner-supplied Backend & CRM Logic Implementation Prompt, followed by explicit authorization to push all completed changes to the existing JustinAlvaran/agencydesk repository. The authoritative working folder is `C:/Users/paule/OneDrive/Documents/agency desk`. Preserve its design; use localhost:3000 only for the application.
**Architecture:** Reuse the repository's 15 ordered Supabase migrations and mature proposal/tenant/outbox boundaries. Keep the current Next 15 major version, patch it and React, add pinned Supabase SSR packages, and remove static export. Server layouts enforce access; existing client views receive serializable, agency-scoped data. REST handlers and Server Actions call the same database boundaries. No second auth framework or parallel CRM database.
**Execution:** Inline Superpowers delivery, focused read-only investigation, one independent security/code review before publication. Original frontend is retained under ignored `.local/frontend-before`; original repository source under ignored `.local/upstream`. Dependency installation must use a real local node_modules, not write through the donor junction.

## Acceptance cases

- Anonymous or unconfigured requests cannot read `/crm/*`, `/portal`, or their data APIs. Password, Google and GitHub auth validate real sessions and current database membership. UI role/MFA selections cannot grant access; mock credential values and timeout-based success are removed.
- Staff from one agency cannot read, mutate or relate another agency's records. Clients only access their company/project scope and published proposal versions. Tests exercise denial through direct table/RPC access as well as HTTP handlers.
- Inquiry and chatbot/contact intake validates bounded input, preserves explicit channel consent, uses durable idempotency/rate limits, and creates an internal event. No personal data in localStorage or logs, and no successful UI state before the server accepts the submission.
- Kanban updates validate UUIDs, stage and concurrency, derive probabilities/weighted totals on the server, and audit the change. Won remains linked to accepted scope; the UI cannot bypass proposal acceptance.
- Proposals use immutable published revisions/items, atomic version allocation and one-project conversion. Expiring, revocable, hashed capability tokens can expose only their intended published proposal and require explicit acceptance. Retrying acceptance cannot create a second project.
- Projects/sprints/milestones use scoped data and explicit review/approval gates. Private deliverables require authorized downloads; storage paths and browser-supplied IDs do not grant access.
- Integration metadata is separate from encrypted server-only credentials. Admins can save/test supported connections; no fake “connected” badges. Provider requests use documented endpoints and bounded/allowlisted egress. No real customer sends or activated recurring workers.
- n8n status callbacks verify signature, freshness, replay identity and agency/event relationship. AgencyDesk retains authoritative approvals, consent, leases, suppression and uncertain-outcome handling.
- Existing frontend CSS/colors/logo assets remain unchanged. Run the existing frontend tests, new auth/API tests, real PostgreSQL RLS/RPC tests, TypeScript, lint and `npm run build`. Browser verification uses localhost:3000 and fictional data.
- Publish only this complete folder's scoped changes to `preview`, with a preview-to-main PR. Preserve unrelated work in the former checkout. Hosted migration/provider setup and production release remain separately reviewed; do not claim live auth without evidence.

## Implementation sequence

1. **Foundation and reuse:** Attach existing Git history; isolate local dependencies/cache; restore Supabase migrations and backend tests; remove donor CMS/network build dependencies and static export; preserve frontend styling.
2. **Auth and access:** Adapt existing SSR clients, session refresh, membership routing, callback/confirmation/password setup and real login handlers. Split only server guards from the existing client shells.
3. **Database additions:** Add scoring/probability, audit/internal events, proposal capability tokens, sprint/review metadata and integration connections without replacing existing canonical tables. Use a CLI-generated migration; test cross-agency and client boundaries, immutability and idempotency.
4. **Frontend wiring:** Map database records to existing `src/types/crm.ts` view contracts; replace mock mutations, placeholders and hardcoded metrics with authenticated actions/API handlers and honest loading/error/empty states using the existing styles.
5. **Integrations and verification:** Implement safe configured connection checks and signed status synchronization; test failures without provider sends. Complete review, exact staged allowlist/secret scan, commit with Justin-only identity, push preview, update PR and monitor CI.

## Reuse sources and consequential decisions

- Primary reusable product is the existing `JustinAlvaran/agencydesk` preview source at `e5a1e46`. Its core schema must be combined with `20261005031707_agency_workspaces.sql` and subsequent hardening migrations; the original core alone is not agency-isolated.
- Keep canonical `proposal_series`, `proposal_revisions`, `proposal_items`, and `message_jobs`. Add capabilities around them; do not introduce a second proposal or delivery system just to match headings in the prompt.
- The existing staff model assigns one agency per staff account. Current database memberships govern authorization, never client-selected roles or editable auth metadata.
- Atomic CRM and LeadForge remain researched references for later UI/discovery modules; replacing the supplied finished UI is outside this backend task.
- Hosted account is restricted to kinggucci195@gmail.com. Public project binding and actual connection identity must be verified before hosted access. Local implementation and database tests can proceed without secrets.

## Verification ledger

Not yet complete. Record actual results and remaining hosted configuration here before publication.
