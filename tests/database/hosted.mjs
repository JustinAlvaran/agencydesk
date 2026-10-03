import assert from 'node:assert/strict';
import { readFile,writeFile,mkdir } from 'node:fs/promises';
import { createClient } from '@supabase/supabase-js';

const local = await readFile('.env.local','utf8');
const env = Object.fromEntries(local.split(/\r?\n/).filter(line=>line.includes('=')&&!line.startsWith('#')).map(line=>{const i=line.indexOf('=');return [line.slice(0,i),line.slice(i+1).replace(/^"|"$/g,'')];}));
const accounts=JSON.parse(await readFile('.local/accounts.json','utf8'));
const clients={};let count=0;
for(const account of accounts){const client=createClient(env.NEXT_PUBLIC_SUPABASE_URL,env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY,{auth:{persistSession:false,autoRefreshToken:false}});const {error}=await client.auth.signInWithPassword(account);assert.equal(error,null,`${account.role} authenticates`);clients[account.role]=client;count++;}
const {admin,clientA,clientB}=clients;
const revision_id='25000000-0000-4000-8000-000000000001';
const lead_id='22000000-0000-4000-8000-000000000001';
const {data:before,error:readError}=await admin.from('proposal_revisions').select('status').eq('id',revision_id).single();assert.equal(readError,null);count++;
if(before.status==='draft'){const {error}=await admin.rpc('publish_proposal_revision',{revision_id});assert.equal(error,null,'Staff publishes frozen proposal');count++;}
const denied=await clientB.rpc('accept_proposal_revision',{revision_id});assert.ok(denied.error,'Another company cannot accept');count++;
const accepts=await Promise.all([clientA.rpc('accept_proposal_revision',{revision_id}),clientA.rpc('accept_proposal_revision',{revision_id})]);
for(const result of accepts)assert.equal(result.error,null,'Concurrent acceptance succeeds idempotently');
assert.equal(accepts[0].data,accepts[1].data,'Two concurrent HTTP requests return one project');count++;
const project_id=accepts[0].data;
const {data:projects,error:projectsError}=await admin.from('projects').select('id').eq('lead_id',lead_id);assert.equal(projectsError,null);assert.equal(projects.length,1);count++;
const {data:lead}=await admin.from('leads').select('status').eq('id',lead_id).single();assert.equal(lead.status,'won');count++;
const {data:events}=await admin.from('activity_events').select('id').eq('project_id',project_id).eq('event_type','proposal_accepted');assert.equal(events.length,1);count++;
const otherProjects=await clientB.from('projects').select('id').eq('id',project_id);assert.equal(otherProjects.error,null);assert.equal(otherProjects.data.length,0);count++;
const internal=await clientA.from('leads').select('id');assert.ok(internal.error||internal.data.length===0);count++;
const change=await clientA.from('proposal_revisions').update({scope:'Tampered'}).eq('id',revision_id).select();assert.ok(change.error||change.data.length===0);count++;
const {error:immutable}=await admin.from('proposal_revisions').update({scope:'Tampered'}).eq('id',revision_id);assert.ok(immutable);count++;
const a=accounts.find(a=>a.role==='clientA');
const {error:revoke}=await admin.from('client_memberships').update({active:false}).eq('user_id',a.id);assert.equal(revoke,null);
try{const removed=await clientA.from('projects').select('id');assert.equal(removed.error,null);assert.equal(removed.data.length,0);count++;const blocked=await clientA.rpc('accept_proposal_revision',{revision_id});assert.ok(blocked.error);count++;}
finally{await admin.from('client_memberships').update({active:true}).eq('user_id',a.id);}
const updates=await admin.from('project_updates').select('id').eq('project_id',project_id).limit(1);
let update_id=updates.data?.[0]?.id;
if(!update_id){const saved=await admin.from('project_updates').insert({project_id,body:'Discovery is complete. The initial portal flows are ready for your feedback.'}).select('id').single();assert.equal(saved.error,null);update_id=saved.data.id;await admin.from('milestones').insert([{project_id,title:'Discovery & scope',status:'completed',position:0},{project_id,title:'Interface design',status:'in_progress',position:1},{project_id,title:'Build & quality review',status:'pending',position:2}]);}
const spoof=await clientA.from('comments').insert({update_id,author_id:accounts[0].id,body:'Spoofed author'});assert.ok(spoof.error);count++;
const unknown=await clientB.from('comments').insert({update_id,author_id:accounts[2].id,body:'Cross company comment'});assert.ok(unknown.error);count++;
await mkdir('artifacts',{recursive:true});await writeFile('artifacts/hosted-verification.json',JSON.stringify({checks:count,project_id,concurrent_requests:2,same_project:true,verified_at:new Date().toISOString()},null,2));
console.log(`${count} hosted Auth / Data API / RPC checks passed. Two concurrent accepts produced exactly one project and event.`);
for(const client of Object.values(clients))await client.auth.signOut();
