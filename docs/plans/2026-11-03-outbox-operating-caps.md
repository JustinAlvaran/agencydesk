# Outbox operating caps — source and rollout

3 November 2026. Scope: reviewed queue admission; deployment and scheduler activation remain separate.

## Problem and behavior

The existing worker's maximum of five jobs per invocation did not limit repeated or concurrent invocations. The new migration reuses `message_attempts` as a conservative reservation ledger: **five leases per rolling hour and twenty per Asia/Manila calendar day, per agency**, across every channel, provider and dry-run/live mode.

All existing history counts, including simulations, retries, failures, expired leases and uncertain outcomes. Reserving a lease consumes capacity even if later revalidation prevents delivery. This bounds admission rather than exact provider delivery times or monetary spend. Switching modes/providers/workers never resets the budget. Limits are fixed in reviewed SQL, not caller-supplied request fields.

When capacity is exhausted, eligible queued jobs keep their approval, attempt count and history. Only the due date, redacted reason `operating_cap_deferred` and update timestamp change. The next due time is the later applicable window opening plus one second; legacy history already above five waits for enough reservations to expire. Current eligibility is rechecked on a later claim.

## Files and boundaries

- `supabase/migrations/20261102015315_message_claim_operating_caps.sql`: new CLI-created migration, indexed agency/time lookup, private next-opening calculation and replacement of the existing private claim implementation. The historical empty operating-limits migration remains unchanged.
- `tests/database/operating-limits-fixture.mjs`: controlled fictional disposable-database records.
- `tests/database/operating-limits.mjs`: role/isolation, quota, deferral, rollover and recovery acceptance.
- `tests/database/operating-limits-concurrency.mjs`: opt-in real PostgreSQL concurrency proof.
- `tests/database/automation.mjs`: independent older scenarios explicitly start in a fresh operating window; their eligibility, lease and retry assertions are preserved. Cross-invocation accounting is tested by the new suite.
- `package.json` and `.github/workflows/ci.yml`: include embedded cap tests and a separate network-isolated Docker admission check.
- `docs/messaging-setup.md` and `README.md`: operating behavior and unchanged activation gates.

No new table, public API, credential, provider, dependency or runtime. Existing authenticated staff reads and service-role-only claim grants remain intact. Public/client calls cannot execute the internal calculation. Agency RLS, consent, suppression, staff approval, lease ownership, retry ceiling, idempotency and uncertain-result handling remain authoritative. No customer records are added by the migration.

Admission takes a transaction advisory lock per agency before job locks; the clock is read after waiting. A lease and its timestamped history row commit atomically. READ COMMITTED is required; repeatable-read/serializable snapshots are rejected rather than risking stale counts. A failed transaction rolls back the reservation with the claim.

## Acceptance and actual local evidence

- Original missing-cap case reproduced: seven leases admitted where five were expected. That failure was recorded before implementation.
- Full embedded database command: **641 assertions passed**, comprising the existing610 and new31. New coverage includes repeated invocation, no attempts consumed on deferral, later reclamation, agency/channel boundaries, all outcomes charged, withdrawal, expired-lease reconciliation, deterministic Manila daily rollover, later-of-two windows, legacy over-cap history, rollback and restricted roles/isolation.
- Opt-in pinned PostgreSQL17 Docker check: **15 assertions passed**. Two batches each used eight distinct connections observed waiting on the actual agency advisory lock. Empty budget admitted five; four prior uncertain charges left one slot. Removing only that lock in the disposable database caused the barrier assertion to reject as expected.
- Container network mode none, no host port bindings and no host bind mounts were verified. Exact random-name container cleanup was verified. Real hosted credentials and customer records were not used.
- Daily arithmetic is exercised with fixed test timestamps in embedded PostgreSQL. This is not a real-clock midnight or multi-session daily-boundary test; the two real concurrency batches verify the shared admission lock/hourly accounting.

The initial real-concurrency attempt failed because the local Docker engine was stopped. The existing per-user Docker Desktop was started; the unchanged assertions then passed. A default Program Files path check failed before launch because this installation is per-user. Neither failure is counted as a passing concurrency check.

Application/lint and exact staged-snapshot/security results are recorded in the PR and project ledger. Remote CI must be checked on the published SHA. No local test implies hosted migration application or running automation. No UI change or new screenshot is required for this queue slice.

Run locally after installing existing dependencies:

```sh
pnpm test:database
```

Optional real concurrency check requires Docker and explicit opt-in:

```powershell
$env:AGENCYDESK_ALLOW_LOCAL_DOCKER_TEST='1'
pnpm test:automation-concurrency
```

The existing Ubuntu CI job supplies that opt-in only for its isolated regression step. It does not activate an n8n workflow or a CRM scheduler.

## Rollout and remaining owner steps

1. Owner reviews/merges the preview -> main PR. Publication alone does not apply SQL or enable delivery.
2. Before any separately authorized deployment, verify both the owner's AgencyDesk Supabase account and project binding plus actual migration history. Do not inspect another account's projects. Keep every worker and scheduler entry point paused during migration/verification.
3. Apply the new migration as part of the reviewed deployment. Verify the actual capped function definition, grants and index; READ COMMITTED must hold. Existing history can immediately defer work, intentionally.
4. Verify only specifically authorized dry-run queue processing with fictional test recipients, explicit server dry-run mode and the existing separate integration credential. A simulated job is a terminal mutation, not a non-mutating preview.
5. Establish a verified error-notification path and an approved durable scheduler before recurring activation. The protected on-demand n8n personal demo is already hosted, but its manual workflow remains inactive/unconfigured and hosted MCP is not connected. It is not a verified24/7scheduler.

No live messages, appointments, inbox/calendar scope, credentials, public exposure or production/database changes are authorized by this source slice. Public AI remains separately gated. No purchases, paid plans, credits or automatic recharge were enabled.

## Rollback

Before deployment, reverting this scoped PR removes only source changes. After a future authorized database deployment, stop all worker/scheduler entry points first. Use a reviewed forward migration to restore the prior claim implementation if necessary; preserve message jobs and attempt history. Do not delete reservations/history, reset uncertain jobs or restore an unbounded running worker as a rollback shortcut. Due-date deferrals remain visible and should be reviewed rather than bulk-reset. Rollback never authorizes live sending.

## Primary references

- [PostgreSQL transaction-level advisory locks](https://www.postgresql.org/docs/current/explicit-locking.html#ADVISORY-LOCKS)
- [PostgreSQL isolation and statement snapshots](https://www.postgresql.org/docs/current/transaction-iso.html)
- [Supabase database function security and privileges](https://supabase.com/docs/guides/database/functions)
- [Supabase Data API grants and RLS](https://supabase.com/docs/guides/api/securing-your-api)
- [GitHub standard hosted runners](https://docs.github.com/en/actions/reference/runners/github-hosted-runners)
