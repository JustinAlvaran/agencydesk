import Link from 'next/link';
import { choices, type SearchParams } from '@/lib/data';
import { listLeads } from '@/lib/leads/query';
import { leadStatuses, money, statusLabel } from '@/lib/domain';
import { Heading, Pages } from '../workspace-ui';

export default async function Page({searchParams}:{searchParams:Promise<SearchParams>}) {
 const filters = await searchParams;
 const [records,options] = await Promise.all([listLeads(filters),choices()]);
 const view = filters.view === 'board' ? 'board' : 'table';
 const stageFilter = typeof filters.status === 'string' && leadStatuses.includes(filters.status as typeof leadStatuses[number]) ? filters.status : '';
 const viewUrl = (next:string) => {const params=new URLSearchParams();for(const [key,value] of Object.entries(filters)) if(typeof value==='string')params.set(key,value);params.set('view',next);return `/crm/leads?${params}`;};
 return <>
  <Heading title="Leads" description="Track inquiries, record calls, and plan follow-ups."/>
  <div className="lead-controls"><Link className="button button-primary" href="/crm/leads/new">Add lead</Link><nav aria-label="Lead view" style={{display:'flex',gap:8}}><Link className={`button button-${view==='table'?'primary':'secondary'}`} aria-current={view==='table'?'page':undefined} href={viewUrl('table')}>Table</Link><Link className={`button button-${view==='board'?'primary':'secondary'}`} aria-current={view==='board'?'page':undefined} href={viewUrl('board')}>Board</Link></nav></div>
  <form className="list-filters" aria-label="Lead filters">
   <input type="hidden" name="view" value={view}/>
   <label className="field">Contact name<input className="input" name="q" placeholder="Search contacts" defaultValue={typeof filters.q==='string'?filters.q:''}/></label>
   <label className="field">Stage<select className="input" name="status" defaultValue={String(filters.status??'')}><option value="">All stages</option>{leadStatuses.map(stage=><option key={stage} value={stage}>{statusLabel(stage)}</option>)}</select></label>
   <label className="field">Owner<select className="input" name="owner" defaultValue={String(filters.owner??'')}><option value="">All owners</option><option value="unassigned">Unassigned</option>{options.staff.map(staff=><option key={staff.user_id} value={staff.user_id}>{staff.role} · {staff.user_id.slice(0,8)}</option>)}</select></label>
   <label className="field">Show<select className="input" name="show" defaultValue={String(filters.show??'')}><option value="">Active leads</option><option value="archived">Archived leads</option></select></label>
   <button className="button button-primary" type="submit">Apply filters</button>
   {(filters.q||filters.status||filters.show||filters.owner)?<Link className="button button-secondary" href={`/crm/leads?view=${view}`}>Clear</Link>:null}
  </form>
  {view==='board'?<><p className="muted">This board shows the current page of {records.rows.length} leads. Stage counts are for this page.</p><div className="lead-board">{leadStatuses.filter(stage=>!stageFilter||stageFilter===stage).map(stage=>{const leads=records.rows.filter(lead=>lead.status===stage);return <section className="panel lead-stage" data-stage={stage} key={stage} aria-label={`${statusLabel(stage)} leads`}><h2 style={{fontSize:16,marginBottom:16}}>{statusLabel(stage)} <span className="muted">({leads.length})</span></h2>{leads.map(lead=><article className="lead-card" key={lead.id}><Link className="table-title" href={`/crm/leads/${lead.id}`}>{lead.contact_name}</Link><p className="muted">{lead.service}</p><p>{money(lead.budget_cents)}</p><p className="muted">{lead.owner_id?`Owner ${lead.owner_id.slice(0,8)}`:'Unassigned'} · {lead.source??'website'}</p></article>)}{!leads.length?<p className="muted">No leads on this page.</p>:null}</section>;})}</div></>:<div className="panel table-scroll" role="region" aria-label="Leads" tabIndex={0}>
   <table className="data-table"><thead><tr><th scope="col">Contact</th><th scope="col">Service</th><th scope="col">Stage</th><th scope="col">Owner</th><th scope="col">Budget</th><th scope="col">Source</th></tr></thead>
    <tbody>{records.rows.map(lead=><tr key={lead.id}><td><Link className="table-title" href={`/crm/leads/${lead.id}`}>{lead.contact_name}</Link><span className="table-subtitle">{lead.email}</span></td><td>{lead.service}</td><td><span className="work-status" data-status={lead.status}>{statusLabel(lead.status)}</span></td><td>{lead.owner_id?.slice(0,8)??'Unassigned'}</td><td>{money(lead.budget_cents)}</td><td>{lead.source??'website'}</td></tr>)}{!records.rows.length?<tr><td colSpan={6}>No leads match these filters.</td></tr>:null}</tbody>
   </table>
  </div>}
  <Pages {...records} base="/crm/leads" filters={filters}/>
 </>;
}
