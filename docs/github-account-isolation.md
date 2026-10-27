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

Open/update a PR with explicit repository, head and reviewed base, using a body file for the description. The repository default is `codex/directus-cms`; the existing services production branch is `codex/services-assistant`. Do not assume the default branch is the correct release base. Never push to either production/default branch, force-push, merge, approve or enable auto-merge on the owner's behalf. Production changes wait for owner review.

Use the PR template to explain actual behavior, checks, UI screenshots when applicable, setup, limitations, costs and rollback. Do not claim that configuration or an authenticated read proves a push, PR, deployment or MCP connection succeeded.

## GetLayers is separate

The requested MCP is configured only in `.codex/config.toml` using `npx -y mcp-remote https://mcp.getlayers.ai/mcp`. Its auth and npm cache directories are under ignored `.local/`. No global MCP registration was performed. The configuration parses successfully; process startup, account sign-in, entitlement and tool discovery still need verification in a reloaded trusted AgencyDesk session.

The owner completes any browser sign-in or authorization through the exact supplied URL. Website sign-in alone does not establish MCP authorization. Official GetLayers documentation requires Full Stack Lifetime for MCP; no purchase or upgrade is authorized. If existing access is unavailable, continue UI work with free existing components. No CRM data, secrets or private source should be submitted to the design service.

## Rollback

Revert the configuration/rules/template changes through review, then reload AgencyDesk to unload GetLayers. Stop using the personal process environment to return to the existing work CLI configuration; no work account switch is required. If revoking AgencyDesk's personal CLI access, use the isolated profile and have the owner review revocation; do not log out the work account or delete unrelated credentials.

## Sources

- [GitHub CLI environment and credential precedence](https://cli.github.com/manual/gh_help_environment)
- [GitHub CLI login and secure credential storage](https://cli.github.com/manual/gh_auth_login)
- [Codex project-scoped configuration](https://learn.chatgpt.com/docs/config-file/config-basic)
- [GetLayers MCP setup and access requirement](https://www.getlayers.ai/mcp)
- [mcp-remote auth directory](https://github.com/punkpeye/mcp-remote#troubleshooting)
