# AgencyDesk credential-safety review — 27 October 2026

No confirmed credential leak or publication blocker was found in this bounded review. This is not a guarantee that all history, dependencies, generated files or deployed configuration are free of secrets.

## Scope and method

One independent read-only security subagent reviewed the four-file setup slice and relevant credential boundaries in `.gitignore`, `.env.example`, client/server environment access, the automation worker and the public service-chat ingress. It reported no matching private credential literals across 121 scoped files. Git access was blocked in the reviewer sandbox, so it did not establish tracking, staged contents or history. The primary agent separately verified the published PR file list, tracking and ignore state.

A local redacted check inspected the current Git index: **232 text files**, with **2 binary/large files skipped**, and found **0 credential-pattern/private-path candidates**. It checked common GitHub token, Supabase secret-key/service-role JWT, Google OAuth secret/refresh-token, Resend key, AWS access-key and private-key formats, plus accidental tracking of private env/auth paths. It emitted only category/path/line for any potential match, never values. This was a bounded pattern check, not an installed comprehensive scanner or an entropy-based/history audit. Diagnostic JSON stays in ignored `.local/implementation-20261019/`.

Real environment files, private CLI/MCP stores, browser credentials and provider tokens were not read. No provider API, credential rotation, customer send or production setting change was performed for this review.

## Checked boundaries

- `.codex/config.toml:9` and its following environment entries keep MCP auth/cache paths under `.local/`; `.gitignore` excludes that directory and real environment files. Ignore checks also passed for the personal CLI settings and Git setup path.
- `src/lib/env.ts:4` and the following client configuration entry use the Supabase public URL and publishable key. Those public identifiers differ from private service-role/provider credentials. `src/lib/supabase/server.ts:1` uses the server-only guard.
- `supabase/functions/automation-worker/index.ts:13` onward requires a private scheduler secret or verified active administrator and derives an agency binding rather than accepting a caller-selected workspace.
- `supabase/functions/service-chat/index.ts:9` onward rejects unauthorized relay requests before privileged quota/model work. Public services AI remains separate from CRM tools/data.
- The setup PR contains configuration/rules/documentation, with no real env/auth files, customer records or application source changes. Its personal publishing profile was verified independently of the default work profile.

These observations are source checks; they do not certify deployed behavior or complete tenant-isolation correctness.

## Remaining hardening and verification

1. Pin and verify `mcp-remote` before relying on its runtime. The user-requested `npx -y mcp-remote` configuration currently resolves mutable package code. No package was installed or MCP process started in this review.
2. Extend the unfinished service-chat Edge tests to cover authorized quota denial and sanitized provider failures, then verify the deployed browser/API flow before activation.
3. Before a release, use an established redacting secret scanner where available and inspect the actual staged change, generated client artifacts and relevant history. A clean current index cannot prove that an old commit or published artifact never contained a credential.
4. MCP startup, owner sign-in, entitlement and tool discovery remain pending. No private CRM content or credential values should be supplied to the design provider.

## Recurring publication gate

The existing daily improvement automation now requires an independent read-only security subagent before application/configuration publication. This may also serve as the final code reviewer. It reviews relevant credential tracking, browser/server boundaries, authorization, logs/errors, build/CI, PR/screenshot content and external tool requests, strictly within AgencyDesk. Pre-push findings and checks must be redacted and their scope recorded in the PR. Confirmed leaks block publication; existing exposure requires owner-reviewed rotation/revocation, not merely file deletion. Never rewrite shared history or silently change credentials.

The owner still decides whether to approve and merge. No security subagent may access other projects or Linear, purchase services, expand account scopes or merge the PR.
