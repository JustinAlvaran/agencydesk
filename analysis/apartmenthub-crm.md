# ApartmentHub CRM reference analysis

Reviewed 14 October 2026. Reference root: `C:\Users\paule\Downloads\apartmenthub\apartmenthub`.

This is a static, read-only source review. It does not confirm live production state, execute senders, read customer records, or use ApartmentHub credentials. Only this report was created. `AGENTS.md`, `CLAUDE.md`, current source and `supabase/schema/current_schema.sql` were read; migration history was not used to establish current schema. Source locations below are relative to the reference root, with verified one-based line numbers.

## Main finding

ApartmentHub contains **three distinct CRM workflows**, rather than one reusable CRM module. Use their concepts as a baseline for AgencyDesk, but retain AgencyDesk's own identity, database, organization boundaries and provider credentials. Importing the entire reference would introduce real-estate entities, multiple staff authentication systems, historical integrations and internationalization that the user explicitly does not want.

| Workflow | Entry point and UI | Server/data model | What is useful for AgencyDesk |
|---|---|---|---|
| Intake pipeline | `/crm` redirects to `/crm/kanban`; `/crm/kanban/[id]` shows a lead | `/api/crm/leads`, `/api/crm/pipeline`; `leads`, `pipeline_stages`, `lead_events` | Configurable stages; per-pipeline validation; source tracking; assignment; timeline; board filtering |
| Sales prospecting | `/crm-admin#sales`; `src/app/crm-admin/sales/SalesView.tsx` and `SalesLeadDetail.tsx` | `/api/crm/sales/*`; separate `sales_leads`, phones, emails, properties, calls, notes and sent-email records | Multiple contact methods; call outcomes; follow-up prioritization; callbacks; scheduled appointments; tracked engagement |
| Rental operations | `/crm-admin#apartments`, `#candidates`, `#deals` and related tabs | `/api/admin/crm/*`; apartments, accounts, dossiers, people, documents, bookings, deals and invoices | Detail panels; private pinned notes; audit history; filtered segments; operational dashboards |

Evidence: `src/app/crm/page.tsx:7`; `src/app/crm-admin/page.tsx:251` lists the operational tabs; `supabase/schema/current_schema.sql:7321` explicitly documents that the prospecting tables are unrelated to `/crm/kanban`.

## Observed implementation

### Intake board and lead detail

- Lead types are `sale`, `buyer_intake` and `meta_ads`, mapped to three pipelines (`src/app/lib/crm-pipeline.ts:1`). Pipeline stages have a key, display label, position and color (`current_schema.sql:6982`). Stage rows are data, so exact production stage labels cannot be determined from this schema-only dump.
- A canonical lead keeps a source table/type plus source UUID, contact fields, current stage, assignee, source attribution and timestamps (`current_schema.sql:6676`). `(source_type, source_id)` is unique (`:8334`), preventing duplicate projection of the same intake record. This is source-record deduplication, not identity deduplication across all channels.
- Intake source records are projected into canonical leads through SQL triggers. For example, the Meta trigger updates contact data and preserves existing UTM attribution when later values are missing (`:4298`, particularly `:4327`). Buyer/valuation projection and a manual sync API also exist (`src/app/api/crm/leads/sync/route.ts:35`, `:100`). Buyer/valuation triggers run on insert; Meta runs on insert or update (`current_schema.sql:9447`, `:9463`, `:9471`). Do not assume all source edits stay synchronized identically.
- The board offers a type selector, search debounced by 300 ms, an assignee filter and drag-and-drop stage moves (`src/app/crm/kanban/client.tsx:36`, `:101`). Unknown stored stages appear in the first column with a warning; they are not silently rewritten (`:80`, `:361`).
- The update endpoint rejects viewers and checks the selected stage against the lead's pipeline (`src/app/api/crm/leads/[id]/route.ts:44`, `:69`). It also updates assignee/notes, but assignee values are not validated against the staff roster there (`:99`).
- Lead detail supports stage selection, assignment, private note creation and a chronological timeline (`src/app/crm/kanban/[id]/client.tsx:139`, `:154`, `:174`, `:193`). Notes become `lead_events` with an actor and `client_visible=false` (`src/app/api/crm/leads/[id]/notes/route.ts:48`). Database triggers set stage timestamps and record stage changes (`current_schema.sql:2270`, `:3832`, `:9451`). The stage-change trigger has no actor identifier and marks the event client-visible (`:2276`).
- React Query handles fetching, optimistic moves, invalidation and error notifications (`src/hooks/useKanbanQueries.ts:106`, `:156`). This is a reusable interaction pattern, but its rollback implementation needs correction before reuse: list keys include filters while the saved snapshot is fetched only with `["leads"]` (`:183`), then applied to every matching list on failure (`:215`). A filtered list can therefore lack its rollback snapshot.

### Sales prospecting

