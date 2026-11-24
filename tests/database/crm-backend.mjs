import assert from 'node:assert/strict';
import { readFile, readdir } from 'node:fs/promises';
import { createRequire } from 'node:module';
const { PGlite } = createRequire(new URL('../../package.json',import.meta.url))('@electric-sql/pglite');

// Real PostgreSQL engine, with only Supabase Auth's external schema mocked.
// Docker-backed `supabase test db` is still required before hosted rollout.
const db = new PGlite();
await db.exec(`create role anon; create role authenticated; create role service_role bypassrls;
 create schema auth; create table auth.users(id uuid primary key,email text);
 create function auth.uid() returns uuid language sql stable as
 $$ select nullif(current_setting('request.jwt.claim.sub',true),'')::uuid $$;
 grant usage on schema auth,public to anon,authenticated,service_role;
 grant execute on function auth.uid() to anon,authenticated,service_role;`);
const migrationDirectory = new URL('../../supabase/migrations/', import.meta.url);
for (const name of (await readdir(migrationDirectory)).filter(name=>name.endsWith('.sql')).sort()) {
  await db.exec(await readFile(new URL(name,migrationDirectory),'utf8'));
}
const ids = Object.fromEntries(['staff','a','b','companyA','companyB','lead','series','revision','update'].map((key, i) => [key, `00000000-0000-4000-8000-${String(i+1).padStart(12,'0')}`]));
await db.exec(`insert into auth.users(id) values('${ids.staff}'),('${ids.a}'),('${ids.b}');
 insert into public.staff_members(user_id,role,active) values('${ids.staff}','admin',true);
 insert into public.companies(id,name) values('${ids.companyA}','Fictional A'),('${ids.companyB}','Fictional B');
 insert into public.client_memberships(user_id,company_id,active,can_accept_proposals) values('${ids.a}','${ids.companyA}',true,true),('${ids.b}','${ids.companyB}',true,true);
 insert into public.leads(id,company_id,contact_name,email,service,brief) values('${ids.lead}','${ids.companyA}','Fictional Contact','a@example.test','Web app','An original fictional app brief');
 insert into public.proposal_series(id,lead_id,company_id,title) values('${ids.series}','${ids.lead}','${ids.companyA}','Fictional Portal');
 insert into public.proposal_revisions(id,series_id,version,scope,expires_at) values('${ids.revision}','${ids.series}',1,'A published original scope',now()+interval '7 days');
 insert into public.proposal_items(revision_id,description,quantity,unit_price_cents) values('${ids.revision}','Portal build',2,10000);`);
let count = 0;
async function actor(id, role = 'authenticated') {
  await db.exec(`reset role; select set_config('request.jwt.claim.sub','${id ?? ''}',false); set role ${role};`);
}
async function eq(sql, expected, message) {
  const result = await db.query(sql);
  assert.deepEqual(result.rows[0]?.value, expected, message); count++;
}
async function denied(sql, message) {
  await assert.rejects(db.query(sql), undefined, message); count++;
}

