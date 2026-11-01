# AgencyDesk n8n hosting handoff

Updated: 1 November 2026 (Asia/Manila).
Scope: personal, non-commercial demo; free-only.
Status: separate Vercel deployment READY; owner setup requested. Local database boot/restart verified; hosted authenticated flows and MCP remain pending.

## Owner decision

The owner explicitly requested hosting n8n on Vercel and clarified that AgencyDesk is a personal demo, not an operating business. The earlier commercial-use objection was based on an assumption and is superseded. Do not repeat it as a current blocker.

The owner also approved a dedicated Neon Free PostgreSQL database and a stable n8n encryption key stored as a Vercel secret. No paid plan, trial, automatic recharge, customer sending or workflow activation is authorized.

## Confirmed resources

- Vercel CLI identity: kinggucci195@gmail.com / kinggucci195-9991.
- Team: king-s-projects19; team_l7mzSYs1Ph9aFp9zjOEoAQ5e; actual CLI read-back confirms Hobby.
- Separate Container project: agencydesk-n8n-demo / prj_1DgN4LlApTTVyxXnABZS1QNSiEGS.
- All URLs are configured for Vercel Authentication. Do not expose an unclaimed n8n owner setup.
- Dedicated Neon integration resource: agencydesk-n8n-demo / store_0RMbyXf62u7sYMaR; external project old-grass-84882127; explicitly provisioned with free_v3 (Free), region sin1, auth=false, realtime=false.
- Live protected URL: https://agencydesk-n8n-demo.vercel.app
- Current deployment: dpl_761gFvXaxteWtL8GmLHFtptkY5BC; actual Vercel read-back READY, alias assigned.
- Existing AgencyDesk CRM remains on Netlify. No CRM production deployment, Supabase change or other-project access occurred.

The Vercel connector identified the correct account but still returned 403 after owner team approval. The supported official CLI fallback succeeded after the owner completed its separate device login. CLI 65.9.0 is installed only in AgencyDesk's ignored .local area, with a separate profile; default/work credentials and global configuration were not switched.

## Implemented source

Current preview checkout: .local/public-spacing-pr-worktree. Preserve the dirty historical root checkout.

- infra/n8n/vercel-demo/Dockerfile: official n8n 2.45.6 image pinned to GHCR linux/amd64 manifest sha256:86faa0c8a2fa2f89eae7c289a86c107141fcf22b2bcc45a1c823e382428dbe7f; copies only runtime.mjs and start.mjs.
- .dockerignore and .vercelignore: explicit source allowlists.
- runtime.mjs: fail-closed PostgreSQL/key/HTTPS checks, direct Neon PG* mapping, forced certificate validation and secure cookies, restricted nodes, Manila timezone and bounded persistence settings.
- start.mjs: non-shell startup and termination forwarding.
- runtime.test.mjs: 22 configuration/security cases.
- vercel.json: separate Container configuration and response headers; does not replace the root Next.js config.
- package.json: existing test command now includes the 22 hosting checks.
- .gitignore: generated local Vercel/env paths stay private.

Deployment uploads exactly Dockerfile, runtime.mjs, start.mjs, vercel.json and .dockerignore. No env files, auth stores, key backups, CRM records or repository-wide archive enter the deployment. File hashes are recorded privately.

## Actual verification

- Final combined test command passed: 211 application tests across 28 files plus 22 hosting guard tests; exit 0.
- Final scoped ESLint: three new JavaScript modules, 0 errors and 0 warnings. Exact staged hosting snapshot: 22 tests passed.
- Docker image built successfully; isolated version check reports 2.45.6.
- With no hosted settings, a no-network/no-volume/read-only checker refused startup with exit 1.
- Actual dedicated Neon connection used TLS certificate validation. Real n8n schema initialization completed.
- First successful full boot: readiness, editor HTML and public settings all HTTP 200; owner setup required=true.
- A second fresh container using the same database/key also passed those three HTTP 200 checks.
- Each successful checker stopped with exit 0, was removed with exit 0, and exact-container absence was verified. No customer workflow was executed.
- Independent read-only security review covered candidate source and private provisioning/deployment helper code. Removable Python assertions, scope-blind reruns, cleanup reporting and raw-error diagnostics were corrected before final use.
- Exact staged allowlist: 11 text files, 0 known-format findings. Current index: 400 text files scanned, 33 binary/large skips, 0 known-format findings. Bounded scans are not history, upstream-image, provider or deployed-asset guarantees.

The first 120-second readiness attempt did not pass and was not counted as successful. The first database initialization needed a longer bounded window; the same actual health assertions later passed. n8n runs PostgreSQL migrations inside one transaction, so absence of committed tables during startup was expected. No migrations were skipped or patched.

