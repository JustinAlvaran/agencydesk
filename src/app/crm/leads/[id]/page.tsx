import { randomUUID } from 'node:crypto';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { ActionForm } from '@/app/crm/action-form';
import { row, choices } from '@/lib/data';
import { requireStaff } from '@/lib/auth';
import { leadStatuses, statusLabel, type Note } from '@/lib/domain';
import type { WorkflowLead } from '@/lib/leads/query';
import { activitySummary, callOutcomes } from '@/lib/leads/workflow';
import { addNote, updateLead } from '@/app/actions';
import { recordLeadCall, saveLeadDetails } from '../../lead-actions';
import { Heading, Panel, Area, Submit } from '../../workspace-ui';
import { ContactFields } from '../contact-fields';
import { HermesDraft } from '@/components/hermes-draft';

type Activity = {id:string;event_type:string;created_at:string;actor_id:string|null;detail:unknown};
export default async function Page({params}:{params:Promise<{id:string}>}) {
 const {id} = await params;
 const lead = await row<WorkflowLead>('leads',id);
 if (!lead) notFound();
 const {supabase,user} = await requireStaff();
 const [options,events,notesResult] = await Promise.all([
  choices(),
  supabase.from('activity_events').select('id,event_type,created_at,actor_id,detail').eq('lead_id',id).order('created_at',{ascending:false}).order('id',{ascending:false}).limit(100),
  supabase.from('lead_notes').select('id,lead_id,body,author_id,created_at').eq('lead_id',id).order('created_at',{ascending:false}).limit(100),
 ]);
 if (events.error || notesResult.error) throw new Error('Could not load lead activity.');
 const notes = (notesResult.data??[]) as Note[];
 const timeline = [...(events.data??[]) as Activity[],...notes.map(note=>({id:note.id,event_type:'internal_note',created_at:note.created_at,actor_id:note.author_id,detail:{},body:note.body}))].sort((a,b)=>b.created_at.localeCompare(a.created_at)||b.id.localeCompare(a.id));
 return <>
  <Heading title={lead.contact_name} description={[lead.email,lead.phone].filter(Boolean).join(' · ')}/><Link href="/crm/leads" className="button button-secondary" style={{marginBottom:20}}>Back to leads</Link>
  <Panel title="Contact and preferences"><ActionForm action={saveLeadDetails}><input type="hidden" name="id" value={id}/><ContactFields lead={lead}/><Submit>Save contact details</Submit></ActionForm></Panel>
  <Panel title="Manage lead"><ActionForm action={updateLead}><input type="hidden" name="id" value={id}/>
   <label className="field" style={{marginBottom:16}}>Pipeline stage<select className="input" name="status" defaultValue={lead.status}>{leadStatuses.map(stage=><option key={stage} value={stage} disabled={lead.status==='won'?stage!=='won':stage==='won'}>{statusLabel(stage)}</option>)}</select></label>
   <p className="muted">Won is set when the client accepts a proposal.</p>
   <label className="field" style={{marginBottom:16}}>Client company<select className="input" name="company_id" defaultValue={lead.company_id??''}><option value="">Not yet linked</option>{lead.company_id&&!options.companies.some(company=>company.id===lead.company_id)?<option value={lead.company_id}>Current company · {lead.company_id.slice(0,8)}</option>:null}{options.companies.map(company=><option key={company.id} value={company.id}>{company.name}</option>)}</select></label>
   <p className="muted">Link a client company before creating a proposal. Create companies in Contacts.</p>
   <label className="field" style={{marginBottom:16}}>Owner<select className="input" name="owner_id" defaultValue={lead.owner_id??''}><option value="">Unassigned</option>{lead.owner_id&&!options.staff.some(staff=>staff.user_id===lead.owner_id)?<option value={lead.owner_id}>Current owner · {lead.owner_id.slice(0,8)} (not available for new assignments)</option>:null}{options.staff.map(staff=><option key={staff.user_id} value={staff.user_id}>{staff.role} · {staff.user_id.slice(0,8)}</option>)}</select></label>
   <label className="field" style={{marginBottom:16}}>Archive<select className="input" name="archived" defaultValue={lead.archived_at?'true':'false'}><option value="false">Active</option><option value="true">Archived</option></select></label><Submit>Save lead</Submit>
  </ActionForm></Panel>
  <Panel title="Log a call"><p className="muted">A connected call moves a new lead to Contacted. Not interested or invalid number closes an open lead as Lost. Won and Lost leads keep their stage.</p><ActionForm key={randomUUID()} action={recordLeadCall}>
   <input type="hidden" name="lead_id" value={id}/><input type="hidden" name="action_id" value={randomUUID()}/>
   <label className="field" style={{marginBottom:16}}>Outcome<select name="outcome" className="input" defaultValue="connected">{callOutcomes.map(outcome=><option key={outcome} value={outcome}>{statusLabel(outcome)}</option>)}</select></label>
   <label className="field" style={{marginBottom:16}}>Call note<textarea className="input" name="note" rows={3} maxLength={4000}/></label>
   <label className="field" style={{marginBottom:16}}>Callback time (Asia/Manila)<input className="input" name="callback_at" type="datetime-local"/></label>
   <p className="muted">Select Callback and choose a future time to create a follow-up task for the owner. This records a reminder; it does not send a message.</p><Submit>Record call</Submit>
  </ActionForm></Panel>
  {!lead.archived_at ? <Panel title="Message drafts"><HermesDraft key={id} leadId={id} phone={lead.phone} whatsappPermitted={lead.whatsapp_opt_in === true}/></Panel> : null}
  <Panel title="Internal notes"><ActionForm action={addNote}><input type="hidden" name="lead_id" value={id}/><Area label="New internal note" name="body"/><Submit>Add note</Submit></ActionForm></Panel>
  <Panel title="Activity history"><p className="muted">Most recent first · latest 100 events and 100 notes.</p>{timeline.length?<ol style={{paddingLeft:20}}>{timeline.map(event=><li key={event.id} style={{padding:'12px 0',borderBottom:'1px solid var(--border)',overflowWrap:'anywhere'}}><strong>{statusLabel(event.event_type)}</strong><p className="muted"><time dateTime={event.created_at}>{new Date(event.created_at).toLocaleString('en-US',{timeZone:'Asia/Manila'})}</time> · {event.actor_id===user.id?'You':event.actor_id?`Actor ${event.actor_id.slice(0,8)}`:'System'}</p>{'body' in event?<p style={{whiteSpace:'pre-wrap'}}>{String(event.body)}</p>:activitySummary(event)?<p style={{whiteSpace:'pre-wrap'}}>{activitySummary(event)}</p>:null}</li>)}</ol>:<p>No activity yet.</p>}</Panel>
 </>;
}
