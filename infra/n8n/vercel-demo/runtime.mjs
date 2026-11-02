// Reject ephemeral SQLite and missing persistent encryption before n8n boots.
// Errors contain fixed field names only, never provider values or URLs.
export function runtimeEnvironment(provided) {
  const input = { ...provided };
  // Never combine a partial explicit DB group with an integration connection.
  const explicit = ["DB_POSTGRESDB_HOST", "DB_POSTGRESDB_DATABASE",
    "DB_POSTGRESDB_USER", "DB_POSTGRESDB_PASSWORD"].some((key) => input[key]);
  if (!explicit) {
    input.DB_POSTGRESDB_HOST = input.PGHOST_UNPOOLED;
    input.DB_POSTGRESDB_DATABASE = input.PGDATABASE;
    input.DB_POSTGRESDB_USER = input.PGUSER;
    input.DB_POSTGRESDB_PASSWORD = input.PGPASSWORD;
  }
  const required = [
    "DB_POSTGRESDB_HOST", "DB_POSTGRESDB_DATABASE", "DB_POSTGRESDB_USER",
    "DB_POSTGRESDB_PASSWORD", "N8N_ENCRYPTION_KEY", "N8N_EDITOR_BASE_URL",
  ];
  const missing = required.filter((key) => !input[key]?.trim());
  if (missing.length) throw new Error("Missing hosted settings: " + missing.join(", "));
  if (input.DB_TYPE && input.DB_TYPE !== "postgresdb") {
    throw new Error("Hosted demo requires PostgreSQL; SQLite is not durable here.");
  }
  if (input.N8N_ENCRYPTION_KEY.length < 32) {
    throw new Error("N8N_ENCRYPTION_KEY must contain at least 32 characters.");
  }
  let url;
  try { url = new URL(input.N8N_EDITOR_BASE_URL); }
  catch { throw new Error("N8N_EDITOR_BASE_URL must be an HTTPS origin."); }
  if (url.protocol !== "https:" || url.username || url.password || url.search ||
      url.hash || url.pathname !== "/" || url.port ||
      url.hostname === "localhost" || url.hostname === "127.0.0.1") {
    throw new Error("N8N_EDITOR_BASE_URL must be an HTTPS origin.");
  }
  if (!/^[A-Za-z0-9][A-Za-z0-9.-]{0,252}$/.test(input.DB_POSTGRESDB_HOST)) {
    throw new Error("DB_POSTGRESDB_HOST must be a valid remote hostname.");
  }
  const port = input.PORT || "5678";
  if (port !== "5678") throw new Error("Set the Vercel PORT setting to 5678.");
  const dbPort = input.DB_POSTGRESDB_PORT || "5432";
  if (!/^\d+$/.test(dbPort) || Number(dbPort) < 1 || Number(dbPort) > 65535) {
    throw new Error("DB_POSTGRESDB_PORT is invalid.");
  }
  return {
    ...input,
    DB_TYPE: "postgresdb",
    DB_POSTGRESDB_PORT: dbPort,
    DB_POSTGRESDB_SSL_ENABLED: "true",
    DB_POSTGRESDB_SSL_REJECT_UNAUTHORIZED: "true",
    DB_POSTGRESDB_POOL_SIZE: "2",
    DB_POSTGRESDB_CONNECTION_TIMEOUT: "30000",
    PORT: port,
    N8N_PORT: port,
    N8N_LISTEN_ADDRESS: "0.0.0.0",
    N8N_HOST: url.hostname,
    N8N_PROTOCOL: "https",
    N8N_EDITOR_BASE_URL: url.origin,
    WEBHOOK_URL: url.origin + "/",
    N8N_PROXY_HOPS: "1",
    N8N_SECURE_COOKIE: "true",
    N8N_USER_FOLDER: "/tmp/agencydesk-n8n",
    N8N_ENFORCE_SETTINGS_FILE_PERMISSIONS: "true",
    N8N_BLOCK_ENV_ACCESS_IN_NODE: "true",
    N8N_BLOCK_FILE_ACCESS_TO_N8N_FILES: "true",
    N8N_COMMUNITY_PACKAGES_ENABLED: "false",
    N8N_UNVERIFIED_PACKAGES_ENABLED: "false",
    N8N_DIAGNOSTICS_ENABLED: "false",
    N8N_VERSION_NOTIFICATIONS_ENABLED: "false",
    N8N_TEMPLATES_ENABLED: "false",
    N8N_GRACEFUL_SHUTDOWN_TIMEOUT: "20",
    N8N_CONCURRENCY_PRODUCTION_LIMIT: "1",
    NODES_EXCLUDE: JSON.stringify([
      "n8n-nodes-base.executeCommand", "n8n-nodes-base.localFileTrigger",
      "n8n-nodes-base.readWriteFile", "n8n-nodes-base.code",
    ]),
    EXECUTIONS_DATA_SAVE_ON_SUCCESS: "none",
    EXECUTIONS_DATA_SAVE_ON_ERROR: "none",
    EXECUTIONS_DATA_SAVE_MANUAL_EXECUTIONS: "false",
    EXECUTIONS_DATA_PRUNE: "true",
    EXECUTIONS_DATA_MAX_AGE: "24",
    GENERIC_TIMEZONE: "Asia/Manila",
    TZ: "Asia/Manila",
  };
}
