import 'server-only';
import { createCipheriv,createDecipheriv,randomBytes,createHmac,timingSafeEqual } from 'node:crypto';
import { z } from 'zod';
export const providerSchema=z.enum(['apollo','twilio','n8n']);
export const credentialSchema=z.object({apiKey:z.string().min(10).max(4096),accountId:z.string().regex(/^AC[a-fA-F0-9]{32}$/).optional(),webhookSecret:z.string().min(32).max(256).optional()});
export type Credentials=z.infer<typeof credentialSchema>;
function key(id:string) {
  const keys=z.record(z.string(),z.string()).parse(JSON.parse(process.env.CONNECTION_KEYS_JSON??'{}'));
  const value=Buffer.from(keys[id]??'','base64');if(value.length!==32)throw new Error('Connection encryption is not configured.');return value;
}
export function encryptCredentials(agency:string,provider:string,credentials:Credentials) {
  const kid=process.env.CONNECTION_ACTIVE_KEY_ID;if(!kid)throw new Error('Connection encryption is not configured.');
  const nonce=randomBytes(12);const cipher=createCipheriv('aes-256-gcm',key(kid),nonce);
  cipher.setAAD(Buffer.from(`${agency}:${provider}:${kid}`));
  const ciphertext=Buffer.concat([cipher.update(JSON.stringify(credentials),'utf8'),cipher.final()]);
  return JSON.stringify({kid,nonce:nonce.toString('base64'),ciphertext:ciphertext.toString('base64'),tag:cipher.getAuthTag().toString('base64')});
}
export function decryptCredentials(agency:string,provider:string,envelope:string):Credentials {
  const data=z.object({kid:z.string(),nonce:z.string(),ciphertext:z.string(),tag:z.string()}).parse(JSON.parse(envelope));
  const cipher=createDecipheriv('aes-256-gcm',key(data.kid),Buffer.from(data.nonce,'base64'));
  cipher.setAAD(Buffer.from(`${agency}:${provider}:${data.kid}`));cipher.setAuthTag(Buffer.from(data.tag,'base64'));
  return credentialSchema.parse(JSON.parse(Buffer.concat([cipher.update(Buffer.from(data.ciphertext,'base64')),cipher.final()]).toString('utf8')));
}
export async function testConnection(provider:z.infer<typeof providerSchema>,credentials:Credentials):Promise<boolean> {
  let url:string;let headers:Record<string,string>;
  if(provider==='apollo'){url='https://api.apollo.io/api/v1/auth/health';headers={'x-api-key':credentials.apiKey};}
  else if(provider==='twilio') {
    if(!credentials.accountId)return false;
    url=`https://api.twilio.com/2010-04-01/Accounts/${credentials.accountId}.json`;
    headers={Authorization:`Basic ${Buffer.from(`${credentials.accountId}:${credentials.apiKey}`).toString('base64')}`};
  } else {
    // Only the operator's explicit HTTPS API origin is permitted, never a form URL.
    const origin=new URL(process.env.N8N_API_ORIGIN??'');
    if(origin.protocol!=='https:'||origin.username||origin.password||origin.pathname!=='/'||origin.search||origin.hash)throw new Error('Invalid n8n API origin.');
    url=new URL('/api/v1/workflows?limit=1',origin).toString();headers={'X-N8N-API-KEY':credentials.apiKey};
  }
  const response=await fetch(url,{headers,redirect:'error',cache:'no-store',signal:AbortSignal.timeout(10000)});
  // Consume no provider payload: account details and provider errors may contain secrets.
  await response.body?.cancel();return response.ok;
}
export function validWebhookSignature(body:string,timestamp:string,signature:string,secret:string,now=Date.now()) {
  if(!/^\d{10}$/.test(timestamp)||!/^v1=[a-f0-9]{64}$/.test(signature)||Math.abs(now/1000-Number(timestamp))>300)return false;
  const expected=createHmac('sha256',secret).update(`${timestamp}.${body}`).digest();
  return timingSafeEqual(expected,Buffer.from(signature.slice(3),'hex'));
}