await actor(ids.staff);
await eq(`select (public.update_lead_stage('${ids.lead}',1,'contacted')).probability as value`,40,'Stage derives probability');
await denied(`select public.update_lead_stage('${ids.lead}',1,'qualified')`,'Stale write fails');
await denied(`select public.update_lead_stage('${ids.lead}',2,'won')`,'Cannot bypass proposal acceptance');
await denied(`update public.leads set probability=99 where id='${ids.lead}'`,'Probability is generated');
await eq(`select count(*)::integer as value from public.events_outbox where event_type='lead_stage_changed'`,1,'Stage event durable');
await db.query(`select public.save_connection('apollo','encrypted-test-envelope',false)`);
await eq(`select status as value from public.integration_connections where provider='apollo'`,'saved','Save is not a successful provider test');
await denied(`select * from private.connection_credentials`,'Even staff cannot read encrypted secrets');
await denied(`select public.connection_secret((select agency_id from public.staff_members where user_id='${ids.staff}'),'apollo')`,'Staff cannot call service secret API');
await db.query(`select public.publish_proposal_revision('${ids.revision}')`);
await denied(`update public.proposal_revisions set payment_terms='changed' where id='${ids.revision}'`,'Published payment terms immutable');
const digest='a'.repeat(64);
await db.query(`select public.issue_proposal_link('${ids.revision}','${digest}')`);
await actor(null,'anon');
await eq(`select public.read_proposal_link('${digest}')->>'scope' as value`,'A published original scope','Capability reads intended scope');
await eq(`select public.read_proposal_link('${digest}') ? 'email' as value`,false,'Scope capability exposes no contact email');
await denied(`select * from public.integration_connections`,'Anonymous connection read denied');
await denied(`select public.save_connection('apollo','evil-envelope',false)`,'Anonymous connection save denied');
await denied(`select * from public.events_outbox`,'Anonymous events read denied');
await actor(ids.b);
await denied(`select public.accept_proposal_revision('${ids.revision}')`,'Public scope link cannot grant other client acceptance');
await actor(ids.a);
const accepted=(await db.query(`select public.accept_proposal_revision('${ids.revision}') as value`)).rows[0].value;
await eq(`select public.accept_proposal_revision('${ids.revision}') as value`,accepted,'Acceptance retry returns same project');
await actor(ids.staff);
await db.query(`select public.revoke_proposal_links('${ids.revision}')`);
await actor(null,'anon');
await eq(`select public.read_proposal_link('${digest}') as value`,null,'Revoked scope link unavailable');
await actor(ids.staff);
const milestone=(await db.query(`insert into public.milestones(project_id,title) values('${accepted}','Deliverable review') returning id`)).rows[0].id;
await denied(`update public.milestones set status='completed' where id='${milestone}'`,'Staff cannot skip client review');
await denied(`update public.milestones set review_status='approved' where id='${milestone}'`,'Direct approval forbidden');
await db.query(`update public.milestones set review_status='review' where id='${milestone}'`);
await actor(ids.b);
await denied(`select public.review_milestone('${milestone}',true,'Approved')`,'Other client approval denied');
await actor(ids.a);
await db.query(`select public.review_milestone('${milestone}',false,'Please revise the deliverable')`);
await eq(`select review_status as value from public.milestones where id='${milestone}'`,'changes_requested','Client requests changes');
await actor(ids.staff);await db.query(`update public.milestones set review_status='review' where id='${milestone}'`);
await actor(ids.a);await db.query(`select public.review_milestone('${milestone}',true,'Accepted')`);
await eq(`select status as value from public.milestones where id='${milestone}'`,'completed','Client approval completes milestone');
// A second agency cannot see or mutate the first agency's new surfaces.
await actor(null,'service_role');
const second='00000000-0000-4000-8000-000000000099';
await db.exec(`reset role;insert into auth.users(id) values('${second}');`);
await actor(ids.staff);
const agency2=(await db.query(`select public.provision_agency('Other fictional agency','other-fixture','${second}') as value`)).rows[0].value;
await actor(second);
await eq('select count(*)::integer as value from public.integration_connections',0,'Connections isolated by agency');
await eq('select count(*)::integer as value from public.events_outbox',0,'Events isolated by agency');
await denied(`select public.update_lead_stage('${ids.lead}',3,'lost')`,'Other agency stage change denied');
await denied(`select public.issue_proposal_link('${ids.revision}','${'b'.repeat(64)}')`,'Other agency capability issue denied');
await actor(null,'service_role');
const agency=(await db.query(`select agency_id from public.staff_members where user_id='${ids.staff}'`)).rows[0].agency_id;
const events=(await db.query(`select * from public.claim_crm_events('${agency}',1)`)).rows;
assert.equal(events.length,1);count++;
await denied(`select public.complete_crm_event('${agency2}','${events[0].id}','00000000-0000-4000-8000-000000000081','${events[0].lease_token}')`,'Webhook cannot complete another agency event');
const receipt='00000000-0000-4000-8000-000000000082';
await eq(`select public.complete_crm_event('${agency}','${events[0].id}','${receipt}','${events[0].lease_token}') as value`,true,'Leased internal event completed');
await eq(`select public.complete_crm_event('${agency}','${events[0].id}','${receipt}','${events[0].lease_token}') as value`,true,'Webhook replay is idempotent');
console.log(`Passed ${count} new CRM boundary assertions.`);
await db.close();
