import { randomUUID } from 'node:crypto';
import Link from 'next/link';
import { choices } from '@/lib/data';
import { ActionForm } from '../../action-form';
import { createManualLead } from '../../lead-actions';
import { Heading, Panel, Submit } from '../../workspace-ui';
import { ContactFields } from '../contact-fields';
export default async function Page() {
 const options = await choices();
 return <><Heading title="Add lead" description="Capture an inquiry, referral, or prospect and assign a next step."/><Link href="/crm/leads" className="button button-secondary" style={{marginBottom:20}}>Back to leads</Link><Panel title="Lead details"><ActionForm key={randomUUID()} action={createManualLead}><input type="hidden" name="action_id" value={randomUUID()}/><ContactFields/>
  <label className="field" style={{marginBottom:16}}>Source<input name="source" className="input" defaultValue="manual" maxLength={80} required/></label>
  <label className="field" style={{marginBottom:16}}>Owner<select name="owner_id" className="input"><option value="">Unassigned</option>{options.staff.map(staff=><option value={staff.user_id} key={staff.user_id}>{staff.role} · {staff.user_id.slice(0,8)}</option>)}</select></label>
  <label className="field" style={{marginBottom:16}}>Client company<select name="company_id" className="input"><option value="">Not yet linked</option>{options.companies.map(company=><option value={company.id} key={company.id}>{company.name}</option>)}</select></label>
  <Submit>Create lead</Submit>
 </ActionForm></Panel></>;
}
