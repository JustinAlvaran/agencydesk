import {ActionForm} from '@/app/crm/action-form';
import {choices,listRows,type SearchParams} from '@/lib/data';
import type {Contact} from '@/lib/domain';
import {createContact} from '@/app/actions';
import {Heading,Field,Submit,Pages} from '../workspace-ui';

export default async function Page({searchParams}:{searchParams:Promise<SearchParams>}){
 const records=await listRows<Contact>('contacts',await searchParams);
 const options=await choices();
 return <>
  <Heading title="Contacts"/>
  <div className="panel table-scroll" role="region" aria-label="Contacts" tabIndex={0}>
   <table className="data-table"><thead><tr><th scope="col">Name</th><th scope="col">Email</th><th scope="col">Company</th></tr></thead><tbody>
    {records.rows.map(contact=><tr key={contact.id}><td className="table-title">{contact.name}</td><td>{contact.email}</td><td>{options.companies.find(company=>company.id===contact.company_id)?.name??'Unavailable'}</td></tr>)}
    {!records.rows.length&&<tr><td colSpan={3}>No contacts yet. Create a contact and company below.</td></tr>}
   </tbody></table>
  </div>
  <Pages {...records} base="/crm/contacts"/>
  <details className="create-record"><summary>Create contact</summary>
   <ActionForm action={createContact}>
    <div className="form-grid"><Field name="company_name" label="Company name"/><Field name="name" label="Contact name"/><Field name="email" label="Email" type="email"/></div>
    <Submit>Create contact and company</Submit>
   </ActionForm>
  </details>
 </>;
}
