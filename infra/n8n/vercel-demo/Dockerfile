# Existing AgencyDesk image; no package installation or reference-project files.
FROM ghcr.io/n8n-io/n8n@sha256:86faa0c8a2fa2f89eae7c289a86c107141fcf22b2bcc45a1c823e382428dbe7f
USER node
COPY --chown=node:node runtime.mjs start.mjs /opt/agencydesk/
EXPOSE 5678
ENTRYPOINT ["node", "/opt/agencydesk/start.mjs"]
