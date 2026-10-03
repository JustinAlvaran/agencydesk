# AgencyDesk content workflow

Directus owns public copy only. Supabase owns business data, identities and live
memberships. Directus and Supabase accounts have separate sign-ins.

## Editors

- Site settings: default search listing and inquiry introduction.
- Home page: headings and descriptions for the existing homepage sections.
- Services: ordered service cards with three plain-text bullet points.
- Sample projects: fictional descriptions, ordered cards and a fixed demo scenario.

Navigation URLs, inquiry service identifiers, layout and fictional disclosures
remain in code. Plain text is rendered as escaped React content.

## Drafts and publication

Open an item, select the native draft/version, edit, then save the draft. Publish
promotes the version into main content. Direct API draft saves use the pinned
release's `/versions/{id}/save`, not an item PATCH with a version query.

The published API reader cannot read versions, revisions or accounts. The
preview reader can read versions for only these four collections and cannot
write content. Anonymous API access is disabled. Owner credentials are never
deployment credentials.

The protected `/crm/content-preview` requires a currently active Supabase admin.
Choose a collection, item ID and version key (`main` for current published copy).
Preview is dynamic, uncached and excluded from indexing. Its URL carries no token.
Open it in a separate tab; the app's framing protections remain enabled.
The native collection preview URL points to this protected production route.

Publishing content and deploying the website are separate outcomes. The first
production release uses published CMS content. Automatic rebuilds still await
private hook approval/configuration; publishing alone currently saves CMS
content without updating the deployed website. A new production Git/CLI build
reads fresh CMS content. The owner rebuild button stays disabled until connected.

The prepared publication Flow uses the pinned `items.promote` action, scoped to
the four content collections. A separate Flow handles visibility-only updates.
Promotions also emit item updates, so the guards route each change once. Draft
saves update native versions and do not request a build. Flows use an allowed
Render environment variable for the private hook, and record activity without
storing hook URLs or response payloads. Both Flows currently remain inactive.

Revision restoration in 12.4.1 updates main content instead of emitting a
promotion. After restoring a content revision, use **Rebuild website**. Ordinary
main-copy edits also require that explicit rebuild; use native drafts and
promotion for the normal editing workflow.

## Build contract

`APP_MODE` controls business data. `CONTENT_SOURCE` independently selects public
copy. Development, CI and previews default to fixtures. Production switches to
`live/directus` only after the hosted gate passes.

`pnpm content:prepare` prepares an ignored public-only snapshot before development,
type checks and builds. A Directus build uses explicit fields, capped lists and
fresh reads with three attempts within 180 seconds. Missing/invalid required copy
fails deployment without substituting fixtures. Ordinary visitor and CRM
requests do not call Directus. The HTML contains the snapshot SHA-256 digest.

Use Node 22.18 or newer in the 22.x line. `pnpm typecheck` generates Next route
types before TypeScript checking. A clean clone needs no private credentials for
the fixture build.

## Secrets and recovery

Reader tokens and the Deploy Hook belong only to server environments. The CMS
database connection and license stay on Render. Never commit `.local`, database
backups, account setup URLs, environment pulls or reader tokens.

`schema.json` is a schema export, not a database backup. Before schema upgrades
and after meaningful content changes, make a private full PostgreSQL backup and
verify a restore into an isolated database. Never restore tests into the live
CMS database. A failed website build leaves the previous deployment online.

`node scripts/backup-directus.mjs` reads the ignored owner configuration and
saves a full custom-format archive under `.local/backups`. Set `PG_DUMP_BIN` to
PostgreSQL 18's `pg_dump` and `PGSSLROOTCERT` to a trusted certificate bundle.
The script enforces `verify-full` and records a private checksum manifest.
Restore testing uses `pg_restore` into the separate verification database;
never use its cleanup flags against the live CMS database.
