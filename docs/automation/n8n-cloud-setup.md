# AgencyDesk n8n Cloud Setup Guide (`justinautomaton.app.n8n.cloud`)

This guide covers configuring the two AgencyDesk workflows on **n8n Cloud** (`https://justinautomaton.app.n8n.cloud`) with **zero `$env.*` references**, free Google OAuth integrations (`kinggucci195@gmail.com`), and free WhatsApp owner alerts (`+639913780170`).

---

## 1. Why `$env` Is Forbidden on n8n Cloud (and How `$vars` Fixes It)

n8n Cloud blocks all `$env.*` reads in expressions and Code nodes with:

> `access to env vars denied`

Both workflows eliminate `$env.*` completely:

1. **CRM Persistence & Deduplication via API:** Instead of calling raw Supabase PostgREST endpoints from n8n, all lead creation/dedup/audit logging goes through AgencyDesk's authenticated integration API:
   - `POST https://agencydesk-theta.vercel.app/api/integrations/n8n/leads/upsert`
2. **Safe n8n Cloud Variables (`$vars`) with Defaults:** All expressions and Code nodes safely guard `$vars` (`typeof $vars !== 'undefined' && $vars?.KEY`) and fall back to safe defaults so executions succeed even before Variables are configured.

---

## 2. Workflows Included

| Workflow File | Purpose | Webhook / Trigger |
|---|---|---|
| [`infra/n8n/workflows/agencydesk-lead-automation.json`](../../infra/n8n/workflows/agencydesk-lead-automation.json) | **Lead Intake & 2-Way Sheet Sync:** Normalizes phone (`09...` -> `+639...`) & Instagram, scores lead (0–100), upserts via `/api/integrations/n8n/leads/upsert`, appends to `AgencyDesk_Leads_Master`, and alerts `+639913780170`. Also handles inbound Google Sheets edits with loop suppression. | `POST /webhook/agencydesk-lead`<br>`POST /webhook/agencydesk-sheets-sync` |
| [`infra/n8n/workflows/agencydesk-post-lead-lifecycle.json`](../../infra/n8n/workflows/agencydesk-post-lead-lifecycle.json) | **Post-Lead Lifecycle:** Handles `contacted`/`qualified` follow-up drafts (approval-gated, never auto-sent), `proposal_published`/`proposal_sent` 72h follow-up reminders, `proposal_accepted`/`won` kickoff alerts & drafts, and a daily 08:30 `Asia/Manila` stale-lead morning digest to WhatsApp + Gmail. | `POST /webhook/agencydesk-lifecycle`<br>Daily Schedule (`30 8 * * *`, `Asia/Manila`) |

---

## 3. n8n Cloud Variables (`$vars`)

In **n8n Cloud -> Settings -> Variables** (if available on your plan), add only non-secret config or integration values you want to override:

| Variable Name | Default in Workflow | Description |
|---|---|---|
| `AGENCYDESK_APP_URL` | `https://agencydesk-theta.vercel.app` | Base URL of your AgencyDesk Vercel deployment (no trailing slash). |
| `AUTOMATION_SECRET` | **Required (fail-closed)** | Shared secret matching Vercel's `AUTOMATION_SECRET` env var. Verified fail-closed on every inbound webhook (`X-AgencyDesk-Signature` or `Authorization: Bearer`) and sent on outbound CRM API calls. *(On credential-enabled plans, you can alternatively configure **Header Auth** credentials (`httpHeaderAuth`) on the Webhook trigger and HTTP Request nodes instead of `$vars.AUTOMATION_SECRET`.)* |
| `GOOGLE_SHEETS_SPREADSHEET_ID` | `AgencyDesk_Leads_Master` | The spreadsheet ID from your Google Sheets URL (`https://docs.google.com/spreadsheets/d/<SPREADSHEET_ID>/edit`). |
| `OWNER_WHATSAPP_NUMBER` | `+639913780170` | Owner phone number in E.164 format for instant lead, stage, kickoff, and morning digest alerts. |
| `OWNER_EMAIL` | `kinggucci195@gmail.com` | Owner Gmail address for morning stale-lead digests and draft creation. |
| `WHATSAPP_API_ENDPOINT` | `${AGENCYDESK_APP_URL}/api/crm/automations/whatsapp-dispatch` | Optional override for a free self-hosted **WAHA** endpoint or **Meta WhatsApp Cloud API** relay. |
| `OUTBOX_DRAFT_ENDPOINT` | `${AGENCYDESK_APP_URL}/api/integrations/n8n/leads/upsert` | Optional override if you expose a dedicated service-authenticated outbox endpoint. |
| `STALE_LEAD_DAYS` | `3` | Number of days without activity before an open lead is included in the daily morning digest. |