- A prospect stores name/company, owner, callback time, appointment time, deal outcome and source (`current_schema.sql:7294`). Phones, emails and properties are child rows; calls and notes record staff and timestamps. The detail API loads those relations together (`src/app/api/crm/sales/leads/[id]/route.js:10`).
- The board statuses mean: Other category, To call, No answer, Callback requested, Email sent, Interested link clicked, Interested, Appointment, Not interested (`src/services/salesLeads.js:11`). These Dutch internal keys should be replaced by AgencyDesk's vocabulary, not carried through an i18n layer.
- Rules are centralized in a service (`src/services/salesLeads.js`): entering No answer logs a call (`:106`); a no-answer call moves only a To call lead (`:126`); an invalid number moves to Not interested except when an appointment exists (`:127`); setting a callback moves only To call/No answer leads (`:140`). This pure decision-function structure is worth reusing.
- Callback columns sort by earliest callback, while Email sent/Clicked columns sort by oldest relevant activity; other columns prioritize contactable leads (`:57`). Property count is a real-estate-specific tie breaker.
- A callback can create a 15-minute calendar block. Calendar failure is best effort; the callback is still saved (`src/app/api/crm/sales/leads/[id]/callback/route.js:47`, `:64`). The existing calendar owner has an ApartmentHub fallback, which must not be copied (`:12`).
- A seven-day email aging calculation flags a follow-up **call** in the UI, not an automatic second email (`src/lib/sales/emailAging.js:5`, `:11`, `:51`). Time since follow-up is computed from the latest sent email (`:69`). This distinction matters when deciding which AgencyDesk actions should auto-send and which should create an internal task.
- A tracked-interest click uses a conditional update to claim the first click (`src/services/salesLeads.js:173`). It then changes the lead to Interested link clicked without checking its current stage (`:201`). Thus its practical behavior can overwrite a more recent manual state, despite the nearby stated preference that manual moves win.
- Marking Deal/No deal or deleting a prospect requires admin role (`src/app/api/crm/sales/leads/[id]/route.js:83`, and its DELETE handler). Assignment is otherwise a field any sales-authorized member can edit (`:77`). There is no own-leads-only enforcement in these endpoints.

### Rental CRM entities and derived pipeline

- `dossiers` are applications with draft/submitted/approved/rejected states (`current_schema.sql:6285`). `personen` belong to a dossier and represent tenant/co-tenant/guarantor; documents point to people (`:6906`, `:9723`, `:9818`). Those roles, income checks, passport fields and application requirements are property-rental domain logic.
- `accounts` are the operational contact records. They also hold mirrored JSON arrays for bookings, applications, offers, relationships and deal results (`:1213`). `apartments` carry their own mirrored offer/deal/booking arrays plus publication state and assigned staff (`:5524`). Several database triggers maintain mirrors (`:9575`, `:9579`, `:9583`, `:9603`). These are dependencies, not optional frontend conveniences.
- Account/application matching depends heavily on normalized phone spellings rather than a straightforward account-to-dossier foreign key. The helper chooses an exact phone match or the oldest matching account (`src/services/crmApplicants.js:13`). This is historical compatibility logic; AgencyDesk should use stable contact IDs and explicit relations.
- Internal contact notes support content, pinning, author ID, a retained author-name snapshot and timestamps (`current_schema.sql:5887`). The API protects all operations with candidate permission (`src/app/api/admin/crm/client-notes/route.js:27`, `:47`, `:82`, `:124`). This is an attractive general CRM feature.
- The apartments pipeline is **computed**, not simply the database publication status. It prioritizes deal outcomes, pending sent offers, incoming offers, drafts, closed/stale listings and active work. Old-month deals are history unless new current-month work exists (`src/lib/crm/pipelineStage.js:136`). The 14-day inactivity rule and Amsterdam month logic are domain decisions. AgencyDesk can adopt the principle that current actionable work outranks history, while using its own stages and business timezone.
- Applicant list/detail APIs provide search, pagination, dossier/person/document aggregation, create/update and archiving workflows (`src/app/api/admin/crm/applicants/route.js:68`, `:184`, `:229`; `src/app/api/admin/crm/applicants/[dossierId]/route.js:59`). Some paths deliberately fall back when archive-related fields are absent, another sign that source and schema may not always represent identical deployed revisions.

## Identity and permissions: do not import both systems

There are two separate staff identities:

1. `/crm` uses a random HttpOnly cookie session stored in `verkoop_sessions` and a phone-based `verkoop_staff_users` roster with agent/admin/viewer (`src/app/lib/auth.ts:47`, `:64`, `:78`). Pipeline APIs use `getStaffUser` and a privileged server client. Viewing does not restrict the roster/records to a specific team or assignee.
2. `/crm-admin` uses Supabase access tokens and active `crm_users` membership, with agent/admin/super_admin and module permission JSON (`src/services/crmAuth.js:120`, `:152`; `current_schema.sql:6183`). The service-role client bypasses RLS (`src/services/crmAuth.js:10`). Read/module guards cache membership for up to 60 seconds; admin checks read freshly (`:195`), while the super-admin guard currently uses the cached lookup (`:231`). Team endpoints require super-admin (`src/app/api/admin/crm/team/route.js:26`).

Permission keys are centrally enumerated, a useful pattern, but absent keys default to allowed except Collaboration (`src/services/crmPermissions.js:13`, `:37`). AgencyDesk should use one existing membership model, explicit action-level permissions and organization scoping. Adopt the single permission definition pattern while making new sensitive privileges opt-in.

