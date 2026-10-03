import { readFile, mkdir, open, writeFile, stat } from 'node:fs/promises';
import { spawn } from 'node:child_process';
import { createHash } from 'node:crypto';
import { resolve } from 'node:path';

// Full data backup, including private account records. Never commit the archive.
// Use PostgreSQL client tools matching the hosted database's major version.
const config = JSON.parse(await readFile('.local/cms-secrets.json', 'utf8'));
const connection = new URL(config.databaseUrl);
if (!process.env.PGSSLROOTCERT) throw new Error('A trusted PostgreSQL TLS root certificate bundle is required');
const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
await mkdir('.local/backups', { recursive: true });
const output = resolve(`.local/backups/directus-${timestamp}.dump`);
const diagnostic = await open('.local/backups/last-backup-private.log', 'w');
const environment = { ...process.env,
  PGHOST: connection.hostname, PGPORT: connection.port || '5432',
  PGDATABASE: decodeURIComponent(connection.pathname.slice(1)),
  PGUSER: decodeURIComponent(connection.username), PGPASSWORD: decodeURIComponent(connection.password),
  PGSSLMODE: 'verify-full',
};
try {
  const child = spawn(process.env.PG_DUMP_BIN || 'pg_dump', ['--format=custom', '--file', output], {
    env: environment, windowsHide: true, stdio: ['ignore', 'ignore', diagnostic.fd],
  });
  await new Promise((resolve, reject) => {
    child.once('error', () => reject(new Error('PostgreSQL backup tools unavailable')));
    child.once('exit', code => code === 0 ? resolve() : reject(new Error('Backup failed; inspect the private local diagnostic')));
  });
  const digest = createHash('sha256').update(await readFile(output)).digest('hex');
  await writeFile('.local/backups/latest-backup.json', JSON.stringify({ createdAt: new Date().toISOString(), path: output, bytes: (await stat(output)).size, sha256: digest, verifiedTLS: true }, null, 2));
  console.log('Private full CMS backup saved with verified TLS. Restore testing is a separate step.');
} finally { await diagnostic.close(); }
