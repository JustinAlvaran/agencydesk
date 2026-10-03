import Link from 'next/link';
import {ActionForm} from '@/app/crm/action-form';
import {choices,listRows,type SearchParams} from '@/lib/data';
import type {Proposal} from '@/lib/domain';
import {createProposal} from '@/app/actions';
import {Heading,Field,Submit,Pages} from '../workspace-ui';

export default async function Page({searchParams}:{searchParams:Promise<SearchParams>}){
 const records=await listRows<Proposal>('proposal_series',await searchParams);
 const options=await choices();
 return <>
  <Heading title="Proposals"/>
  <div className="panel table-scroll" role="region" aria-label="Proposals" tabIndex={0}>
   <table className="data-table"><thead><tr><th scope="col">Title</th><th scope="col">Company</th><th scope="col">Created</th></tr></thead><tbody>
    {records.rows.map(proposal=><tr key={proposal.id}><td><Link className="table-title" href={`/crm/proposals/${proposal.id}`}>{proposal.title}</Link></td><td>{options.companies.find(company=>company.id===proposal.company_id)?.name??'Unavailable'}</td><td>{new Date(proposal.created_at).toLocaleDateString('en-US',{timeZone:'Asia/Manila'})}</td></tr>)}
    {!records.rows.length&&<tr><td colSpan={3}>No proposals yet.</td></tr>}
   </tbody></table>
  </div>
  <Pages {...records} base="/crm/proposals"/>
  <details className="create-record"><summary>Create proposal</summary>
   <p className="muted">Link the lead to a company before creating its proposal.</p>
   <ActionForm action={createProposal}><div className="form-grid">
    <Field name="title" label="Proposal title"/>
    <label className="field">Lead<select className="input" name="lead_id" required><option value="">Choose a lead</option>{options.leads.map(lead=><option key={lead.id} value={lead.id}>{lead.contact_name}</option>)}</select></label>
    <label className="field">Client company<select className="input" name="company_id" required><option value="">Choose a company</option>{options.companies.map(company=><option key={company.id} value={company.id}>{company.name}</option>)}</select></label>
   </div><Submit>Create proposal</Submit></ActionForm>
  </details>
 </>;
}
