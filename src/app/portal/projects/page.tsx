import Link from 'next/link';
import {listRows,type SearchParams} from '@/lib/data';
import {statusLabel,type Project} from '@/lib/domain';
import {Heading,Pages} from '@/app/crm/workspace-ui';

export default async function Page({searchParams}:{searchParams:Promise<SearchParams>}){
 const records=await listRows<Project>('projects',await searchParams,true);
 return <>
  <Heading title="Projects"/>
  <div className="panel table-scroll" role="region" aria-label="Your projects" tabIndex={0}><table className="data-table"><thead><tr><th scope="col">Project</th><th scope="col">Status</th><th scope="col">Created</th></tr></thead><tbody>
   {records.rows.map(project=><tr key={project.id}><td><Link className="table-title" href={`/portal/projects/${project.id}`}>{project.name??project.title}</Link></td><td>{statusLabel(project.status)}</td><td>{new Date(project.created_at).toLocaleDateString('en-US',{timeZone:'Asia/Manila'})}</td></tr>)}
   {!records.rows.length&&<tr><td colSpan={3}>No projects have been shared with your company.</td></tr>}
  </tbody></table></div>
  <Pages {...records} base="/portal/projects"/>
 </>;
}
