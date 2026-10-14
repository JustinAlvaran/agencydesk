# Your messaging credentials

Updated 14 October 2026 after researching official Hermes, Meta, and Resend documentation.

**No Hermes account or key is required for the CRM follow-up logic.** We recommend AgencyDesk's own durable automation queue, first with a dry-run sender, then your own Resend email account, followed by your own official Meta WhatsApp sender. Hermes can later help with drafts or inbound triage.

The complete own-account steps, configuration variables, and source links are in [Messaging setup](../docs/messaging-setup.md).

| Connection | Values to prepare |
| --- | --- |
| Dry-run | No provider credentials |
| Email | Your Resend API key; verified domain; sender address on that domain; receipt signing secret |
| WhatsApp | Your Meta Phone Number ID; WABA ID for account setup; scoped access token; supported Graph version; approved template names/language/variables; app secret and separate webhook verification token |
| Optional Hermes later | Your installed gateway endpoint; a new locally generated `API_SERVER_KEY`; your own model-provider configuration |
| Scheduled worker | Your AgencyDesk database/function deployment; a new cron secret; scheduler POST configuration |

There is no universal hosted Hermes key to obtain. The researched NousResearch Hermes Agent exposes an authenticated local HTTP API; its key is a secret you choose for your own installation. Its current Cloud API adapter documents no approved-template sending, so AgencyDesk uses a direct Meta adapter for delayed reminders outside the 24-hour reply window. Details and citations are in the setup guide.

ApartmentHub's Hermes hook has an unfinished custom contract. Its endpoint, secret, sender identity, recipients, and accounts must never be reused. Only its workflow ideas are reference material.

Place actual provider credentials directly in the Supabase Edge worker's secret environment. Use placeholders in tracked files; provider secrets never belong in browser `NEXT_PUBLIC_` variables. No ApartmentHub credentials were used, copied, or imported. No messages were sent during the research.
