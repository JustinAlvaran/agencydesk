import { z } from 'zod';
import {apiSession,endpoint,json,readJson,sameOrigin,databaseError,HttpError} from '@/lib/http';
import {providerSchema,credentialSchema,encryptCredentials,decryptCredentials,testConnection} from '@/lib/connections';
import {serviceClient} from '@/lib/supabase/admin';
export const POST=(request:Request)=>endpoint(async()=>{
 sameOrigin(request);const {supabase,staff}=await apiSession('admin');
 const input=z.object({id:providerSchema,action:z.enum(['save','test','disconnect']),credentials:credentialSchema.optional()}).parse(await readJson(request));
 if(input.action==='test'){
   const service=serviceClient();const stored=await service.rpc('connection_secret',{p_agency:staff!.agency_id,p_provider:input.id});databaseError(stored.error);
   const secret=z.object({id:z.uuid(),version:z.number(),envelope:z.string()}).safeParse(stored.data);
   if(!secret.success)throw new HttpError(409,'Save credentials before testing.');
   let ok=false;try{ok=await testConnection(input.id,decryptCredentials(staff!.agency_id,input.id,secret.data.envelope));}catch{ok=false;}
   const saved=await service.rpc('record_connection_test',{p_id:secret.data.id,p_version:secret.data.version,p_ok:ok});databaseError(saved.error);
   if(!saved.data)throw new HttpError(409,'Credentials changed during the check. Test again.');
   return json({success:ok,status:ok?'connected':'error',message:ok?'Read-only connection test passed. No workflows or messages were started.':'Connection check failed. Check credentials and server configuration.'});
 }
 if(input.action==='save'&&!input.credentials)throw new HttpError(400,'Credentials are required.');
 if(input.action==='save'&&input.id==='twilio'&&!input.credentials?.accountId)throw new HttpError(400,'A Twilio Account SID is required.');
 if(input.action==='save'&&input.id==='n8n'&&!input.credentials?.webhookSecret)throw new HttpError(400,'A webhook signing secret of at least 32 characters is required.');
 const envelope=input.action==='save'?encryptCredentials(staff!.agency_id,input.id,input.credentials!):'';
 const result=await supabase.rpc('save_connection',{p_provider:input.id,p_envelope:envelope,p_disconnect:input.action==='disconnect'});databaseError(result.error);
 return json({success:true,status:input.action==='disconnect'?'disconnected':'saved'});
});
