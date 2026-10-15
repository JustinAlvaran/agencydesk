# AgencyDesk: free-first messaging and Hermes

Updated 15 October 2026. Use your own accounts. Never import ApartmentHub keys, senders, recipients or customer records.

## Recommended route

Keep AgencyDesk as the CRM and automation engine. Zoko is optional. WAHA is linked for controlled testing, with worker dry-run and staff approval retained; live customer sending is off. Reviewed manual drafts remain available. Optional Gmail is configured and authenticated with send-only OAuth, but no email has been sent or Gmail rule activated. Official Meta production messaging may have usage charges even without an inbox subscription; verify your actual WhatsApp Manager rate card before activation.

Only AgencyDesk's **Inquiry acknowledgment** rule is enabled: WhatsApp via WAHA, immediate, with approval required. It queues for review/simulation while `AUTOMATION_DELIVERY_MODE=dry_run`; live customer delivery is off. Its other three rules and all four rules in the other agency are disabled. No scheduler is configured.

- **Reviewed drafts:** staff can write text manually or request Hermes, review it and open a customer chat in WhatsApp. Staff press Send there. No Meta or Zoko key is needed; this is manual and creates no delivery receipt. A valid international customer phone and WhatsApp permission are required. Staff summaries cannot be opened as customer messages.
- **Direct Meta Cloud API:** the template-capable adapter exists. Use a free test sender first. Do not delete or migrate a number registered in regular WhatsApp during test setup.
- **Chatwoot Community:** free software with a shared inbox; needs its own server and maintenance. It does not run as an additional Vercel app. [Self-hosted plans](https://www.chatwoot.com/pricing/self-hosted-plans).
- **Hosted trials:** Chatwoot offers 15 days, but its permanent free cloud plan supports live chat only. respond.io offers seven days without a credit card. Their hosted WhatsApp service is paid after the trial. [Chatwoot](https://www.chatwoot.com/pricing), [respond.io](https://respond.io/pricing).

Do not activate paid Shopify, Zoko, messaging or model-provider plans under a free-only budget.

## CRM work and contact preferences

ApartmentHub contributed workflow concepts only: lead stages, staff assignment, call outcomes, callback tasks and activity history. Its sender application, credentials, staff identities, recipients and i18n layer were not imported. AgencyDesk's Tasks page defaults to open follow-ups in due order and supports overdue/completed/all and mine/unassigned filters, owner labels and lead links.

Recipient suppression blocks a withdrawn email address or WhatsApp number across duplicate leads in the same agency and channel. It cancels unsent queued/pending-approval jobs and is checked again before sending and before manual WhatsApp handoff. Staff can record a block; only an administrator may clear it after renewed permission is verified. Clearing a block does not restore consent or resend cancelled jobs. Incoming chats do not automatically record an opt-out. No-answer recovery and a general contact cooldown remain future work. [Adaptation details](../analysis/agency-workflow-adaptation.md).

## Optional own Gmail connection

Gmail uses your own Google OAuth client and the account owner's `gmail.send` consent, suitable for a personal account. ApartmentHub's Workspace delegation is not reused. Google sign-in to the CRM does not grant Gmail sending access. No Gmail plugin is required for the CRM runtime.

The free own Google Cloud project **AgencyDesk Gmail** (`smooth-graph-511708-m4`) has Gmail API enabled, a configured consent screen and a user-approved Desktop OAuth client. Google's consent screen verified `kinggucci195@gmail.com`; only `gmail.send` was granted. The official SDK helper completed authorization and an actual refresh returned the exact send-only scope. The five `GMAIL_*` settings are saved in the own Supabase project and their SHA-256 digests matched the private local configuration. No email was sent and no Gmail rule was selected or enabled; acknowledgment still uses WAHA in dry-run. [Operator helper](../infra/gmail/README.md).

Tracked `GMAIL_CLIENT_ID`, `GMAIL_CLIENT_SECRET`, `GMAIL_REFRESH_TOKEN`, `GMAIL_FROM_EMAIL` and `GMAIL_AGENCY_ID` examples stay blank; actual values live only in private configuration and Edge secrets. `GMAIL_AGENCY_ID` binds the sender to the own agency. The runtime is configured and authenticated; an approved end-to-end send test remains pending. The Google project is External/Testing, so the send-scope refresh token expires after seven days unless production consent requirements are addressed. No paid plan was activated. Provider acceptance is distinct from delivery; delivery/read receipts and mailbox sync are not implemented. [Configuration and limitations](messaging-setup.md#optional-gmail-sender--authenticated-send-test-pending).

## Hermes drafts

The code includes a staff-only `hermes-draft` Edge Function, server action and lead editor. The function verifies the real session and active membership, then reads a nonarchived lead through RLS in that agency. It sends bounded contact name, service and brief; phone numbers and email addresses are redacted. It returns text for staff review, with no sending or lead changes. Inbound chat storage and automatic replies are not implemented.

Use [NousResearch Hermes Agent](https://hermes-agent.nousresearch.com/docs/getting-started/installation) with a dedicated profile. Local Ollama can avoid model API charges if the PC has enough memory and stays awake. Installation alone does not connect the hosted CRM or prove generation fits its timeout.

Disable **all API-server tools and persistent/cross-request memory** in the dedicated draft profile. Keep the full Hermes server on loopback and use fresh requests without shared sessions. The Edge Function checks `GET /v1/toolsets` on every generation and refuses enabled toolsets containing tools. A system prompt alone does not disable tools. [API server documentation](https://hermes-agent.nousresearch.com/docs/user-guide/features/api-server).

Expose only an authenticated HTTPS draft gateway with `GET /v1/toolsets` and synchronous `POST /v1/chat/completions`. Keep administration, sessions, runs and tool APIs private. Use a separate gateway key, bounded request size/timeouts, no request logging and no browser CORS. A temporary development tunnel needs the PC awake and changes hostname after restart; it is not reliable production hosting.

After testing the profile and gateway, store these in **your AgencyDesk Supabase Edge Function secrets**, never in browser settings or GitHub:

```dotenv
HERMES_API_URL=https://your-authenticated-draft-gateway.example
HERMES_API_KEY=<your-own-gateway-key-at-least-32-characters>
HERMES_AGENCY_ID=<your-own-agency-UUID>
HERMES_DRAFT_PROFILE_READY=true
```

The endpoint accepts only `{ "lead_id": "<UUID>", "purpose": "reply|follow_up|summary" }`. It requests model alias `hermes-agent` and returns `{ "draft": "...", "requires_approval": true }`. The response must complete within 20 seconds. Missing configuration, enabled tools and truncated responses fail closed. Manual drafts remain available when Hermes is unavailable.

## WAHA preparation (15 October)

The source includes an optional WAHA sender adapter, frozen provider routing and a rule selector entry. Server-only settings are `WAHA_API_URL` (the authenticated HTTPS send-only gateway), `WAHA_API_KEY` (its separate gateway key), `WAHA_SESSION` and `WAHA_AGENCY_ID`. The worker refuses to lend this sender to another agency. The full WAHA API stays on localhost. The adapter retains approval/consent checks and treats uncertain send outcomes conservatively; acceptance is separate from delivery.

Local WAHA is paired to the user's own sender. Its signed callback is `https://<your-project-ref>.supabase.co/functions/v1/message-receipts?provider=waha`, using SHA-512 raw-body HMAC with `WAHA_WEBHOOK_SECRET`. `WAHA_SESSION` and `WAHA_SENDER_ID` must match the signed event. Only outgoing individual message acknowledgments update receipt state; incoming chats are ignored. ACK 2 means delivered, 3/4 read, 0/1 are ignored. Stable event IDs are deduplicated. Never point WAHA at the Meta callback provider parameter.

An approved one-message test through the temporary HTTPS gateway succeeded and its signed read receipt reached the own Supabase project. Only the immediate WAHA Inquiry acknowledgment rule is now enabled for approval/simulation; the worker remains in dry-run and no scheduler is configured. The other three AgencyDesk rules remain disabled, as do all four rules in the other agency. The test was a gateway send, not an automatically triggered lead job. A real CRM workflow test still requires an explicitly approved lead/message; live customer delivery is off.

`infra/waha/` contains the Docker configuration and authenticated send-only proxy. Private files are ignored and keys have restricted Windows access. A Cloudflare Quick Tunnel is a temporary development connection: its hostname changes after restart and there is no uptime guarantee. Keep the PC awake; configure a stable authenticated host before relying on unattended production sending. See [the repository comparison](../analysis/open-source-messaging.md).

The local Hermes audit found that the warmed draft proxy can respond within the timeout, but the small local model invented business facts during fictional tests and an earlier call timed out. Keep human review required; the hosted Hermes connection is not activated.

## Optional Zoko adapter details

The worker includes Zoko template sending. CRM rules, jobs and attempts store provider separately from channel. A provider change never reroutes an existing job; eligibility checks skip jobs whose rule provider changed. Provider message identities and receipt matching are scoped by provider.

If a paid account is separately authorized later, use your own `ZOKO_API_KEY` and `ZOKO_TEMPLATE_MAP` in Edge secrets. The mapping shape is `{ "<internal-template-key>": { "name": "<approved-templateId>", "language": "en", "body_parameters": ["body"] } }`. Choose Zoko on that rule, retain dry-run and test a new approved job. Only text body parameters are supported.

The adapter sends HTTPS POST to `https://chat.zoko.io/v2/message` using the `apikey` header and requires a valid acknowledgment/message ID. Acceptance is separate from delivery. Ambiguous/network outcomes become uncertain and never blindly resend. [Sending contract](https://docs.zoko.io/api-reference/send-message/).

**Zoko callbacks are not connected.** Public documentation did not establish a verifiable signature contract. Do not point Zoko at Meta's receipt endpoint or trust unauthenticated callbacks. Provider-authenticated reconciliation or a verified callback contract needs implementation.

## Login

AgencyDesk has `/login` with Supabase password and Google sign-in. Live staff Google login was verified for `kinggucci195@gmail.com` as an administrator in the own agency. It currently contains zero leads; the 11 existing leads belong to the other agency and were preserved. Staff need an active `staff_members` record; portal users need an active `client_memberships` record. Public signup is disabled. This confirms the tested Google staff login, not every password/client login path.
