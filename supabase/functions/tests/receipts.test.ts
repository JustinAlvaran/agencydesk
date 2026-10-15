import assert from 'node:assert/strict';
type Handler=(request:Request)=>Response|Promise<Response>;
let receipts:Handler;
const serve=Deno.serve;
Deno.serve=((handler:Handler)=>{receipts=handler;return{};}) as unknown as typeof Deno.serve;
await import('../message-receipts/index.ts');
Deno.serve=serve;
const key='own-test-meta-app-secret-1234567890';
async function signedRequest(body:string){const imported=await crypto.subtle.importKey('raw',new TextEncoder().encode(key),{name:'HMAC',hash:'SHA-256'},false,['sign']);const signature=new Uint8Array(await crypto.subtle.sign('HMAC',imported,new TextEncoder().encode(body)));return new Request('https://agency-test.invalid/receipts?provider=whatsapp',{method:'POST',headers:{'x-hub-signature-256':'sha256='+Array.from(signature,value=>value.toString(16).padStart(2,'0')).join('')},body});}
function environment(){Deno.env.set('SUPABASE_URL','https://agency-test.invalid');Deno.env.set('SUPABASE_SERVICE_ROLE_KEY','own-test-service-key');Deno.env.set('WHATSAPP_APP_SECRET',key);Deno.env.set('WHATSAPP_WEBHOOK_VERIFY_TOKEN','own-test-verify-secret-12345678901234567890');}
Deno.test('receipt endpoint rejects unsigned bodies without a database call',async()=>{
 environment();const original=fetch;let called=false;globalThis.fetch=async()=>{called=true;throw new Error('No database call allowed');};
 try{const request=new Request('https://agency-test.invalid/receipts?provider=whatsapp',{method:'POST',body:'{}'});assert.equal((await receipts(request)).status,401);assert.equal(called,false);}finally{globalThis.fetch=original;}
});
Deno.test('receipt endpoint processes the whole signed batch in one database transaction',async()=>{
 environment();const original=fetch;let calls=0;globalThis.fetch=async(input,init)=>{calls++;assert.match(String(input),/^https:\/\/agency-test\.invalid\/rest\/v1\/rpc\/record_message_receipts$/);const payload=JSON.parse(String(init?.body));assert.equal(payload.p_receipts.length,101);assert.deepEqual(Object.keys(payload.p_receipts[0]).sort(),['event_id','message_id','provider','status']);return Response.json(101);};
 const statuses=Array.from({length:101},(_,i)=>({id:`wamid.${i}`,status:'delivered',timestamp:'1',recipient_id:'do-not-persist'}));const body=JSON.stringify({object:'whatsapp_business_account',entry:[{changes:[{value:{statuses}}]}]});
 try{assert.equal((await receipts(await signedRequest(body))).status,200);assert.equal(calls,1);}finally{globalThis.fetch=original;}
});
Deno.test('receipt storage failure asks the provider to retry instead of acknowledging loss',async()=>{
 environment();const original=fetch;globalThis.fetch=async()=>Response.json({message:'test storage unavailable',code:'TEST'},{status:503});
 const body=JSON.stringify({object:'whatsapp_business_account',entry:[{changes:[{value:{statuses:[{id:'wamid.1',status:'delivered',timestamp:'1'}]}}]}]});
 try{assert.equal((await receipts(await signedRequest(body))).status,503);}finally{globalThis.fetch=original;}
});
Deno.test('Meta handshake requires the own verification secret',async()=>{
 environment();const secret=Deno.env.get('WHATSAPP_WEBHOOK_VERIFY_TOKEN')!;
 const good=new Request(`https://agency-test.invalid/receipts?provider=whatsapp&hub.mode=subscribe&hub.challenge=123&hub.verify_token=${secret}`);
 assert.equal(await (await receipts(good)).text(),'123');
 const bad=new Request('https://agency-test.invalid/receipts?provider=whatsapp&hub.mode=subscribe&hub.challenge=123&hub.verify_token=wrong');
 assert.equal((await receipts(bad)).status,403);
});

