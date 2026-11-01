# AgencyDesk branch workflow

Owner decision,1November2026: only two permanent remote branches.

- `main`: production/release source and GitHub default.
- `preview`: working/review source. Future PRs use `--head preview --base main`; no extra published feature branches.

## Routine delivery

Use the isolated JustinAlvaran CLI profile in github-account-isolation.md. Fetch current main/preview, preserve all WIP, normally merge current main into preview when necessary, then implement/review/test scoped work. Push only preview and open/update its PR into main. Mark incomplete/red checks draft. The owner approves/merges; no force push, auto-merge or impersonated approval. Preserve Justin-only author/committer identity.

CI runs for PRs and pushes to both main/preview. A preview deployment is not production. Hosting production branch must be verified on the confirmed own AgencyDesk provider; the intended production source is main, not preview. Keep free-only operation and provider/credential/customer-delivery gates intact.

## One-time consolidation authorized1November

The owner explicitly requested fixing CI, merging all committed AgencyDesk branches including preview into main, and deleting redundant remote branches. Preserve every fetched head through normal merges; resolve old policy conflicts in favor of this decision while retaining safety rules. Complete independent review and checks before the authorized merges. Do not deploy migrations, activate messages/AI/n8n or expand provider scopes as a side effect.

Before deleting any obsolete remote branch, fetch/recheck its exact current SHA and prove that SHA is an ancestor of final main. Stop if it advanced; reconcile/retest first. Never delete main or preview. Dirty local worktrees remain intact. This authorization is for this consolidation, not future automatic production merges.

After consolidation, keep main and preview current without creating replacement remote feature branches. Record actual PRs, head SHAs, checks and deletion/preservation evidence in the AgencyDesk ledger. Main may trigger its existing production deployment; preview must stay a review source.
