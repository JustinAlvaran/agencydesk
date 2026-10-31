import assert from 'node:assert/strict';
import {spawn} from 'node:child_process';
import {readFile} from 'node:fs/promises';
import {randomUUID} from 'node:crypto';
const image='postgres:17@sha256:31ba9c94a03ada9988f2bb493a22a75eef3a185884533e5cdbcd498ea835b08f';
const name=`agencydesk-chat-quota-test-${process.pid}`;
const agency='10000000-0000-4000-8000-000000000001';
const cwd=new URL('../../',import.meta.url);
if(process.env.AGENCYDESK_ALLOW_LOCAL_DOCKER_TEST!=='1')throw new Error('Opt in with AGENCYDESK_ALLOW_LOCAL_DOCKER_TEST=1. This starts only an isolated temporary AgencyDesk PostgreSQL container.');
function docker(args,input=''){
  return new Promise((resolve,reject)=>{
    const child=spawn('docker',args,{cwd,windowsHide:true,stdio:['pipe','pipe','pipe']});let output='',errors='';
    const timeout=setTimeout(()=>{child.kill();reject(new Error('Local Docker test operation timed out'));},60000);
    child.stdout.on('data',chunk=>output+=chunk);child.stderr.on('data',chunk=>errors+=chunk);
    child.on('error',error=>{clearTimeout(timeout);reject(error);});
    child.on('close',code=>{clearTimeout(timeout);if(code===0)resolve(output.trim());else reject(new Error(`Local Docker operation failed (${code}): ${errors.slice(0,800)}`));});
    child.stdin.end(input);
  });
}
const sql=text=>docker(['exec','-i',name,'psql','-X','-qAt','-v','ON_ERROR_STOP=1','-U','postgres','-d','postgres'],text);
let started=false,checks=0;
try{
  await docker(['run','--detach','--rm','--network','none','--name',name,'--memory','512m','--cpus','1','--pids-limit','128','--env','POSTGRES_HOST_AUTH_METHOD=trust','--tmpfs','/var/lib/postgresql/data:rw,size=268435456',image]);started=true;
  let ready=false;
  for(let i=0;i<40;i++){try{await docker(['exec',name,'pg_isready','-U','postgres']);ready=true;break;}catch{await new Promise(resolve=>setTimeout(resolve,250));}}
  assert.ok(ready,'Temporary PostgreSQL ready');checks++;
  const inspection=JSON.parse(await docker(['inspect','--format','{{json .HostConfig}}',name]));
  assert.equal(inspection.NetworkMode,'none');assert.equal(Object.keys(inspection.PortBindings??{}).length,0);assert.equal((inspection.Binds??[]).length,0);checks+=3;
  await sql(`create role anon;create role authenticated;create role service_role bypassrls;create schema private;
    create table public.agencies(id uuid primary key,slug text unique not null);
    insert into public.agencies values('${agency}','agencydesk');
    grant usage on schema public,private to service_role;grant select on public.agencies to service_role;`);
  const migration=await readFile(new URL('../../supabase/migrations/20261015111403_service_chat_quotas.sql',import.meta.url),'utf8');
  await sql(migration);
  for(const role of ['anon','authenticated']){
    await assert.rejects(sql(`set role ${role};select public.reserve_service_chat('agencydesk','${randomUUID()}','${'a'.repeat(64)}','${'b'.repeat(64)}');`));checks++;
  }
  async function parallel(sameSession=false){
    const gate=spawn('docker',['exec','-i',name,'psql','-X','-qAt','-v','ON_ERROR_STOP=1','-U','postgres','-d','postgres'],{cwd,windowsHide:true,stdio:['pipe','pipe','pipe']});
    let output='';
    const ready=new Promise((resolve,reject)=>{
      const timer=setTimeout(()=>reject(new Error('Control lock timeout')),10000);
      gate.stdout.on('data',chunk=>{output+=chunk;if(output.includes('gate-ready')){clearTimeout(timer);resolve();}});
      gate.on('error',error=>{clearTimeout(timer);reject(error);});
      gate.on('close',()=>{clearTimeout(timer);reject(new Error('Control connection ended before readiness'));});
    });
    const closed=new Promise(resolve=>gate.on('close',resolve));
    gate.stderr.resume();
    let pending;
    try{
      gate.stdin.write(`begin;select pg_advisory_xact_lock(hashtextextended('service-chat:${agency}',0));select 'gate-ready';\n`);
      await ready;
      pending=Promise.all(Array.from({length:8},(_,i)=>sql(`set application_name='agencydesk-chat-admission';set role service_role;select pg_backend_pid()::text||'|'||public.reserve_service_chat('agencydesk','${randomUUID()}','${sameSession?'a'.repeat(64):(i+1).toString(16).padStart(64,'0')}','${(i+101).toString(16).padStart(64,'0')}')::text;`)));
      let waiting=0;
      for(let i=0;i<40;i++){
        waiting=Number(await sql("select count(*) from pg_stat_activity where application_name='agencydesk-chat-admission' and wait_event_type='Lock' and wait_event='advisory';"));
        if(waiting===8)break;
        await new Promise(resolve=>setTimeout(resolve,100));
      }
      assert.equal(waiting,8,'Eight callers blocked on the agency lock before release');checks++;
      gate.stdin.end('commit;\n');await closed;
      const rows=await pending;
      assert.equal(new Set(rows.map(row=>row.split('|')[0])).size,8,'Eight real PostgreSQL connections');checks++;
      return rows.filter(row=>row.endsWith('|true')).length;
    }finally{
      if(!gate.stdin.destroyed)gate.stdin.end('rollback;\n');
      await closed;
      if(pending)await pending.catch(()=>{});
    }
  }
  assert.equal(await parallel(true),1,'Concurrent same-session admission allows one');checks++;
  await sql('delete from private.service_chat_requests;');
  assert.equal(await parallel(false),4,'Concurrent agency in-flight admission allows four');checks++;
  await sql(`delete from private.service_chat_requests;
    insert into private.service_chat_requests(id,agency_id,session_hash,network_hash,finished_at,outcome)
    select gen_random_uuid(),'${agency}',lpad(to_hex(n+1000),64,'a'),lpad(to_hex(n+2000),64,'b'),clock_timestamp(),'answered' from generate_series(1,99)n;`);
  assert.equal(await parallel(false),1,'Concurrent admission cannot pass the agency daily ceiling');checks++;
  assert.equal(await sql('select count(*) from private.service_chat_requests;'),'100','Exactly100 attempts persisted');checks++;
  // Negative control modifies only this throwaway database, never the source migration.
  await sql('delete from private.service_chat_requests;');
  const reserveDefinition=migration.match(/create function public\.reserve_service_chat[\s\S]*?end \$\$;/)?.[0];
  assert.ok(reserveDefinition);
  const lock="perform pg_advisory_xact_lock(hashtextextended('service-chat:'||target::text,0));";
  assert.ok(reserveDefinition.includes(lock));
  await sql(reserveDefinition.replace('create function','create or replace function').replace(lock,'perform 1;'));
  await assert.rejects(parallel(false),/Eight callers blocked/);checks++;
  console.log(`Service-chat concurrency: ${checks} assertions passed; three barrier-observed batches of eight real PostgreSQL connections; removed-lock negative control refused. Network none, no host port/mount, no hosted credentials or application/customer records.`);
}finally{if(started)await docker(['stop','--time','5',name]);}