> **Fail-Closed Security & Schedule Isolation:**
> - Both workflows enforce **fail-closed** signature verification (`!expectedSecret || signature !== expectedSecret` throws `Unauthorized`). Set `$vars.AUTOMATION_SECRET` before activating webhooks, or enable **Header Auth** on the Webhook trigger node if your n8n Cloud plan does not include Custom Variables (`$vars`).
> - In `agencydesk-post-lead-lifecycle.json`, `Verify Lifecycle Webhook Signature` runs **exclusively on the Webhook branch** before merging with `Schedule - Daily Morning Stale Check` (`Tag Schedule Trigger`), so external callers cannot spoof `triggered_by: "schedule"`.

---

## 4. Free Google Sheets & Gmail OAuth Setup (`kinggucci195@gmail.com`)

1. Open Google Cloud Console under `kinggucci195@gmail.com` (free tier — $0.00).
2. Create or select a project (e.g., `AgencyDesk-n8n`), then enable:
   - **Google Sheets API**
   - **Google Drive API** (required for spreadsheet search/selection)
   - **Gmail API** (for creating approval-gated drafts and sending your morning stale digest)
3. Configure **OAuth consent screen**:
   - User Type: **External** (add `kinggucci195@gmail.com` under **Test users** while in Testing mode, or publish if needed).
4. Create **OAuth 2.0 Client ID** (Web application):
   - Authorized redirect URI: copy the exact OAuth Redirect URL shown inside n8n Cloud when creating a **Google Sheets OAuth2 API** / **Gmail OAuth2** credential (typically `https://oauth.n8n.cloud/oauth2/callback`).
5. In n8n Cloud (**Credentials -> Add Credential**):
   - Create **Google Sheets OAuth2 API** signed in as `kinggucci195@gmail.com`.
   - Create **Gmail OAuth2** signed in as `kinggucci195@gmail.com`.
6. Create a Google Sheet named **`AgencyDesk_Leads_Master`** with a tab named **`Leads_Master`** and Row 1 headers:
   `Timestamp`, `Lead ID`, `Contact Name`, `Email`, `WhatsApp`, `WhatsApp Opt-in`, `Instagram`, `Company`, `Service`, `Budget`, `Score`, `Status`, `Source`, `Brief`, `Notes`, `Website CRM Link`, `Sync Hash`, `Last Synced By`
7. Open each Google Sheets and Gmail node in the imported workflows and select your `kinggucci195@gmail.com` credential.

---

## 5. Free WhatsApp Alerts to `+639913780170`

AgencyDesk supports three **$0/month** WhatsApp alert paths:

1. **Default — AgencyDesk CRM Dispatch Logger (`/api/crm/automations/whatsapp-dispatch`):**
   - Logs every alert to `activity_events` in Supabase and pairs with 1-click **`Chat on WA`** (`https://wa.me/...`) buttons inside `/crm/leads`.
2. **Free Self-Hosted WAHA (WhatsApp HTTP API):**
   - Run the open-source WAHA Docker container (e.g., on a free-tier VM or local tunnel) and point `$vars.WHATSAPP_API_ENDPOINT` to your WAHA send endpoint.
3. **Meta WhatsApp Cloud API Free Tier:**
   - Meta grants **1,000 free service conversations/month**. Point `$vars.WHATSAPP_API_ENDPOINT` to your Meta Cloud API webhook/relay.

---

## 6. Vercel Environment Variables (AgencyDesk App)

In your AgencyDesk Vercel project (`agencydesk-theta.vercel.app`), set:

- `AUTOMATION_SECRET` — high-entropy random secret (matches n8n `$vars.AUTOMATION_SECRET` / Header Auth).
- `N8N_LEAD_WEBHOOK_URL` — `https://justinautomaton.app.n8n.cloud/webhook/agencydesk-lead`
- `N8N_LIFECYCLE_WEBHOOK_URL` — `https://justinautomaton.app.n8n.cloud/webhook/agencydesk-lifecycle`

---

## 7. Verification Checklist Before Activating

1. Import both JSON files in `https://justinautomaton.app.n8n.cloud` (**... -> Import from File**).
2. Confirm **zero `$env` references** exist anywhere in either workflow.
3. Bind your `kinggucci195@gmail.com` Google Sheets OAuth2 and Gmail OAuth2 credentials on every Sheets/Gmail node.
4. Confirm `AgencyDesk_Leads_Master` / `Leads_Master` exists and `$vars.GOOGLE_SHEETS_SPREADSHEET_ID` is set (or selected in the node dropdown).
5. Run a manual test execution with sample payload before toggling **Active** on.
6. Verify external customer emails in `agencydesk-post-lead-lifecycle.json` are created only as **Gmail Drafts** (`resource: draft, operation: create`) and never auto-sent without your manual approval.
