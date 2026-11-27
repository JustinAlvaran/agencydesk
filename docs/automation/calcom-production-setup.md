# Cal.com Free Discovery Booking Setup (`kinggucci195@gmail.com`)

This guide configures **free Cal.com discovery call scheduling** for AgencyDesk (`/book`), synced two-way with Google Calendar (`kinggucci195@gmail.com`) and wired into `/api/webhooks/calcom` and n8n Cloud (`agencydesk-post-lead-lifecycle.json`).

---

## 1. Free Cal.com Account & Google Calendar Sync

1. Sign up / sign in on [cal.com](https://cal.com) (Free Individual plan — **$0.00/month**) using **`kinggucci195@gmail.com`**.
2. Go to **Apps -> Google Calendar** and connect `kinggucci195@gmail.com` so booked calls automatically check availability and create Google Calendar invites + Google Meet links.
3. Create an Event Type (e.g., **20-Minute AgencyDesk Discovery Call**, slug `discovery-call`):
   - Duration: **20 minutes**
   - Location: **Google Meet** (`Cal Video` or `Google Meet`)
   - Copy your public booking URL (e.g., `https://cal.com/<your-handle>/discovery-call`).

---

## 2. Cal.com Webhook Configuration

1. In Cal.com, go to **Settings -> Developer -> Webhooks -> + New**.
2. Set **Subscriber URL** to:
   ```text
   https://agencydesk-theta.vercel.app/api/webhooks/calcom
   ```
3. Select **Event Triggers**:
   - `BOOKING_CREATED`
   - `BOOKING_RESCHEDULED`
   - `BOOKING_CANCELLED`
4. Generate a strong random **Secret** (32+ characters) and paste it into Cal.com's **Secret** field.
   - Cal.com signs every webhook payload using HMAC-SHA256 in the `X-Cal-Signature-256` header.
   - `/api/webhooks/calcom` verifies this signature fail-closed using `crypto.timingSafeEqual` in live mode.
5. Enable the webhook.

---

## 3. Vercel Environment Variables (`agencydesk-theta.vercel.app`)

Add or verify these variables in your Vercel project settings:

| Variable | Value | Purpose |
|---|---|---|
| `CALCOM_WEBHOOK_SECRET` | Same secret set in Cal.com Webhook | Fail-closed HMAC-SHA256 verification on `POST /api/webhooks/calcom`. |
| `NEXT_PUBLIC_CALCOM_BOOKING_URL` | `https://cal.com/<your-handle>/discovery-call` | Enables the live Cal.com scheduler embed/link on `/book`. (If unset, `/book` shows a discovery time request form backed by `/api/inquire`.) |
| `AGENCYDESK_INTAKE_AGENCY_ID` | Your AgencyDesk agency UUID | Scopes Cal.com lead lookup/creation and `follow_up_tasks` to the AgencyDesk workspace. |
| `N8N_LIFECYCLE_WEBHOOK_URL` | `https://justinautomaton.app.n8n.cloud/webhook/agencydesk-lifecycle` | Receives `calcom_booking_created` lifecycle events from `/api/webhooks/calcom`. |
| `AUTOMATION_SECRET` | Shared secret matching n8n `$vars.AUTOMATION_SECRET` | Sent in `X-AgencyDesk-Signature` / `Authorization: Bearer` headers to n8n Cloud. |

---

## 4. End-to-End Flow (`calcom_booking_created`)

1. Visitor opens `/book` and schedules a discovery call on Cal.com (or submits the fallback slot request form).
2. Cal.com sends `BOOKING_CREATED` (signed with `X-Cal-Signature-256`) to `POST https://agencydesk-theta.vercel.app/api/webhooks/calcom`.
3. AgencyDesk:
   - Looks up or creates the lead scoped to `AGENCYDESK_INTAKE_AGENCY_ID` (`new` -> `contacted`, never overwriting `qualified`, `proposal_sent`, `won`, or `lost`).
   - Inserts an `activity_events` record (`calcom_booking_created`) and a `follow_up_tasks` entry for the scheduled time.
   - Dispatches `calcom_booking_created` to `N8N_LIFECYCLE_WEBHOOK_URL` (`agencydesk-post-lead-lifecycle.json`).
4. In `infra/n8n/workflows/agencydesk-post-lead-lifecycle.json`:
   - `Verify Lifecycle Webhook Signature` validates `X-AgencyDesk-Signature` fail-closed.
   - `Route Lifecycle Event` routes `calcom_booking_created` / `booking_created` into **Branch 1 (`Contacted or Qualified`)**:
     - Updates Google Sheet `AgencyDesk_Leads_Master` (`Leads_Master`) status to **`Contacted`** with booking time & meeting URL in `Notes`.
     - Sends an instant WhatsApp alert to **`+639913780170`** announcing the booked discovery call.
     - Creates a personalized **Discovery Call Prep Gmail Draft** in `kinggucci195@gmail.com` (approval-gated, never auto-sent).
