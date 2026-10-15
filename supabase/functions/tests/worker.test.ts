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
Deno.test('worker never lends the linked WAHA sender to another agency',async()=>{
 environment();Deno.env.set('AUTOMATION_DELIVERY_MODE','live');
 Deno.env.set('WAHA_AGENCY_ID','b0000000-0000-4000-8000-000000000002');
 Deno.env.set('WAHA_API_URL','https://own-waha.invalid');Deno.env.set('WAHA_API_KEY','own-fictional-waha-key-12345678901234567890');Deno.env.set('WAHA_SESSION','default');
 const original=fetch;let claims=0;let completed=false;
 globalThis.fetch=async(input,init)=>{
   const url=new URL(String(input));assert.equal(url.hostname,'agency-test.invalid','A mismatched agency must never reach WAHA');
   if(url.pathname.endsWith('/automation_rules'))return Response.json([{id:job.rule_id,template_key:'inquiry_acknowledgment'}]);
   if(url.pathname.endsWith('/claim_message_jobs'))return Response.json(claims++===0?[{...job,channel:'whatsapp',provider:'waha',recipient:'+639123456789'}]:[]);
   if(url.pathname.endsWith('/revalidate_message_job'))return Response.json(true);
   if(url.pathname.endsWith('/finish_message_job')){const data=JSON.parse(String(init?.body));assert.equal(data.p_outcome,'failed');assert.equal(data.p_error_code,'waha_not_configured');completed=true;return Response.json(true);}
   throw new Error('Unexpected request');
 };
 try{assert.equal((await worker(request())).status,200);assert.equal(completed,true);}finally{globalThis.fetch=original;Deno.env.delete('WAHA_API_KEY');Deno.env.delete('WAHA_AGENCY_ID');environment();}
});

for (const binding of ['missing', 'different', 'own'] as const) {
  Deno.test(`worker Gmail credentials require the own agency binding (${binding})`, async () => {
    const names = ['GMAIL_AGENCY_ID', 'GMAIL_CLIENT_ID', 'GMAIL_CLIENT_SECRET', 'GMAIL_REFRESH_TOKEN', 'GMAIL_FROM_EMAIL', 'EMAIL_PROVIDER'];
    const previous = new Map(names.map(name => [name, Deno.env.get(name)]));
    environment();
    Deno.env.set('AUTOMATION_DELIVERY_MODE', 'live');
    // Frozen Gmail jobs must select Gmail even when the legacy global default is Resend.
    Deno.env.set('EMAIL_PROVIDER', 'resend');
    Deno.env.set('GMAIL_CLIENT_ID', 'fictional-own-google-client');
    Deno.env.set('GMAIL_CLIENT_SECRET', 'fictional-own-google-secret');
    Deno.env.set('GMAIL_REFRESH_TOKEN', 'fictional-own-google-refresh');
    Deno.env.set('GMAIL_FROM_EMAIL', 'owner@example.test');
    if (binding === 'missing') Deno.env.delete('GMAIL_AGENCY_ID');
    else Deno.env.set('GMAIL_AGENCY_ID', binding === 'own' ? agencyId : 'b0000000-0000-4000-8000-000000000002');
    const original = globalThis.fetch;
    let claims = 0, tokenCalls = 0, sendCalls = 0, completed = false;
    globalThis.fetch = async (input, init) => {
      const url = new URL(typeof input === 'string' ? input : input instanceof URL ? input.href : input.url);
      if (url.hostname === 'oauth2.googleapis.com') {
        assert.equal(binding, 'own', 'Other or missing agency binding must never refresh a Google token');
        assert.equal(url.pathname, '/token');
        assert.equal(new URLSearchParams(String(init?.body)).get('client_secret'), 'fictional-own-google-secret');
        tokenCalls++;
        return Response.json({ access_token: 'fictional-own-access-token', token_type: 'Bearer' });
      }
      if (url.hostname === 'gmail.googleapis.com') {
        assert.equal(binding, 'own', 'Other or missing agency binding must never send through Google');
        assert.equal(url.pathname, '/gmail/v1/users/me/messages/send');
        assert.equal(new Headers(init?.headers).get('Authorization'), 'Bearer fictional-own-access-token');
        sendCalls++;
        return Response.json({ id: 'fictional_message_123' });
      }
      assert.equal(url.hostname, 'agency-test.invalid', 'Only mocked Supabase and Google endpoints are permitted');
      if (url.pathname.endsWith('/automation_rules')) return Response.json([{ id: job.rule_id, template_key: 'inquiry_acknowledgment' }]);
      if (url.pathname.endsWith('/claim_message_jobs')) {
        assert.equal(JSON.parse(String(init?.body)).p_agency_id, agencyId);
        return Response.json(claims++ === 0 ? [{ ...job, provider: 'gmail' }] : []);
      }
      if (url.pathname.endsWith('/revalidate_message_job')) return Response.json(true);
      if (url.pathname.endsWith('/finish_message_job')) {
        const data = JSON.parse(String(init?.body));
        assert.equal(data.p_outcome, binding === 'own' ? 'accepted' : 'failed');
        assert.equal(data.p_error_code, binding === 'own' ? null : 'gmail_not_configured');
        assert.equal(data.p_provider_message_id, binding === 'own' ? 'fictional_message_123' : null);
        completed = true;
        return Response.json(true);
      }
      throw new Error('Unexpected test request');
    };
    try {
      const response = await worker(request());
      assert.equal(response.status, 200);
      assert.deepEqual((await response.json()).processed, binding === 'own' ? { accepted: 1 } : { failed: 1 });
      assert.equal(completed, true);
      assert.equal(tokenCalls, binding === 'own' ? 1 : 0);
      assert.equal(sendCalls, binding === 'own' ? 1 : 0);
    } finally {
      globalThis.fetch = original;
      for (const [name, value] of previous) { if (value === undefined) Deno.env.delete(name); else Deno.env.set(name, value); }
      environment();
    }
  });
}
