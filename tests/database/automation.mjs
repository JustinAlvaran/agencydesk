import assert from 'node:assert/strict';
import { readFile, readdir } from 'node:fs/promises';
import { createRequire } from 'node:module';
const { PGlite } = createRequire(new URL('../../package.json', import.meta.url))('@electric-sql/pglite');
// In-memory real PostgreSQL; no hosted credentials, external requests, or provider sends.
const db = new PGlite();
let assertions = 0;
const id = n => `00000000-0000-4000-8000-${String(n).padStart(12, '0')}`;
const agency='a0000000-0000-4000-8000-000000000001';
const admin=id(1), staff=id(2), client=id(3), company=id(4), inactive=id(5);
let sequence=100;
async function actor(uid=null, role='authenticated') {
  await db.exec(`reset role; select set_config('request.jwt.claim.sub','${uid??''}',false); set role ${role};`);
}
async function owner() { await db.exec('reset role'); }
async function eq(sql, expected, message) {
  const result=await db.query(sql);
  assert.deepEqual(result.rows[0]?.value,expected,message); assertions++;
}
async function denied(sql, message) {
  await assert.rejects(db.query(sql),undefined,message); assertions++;
}
async function get(sql) { return (await db.query(sql)).rows; }
try {
  await db.exec(`create role anon; create role authenticated; create role service_role bypassrls;
    create schema auth; create table auth.users(id uuid primary key,email text);
    create function auth.uid() returns uuid language sql stable as $$ select nullif(current_setting('request.jwt.claim.sub',true),'')::uuid $$;
    grant usage on schema auth,public to anon,authenticated,service_role;
    grant execute on function auth.uid() to anon,authenticated,service_role;`);
  // Hosted Supabase may grant new tables/functions through default privileges.
  await db.exec('create schema private; alter default privileges in schema public grant all on tables to service_role; alter default privileges in schema private grant all on tables to service_role; alter default privileges grant execute on functions to service_role;');
  const directory=new URL('../../supabase/migrations/',import.meta.url);
  for (const name of (await readdir(directory)).filter(x=>x.endsWith('.sql')).sort()) {
    try { await db.exec(await readFile(new URL(name,directory),'utf8')); }
    catch (error) { throw new Error(`Migration ${name}: ${error.message}`, {cause:error}); }
  }
  await db.exec(`insert into auth.users values ('${admin}','admin@example.test'),('${staff}','staff@example.test'),('${client}','client@example.test'),('${inactive}','inactive@example.test');
    insert into public.staff_members(user_id,role,active) values('${admin}','admin',true),('${staff}','staff',true),('${inactive}','staff',false);
    insert into public.companies(id,name) values('${company}','Fictional Client');
    insert into public.client_memberships(user_id,company_id,active,can_accept_proposals) values('${client}','${company}',true,true);`);
  const rules=Object.fromEntries((await get('select id,template_key from public.automation_rules')).map(r=>[r.template_key,r.id]));
  async function configure(key, approval=true, channel='email', delay=0, enabled=true) {
    await actor(admin);
    await db.query('select public.configure_automation_rule($1,$2,$3,$4,$5)',[rules[key],enabled,delay,approval,channel]);
  }
  async function clear() {
    await owner();
    await db.exec("update public.message_jobs set status='cancelled',lease_token=null,lease_expires_at=null where status in ('queued','pending_approval','processing')");
  }
  async function inquiry({emailConsent=true, whatsappConsent=false, phone=null, status='new', archived=false, approval=false, channel='email'}={}) {
    await clear();
    await configure('inquiry_acknowledgment',approval,channel);
    await owner();
    const lead=id(sequence++),event=id(sequence++);
    await db.query(`insert into public.leads(id,contact_name,email,service,brief,email_opt_in,whatsapp_opt_in,phone,status,archived_at)
      values($1,'Fictional Lead','client@example.test','Web app','Fictional test brief',$2,$3,$4,$5,$6)`,[lead,emailConsent,whatsappConsent,phone,status,archived?new Date():null]);
    await db.query("insert into public.activity_events(id,lead_id,event_type) values($1,$2,'inquiry_received')",[event,lead]);
    const [job]=await get(`select * from public.message_jobs where event_id='${event}'`);
    return {lead,event,job};
  }
  async function claim(limit=20) {
    await actor(null,'service_role');
    return (await db.query('select * from public.claim_message_jobs($1,$2)',[limit,agency])).rows;
  }
  async function finish(job,outcome,provider=null,error=null,retry=null) {
    await actor(null,'service_role');
    return (await db.query('select public.finish_message_job($1,$2,$3,$4,$5,$6) as value',[job.id,job.lease_token,outcome,provider,error,retry])).rows[0].value;
  }
  await eq('select count(*)::integer as value from public.automation_rules where enabled',0,'All rules start disabled');
  await actor(null,'service_role');
  await eq('select count(*)::integer as value from public.automation_rules',4,'Worker can read template identities');
  await denied('update public.automation_rules set enabled=true','Worker cannot mutate rules directly');
  await denied('select * from public.message_jobs','Worker uses scoped RPC for message jobs');
  await denied('select * from public.message_attempts','Worker cannot directly read attempt histories');
  await denied("select * from private.provider_event_inbox",'Worker inbox operations remain scoped RPC');
  await denied('select * from private.lead_call_actions','Worker cannot inspect staff call idempotency ledger');
  await denied('select * from private.manual_lead_actions','Worker cannot inspect manual intake ledger');
  await denied(`select public.configure_automation_rule('${rules.inquiry_acknowledgment}',true,0,true,'email')`,'Worker cannot configure rules even under permissive default privileges');
  await actor(null,'anon');
  await denied('select * from public.automation_rules','Anon cannot inspect rules');
  await denied('select * from public.message_jobs','Anon cannot inspect outbox');
  await denied('select public.claim_message_jobs()','Anon cannot claim');
  await actor(client);
  for (const table of ['automation_rules','message_jobs','message_attempts']) await eq(`select count(*)::integer as value from public.${table}`,0,`Clients cannot read ${table}`);
  await denied('select * from private.provider_event_inbox','Provider inbox is private');
  await denied('select public.claim_message_jobs()','Clients cannot claim');
  await denied(`select public.configure_automation_rule('${rules.inquiry_acknowledgment}',true,0,true,'email')`,'Client cannot configure');
  await denied(`select public.approve_message_job('${id(999)}')`,'Client cannot approve');
  await denied(`select public.cancel_message_job('${id(999)}')`,'Client cannot cancel');
  await actor(staff);
  await eq('select count(*)::integer as value from public.automation_rules',4,'Active staff can view rules');
  await denied(`update public.automation_rules set enabled=true`,'Staff cannot bypass rule RPC');
  await denied(`select public.configure_automation_rule('${rules.inquiry_acknowledgment}',true,0,true,'email')`,'Only admin configures');
  await denied('select public.claim_message_jobs()','Staff cannot claim');
  await denied(`select public.finish_message_job('${id(999)}','${id(998)}','simulated')`,'Staff cannot finish');
  await denied(`select public.revalidate_message_job('${id(999)}','${id(998)}')`,'Staff cannot revalidate worker lease');
  await denied("select public.record_message_receipt('resend','x','y','delivered')",'Staff cannot forge receipts');
  await actor(inactive);
  await eq('select count(*)::integer as value from public.automation_rules',0,'Inactive staff blocked live');
  await denied(`select public.approve_message_job('${id(999)}')`,'Inactive staff cannot approve');
  await actor(admin);
  await denied(`select public.configure_automation_rule('${rules.inquiry_acknowledgment}',true,-1,true,'email')`,'Negative rule delay denied');
  await denied(`select public.configure_automation_rule('${rules.inquiry_acknowledgment}',true,0,true,'sms')`,'Unsupported rule channel denied');
  await denied(`select public.configure_automation_rule('${id(999)}',true,0,true,'email')`,'Unknown rule denied');
  let scenario=await inquiry({approval:true});
  await owner();
  await eq(`select status as value from public.message_jobs where id='${scenario.job.id}'`,'pending_approval','Draft requires approval');
  assert.equal((await claim()).length,0); assertions++;
  await actor(staff);
  await denied(`update public.message_jobs set status='queued' where id='${scenario.job.id}'`,'Staff cannot rewrite outbox directly');
  await eq(`select public.approve_message_job('${scenario.job.id}') as value`,true,'Staff approves eligible draft');
  await eq(`select public.approve_message_job('${scenario.job.id}') as value`,false,'Approval idempotent');
  await eq(`select approved_by as value from public.message_jobs where id='${scenario.job.id}'`,staff,'Approval attribution');
  let [leased]=await claim();
  assert.equal(leased.attempts,1); assert.ok(leased.lease_token); assertions+=2;
  await eq(`select public.revalidate_message_job('${leased.id}','${leased.lease_token}') as value`,true,'Eligible lease revalidates');
  assert.equal((await claim()).length,0,'Another claim cannot own leased job'); assertions++;
  await eq(`select public.finish_message_job('${leased.id}','${id(999)}','simulated') as value`,false,'Wrong owner cannot finish');
  assert.equal(await finish(leased,'simulated'),true); assertions++;
  assert.equal(await finish(leased,'simulated'),false); assertions++;
  await owner();
  await eq(`select status as value from public.message_jobs where id='${leased.id}'`,'simulated','Dry-run has distinct terminal status');
  await eq(`select outcome as value from public.message_attempts where job_id='${leased.id}'`,'simulated','Attempt records simulation');
  await eq(`select provider_message_id is null as value from public.message_jobs where id='${leased.id}'`,true,'Dry run is not a provider send');

  // Transactional event capture rolls back with its CRM transaction.
  await configure('inquiry_acknowledgment',false);
  await owner();
  const rollbackEvent=id(sequence++);
  await db.exec(`begin; insert into public.activity_events(id,lead_id,event_type) values('${rollbackEvent}','${scenario.lead}','inquiry_received'); rollback;`);
  await eq(`select count(*)::integer as value from public.message_jobs where event_id='${rollbackEvent}'`,0,'Rollback removes outbox and activity atomically');
  await denied(`insert into public.message_jobs(rule_id,event_id,lead_id,channel,recipient,subject,body,status,due_at)
    select rule_id,event_id,lead_id,channel,recipient,subject,body,status,due_at from public.message_jobs where id='${scenario.job.id}'`,'Event/rule/channel uniqueness prevents duplicate job');

  for (const [options,reason] of [[{emailConsent:false},'email_consent_missing'],[{status:'lost'},'lead_closed'],[{archived:true},'lead_archived'],[{channel:'whatsapp'},'whatsapp_consent_missing'],[{channel:'whatsapp',whatsappConsent:true},'phone_missing']]) {
    scenario=await inquiry(options);
    assert.equal(scenario.job.status,'skipped'); assert.equal(scenario.job.last_error,reason); assertions+=2;
    assert.equal((await claim()).length,0); assertions++;
  }
  scenario=await inquiry({channel:'whatsapp',whatsappConsent:true,phone:'+639171234567'});
  assert.equal(scenario.job.recipient,'+639171234567'); assertions++;
  [leased]=await claim();
  assert.equal(await finish(leased,'simulated'),true); assertions++;
  await owner();
  await denied(`update public.leads set phone='09171234567' where id='${scenario.lead}'`,'Phone must be E164');
  await denied(`update public.leads set source='' where id='${scenario.lead}'`,'Empty source denied');
  scenario=await inquiry();
  await db.exec(`update public.leads set email='changed@example.test' where id='${scenario.lead}'`);
  assert.equal((await claim()).length,0); assertions++;
  await owner();
  await eq(`select last_error as value from public.message_jobs where id='${scenario.job.id}'`,'recipient_changed','Stale recipient cannot be dispatched');
  for (const [change,reason] of [["status='lost'",'lead_closed'],["archived_at=now()",'lead_archived'],["email_opt_in=false",'email_consent_missing']]) {
    scenario=await inquiry();
    await db.exec(`update public.leads set ${change} where id='${scenario.lead}'`);
    assert.equal((await claim()).length,0,'Queue rechecks changed lead eligibility'); assertions++;
    await owner();
    await eq(`select last_error as value from public.message_jobs where id='${scenario.job.id}'`,reason,'Dispatch skip explanation reflects latest CRM state');
  }
  scenario=await inquiry({approval:true});
  await db.exec(`update public.leads set email_opt_in=false where id='${scenario.lead}'`);
  await actor(staff);
  await eq(`select public.approve_message_job('${scenario.job.id}') as value`,false,'Approval rechecks consent');
  await eq(`select status as value from public.message_jobs where id='${scenario.job.id}'`,'skipped','Rejected approval records skip');
  scenario=await inquiry();
  [leased]=await claim();
  await owner();
  await db.exec(`update public.leads set email_opt_in=false where id='${scenario.lead}'`);
  await actor(null,'service_role');
  await eq(`select public.revalidate_message_job('${leased.id}','${leased.lease_token}') as value`,false,'Pre-send guard rechecks consent after claim');
  await owner();
  await eq(`select status as value from public.message_jobs where id='${leased.id}'`,'skipped','Pre-send guard releases lease as skipped');
  scenario=await inquiry();
  await configure('inquiry_acknowledgment',false,'email',0,false);
  assert.equal((await claim()).length,0); assertions++;
  await owner();
  await eq(`select last_error as value from public.message_jobs where id='${scenario.job.id}'`,'rule_disabled','Disabled rule suppresses pending work');
  scenario=await inquiry();
  await configure('inquiry_acknowledgment',false,'whatsapp');
  assert.equal((await claim()).length,0); assertions++;
  await owner();
  await eq(`select last_error as value from public.message_jobs where id='${scenario.job.id}'`,'rule_channel_changed','Changed channel invalidates old snapshot');
  scenario=await inquiry();
  await configure('inquiry_acknowledgment',true);
  assert.equal((await claim()).length,0,'Changing approval mode cannot send previously automatic job'); assertions++;
  await owner();
  await eq(`select last_error as value from public.message_jobs where id='${scenario.job.id}'`,'approval_required','New approval requirement fails closed');
  scenario=await inquiry();
  await actor(staff);
  await eq(`select public.cancel_message_job('${scenario.job.id}') as value`,true,'Staff cancels queued job');
  await eq(`select public.cancel_message_job('${scenario.job.id}') as value`,false,'Cancellation idempotent');
  assert.equal((await claim()).length,0); assertions++;

  // Delays, expired leases, and bounded retries.
  scenario=await inquiry();
  await db.exec(`update public.message_jobs set due_at=now()+interval '1 hour' where id='${scenario.job.id}'`);
  assert.equal((await claim()).length,0); assertions++;
  await owner(); await db.exec(`update public.message_jobs set due_at=now()-interval '1 second' where id='${scenario.job.id}'`);
  [leased]=await claim();
  await owner(); await db.exec(`update public.message_jobs set lease_expires_at=now()-interval '1 second' where id='${leased.id}'`);
  assert.equal(await finish(leased,'accepted','fictional-provider'),false,'Expired lease cannot commit stale outcome'); assertions++;
  assert.equal((await claim()).length,0,'Expired lease is never blindly sent again'); assertions++;
  await owner();
  await eq(`select status as value from public.message_jobs where id='${leased.id}'`,'uncertain','Expired lease needs reconciliation');
  await eq(`select outcome as value from public.message_attempts where job_id='${leased.id}'`,'uncertain','Attempt records uncertain crash');
  scenario=await inquiry();
  for (let attempt=1;attempt<=5;attempt++) {
    [leased]=await claim();
    assert.equal(leased.attempts,attempt); assertions++;
    assert.equal(await finish(leased,'retry',null,'rate_limited',attempt===1?600:null),true); assertions++;
    await owner();
    if (attempt<5) {
      await eq(`select status as value from public.message_jobs where id='${leased.id}'`,'queued','Transient rejection queues retry');
      await eq(`select due_at >= now()+make_interval(secs=>${attempt===1?599:60*2**(attempt-1)-1}) as value from public.message_jobs where id='${leased.id}'`,true,'Exponential delay respects retry-after');
      assert.equal((await claim()).length,0,'Retry cannot run early'); assertions++;
      await owner(); await db.exec(`update public.message_jobs set due_at=now()-interval '1 second' where id='${leased.id}'`);
    }
  }
  await eq(`select status as value from public.message_jobs where id='${leased.id}'`,'failed','Retry ceiling becomes terminal failure');
  await eq(`select count(*)::integer as value from public.message_attempts where job_id='${leased.id}'`,5,'Exactly five attempts recorded');
  assert.equal((await claim()).length,0); assertions++;
  await denied(`select public.claim_message_jobs(101,'${agency}')`,'Excessive claim batch denied');
  await denied(`select public.claim_message_jobs(0,'${agency}')`,'Empty claim batch denied');

  // Published proposals require current revision, expiry and live recipient membership.
  async function proposal({expire=false}={}) {
    await clear(); await configure('proposal_notice',true); await configure('proposal_follow_up',true,'email',4320); await configure('proposal_accepted',true);
    await owner();
    const lead=id(sequence++),series=id(sequence++),revision=id(sequence++);
    await db.exec(`insert into public.leads(id,company_id,contact_name,email,service,brief,email_opt_in) values('${lead}','${company}','Fictional Client','client@example.test','Design','Fictional project brief',true);
      insert into public.proposal_series(id,lead_id,company_id,title) values('${series}','${lead}','${company}','Fictional Portal');
      insert into public.proposal_revisions(id,series_id,version,scope,expires_at) values('${revision}','${series}',1,'Fictional scope',now()+interval '${expire?'1 second':'7 days'}');
      insert into public.proposal_items(revision_id,description,quantity,unit_price_cents) values('${revision}','Original item',1,10000);`);
    await actor(staff); await db.query('select public.publish_proposal_revision($1)',[revision]);
    await owner();
    const jobs=await get(`select j.*,r.template_key from public.message_jobs j join public.automation_rules r on r.id=j.rule_id where lead_id='${lead}'`);
    return {lead,series,revision,jobs};
  }
  let p=await proposal();
  assert.equal(p.jobs.length,2); assertions++;
  assert.equal(p.jobs[0].portal_path,`/portal/proposals/${p.series}`); assertions++;
  assert.equal(p.jobs.find(j=>j.template_key==='proposal_follow_up').status,'pending_approval'); assertions++;
  await actor(staff);
  for (const j of p.jobs) await eq(`select public.approve_message_job('${j.id}') as value`,true,'Proposal preview approves eligible membership');
  const notice=p.jobs.find(j=>j.template_key==='proposal_notice');
  await owner(); await db.exec(`update public.client_memberships set active=false where user_id='${client}'`);
  assert.equal((await claim()).length,0); assertions++;
  await owner(); await eq(`select last_error as value from public.message_jobs where id='${notice.id}'`,'recipient_membership_inactive','Revoked membership prevents sensitive notice');
  await db.exec(`update public.client_memberships set active=true where user_id='${client}'`);
  p=await proposal();
  await actor(client); await db.query('select public.decline_proposal_revision($1)',[p.revision]);
  await owner(); await eq(`select count(*)::integer as value from public.message_jobs where lead_id='${p.lead}' and status='cancelled'`,2,'Decline cancels pending notice and follow-up');
  p=await proposal();
  await actor(client); await db.query('select public.accept_proposal_revision($1)',[p.revision]);
  await owner();
  await eq(`select count(*)::integer as value from public.message_jobs where lead_id='${p.lead}' and status='cancelled'`,2,'Acceptance stops outstanding proposal reminders');
  await eq(`select count(*)::integer as value from public.message_jobs where lead_id='${p.lead}' and status='pending_approval'`,1,'Accepted confirmation supports won lead');
  const [confirmation]=await get(`select * from public.message_jobs where lead_id='${p.lead}' and status='pending_approval'`);
  const [project]=await get(`select id from public.projects where lead_id='${p.lead}'`);
  assert.equal(confirmation.portal_path,`/portal/projects/${project.id}`); assertions++;
  await actor(staff); await eq(`select public.approve_message_job('${confirmation.id}') as value`,true,'Won confirmation eligible');
  [leased]=await claim(); assert.equal(leased.id,confirmation.id); assertions++;
  assert.equal(await finish(leased,'simulated'),true); assertions++;
  p=await proposal();
  await owner();
  const replacement=id(sequence++);
  await db.exec(`insert into public.proposal_revisions(id,series_id,version,scope,expires_at) values('${replacement}','${p.series}',2,'Replacement scope',now()+interval '7 days');
    insert into public.proposal_items(revision_id,description,quantity,unit_price_cents) values('${replacement}','Replacement item',1,10000);`);
  await actor(staff); await db.query('select public.publish_proposal_revision($1)',[replacement]);
  await owner();
  await eq(`select count(*)::integer as value from public.message_jobs where revision_id='${p.revision}' and status='cancelled'`,2,'Superseded revision reminders cancelled');
  await clear();
  p=await proposal();
  await owner();
  // PostgreSQL's immutable revision guard is intentionally preserved.
  await db.exec('alter table public.proposal_revisions disable trigger guard_revision');
  await db.exec(`update public.proposal_revisions set expires_at=now()-interval '1 second' where id='${p.revision}'`);
  await db.exec('alter table public.proposal_revisions enable trigger guard_revision');
  await actor(staff);
  await eq(`select public.approve_message_job('${p.jobs[0].id}') as value`,false,'Expired proposal cannot approve');
  await eq(`select last_error as value from public.message_jobs where id='${p.jobs[0].id}'`,'proposal_expired','Expiry explanation visible');

  // Receipts are deduplicated and monotonic, and never upgrade simulated messages.
  scenario=await inquiry(); [leased]=await claim();
  await denied(`select public.finish_message_job('${leased.id}','${leased.lease_token}','accepted')`,'Provider acceptance requires message id');
  await denied(`select public.finish_message_job('${leased.id}','${leased.lease_token}','failed',null,'Contains private recipient@example.test')`,'Only sanitized error codes stored');
  await denied(`select public.finish_message_job('${leased.id}','${leased.lease_token}','simulated','fake-provider')`,'Simulation cannot claim provider id');
  assert.equal(await finish(leased,'accepted','fictional-email-1'),true); assertions++;
  await eq("select public.record_message_receipt('resend','event-1','fictional-email-1','delivered') as value",true,'Authenticated receipt establishes delivery');
  await eq("select public.record_message_receipt('resend','event-1','fictional-email-1','delivered') as value",false,'Duplicate receipt ignored');
  await eq("select public.record_message_receipt('resend','event-2','fictional-email-1','failed') as value",false,'Late failure cannot downgrade delivery');
  await eq("select public.record_message_receipt('resend','event-3','fictional-email-1','read') as value",true,'Delivery can advance to read');
  await eq("select public.record_message_receipt('resend','event-4','fictional-email-1','delivered') as value",false,'Late delivery cannot downgrade read');
  await eq("select public.record_message_receipt('whatsapp','event-5','fictional-email-1','failed') as value",false,'Provider channel mismatch cannot mutate job');
  await eq("select public.record_message_receipt('resend','event-unknown','unknown-message','delivered') as value",false,'Unknown receipt retained for reconciliation');
  await owner();
  await eq("select count(*)::integer as value from private.provider_event_inbox where event_key='event-unknown' and processed_at is null",1,'Unknown inbox receipt remains unprocessed');
  await eq(`select status as value from public.message_jobs where id='${leased.id}'`,'read','Receipt state remains monotonic');
  scenario=await inquiry(); [leased]=await claim();
  await eq("select public.record_message_receipt('resend','early-receipt','fictional-email-early','delivered') as value",false,'Early receipt retained before acknowledgment commit');
  assert.equal(await finish(leased,'accepted','fictional-email-early'),true); assertions++;
  await owner();
  await eq(`select status as value from public.message_jobs where id='${leased.id}'`,'delivered','Finish reconciles early delivery receipt');
  await eq("select processed_at is not null as value from private.provider_event_inbox where event_key='early-receipt'",true,'Reconciled inbox event processed once');
  scenario=await inquiry(); [leased]=await claim();
  assert.equal(await finish(leased,'accepted','fictional-email-failure'),true); assertions++;
  await eq("select public.record_message_receipt('resend','explicit-failure','fictional-email-failure','failed') as value",true,'Accepted provider send can fail by receipt');
  await owner();
  await eq(`select status as value from public.message_jobs where id='${leased.id}'`,'failed','Failure receipt records terminal status');
  await actor(staff);
  await eq(`select count(*)::integer as value from public.message_attempts`,await (async()=>{await owner();const r=await get('select count(*)::integer as total from public.message_attempts');await actor(staff);return r[0].total;})(),'Staff can inspect attempt history');
  // Real hosted shape: another agency must not expose or mutate this outbox.
  await clear(); await owner();
  const otherAgency=id(9000), otherAdmin=id(9001), otherLead=id(9002), otherEvent=id(9003);
  await db.exec(`insert into public.agencies(id,name,slug) values('${otherAgency}','Other Fictional Agency','other-fictional-agency');
    insert into auth.users values('${otherAdmin}','other-admin@example.test');
    insert into public.staff_members(user_id,role,active,agency_id) values('${otherAdmin}','admin',true,'${otherAgency}');`);
  await eq(`select count(*)::integer as value from public.automation_rules where agency_id='${otherAgency}' and not enabled`,4,'New agency receives four disabled independent rules');
  const [otherRule]=await get(`select id from public.automation_rules where agency_id='${otherAgency}' and template_key='inquiry_acknowledgment'`);
  await actor(otherAdmin);
  await eq('select count(*)::integer as value from public.automation_rules',4,'Other agency sees only its rules');
  await denied(`select public.configure_automation_rule('${rules.inquiry_acknowledgment}',true,0,false,'email')`,'Other admin cannot reconfigure first agency rule');
  await db.query(`select public.configure_automation_rule('${otherRule.id}',true,0,true,'email')`);
  await db.query(`insert into public.leads(id,contact_name,email,service,brief,email_opt_in) values('${otherLead}','Other fictional lead','other-recipient@example.test','Website','Other fictional test brief',true)`);
  await owner(); await db.query(`insert into public.activity_events(id,lead_id,event_type) values('${otherEvent}','${otherLead}','inquiry_received')`);
  await eq(`select count(*)::integer as value from public.message_jobs where event_id='${otherEvent}'`,1,'Event captures only its own agency rule');
  const [otherJob]=await get(`select * from public.message_jobs where event_id='${otherEvent}'`);
  assert.equal(otherJob.agency_id,otherAgency); assertions++;
  await actor(admin);
  await eq(`select count(*)::integer as value from public.message_jobs where id='${otherJob.id}'`,0,'First agency cannot read other agency job');
  await eq(`select public.approve_message_job('${otherJob.id}') as value`,false,'First agency cannot approve another job by guessed id');
  await eq(`select public.cancel_message_job('${otherJob.id}') as value`,false,'First agency cannot cancel another job by guessed id');
  await actor(otherAdmin);
  await eq(`select public.approve_message_job('${otherJob.id}') as value`,true,'Owning agency staff can approve');
  await actor(null,'service_role');
  await eq(`select count(*)::integer as value from public.claim_message_jobs(5,'${agency}')`,0,'Worker batch does not claim another agency job');
  await denied('select public.claim_message_jobs(5)','Worker must explicitly choose a workspace');
  const [otherLease]=(await db.query('select * from public.claim_message_jobs($1,$2)',[5,otherAgency])).rows;
  assert.equal(otherLease.id,otherJob.id); assertions++;
  assert.equal(await finish(otherLease,'simulated'),true); assertions++;
  await actor(admin);
  await eq(`select count(*)::integer as value from public.message_attempts where job_id='${otherJob.id}'`,0,'Other agency attempt history remains private');
  await actor(otherAdmin);
  await eq(`select count(*)::integer as value from public.message_attempts where job_id='${otherJob.id}'`,1,'Owning agency reads its delivery attempt');
  await owner();
  await denied(`update public.message_jobs set agency_id='${agency}' where id='${otherJob.id}'`,'Job workspace cannot be reassigned');
  await denied(`update public.message_jobs set rule_id='${rules.inquiry_acknowledgment}' where id='${otherJob.id}'`,'Job cannot reference another agency rule');
  await denied(`update public.message_jobs set event_id='${scenario.event}' where id='${otherJob.id}'`,'Job cannot reference another agency event');
  await denied(`update public.message_attempts set agency_id='${agency}' where job_id='${otherJob.id}'`,'Attempt workspace cannot be reassigned');
  await db.query(`update public.agencies set intake_enabled=false where id='${otherAgency}'`);
  await actor(null,'service_role');
  await denied(`select public.claim_message_jobs(5,'${otherAgency}')`,'Archived workspace cannot execute sending worker');
  console.log(`Passed ${assertions} automation database assertions using embedded PostgreSQL.`);
} catch (error) {
  console.error(error.message);
  if (error.cause) console.error(error.cause.message);
  process.exitCode=1;
} finally { await db.close(); }
