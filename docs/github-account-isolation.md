# AgencyDesk GitHub account isolation

AgencyDesk uses its own GitHub CLI configuration at `.local/github-cli`, ignored by Git. The owner completed device authorization as **JustinAlvaran** on 27 October 2026. Read-only API checks confirmed push permission on `JustinAlvaran/agencydesk`; an authenticated Git remote read succeeded. No test push was necessary.

## Use the personal profile

Start each shell command in `C:/Users/paule/OneDrive/Documents/ChatGPT/agencydesk`. Set these variables only in that command process, not through machine/user environment settings or shell profiles:

```powershell
$env:GH_CONFIG_DIR = 'C:/Users/paule/OneDrive/Documents/ChatGPT/agencydesk/.local/github-cli'
$env:GIT_CONFIG_GLOBAL = Join-Path $env:GH_CONFIG_DIR 'gitconfig'
$env:GH_HOST = 'github.com'
$env:GH_REPO = 'JustinAlvaran/agencydesk'
Remove-Item Env:GH_TOKEN,Env:GITHUB_TOKEN -ErrorAction SilentlyContinue
```

The token variables are cleared only from this process because they take precedence over stored credentials. Do not print tokens, copy work credentials or change persistent environment variables. `GIT_CONFIG_GLOBAL` directs any Git setup performed by this CLI process to AgencyDesk's private file. Do not use global auth switching or global Git setup for AgencyDesk.

Verify the identity before publishing:

```powershell
gh api user --jq .login
gh api repos/JustinAlvaran/agencydesk --jq .permissions.push
```

Require `JustinAlvaran` and `true`. If either differs, stop publication and ask the owner to complete a new isolated sign-in. Do not fall back to another account or fork.

## Git and PR delivery

Use the same process environment for Git. Clear inherited credential helpers for that invocation and select the isolated CLI helper:

```powershell
git -c credential.helper= -c 'credential.helper=!gh auth git-credential' ls-remote --heads origin
```

The same `-c` options apply to an authorized feature-branch push. They do not change repository, user or machine configuration. Stage only the completed slice; preserve unrelated unfinished changes. Verify the remote is `https://github.com/JustinAlvaran/agencydesk.git` and author/committer are `Justin Alvaran <justinalvaran053023@gmail.com>`.

Open/update feature PRs with explicit repository, head and `--base preview`, using a body file for the description. As of 29 October, the repository default is `main`; `preview` is the owner's integration/review branch. The owner promotes `preview` into `main`. Before publishing, fetch both latest remote tips, merge them into the feature branch as needed, resolve conflicts, and rerun relevant checks. Verify both tips are ancestors of the tested feature head; do not rely on stale local refs or rewrite shared history. Never push application changes directly to main/preview, force-push, merge, approve or enable auto-merge on the owner's behalf. See [the branch workflow](branch-workflow.md). Historical provider branch names are not proof of current deployment configuration.

Use the PR template to explain actual behavior, checks, UI screenshots when applicable, setup, limitations, costs and rollback. Do not claim that configuration or an authenticated read proves a push, PR, deployment or MCP connection succeeded.

## Free design workflow

The owner rejected GetLayers on 28 October. Its project MCP configuration is removed; do not install, start, authenticate or reactivate it. No global MCP settings or private auth stores were changed. Use Superpowers for design/delivery and existing free React/Tailwind/Radix/Lucide components. UI/UX Pro Max may be used as an optional verified, project-scoped design reference; it is not a runtime dependency or paid-service requirement.

## Rollback

Revert only the reviewed changes through the owner-controlled PR workflow. Do not restore the rejected MCP configuration as a side effect of rollback. Stop using the personal process environment to return to the existing work CLI configuration; no work account switch is required. If revoking AgencyDesk's personal CLI access, use the isolated profile and have the owner review revocation; do not log out the work account or delete unrelated credentials.

## Sources

- [GitHub CLI environment and credential precedence](https://cli.github.com/manual/gh_help_environment)
- [GitHub CLI login and secure credential storage](https://cli.github.com/manual/gh_auth_login)
- [Codex project-scoped configuration](https://learn.chatgpt.com/docs/config-file/config-basic)
