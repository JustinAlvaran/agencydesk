import assert from 'node:assert/strict';
type Handler=(request:Request)=>Response|Promise<Response>;
let handler:Handler;const serve=Deno.serve;
Deno.serve=((h:Handler)=>{handler=h;return {};}) as unknown as typeof Deno.serve;
await import('../service-chat/index.ts');Deno.serve=serve;
Deno.test('service chat rejects direct public and forged relay requests before privileged calls',async()=>{
  Deno.env.set('SERVICE_CHAT_RELAY_KEY','fictional-relay-secret'.repeat(3));Deno.env.set('SERVICE_CHAT_ENABLED','true');
  const original=globalThis.fetch;let calls=0;globalThis.fetch=async()=>{calls++;throw new Error('Unexpected network');};
  try{for(const headers of [new Headers(),new Headers({'x-agency-chat-relay':'forged'})]){
    const response=await handler(new Request('https://example.test',{method:'POST',headers,body:'{}'}));assert.equal(response.status,401);
  }assert.equal(calls,0);}finally{globalThis.fetch=original;}
});
Deno.test('service chat rejects missing identity and disabled mode before provider calls',async()=>{
  const secret='fictional-relay-secret'.repeat(3);Deno.env.set('SERVICE_CHAT_RELAY_KEY',secret);
  Deno.env.set('SERVICE_CHAT_ENABLED','false');assert.equal((await handler(new Request('https://example.test',{method:'POST',headers:{'x-agency-chat-relay':secret},body:'{}'}))).status,503);
  Deno.env.set('SERVICE_CHAT_ENABLED','true');assert.equal((await handler(new Request('https://example.test',{method:'POST',headers:{'x-agency-chat-relay':secret},body:'{}'}))).status,400);
});

const ownRelay='fictional-relay-secret'.repeat(3);
function ownRequest(){return new Request('https://example.test',{method:'POST',headers:{'x-agency-chat-relay':ownRelay,'x-agency-chat-session':'a'.repeat(64),'x-agency-chat-network':'b'.repeat(64)},body:JSON.stringify({question:'Can you build a website?'})});}
function ownConfig(){
  Deno.env.set('SERVICE_CHAT_RELAY_KEY',ownRelay);Deno.env.set('SERVICE_CHAT_ENABLED','true');
  Deno.env.set('SUPABASE_URL','https://database.example.test');Deno.env.set('SUPABASE_SERVICE_ROLE_KEY','fictional-service-key');
  Deno.env.set('SERVICE_CHAT_CF_ACCOUNT_ID','a'.repeat(32));Deno.env.set('SERVICE_CHAT_CF_API_TOKEN','k'.repeat(32));Deno.env.set('SERVICE_CHAT_CF_MODEL','@cf/qwen/qwen3-30b-a3b-fp8');Deno.env.set('AGENCY_SLUG','agencydesk');
}
Deno.test('valid relay with missing database config returns safe503, not an unhandled error',async()=>{
  ownConfig();Deno.env.delete('SUPABASE_URL');Deno.env.delete('SUPABASE_SERVICE_ROLE_KEY');
  const response=await handler(ownRequest());assert.equal(response.status,503);assert.equal(response.headers.get('cache-control'),'private, no-store');
});
Deno.test('admission denial and failed completion never return a successful model answer',async()=>{
  ownConfig();const original=globalThis.fetch;
  try{
    for(const failure of ['quota','finish']){
      let providerCalls=0;
      globalThis.fetch=async(input)=>{
        const url=String(input);
        if(url.includes('/rpc/reserve_service_chat'))return Response.json(failure!=='quota');
        if(url.includes('/rpc/finish_service_chat'))return new Response('private diagnostic',{status:503});
        if(url.startsWith('https://api.cloudflare.com/')){providerCalls++;return Response.json({choices:[{finish_reason:'stop',message:{content:JSON.stringify({answer:'Prepare an inquiry for staff review.',service_id:null})}}]});}
        throw new Error('Unexpected network');
      };
      const response=await handler(ownRequest());assert.equal(response.status,failure==='quota'?429:503);assert.equal(providerCalls,failure==='quota'?0:1);assert.ok(!(await response.text()).includes('private diagnostic'));
    }
  }finally{globalThis.fetch=original;}
});
Deno.test('valid relay admits one model call and records completion without CRM data',async()=>{
  ownConfig();const original=globalThis.fetch;let providers=0,finishes=0;
  globalThis.fetch=async(input)=>{
    const url=String(input);
    if(url.includes('/rpc/reserve_service_chat'))return Response.json(true);
    if(url.includes('/rpc/finish_service_chat')){finishes++;return Response.json(null);}
    if(url.startsWith('https://api.cloudflare.com/')){providers++;return Response.json({choices:[{finish_reason:'stop',message:{content:JSON.stringify({answer:'Prepare an inquiry for staff review.',service_id:null})}}]});}
    throw new Error('Unexpected network');
  };
  try{const response=await handler(ownRequest());assert.equal(response.status,200);assert.equal(providers,1);assert.equal(finishes,1);assert.deepEqual(await response.json(),{answer:'Prepare an inquiry for staff review.',service_id:null});}finally{globalThis.fetch=original;}
});