const wahaSecret='own-test-waha-webhook-secret-1234567890';
const wahaEvent={id:'evt_01aaaaaaaaaaaaaaaaaaaaaaaa',event:'message.ack',timestamp:Date.now(),session:'default',me:{id:'639171234567@c.us'},payload:{id:'true_639181234567@c.us_ABC123',fromMe:true,ack:2,_data:{body:'never persist personal chats'}}};
function wahaEnvironment(){environment();Deno.env.set('WAHA_WEBHOOK_SECRET',wahaSecret);Deno.env.set('WAHA_SESSION','default');Deno.env.set('WAHA_SENDER_ID','639171234567@c.us');}
async function wahaRequest(value:unknown,secret=wahaSecret){const body=typeof value==='string'?value:JSON.stringify(value);const imported=await crypto.subtle.importKey('raw',new TextEncoder().encode(secret),{name:'HMAC',hash:'SHA-512'},false,['sign']);const signature=new Uint8Array(await crypto.subtle.sign('HMAC',imported,new TextEncoder().encode(body)));return new Request('https://agency-test.invalid/receipts?provider=waha',{method:'POST',headers:{'x-webhook-hmac':Array.from(signature,value=>value.toString(16).padStart(2,'0')).join(''),'x-webhook-hmac-algorithm':'sha512'},body});}
Deno.test('WAHA receipts reject unsigned, wrong signatures, altered body, wrong session/sender without database access',async()=>{
 wahaEnvironment();const original=fetch;let calls=0;globalThis.fetch=async()=>{calls++;throw new Error('No database access allowed');};
 try{
  assert.equal((await receipts(new Request('https://agency-test.invalid/receipts?provider=waha',{method:'POST',body:JSON.stringify(wahaEvent)}))).status,401);
  assert.equal((await receipts(await wahaRequest(wahaEvent,'another-own-private-webhook-secret-1234567890'))).status,401);
  const signed=await wahaRequest(wahaEvent);assert.equal((await receipts(new Request(signed.url,{method:'POST',headers:signed.headers,body:JSON.stringify({...wahaEvent,session:'spoofed'})}))).status,401);
  for(const value of [{...wahaEvent,session:'spoofed'},{...wahaEvent,me:{id:'639191234567@c.us'}},{...wahaEvent,payload:{...wahaEvent.payload,fromMe:false}},{...wahaEvent,timestamp:Date.now()-86400001}])assert.equal((await receipts(await wahaRequest(value))).status,400);
  assert.equal(calls,0);
 }finally{globalThis.fetch=original;}
});
Deno.test('WAHA missing scope or webhook secret fails closed without database access',async()=>{
 wahaEnvironment();const original=fetch;let calls=0;globalThis.fetch=async()=>{calls++;throw new Error('No database access allowed');};
 try{for(const name of ['WAHA_WEBHOOK_SECRET','WAHA_SESSION','WAHA_SENDER_ID']){const saved=Deno.env.get(name)!;Deno.env.delete(name);try{assert.equal((await receipts(await wahaRequest(wahaEvent))).status,503);}finally{Deno.env.set(name,saved);}}assert.equal(calls,0);}finally{globalThis.fetch=original;}
});
Deno.test('WAHA receipts forward only sanitized ACKs and preserve duplicate event IDs for database deduplication',async()=>{
 wahaEnvironment();const original=fetch;let calls=0;globalThis.fetch=async(input,init)=>{calls++;assert.match(String(input),/\/rpc\/record_message_receipts$/);assert.deepEqual(JSON.parse(String(init?.body)),{p_receipts:[{provider:'waha',event_id:wahaEvent.id,message_id:wahaEvent.payload.id,status:'delivered'}]});return Response.json(1);};
 try{assert.equal((await receipts(await wahaRequest(wahaEvent))).status,200);assert.equal((await receipts(await wahaRequest(wahaEvent))).status,200);assert.equal(calls,2);}finally{globalThis.fetch=original;}
});
Deno.test('WAHA incoming chat events and pending/server ACKs are ignored without a database call',async()=>{
 wahaEnvironment();const original=fetch;let calls=0;globalThis.fetch=async()=>{calls++;throw new Error('No database access allowed');};
 try{for(const value of [{...wahaEvent,event:'message'},{...wahaEvent,payload:{...wahaEvent.payload,ack:0}},{...wahaEvent,payload:{...wahaEvent.payload,ack:1}}])assert.equal((await receipts(await wahaRequest(value))).status,200);assert.equal(calls,0);}finally{globalThis.fetch=original;}
});
Deno.test('WAHA receipt storage errors remain retryable',async()=>{
 wahaEnvironment();const original=fetch;globalThis.fetch=async()=>Response.json({code:'TEST',message:'unavailable'},{status:503});
 try{assert.equal((await receipts(await wahaRequest(wahaEvent))).status,503);}finally{globalThis.fetch=original;}
});
Deno.test('WAHA receipts bound body size with and without content-length before database access',async()=>{
 wahaEnvironment();const original=fetch;let calls=0;globalThis.fetch=async()=>{calls++;throw new Error('No database access allowed');};
 try{assert.equal((await receipts(await wahaRequest('x'.repeat(262145)))).status,413);const request=await wahaRequest(wahaEvent);request.headers.set('content-length','262145');assert.equal((await receipts(request)).status,413);assert.equal(calls,0);}finally{globalThis.fetch=original;}
});
