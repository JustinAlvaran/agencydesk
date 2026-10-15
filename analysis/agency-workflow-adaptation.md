# AgencyDesk workflow adaptation

Updated 15 October 2026. This records source adaptations and remaining connection boundaries; it is not a claim that customer sending is enabled. ApartmentHub was a read-only code reference. No reference credentials, customer records, senders, mailbox identities or infrastructure were imported. AgencyDesk retains its own authentication, agency boundaries, English interface and proposal/project lifecycle.

## Reused decisions

| Reference concept | AgencyDesk adaptation | Limit |
| --- | --- | --- |
| Lead stages and ownership | Existing agency stages, active staff owners, company links, archived records and owner/stage activities | Won is derived from accepted proposals; no real-estate pipelines or i18n copied |
| Call outcomes | Connected calls move New to Contacted; not interested/invalid number close an open lead as Lost; Won/Lost stay unchanged | No-answer logs activity but does not schedule a recovery sequence |
| Callback scheduling | Future callback creates a follow-up task for an active lead owner, otherwise the recording staff member | Internal reminder only; no calendar integration or customer send |
| Due-first follow-up prioritization | Tasks default to Open, earliest due first, undated last, stable ID tie-break; Open/Overdue/Completed/All and Mine/Unassigned filters | No recurring no-answer retry queue, email-aging escalation or general contact cooldown |
| Activity timeline | Lead stage/owner/call/callback activities and private staff notes | No imported history; no automatic inbound chat transcript |
| Recipient contact preferences | Email and WhatsApp opt-in plus an agency/channel/recipient suppression ledger | Staff must record opt-outs; incoming messages are not parsed |
| Preview, approval and delivery outcomes | Own outbox, frozen provider identity, staff review, eligibility rechecks and conservative uncertain-result handling | Acceptance and actual delivery remain distinct |

## Recipient suppression behavior

Withdrawing existing permission suppresses the old normalized email address or exact international WhatsApp number. Explicit staff blocking uses the current recipient. The block covers duplicate leads and providers on that channel inside the same agency, without affecting another agency. Pending-approval and queued jobs are cancelled; later eligibility checks skip suppressed recipients. Already-running sends cannot be recalled. Manual WhatsApp links also require an unsuppressed recipient.

An administrator can clear a suppression after renewed permission is verified. Clearing does not set opt-in, recreate a cancelled job or change another duplicate lead's preference. The suppression table is private and staff commands check agency access; browser code never receives service credentials.

## Gmail adaptation

The reference has Google Workspace delegation and mailbox-draft flows. AgencyDesk instead prepares an optional Gmail API sender using the user's own OAuth client and a send-only `https://www.googleapis.com/auth/gmail.send` grant, including personal Gmail. It requests no inbox-read permission. OAuth sending authorization is separate from CRM Google login. [Google scopes](https://developers.google.com/workspace/gmail/api/auth/scopes).

Tracked examples for `GMAIL_CLIENT_ID`, `GMAIL_CLIENT_SECRET`, `GMAIL_REFRESH_TOKEN`, `GMAIL_FROM_EMAIL` and `GMAIL_AGENCY_ID` remain blank. Actual values are saved privately in the own Supabase Edge environment, and their SHA-256 digests matched the local private configuration. The worker binds the sender to the own agency (`a0000000-0000-4000-8000-000000000001`). No Gmail Codex plugin is needed by the deployed application.

The own free Google Cloud project **AgencyDesk Gmail** (`smooth-graph-511708-m4`) has Gmail API enabled, consent configured and a user-approved Desktop OAuth client. The account `kinggucci195@gmail.com` was verified on Google's consent screen; only `gmail.send` was granted. The official SDK local helper completed authorization and an actual token refresh succeeded with the exact send-only scope. [Operator helper](../infra/gmail/README.md). No paid plan was activated.

The sender refreshes its OAuth access token, builds plain-text MIME and posts to Gmail's send endpoint. A returned provider message ID records acceptance; receipt/bounce reconciliation, mailbox reply sync and Gmail draft creation are not integrated. Ambiguous sends are not blindly resent. **Gmail is configured and authenticated; no email has been sent and the end-to-end send test is pending.** No Gmail rule was selected or enabled. Acknowledgment remains WAHA and delivery stays dry-run. The Google consent project is External/Testing; the send-scope refresh token expires after seven days unless production consent requirements are addressed. See [the setup guide](../docs/messaging-setup.md#optional-gmail-sender--authenticated-send-test-pending).

## Verified login and agency records

Live Google staff login for `kinggucci195@gmail.com` was verified as administrator of the own agency. That agency has zero leads. The 11 existing leads belong to the other agency and were preserved; they were not moved into the user's agency or exposed by the login verification.

## Current WhatsApp and AI boundary

WAHA is linked to the user's own sender for controlled tests. A previously approved isolated test reached the sender and its signed receipt was verified. This does not prove an automatic CRM sequence. AgencyDesk's immediate **Inquiry acknowledgment** rule is enabled for WhatsApp via WAHA with approval required, so it can queue for review/simulation. The other three AgencyDesk rules and all four rules in the other agency remain disabled. Delivery stays `dry_run`, no scheduler is configured, and live customer delivery is off. WAHA is an unofficial QR transport; the local PC and authenticated development gateway must remain available. No unattended production uptime is established.

Hermes can suggest a draft through the prepared staff-only path, but its hosted connection is not activated. Manual drafts remain available. Human review is necessary; local model tests exposed latency and invented business details. No inbound automatic replies, no-answer recovery or general cooldown have been implemented.

For prior source evidence, see [CRM reference analysis](apartmenthub-crm.md) and [automation reference analysis](apartmenthub-automation.md). For actual environment state, verify the current hosting report and deployment rather than inferring activation from source code.
