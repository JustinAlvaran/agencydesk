import {z} from 'zod';
import {apiSession,endpoint,json,readJson,sameOrigin,databaseError} from '@/lib/http';
import {crmData} from '@/lib/crm-data';
export const GET=()=>endpoint(async()=>{const {supabase}=await apiSession();return json({leads:(await crmData(supabase)).leads});});
export const POST=(request:Request)=>endpoint(async()=>{
 sameOrigin(request);const {supabase}=await apiSession();
 const input=z.object({submission_id:z.uuid(),contact_name:z.string().trim().min(1).max(100),email:z.email().max(254),service:z.string().trim().min(1).max(100),brief:z.string().trim().min(1).max(4000),budget:z.number().int().min(0).max(1000000).default(0),company_id:z.uuid().nullable().default(null),phone:z.string().regex(/^\+[1-9]\d{7,14}$/).nullable().default(null)}).parse(await readJson(request));
 const {data,error}=await supabase.rpc('create_manual_lead',{p_action_id:input.submission_id,p_details:{...input,budget_cents:input.budget*100,source:'staff',email_opt_in:false,whatsapp_opt_in:false,owner_id:null}});databaseError(error);return json({id:data},201);
});
