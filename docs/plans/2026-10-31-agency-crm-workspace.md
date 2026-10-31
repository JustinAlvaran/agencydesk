# Agency CRM workspace

Implement original English-only AgencyDesk components using the reference's interaction patterns, not its source, records, infrastructure or business content. Keep the existing emerald shell and server-authoritative actions. No additional runtime or schema.

## Acceptance

1. Leads opens as a readable stage board, with an alternate table. Existing search, owner, stage, archive and pagination URLs keep working. Counts explicitly describe the loaded page; total records remain authoritative.
2. Active board cards can change stage using a keyboard-accessible form. A status-only, authenticated, optimistic-concurrency update preserves company/owner/archive and rejects stale, archived or Won transitions. Won remains proposal-driven. Pending/error/success feedback is available.
3. Lead detail has a compact contact/identity rail, section navigation and a lead-scoped next-actions panel. Existing contact/assignment/archive, calls/callbacks, notes, message consent/suppression and reviewed drafts stay available. Tasks use existing create/complete actions; callbacks are reminders, not bookings.
4. Text wraps and controls remain reachable at 390px and 1440px. Empty previews share the real board component, load no records and expose no write action. No private CRM data enters a public preview.

## Sequence and checks

- Add failing action/query/render tests; implement guarded stage mutation and bounded lead-task query.
- Implement board and detail composition with scoped CSS; preserve existing domain rules.
- Run unit tests, scoped lint, type/build checks and serialized browser checks with empty preview/isolated test fixtures only. Never run credentialed customer tests.
- Independent read-only security/final review; exact allowlist and redacted credential scans; show desktop/mobile evidence before push.
- Publish a dedicated feature PR into preview, inspect Actions and Netlify on its SHA, leave draft for missing/red checks. Owner controls merge and production. No costs enabled.

Rollback: revert this feature commit; no migration, provider change or customer delivery activation. Public-card spacing shown in the owner's screenshots is a separate next-run priority already saved in the existing daily automation.

Ruling after visual review: show complete stage columns in a responsive grid (3/2/1 columns), rather than partial horizontally scrolling columns. This addresses the owner's explicit clipping complaint while preserving per-stage actions and loaded-page labels.
