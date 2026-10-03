import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import { readFile, writeFile } from 'node:fs/promises';
import { createHash } from 'node:crypto';

const snapshotPath = 'src/generated/website-content.json';
const fixtureRun = spawnSync(process.execPath, ['--experimental-strip-types', 'scripts/prepare-content.mjs'], {
  env: { ...process.env, CONTENT_SOURCE: 'fixtures' }, encoding: 'utf8', windowsHide: true, timeout: 20000,
});
assert.equal(fixtureRun.status, 0, 'Fixture preparation succeeds without CMS credentials');
const before = await readFile(snapshotPath);
const failureRun = spawnSync(process.execPath, ['--experimental-strip-types', 'scripts/prepare-content.mjs'], {
  // Deliberately unavailable local HTTPS port; does not contact production CMS.
  env: { ...process.env, CONTENT_SOURCE: 'directus', DIRECTUS_URL: 'https://127.0.0.1:1', DIRECTUS_PUBLISHED_TOKEN: 'test-only-invalid-reader' },
  encoding: 'utf8', windowsHide: true, timeout: 20000,
});
assert.notEqual(failureRun.status, 0, 'Unavailable CMS fails preparation');
assert.match(failureRun.stderr, /fixtures were not substituted/);
assert.deepEqual(await readFile(snapshotPath), before, 'Failure cannot overwrite the existing prepared snapshot');
assert.doesNotMatch(failureRun.stderr + failureRun.stdout, /test-only-invalid-reader/);
const report = { checkedAt: new Date().toISOString(), fixturePreparation: true, unavailableCmsFails: true,
  previousSnapshotPreserved: true, credentialsNotPrinted: true, digest: createHash('sha256').update(before).digest('hex') };
await writeFile('artifacts/content-build-verification.json', JSON.stringify(report, null, 2) + '\n');
console.log('Content preparation failure, snapshot preservation and sanitized diagnostics passed');
