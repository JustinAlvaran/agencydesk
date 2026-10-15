# Gmail send-only connection

This optional operator helper uses Google's official `google-auth-oauthlib` SDK.
It requests **only** `https://www.googleapis.com/auth/gmail.send`, saves private
refresh credentials, and sends no messages. It cannot read the inbox.

## Prepare the own Google project

1. Enable Gmail API in the own Google Cloud project.
2. Configure the OAuth consent screen for the own account. If the project is
   External/Testing, add the intended sender account as a test user. Gmail-scope
   refresh tokens for External/Testing projects expire after seven days; complete the appropriate
   production consent/verification requirements for ongoing use.
3. Create an OAuth client with application type **Desktop app**. Download its JSON
   privately to `.local/gmail/client.json`; do not commit or paste its contents.
4. Confirm the intended account and requested send permission before consenting.
   The login hint selects a suggested account; it does not prove which account was
   granted. Check the Google account shown on the consent screen yourself.

## Run after consent setup is approved

From the repository root, using Python 3.10 or newer. Replace `<sender-email>`
with the Gmail account being connected and `<agency-uuid>` with its own CRM agency UUID:

```powershell
python -m venv .local/gmail/venv
.local/gmail/venv/Scripts/python.exe -m pip install -r infra/gmail/requirements.txt
.local/gmail/venv/Scripts/python.exe infra/gmail/connect.py --from-email "<sender-email>" --agency-id "<agency-uuid>" --client-json .local/gmail/client.json --output .local/gmail/runtime.env
```

The helper prints a Google authorization URL. Open it in the signed-in browser and
review the account and send-only permission. Its SDK-managed callback binds only
to `127.0.0.1:8765`, waits up to ten minutes, validates OAuth state, and uses PKCE.
The token exchange has a thirty-second timeout. It never prints authorization
codes, tokens, client secrets, request diagnostics, or mailbox content.

The output is restricted to the ignored `.local/gmail` directory, uses exclusive
creation, and refuses to overwrite an existing file. Unix directories/files use
0700/0600 permissions. On Windows the helper resets explicit directory grants,
removes inherited directory ACLs, grants the current user full access, and resets
the downloaded client's ACL to inherit the private directory before saving.
OneDrive/device backups may retain files even when
Git ignores them: treat this directory as credentials, never as an artifact.

The saved variables are `GMAIL_CLIENT_ID`, `GMAIL_CLIENT_SECRET`,
`GMAIL_REFRESH_TOKEN`, `GMAIL_FROM_EMAIL`, and `GMAIL_AGENCY_ID`. After separate
approval, transfer them directly to the own Supabase project's server-side
secrets without printing them. Set rule provider to `gmail`; keep
`AUTOMATION_DELIVERY_MODE=dry_run` until a specific test email is approved.

Authorization does not verify a recipient, activate automation rules, schedule a
worker, or send a test email. Existing CRM tenant checks and recipient permission
checks still apply. Gmail account limits and Google's policies still apply; this
helper does not grant unlimited sending.

## Reconnect or renew testing credentials

The helper deliberately refuses to overwrite existing credentials. For an expired,
revoked, or seven-day testing token, authorize again using a new private output:

```powershell
.local/gmail/venv/Scripts/python.exe infra/gmail/connect.py --from-email "<sender-email>" --agency-id "<agency-uuid>" --client-json .local/gmail/client.json --output .local/gmail/renew.new.env
```

After the operator checks the Google account and send-only consent, transfer the
new values directly from `renew.new.env` into the matching Supabase project's
server-side secrets. Do not print, commit, or paste them into chat. Keep the old
runtime file until the new credentials have been verified, then replace the local
runtime file privately and remove the extra renewal copy. If `renew.new.env`
already exists, use another new filename or remove that stale copy only after
confirming it is no longer needed. Renewal does not enable automation or send mail.

The pinned SDK in `requirements.txt` was installed and the actual desktop OAuth
flow was verified with Google on October 15, 2026, including a token refresh
confirming exactly the Gmail send scope. External/Testing remains subject to the
seven-day token expiration; reconnecting does not remove that Google restriction.

## Primary references

- [Google Gmail Python quickstart](https://developers.google.com/workspace/gmail/api/quickstart/python)
- [Official installed application flow API](https://googleapis.dev/python/google-auth-oauthlib/latest/reference/google_auth_oauthlib.flow.html)
- [Official SDK package](https://pypi.org/project/google-auth-oauthlib/)
- [Google OAuth token expiration rules](https://developers.google.com/identity/protocols/oauth2#expiration)

Pinned SDK version `1.5.0` was verified against PyPI on October 15, 2026.
