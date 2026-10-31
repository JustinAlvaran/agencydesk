import {createClient} from 'npm:@supabase/supabase-js@2.117.2';
import catalog from '../../../content/fixtures.json' with {type:'json'};
import {boundedJSON,ChatError,cloudflareServiceAnswer,parseChat} from '../_shared/service-chat.ts';

const headers = {'Content-Type':'application/json','Cache-Control':'private, no-store'};
const respond = (value:unknown,status=200)=>new Response(JSON.stringify(value),{status,headers});
Deno.serve(async request=>{
  if (request.method!=='POST') return respond({error:'Method not allowed'},405);
  const secret=Deno.env.get('SERVICE_CHAT_RELAY_KEY')??'';
  const given=request.headers.get('x-agency-chat-relay')??'';
  if (secret.length<32||given.length>256) return respond({error:'Server relay required'},401);
  // Hashes have fixed size; avoid secret-dependent early comparison.
  const digest=async(value:string)=>new Uint8Array(await crypto.subtle.digest('SHA-256',new TextEncoder().encode(value)));
  const a=await digest(secret),b=await digest(given);let difference=0;for(let i=0;i<a.length;i++)difference|=a[i]^b[i];
  if (secret.length<32||given.length>256||difference!==0) return respond({error:'Server relay required'},401);
  if (Deno.env.get('SERVICE_CHAT_ENABLED')!=='true') return respond({error:'AI answers are unavailable. Please use the service guide.'},503);
  const session=request.headers.get('x-agency-chat-session')??'',network=request.headers.get('x-agency-chat-network')??'';
  if (!/^[a-f0-9]{64}$/.test(session)||!/^[a-f0-9]{64}$/.test(network)) return respond({error:'Invalid request'},400);
  let id:string|undefined;
  let finishUnavailable: (()=>PromiseLike<unknown>) | undefined;
  try {
    const url=Deno.env.get('SUPABASE_URL'),serviceKey=Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
    if(!url||!serviceKey)throw new ChatError(503);
    const admin=createClient(url,serviceKey,{auth:{persistSession:false,autoRefreshToken:false}});
    const input=parseChat(await boundedJSON(request));
    const account=Deno.env.get('SERVICE_CHAT_CF_ACCOUNT_ID')??'',key=Deno.env.get('SERVICE_CHAT_CF_API_TOKEN')??'',model=Deno.env.get('SERVICE_CHAT_CF_MODEL')??'';
    if(!account||!key||!model)throw new ChatError(503);
    const attempt=crypto.randomUUID();
    const {data,error}=await admin.rpc('reserve_service_chat',{p_slug:Deno.env.get('AGENCY_SLUG')??'agencydesk',p_request_id:attempt,p_session_hash:session,p_network_hash:network});
    if(error)throw new ChatError(503);if(data!==true)throw new ChatError(429);id=attempt;
    finishUnavailable=()=>admin.rpc('finish_service_chat',{p_request_id:attempt,p_outcome:'unavailable'});
    const services=catalog.services.filter(service=>service.visibility==='visible');
    const answer=await cloudflareServiceAnswer(input,services,{account,key,model});
    const {error:finishError}=await admin.rpc('finish_service_chat',{p_request_id:id,p_outcome:'answered'});
    if(finishError)throw new ChatError(503);
    return respond(answer);
  } catch(error) {
    // Admission remains counted even if finalization is unavailable. Never rerun inference.
    try { await finishUnavailable?.(); } catch { /* Preserve the redacted fallback. */ }
    return respond({error:error instanceof ChatError?error.message:'AI answers are unavailable. Please use the service guide.'},error instanceof ChatError?error.status:503);
  }
});
