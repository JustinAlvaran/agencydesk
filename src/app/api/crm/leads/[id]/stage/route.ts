import {z} from 'zod';
import {apiSession,endpoint,json,readJson,sameOrigin,databaseError} from '@/lib/http';
import {leadView} from '@/lib/crm-data';
export const PATCH=(request:Request,{params}:{params:Promise<{id:string}>})=>endpoint(async()=>{
 sameOrigin(request);const {supabase}=await apiSession();const id=z.uuid().parse((await params).id);
 const input=z.object({stage:z.enum(['new','contacted','qualified','proposal_sent','lost']),row_version:z.number().int().positive()}).strict().parse(await readJson(request));
 const {data,error}=await supabase.rpc('update_lead_stage',{p_id:id,p_version:input.row_version,p_stage:input.stage});databaseError(error);
 return json({success:true,lead:leadView(data!)});
});
