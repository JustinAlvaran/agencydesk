# AgencyDesk messaging setup

Updated 15 October 2026. Start with reviewed manual WhatsApp drafts or Meta’s free test sender; production messaging can have usage charges. See [free-first setup](hermes-zoko-setup.md). Use your own accounts throughout. ApartmentHub supplies workflow ideas only; its credentials, destinations, sender identities, customer records, and sending app must never be imported.

## What you need first

**Hermes is optional.** AgencyDesk can decide when a follow-up is due, stop it after acceptance or changed eligibility, request approval, retry a known retryable attempt, and record the outcome without an AI agent. Start with the CRM automation and dry-run queue, then connect your own email account. Add official WhatsApp business messaging when your sender and approved templates are ready. Inbound reply handling is a later extension; the current callbacks record delivery receipts only.

| Capability | Needed | Where you get it |
| --- | --- | --- |
| Preview rules and follow-ups | AgencyDesk; no messaging key | Local demo or your own live CRM |
| Store and process live jobs | Your AgencyDesk database, deployed worker, scheduler | Your AgencyDesk infrastructure |
| Send email | Your Resend API key, verified sending domain, sender address | Your Resend account |
| Send WhatsApp reminders | Your Meta app, WABA, sender ID, access token, approved template | Your Meta business/developer accounts |
| Reviewed manual WhatsApp drafts | Customer phone, WhatsApp permission and staff review | Lead detail page; staff press Send in WhatsApp |
| AI drafts | Dedicated Hermes profile, local or own model, authenticated HTTPS gateway | Staff-only hermes-draft Edge endpoint |

ApartmentHub patterns to adapt: consent/suppression checks, reminder delays, cancellation on changed state, preview and approval, and an activity timeline. AgencyDesk owns the outbox and rechecks eligibility immediately before sending. Use the existing inquiry → lead → proposal → project lifecycle. Keep English content; no i18n framework is needed.

## Connect your own email account

