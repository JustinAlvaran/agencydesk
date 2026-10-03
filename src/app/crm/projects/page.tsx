import Link from 'next/link';
import {choices,listRows,type SearchParams} from '@/lib/data';
import {statusLabel,type Project} from '@/lib/domain';
import {Heading,Pages} from '../workspace-ui';

export default async function Page({searchParams}:{searchParams:Promise<SearchParams>}){
 const records=await listRows<Project>('projects',await searchParams);
 const options=await choices();
 return <>
  <Heading title="Projects" description="Accepting a proposal creates a project."/>
  <div className="panel table-scroll" role="region" aria-label="Projects" tabIndex={0}>
   <table className="data-table"><thead><tr><th scope="col">Project</th><th scope="col">Company</th><th scope="col">Status</th><th scope="col">Created</th></tr></thead><tbody>
    {records.rows.map(project=><tr key={project.id}><td><Link className="table-title" href={`/crm/projects/${project.id}`}>{project.name??project.title}</Link></td><td>{options.companies.find(company=>company.id===project.company_id)?.name??'Unavailable'}</td><td>{statusLabel(project.status)}</td><td>{new Date(project.created_at).toLocaleDateString('en-US',{timeZone:'Asia/Manila'})}</td></tr>)}
    {!records.rows.length&&<tr><td colSpan={4}>No projects yet. Projects appear after a client accepts a proposal.</td></tr>}
   </tbody></table>
  </div>
  <Pages {...records} base="/crm/projects"/>
 </>;
}
