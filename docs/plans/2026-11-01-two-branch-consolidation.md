# Two-branch consolidation and CI repair

Latest owner request authorizes fixing the failing check, merging all committed AgencyDesk branch work into main (including preview), and retaining only main/preview remote branches. Existing root WIP remains untouched.

Audit: existing feature2eb868a contains all fetched AgencyDesk heads except policy-only2edbb2d. Merge that history normally and update outdated feature-branch requirements to the new two-branch model. No application code needs transplanting from other branches. Main currently lacks preview's reviewed CRM/n8n changes; the tested feature already includes them.

CI: replace unresolved pinv2.5.5 with official releasedv2.5.6 and run push checks on main/preview. Owner completes workflow-scope authorization for the isolated JustinAlvaran profile; never switch work credentials or bypass a grant. Run full lint/relevant CI checks and inspect actual remote checks. Preserve current auth/RLS/consent/dry-run/provider gates.

Independent read-only security/final review and exact staged scans before publication. Retarget existing PR10 to main as the one-time consolidation of all existing branch heads, wait for green checks, then perform the explicitly authorized merge. Fast-forward preview to final main afterward. Future changes still use preview->main PRs. This avoids creating another promotion PR or remote branch while preserving all history. No force push/auto-merge. Verify own hosting production branch main separately.

Before deleting redundant remote heads, fetch fresh exact SHAs and prove all are ancestors of final main; reject concurrent advances. Leave dirty local worktrees intact. Record branches/heads/PRs/checks. Future work uses preview->main PRs, no extra remote branches. No paid plan, purchases, data migration, new customer record, customer send or provider activation. Rollback through ordinary revert PRs; no shared history rewriting.

Verification checkpoint:Netlifydashboardconfirmedkinggucci195ownaccount,projectagencydesk-crm(a0e2d3ed-b81b-4814-b0dc-6a5c090bef45),JustinAlvaran/agencydeskrepo,productionbranchmainandbranchdeploypreview. No hosting change needed. FullrepoESLint198files0errorswarnings;embeddedDB610assertionspass. OldEdgefixturelackedrequiredagency_id:35pass9fail;fixturecontractcorrectedand2missing/foreignagencynegativechecksadded,46pass0fail.LocalDeno2.9.7doesnotestablishexactCI2.5.6compatibility;waitforremotechecks. Productionworkerlogicunchanged.

Ruling: ownerlatestrequest explicitly targets main for this consolidation. PR10 is the sole one-time legacy-head exception; it now targets main, with preview synchronized afterward. Browser CI first uncovered two contrast defects; fix source colors, keep the complete existing accessibility assertions, and require the rerun green before release.

Browser follow-up: actualremotea278runpassedexactDeno2.5.6/allserverchecks/buildthenfailed3a11ycases. Axeidentifiedkanbanheadercontrast2.13anddemoinquirystatuscolors. Added2scopedCSSrulesonly,keptallassertions. Rebuilt0;completeCIbrowserselection39pass/4live-accountskip,exit0locally.4actualdesktop/phonecontrastshotsreviewedbeforepush. Independentread-onlyreviewnofindings. No auth/testassertionweakening. Existingautomationupdatedinplaceforfuturepreview->mainonly; schedule/status/chat/creationpreserved(readbackmatchedexcepttrailingwhitespace).