An early verifier mistakenly received encrypted metadata from the v9 environment-list endpoint despite its decrypt query. It was corrected to retrieve only the four approved new database fields through the supported single-variable API, in process memory. No real values were printed or saved to plaintext files.

## Registry build recovery

The first hosted build, dpl_9YS3UNhpuf5H6i2D8QZQmCvFNZ1u, failed because the shared builder hit Docker Hub's anonymous pull limit. It was not an application or billing failure.

The replacement uses n8n's official GHCR publisher at a fixed linux/amd64 digest. Anonymous registry verification found all 15 filesystem layers plus Env, Entrypoint, Cmd, User and WorkingDir equal to the tested original image. The alternate registry's metadata/config digest differs, so do not claim the entire OCI artifact is identical. A new local build and version check passed using a project-local anonymous Docker registry profile; no global/work registry credentials or settings changed.

Publisher evidence: https://github.com/n8n-io/n8n/blob/n8n%402.45.6/.github/scripts/docker/docker-tags.mjs and https://github.com/n8n-io/n8n/blob/n8n%402.45.6/.github/workflows/docker-build-push.yml

## Persistence and recovery

The dedicated integration provides PGHOST_UNPOOLED, PGDATABASE, PGUSER and PGPASSWORD directly to this project. Runtime maps them to n8n's PostgreSQL settings without copying secrets into source.

N8N_ENCRYPTION_KEY is stored as a sensitive Vercel environment variable. Its recovery backup is encrypted with Windows current-user DPAPI in the ignored AgencyDesk private ledger area. It is not a plaintext key file or portable cross-user backup. Preserve the stable key; never pair old encrypted credentials with a newly generated replacement key.

CLI linking automatically downloaded an unused development OIDC env file; that newly created file was removed without reading its token. Neon provisioning used --no-env-pull. Do not read private profiles/backups/env values for routine review.

## Demo limitations and next acceptance

This is on-demand hosting. Vercel container Functions idle down after 5 minutes in production or 30 seconds in preview. It is not a 24/7 scheduler, and n8n execution concurrency is not an instance-count limit.

Keep every workflow inactive and disconnected from delivery credentials. Actual editor push/reconnects, manual workflow execution across autoscaled instances and authenticated hosted MCP remain unverified. Do not describe this as an operational automation service or a completed local-account/data migration.

Once the build is READY:
1. Verify the stable and generated URLs both deny anonymous access; distinguish a Vercel login redirect from an n8n HTTP 200 response.
2. Owner signs in to Vercel and creates the hosted n8n owner account using kinggucci195@gmail.com. Password entry/submission is owner-only, on the site.
3. Import the existing reviewed manual inactive workflow from infra/n8n/workflows/process-approved-dry-run.json; do not execute it or add provider/CRM credentials.
4. Verify actual hosted editor persistence/restarts and only authorized isolated manual tests.
5. Hosted MCP needs its own authorized connection and verified discovery. The old local MCP grant/configuration does not transfer automatically. Vercel Authentication can block MCP; do not disable it or create bypass/share credentials without specific approval.

The original local n8n volume and owner account were left intact for rollback. They have not been exported wholesale or deleted.

## Boundaries, rollback and delivery

AgencyDesk retains authoritative agency/RLS isolation, consent, suppression, staff review, outbox leases, idempotency and uncertain-result reconciliation. n8n coordinates the dedicated dry-run boundary; it must not bypass controls through direct provider nodes or SQL. Simulated processing consumes jobs and is not a non-mutating preview. Receipts are not incoming chats; callbacks are not bookings.

No other project, ApartmentHub data/infrastructure, Linear, GetLayers, global plugin settings or paid services are part of this work. No i18n or new CRM/customer seed data.

Rollback means stop the separate hosted target, reconcile any future test execution, and retain the original local instance/data. Do not run competing schedulers, delete volumes, rotate secrets or rewrite history as a side effect.

Publish scoped source through preview -> main PRs only; preserve the owner's merge decision. Record actual Actions status, hosted verification, remaining owner-only steps and costs. A submitted deployment or local HTTP 200 is not proof that the hosted instance works.

## Primary references

- [Container runtime](https://vercel.com/docs/functions/runtimes/container)
- [Deployment protection](https://vercel.com/docs/deployment-protection)
- [Daemon limits](https://vercel.com/docs/daemons/limits)
- [n8n database settings](https://docs.n8n.io/hosting/configuration/supported-databases-settings/)
- [n8n deployment settings](https://docs.n8n.io/hosting/configuration/environment-variables/deployment/)
- [Neon Free](https://neon.com/pricing)
