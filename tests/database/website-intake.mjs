import assert from 'node:assert/strict';
import { readFile, readdir } from 'node:fs/promises';
import { createRequire } from 'node:module';
const { PGlite } = createRequire(new URL('../../package.json', import.meta.url))('@electric-sql/pglite');
const db = new PGlite();
await db.exec(`create role anon; create role authenticated; create role service_role bypassrls;
create schema auth; create table auth.users(id uuid primary key,email text);
create function auth.uid() returns uuid language sql stable as $$ select nullif(current_setting('request.jwt.claim.sub',true),'')::uuid $$;
grant usage on schema auth,public to anon,authenticated,service_role; grant execute on function auth.uid() to anon,authenticated,service_role;`);
const directory = new URL('../../supabase/migrations/', import.meta.url);
for (const file of (await readdir(directory)).filter(file => file.endsWith('.sql')).sort()) await db.exec(await readFile(new URL(file, directory), 'utf8'));
const agency = 'a0000000-0000-4000-8000-000000000001';
const submission = '80000000-0000-4000-8000-000000000001';
const hash = 'a'.repeat(64);
await db.exec("update public.automation_rules set enabled=true where template_key='inquiry_acknowledgment'");
const args = [agency, submission, hash, 'website-test-rate-key', 'Fictional visitor', 'visitor@example.test', 'Business websites', 'A fictional website inquiry for verification.', 100000, null, false, false, 'website_chatbot'];
const sql = 'select public.submit_website_inquiry($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13) as id';
let checks = 0;
async function eq(query, expected, label) {
  const role = (await db.query('select current_user as value')).rows[0].value;
  await db.exec('reset role');
  try { assert.deepEqual((await db.query(query)).rows[0].value, expected, label); checks++; }
  finally { await db.exec(`set role ${role}`); }
}
for (const role of ['anon', 'authenticated']) {
  await db.exec(`set role ${role}`);
  await assert.rejects(db.query(sql, args)); checks++;
  await assert.rejects(db.query('select * from private.website_submissions')); checks++;
  await db.exec('reset role');
}
await db.exec('set role service_role');
const first = (await db.query(sql, args)).rows[0].id; checks++;
assert.equal((await db.query(sql, args)).rows[0].id, first); checks++;
await eq('select count(*)::int as value from public.leads', 1, 'A retried request creates one lead');
await eq('select count(*)::int as value from public.message_jobs', 1, 'A retried request creates one acknowledgment job');
await eq('select count(*)::int as value from private.inquiry_requests', 1, 'Retries do not consume rate-limit quota');
await eq("select source as value from public.leads limit 1", 'website_chatbot', 'Chatbot source is visible to staff');
await eq("select status as value from public.message_jobs limit 1", 'skipped', 'No permission means no message');
await eq("select attempts as value from public.message_jobs limit 1", 0, 'No transport attempt');
const changed = [...args]; changed[2] = 'b'.repeat(64); changed[10] = true;
await assert.rejects(db.query(sql, changed), /Submission content changed/); checks++;
await eq('select email_opt_in as value from public.leads limit 1', false, 'Replay cannot change consent');
for (const index of [0, 1, 2, 12]) {
  const invalid = [...args]; invalid[index] = null;
  await assert.rejects(db.query(sql, invalid)); checks++;
}
const other = '80000000-0000-4000-8000-000000000002';
await db.exec(`reset role; insert into public.agencies(id,name,slug) values('${other}','Fictional other agency','website-other'); set role service_role;`);
const routed = [...args]; routed[0] = other;
assert.notEqual((await db.query(sql, routed)).rows[0].id, first); checks++;
await eq('select count(*)::int as value from private.website_submissions', 2, 'Submission keys are agency scoped');
await db.exec(`reset role; update public.agencies set intake_enabled=false where id='${other}'; set role service_role;`);
await assert.rejects(db.query(sql, routed), /Agency intake is unavailable/); checks++;
await eq('select count(*)::int as value from public.leads', 2, 'Invalid or disabled requests leave no extra leads');
// Existing privileged helpers must reject a signed-in account without staff membership.
await db.exec("reset role; insert into auth.users values('80000000-0000-4000-8000-000000000003','outsider@example.test'); select set_config('request.jwt.claim.sub','80000000-0000-4000-8000-000000000003',false); set role authenticated;");
await assert.rejects(db.query("select public.workspace_account('outsider@example.test')"), /Platform owner required/); checks++;
await assert.rejects(db.query("select public.provision_agency('Fake','fake','80000000-0000-4000-8000-000000000003')"), /Platform owner required/); checks++;
await db.close();
console.log(`Passed ${checks} website intake database assertions.`);
