import { describe, expect, it, vi } from 'vitest';
import { deliverMessage, renderDeliveryBody, secretMatches, type DeliveryJob } from '../../supabase/functions/_shared/delivery';
import { verifyMeta, verifyResend, parseReceipts } from '../../supabase/functions/_shared/receipts';
const job: DeliveryJob = { id:'30000000-0000-4000-8000-000000000001',channel:'email',recipient:'recipient@example.test',subject:'Your proposal',body:'Please review your proposal.',template_key:'proposal_notice' };
const config = { mode:'live',resendKey:'test-own-key',fromEmail:'Agency <hello@example.test>' };
const asFetch = (implementation: (...args: Parameters<typeof fetch>) => ReturnType<typeof fetch>) => vi.fn(implementation) as unknown as typeof fetch;

describe('message delivery boundaries', () => {
  it('defaults to simulation even with credentials and never calls the provider', async () => {
    const request = vi.fn();
    expect(await deliverMessage(job,{...config,mode:undefined},request)).toEqual({outcome:'simulated'});
    expect(request).not.toHaveBeenCalled();
  });
  it('fails closed for a misspelled mode or missing credentials', async () => {
    const request=vi.fn();
    expect(await deliverMessage(job,{...config,mode:'LIVE'},request)).toMatchObject({outcome:'failed'});
    expect(await deliverMessage(job,{mode:'live'},request)).toMatchObject({errorCode:'email_not_configured'});
    expect(request).not.toHaveBeenCalled();
  });
  it('uses a stable Resend idempotency key and acknowledges without claiming delivery', async () => {
    const request=asFetch(async (_url, init) => {expect(new Headers(init?.headers).get('idempotency-key')).toBe(`agencydesk/message/${job.id}`);expect(JSON.parse(String(init?.body))).toMatchObject({to:[job.recipient],text:job.body});return Response.json({id:'provider-123'});});
    expect(await deliverMessage(job,config,request)).toEqual({outcome:'accepted',providerMessageId:'provider-123'});
  });
  it('classifies explicit rate limiting as retry with provider pacing', async () => {
    const request=asFetch(async()=>new Response('',{status:429,headers:{'Retry-After':'90'}}));
    expect(await deliverMessage(job,config,request)).toMatchObject({outcome:'retry',retryAfterSeconds:90});
  });
  it('honors a longer provider floor and pauses beyond the supported retry horizon',async()=>{
    expect(await deliverMessage(job,config,asFetch(async()=>new Response('',{status:429,headers:{'Retry-After':'7200'}})))).toMatchObject({outcome:'retry',retryAfterSeconds:7200});
    expect(await deliverMessage(job,config,asFetch(async()=>new Response('',{status:429,headers:{'Retry-After':'172800'}})))).toMatchObject({outcome:'uncertain',errorCode:'provider_retry_window_exceeded'});
  });
  it('does not blindly retry a timeout, server error or missing acknowledgment', async () => {
    expect(await deliverMessage(job,config,asFetch(async()=>{throw new Error('test-key must not be returned');}))).toEqual({outcome:'uncertain',errorCode:'network_result_unknown'});
    expect(await deliverMessage(job,config,asFetch(async()=>new Response('',{status:503})))).toMatchObject({outcome:'uncertain'});
    expect(await deliverMessage(job,config,asFetch(async()=>Response.json({success:true})))).toMatchObject({outcome:'uncertain'});
  });
  it('does not expose provider diagnostics or follow redirects', async () => {
    const request=asFetch(async(_url,init)=>{expect(init?.redirect).toBe('error');return new Response('credential or contact data',{status:401});});
    expect(await deliverMessage(job,config,request)).toEqual({outcome:'failed',errorCode:'provider_authentication_failed'});
  });
  it('builds an approved Meta template from own mapping, never arbitrary free text', async () => {
    const request=asFetch(async(url,init)=>{expect(String(url)).toBe('https://graph.facebook.com/v26.0/12345678/messages');const body=JSON.parse(String(init?.body));expect(body.type).toBe('template');expect(body.template.name).toBe('own_proposal_notice');expect(body.template.components[0].parameters[0].text).toBe(job.body);return Response.json({messages:[{id:'wamid.123'}]});});
    const ownMeta={mode:'live',whatsappToken:'own-test-token',whatsappPhoneId:'12345678',graphVersion:'v26.0',templateMap:JSON.stringify({proposal_notice:{name:'own_proposal_notice',language:'en',body_parameters:['body']}})};
    expect(await deliverMessage({...job,channel:'whatsapp',recipient:'+639171234567'},ownMeta,request)).toMatchObject({outcome:'accepted'});
    expect(await deliverMessage({...job,channel:'whatsapp',recipient:'+639171234567'},{...ownMeta,templateMap:'{}'},request)).toMatchObject({errorCode:'whatsapp_template_not_configured'});
  });
  const zokoJob = { ...job, channel:'whatsapp', recipient:'+639171234567' };
  const ownZoko = { mode:'live', whatsappProvider:'zoko', zokoKey:'own-zoko-test-key', zokoTemplateMap:JSON.stringify({proposal_notice:{name:'own_proposal_notice',language:'en',body_parameters:['subject','body']}}) };
  const zokoId = '3fa85f64-5717-4562-b3fc-2c963f66afa6';
  it('uses the documented Zoko template API and only its own provider credentials',async()=>{
    const request=asFetch(async(url,init)=>{
      expect(String(url)).toBe('https://chat.zoko.io/v2/message');
      const headers=new Headers(init?.headers);expect(headers.get('apikey')).toBe(ownZoko.zokoKey);expect(headers.has('authorization')).toBe(false);
      expect(init?.redirect).toBe('error');
      expect(JSON.parse(String(init?.body))).toEqual({channel:'whatsapp',recipient:'639171234567',type:'template',templateId:'own_proposal_notice',templateLanguage:'en',templateArgs:[job.subject,job.body]});
      return Response.json({status:'202',statusText:'Accepted',messageId:zokoId});
    });
    expect(await deliverMessage(zokoJob,{...ownZoko,whatsappToken:'other-provider-token'},request)).toEqual({outcome:'accepted',providerMessageId:zokoId});
  });
  it('keeps Zoko dry-run mode free of network calls even with configured credentials',async()=>{
    const request=vi.fn();
    expect(await deliverMessage(zokoJob,{...ownZoko,mode:undefined},request)).toEqual({outcome:'simulated'});
    expect(await deliverMessage(zokoJob,{...ownZoko,mode:'dry_run'},request)).toEqual({outcome:'simulated'});
    expect(request).not.toHaveBeenCalled();
  });
  it('fails closed for unknown WhatsApp providers, missing Zoko keys or unusable mappings',async()=>{
    const request=vi.fn();
    expect(await deliverMessage(zokoJob,{...ownZoko,whatsappProvider:'unknown'},request)).toMatchObject({errorCode:'unsupported_whatsapp_provider'});
    expect(await deliverMessage(zokoJob,{...ownZoko,zokoKey:undefined,whatsappToken:'meta-key'},request)).toMatchObject({errorCode:'whatsapp_not_configured'});
    for (const map of ['{}','invalid',JSON.stringify({proposal_notice:{name:123,language:'en',body_parameters:['body']}}),JSON.stringify({proposal_notice:{name:'own_notice',language:'en',body_parameters:['other']}})]) {
      expect(await deliverMessage(zokoJob,{...ownZoko,zokoTemplateMap:map},request)).toMatchObject({errorCode:'whatsapp_template_not_configured'});
    }
    expect(request).not.toHaveBeenCalled();
  });
  it('does not accept a Zoko message acknowledgment without its UUID and successful body status',async()=>{
    for (const response of [{status:'202'},{status:'202',messageId:'not-a-uuid'},{status:'400',messageId:zokoId},{messageId:zokoId}]) {
      expect(await deliverMessage(zokoJob,ownZoko,asFetch(async()=>Response.json(response)))).toMatchObject({outcome:'uncertain'});
    }
  });
  it('accepts documented Zoko 200 acknowledgments without asserting delivered or read',async()=>{
    expect(await deliverMessage(zokoJob,ownZoko,asFetch(async()=>Response.json({status:'200',statusText:'Accepted',messageId:zokoId})))).toEqual({outcome:'accepted',providerMessageId:zokoId});
  });
  it('keeps ambiguous Zoko results for manual reconciliation instead of resending',async()=>{
    expect(await deliverMessage(zokoJob,ownZoko,asFetch(async()=>{throw new Error('own-private-key');}))).toEqual({outcome:'uncertain',errorCode:'network_result_unknown'});
    expect(await deliverMessage(zokoJob,ownZoko,asFetch(async()=>new Response('own-private-key',{status:503})))).toEqual({outcome:'uncertain',errorCode:'provider_result_unknown'});
    expect(await deliverMessage(zokoJob,ownZoko,asFetch(async()=>new Response('own-private-key',{status:403})))).toEqual({outcome:'failed',errorCode:'provider_authentication_failed'});
    expect(await deliverMessage(zokoJob,ownZoko,asFetch(async()=>new Response('',{status:429,headers:{'Retry-After':'120'}})))).toMatchObject({outcome:'retry',retryAfterSeconds:120});
  });
  it('normalizes Zoko placeholders and blocks oversized parameters or invalid recipients',async()=>{
    const request=asFetch(async(_url,init)=>{expect(JSON.parse(String(init?.body)).templateArgs).toEqual([job.subject,'Own proposal update']);return Response.json({status:'202',messageId:zokoId});});
    expect(await deliverMessage({...zokoJob,body:'Own\nproposal\tupdate'},ownZoko,request)).toMatchObject({outcome:'accepted'});
    const blocked=vi.fn();
    expect(await deliverMessage({...zokoJob,body:'a'.repeat(1025)},ownZoko,blocked)).toMatchObject({errorCode:'whatsapp_parameter_too_long'});
    expect(await deliverMessage({...zokoJob,recipient:'639171234567'},ownZoko,blocked)).toMatchObject({errorCode:'invalid_phone'});
    expect(blocked).not.toHaveBeenCalled();
  });
  it('cannot reroute a job frozen to another provider when configuration changes',async()=>{
    const blocked=vi.fn();
    expect(await deliverMessage({...zokoJob,provider:'whatsapp'},ownZoko,blocked)).toMatchObject({errorCode:'message_provider_mismatch'});
    expect(await deliverMessage({...job,provider:'zoko'},config,blocked)).toMatchObject({errorCode:'message_provider_mismatch'});
    expect(blocked).not.toHaveBeenCalled();
  });
  it('keeps portal links on the configured own origin and rejects injected destinations', async () => {
    const path=`/portal/proposals/${job.id}`;
    expect(renderDeliveryBody(job.body,path,'https://agency.example.test')).toContain(`https://agency.example.test${path}`);
    expect(renderDeliveryBody(job.body,'//other.example.test','https://agency.example.test')).toBeNull();
    expect(renderDeliveryBody(job.body,path,'https://user:secret@agency.example.test')).toBeNull();
    const request=vi.fn();expect(await deliverMessage({...job,portal_path:path},config,request)).toMatchObject({errorCode:'portal_origin_not_configured'});expect(request).not.toHaveBeenCalled();
  });
  it('normalizes WhatsApp parameter whitespace while preserving email line breaks',()=>{
    const path=`/portal/proposals/${job.id}`;
    expect(renderDeliveryBody('Own\nproject\tupdate',path,'https://agency.example.test','whatsapp')).not.toMatch(/[\r\n\t]/);
    expect(renderDeliveryBody('Own\nproject update',path,'https://agency.example.test','email')).toContain('\n\nhttps://');
  });
  it('rejects short/unmatched scheduler secrets', async()=>{
    expect(await secretMatches('short','short')).toBe(false);
    expect(await secretMatches('a'.repeat(32),'a'.repeat(32))).toBe(true);
    expect(await secretMatches('b'.repeat(32),'a'.repeat(32))).toBe(false);
  });
});

