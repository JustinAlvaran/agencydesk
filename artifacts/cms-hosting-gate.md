# CMS hosting gate — 2026-10-03

Result: pending licensing and hosted Directus runtime verification. No production
content source, CRM permission, Supabase migration or Vercel deployment changed.

## Verified

- Render dashboard authenticated, workspace `chaksad`, ID
  `tea-db08b98u01pc7399d410`: Hobby, no card on file, no pending charges.
  Available allowances: 750 free instance hours, 5 GB bandwidth and 500 pipeline
  minutes; none consumed at initial inspection. The dedicated Free image service
  was subsequently provisioned as `srv-db08u349v7es73adpa20`.
- Render plugin installed; connector still reports not connected after dashboard
  sign-in. Browser sign-in and connector authorization are separate.
- Dedicated Neon resource created using Vercel's existing native integration,
  explicit `free_v3`, Singapore, Auth disabled, no connection to the Next app,
  and no environment pull.
- Neon plugin independently verified project `cool-violet-11926574`, name
  `agencydesk-cms`, region `aws-ap-southeast-1`, owner plan `free_v3`, PostgreSQL
  18, 1 GB project limit and default main branch `br-empty-voice-b3ms944y` ready.
  Existing `neon-amethyst-bridge` database was not modified.
- Official Directus 12.4.1 release and Docker Hub multi-platform digest verified.
  Secret-free Blueprint prepared at `infra/directus/render.yaml` and validated
  against Render's current public JSON schema.
- Owner confirmed the free Individual/Hobbyist grant was issued. The license
  and dedicated database connection are in ignored `.local/cms-secrets.json`.
- Private repository created at https://github.com/JustinAlvaran/agencydesk.
  GitHub's authenticated account has been renamed from the previously cached
  username. Only the hosting configuration and initial template history have
  been pushed; Vercel is not Git-connected yet.
- Initially, both visible GitHub connect controls left the page unchanged and
  opened no in-app browser tab. A direct official installation page was opened
  for the owner; separate Render connector authorization remains pending.
- After the owner installed the Render GitHub app, the private repository became
  available in Render. Its Blueprint review accepted the custom YAML path.
  Database settings and owner email were filled privately. ADMIN_PASSWORD now
  uses Render's random 256-bit generation, so no password needs to be entered.
  The Blueprint was submitted using the server-generated password, which is
  saved in ignored local storage for the owner.
  Initial bootstrap uses Core; activate the grant only after confirming
  the actual assigned HTTPS hostname and setting PUBLIC_URL.
- Read-only Neon verification confirmed the dedicated `neondb` database is
  reachable and contains zero public tables before Directus initialization.
- Initial deployment completed successfully at
  `https://agencydesk-cms.onrender.com`; `/server/ping` and owner authentication
  passed. The initial license was Core, with custom permission rules disabled.
- Grant activation deployment `dep-db090gc9v7es73ae3h8g` failed because PUBLIC_URL
  remained `/`. Logs explicitly reported that `public_url` must be absolute.
  The environment value was corrected and verified as
  `https://agencydesk-cms.onrender.com` before saving and deploying again.
  Replacement deployment `dep-db093upsrm7s73ejlof0` became Live at 13:29 Manila.
  At 13:29:44 Manila, authenticated `/license` returned Open Innovation Grant,
  active, source `env`, and custom permission rules enabled. No key is recorded
  in this report.
- Manual host probe prepared at `scripts/check-cms-host.mjs`. It checks for the
  actual Directus ping response within a 180-second total deadline; it is not a
  scheduled keepalive and does not establish the full hosting gate by itself.
- Vercel CLI authenticated as `kinggucci195-9991`. Its Neon provisioning command
  also installed official Neon skills under `.agents/skills` and skills-lock.json.

## Not yet verified

- Render connector access and intended workspace confirmation.
- Custom permissions, restricted reads, preview and publishing.
- Restart persistence and two real idle wakeups; memory/CPU logs.
- Publish-triggered deployment, failed-build behavior, backup restoration and
  CRM regression after integration.

The owner completed the grant application. License activation remains pending
deployment at a stable service URL. Never paste a license key or password into
chat; ignore local credentials and do not commit them.

If the license or $0 hosting checks fail, pause the CMS rollout and preserve the
existing website. No paid upgrade or local-CMS fallback is authorized.
