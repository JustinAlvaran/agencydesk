import test from "node:test";
import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import { fileURLToPath } from "node:url";
import { runtimeEnvironment } from "./runtime.mjs";

const valid = () => ({
  DB_POSTGRESDB_HOST: "database.example.test",
  DB_POSTGRESDB_DATABASE: "agencydesk_demo",
  DB_POSTGRESDB_USER: "demo",
  DB_POSTGRESDB_PASSWORD: "fictional-test-password",
  N8N_ENCRYPTION_KEY: "fictional-key-for-tests-only-32-characters",
  N8N_EDITOR_BASE_URL: "https://agencydesk-n8n.example.test",
});
for (const field of Object.keys(valid())) {
  test("reject missing setting " + field, () => {
    const input = valid(); delete input[field];
    assert.throws(() => runtimeEnvironment(input), /Missing hosted settings:/);
  });
}
test("refuse ephemeral SQLite", () => {
  assert.throws(() => runtimeEnvironment({ ...valid(), DB_TYPE: "sqlite" }), /PostgreSQL/);
});
test("refuse unstable short encryption key", () => {
  assert.throws(() => runtimeEnvironment({ ...valid(), N8N_ENCRYPTION_KEY: "short" }), /32/);
});
for (const origin of [
  "http://agencydesk-n8n.example.test",
  "https://user:fictional-password@agencydesk-n8n.example.test",
  "https://agencydesk-n8n.example.test/path",
  "https://agencydesk-n8n.example.test/?token=fictional",
  "https://agencydesk-n8n.example.test/#fragment",
  "https://localhost",
  "invalid-url-fictional",
]) {
  test("reject unsafe origin " + origin, () => {
    let message;
    try { runtimeEnvironment({ ...valid(), N8N_EDITOR_BASE_URL: origin }); }
    catch (error) { message = error.message; }
    assert.equal(message, "N8N_EDITOR_BASE_URL must be an HTTPS origin.");
    assert.ok(!message.includes("fictional-password"));
  });
}
test("require the configured HTTP port", () => {
  assert.throws(() => runtimeEnvironment({ ...valid(), PORT: "3000" }), /PORT/);
});
test("reject invalid database port", () => {
  assert.throws(() => runtimeEnvironment({ ...valid(), DB_POSTGRESDB_PORT: "99999" }), /PORT/);
});
test("force TLS, secure cookies, durable DB and canonical URLs", () => {
  const env = runtimeEnvironment({
    ...valid(), DB_POSTGRESDB_SSL_REJECT_UNAUTHORIZED: "false", N8N_SECURE_COOKIE: "false",
  });
  assert.equal(env.DB_TYPE, "postgresdb");
  assert.equal(env.DB_POSTGRESDB_SSL_ENABLED, "true");
  assert.equal(env.DB_POSTGRESDB_SSL_REJECT_UNAUTHORIZED, "true");
  assert.equal(env.N8N_SECURE_COOKIE, "true");
  assert.equal(env.WEBHOOK_URL, "https://agencydesk-n8n.example.test/");
  assert.equal(env.N8N_PORT, env.PORT);
  assert.equal(env.N8N_HOST, "agencydesk-n8n.example.test");
  assert.equal(env.GENERIC_TIMEZONE, "Asia/Manila");
  assert.equal(env.N8N_ENCRYPTION_KEY, valid().N8N_ENCRYPTION_KEY);
});
test("startup fails before invoking n8n when secrets are absent", () => {
  const result = spawnSync(process.execPath, [fileURLToPath(new URL("./start.mjs", import.meta.url))], {
    env: { PATH: process.env.PATH }, encoding: "utf8",
  });
  assert.equal(result.status, 1);
  assert.match(result.stderr, /Missing hosted settings:/);
  assert.ok(!result.stderr.includes(valid().DB_POSTGRESDB_PASSWORD));
});

test("use the dedicated Neon direct connection without exporting secrets", () => {
  const original = valid();
  const env = runtimeEnvironment({
    PGHOST_UNPOOLED: original.DB_POSTGRESDB_HOST,
    PGDATABASE: original.DB_POSTGRESDB_DATABASE,
    PGUSER: original.DB_POSTGRESDB_USER,
    PGPASSWORD: original.DB_POSTGRESDB_PASSWORD,
    N8N_ENCRYPTION_KEY: original.N8N_ENCRYPTION_KEY,
    N8N_EDITOR_BASE_URL: original.N8N_EDITOR_BASE_URL,
  });
  assert.equal(env.DB_POSTGRESDB_HOST, original.DB_POSTGRESDB_HOST);
  assert.equal(env.DB_POSTGRESDB_PASSWORD, original.DB_POSTGRESDB_PASSWORD);
  assert.equal(env.DB_POSTGRESDB_SSL_REJECT_UNAUTHORIZED, "true");
});
test("do not mix an incomplete explicit DB group with Neon credentials", () => {
  const original = valid();
  assert.throws(() => runtimeEnvironment({
    DB_POSTGRESDB_HOST: "another.example.test",
    PGHOST_UNPOOLED: original.DB_POSTGRESDB_HOST,
    PGDATABASE: original.DB_POSTGRESDB_DATABASE,
    PGUSER: original.DB_POSTGRESDB_USER,
    PGPASSWORD: original.DB_POSTGRESDB_PASSWORD,
    N8N_ENCRYPTION_KEY: original.N8N_ENCRYPTION_KEY,
    N8N_EDITOR_BASE_URL: original.N8N_EDITOR_BASE_URL,
  }), /Missing hosted settings:/);
});

test("reject an encrypted payload or URL supplied as a database hostname", () => {
  for (const host of ["opaque/ciphertext==", "postgres://fixture", "bad host"]) {
    assert.throws(() => runtimeEnvironment({ ...valid(), DB_POSTGRESDB_HOST: host }), /valid remote hostname/);
  }
});
