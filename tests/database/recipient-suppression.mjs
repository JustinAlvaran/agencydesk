import assert from 'node:assert/strict';
import {readFile,readdir} from 'node:fs/promises';
import {createRequire} from 'node:module';
const {PGlite}=createRequire(new URL('../../package.json',import.meta.url))('@electric-sql/pglite');
const db=new PGlite(), agency='a0000000-0000-4000-8000-000000000001';
const id=n=>`60000000-0000-4000-8000-${String(n).padStart(12,'0')}`;
const admin=id(1),staff=id(2),client=id(3),otherAgency=id(4),otherAdmin=id(5);
let checks=0,sequence=100;
async function actor(uid=null,role='authenticated'){await db.exec(`reset role;select set_config('request.jwt.claim.sub','${uid??''}',false);set role ${role};`);}
async function owner(){await db.exec('reset role');}
async function eq(sql,expected,note){assert.deepEqual((await db.query(sql)).rows[0]?.value,expected,note);checks++;}
async function denied(sql,note){await assert.rejects(db.query(sql),undefined,note);checks++;}
async function lead({email='person@example.test',phone='+639171234567',optIn=true,agencyId=agency}={}){await owner();const key=id(sequence++);await db.query(`insert into public.leads(id,agency_id,contact_name,email,phone,service,brief,email_opt_in,whatsapp_opt_in) values($1,$2,'Fictional person',$3,$4,'Website','Fictional project inquiry', $5,$5)`,[key,agencyId,email,phone,optIn]);return key;}
async function inquiry(leadId){await owner();const key=id(sequence++);await db.query("insert into public.activity_events(id,lead_id,event_type) values($1,$2,'inquiry_received')",[key,leadId]);return(await db.query('select * from public.message_jobs where event_id=$1',[key])).rows[0];}
async function configure(agencyId=agency,channel='email',approval=false){await actor(agencyId===agency?admin:otherAdmin);await db.query("select public.configure_automation_rule(id,true,0,$1,$2,$3) from public.automation_rules where agency_id=$4 and template_key='inquiry_acknowledgment'",[approval,channel,channel==='email'?'resend':'whatsapp',agencyId]);}
try{
 await db.exec(`create role anon;create role authenticated;create role service_role bypassrls;create schema auth;create table auth.users(id uuid primary key,email text);
 create function auth.uid() returns uuid language sql stable as $$select nullif(current_setting('request.jwt.claim.sub',true),'')::uuid$$;
 grant usage on schema auth,public to anon,authenticated,service_role;grant execute on function auth.uid() to anon,authenticated,service_role;
 create schema private;alter default privileges in schema public grant all on tables to service_role;alter default privileges in schema private grant all on tables to service_role;alter default privileges grant execute on functions to service_role;`);
 const directory=new URL('../../supabase/migrations/',import.meta.url);
 const files=(await readdir(directory)).filter(name=>name.endsWith('.sql')).sort();
 const migration=files.find(name=>name.endsWith('_recipient_suppression.sql'));assert.ok(migration);checks++;
 for(const name of files.filter(name=>name<=migration))await db.exec(await readFile(new URL(name,directory),'utf8'));
 await db.exec(`insert into auth.users values('${admin}','admin@example.test'),('${staff}','staff@example.test'),('${client}','client@example.test'),('${otherAdmin}','other@example.test');
 insert into public.staff_members(user_id,role,active) values('${admin}','admin',true),('${staff}','staff',true);
 insert into public.agencies(id,name,slug) values('${otherAgency}','Other fictional agency','other-suppression-agency');
 insert into public.staff_members(user_id,role,active,agency_id) values('${otherAdmin}','admin',true,'${otherAgency}');`);
 await configure();await configure(otherAgency);
 const first=await lead(),duplicate=await lead({email:' PERSON@example.test '}),other=await lead({agencyId:otherAgency});
 const queued=await inquiry(duplicate),unrelated=await inquiry(other);
 await actor(staff);await eq(`select public.suppress_lead_recipient('${first}','email') as value`,true,'Staff can record explicit opt-out');
 await eq(`select email_opt_in as value from public.leads where id='${first}'`,false,'Explicit opt-out withdraws this lead consent');
 await eq(`select status as value from public.message_jobs where id='${queued.id}'`,'cancelled','Existing duplicate recipient job cancelled');
 await eq(`select last_error as value from public.message_jobs where id='${queued.id}'`,'recipient_suppressed','Cancellation explains why');
 await eq(`select suppressed as value from public.lead_message_suppression('${duplicate}') where channel='email'`,true,'Duplicate canonical email suppressed');
 await eq(`select suppressed as value from public.lead_message_suppression('${duplicate}') where channel='whatsapp'`,false,'Suppression is channel scoped');
 const skipped=await inquiry(duplicate);await owner();await eq(`select status as value from public.message_jobs where id='${skipped.id}'`,'skipped','New opted-in duplicate jobs blocked');
 await eq(`select last_error as value from public.message_jobs where id='${skipped.id}'`,'recipient_suppressed','Enqueue reason identifies recipient opt-out');
 await eq(`select status as value from public.message_jobs where id='${unrelated.id}'`,'queued','Same recipient in another agency is unaffected');
 for(const [uid,role] of [[null,'anon'],[client,'authenticated'],[otherAdmin,'authenticated'],[null,'service_role']]){await actor(uid,role);await denied(`select public.suppress_lead_recipient('${first}','email')`,'Unrelated principals cannot suppress');await denied(`select * from public.lead_message_suppression('${first}')`,'No recipient directory leak');}
 for(const role of ['authenticated','service_role']){await actor(admin,role);await denied('select * from private.recipient_suppressions','Private table not directly readable');await denied('delete from private.recipient_suppressions','Private table not directly writable');}
 await actor(staff);await denied(`select public.admin_clear_lead_recipient_suppression('${first}','email')`,'Clearing requires admin');
 await actor(otherAdmin);await denied(`select public.admin_clear_lead_recipient_suppression('${first}','email')`,'Other agency admin cannot clear');
 await actor(admin);await db.query('update public.leads set email_opt_in=true where id=$1',[first]);
 await eq(`select suppressed as value from public.lead_message_suppression('${first}') where channel='email'`,true,'Restoring boolean alone cannot bypass suppression');
 await eq(`select public.admin_clear_lead_recipient_suppression('${first}','email') as value`,true,'Own admin can clear');
 await eq(`select public.admin_clear_lead_recipient_suppression('${first}','email') as value`,false,'Clearing an absent block is idempotent');
 await eq(`select status as value from public.message_jobs where id='${queued.id}'`,'cancelled','Clearing never replays cancelled jobs');
 await eq(`select status as value from public.message_jobs where id='${skipped.id}'`,'skipped','Clearing never replays skipped jobs');
 await eq(`select count(*)::int as value from public.activity_events where lead_id='${first}' and event_type='lead_recipient_suppression_cleared'`,1,'Admin clearance audited once');
 const inactive=await lead({optIn:false});await actor(staff);await eq(`select suppressed as value from public.lead_message_suppression('${inactive}') where channel='email'`,false,'New no-consent lead does not suppress others');
 const positive=await inquiry(duplicate);await owner();await eq(`select status as value from public.message_jobs where id='${positive.id}'`,'queued','Other opted-in lead eligible after deliberate clearance');
 const changed=await lead({email:'old@example.test'}),oldDuplicate=await lead({email:'OLD@example.test'}),newDuplicate=await lead({email:'new@example.test'});
 const oldJob=await inquiry(oldDuplicate),newJob=await inquiry(newDuplicate);
 await actor(staff);await db.query("update public.leads set email='new@example.test',email_opt_in=false where id=$1",[changed]);
 await eq(`select status as value from public.message_jobs where id='${oldJob.id}'`,'cancelled','Simultaneous contact change suppresses OLD recipient');
 await eq(`select status as value from public.message_jobs where id='${newJob.id}'`,'queued','Simultaneous contact change does not suppress NEW recipient');
 await configure(agency,'whatsapp',true);const wa1=await lead(),wa2=await lead();const pending=await inquiry(wa2);
 await actor(staff);await db.query('update public.leads set whatsapp_opt_in=false where id=$1',[wa1]);
 await eq(`select status as value from public.message_jobs where id='${pending.id}'`,'cancelled','WhatsApp withdrawal cancels pending approval jobs');
 await eq(`select suppressed as value from public.lead_message_suppression('${wa2}') where channel='whatsapp'`,true,'Phone suppression reaches duplicate leads');
 await actor(admin);await eq(`select public.admin_clear_lead_recipient_suppression('${wa1}','whatsapp') as value`,true,'Admin can clear phone block');
 await eq(`select whatsapp_opt_in as value from public.leads where id='${wa1}'`,false,'Clearance never restores consent');
 await configure(agency,'whatsapp');const leasedJob=await inquiry(wa2);await actor(null,'service_role');const claims=(await db.query('select * from public.claim_message_jobs(100,$1)',[agency])).rows;const leased=claims.find(row=>row.id===leasedJob.id);assert.ok(leased);checks++;
 await actor(staff);await eq(`select public.suppress_lead_recipient('${wa1}','whatsapp') as value`,true,'Explicit suppression works even when consent already false');
 await actor(null,'service_role');await eq(`select public.revalidate_message_job('${leased.id}','${leased.lease_token}') as value`,false,'Dispatch rechecks suppression after claim');
 await owner();await eq(`select status as value from public.message_jobs where id='${leased.id}'`,'skipped','Unsent lease suppressed at dispatch');
 await actor(staff);await denied(`select public.suppress_lead_recipient('${first}','sms')`,'Unsupported channel rejected');
 await db.query('update public.leads set archived_at=now() where id=$1',[first]);await denied(`select public.suppress_lead_recipient('${first}','email')`,'Archived lead context rejected');
 console.log(`Recipient suppression: ${checks} checks passed.`);
}finally{await db.close();}
