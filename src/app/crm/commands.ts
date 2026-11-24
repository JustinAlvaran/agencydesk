'use server';
import { z } from 'zod';
import { randomBytes,createHash } from 'node:crypto';
import { revalidatePath } from 'next/cache';
import { apiSession,databaseError,HttpError } from '@/lib/http';

export async function crmCommand(command:string,form:FormData):Promise<{error?:string;message?:string;url?:string}> {
 try {
  const {supabase,user}=await apiSession(['accept','decline','review'].includes(command)?'user':'staff');
  const values=Object.fromEntries(form); const id=()=>z.uuid().parse(values.id);
  if(command==='contact') {
    const data=z.object({name:z.string().trim().min(1).max(100),email:z.email().max(254),company:z.string().trim().min(1).max(200)}).parse(values);
    databaseError((await supabase.rpc('create_business_contact',{contact_name:data.name,contact_email:data.email,company_name:data.company})).error);
  } else if(command==='proposal'||command==='revision') {
    const data=z.object({title:z.string().trim().min(1).max(200).optional(),scope:z.string().trim().min(1).max(10000),terms:z.string().trim().min(1).max(4000),expires:z.string().regex(/^\d{4}-\d{2}-\d{2}$/),description:z.string().trim().min(1).max(1000),quantity:z.coerce.number().int().min(1).max(10000),unit_price:z.coerce.number().min(0.01).max(1000000)}).parse(values);
    const items=[{description:data.description,quantity:data.quantity,unit_price_cents:Math.round(data.unit_price*100)}];
    const args={p_scope:data.scope,p_terms:data.terms,p_expires:`${data.expires}T23:59:59Z`,p_items:items};
    if(command==='proposal'){
      const result=await supabase.rpc('create_proposal_with_draft',{...args,p_lead:z.uuid().parse(values.lead_id),p_company:z.uuid().parse(values.company_id),p_title:data.title!});databaseError(result.error);
      revalidatePath('/crm','layout');return {url:`/crm/proposals/${result.data}`,message:'Draft created'};
    }
    databaseError((await supabase.rpc('create_proposal_draft',{...args,p_series:id()})).error);
  } else if(command==='item') {
    const data=z.object({description:z.string().trim().min(1).max(1000),quantity:z.coerce.number().int().min(1).max(10000),unit_price:z.coerce.number().min(0.01).max(1000000)}).parse(values);
    databaseError((await supabase.from('proposal_items').insert({revision_id:id(),description:data.description,quantity:data.quantity,unit_price_cents:Math.round(data.unit_price*100)})).error);
  } else if(command==='publish' ||command==='accept'||command==='decline') {
    if(command==='accept'&&values.confirm!=='on')return {error:'Confirm that you accept this exact scope and payment terms.'};
    databaseError((await supabase.rpc(command==='publish'?'publish_proposal_revision':command==='accept'?'accept_proposal_revision':'decline_proposal_revision',{revision_id:id()})).error);
  } else if(command==='link') {
    const token=randomBytes(32).toString('base64url');const digest=createHash('sha256').update(token).digest('hex');
    databaseError((await supabase.rpc('issue_proposal_link',{p_revision:id(),p_digest:digest})).error);
    return {url:`/proposal#${token}`,message:'This private link expires within seven days. Share it only with the intended client.'};
  } else if(command==='revoke_links') databaseError((await supabase.rpc('revoke_proposal_links',{p_revision:id()})).error);
  else if(command==='milestone') {
    const data=z.object({id:z.uuid(),title:z.string().trim().min(1).max(200),due:z.string().regex(/^\d{4}-\d{2}-\d{2}$/)}).parse(values);
    databaseError((await supabase.from('milestones').insert({project_id:data.id,title:data.title,due_at:`${data.due}T23:59:59Z`,status:'pending'})).error);
  } else if(command==='submit_review') databaseError((await supabase.from('milestones').update({review_status:'review',status:'in_progress'}).eq('id',id()).neq('review_status','approved').select('id').single()).error);
  else if(command==='review') databaseError((await supabase.rpc('review_milestone',{p_id:id(),p_approve:z.enum(['approve','changes']).parse(values.decision)==='approve',p_feedback:z.string().max(4000).parse(values.feedback??'')})).error);
  else if(command==='sprint') {
    const data=z.object({id:z.uuid(),title:z.string().trim().min(1).max(200),starts:z.string().regex(/^\d{4}-\d{2}-\d{2}$/),ends:z.string().regex(/^\d{4}-\d{2}-\d{2}$/)}).parse(values);
    databaseError((await supabase.from('sprints').insert({project_id:data.id,title:data.title,starts_at:data.starts,ends_at:data.ends})).error);
  } else if(command==='task') {
    const data=z.object({id:z.uuid(),title:z.string().trim().min(1).max(200),due:z.string().regex(/^\d{4}-\d{2}-\d{2}$/)}).parse(values);
    databaseError((await supabase.from('follow_up_tasks').insert({lead_id:data.id,title:data.title,due_at:`${data.due}T23:59:59Z`,assigned_to:user.id})).error);
  } else if(command==='complete_task') databaseError((await supabase.from('follow_up_tasks').update({completed_at:new Date().toISOString()}).eq('id',id()).select('id').single()).error);
  else return {error:'Unsupported operation.'};
  revalidatePath('/crm','layout');revalidatePath('/portal');return {message:'Saved'};
 } catch(error) {
  if(error instanceof z.ZodError)return {error:'Check the required fields and allowed values.'};
  if(error instanceof HttpError)return {error:error.message};
  return {error:'Could not save. Please try again.'};
 }
}
