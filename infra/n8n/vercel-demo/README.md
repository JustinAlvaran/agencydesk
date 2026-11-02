# AgencyDesk n8n on-demand personal demo

This is a separate Vercel Container project. Deploy this directory alone; never
replace AgencyDesk CRM's root Next.js configuration. The owner clarified this is
a personal non-commercial demo. No paid plan, purchase or automatic recharge.

## What this supports

Candidate n8n editor/manual workflow host with durable external PostgreSQL.
Vercel container instances sleep after idle time (5 min production / 30 sec
preview); scheduled triggers and long-running work are not supported by this
demo contract. Keep every workflow inactive and disconnected from CRM/provider
credentials. This is not an always-on automation migration.

Image uses official n8n 2.45.6 from GHCR, pinned to its verified linux/amd64 digest. Only two source modules enter the image.
Startup fails before n8n if PostgreSQL, stable encryption key or HTTPS origin is
missing. TLS certificate validation and secure cookies are forced on.

## Settings — names only, never commit real values

In a dedicated AgencyDesk n8n Vercel project configure:
- PORT=5678
- N8N_EDITOR_BASE_URL: exact stable HTTPS origin without a path
- N8N_ENCRYPTION_KEY: stable private key, at least 32 characters; preserve it across
  restarts. For a credential migration use the original key through a separately
  authorized private transfer, not a new key with old encrypted credentials.
- DB_POSTGRESDB_HOST, DB_POSTGRESDB_DATABASE, DB_POSTGRESDB_USER,
  DB_POSTGRESDB_PASSWORD, optional DB_POSTGRESDB_PORT (default5432).
  Alternatively use the dedicated Neon integration names PGHOST_UNPOOLED,
  PGDATABASE, PGUSER and PGPASSWORD. Only a complete group is accepted when no
  explicit DB_* connection group is present; TLS remains enforced.
  Use a dedicated PostgreSQL database/role; direct connection preferred.
  Never use the CRM service-role key, an unrelated database or provider tokens.

A dedicated Neon Free database is a candidate; owner identity/free plan and
specific credential-creation authorization must be verified before provisioning.
Do not silently use whichever account an installed Neon plugin happens to have.

Protect bootstrap with Vercel Authentication on every reachable deployment URL
before exposing a new unclaimed owner setup. Verify the setting and anonymous
denial, not just a saved config. If all-URL protection is not available for free,
keep the target unpublished and resolve secure bootstrap before proceeding.
Owner enters passwords on the n8n page, never in chat. Protection may block MCP;
do not remove it or create bypass tokens without separate scoped authorization.

No existing database/credential migration is performed by these files. Import
only reviewed inactive workflow JSON after secure owner setup; do not run it.

## Verification and limits

Run: node --test infra/n8n/vercel-demo/runtime.test.mjs from this checkout.
These are configuration-boundary tests, not a working hosted n8n certification.

Still required: container build/real boot, database/owner restoration, anonymous
authorization, cold-start/restart persistence, manual execution/push reconnects,
multi-instance behavior and authenticated MCP discovery. WebSocket support now
exists in Vercel beta; test it instead of assuming it is unsupported. In-memory
execution state can fail across autoscaled instances. Do not claim operational
workflow execution until those checks pass. No paid multi-main architecture.

Do not activate schedules or send customer messages. Do not make keepalive
requests to defeat platform idle behavior or quotas. Current Daemon limits do
not provide a month of continuous free operation and Daemons cannot receive
public HTTP traffic.

Rollback: stop the separate target after reconciling any test execution; retain
the local instance and its volume. Do not delete data or rotate credentials.

Sources:
- https://vercel.com/docs/functions/runtimes/container
- https://vercel.com/docs/daemons/limits
- https://vercel.com/docs/deployment-protection/methods-to-protect-deployments/vercel-authentication
- https://docs.n8n.io/hosting/configuration/supported-databases-settings/
- https://docs.n8n.io/hosting/configuration/environment-variables/deployment/
