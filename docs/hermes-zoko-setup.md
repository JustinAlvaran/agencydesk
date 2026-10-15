# AgencyDesk: free-first messaging and Hermes

Updated 15 October 2026. Use your own accounts. Never import ApartmentHub keys, senders, recipients or customer records.

## Recommended route

Keep AgencyDesk as the CRM and automation engine. Zoko is optional. Start with reviewed WhatsApp drafts and Meta's test sender. Official production messaging may have usage charges even without an inbox subscription; verify your actual WhatsApp Manager rate card before activation.

- **Reviewed drafts:** staff can write text manually or request Hermes, review it and open a customer chat in WhatsApp. Staff press Send there. No Meta or Zoko key is needed; this is manual and creates no delivery receipt. A valid international customer phone and WhatsApp permission are required. Staff summaries cannot be opened as customer messages.
- **Direct Meta Cloud API:** the template-capable adapter exists. Use a free test sender first. Do not delete or migrate a number registered in regular WhatsApp during test setup.
- **Chatwoot Community:** free software with a shared inbox; needs its own server and maintenance. It does not run as an additional Vercel app. [Self-hosted plans](https://www.chatwoot.com/pricing/self-hosted-plans).
- **Hosted trials:** Chatwoot offers 15 days, but its permanent free cloud plan supports live chat only. respond.io offers seven days without a credit card. Their hosted WhatsApp service is paid after the trial. [Chatwoot](https://www.chatwoot.com/pricing), [respond.io](https://respond.io/pricing).

Do not activate paid Shopify, Zoko, messaging or model-provider plans under a free-only budget.

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

An approved one-message test through the temporary HTTPS gateway succeeded and its signed read receipt reached the own Supabase project. Customer automation rules remain disabled and worker delivery mode remains dry-run. The test was a gateway send, not an automatically triggered lead job. A real CRM workflow test still requires an explicitly approved lead/message.

`infra/waha/` contains the Docker configuration and authenticated send-only proxy. Private files are ignored and keys have restricted Windows access. A Cloudflare Quick Tunnel is a temporary development connection: its hostname changes after restart and there is no uptime guarantee. Keep the PC awake; configure a stable authenticated host before relying on unattended production sending. See [the repository comparison](../analysis/open-source-messaging.md).

The local Hermes audit found that the warmed draft proxy can respond within the timeout, but the small local model invented business facts during fictional tests and an earlier call timed out. Keep human review required; the hosted Hermes connection is not activated.

## Optional Zoko adapter details

The worker includes Zoko template sending. CRM rules, jobs and attempts store provider separately from channel. A provider change never reroutes an existing job; eligibility checks skip jobs whose rule provider changed. Provider message identities and receipt matching are scoped by provider.

If a paid account is separately authorized later, use your own `ZOKO_API_KEY` and `ZOKO_TEMPLATE_MAP` in Edge secrets. The mapping shape is `{ "<internal-template-key>": { "name": "<approved-templateId>", "language": "en", "body_parameters": ["body"] } }`. Choose Zoko on that rule, retain dry-run and test a new approved job. Only text body parameters are supported.

The adapter sends HTTPS POST to `https://chat.zoko.io/v2/message` using the `apikey` header and requires a valid acknowledgment/message ID. Acceptance is separate from delivery. Ambiguous/network outcomes become uncertain and never blindly resend. [Sending contract](https://docs.zoko.io/api-reference/send-message/).

**Zoko callbacks are not connected.** Public documentation did not establish a verifiable signature contract. Do not point Zoko at Meta's receipt endpoint or trust unauthenticated callbacks. Provider-authenticated reconciliation or a verified callback contract needs implementation.

## Login

AgencyDesk has `/login` with Supabase password and Google sign-in. Staff need an active `staff_members` record; portal users need an active `client_memberships` record. Public signup is disabled. Verify the real user's sign-in and membership separately; a visible Google button alone does not prove those work.
