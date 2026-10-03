# Database verification

Run `pnpm install --frozen-lockfile` then `pnpm test:database` at the project root. These checks load every saved migration into PGlite, a real embedded PostgreSQL engine, and emulate only Supabase's external Auth schema. They verify actual RLS under `SET ROLE authenticated`, client isolation, live membership removal, database-derived totals, published scope/items immutability, idempotent acceptance, revision supersession, transaction rollback after an injected late failure, and persistent inquiry rate limiting.

For the complete Supabase stack, start Docker Desktop and run `npx supabase start` then `npx supabase test db` at the project root. SQL tests live in `supabase/tests` and assert grants, RLS coverage, and RPC privilege boundaries.

Embedded PostgreSQL uses one connection, so it cannot establish simultaneous two-connection acceptance behavior. Before rollout, run concurrent accept RPC requests against a disposable Supabase test project with an invited accepting client and published revision; both must return the same project ID, with one project and one acceptance activity event. Acceptance and publication lock lead, series, and revision in that order; uniqueness constraints provide a second protection against duplicate projects.

The local seed uses original fictional data and creates no Auth accounts. Bootstrap an admin through the documented server-side invitation flow, then publish a seeded draft and invite an accepting client for a live walkthrough.
