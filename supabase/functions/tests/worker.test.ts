import assert from 'node:assert/strict';
type Handler = (request: Request) => Response | Promise<Response>;
let worker: Handler;
const originalServe = Deno.serve;
Deno.serve = ((handler: Handler) => { worker = handler; return {}; }) as unknown as typeof Deno.serve;
await import('../automation-worker/index.ts');
Deno.serve = originalServe;
const agencyId='a0000000-0000-4000-8000-000000000001';
const secret = 'own-test-scheduler-secret-12345678901234567890';
const job = { id:'30000000-0000-4000-8000-000000000001',rule_id:'30000000-0000-4000-8000-000000000002',channel:'email',recipient:'client@example.test',subject:'Own test message',body:'A fictional test message.',lease_token:'30000000-0000-4000-8000-000000000003',portal_path:null };
function environment() {
  for (const [name,value] of Object.entries({SUPABASE_URL:'https://agency-test.invalid',SUPABASE_SERVICE_ROLE_KEY:'test-own-service-key',AUTOMATION_CRON_SECRET:secret,AUTOMATION_AGENCY_ID:agencyId,AUTOMATION_DELIVERY_MODE:'dry_run',RESEND_API_KEY:'',AUTOMATION_FROM_EMAIL:'',WHATSAPP_ACCESS_TOKEN:'',WHATSAPP_PHONE_NUMBER_ID:'',WHATSAPP_GRAPH_VERSION:'',WHATSAPP_TEMPLATE_MAP:'{}',APP_URL:'https://agency.example.test'})) Deno.env.set(name,value);
}
function request(token=secret) { return new Request('https://agency-test.invalid/functions/v1/automation-worker',{method:'POST',headers:{'x-automation-secret':token,'Content-Type':'application/json'},body:'{}'}); }
async function usingFetch(run:()=>Promise<void>,options:{finish?:boolean;eligible?:boolean;identity?:string}={}) {
  environment(); const originalFetch=globalThis.fetch;
  const calls:string[]=[];let claims=0;
  globalThis.fetch=async(input,init)=>{
    const url=new URL(typeof input==='string'?input:input instanceof URL?input.href:input.url);calls.push(url.pathname);
    assert.equal(url.hostname,'agency-test.invalid','Tests must never contact a real sender or service');
    if(url.pathname==='/auth/v1/user')return Response.json({id:'40000000-0000-4000-8000-000000000001',email:'test@example.test'});
    if(url.pathname==='/rest/v1/staff_members')return Response.json(options.identity==='admin'?{role:'admin',active:true,agency_id:agencyId}:null);
    if(url.pathname==='/rest/v1/automation_rules')return Response.json([{id:job.rule_id,template_key:'inquiry_acknowledgment'}]);
    if(url.pathname.endsWith('/claim_message_jobs')){assert.equal(JSON.parse(String(init?.body)).p_limit,1);assert.equal(JSON.parse(String(init?.body)).p_agency_id,agencyId);return Response.json(claims++===0?[job]:[]);}
    if(url.pathname.endsWith('/revalidate_message_job'))return Response.json(options.eligible??true);
    if(url.pathname.endsWith('/finish_message_job')){const payload=JSON.parse(String(init?.body));assert.equal(payload.p_outcome,'simulated');assert.equal(payload.p_provider_message_id,null);return Response.json(options.finish??true);}
    throw new Error('Unexpected test request');
  };
  try{await run();}finally{globalThis.fetch=originalFetch;}
  return calls;
}
Deno.test('worker rejects unauthenticated requests before database calls',async()=>{
  const calls=await usingFetch(async()=>{assert.equal((await worker(request('wrong-secret'))).status,401);});assert.equal(calls.length,0);
});
Deno.test('worker rejects authenticated clients without active admin membership',async()=>{
  const calls=await usingFetch(async()=>{const input=new Request('https://agency-test.invalid/worker',{method:'POST',headers:{Authorization:'Bearer own-test-user-session'},body:'{}'});assert.equal((await worker(input)).status,403);});assert.deepEqual(calls,['/auth/v1/user','/rest/v1/staff_members']);
});
Deno.test('worker records simulation and never contacts a provider',async()=>{
  const calls=await usingFetch(async()=>{const response=await worker(request());assert.equal(response.status,200);assert.deepEqual(await response.json(),{mode:'dry_run',processed:{simulated:1},claimed:1});});assert.ok(calls.every(path=>path.startsWith('/rest/v1/')));
});
Deno.test('active administrator can invoke the worker with their verified session',async()=>{
  await usingFetch(async()=>{const input=new Request('https://agency-test.invalid/worker',{method:'POST',headers:{Authorization:'Bearer own-test-admin-session'},body:'{}'});const response=await worker(input);assert.equal(response.status,200);assert.equal((await response.json()).processed.simulated,1);},{identity:'admin'});
});
Deno.test('worker honors last-moment eligibility and never completes a skipped job',async()=>{
  const calls=await usingFetch(async()=>{const response=await worker(request());assert.equal(response.status,200);assert.deepEqual((await response.json()).processed,{skipped:1});},{eligible:false});assert.ok(!calls.some(path=>path.endsWith('/finish_message_job')));
});
Deno.test('worker reports a lost lease instead of claiming a successful result',async()=>{
  await usingFetch(async()=>{const response=await worker(request());assert.equal(response.status,503);const result=await response.json();assert.deepEqual(result.processed,{});assert.match(result.error,/could not be recorded/);},{finish:false});
});
Deno.test('worker ignores caller attempts to change dry-run mode or recipients',async()=>{
  await usingFetch(async()=>{const input=new Request('https://agency-test.invalid/worker',{method:'POST',headers:{'x-automation-secret':secret},body:JSON.stringify({mode:'live',recipient:'changed@example.test'})});const response=await worker(input);assert.equal((await response.json()).mode,'dry_run');});
});