## Concerns to address before adapting these patterns

| Concern observed | Evidence | Consequence for AgencyDesk |
|---|---|---|
| Intake tables have broad database grants; no RLS enable statement was found for `leads`, `lead_events` or `pipeline_stages` in the dump | `current_schema.sql:11334`, `:11340`, `:11388`; compare the explicit RLS enables beginning at `:10150` | Treat as a source security concern, not proof of live exploitability. Data API exposure settings were not inspected. Create scoped policies or private backend-only tables; API checks alone do not secure an exposed Data API. |
| Multiple staff/auth/lead systems | Files above and explicit table comment `:7321` | Do not create duplicate users or duplicate lead boards during integration. Map useful behavior onto AgencyDesk's model. |
| Status side effects are not transactional | `src/app/api/crm/sales/leads/[id]/status/route.js:43`, `:48`, `:55` | The comment claims atomic behavior, but calls, calendar operations and status update are separate requests. Use one transactional local command plus an outbox for external actions. |
| Some database errors are ignored | `src/services/salesLeads.js:108`; `src/app/api/crm/sales/leads/[id]/calls/route.js:42` | A stage can appear moved without matching activity, or an activity can be logged without the expected stage move. Verify every write and make retries idempotent. |
| Tracked engagement can overwrite a later manual stage | `src/services/salesLeads.js:201` | Track clicks as activities. Only advance eligible states with a compare-and-set condition; never reopen closed/lost/won leads automatically. |
| General pipeline list/sync reads are unpaginated; list search interpolates into a PostgREST expression | `src/app/api/crm/leads/route.ts:47`, `:55`; sync `route.ts:125` | Add pagination/batched sync and validate/escape structured filter inputs. Do not assume a single response includes every row. |
| Assignment and reads are broadly module-level, not per organization/record | Generic lead PATCH `:99`; sales permission checks | Ensure organization ID and resource ownership checks in every read/mutation and automation lookup. An assignee is workflow metadata, not sufficient authorization. |
| Trigger behavior can send or queue actions without an explicit UI send | `current_schema.sql:9543`, `:9547`; `crmApplicants.js:80` skips queued reminders after contact creation | Separate contact CRUD from outbound workflows. Define exactly which event starts a sequence; an ordinary imported/manual contact must not accidentally send. |
| Legacy schema descriptions and integrations survive | Apartment `generate_offer` still describes n8n (`current_schema.sql:5588`); AGENTS/CLAUDE say n8n switched off 30 September 2026 | Port observed current route/provider flow rather than assuming old comments or trigger bodies describe enabled operations. No n8n/Salesforce/ApartmentHub infrastructure should enter AgencyDesk. |

These are static observations, not a full security audit or live production verification.

## Proposed AgencyDesk adaptation (not implemented here)

Start with a single CRM foundation: contacts/companies, leads or opportunities, configurable pipelines/stages, assignments, activities/notes and follow-up tasks. Every row should use AgencyDesk's existing organization/account identity. Use explicit contact-to-lead links; keep external source IDs only as attribution/deduplication metadata. Prefer normalized child tables over mirrored JSON arrays for calls, appointments, recipients and offers.

Use one command/service to change a stage, validate allowed transitions and access, append an activity with actor/from/to/reason, and queue any eligible automation in the same local transaction. Keep decision logic pure and unit-testable, following the useful `statusAfterCallOutcome` / `statusAfterCallbackSet` approach. Make deadlines and aging thresholds configurable rather than carrying across the Dutch rental or seven-day sales rules unchanged.

Connect sending through a provider-neutral server interface using AgencyDesk-owned connections/keys. CRM rules should request an intent such as `sendTemplate`, `sendMessage` or `createFollowUpTask`, while an adapter translates that intent to the selected WhatsApp/email/Hermes provider. This report does not select a Hermes API contract: inspect the AgencyDesk target and the user's actual provider documentation before implementing an adapter. No ApartmentHub provider account IDs, calendar owners, template IDs, fallback email addresses or keys should be copied.

Recommended first feature slice: board + lead detail + private notes + call outcomes + callbacks + follow-up task aging. Then add explicit template-driven automatic sends, a durable job/outbox, deduplication, retry/cancel handling and delivery history. Keep the UI in one language, with no i18n dependency.

Exclude for now: apartment listings, tenant household roles, rental income qualification, identity-document extraction, rental offers/LOIs, Dutch tax/commission formulas, property-specific matching, Salesforce rollback machinery, n8n, SEO/marketing publishing and partner-property portals. Revisit only if AgencyDesk has a concrete equivalent requirement.

## Verification scope

No lint/build/test suites or development server were run against ApartmentHub, because the task was static reference analysis and this app can trigger external workflows through routes or database events. The findings were verified against current local source and the designated schema dump, with no production reads or writes. Existing README/AGENTS verification notes are partly stale: `CLAUDE.md` and `package.json` now describe/run numerous unit suites, so do not infer that the project has no unit tests from the older AGENTS statement.
