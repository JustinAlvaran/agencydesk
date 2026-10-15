"""Authorize only Gmail sending; never read a mailbox or send a message."""
from __future__ import annotations

import argparse
import csv
import json
import logging
import os
from pathlib import Path
import re
import subprocess
import sys
import uuid

SCOPE = "https://www.googleapis.com/auth/gmail.send"
REPO = Path(__file__).resolve().parents[2]
PRIVATE = REPO / ".local" / "gmail"
MAILBOX = re.compile(r"[A-Za-z0-9.!#$%&'*+/=?^_`{|}~-]+@[A-Za-z0-9](?:[A-Za-z0-9.-]*[A-Za-z0-9])?\.[A-Za-z]{2,63}")


def private_path(value: str) -> Path:
    path = Path(value).resolve()
    if not path.is_relative_to(PRIVATE.resolve()) or path == PRIVATE.resolve():
        raise ValueError("Credentials must stay inside the ignored .local/gmail directory.")
    return path


def protect_directory(directory: Path) -> None:
    directory.mkdir(parents=True, exist_ok=True, mode=0o700)
    if os.name != "nt":
        directory.chmod(0o700)
        return
    # chmod does not restrict Windows ACLs. Restrict the credential directory before writing.
    result = subprocess.run(["whoami", "/user", "/fo", "csv", "/nh"],
                            capture_output=True, text=True, check=True)
    rows = list(csv.reader(result.stdout.splitlines()))
    sid = next((field for row in rows for field in row
                if re.fullmatch(r"S-1-\d+(?:-\d+)+", field)), None)
    if not sid:
        raise ValueError("Cannot determine the current Windows user for private credential storage.")
    # Remove existing explicit grants too, then replace inherited access with the owner rule.
    subprocess.run(["icacls", str(directory), "/reset", "/Q"],
                   capture_output=True, check=True)
    subprocess.run(["icacls", str(directory), "/inheritance:r", "/grant:r",
                    f"*{sid}:(OI)(CI)F"], capture_output=True, check=True)


def main() -> int:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--from-email", required=True)
    parser.add_argument("--agency-id", required=True)
    parser.add_argument("--client-json", required=True)
    parser.add_argument("--output", required=True)
    args = parser.parse_args()
    # SDK/OAuth diagnostic logging can contain request data. Only our sanitized status is printed.
    logging.disable(logging.CRITICAL)
    try:
        if not MAILBOX.fullmatch(args.from_email) or len(args.from_email) > 254:
            raise ValueError("Invalid sender email.")
        agency_id = str(uuid.UUID(args.agency_id))
        client_path, output_path = private_path(args.client_json), private_path(args.output)
        if client_path == output_path or output_path.exists():
            raise ValueError("Choose a new output file; existing credentials are never overwritten.")
        if client_path.stat().st_size > 65536:
            raise ValueError("Invalid client configuration.")
        client_config = json.loads(client_path.read_text(encoding="utf-8-sig"))
        installed = client_config.get("installed", {})
        if (not isinstance(installed, dict)
            or installed.get("auth_uri") not in {"https://accounts.google.com/o/oauth2/auth", "https://accounts.google.com/o/oauth2/v2/auth"}
            or installed.get("token_uri") != "https://oauth2.googleapis.com/token"
            or not str(installed.get("client_id", "")).endswith(".apps.googleusercontent.com")
            or not installed.get("client_secret")):
            raise ValueError("A Google Desktop application client configuration is required.")
        protect_directory(PRIVATE)
        protect_directory(output_path.parent)
        if os.name != "nt":
            client_path.chmod(0o600)
        else:
            subprocess.run(["icacls", str(client_path), "/reset", "/Q"],
                           capture_output=True, check=True)
        from google_auth_oauthlib.flow import InstalledAppFlow

        class BoundedInstalledAppFlow(InstalledAppFlow):
            def fetch_token(self, **kwargs):
                kwargs.setdefault("timeout", 30)
                return super().fetch_token(**kwargs)

        flow = BoundedInstalledAppFlow.from_client_config(
            client_config, scopes=[SCOPE], autogenerate_code_verifier=True)
        credentials = flow.run_local_server(
            host="127.0.0.1", bind_addr="127.0.0.1", port=8765,
            open_browser=False, timeout_seconds=600,
            authorization_prompt_message="{url}",
            success_message="Authorization returned. You may close this tab and check the terminal for the saved-status result.",
            access_type="offline", prompt="consent select_account",
            login_hint=args.from_email, include_granted_scopes="false",
        )
        granted = flow.oauth2session.token.get("scope")
        granted = granted.split() if isinstance(granted, str) else granted
        if not isinstance(granted, (list, tuple)) or set(granted) != {SCOPE} or not credentials.refresh_token:
            raise ValueError("A refresh token with exactly the Gmail send scope is required.")
        fields = {
            "GMAIL_CLIENT_ID": credentials.client_id,
            "GMAIL_CLIENT_SECRET": credentials.client_secret,
            "GMAIL_REFRESH_TOKEN": credentials.refresh_token,
            "GMAIL_FROM_EMAIL": args.from_email,
            "GMAIL_AGENCY_ID": agency_id,
        }
        if any(not isinstance(value, str) or not value or len(value) > 4096
               or any(character in value for character in "\r\n\x00") for value in fields.values()):
            raise ValueError("Invalid credential response.")
        descriptor = os.open(output_path, os.O_WRONLY | os.O_CREAT | os.O_EXCL, 0o600)
        try:
            with os.fdopen(descriptor, "w", encoding="utf-8", newline="\n") as handle:
                handle.write("\n".join(f"{key}={value}" for key, value in fields.items()) + "\n")
        except Exception:
            output_path.unlink(missing_ok=True)
            raise
        print("Gmail send-only credentials saved privately. No email was sent.", flush=True)
        return 0
    except KeyboardInterrupt:
        print("Gmail authorization cancelled; no credentials saved.", file=sys.stderr)
        return 130
    except Exception:
        print("Gmail authorization could not be completed safely. Check the desktop client, consent, port 8765, private directory permissions, and send-only scope; then retry. No diagnostic secrets were printed.", file=sys.stderr)
        return 1


if __name__ == "__main__":
    raise SystemExit(main())
