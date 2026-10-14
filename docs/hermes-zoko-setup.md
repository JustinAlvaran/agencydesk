# Hermes and Zoko for AgencyDesk

Researched 14 October 2026. This guide uses only your own accounts. Hermes and Zoko are not installed or connected by this guide; the implemented worker currently supports Resend email and direct Meta WhatsApp.

## What each part does

AgencyDesk stores leads, permissions, proposals, approvals, follow-up deadlines, and delivery history. Zoko can provide your business WhatsApp sender and team inbox. Hermes Agent can suggest replies, summarize conversations, and recommend next actions. Use AgencyDesk's outbox to decide whether a message is eligible; an AI answer alone must not mark a message delivered.

You can launch the CRM and its login without either service. Zoko requires a provider adapter and callback extension. Hermes requires a backend draft endpoint and a running agent host. Entering their keys into the existing Meta settings does not implement those connections.

## Set up your own Zoko account

1. Create or sign in to [Zoko](https://app.live.zoko.io/signup). Connect your own business WhatsApp sender using its onboarding. Confirm the available onboarding/migration options with Zoko before changing an existing WhatsApp number. Use an account with API and webhook access and verify the features in your current plan.
2. In Organisation settings → API & Webhooks, obtain your API key. If access is unavailable, ask Zoko support to enable or explain it. [Official dashboard instructions](https://www.zoko.io/learning-centre/faq), [API authentication](https://docs.zoko.io/).
3. Create your own approved templates for the four CRM events: inquiry acknowledgment, proposal notice, proposal follow-up, and proposal accepted. Record each `templateId`, `templateLanguage`, and ordered `templateArgs`. Use approved templates for delayed reminders outside the customer reply window. [Template send contract](https://docs.zoko.io/api-reference/send-message/).
4. Prepare a number you control for an initial delivery test and record explicit WhatsApp permission on that lead in AgencyDesk.
5. Store the API key in **AgencyDesk's Supabase Edge Function Secrets** when the Zoko adapter is implemented. A proposed name is `ZOKO_API_KEY`; it is not consumed by the current worker. Keep your template IDs and argument mapping alongside server configuration. Never put this key in `NEXT_PUBLIC_` variables or GitHub.

The adapter must send HTTPS `POST https://chat.zoko.io/v2/message` with an `apikey` header. Its template payload has `channel: "whatsapp"`, a recipient in international digits without the leading `+`, `type: "template"`, your `templateId`, ordered `templateArgs`, and `templateLanguage`. Zoko's returned message identifier must be saved against the AgencyDesk job. An acknowledgment means accepted; a delivery event establishes delivery. [Zoko sending reference](https://docs.zoko.io/api-reference/send-message/).

## Connect Zoko events to the CRM

After implementing and deploying a separate Zoko endpoint, register its HTTPS URL in Zoko's Webhooks section. Do not point Zoko at the current Meta receipt endpoint: it verifies Meta signatures and parses a different payload.

Zoko documents these events: `message:user:in`, `message:store:out`, and `message:delivery:update`. Delivery callbacks include message `id` and `deliveryStatus`; inbound messages include the customer, sender, and text. [Event list](https://docs.zoko.io/webhooks/when-do-i-need-one/), [payloads](https://docs.zoko.io/webhooks/webhook-payload/).

Before activation, verify Zoko's current callback authentication/signature mechanism in your account or with support. The public pages reviewed do not establish a signed webhook contract, so this guide does not invent a signature header or claim that a Meta app secret works for Zoko. Unauthenticated events must not change lead ownership, consent, delivery state, or start an AI agent. Provider authentication and sender/account matching need implementation and verification.

The handler should durably save and deduplicate verified events, then acknowledge promptly. Zoko expects HTTP 200 within five seconds and documents retry delivery; perform Hermes work after the event is saved. [Webhook operating requirements](https://docs.zoko.io/webhooks/key-considerations/).

Implementation also needs provider identity recorded separately from channel, Zoko status mapping, inbound conversation storage, opt-out/sequence-stop handling, and explicit retry/reconciliation tests. Do not assume Zoko has Resend's idempotency contract; an unknown send result must not trigger a blind repeat. Avoid enabling a Zoko flow and an AgencyDesk rule for the same reminder.

## Set up Hermes for drafts and triage

Use [NousResearch Hermes Agent's installation guide](https://hermes-agent.nousresearch.com/docs/getting-started/installation). It offers Windows packages and command-line installation. Configure your own model account with `hermes setup` or `hermes model`, then choose the agent's allowed tools. Run it on a host that remains available while CRM requests run; a sleeping laptop cannot serve the deployed backend.

In the Hermes host's own environment, configure:

```dotenv
API_SERVER_ENABLED=true
API_SERVER_HOST=127.0.0.1
API_SERVER_PORT=8642
API_SERVER_KEY=<new-random-secret>
```

Start `hermes gateway`. Its authenticated API accepts `POST /v1/chat/completions` or `POST /v1/runs` using `Authorization: Bearer <API_SERVER_KEY>`. Keep model-provider credentials on the Hermes host. [Official API server documentation](https://hermes-agent.nousresearch.com/docs/user-guide/features/api-server).

A deployed Vercel or Supabase backend cannot reach your PC's localhost. Provide a stable HTTPS gateway accessible to that backend, authenticated with the separate Hermes key. Proposed backend-only settings are `HERMES_API_URL` and `HERMES_API_KEY`; AgencyDesk does not currently consume them. Keep the agent's tools restricted to the CRM tasks you authorize.

Future flow: verified Zoko inbound event → AgencyDesk conversation/activity → check recipient permissions and stop applicable follow-ups → Hermes draft with scoped lead context → staff approval → AgencyDesk outbox → Zoko → verified delivery update. Start with suggested replies and human approval. Never give Hermes unrestricted database/service-role access.

Hermes' own Meta Cloud adapter currently documents approved-template sending as unimplemented. For scheduled CRM reminders, retain the template-capable AgencyDesk provider path. [Hermes Cloud API guide](https://hermes-agent.nousresearch.com/docs/user-guide/messaging/whatsapp-cloud).

## Login already exists

AgencyDesk has `/login` with Supabase email/password and Google sign-in actions. Active `staff_members` authorize staff CRM access; active `client_memberships` authorize the client portal. Accounts without an active membership are denied access. Administrator-generated private invitations and recovery links are implemented; public signup should remain disabled.

Live setup must bootstrap the first admin Auth user and matching active staff membership. Subsequent invitations use CRM Access settings. Google sign-in needs its own Google OAuth client configured in Supabase and allowed callback URLs; displaying its button does not prove the provider is configured. See [AgencyDesk account setup](../README.md).

## What you can provide next

- Your Zoko account and business sender are ready; API/webhooks are enabled.
- Your own approved template IDs, language, and variable order.
- A test WhatsApp number you control, plus permission to send the specific test.
- Your chosen always-on Hermes host and model account, if you want AI drafts now.

Put actual secrets directly into the relevant secret stores. ApartmentHub credentials, sender identities, destinations, and customer records are unnecessary and must never be copied.
