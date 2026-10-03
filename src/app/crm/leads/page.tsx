import Link from 'next/link';
import {listRows,type SearchParams} from '@/lib/data';
import {leadStatuses,money,statusLabel,type Lead} from '@/lib/domain';
import {Heading,Pages} from '../workspace-ui';

export default async function Page({searchParams}:{searchParams:Promise<SearchParams>}){
 const filters=await searchParams;
 const records=await listRows<Lead>('leads',filters);
 return <>
  <Heading title="Leads"/>
  <form className="list-filters">
   <label className="field">Contact name<input className="input" name="q" placeholder="Search contacts" defaultValue={String(filters.q??'')}/></label>
   <label className="field">Stage<select className="input" name="status" defaultValue={String(filters.status??'')}><option value="">All stages</option>{leadStatuses.map(stage=><option key={stage} value={stage}>{statusLabel(stage)}</option>)}</select></label>
   <label className="field">Show<select className="input" name="show" defaultValue={String(filters.show??'')}><option value="">Active leads</option><option value="archived">Archived leads</option></select></label>
   <button className="button button-primary" type="submit">Apply filters</button>
   {(filters.q||filters.status||filters.show)&&<Link className="button button-secondary" href="/crm/leads">Clear</Link>}
  </form>
  <div className="panel table-scroll" role="region" aria-label="Leads" tabIndex={0}>
   <table className="data-table"><thead><tr><th scope="col">Contact</th><th scope="col">Service</th><th scope="col">Stage</th><th scope="col">Budget</th></tr></thead>
    <tbody>{records.rows.map(lead=><tr key={lead.id}><td><Link className="table-title" href={`/crm/leads/${lead.id}`}>{lead.contact_name}</Link><span className="table-subtitle">{lead.email}</span></td><td>{lead.service}</td><td>{statusLabel(lead.status)}</td><td>{money(lead.budget_cents)}</td></tr>)}{!records.rows.length&&<tr><td colSpan={4}>No leads match these filters.</td></tr>}</tbody>
   </table>
  </div>
  <Pages {...records} base="/crm/leads" filters={filters}/>
 </>;
}