async function signature(body:string,key:Uint8Array){const imported=await crypto.subtle.importKey('raw',key as BufferSource,{name:'HMAC',hash:'SHA-256'},false,['sign']);return new Uint8Array(await crypto.subtle.sign('HMAC',imported,new TextEncoder().encode(body)));}
describe('signed delivery receipts',()=>{
  it('verifies the raw Meta body and rejects altered payloads or missing signatures',async()=>{
    const body='{"object":"whatsapp_business_account"}', key='own-webhook-secret';
    const hash=await signature(body,new TextEncoder().encode(key));
    const header='sha256='+Array.from(hash,value=>value.toString(16).padStart(2,'0')).join('');
    expect(await verifyMeta(body,header,key)).toBe(true);
    expect(await verifyMeta(body+' ',header,key)).toBe(false);
    expect(await verifyMeta(body,null,key)).toBe(false);
  });
  it('verifies Svix signature and rejects replay outside the freshness window',async()=>{
    const now=Date.now(), timestamp=String(Math.floor(now/1000)), body='{"type":"email.delivered"}', key=new TextEncoder().encode('our-own-test-webhook-key');
    const id='msg_evt_1';const hash=await signature(`${id}.${timestamp}.${body}`,key);
    const encoded=btoa(String.fromCharCode(...hash));const secret='whsec_'+btoa(String.fromCharCode(...key));
    const headers=new Headers({'svix-id':id,'svix-timestamp':timestamp,'svix-signature':`v1,${encoded}`});
    expect(await verifyResend(body,headers,secret,now)).toBe(true);
    expect(await verifyResend(body,headers,secret,now+301000)).toBe(false);
    expect(await verifyResend(body+' ',headers,secret,now)).toBe(false);
  });
  it('extracts only sanitized IDs/statuses and lets the database deduplicate them',()=>{
    const body=JSON.stringify({object:'whatsapp_business_account',entry:[{changes:[{value:{statuses:[{id:'wamid.1',status:'read',timestamp:'1',recipient_id:'do-not-store'},{id:'wamid.2',status:'sent',timestamp:'1'}]}}]}]});
    expect(parseReceipts('whatsapp',body)).toEqual([{provider:'whatsapp',eventId:'wamid.1:read:1',messageId:'wamid.1',status:'read'}]);
    expect(parseReceipts('resend',JSON.stringify({type:'email.delivered',data:{email_id:'email-1',to:['do-not-store']}}),new Headers({'svix-id':'evt-1'}))).toEqual([{provider:'resend',eventId:'evt-1',messageId:'email-1',status:'delivered'}]);
  });
  it('does not silently discard a signed provider batch larger than 100 receipts',()=>{
    const statuses=Array.from({length:101},(_,i)=>({id:`wamid.${i}`,status:'delivered',timestamp:'1'}));
    const body=JSON.stringify({object:'whatsapp_business_account',entry:[{changes:[{value:{statuses}}]}]});
    expect(parseReceipts('whatsapp',body)).toHaveLength(101);
  });
});