1. Create or sign in to [your Resend account](https://resend.com/signup).
2. Open Domains and add a domain or subdomain you own. Add the DNS records shown by Resend at your DNS host, then wait for verification. Choose a sender on that verified domain. [Resend domain setup](https://resend.com/docs/dashboard/domains/introduction).
3. Open API Keys, create a separate key named AgencyDesk, and choose Sending access restricted to your sending domain where available. Store the value when created; the dashboard cannot display it again. [Resend key management](https://resend.com/docs/dashboard/api-keys/introduction), [API key creation](https://resend.com/docs/api-reference/api-keys/create-api-key).
4. Set `RESEND_API_KEY` and `AUTOMATION_FROM_EMAIL` in your worker's secret environment. Keep `AUTOMATION_DELIVERY_MODE=dry_run` while reviewing the intended recipient and content.
5. When the live worker is deployed, configure its receipt endpoint in Resend Webhooks: `https://<your-project-ref>.supabase.co/functions/v1/message-receipts?provider=resend`. Subscribe to delivered, bounced, complained, and failed email events, and place its signing secret in `RESEND_WEBHOOK_SECRET`. [Resend webhooks](https://resend.com/docs/webhooks/introduction).
6. Test an approved job with an address you own. A provider email ID means the API accepted the send; a verified delivery event establishes delivery. [Resend send contract](https://resend.com/docs/api-reference/emails/send-email).

The worker must reuse the same idempotency key and frozen payload on an eligible retry. Resend retains those keys for 24 hours; an unresolved attempt outside that window requires reconciliation instead of blind resend. [Resend idempotency](https://resend.com/docs/dashboard/emails/idempotency-keys).

## Prepare your own WhatsApp account

1. Use your own [Meta developer account](https://developers.facebook.com/apps/) and business portfolio. Create an app with WhatsApp and open its API setup. Link your WhatsApp Business Account (WABA).
2. Start with Meta's test sender and a recipient you control. Save the Phone Number ID, WABA ID, and temporary access token from setup. The Phone Number ID is Meta's identifier, not your phone number.
3. For ongoing operation, create a system user in your business settings, assign your app and WABA assets, and generate its token. Sending needs `whatsapp_business_messaging`; account/template operations need `whatsapp_business_management`. Business portfolio queries can additionally need `business_management`. Choose the token lifetime available to your account and monitor expiry. [Meta's official Cloud API collection](https://www.postman.com/meta/whatsapp-business-platform/documentation/wlk6lh4/whatsapp-cloud-api?entity=request-13382743-eb9a6721-1056-4db2-b00a-2290e04b5b5d).
4. In WhatsApp Manager, create and obtain approval for your own reminder templates. Record their name, language code, and ordered variables. Set AgencyDesk's template mapping to match that approved structure.
5. Keep consent evidence for each recipient and stop when they opt out. Free-form replies are limited to the 24-hour window following a user's message; outside that window, use approved templates. [WhatsApp business messaging policy](https://whatsappbusiness.com/policy/).
6. Set `WHATSAPP_ACCESS_TOKEN`, `WHATSAPP_PHONE_NUMBER_ID`, `WHATSAPP_GRAPH_VERSION`, and `WHATSAPP_TEMPLATE_MAP` in the worker. Use the Graph API version supported by your app's current dashboard.
7. After deploying the receipt function, configure the Meta HTTPS callback as `https://<your-project-ref>.supabase.co/functions/v1/message-receipts?provider=whatsapp`. Set `WHATSAPP_APP_SECRET` from your Meta app settings and generate a separate `WHATSAPP_WEBHOOK_VERIFY_TOKEN` of at least 32 random characters for the handshake. Enter that same verify token in Meta and subscribe to `messages`.

An English WhatsApp template language code describes your approved provider template; it does not require an i18n framework in AgencyDesk. Never copy ApartmentHub's template IDs, sender, mappings, recipients, or token.

## AgencyDesk worker configuration

Apply the AgencyDesk code and database changes first:

1. Select your own AgencyDesk Supabase project. If this is a new project, follow the base setup in README.md first; the new migration files extend that schema.
2. Apply `20261014055043_automation.sql`, `20261014055050_lead_workflow.sql`, and `20261014055051_inquiry_preferences.sql` in order from `supabase/migrations/`. These migrations and lead ledger privileges were deployed to the own AgencyDesk project. Apply the checked-in provider routing migration before the updated worker/UI. Verify each environment’s actual migration history first.
3. Deploy the three sending functions plus optional hermes-draft with the Supabase CLI, linked to that own project: `supabase functions deploy inquiry`, `supabase functions deploy automation-worker`, and `supabase functions deploy message-receipts`. The checked-in configuration lets the worker and receipts validate their own credentials; the public inquiry retains its gateway JWT check.
4. Configure Next.js with `APP_MODE=live`, your own `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`, `SUPABASE_EDGE_ANON_KEY`, and HTTPS `APP_URL`. Provider keys go in Edge secrets below. The publishable key is public; the legacy inquiry gateway JWT remains a server setting. Use the existing admin/client invitation setup to create live memberships.
5. Open `/crm/automations`, enable only the rule being tested, record the recipient's explicit permission, and review its queued preview. Manual lead creation records a lead; it does not create an inquiry acknowledgment. The acknowledgment trigger comes from a submitted website inquiry.

These are **Supabase Edge Function secrets**, not browser settings. In your own project's dashboard, open Edge Function Secrets and save each key/value. Local Edge Functions use their own ignored environment file; putting these only in Next.js's `.env.local` does not configure the worker. [Supabase secret setup](https://supabase.com/docs/guides/functions/secrets).

Start with:

```dotenv
AUTOMATION_DELIVERY_MODE=dry_run
AUTOMATION_CRON_SECRET=<new-random-secret-at-least-32-characters>
EMAIL_PROVIDER=resend
RESEND_API_KEY=<your-own-key>
AUTOMATION_FROM_EMAIL=AgencyDesk <hello@your-verified-domain.example>
APP_URL=https://your-agencydesk.example
```

After the automation migration and functions are deployed to your own AgencyDesk project, schedule a POST to `/functions/v1/automation-worker` using the `x-automation-secret` header with your cron secret. An active administrator can also invoke the worker with their authenticated session. Keep scheduler secrets in its secret store. Periodic processing requires a scheduler; leaving the CRM page open is unnecessary.

Choose a schedule supported by your hosting plan; do not assume minute-by-minute cron is free. An administrator can process dry-run batches manually. Each invocation processes up to five jobs and claims them one at a time so a stopped worker cannot strand an unsent batch. The request body can be `{}`; it cannot override recipients or the delivery mode.

Review the queue and approvals first, then set `AUTOMATION_DELIVERY_MODE=live` for an approved test. Rules and outbound approvals remain separate from the delivery-mode setting.

Dry-run jobs finish as Simulated and never replay as live sends. After switching mode, trigger a fresh test event. For a known configuration failure or explicit provider rejection, an administrator can fix the issue and reset an eligible failed job for approval; the attempt limit and deduplication identity remain intact. Unknown outcomes and receipt failures require provider reconciliation and cannot be reset this way.

Additional optional worker values:

| Secret | Purpose |
| --- | --- |
| `RESEND_WEBHOOK_SECRET` | Resend receipt signature verification |
| `WHATSAPP_ACCESS_TOKEN` | Your scoped Meta sender token |
| `WHATSAPP_PHONE_NUMBER_ID` | Your Meta sender identifier |
| `WHATSAPP_GRAPH_VERSION` | Explicit supported Graph API version |
| `WHATSAPP_TEMPLATE_MAP` | JSON mapping internal template keys to your approved templates |
| `WHATSAPP_APP_SECRET` | Meta webhook HMAC verification |
| `WHATSAPP_WEBHOOK_VERIFY_TOKEN` | Meta webhook GET handshake |

Template-map structure, with placeholders only:

```json
{
  "<internal-template-key>": {
    "name": "<your-approved-template-name>",
    "language": "en_US",
    "body_parameters": ["body"]
  }
}
```

The map's key must match the AgencyDesk job's template key. Use positional templates (`{{1}}`, `{{2}}`) with the same ordered variables as `body_parameters`. It specifies references to rendered `subject` or `body`; it is not a free-form provider payload. WhatsApp parameters are normalized to a single line and conservatively limited to 1,024 characters. The current adapter supports text body parameters only; named, header, button, and media templates need a further adapter extension. The CRM preview shows the parameter content; the approved template supplies its fixed wording.

The initial rules use these exact keys. They start disabled and require approval by default:

| Internal template key | Trigger | Initial delay |
| --- | --- | --- |
| `inquiry_acknowledgment` | Inquiry received | Immediately |
| `proposal_notice` | Proposal published | Immediately |
| `proposal_follow_up` | Proposal still awaiting review | Three days after publication |
| `proposal_accepted` | Proposal accepted | Immediately |

For live proposal links, set `APP_URL` to your own HTTPS AgencyDesk origin in the Edge Function secrets as well as the application environment. Localhost is for dry-run previews. Keep the origin stable while jobs are pending so retries retain the same message payload.

## Where Hermes fits

The researched product is [NousResearch Hermes Agent](https://github.com/NousResearch/hermes-agent), an open-source agent runtime. It can help draft a response, summarize a conversation, or suggest a lead's next action. Our recommendation is to add it after reliable deterministic sending works. This identifies a suitable product; ApartmentHub's custom hook does not prove which Hermes runtime its remote service uses.

If you later add it, use the official [installation guide](https://hermes-agent.nousresearch.com/docs/getting-started/installation). Native Windows is supported; the source installer manages Python and Node dependencies. Its Windows data directory defaults to `%LOCALAPPDATA%\hermes`, or the directory selected by `HERMES_HOME`. Run `hermes setup` to configure your own model provider; `hermes setup --portal` is the Nous Portal login route. The runtime needs an available host while jobs run.

Hermes has a real HTTP API. In its own data-directory `.env`, configure:

```dotenv
API_SERVER_ENABLED=true
API_SERVER_HOST=127.0.0.1
API_SERVER_PORT=8642
API_SERVER_KEY=<new-random-secret-you-generate>
```

Start `hermes gateway`. A backend client uses `Authorization: Bearer <that-secret>` with `POST /v1/chat/completions` or the Runs API. This key authenticates your installation; it is separate from the model provider's credentials. The API executes the configured agent tools, so keep it behind a private backend connection and restrict its tools. A returned answer is not a WhatsApp delivery receipt. [Hermes API documentation](https://hermes-agent.nousresearch.com/docs/user-guide/features/api-server).

Hermes offers two WhatsApp connections:

- **Cloud API:** official Meta transport, your own business sender and credentials, public HTTPS webhook. Guided setup: `hermes whatsapp-cloud`. Its current documentation says approved-template sending is not implemented. That makes it unsuitable as AgencyDesk's delayed reminder sender when the 24-hour reply window has expired. Use the direct template-capable Meta adapter for those jobs. [Hermes Cloud API guide](https://hermes-agent.nousresearch.com/docs/user-guide/messaging/whatsapp-cloud).
- **Baileys:** a Node bridge paired by QR code that emulates WhatsApp Web. It needs no Meta developer token, but its documentation identifies account restriction and protocol compatibility risks. We recommend the official Cloud API for AgencyDesk customer messaging. [Hermes Baileys guide](https://hermes-agent.nousresearch.com/docs/user-guide/messaging/whatsapp).

Future connection shape: verified inbound event → AgencyDesk activity and sequence stop → scoped context to Hermes → suggested response → staff review → AgencyDesk outbox → provider. Give the agent narrow read/draft tools; sending and lead changes remain checked AgencyDesk operations. The staff-only hermes-draft endpoint now implements scoped drafts and summaries. It requires tools and persistent memory disabled; see [the connection contract](hermes-zoko-setup.md). Reviewed customer drafts can be opened manually in WhatsApp; inbound chat storage and automatic replies remain a later extension.

## Secret placement

Use placeholders in tracked examples. Put actual provider values directly in the AgencyDesk worker's secret environment. Hermes configuration belongs to the Hermes host. Never put provider keys in browser `NEXT_PUBLIC_` variables, repository files, reports, screenshots, or message logs. The Next.js application does not need a service-role key for this setup.

Consult the environment deployment report for hosted status. Installation and keys alone do not prove live sending or AI drafts work. Keep delivery in dry-run until a separately reviewed test.
