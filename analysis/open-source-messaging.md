# Open-source messaging selection

Researched 15 October 2026 from upstream repositories, actual licence files and maintainer documentation. No phone pairing, provider credentials, sending or installation was performed in this research.

## Recommendation

Evaluate WAHA as a separate local WhatsApp transport for AgencyDesk. Keep AgencyDesk's existing leads, permissions, approval queue and provider history. Add Chatwoot Community only when a separate team inbox is needed. Do not rebuild WhatsApp protocol handling or copy an entire second CRM into the Next.js app.

WAHA is an unofficial WhatsApp Web connection. QR pairing avoids Meta developer onboarding, but account blocking and protocol breakage remain real limitations. Do not treat it as an equivalent guarantee to the official Cloud API. Use an isolated test number before considering the existing personal number. A paired service can access that number's chats and send as it; pairing requires the user's informed approval.

## Compared projects

| Project | Useful capability | Free scope and constraints | Fit |
| --- | --- | --- | --- |
| [WAHA](https://github.com/devlikeapro/waha) | QR-linked WhatsApp REST API, incoming events, acknowledgments, media, Chatwoot integration | Root LICENSE is Apache-2.0. Current docs say former Plus features merged into Core from 2026.6.1. Repository README still contains old Plus references; package metadata says UNLICENSED, inconsistent with root LICENSE. Record these discrepancies before redistribution. Requires a persistent host; Docker is the recommended path. | Best transport candidate for existing AgencyDesk, pending a real local compatibility test. |
| [Chatwoot](https://github.com/chatwoot/chatwoot) | Shared inbox, agents, assignments, conversation automation | Community code is MIT outside enterprise/ and third-party exceptions. Self-hosted software is free; infrastructure and official WhatsApp fees are separate. Native official WhatsApp setup still needs Meta; a QR transport is a separate integration. | Best complete inbox candidate, but adds a server and another application. |
| [Whaticket Community](https://github.com/canove/whaticket-community) | QR connection, shared inbox, tickets, queues, quick replies | MIT. Upstream comparison explicitly excludes official Cloud API, rule/AI bots, campaigns and external integrations from the free code. Node/React plus MySQL/MariaDB and persistent server. | Useful ticket workflow reference; not a complete free copy of the commercial product. |
| [Evolution API](https://github.com/evolution-foundation/evolution-api) | Baileys or official Cloud API transport and Chatwoot integrations | Actual licence adds UI brand preservation and visible usage-notification requirements to Apache terms. Node plus PostgreSQL/MySQL, Redis recommended. | Capable alternative, but licence conditions and extra dependencies make it less simple for this project. |

Sources: [WAHA free feature announcement](https://waha.devlike.pro/docs/how-to/waha-plus/), [WAHA licence](https://github.com/devlikeapro/waha/blob/core/LICENSE), [WAHA events/HMAC](https://waha.devlike.pro/docs/how-to/events/), [blocking limitations](https://waha.devlike.pro/docs/overview/how-to-avoid-blocking/), [Chatwoot licence](https://github.com/chatwoot/chatwoot/blob/develop/LICENSE), [Whaticket feature comparison](https://github.com/canove/whaticket-community#open-source-vs-whaticket), [Evolution licence](https://github.com/evolution-foundation/evolution-api/blob/main/LICENSE).

## Inspected local source

WAHA cloned read-only under ignored `.local/research/waha`, upstream commit `0858b4f0efa5d2afc085c41e3873aae29154f6c0` dated 14 October 2026. Inspected REST client sendText, API-key authentication tests, webhook DTOs and root licence. No dependencies or upstream scripts executed. Docker was not found on PATH; local operation has not been tested.

## Integration boundary

1. Run a pinned WAHA build separately from Vercel, initially bound to loopback, with a generated private API key and persistent session storage. No default credentials or public dashboard.
2. Add a provider adapter using its documented sendText REST operation. Preserve agency/session mapping server-side; callers must not select arbitrary sessions or recipient overrides.
3. Verify raw-body HMAC callbacks and deduplicate event IDs. Store inbound messages separately; never allow a webhook to assign ownership or grant permission. Match acknowledgment events by provider, session and message ID.
4. Keep existing queue consent, suppression, approval and immutable provider checks. An ambiguous send result stays uncertain; do not assume WAHA has a Resend-style idempotency guarantee.
5. Test disconnects, restarts, duplicate callbacks and cross-agency access with fictional data before pairing a real account. Keep Hermes as a draft-only option and obtain staff approval before sending.

Free software does not mean free hosted uptime. A local PC can avoid a hosting subscription but must stay awake. QR pairing and a stable authenticated connection from hosted AgencyDesk remain separate setup steps; neither is complete yet.
