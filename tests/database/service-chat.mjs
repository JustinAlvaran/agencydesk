import assert from 'node:assert/strict';
import {readFile,readdir} from 'node:fs/promises';
import {createRequire} from 'node:module';
const {PGlite}=createRequire(new URL('../../package.json',import.meta.url))('@electric-sql/pglite');
const db=new PGlite();let checks=0;
try{
  await db.exec(`create role anon; create role authenticated; create role service_role bypassrls;
    create schema auth; create table auth.users(id uuid primary key,email text);
    create function auth.uid() returns uuid language sql stable as $$ select nullif(current_setting('request.jwt.claim.sub',true),'')::uuid $$;
    grant usage on schema auth,public to anon,authenticated,service_role; grant execute on function auth.uid() to anon,authenticated,service_role;`);
  const directory=new URL('../../supabase/migrations/',import.meta.url);
  for(const file of (await readdir(directory)).filter(f=>f.endsWith('.sql')).sort())await db.exec(await readFile(new URL(file,directory),'utf8'));
  const agency='a0000000-0000-4000-8000-000000000001';
  const reserve=(session='a'.repeat(64),network='b'.repeat(64))=>db.query('select public.reserve_service_chat($1,$2,$3,$4) as allowed',['agencydesk',crypto.randomUUID(),session,network]).then(r=>r.rows[0].allowed);
  for(const role of ['anon','authenticated']){
    await db.exec(`set role ${role}`);await assert.rejects(reserve());checks++;
    await assert.rejects(db.query('select * from private.service_chat_requests'));checks++;
    await assert.rejects(db.query('select public.cleanup_service_chat()'));checks++;await db.exec('reset role');
  }
  await db.query('update public.agencies set intake_enabled=false where id=$1',[agency]);
  await db.exec('set role service_role');assert.equal(await reserve(),true,'AI admission is independent from inquiry intake');checks++;
  assert.equal(await reserve(),false,'One active model request per signed session');checks++;
  await db.exec("update private.service_chat_requests set finished_at=clock_timestamp(),outcome='answered'");
  for(let i=1;i<10;i++){assert.equal(await reserve(),true);await db.exec("update private.service_chat_requests set finished_at=clock_timestamp() where finished_at is null");checks++;}
  assert.equal(await reserve(),false,'Session turn quota enforced');checks++;
  await db.exec('delete from private.service_chat_requests');
  for(let i=0;i<4;i++){assert.equal(await reserve(i.toString(16).padStart(64,'0')),true);checks++;}
  assert.equal(await reserve('f'.repeat(64)),false,'Global in-flight ceiling enforced');checks++;
  await db.exec('delete from private.service_chat_requests');
  for(let i=0;i<100;i++){
    assert.equal(await reserve(i.toString(16).padStart(64,'0'),i.toString(16).padStart(64,'1')),true);
    await db.exec("update private.service_chat_requests set finished_at=clock_timestamp() where finished_at is null");checks++;
  }
  assert.equal(await reserve(),false,'Agency daily quota cannot be bypassed with new cookies/networks');checks++;
  await db.exec("update private.service_chat_requests set created_at=clock_timestamp()-interval '49 hours'");
  assert.equal(Number((await db.query('select public.cleanup_service_chat() as count')).rows[0].count),100);checks++;
  assert.equal(await reserve(),true,'Cleanup frees old quota without resetting current attempts');checks++;
  const other='a0000000-0000-4000-8000-000000000002';
  await db.exec('reset role');await db.query("insert into public.agencies(id,name,slug) values($1,'Isolated quota test agency','other-agency')",[other]);await db.exec('set role service_role');
  const requestId=(await db.query('select id from private.service_chat_requests where agency_id=$1',[agency])).rows[0].id;
  assert.equal((await db.query('select public.reserve_service_chat($1,$2,$3,$4) as allowed',['agencydesk',requestId,'a'.repeat(64),'b'.repeat(64)])).rows[0].allowed,false,'Replayed reservation cannot spend again');checks++;
  assert.equal((await db.query('select public.reserve_service_chat($1,$2,$3,$4) as allowed',['other-agency',crypto.randomUUID(),'a'.repeat(64),'b'.repeat(64)])).rows[0].allowed,true,'Same hashes are isolated between agencies');checks++;
  assert.equal(Number((await db.query('select count(*) from private.service_chat_requests where agency_id=$1',[other])).rows[0].count),1);checks++;
  await db.exec('delete from private.service_chat_requests');
  for(let i=0;i<20;i++){
    assert.equal(await reserve(i.toString(16).padStart(64,'0')),true);checks++;
    await db.exec("update private.service_chat_requests set finished_at=clock_timestamp() where finished_at is null");
  }
  assert.equal(await reserve('f'.repeat(64)),false,'Fresh sessions cannot bypass the network hourly cap');checks++;
  console.log(`Service chat: ${checks} assertions passed (embedded PostgreSQL; not multi-session concurrency proof).`);
}finally{await db.close();}
