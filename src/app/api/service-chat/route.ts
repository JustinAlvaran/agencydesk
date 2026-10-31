import {isIP} from 'node:net';
import {isDemo,supabaseEnvironment} from '@/lib/env';
import {chatCookieName,chatIdentity,chatNetworkHash} from '@/lib/service-chat-session';
import {boundedJSON,ChatError,parseChat,parseServiceAnswer} from '../../../../supabase/functions/_shared/service-chat';
import {publicServices} from '@/lib/website-content';
import {serviceChatAvailable} from '@/lib/service-chat-availability';

export const runtime='nodejs';
const headers={'Cache-Control':'private, no-store','Referrer-Policy':'no-referrer'};
const failure=(status:number,error:string)=>Response.json({error},{status,headers});
// Capability only: no inference, credentials, customer state or readiness claim.
export function GET(){
  return Response.json({available:serviceChatAvailable()},{headers});
}
export async function POST(request:Request){
  const relay=process.env.SERVICE_CHAT_RELAY_KEY??'';
  if(isDemo()||process.env.SERVICE_CHAT_ENABLED!=='true'||relay.length<32)return failure(503,'AI answers are unavailable. Please use the service guide.');
  let origin:string;try{origin=new URL(process.env.APP_URL??'').origin;}catch{return failure(503,'AI answers are unavailable.');}
  if(request.headers.get('origin')!==origin)return failure(403,'Request origin is not allowed.');
  try{
    const input=parseChat(await boundedJSON(request));
    const {url,key}=supabaseEnvironment();
    const identity=chatIdentity(request.headers.get('cookie'),relay);
    // Only Netlify's documented connecting-client header is used in production.
    // Never accept caller-supplied forwarded-for or arbitrary IP body fields.
    const connectingIP=request.headers.get('x-nf-client-connection-ip')??'';
    const network=process.env.NETLIFY==='true'&&isIP(connectingIP)?connectingIP:'unverified-network';
    const response=await fetch(`${url}/functions/v1/service-chat`,{
      method:'POST',cache:'no-store',redirect:'error',signal:AbortSignal.timeout(15_000),
      headers:{'Content-Type':'application/json',apikey:key,'x-agency-chat-relay':relay,'x-agency-chat-session':identity.hash,'x-agency-chat-network':chatNetworkHash(network,relay)},
      body:JSON.stringify(input),
    });
    if(!response.ok)return failure(response.status===429?429:503,'AI answers are unavailable right now. Use the service guide or prepare an inquiry.');
    let answer;
    try { answer=parseServiceAnswer(await boundedJSON(response),publicServices); }
    catch { throw new ChatError(503); }
    const result=Response.json(answer,{headers});
    if(identity.fresh)result.headers.set('Set-Cookie',`${chatCookieName}=${identity.token}; Path=/; Max-Age=1800; HttpOnly; Secure; SameSite=Strict`);
    return result;
  }catch(error){return failure(error instanceof ChatError?error.status:503,error instanceof ChatError?error.message:'AI answers are unavailable. Please use the service guide.');}
}
