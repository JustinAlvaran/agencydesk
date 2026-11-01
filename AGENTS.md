<!-- BEGIN:nextjs-agent-rules -->

# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->

# Git authorship

- Use Justin Alvaran's GitHub identity for the author and committer: `Justin Alvaran <justinalvaran053023@gmail.com>`.
- Credit commits solely to Justin. Do not add Codex or any AI as an author or co-author.
- Do not append `Co-authored-by`, `Generated-by`, or other AI attribution trailers to commit messages.
- Preserve this preference for future commits and pushes in this repository.

# Owner delivery and isolation rules (27 October 2026)

- Work only in this AgencyDesk repository. Never inspect, scan, edit or run commands in any other project, especially software engineer folders or ApartmentHub.
- Never use or change Linear. Use other plugins only for resources confirmed to belong to AgencyDesk. Never change global MCP or plugin settings.
- Use only kinggucci195@gmail.com's Supabase connection for AgencyDesk. Verify both account identity and the AgencyDesk project binding before provider access; a matching project name alone is insufficient. If ambiguous, continue local work without accessing either account's other projects.
- UI redesign is the current first priority; integration and automation improvements follow. Preserve working flows, data boundaries and all unfinished work.
- Do not use, install, start, authenticate or require GetLayers. The owner rejected it on 28 October. Use Superpowers for design/delivery and existing free UI components; UI/UX Pro Max is optional only if available with verified license and project-scoped setup. Never stall the design on a paid tool.
- Keep only `main` and `preview` as permanent remote branches. For finished, verified work, commit scoped changes to `preview` and create/update a PR with head `preview` and base `main` for owner review. Do not publish additional feature branches; preserve unrelated unfinished local work.
- Never force-push or push application changes directly to `main`. The owner normally reviews and merges `preview` into `main`; do not merge, auto-merge or approve without an explicit current request. The owner's 1 November 2026 request authorizes this one-time consolidation of all committed AgencyDesk branches into main and deletion of redundant remote branches after preservation and passing checks. It does not authorize unrelated database/provider access or future automatic merges.
- Explain the complete final change in the PR: behavior and purpose, UI/integration changes, actual checks/results, mobile/desktop screenshots for visual changes, limitations, configuration/migration steps, costs and rollback. Mark unfinished verification as draft. Attach the PR to the chat.
- Preserve Justin-only authorship above. No AI attribution or coauthor trailers. Never include credentials or private customer data in commits or PRs.

- When external sign-in is needed, provide the exact provider login or generated authorization link for the owner to complete. Do not silently switch accounts or treat website login as proof of CLI/MCP authentication.

- Use the isolated personal GitHub CLI profile described in docs/github-account-isolation.md for AgencyDesk. Verify JustinAlvaran and repository push access before publishing. Do not switch the global work login; use per-process configuration and per-command Git credential-helper overrides.

# Independent credential-security review

- Before each substantive application/configuration publication, use one independent read-only security subagent. It may also perform the final code review; keep implementation inline and the team small.
- Give the reviewer this exact AgencyDesk-only/no-Linear/no-other-project scope. Check secret tracking, client/server environment boundaries, auth and agency isolation, API/webhook permissions, logs/errors, CI, generated browser assets, PR text/screenshots and external MCP requests relevant to the change.
- Never read or print private credential stores or real env/token values for a routine review. Report suspected secrets only as redacted category, path, line and severity. Public project IDs/publishable keys are not private service-role/OAuth credentials.
- Before committing/pushing, verify the exact staged allowlist, ignored credential paths and a redacted secret scan. Record tools, scope and limits; an index-only scan is not a history/deployment audit. Keep actual secrets out of commits, PRs, logs, screenshots, build artifacts and design prompts.
- Block publication on confirmed leaks. If already published, inform the owner with redacted scope and rotation/revocation steps; do not print values, assume file deletion revokes a token, rewrite shared history or rotate credentials without required authorization.

# AgencyDesk local n8n pilot

- For n8n workflow work, load `.agents/skills/using-n8n-skills-official/SKILL.md` and the matching capability references. Plain pinned official skills are installed project-locally; no plugin hooks or global installation.
- Owner rules override upstream defaults: free-only, no paid Gateway credits, no real customer sends, no autonomous approval, no other-project resources or credentials.
- n8n is an internal coordinator. AgencyDesk retains authoritative consent, agency boundaries, staff approval, outbox leases, idempotency and uncertain-outcome handling. Never bypass these with direct provider nodes/SQL.
- Local pilot is loopback-only and disconnected from CRM/provider credentials. Native MCP must use project-scoped configuration, strict OS-keyring storage and owner-approved minimal scopes. No workflow publishing/activation, automatic exposure or provider connections without separate authorization. Workflow write access may permit side effects; it is not an execution lock. Verify actual tool discovery/authentication separately from saved configuration.
- Do not schedule the current automation worker based on a `dry_run` body field; mode comes from server configuration. Finish caps and a fail-closed dry-run integration boundary before activating any recurring CRM worker workflow.


# Two-branch workflow (1 November 2026 owner decision)

- `main` is the production/release branch; `preview` is the working/review branch. Use `gh pr create --head preview --base main` for future reviewed changes. Do not recreate legacy remote feature branches.
- Before work/publication, fetch current main and preview through the isolated JustinAlvaran CLI profile. Keep preview synchronized through normal merges, preserve WIP and rerun affected checks. Never rewrite shared history.
- Delete an obsolete remote branch only after its freshly verified exact head is an ancestor of final main. Recheck for concurrent updates immediately before deletion. Keep dirty local worktrees intact; local private WIP is not permission to publish another remote branch.
- GitHub default/branch names do not prove provider settings. Verify the confirmed own AgencyDesk hosting target before claiming production uses main. Free-only operation and all credential-security/customer-delivery safeguards remain in force.
- This policy supersedes older feature-branch -> preview instructions in historical plans/automations. Routine future automation publishes preview -> main PRs and leaves merging to the owner unless separately explicitly authorized.
