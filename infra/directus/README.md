# Directus hosting gate

Status: NOT PASSED. This configuration has not been provisioned or runtime-tested.
Do not change AgencyDesk's production content source until every gate passes.

## Pinned release

Directus 12.4.1, published 2026-09-23. The multi-platform manifest digest was
verified against Docker Hub on 2026-10-03:
`sha256:9cc8ab88e6f1fc98d860416d89d53dd15838860c315a66c6d8ee68cb72f6b3a6`.
Use `infra/directus/render.yaml` as the Blueprint path. It pulls the official
prebuilt image; it does not build the Next.js application or provision a database.

## Before deployment

1. Confirm the selected Render workspace is Hobby with no payment method, no
   pending charges, and available free-instance hours. Do not add a card.
2. Create a dedicated Neon Free project and database. Do not reuse existing
   project data. Verify its free plan before creating compute.
3. Obtain the eligible free Open Innovation Grant (owner confirmed issued).
   Supply LICENSE_KEY privately; credentials and license keys never belong in Git.
4. Set PUBLIC_URL to the actual stable HTTPS service URL before activation.
   Supply the direct Neon hostname (not the pooler), database, role and password
   through Render's secret fields. TLS certificate verification stays enabled.
5. The owner supplies a new private ADMIN_PASSWORD through the hosting setup;
   never reuse a password supplied in conversation. Remove bootstrap admin
   password configuration after initial setup. Preserve SECRET across restarts.
6. Keep uploads out of this text-only rollout. Render disk is ephemeral.
   Do not configure scheduled keepalive requests, paid disks, Redis or workers.

## Required evidence

Record timestamps and sanitized results, never tokens or database URLs:

- Successful initialization, licensing activation and owner Studio sign-in.
- Four content collections and restricted published/preview machine readers.
- Published-reader fetch plus draft/version/anonymous denial checks.
- One edit/preview/publish/build cycle using a fixture-isolated test deployment.
- Restart persistence, comparing content before and after restart.
- Two real idle wakeups after more than 15 minutes without service requests.
- CPU/memory/deployment logs showing no OOM, restart loops or repeated timeout.

Health-check success alone is insufficient. A cold published-content request
must complete within the application's 180-second total retry deadline.

If billing cannot stay at $0, licensing is unavailable, or runtime checks fail,
pause CMS rollout. Keep the current website and CRM live. Do not upgrade hosting
or introduce a local CMS fallback.

## References

- https://render.com/docs/blueprint-spec
- https://render.com/docs/free
- https://directus.com/docs/self-hosting/requirements
- https://directus.com/docs/configuration/database
- https://directus.com/docs/licensing/overview
