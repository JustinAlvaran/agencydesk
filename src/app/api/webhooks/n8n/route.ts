import {z} from 'zod';
import {endpoint,json,readBody,HttpError,databaseError} from '@/lib/http';
import {serviceClient} from '@/lib/supabase/admin';
import {decryptCredentials,validWebhookSignature} from '@/lib/connections';
export const POST=(request:Request)=>endpoint(async()=>{
 const agency=z.uuid().safeParse(request.headers.get('x-agency-id'));if(!agency.success)throw new HttpError(401,'Invalid webhook authentication.');
 const body=await readBody(request);const service=serviceClient();
 const stored=await service.rpc('connection_secret',{p_agency:agency.data,p_provider:'n8n'});
 const envelope=z.object({envelope:z.string()}).safeParse(stored.data);
 if(stored.error||!envelope.success)throw new HttpError(401,'Invalid webhook authentication.');
 const credentials=decryptCredentials(agency.data,'n8n',envelope.data.envelope);
 if(!credentials.webhookSecret||!validWebhookSignature(body,request.headers.get('x-webhook-timestamp')??'',request.headers.get('x-webhook-signature')??'',credentials.webhookSecret))throw new HttpError(401,'Invalid webhook authentication.');
 const data=z.object({event_id:z.uuid(),receipt_id:z.uuid(),lease_token:z.uuid(),status:z.literal('completed')}).strict().parse(JSON.parse(body));
 const result=await service.rpc('complete_crm_event',{p_agency:agency.data,p_event:data.event_id,p_receipt:data.receipt_id,p_lease:data.lease_token});databaseError(result.error);
 return json({received:true});
});
