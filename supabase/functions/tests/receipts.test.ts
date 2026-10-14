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
