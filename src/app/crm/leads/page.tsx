import Link from 'next/link';
import { choices, type SearchParams } from '@/lib/data';
import { listLeads } from '@/lib/leads/query';
import { leadStatuses, statusLabel } from '@/lib/domain';
import { Heading, Pages } from '../workspace-ui';
import { LeadWorkspace } from '@/components/lead-workspace';
import { leadListReturn } from '@/lib/leads/navigation';
import styles from '@/components/lead-workspace.module.css';

export default async function Page({searchParams}:{searchParams:Promise<SearchParams>}) {
 const filters = await searchParams;
 const [records,options] = await Promise.all([listLeads(filters),choices()]);
 const view = filters.view === 'table' ? 'table' : 'board';
 const stageFilter = typeof filters.status === 'string' && leadStatuses.includes(filters.status as typeof leadStatuses[number]) ? filters.status : '';
 const viewUrl = (next:string) => {const params=new URLSearchParams();for(const [key,value] of Object.entries(filters)) if(typeof value==='string')params.set(key,value);params.set('view',next);return `/crm/leads?${params}`;};
 return <>
  <Heading title="Leads" description="Track inquiries, record calls, and plan follow-ups."/>
  <div className={styles.toolbar}><Link className="button button-primary" href="/crm/leads/new">Add lead</Link><nav aria-label="Lead view" style={{display:'flex',gap:8}}><Link className={`button button-${view==='table'?'primary':'secondary'}`} aria-current={view==='table'?'page':undefined} href={viewUrl('table')}>Table</Link><Link className={`button button-${view==='board'?'primary':'secondary'}`} aria-current={view==='board'?'page':undefined} href={viewUrl('board')}>Board</Link></nav></div>
  <div className={styles.filters}><form className="list-filters" aria-label="Lead filters">
   <input type="hidden" name="view" value={view}/>
   <label className="field">Contact name<input className="input" name="q" placeholder="Search contacts" defaultValue={typeof filters.q==='string'?filters.q:''}/></label>
   <label className="field">Stage<select className="input" name="status" defaultValue={String(filters.status??'')}><option value="">All stages</option>{leadStatuses.map(stage=><option key={stage} value={stage}>{statusLabel(stage)}</option>)}</select></label>
   <label className="field">Owner<select className="input" name="owner" defaultValue={String(filters.owner??'')}><option value="">All owners</option><option value="unassigned">Unassigned</option>{options.staff.map(staff=><option key={staff.user_id} value={staff.user_id}>{staff.role} · {staff.user_id.slice(0,8)}</option>)}</select></label>
   <label className="field">Show<select className="input" name="show" defaultValue={String(filters.show??'')}><option value="">Active leads</option><option value="archived">Archived leads</option></select></label>
   <button className="button button-primary" type="submit">Apply filters</button>
   {(filters.q||filters.status||filters.show||filters.owner)?<Link className="button button-secondary" href={`/crm/leads?view=${view}`}>Clear</Link>:null}
  </form></div>
  <LeadWorkspace leads={records.rows} total={records.count} view={view} stageFilter={stageFilter} returnTo={leadListReturn(viewUrl(view))}/>
  <Pages {...records} base="/crm/leads" filters={filters}/>
 </>;
}
