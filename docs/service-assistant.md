# Services guide and inquiry intake

The website assistant is an embedded, guided services conversation built with
MIT-licensed [React ChatBotify](https://github.com/react-chatbotify/react-chatbotify),
pinned in the package manifest and lockfile. It ships with the deployed Next.js
website. It does **not** require the owner's PC, Docker, Hermes or a model API.
The linked WhatsApp transport is a separate system with separate hosting needs.

## Behavior and privacy

- Only marketing pages mount the launcher. The conversation library loads when
  the visitor opens the accessible dialog; CRM and portal pages do not mount it.
- Service descriptions and scope come from the same published catalog as the
  service pages. Pricing and delivery dates are deferred to a reviewed proposal.
- Anonymous browsing of answers creates no lead. The visitor explicitly submits
  the inquiry form to save contact details and a brief. Email and WhatsApp update
  checkboxes begin unchecked, and WhatsApp permission requires a normalized phone.
- Chat history, audio, notifications, microphone and file attachments are disabled.
  No chat transcript or personal information is included in analytics/logging.
- Human follow-up means a saved CRM inquiry, not a staffed live-chat session.
  The existing ordinary inquiry page remains an alternative.

## Submission boundary

Both the website form and assistant submit through `/api/inquiries`. The server
validates the payload and calls the JWT-protected Supabase `inquiry` function.
The Edge function independently checks types, the honeypot, phone/permissions,
published services and a streamed 16,000-byte limit. The configured agency slug is
resolved on the server; browser-supplied agency IDs and rate-limit keys are ignored.

The Edge function currently bundles `content/fixtures.json` because production
content is explicitly Git-backed. Deploy the inquiry function when changing this
catalog. Before enabling Directus publication, replace this boundary with a
verified shared publication snapshot so service choices cannot drift between the
site and Edge deployment. Do not rely on browser-only service validation.

The form generates a submission UUID on the first send and reuses it when retrying
an identical payload while mounted. Editing a payload generates a fresh UUID.
The Edge function computes a normalized payload hash including consent and source.
`submit_website_inquiry` serializes each agency/submission pair, returns the existing
lead for a matching replay and rejects changed-content replay. Rate-limit records,
lead creation, activity and the submission ledger are transactional. Legacy website
clients without a submission ID still work but cannot deduplicate network retries.

The private ledger has RLS and no anonymous/authenticated table grants. Its RPC is
SECURITY INVOKER and executable only by `service_role`; do not grant it to public
clients. Existing channel permission, recipient suppression and message approval
controls remain authoritative. The ledger retains UUIDs and payload hashes, not
duplicate contact details; lead deletion cascades its record. A deployment-specific
retention/deletion policy still needs an owner-approved decision.

## Hosting

### Optional hosted AI: local implementation, activation pending

The in-progress AI mode is separate from the deployed guided assistant. Opening
the dialog checks `GET /api/service-chat` for a no-store runtime capability flag.
This returns only `{ available: boolean }`, makes no model call and is not a
provider-health or credential-readiness check. It keeps a static marketing build
from freezing the enabled/disabled state. Discovery stops after three seconds and
closing the dialog aborts it; failures leave the ordinary guide available.

The AI entry is rendered outside ChatBotify's stored message components so a
delayed capability response updates the current screen. Questions use a dedicated
composer with safe plain-text output, bounded transient history, a sixteen-second
client deadline, explicit inquiry handoff and unchanged optional contact consent.
The composer regains focus only after its enabled state has committed.

`SERVICE_CHAT_ENABLED` stays off until the own Edge relay, private quota storage,
scoped provider token and model evaluation are verified. The pending Cloudflare
token approval has not been granted. No model, CRM access, email/WhatsApp sending
or calendar booking was enabled by the local UI work. The service-chat migration
and protected Edge function remain separate deployment prerequisites.

Usage metadata is pseudonymous, not a saved conversation. Records older than
48 hours are cleaned during later admissions; the maintenance RPC alone is not
an installed hourly schedule, and inactivity can retain records longer. Never
promise an unconditional deletion deadline without an operational cleanup timer.

Local browser verification on 26 October covered six AI/runtime/failure cases
and two existing guide/inquiry cases across actual 390px and 1280px viewports,
using fictional intercepted inference responses. It did not exercise a live
hosted model or production-browser deployment. See the dated project status for
the exact commands/results and remaining gates.

`netlify.toml` enables a Netlify build using its maintained OpenNext adapter. Configure:

- `APP_MODE=live`
- `CONTENT_SOURCE=fixtures`
- `APP_URL` equal to the verified deployed HTTPS origin
- the app's own `NEXT_PUBLIC_SUPABASE_URL`,
  `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` and `SUPABASE_EDGE_ANON_KEY`

Use the existing AgencyDesk Supabase project. No Gmail refresh token, WAHA gateway
key, service-role key, or ApartmentHub configuration belongs in the website host.
Add the exact new authentication callback/confirmation URLs to the existing
Supabase redirect allowlist before relying on login at a new host. Review other
configured origins and do not remove a working origin during a preview trial.

Vercel Hobby was verified in the billing UI on 15 October 2026; it is restricted to
personal noncommercial use. The existing Netlify team was verified as **Free Legacy**,
with no payment method saved. It was retained without a paid upgrade or a switch to
credit-based billing. Consult that team's actual legacy allowances rather than
applying the newer Free plan's 300-credit limit to it.

The deployed origin is https://agencydesk-crm.netlify.app. The production branch was last verified as `main` on 29 October 2026. This
source change does not alter host branches or promote a production deployment. The
two exact Netlify authentication callbacks were explicitly approved and added to
Supabase. Edge `APP_URL` and the invitation origin allowlist are aligned with this
host while retaining the earlier allowed origin. No messaging credential changed.

API origin checks use the configured public `APP_URL` because host adapters can
reconstruct a request with an internal URL. Invitation redirects use that same
configured origin and return no-store/no-referrer headers. A browser-supplied Host
or return URL cannot override it.

## Verification and remaining gates

Run `pnpm test`, `pnpm test:database`, `pnpm test:edge`, `pnpm typecheck`, lint and
`pnpm build`. The new database test covers replay, consent conflict, agency scoping,
anonymous/staff RPC denial, inactive intake and privileged workspace helper denial.
Edge tests cover direct endpoint validation and trusted routing without contacting
real providers. Browser scenarios are in `tests/e2e/service-assistant.spec.ts`.

Mobile rendering, keyboard focus, service selection, inquiry preselection and
unchecked permissions must be checked on the deployed site. A test that checks
the direct Edge function is not a substitute for browser-to-CRM verification.
Never reuse earlier single-message approvals for another live email/WhatsApp test.

Remaining broader production gates include durable WhatsApp hosting, production
Gmail OAuth setup, independent abuse controls beyond per-email throttling, restore
rehearsal, operational alerts and a reviewed scheduler rollout. No customer sending
is enabled by adding the website assistant.


## 31 October source-release boundary

This slice finishes the existing local widget/relay implementation while keeping
AI disabled until separate provider approval and hosted verification. The exact
private review checkout excludes all n8n/CI/operating-cap WIP. A missing Edge
database configuration now returns a redacted503; malformed or oversized upstream
JSON is a503 service failure while malformed visitor input remains400/413.
Failure to record quota completion returns a safe fallback; inference is not
retried and the attempt continues to consume its reservation.

No Cloudflare account/token or hosted activation has been verified by this source
release. Existing model IDs are candidates only; the token/output/neurons behavior
and account Free entitlement must be evaluated before SERVICE_CHAT_ENABLED is
turned on. Regex output guards are not proof of factuality. No CRM tools, direct
sends, inbox/calendar access or actual customer records are included.

The quota migration is preserved byte-for-byte from the unfinished local source.
Check the own project's migration history and account binding before deployment;
this run neither queries that provider nor proves the migration remains unapplied.
Usage metadata is pseudonymous, not guaranteed deleted on a fixed deadline.
