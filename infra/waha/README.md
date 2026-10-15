# AgencyDesk WAHA host

Prepared from upstream WAHA, not a reimplementation. The public image digest was resolved from Docker Hub on 15 October 2026. The source inspection commit is recorded in [the research report](../../analysis/open-source-messaging.md); a separately published container is not claimed to be built from that exact commit.

Run `./infra/waha/prepare.ps1` in PowerShell. It creates an ignored private key file and restricts its Windows permissions. It never prints the key. Once Docker Desktop and its Linux-container backend are running, run `./infra/waha/start.ps1`.

The container binds only to `127.0.0.1:3001`, requires an API key, disables its dashboard and Swagger, and stores session/media files in Docker volumes. Nothing starts a WhatsApp session automatically. Do not use `docker compose config` without `--quiet` because its output resolves the private key. The full API is never the public tunnel target.

Runtime update, 15 October: Docker Desktop installed, WSL 3.0.3 installed through the approved administrator prompt, Docker Linux engine running. No PC restart was needed. The pinned WAHA image is being pulled for its initial startup. Phone pairing, public exposure and provider activation remain separate steps.

After runtime setup, run `./infra/waha/pair.ps1`: it first verifies unauthenticated API calls are rejected, creates only the named local default session without webhooks, and saves a fresh QR privately when ready. It never sends a message. If the session is still starting, retrieve its status again without resetting it. Pairing gives this host access to the account and sending capability. Test with a separate number first: the QR transport is unofficial and can lead to account restrictions. This host setup alone does not add a WAHA adapter to AgencyDesk's hosted outbox; provider routing, verified callbacks and cross-agency tests must be completed before enabling automatic sending.

`send_proxy.py` exposes only POST `/api/sendText` on loopback port 3002. It uses a separate private gateway key in `.local/waha/proxy.env`, binds one session, rejects extra payload fields and group destinations, and forwards to private WAHA. It has no chat, pairing, session-control or CORS endpoints. Ambiguous upstream results return 502 so the outbox cannot blindly retry them. `python -m unittest discover -s infra/waha -p test_send_proxy.py` checks the payload boundary.

Current live test state: local account linked, send-only proxy and approved Cloudflare Quick Tunnel running, encrypted Supabase connection settings saved, signed delivery callback configured. One approved self-message test produced a signed read receipt. Rules remain disabled, delivery mode dry-run. Temporary tunnel processes and their URL are recorded under `.local/waha`; the URL changes after restart. This is a development connection with no uptime guarantee, not a permanent deployment. Never publish keys, logs or QR images.

No Codex plugin is required. Docker is host software. Docker Desktop is free for eligible personal/small-business use; verify eligibility on its official installation page. A local PC must remain awake to provide service. A stable authenticated host and reviewed CRM workflow test are required before routine automatic sending.
