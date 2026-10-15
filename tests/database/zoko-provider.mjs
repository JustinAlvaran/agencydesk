import assert from 'node:assert/strict';
import { readFile, readdir } from 'node:fs/promises';
import { createRequire } from 'node:module';
const { PGlite } = createRequire(new URL('../../package.json', import.meta.url))('@electric-sql/pglite');
// Embedded PostgreSQL only. No hosted credentials, customer data or provider calls.
const db = new PGlite();
const agency='a0000000-0000-4000-8000-000000000001';
const id=n=>`50000000-0000-4000-8000-${String(n).padStart(12,'0')}`;
const admin=id(1), staff=id(2), client=id(3), otherAgency=id(4), otherAdmin=id(5);
const sharedId='3fa85f64-5717-4562-b3fc-2c963f66afa6';
let count=0, sequence=100;
async function actor(uid=null,role='authenticated'){await db.exec(`reset role; select set_config('request.jwt.claim.sub','${uid??''}',false); set role ${role};`);}
async function owner(){await db.exec('reset role');}
async function eq(sql,expected,message){assert.deepEqual((await db.query(sql)).rows[0]?.value,expected,message);count++;}
async function denied(sql,message){await assert.rejects(db.query(sql),undefined,message);count++;}
async function event(){await owner();const lead=id(sequence++),eventId=id(sequence++);await db.query(`insert into public.leads(id,contact_name,email,service,brief,email_opt_in,whatsapp_opt_in,phone) values($1,'Fictional lead','own@example.test','Website','Fictional project inquiry brief',true,true,'+639171234567')`,[lead]);await db.query("insert into public.activity_events(id,lead_id,event_type) values($1,$2,'inquiry_received')",[eventId,lead]);return (await db.query('select * from public.message_jobs where event_id=$1',[eventId])).rows[0];}
async function claim(){await actor(null,'service_role');return(await db.query('select * from public.claim_message_jobs(10,$1)',[agency])).rows;}
async function finish(job,outcome,providerId=null,error=null){await actor(null,'service_role');return(await db.query('select public.finish_message_job($1,$2,$3,$4,$5) as value',[job.id,job.lease_token,outcome,providerId,error])).rows[0].value;}
try {
 await db.exec(`create role anon;create role authenticated;create role service_role bypassrls;
 create schema auth;create table auth.users(id uuid primary key,email text);
 create function auth.uid() returns uuid language sql stable as $$select nullif(current_setting('request.jwt.claim.sub',true),'')::uuid$$;
 grant usage on schema auth,public to anon,authenticated,service_role;grant execute on function auth.uid() to anon,authenticated,service_role;
 create schema private;alter default privileges in schema public grant all on tables to service_role;
 alter default privileges in schema private grant all on tables to service_role;alter default privileges grant execute on functions to service_role;`);
 const directory=new URL('../../supabase/migrations/',import.meta.url);
 const migrations=(await readdir(directory)).filter(x=>x.endsWith('.sql')).sort();
 const providerMigration=migrations.find(x=>x.endsWith('_zoko_provider_routing.sql'));
 assert.ok(providerMigration,'CLI-created provider migration exists');
 for(const name of migrations.filter(x=>x<providerMigration))await db.exec(await readFile(new URL(name,directory),'utf8'));
 await db.exec(`insert into auth.users values('${admin}','admin@example.test'),('${staff}','staff@example.test'),('${client}','client@example.test'),('${otherAdmin}','other-admin@example.test');
 insert into public.staff_members(user_id,role,active) values('${admin}','admin',true),('${staff}','staff',true);
 insert into public.agencies(id,name,slug) values('${otherAgency}','Other fictional agency','other-zoko-agency');
 insert into public.staff_members(user_id,role,active,agency_id) values('${otherAdmin}','admin',true,'${otherAgency}');`);
 const rule=(await db.query("select id from public.automation_rules where agency_id=$1 and template_key='inquiry_acknowledgment'",[agency])).rows[0].id;
 async function configure(channel,provider){await actor(admin);return db.query('select public.configure_automation_rule($1,true,0,false,$2,$3)',[rule,channel,provider]);}
 await actor(admin);await db.query('select public.configure_automation_rule($1,true,0,false,$2)',[rule,'email']);
 const historical=await event();const[historicalLease]=await claim();assert.equal(historicalLease.id,historical.id);count++;
 assert.equal(await finish(historicalLease,'accepted',sharedId),true);count++;
 await owner();
 await db.exec(await readFile(new URL(providerMigration,directory),'utf8'));
 await eq(`select provider as value from public.message_jobs where id='${historical.id}'`,'resend','Existing jobs backfill without rerouting');
 await eq(`select provider as value from public.message_attempts where job_id='${historical.id}'`,'resend','Existing attempt history backfills');
 await eq(`select status as value from public.message_jobs where id='${historical.id}'`,'accepted','Backfill preserves acknowledged status');
 await eq("select count(*)::int as value from pg_proc p join pg_namespace n on n.oid=p.pronamespace where n.nspname='public' and p.proname='configure_automation_rule'",1,'One RPC signature prevents PostgREST ambiguity');
 await eq("select pronargdefaults::int as value from pg_proc where oid='public.configure_automation_rule(uuid,boolean,integer,boolean,text,text)'::regprocedure",1,'New provider parameter is optional for existing callers');
 await actor(null,'service_role');await denied(`select public.configure_automation_rule('${rule}',true,0,false,'whatsapp','zoko')`,'Service role cannot configure even with permissive defaults');
 await denied('select * from public.message_jobs','Adding provider does not expose outbox');
 await denied('select * from public.message_attempts','Adding provider does not expose attempt history');
 await actor(null,'anon');await denied(`select public.configure_automation_rule('${rule}',true,0,false,'whatsapp','zoko')`,'Anonymous cannot select Zoko');
 await actor(client);await denied(`select public.configure_automation_rule('${rule}',true,0,false,'whatsapp','zoko')`,'Client cannot configure messaging');
 await actor(staff);await denied(`select public.configure_automation_rule('${rule}',true,0,false,'whatsapp','zoko')`,'Staff needs admin role to choose provider');
 await actor(otherAdmin);await denied(`select public.configure_automation_rule('${rule}',true,0,false,'whatsapp','zoko')`,'Another agency admin cannot configure this provider');
 await actor(admin);await denied(`select public.configure_automation_rule('${rule}',true,0,false,'email','zoko')`,'Zoko cannot be paired with email');
 await denied(`select public.configure_automation_rule('${rule}',true,0,false,'whatsapp','arbitrary')`,'Only supported providers can be configured');
 await configure('whatsapp','whatsapp');const meta=await event();const[metaLease]=await claim();assert.equal(metaLease.provider,'whatsapp');count++;
 assert.equal(await finish(metaLease,'accepted',sharedId),true,'Meta may share textual ID with email provider');count++;
 await configure('whatsapp','zoko');const zoko=await event();const[zokoLease]=await claim();assert.equal(zokoLease.provider,'zoko');count++;
 assert.equal(await finish(zokoLease,'accepted',sharedId),true,'Zoko may share textual ID with Meta');count++;
 await owner();await eq(`select count(*)::int as value from public.message_jobs where provider_message_id='${sharedId}'`,3,'Provider-scoped identity permits three different providers');
 await eq(`select provider as value from public.message_attempts where job_id='${zoko.id}'`,'zoko','Each attempt freezes provider identity');
 await denied(`update public.message_jobs set provider='whatsapp' where id='${zoko.id}'`,'Acknowledged job provider is immutable');
 await denied(`update public.message_attempts set provider='whatsapp' where job_id='${zoko.id}'`,'Attempt provider is immutable');
 await actor(admin);await db.query('select public.configure_automation_rule($1,true,0,false,$2)',[rule,'whatsapp']);
 await eq(`select provider as value from public.automation_rules where id='${rule}'`,'zoko','Legacy five-argument same-channel configuration retains explicit provider');
 await actor(null,'service_role');await eq(`select public.record_message_receipt('whatsapp','meta-delivered','${sharedId}','delivered') as value`,true,'Trusted Meta receipt finds only Meta namespace');
 await owner();await eq(`select status as value from public.message_jobs where id='${meta.id}'`,'delivered','Meta advances to delivered');await eq(`select status as value from public.message_jobs where id='${zoko.id}'`,'accepted','Meta cannot advance colliding Zoko message');
 await actor(null,'service_role');await eq(`select public.record_message_receipt('zoko','zoko-read','${sharedId}','read') as value`,true,'Trusted reconciled Zoko receipt finds its namespace');
 await eq(`select public.record_message_receipt('zoko','zoko-read','${sharedId}','read') as value`,false,'Zoko receipt replay deduplicates');
 await owner();await eq(`select status as value from public.message_jobs where id='${zoko.id}'`,'read','Only Zoko job advances to read');await eq(`select status as value from public.message_jobs where id='${historical.id}'`,'accepted','WhatsApp receipts cannot change email collision');
 const early=await event();const[earlyLease]=await claim();const earlyId=id(80);
 await eq(`select public.record_message_receipt('whatsapp','meta-early','${earlyId}','read') as value`,false,'Unmatched Meta receipt waits within its own namespace');
 await eq(`select public.record_message_receipt('zoko','zoko-early','${earlyId}','delivered') as value`,false,'Early trusted Zoko receipt waits for acknowledgment');
 assert.equal(await finish(earlyLease,'accepted',earlyId),true);count++;
 await owner();await eq(`select status as value from public.message_jobs where id='${early.id}'`,'delivered','Acknowledgment reconciles only early Zoko receipt');
 await eq("select processed_at is null as value from private.provider_event_inbox where provider='whatsapp' and event_key='meta-early'",true,'Early colliding Meta receipt is not consumed by Zoko job');
 const duplicate=await event();const[duplicateLease]=await claim();
 await denied(`select public.finish_message_job('${duplicateLease.id}','${duplicateLease.lease_token}','accepted','${sharedId}')`,'Same-provider duplicate identities are rejected atomically');
 assert.equal(await finish(duplicateLease,'uncertain',null,'provider_result_unknown'),true);count++;
 await owner();await eq(`select status as value from public.message_jobs where id='${duplicate.id}'`,'uncertain','A colliding provider result cannot advance or corrupt the original job');
 const stale=await event();await configure('whatsapp','whatsapp');assert.equal((await claim()).length,0,'Changed provider skips earlier queued Zoko job');count++;
 await owner();await eq(`select last_error as value from public.message_jobs where id='${stale.id}'`,'rule_provider_changed','Skip explanation records rule provider change');await eq(`select provider as value from public.message_jobs where id='${stale.id}'`,'zoko','Skipped job preserves historical routing');
 await configure('whatsapp','zoko');const failed=await event();const[failedLease]=await claim();assert.equal(await finish(failedLease,'failed',null,'zoko_not_configured'),true);count++;
 await actor(otherAdmin);await eq(`select public.retry_message_job('${failed.id}') as value`,false,'Another agency cannot reset Zoko failure');
 await actor(admin);await eq(`select public.retry_message_job('${failed.id}') as value`,true,'Admin may reset a known unsent Zoko configuration failure');
 const[retryLease]=await claim();assert.equal(await finish(retryLease,'uncertain',null,'network_result_unknown'),true);count++;
 await actor(admin);await eq(`select public.retry_message_job('${failed.id}') as value`,false,'Ambiguous Zoko submission cannot be blindly resent');
 await owner();await denied(`update public.message_jobs set provider='resend' where id='${failed.id}'`,'No direct configuration rewrite can reroute a frozen job');
 await actor(admin);await denied(`select public.record_message_receipt('zoko','forged','${sharedId}','delivered')`,'Staff cannot forge trusted Zoko receipt');
 // Upgrade an existing provider history to WAHA without modifying old routes.
 await owner();
 const wahaMigration=migrations.find(x=>x.endsWith('_waha_provider.sql'));
 assert.ok(wahaMigration);count++;
 await db.exec(await readFile(new URL(wahaMigration,directory),'utf8'));
 await configure('whatsapp','waha');
 const waha=await event();const[wahaLease]=await claim();
 assert.equal(wahaLease.provider,'waha');count++;
 assert.equal(await finish(wahaLease,'accepted',sharedId),true);count++;
 await owner();await eq(`select status as value from public.message_jobs where id='${historical.id}'`,'accepted','WAHA upgrade preserves original email history');
 await actor(null,'service_role');
 await eq(`select public.record_message_receipt('waha','waha-delivered','${sharedId}','delivered') as value`,true,'Trusted WAHA receipt matches its own provider');
 await owner();await eq(`select status as value from public.message_jobs where id='${waha.id}'`,'delivered','WAHA identity cannot consume another provider receipt');
 await actor(admin);await denied(`select public.record_message_receipt('waha','forged-waha','${sharedId}','read')`,'Staff cannot forge WAHA receipts');
 await actor(otherAdmin);await denied(`select public.configure_automation_rule('${rule}',true,0,false,'whatsapp','waha')`,'Other agency cannot configure this WAHA route');
 await configure('whatsapp','waha');const wahaStale=await event();await configure('whatsapp','whatsapp');
 assert.equal((await claim()).length,0,'Changing provider never reroutes queued WAHA message');count++;
 await owner();await eq(`select provider as value from public.message_jobs where id='${wahaStale.id}'`,'waha','Skipped WAHA job preserves provider');
 await configure('whatsapp','waha');const wahaFailed=await event();const[wahaFailedLease]=await claim();
 assert.equal(await finish(wahaFailedLease,'failed',null,'waha_not_configured'),true);count++;
 await actor(admin);await eq(`select public.retry_message_job('${wahaFailed.id}') as value`,true,'Known unsent WAHA configuration failure can be reviewed again');
 const[wahaRetry]=await claim();assert.equal(await finish(wahaRetry,'uncertain',null,'network_result_unknown'),true);count++;
 await actor(admin);await eq(`select public.retry_message_job('${wahaFailed.id}') as value`,false,'Ambiguous WAHA result cannot be blindly resent');
 await owner();const gmailMigration=migrations.find(x=>x.endsWith('_gmail_provider.sql'));assert.ok(gmailMigration);count++;
 await db.exec(await readFile(new URL(gmailMigration,directory),'utf8'));
 await configure('email','gmail');await event();const[gmailLease]=await claim();assert.equal(gmailLease.provider,'gmail');count++;
 assert.equal(await finish(gmailLease,'accepted',sharedId),true);count++;
 await owner();await eq(`select status as value from public.message_jobs where id='${historical.id}'`,'accepted','Gmail acknowledgment does not alter colliding Resend history');
 await actor(admin);await denied(`select public.configure_automation_rule('${rule}',true,0,false,'whatsapp','gmail')`,'Gmail cannot become a WhatsApp provider');
 await configure('email','gmail');const gmailStale=await event();await configure('email','resend');assert.equal((await claim()).length,0,'Gmail jobs cannot be rerouted through Resend');count++;
 await owner();await eq(`select provider as value from public.message_jobs where id='${gmailStale.id}'`,'gmail','Skipped Gmail job preserves its provider');
 console.log(`Passed ${count} provider routing database assertions using embedded PostgreSQL.`);
}catch(error){console.error(error.message);process.exitCode=1;}finally{await db.close();}
