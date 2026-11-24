import 'server-only';
import type { SupabaseClient } from '@supabase/supabase-js';
import type { Database } from '@/lib/supabase/database.types';
import type { Lead, Contact, Proposal, Project, Task, ActivityEvent } from '@/types/crm';
import { databaseError } from '@/lib/http';
type Row<K extends keyof Database['public']['Tables']> = Database['public']['Tables'][K]['Row'];

export function leadView(row: Row<'leads'>, company = '', notes: string[] = []): Lead {
  return { id:row.id,contact_name:row.contact_name,email:row.email,phone:row.phone??undefined,
    company:company||row.company_name||'Unassigned company',service:row.service,brief:row.brief,budget:row.budget_cents/100,
    status:row.status as Lead['status'],probability:row.probability,score:row.score,row_version:row.row_version,
    budget_range:row.budget_range,owner:row.owner_id?'Assigned staff':'Unassigned',created_at:row.created_at,last_activity:row.updated_at,notes };
}
/** Lists are bounded; dashboard totals come from SQL over all visible rows. */
export async function crmData(db: SupabaseClient<Database>, client = false) {
  const [leads,companies,notes,tasks,projects,milestones,series,revisions,contacts,events,totals] = await Promise.all([
    client?Promise.resolve({data:[],error:null}):db.from('leads').select('*').is('archived_at',null).order('updated_at',{ascending:false}).limit(250),
    db.from('companies').select('*').order('name').limit(1000),
    client?Promise.resolve({data:[],error:null}):db.from('lead_notes').select('*').order('created_at').limit(1000),
    client?Promise.resolve({data:[],error:null}):db.from('follow_up_tasks').select('*').order('due_at').limit(250),
    db.from('projects').select('*').order('created_at',{ascending:false}).limit(250),
    db.from('milestones').select('*').order('position').limit(1000),
    db.from('proposal_series').select('*').order('created_at',{ascending:false}).limit(250),
    db.from('proposal_revisions').select('*').order('version',{ascending:false}).limit(1000),
    client?Promise.resolve({data:[],error:null}):db.from('contacts').select('*').order('name').limit(250),
    client?Promise.resolve({data:[],error:null}):db.from('activity_events').select('*').order('created_at',{ascending:false}).limit(25),
    client?Promise.resolve({data:null,error:null}):db.rpc('crm_totals'),
  ]);
  for (const result of [leads,companies,notes,tasks,projects,milestones,series,revisions,contacts,events,totals]) databaseError(result.error);
  const company = (id: string|null) => companies.data?.find(c=>c.id===id)?.name ?? '';
  const viewLeads:Lead[]=(leads.data??[]).map(l=>leadView(l,company(l.company_id),(notes.data??[]).filter(n=>n.lead_id===l.id).map(n=>n.body)));
  const viewProjects:Project[]=(projects.data??[]).map(p=>{
    const ms=(milestones.data??[]).filter(m=>m.project_id===p.id);
    return {id:p.id,title:p.name,company:company(p.company_id),status:p.status==='completed'?'completed':p.status==='on_hold'?'planning':'in_progress',
      progress:ms.length?Math.round(ms.filter(m=>m.status==='completed').length/ms.length*100):0,due_date:ms.map(m=>m.due_at??'').sort().at(-1)?.slice(0,10)||'Not scheduled',created_at:p.created_at,
      milestones:ms.map(m=>({id:m.id,title:m.title,completed:m.status==='completed',due_date:m.due_at?.slice(0,10)||'Not scheduled',review_status:m.review_status,feedback:m.feedback}))};
  });
  const viewProposals:Proposal[]=(series.data??[]).map(s=>{const rev=revisions.data?.find(r=>r.series_id===s.id); return {
    id:s.id,revision_id:rev?.id,title:s.title,lead_id:s.lead_id,company:company(s.company_id),version:rev?`v${rev.version}`:'No draft',scope:rev?.scope??'',total_cents:rev?.total_cents??0,
    status:(rev?.status??'draft') as Proposal['status'],expires_at:rev?.expires_at,created_at:s.created_at,
  };});
  const viewContacts:Contact[]=(contacts.data??[]).map(c=>({id:c.id,name:c.name,email:c.email,company:company(c.company_id),role:'Client contact',deals_count:(series.data??[]).filter(s=>s.company_id===c.company_id).length,total_value:(revisions.data??[]).filter(r=>r.status==='accepted'&&series.data?.some(s=>s.id===r.series_id&&s.company_id===c.company_id)).reduce((sum,r)=>sum+r.total_cents/100,0),created_at:c.created_at}));
  const viewTasks:Task[]=(tasks.data??[]).map(t=>({id:t.id,title:t.title,lead_id:t.lead_id,due_date:t.due_at,completed:!!t.completed_at,assigned_to:t.assigned_to?'Assigned staff':'Unassigned'}));
  const viewEvents:ActivityEvent[]=(events.data??[]).map(e=>({id:e.id,lead_id:e.lead_id??undefined,type:'status_change',title:e.event_type.replaceAll('_',' '),actor:e.actor_id?'Workspace member':'System',detail:'Recorded in the agency audit log',created_at:e.created_at}));
  return {leads:viewLeads,projects:viewProjects,proposals:viewProposals,contacts:viewContacts,tasks:viewTasks,activities:viewEvents,
    companies:companies.data??[],totals:totals.data as {open_leads:number;pipeline_cents:number;weighted_cents:number}|null};
}
