import 'server-only';
import { requireStaff } from '@/lib/auth';
import { pagination, type SearchParams } from '@/lib/data';
import { leadStatuses, type Lead } from '@/lib/domain';
import { uuid } from '@/lib/validation';

export type WorkflowLead = Lead & {phone?:string|null;source?:string;email_opt_in?:boolean;whatsapp_opt_in?:boolean};
export async function listLeads(params: SearchParams) {
  const {supabase} = await requireStaff();
  const {page,from,to} = pagination(params);
  let query = supabase.from('leads').select('id,company_id,contact_name,email,phone,service,brief,budget_cents,status,owner_id,archived_at,created_at,source,email_opt_in,whatsapp_opt_in',{count:'exact'}).order('created_at',{ascending:false}).order('id',{ascending:false}).range(from,to);
  query = params.show === 'archived' ? query.not('archived_at','is',null) : query.is('archived_at',null);
  if (typeof params.status === 'string' && leadStatuses.includes(params.status as Lead['status'])) query = query.eq('status',params.status);
  if (params.owner === 'unassigned') query = query.is('owner_id',null);
  else if (typeof params.owner === 'string' && uuid.safeParse(params.owner).success) query = query.eq('owner_id',params.owner);
  if (typeof params.q === 'string' && params.q.trim()) query = query.ilike('contact_name',`%${params.q.trim().replace(/[%_\\]/g,'').slice(0,100)}%`);
  const {data,error,count} = await query;
  if (error) throw new Error('Could not load leads. Please try again.');
  return {rows:(data??[]) as WorkflowLead[],count:count??0,page};
}
