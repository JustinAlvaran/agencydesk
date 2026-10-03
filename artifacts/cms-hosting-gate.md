# CMS hosting gate — 2026-10-03

Status: free hosting gate passed; production release and publishing journey
still pending. No paid hosting or trial was provisioned.

## Verified infrastructure

- Dedicated Render Free image service srv-db08u349v7es73adpa20, Singapore,
  https://agencydesk-cms.onrender.com. Hobby workspace has no payment card.
- Dedicated Neon project cool-violet-11926574, free_v3, Singapore,
  PostgreSQL 18; existing application databases remain separate.
- Directus 12.4.1 Docker image pinned by digest; TLS verification enabled,
  connection pool minimum 0 / maximum 2; no persistent files or uploads.
- Open Innovation Grant active, environment-managed, custom permissions enabled.
  Owner email and required license terms were completed by the human owner.
- Private GitHub repository https://github.com/JustinAlvaran/agencydesk connected
  to the existing Vercel project; production branch codex/directus-cms.
- Render connector is unavailable in this session. Hosting configuration and
  logs were inspected through the authenticated dashboard. Directus changes
  use REST exclusively.

## Verified content and application behavior

- Four versioned collections, original fictional content, API-only published
  and preview readers. Anonymous content access disabled; readers cannot write.
- Published reader denied versions, revisions and users. Only preview reader
  can read the private verification draft. Evidence:
  cms-access-verification.json.
- Supabase owner account and Directus owner account sign-in verified separately.
  Admin preview guards, no-store/noindex, public draft isolation, invalid-input
  handling and existing-session membership removal passed. Evidence:
  cms-preview-verification.json.
- Desktop and 390px browser preview inspected; no horizontal overflow. Keyboard
  tab-to-submit and retry feedback verified.
- Clean clone installs, prepares fixtures, generates Next types, and builds
  without private credentials. Public content is static; CRM and previews are
  dynamic. Eleven unit tests, lint, type checks and fixture build passed on
  official Node 22.23.3 (download checksum verified).
- Unavailable-CMS preparation fails without overwriting the prior snapshot or
  printing credentials. Evidence: content-build-verification.json.
- Full private PostgreSQL backup restored into isolated
  agencydesk_restore_verification; four collections, three services, three
  sample projects and one draft recovered. Evidence:
  cms-backup-verification.json. Schema export alone is not a backup.
- Existing CRM regression passed 17 hosted Auth/Data API/RPC checks, including
  concurrent acceptance, isolation, immutability and removed membership.
- REST-created publication/visibility Flows are inactive until hook configuration
  and hosting verification pass. Exports contain environment references only.

## Hosting proof

One actual idle recovery passed: new instance tkfc7, successful ping after
132,865ms, active license and persisted content. A later Blueprint configuration
restart created instance 2ntjq; a subsequent fast ping was warm and was not
counted as an idle recovery. Evidence: cms-idle-verification.json.

The second actual idle recovery passed through the application's published
content adapter: confirmed idle shutdown at 09:24:20 UTC, cold request beginning
09:26:46 UTC, fresh content ready in 163,293ms. License and permissions remained
active, and the content digest matched the expected original copy. This is
within the 180-second deadline but leaves a narrow margin.

Production-only CMS reader configuration is verified on Vercel. Preview has
only demo configuration and receives no CMS production readers. The private
deployment hook, first production release, and edit → preview → publish → live
journey remain required. Inactive Flows do not establish publishing success.

Render's current dashboard reports 512 MB and 0.15 CPU limits. Actual memory and
CPU usage graphs require paid compute; no upgrade was made, and no measured
resource-usage claim is made. Runtime logs remain available for failure review.

If the free hosting gate fails, pause CMS rollout and preserve the existing
website and CRM. No upgrade or local-CMS substitution is authorized.
