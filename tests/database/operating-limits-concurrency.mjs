import assert from 'node:assert/strict';
import {spawn} from 'node:child_process';
import {readFile,readdir} from 'node:fs/promises';
import {randomUUID} from 'node:crypto';
import {bootstrap,identity,agency,queueSql} from './operating-limits-fixture.mjs';
if(process.env.AGENCYDESK_ALLOW_LOCAL_DOCKER_TEST!=='1')throw new Error('Opt in with AGENCYDESK_ALLOW_LOCAL_DOCKER_TEST=1. Disposable AgencyDesk PostgreSQL only.');
const image='postgres:17@sha256:31ba9c94a03ada9988f2bb493a22a75eef3a185884533e5cdbcd498ea835b08f';
const name=`agencydesk-outbox-caps-${randomUUID()}`;
const cwd=new URL('../../',import.meta.url);let checks=0,mayExist=false;
function docker(args,input=''){
 return new Promise((resolve,reject)=>{
  const child=spawn('docker',args,{cwd,windowsHide:true,stdio:['pipe','pipe','pipe']});let output='',errors='';
  const timer=setTimeout(()=>{child.kill();reject(new Error('Temporary PostgreSQL command timed out'));},60000);
  child.stdout.on('data',chunk=>output+=chunk);child.stderr.on('data',chunk=>errors+=chunk);
  child.on('error',error=>{clearTimeout(timer);reject(error);});
  child.on('close',code=>{clearTimeout(timer);if(code===0)resolve(output.trim());else reject(new Error(`Temporary PostgreSQL command failed (${code}): ${errors.slice(0,700)}`));});
  child.stdin.on('error',()=>{});child.stdin.end(input);
 });
}
const sql=text=>docker(['exec','-i',name,'psql','--host','127.0.0.1','-X','-qAt','-v','ON_ERROR_STOP=1','-U','postgres','-d','postgres'],text);
async function parallel(){
 const gate=spawn('docker',['exec','-i',name,'psql','--host','127.0.0.1','-X','-qAt','-v','ON_ERROR_STOP=1','-U','postgres','-d','postgres'],{cwd,windowsHide:true,stdio:['pipe','pipe','pipe']});
 let output='',pending;
 const closed=new Promise(resolve=>gate.on('close',resolve));
 const ready=new Promise((resolve,reject)=>{
  const timer=setTimeout(()=>reject(new Error('Admission control lock timeout')),10000);
  gate.stdout.on('data',chunk=>{output+=chunk;if(output.includes('gate-ready')){clearTimeout(timer);resolve();}});
  gate.on('error',error=>{clearTimeout(timer);reject(error);});
  gate.on('close',()=>{clearTimeout(timer);reject(new Error('Control connection closed before readiness'));});
 });
 gate.stderr.resume();gate.stdin.on('error',()=>{});
 try{
  gate.stdin.write(`begin;select pg_advisory_xact_lock(hashtextextended('message-claim:${agency}',0));select 'gate-ready';\n`);
  await ready;
  pending=Promise.all(Array.from({length:8},()=>sql(`set application_name='agencydesk-outbox-admission';set role service_role;select pg_backend_pid()::text||'|'||(select count(*) from public.claim_message_jobs(1,'${agency}'))::text;`)));
  let waiting=0;
  for(let i=0;i<40;i++){
   waiting=Number(await sql("select count(*) from pg_stat_activity where application_name='agencydesk-outbox-admission' and wait_event_type='Lock' and wait_event='advisory';"));
   if(waiting===8)break;await new Promise(resolve=>setTimeout(resolve,100));
  }
  assert.equal(waiting,8,'Eight real callers must block on the agency admission lock');checks++;
  gate.stdin.end('commit;\n');await closed;
  const rows=await pending;
  assert.equal(new Set(rows.map(row=>row.split('|')[0])).size,8,'Eight separate real PostgreSQL connections');checks++;
  return rows.reduce((total,row)=>total+Number(row.split('|')[1]),0);
 }finally{
  if(!gate.stdin.destroyed)gate.stdin.end('rollback;\n');
  await closed;if(pending)await pending.catch(()=>{});
 }
}
try{
 mayExist=true;
 await docker(['run','--detach','--rm','--network','none','--name',name,'--memory','512m','--cpus','1','--pids-limit','128','--env','POSTGRES_HOST_AUTH_METHOD=trust','--tmpfs','/var/lib/postgresql/data:rw,size=268435456',image]);
 // The official image's temporary init server accepts Unix sockets only.
 // Internal loopback TCP waits for the final server; no host port is exposed.
 let ready=false;
 for(let i=0;i<40;i++){try{await docker(['exec',name,'pg_isready','--host','127.0.0.1','-U','postgres','-d','postgres']);ready=true;break;}catch{await new Promise(resolve=>setTimeout(resolve,250));}}
 assert.ok(ready);checks++;
 const inspection=JSON.parse(await docker(['inspect','--format','{{json .HostConfig}}',name]));
 assert.equal(inspection.NetworkMode,'none');assert.equal(Object.keys(inspection.PortBindings??{}).length,0);assert.equal((inspection.Binds??[]).length,0);checks+=3;
 await sql(bootstrap);
 const directory=new URL('../../supabase/migrations/',import.meta.url);let migration='';
 for(const file of(await readdir(directory)).filter(f=>f.endsWith('.sql')).sort()){
  const content=await readFile(new URL(file,directory),'utf8');await sql(content);
  if(file.endsWith('_message_claim_operating_caps.sql'))migration=content;
 }
 await sql(identity+queueSql(8));
 assert.equal(await parallel(),5,'Concurrent invocations admit exactly five leases');checks++;
 assert.equal(await sql('select count(*) from public.message_attempts;'),'5');checks++;
 assert.equal(await sql("select count(*) from public.message_jobs where status='queued' and attempts=0 and due_at>clock_timestamp();"),'3');checks++;
 // Four prior charges leave exactly one admission under contention, independent
 // of local/UTC time of day. Daily/Manila arithmetic is tested separately.
 await sql(`update public.message_jobs set status='cancelled',lease_token=null,lease_expires_at=null;delete from public.message_attempts;
 insert into public.message_attempts(job_id,attempt_number,lease_token,started_at,outcome)
 select id,1,gen_random_uuid(),clock_timestamp(),'uncertain' from public.message_jobs order by id limit 4;
 ${queueSql(8)}`);
 assert.equal(await parallel(),1,'Concurrent callers share one remaining operating slot');checks++;
 assert.equal(await sql('select count(*) from public.message_attempts;'),'5');checks++;
 // Negative control changes only this throwaway DB, never migration source.
 await sql(`delete from public.message_attempts;update public.message_jobs set status='cancelled',lease_token=null,lease_expires_at=null;${queueSql(8)}`);
 const lock="perform pg_advisory_xact_lock(hashtextextended('message-claim:'||p_agency_id::text,0));";
 const definition=migration.match(/create or replace function private\.claim_message_jobs[\s\S]*?end \$\$;/)?.[0];
 assert.ok(definition?.includes(lock),'Exact production admission lock found');checks++;
 await sql(definition.replace(lock,'perform 1;'));
 await assert.rejects(parallel(),/Eight real callers must block/);checks++;
 console.log(`Operating-cap concurrency: ${checks} assertions passed; two barrier-observed batches of eight real PostgreSQL connections; removed-lock negative control refused. No network, host ports, host binds or hosted credentials.`);
}finally{
 if(mayExist){
  const exists=await docker(['ps','--all','--quiet','--filter',`name=^/${name}$`]);
  if(exists)await docker(['stop','--time','5',name]);
  assert.equal(await docker(['ps','--all','--quiet','--filter',`name=^/${name}$`]),'','Exact test container cleanup verified');
 }
}
