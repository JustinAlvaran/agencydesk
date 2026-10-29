# AgencyDesk branch workflow

## Owner decision

Feature branch -> PR into `preview` -> owner-reviewed promotion into `main`.

`main` is the GitHub default and the release baseline. `preview` is the review/integration branch. Assistant-created feature/configuration PRs always specify `--base preview`. The owner performs merges and production promotion. No force pushes or direct application pushes to these two branches.

## Initial branch state: 29 October 2026

- `main` was created at `75bf1536467737338a469ce7768381373aea3b0a`, matching the latest successful Production deployment recorded by AgencyDesk's GitHub/Vercel integration. This preserves that release's code.
- `preview` was created at `ee59f937bfd8a5a407c3abdacc86d32ce47b2c43`, the owner's existing merge of redesign PR #2. The merged tree matches the published emerald design commit `12cf3e6`.
- Existing legacy branches remain available. No source history was rewritten, no provider configuration or database was changed, and no existing branch was deleted.
- GitHub default changed from `codex/directus-cms` to `main`. This does not change Vercel's production branch setting or prove that a branch deployment has completed.

## Keep each feature current

Use the isolated personal GitHub CLI profile in [github-account-isolation.md](github-account-isolation.md). Work only in this repository. Preserve unfinished changes before merging; use an appropriately isolated checkout if necessary rather than overwriting or mixing them.

1. Fetch `origin/main` and `origin/preview` before starting and again before publishing/updating a PR.
2. Base new feature branches on the latest preview, then merge latest main if not already contained. For existing features, merge latest preview and main as necessary using ordinary merge commits.
3. Resolve conflicts in the feature branch. Run meaningful checks on the resulting code, including tests affected by the integration.
4. Verify `git merge-base --is-ancestor origin/main HEAD` and `git merge-base --is-ancestor origin/preview HEAD` both succeed. Record the tested head and both upstream SHAs. Reconcile changes if upstream advances during verification.
5. Push only the feature branch. Create/update its PR explicitly against `preview`, with checks, screenshots when relevant, limitations and costs. Never treat an unfinished CI run as passing.

This reduces integration conflicts; future concurrent changes can still conflict. Synchronizing preview from main also goes through a PR into preview. Do not bypass review with a direct preview push.

## Owner release

After reviewing and merging feature PRs into preview, the owner can compare [main...preview](https://github.com/JustinAlvaran/agencydesk/compare/main...preview) and choose when to promote. The assistant does not open feature PRs against main or merge release PRs without a new explicit instruction.

Vercel's production branch should track `main` for this convention. That provider setting has not been changed or verified by this GitHub-only setup. Confirm it in the exact [AgencyDesk Vercel project settings](https://vercel.com/king-s-projects19/agencydesk/settings/git). Existing feature preview remains separate from production evidence.

## Verification and limits

This slice changes delivery documentation and GitHub branch/default/PR metadata. Application behavior, credentials, API access scopes, dependencies, production deployments and databases are unchanged. Verify remote ref SHAs, default branch, PR base/head and ancestry; application tests are not needed for these documentation changes. Existing CI's unavailable Deno 2.5.5 setup pin is a separate unresolved issue, and its local repair is excluded here.

Review is a documented policy; no new server-side branch-protection rules or paid features were enabled. To reverse branch conventions, review the current branch/deployment state with the owner first. Do not delete branches, reset refs or change hosting automatically.
