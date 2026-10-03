import assert from 'node:assert/strict';
import { readFile, readdir } from 'node:fs/promises';
import { createRequire } from 'node:module';
const { PGlite } = createRequire(new URL('../../package.json',import.meta.url))('@electric-sql/pglite');

// Real PostgreSQL engine, with only Supabase Auth's external schema mocked.
// Docker-backed `supabase test db` is still required before hosted rollout.
const db = new PGlite();
await db.exec(`create role anon; create role authenticated; create role service_role bypassrls;
 create schema auth; create table auth.users(id uuid primary key);
 create function auth.uid() returns uuid language sql stable as
 $$ select nullif(current_setting('request.jwt.claim.sub',true),'')::uuid $$;
 grant usage on schema auth,public to anon,authenticated,service_role;
 grant execute on function auth.uid() to anon,authenticated,service_role;`);
const migrationDirectory = new URL('../../supabase/migrations/', import.meta.url);
for (const name of (await readdir(migrationDirectory)).filter(name=>name.endsWith('.sql')).sort()) {
  await db.exec(await readFile(new URL(name,migrationDirectory),'utf8'));
}
const ids = Object.fromEntries(['staff','a','b','companyA','companyB','lead','series','revision','update'].map((key, i) => [key, `00000000-0000-4000-8000-${String(i+1).padStart(12,'0')}`]));
await db.exec(`insert into auth.users values('${ids.staff}'),('${ids.a}'),('${ids.b}');
 insert into public.staff_members values('${ids.staff}','admin',true);
 insert into public.companies(id,name) values('${ids.companyA}','Fictional A'),('${ids.companyB}','Fictional B');
 insert into public.client_memberships values('${ids.a}','${ids.companyA}',true,true),('${ids.b}','${ids.companyB}',true,true);
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
await actor(null, 'anon');
await denied('select * from public.leads', 'Anonymous lead read denied');
await denied(`select public.accept_proposal_revision('${ids.revision}')`, 'Anonymous acceptance denied');
await actor(ids.a);
await eq('select count(*)::integer as value from public.leads', 0, 'Client cannot read internal lead');
await eq('select count(*)::integer as value from public.proposal_revisions', 0, 'Draft remains staff-only');
await eq('select count(*)::integer as value from public.companies', 1, 'Client sees one company');
await eq(`with changed as (update public.staff_members set role='admin' where user_id='${ids.a}' returning 1) select count(*)::integer as value from changed`, 0, 'Privilege escalation unavailable');
await actor(ids.staff);
await denied(`update public.leads set status='won' where id='${ids.lead}'`, 'Staff cannot manually mark Won');
await db.query(`select public.publish_proposal_revision('${ids.revision}')`); count++;
await eq(`select total_cents::integer as value from public.proposal_revisions where id='${ids.revision}'`, 20000, 'Total calculated in database');
await denied(`update public.proposal_revisions set scope='Changed' where id='${ids.revision}'`, 'Published scope frozen');
await denied(`update public.proposal_items set quantity=3 where revision_id='${ids.revision}'`, 'Published items frozen');
await denied(`update public.proposal_revisions set status='accepted' where id='${ids.revision}'`, 'Staff cannot bypass acceptance RPC');
await actor(ids.b);
await eq('select count(*)::integer as value from public.proposal_revisions', 0, 'Other-company revision hidden');
await denied(`select public.accept_proposal_revision('${ids.revision}')`, 'Other-company acceptance denied');
await actor(ids.a);
await eq('select count(*)::integer as value from public.proposal_revisions', 1, 'Published revision visible to intended client');
const { rows: [accepted] } = await db.query(`select public.accept_proposal_revision('${ids.revision}') as value`); count++;
await eq(`select public.accept_proposal_revision('${ids.revision}') as value`, accepted.value, 'Retry returns original project');
await eq('select count(*)::integer as value from public.projects', 1, 'Exactly one project');
await eq('select count(*)::integer as value from public.activity_events', 0, 'Internal activity hidden');
await denied(`insert into public.projects(company_id,lead_id,accepted_revision_id,name) values('${ids.companyA}','${ids.lead}','${ids.revision}','Spoof')`, 'Client cannot create projects directly');
await actor(ids.staff);
await eq(`select status as value from public.leads where id='${ids.lead}'`, 'won', 'Lead atomically converted');
await eq(`select count(*)::integer as value from public.activity_events where event_type='proposal_accepted'`, 1, 'One acceptance event');
await eq(`select (public.get_dashboard_metrics()->>'accepted_cents')::integer as value`, 20000, 'Dashboard aggregates accepted value from database');
await db.exec(`insert into public.project_updates(id,project_id,body) values('${ids.update}','${accepted.value}','Shared milestone update')`);
await actor(ids.a);
await denied(`insert into public.comments(update_id,author_id,body) values('${ids.update}','${ids.b}','Spoofed author')`, 'Comment author must match authenticated actor');
await db.exec(`insert into public.comments(update_id,author_id,body) values('${ids.update}','${ids.a}','Original feedback')`); count++;
await actor(ids.b);
await eq('select count(*)::integer as value from public.comments', 0, 'Other-company comments hidden');
await denied('select public.get_dashboard_metrics()', 'Client cannot access staff dashboard aggregate');
await actor(null, 'service_role');
await db.exec(`update public.client_memberships set active=false where user_id='${ids.a}'`);
await actor(ids.a);
await eq('select count(*)::integer as value from public.projects', 0, 'Live membership removal with same JWT');
await denied(`select public.accept_proposal_revision('${ids.revision}')`, 'Removed member cannot retry acceptance');
await db.exec('reset role');
await eq(`select count(*)::integer as value from public.projects`, 1, 'Project persisted once');
// Fresh lead: exercise revisions and inject a late transaction failure.
const lead2='10000000-0000-4000-8000-000000000001';
const series2='10000000-0000-4000-8000-000000000002';
const revision2='10000000-0000-4000-8000-000000000003';
const revision3='10000000-0000-4000-8000-000000000004';
await db.exec(`update public.client_memberships set active=true where user_id='${ids.a}';
 insert into public.leads(id,company_id,contact_name,email,service,brief) values('${lead2}','${ids.companyA}','Second fictional contact','c@example.test','Web app','Second original fictional app');
 insert into public.proposal_series(id,lead_id,company_id,title) values('${series2}','${lead2}','${ids.companyA}','Revision test');
 insert into public.proposal_revisions(id,series_id,version,scope,expires_at) values('${revision2}','${series2}',1,'Original scope',now()+interval '7 days'),('${revision3}','${series2}',2,'Revised scope',now()+interval '7 days');
 insert into public.proposal_items(revision_id,description,quantity,unit_price_cents) values('${revision2}','Original item',1,10000),('${revision3}','Revised item',1,15000);`);
await actor(ids.staff);
await db.exec(`select public.publish_proposal_revision('${revision2}'); select public.publish_proposal_revision('${revision3}')`);
await eq(`select status as value from public.proposal_revisions where id='${revision2}'`, 'superseded', 'New publication supersedes previous pending revision');
await denied(`update public.leads set company_id='${ids.companyB}' where id='${lead2}'`, 'Proposal ownership prevents company reassignment');
await actor(ids.a);
await denied(`select public.accept_proposal_revision('${revision2}')`, 'Superseded proposal cannot be accepted');
await eq('select count(*)::integer as value from public.proposal_revisions', 3, 'Published revision history remains client visible');
await db.exec(`reset role;
 create function private.inject_failure() returns trigger language plpgsql as $$ begin if new.event_type='proposal_accepted' then raise exception 'Injected late failure'; end if; return new; end $$;
 create trigger inject_failure before insert on public.activity_events for each row execute function private.inject_failure();`);
await actor(ids.a);
await denied(`select public.accept_proposal_revision('${revision3}')`, 'Late transaction failure surfaced');
await db.exec('reset role');
await eq(`select status as value from public.proposal_revisions where id='${revision3}'`, 'published', 'Acceptance rollback restores proposal');
await eq(`select status as value from public.leads where id='${lead2}'`, 'proposal_sent', 'Acceptance rollback restores lead');
await eq(`select count(*)::integer as value from public.projects where lead_id='${lead2}'`, 0, 'Acceptance rollback removes project');
await db.exec('drop trigger inject_failure on public.activity_events; drop function private.inject_failure()');
await actor(ids.a);
await db.query(`select public.decline_proposal_revision('${revision3}')`); count++;
await denied(`select public.accept_proposal_revision('${revision3}')`, 'Declined revision cannot be accepted');
await actor(null, 'service_role');
for (let i=0;i<5;i++) await db.query(`select public.submit_inquiry('Fictional visitor','visitor@example.test','Web application','A fictional inquiry long enough to validate',10000,'fictional-rate-key-12345')`);
await denied(`select public.submit_inquiry('Fictional visitor','visitor@example.test','Web application','A fictional inquiry long enough to validate',10000,'fictional-rate-key-12345')`, 'Persistent rate limit blocks sixth inquiry');
await actor(ids.a);
await denied(`select public.submit_inquiry('Fictional visitor','visitor@example.test','Web application','A fictional inquiry long enough to validate',10000,'different-key-123456')`, 'Authenticated caller cannot bypass server inquiry endpoint');
await db.exec(`reset role; update public.staff_members set active=false where user_id='${ids.staff}'`);
await actor(ids.staff);
await eq('select count(*)::integer as value from public.leads', 0, 'Staff deactivation blocks existing JWT');
await db.exec('reset role');
const seed = await readFile(new URL('../../supabase/seed.sql',import.meta.url),'utf8');
await db.exec(seed);
await db.exec(seed);
await eq(`select count(*)::integer as value from public.companies where id::text like '20000000-%'`, 3, 'Original fictional seed is reproducible');
await db.close();
console.log(`Passed ${count} database assertions using embedded PostgreSQL.`);
