import assert from 'node:assert/strict';
import {readFile,readdir} from 'node:fs/promises';
import {createRequire} from 'node:module';
import {bootstrap,identity,agency,otherAgency,admin,queueSql} from './operating-limits-fixture.mjs';
const {PGlite}=createRequire(new URL('../../package.json',import.meta.url))('@electric-sql/pglite');
const db=new PGlite();let checks=0;
const query=async sql=>(await db.query(sql)).rows;
const eq=async(sql,expected,note)=>{assert.deepEqual((await query(sql))[0]?.value,expected,note);checks++;};
async function denied(sql,pattern){await db.exec('savepoint denial');try{await assert.rejects(db.query(sql),pattern);checks++;}finally{await db.exec('rollback to savepoint denial;release savepoint denial');}}
const claim=async(limit=100,target=agency)=>{await db.exec('set role service_role');return query(`select * from public.claim_message_jobs(${limit},'${target}')`);};
async function scenario(run){await db.exec('reset role;savepoint scenario');try{await run();}finally{await db.exec('reset role;rollback to savepoint scenario;release savepoint scenario');}}
try{
 await db.exec(bootstrap);
 const directory=new URL('../../supabase/migrations/',import.meta.url);
 for(const name of(await readdir(directory)).filter(x=>x.endsWith('.sql')).sort())await db.exec(await readFile(new URL(name,directory),'utf8'));
 await db.exec(identity);await db.exec('begin');
 await scenario(async()=>{
  await db.exec(queueSql(7));const leased=await claim();
  assert.equal(leased.length,5,'One batch cannot admit more than five leases per rolling hour');checks++;
  await db.exec('reset role');
  await eq("select count(*)::int as value from public.message_attempts",5,'Exactly five admission reservations');
  await eq("select count(*)::int as value from public.message_jobs where status='queued' and attempts=0 and lease_token is null and approved_by is not null and last_error='operating_cap_deferred' and due_at>clock_timestamp()",2,'Deferred jobs retain approval without consuming attempts or leases');
  assert.equal((await claim()).length,0,'Repeated invocations do not reset operating caps');checks++;
  await db.exec("reset role;update public.message_attempts set started_at=clock_timestamp()-interval '61 minutes';update public.message_jobs set due_at=clock_timestamp()-interval '1 second' where status='queued'");
  const next=await claim();assert.equal(next.length,2,'Next window can claim deferred jobs');checks++;
  assert.ok(next.every(j=>j.attempts===1),'First real claim remains attempt one');checks++;
 });
 await scenario(async()=>{
  await db.exec(queueSql(5));const jobs=await claim();
  for(const [index,job]of jobs.entries())await db.query('select public.finish_message_job($1,$2,$3,$4,$5)',[job.id,job.lease_token,['simulated','failed','uncertain','accepted','retry'][index],index===3?'fixture-provider-id':null,index===4?'rate_limited':null]);
  await db.exec(queueSql(1));assert.equal((await claim()).length,0,'All outcomes including simulation and uncertainty consume the same budget');checks++;
  await db.exec(queueSql(2,otherAgency));assert.equal((await claim(100,otherAgency)).length,2,'One workspace cannot consume another workspace budget');checks++;
 });
 await scenario(async()=>{
  await db.exec(queueSql(4));assert.equal((await claim()).length,4);checks++;
  await db.exec(queueSql(2,agency,'whatsapp'));assert.equal((await claim()).length,1,'Email and WhatsApp share one agency ceiling');checks++;
 });
 await scenario(async()=>{
  await db.exec(queueSql(5));await claim();
  await db.exec(queueSql(1));
  await db.exec("reset role;update public.leads set email_opt_in=false where id in(select lead_id from public.message_jobs where status='queued')");
  assert.equal((await claim()).length,0);checks++;
  await db.exec('reset role');await eq("select count(*)::int as value from public.message_jobs where status='cancelled' and last_error='recipient_suppressed'",1,'Withdrawal cancels queued work even when quota is exhausted');
 });
 await scenario(async()=>{
  await db.exec(queueSql(1));const[job]=await claim();
  await db.exec("reset role;update public.message_jobs set lease_expires_at=clock_timestamp()-interval '1 second' where status='processing'");
  await claim();await db.exec('reset role');
  await eq(`select status as value from public.message_jobs where id='${job.id}'`,'uncertain','Expired lease is reconciled, never blindly resent');
  await eq('select count(*)::int as value from public.message_attempts',1,'Uncertain lease retains its quota charge');
 });
 // Deterministic Manila boundary and legacy-over-cap history use the internal,
 // ungranted calculation with fixed test time; production supplies its own clock.
 await scenario(async()=>{
  await db.exec(queueSql(25));
  await db.exec(`insert into public.message_attempts(job_id,attempt_number,lease_token,started_at,outcome)
  select id,1,gen_random_uuid(),timestamptz '2026-11-02 08:00:00Z','simulated' from public.message_jobs limit 20`);
  await eq(`select private.message_claim_resume_at('${agency}',timestamptz '2026-11-02 15:59:00Z')=timestamptz '2026-11-02 16:00:01Z' as value`,true,'Daily cap resets at Manila midnight, not UTC midnight');
  await eq(`select private.message_claim_resume_at('${agency}',timestamptz '2026-11-02 16:00:01Z') is null as value`,true,'Prior Manila day stops consuming current day capacity');
  await db.exec("update public.message_attempts set started_at=timestamptz '2026-11-02 15:30:00Z'");
  await eq(`select private.message_claim_resume_at('${agency}',timestamptz '2026-11-02 15:59:00Z')=timestamptz '2026-11-02 16:30:01Z' as value`,true,'When both caps bind, defer until the later opening');
  await db.exec('delete from public.message_attempts');
  await db.exec(`insert into public.message_attempts(job_id,attempt_number,lease_token,started_at,outcome)
  select id,1,gen_random_uuid(),timestamptz '2026-11-02 12:00:00Z'+row_number()over(order by id)*interval '1 minute','failed' from public.message_jobs limit 8`);
  await eq(`select private.message_claim_resume_at('${agency}',timestamptz '2026-11-02 12:30:00Z')=timestamptz '2026-11-02 13:04:01Z' as value`,true,'Legacy over-cap history waits for enough reservations to expire');
 });
 await scenario(async()=>{
  await db.exec(queueSql(1));await db.exec('savepoint admission');await claim();
  await db.exec('reset role;rollback to savepoint admission;release savepoint admission');
  await eq('select count(*)::int as value from public.message_attempts',0,'Rollback removes both lease and reservation atomically');
  assert.equal((await claim()).length,1);checks++;
 });
 for(const role of ['anon','authenticated','service_role']){
  await db.exec(`reset role;set role ${role}`);
  await denied(`select private.message_claim_resume_at('${agency}',clock_timestamp())`);
  if(role==='authenticated')await eq('select count(*)::int as value from public.message_attempts',0,'No JWT means no scoped attempt visibility');else await denied('select * from public.message_attempts');
  if(role!=='service_role'){await denied(`select * from public.claim_message_jobs(5,'${agency}')`);}
 }
 await db.exec(`reset role;select set_config('request.jwt.claim.sub','${admin}',false);set role authenticated`);
 await eq('select count(*)::int as value from public.message_attempts',0,'Existing authenticated staff visibility remains scoped');
 await db.exec('reset role;rollback');
 for(const isolation of ['repeatable read','serializable']){
  await db.exec(`begin isolation level ${isolation};set role service_role`);
  await assert.rejects(db.query(`select * from public.claim_message_jobs(1,'${agency}')`),/READ COMMITTED/);checks++;
  await db.exec('rollback;reset role');
 }
 console.log(`Operating caps: ${checks} embedded PostgreSQL assertions passed. Fictional local data only.`);
}catch(error){console.error(error.message);process.exitCode=1;}finally{await db.close();}
