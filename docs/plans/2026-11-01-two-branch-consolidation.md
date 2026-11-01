# Two-branch consolidation and CI repair

Latest owner request authorizes fixing the failing check, merging all committed AgencyDesk branch work into main (including preview), and retaining only main/preview remote branches. Existing root WIP remains untouched.

Audit: existing feature2eb868a contains all fetched AgencyDesk heads except policy-only2edbb2d. Merge that history normally and update outdated feature-branch requirements to the new two-branch model. No application code needs transplanting from other branches. Main currently lacks preview's reviewed CRM/n8n changes; the tested feature already includes them.

CI: replace unresolved pinv2.5.5 with official releasedv2.5.6 and run push checks on main/preview. Owner completes workflow-scope authorization for the isolated JustinAlvaran profile; never switch work credentials or bypass a grant. Run full lint/relevant CI checks and inspect actual remote checks. Preserve current auth/RLS/consent/dry-run/provider gates.

Independent read-only security/final review and exact staged scans before publication. Reuse PR10 into preview for this one-time legacy feature; after green checks, the owner's explicit request permits merge, then a preview->main promotion PR and merge after its checks. No force push/auto-merge. Verify own hosting production branch main separately.

Before deleting redundant remote heads, fetch fresh exact SHAs and prove all are ancestors of final main; reject concurrent advances. Leave dirty local worktrees intact. Record branches/heads/PRs/checks. Future work uses preview->main PRs, no extra remote branches. No paid plan, purchases, data migration, new customer record, customer send or provider activation. Rollback through ordinary revert PRs; no shared history rewriting.

Verification checkpoint:Netlifydashboardconfirmedkinggucci195ownaccount,projectagencydesk-crm(a0e2d3ed-b81b-4814-b0dc-6a5c090bef45),JustinAlvaran/agencydeskrepo,productionbranchmainandbranchdeploypreview. No hosting change needed. FullrepoESLint198files0errorswarnings;embeddedDB610assertionspass. OldEdgefixturelackedrequiredagency_id:35pass9fail;fixturecontractcorrectedand2missing/foreignagencynegativechecksadded,46pass0fail.LocalDeno2.9.7doesnotestablishexactCI2.5.6compatibility;waitforremotechecks. Productionworkerlogicunchanged.
