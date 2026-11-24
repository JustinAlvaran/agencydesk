import {createHash,createHmac} from 'node:crypto';
import {z} from 'zod';
import {endpoint,json,readJson,sameOrigin,HttpError} from '@/lib/http';
import {serviceClient} from '@/lib/supabase/admin';
import {isDemo} from '@/lib/env';
const budgets:Record<string,number>={'$10,000 - $25,000':1000000,'$25,000 - $50,000':2500000,'$50,000 - $100,000':5000000,'$100,000+':10000000};
const schema=z.object({submission_id:z.uuid(),contact_name:z.string().trim().min(1).max(100),email:z.email().max(254).transform(v=>v.toLowerCase()),company:z.string().trim().max(200).default(''),phone:z.union([z.literal(''),z.string().regex(/^\+[1-9]\d{7,14}$/)]).default(''),service:z.enum(['Web & Mobile Applications','AI & Workflow Automations','Cloud & Supabase Architecture','Pipeline & Revenue Analytics','Growth Systems & Technical SEO','Custom CRM & Client Portal']),budget:z.string().max(100).default(''),timeline:z.string().max(200).default(''),brief:z.string().trim().min(20).max(4000),email_opt_in:z.boolean().default(false),source:z.enum(['website','website_chatbot']).default('website'),website:z.string().max(0).optional()});
export const POST=(request:Request)=>endpoint(async()=>{
 sameOrigin(request);const data=schema.parse(await readJson(request));
 const agency=z.uuid().safeParse(process.env.AGENCYDESK_INTAKE_AGENCY_ID);const secret=process.env.INTAKE_RATE_SECRET;
 if(isDemo()) return json({success:true,mode:'demo'},201);
 if(!agency.success||!secret)throw new HttpError(503,'Inquiry intake is not configured yet.');
 if(data.budget && !(data.budget in budgets))throw new HttpError(400,'Choose a listed budget range.');
 const details={...data,budget_range:data.budget,budget_cents:budgets[data.budget]??0};
 const result=await serviceClient().rpc('capture_website_inquiry',{p_agency:agency.data,p_submission:data.submission_id,p_hash:createHash('sha256').update(JSON.stringify(details)).digest('hex'),p_request_key:createHmac('sha256',secret).update(agency.data+':website-intake').digest('hex'),p_details:details});
 if(result.error) { if(result.error.message.includes('rate limit'))throw new HttpError(429,'Inquiry limit reached. Please try again later.');if(result.error.code==='23505')throw new HttpError(409,'This submission changed. Start a new inquiry.');throw new HttpError(503,'Your inquiry could not be saved. Please retry.'); }
 return json({success:true},201);
});
