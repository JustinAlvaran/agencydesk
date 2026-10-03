import Link from 'next/link';
import {listRows} from '@/lib/data';
import {statusLabel,type Project,type Proposal} from '@/lib/domain';
import {Heading} from '@/app/crm/workspace-ui';

export default async function Page(){
 const [projects,proposals]=await Promise.all([listRows<Project>('projects',{},true),listRows<Proposal>('proposal_series',{},true)]);
 return <>
  <Heading title="Portal"/>
  <section className="record-section"><div className="section-title"><h2>Proposals</h2><Link href="/portal/proposals">View all proposals</Link></div>
   <div className="panel table-scroll" role="region" aria-label="Recent proposals" tabIndex={0}><table className="data-table"><thead><tr><th scope="col">Title</th><th scope="col">Created</th></tr></thead><tbody>
    {proposals.rows.map(proposal=><tr key={proposal.id}><td><Link className="table-title" href={`/portal/proposals/${proposal.id}`}>{proposal.title}</Link></td><td>{new Date(proposal.created_at).toLocaleDateString('en-US',{timeZone:'Asia/Manila'})}</td></tr>)}
    {!proposals.rows.length&&<tr><td colSpan={2}>No proposals have been shared with your company.</td></tr>}
   </tbody></table></div>
  </section>
  <section className="record-section"><div className="section-title"><h2>Projects</h2><Link href="/portal/projects">View all projects</Link></div>
   <div className="panel table-scroll" role="region" aria-label="Recent projects" tabIndex={0}><table className="data-table"><thead><tr><th scope="col">Project</th><th scope="col">Status</th></tr></thead><tbody>
    {projects.rows.map(project=><tr key={project.id}><td><Link className="table-title" href={`/portal/projects/${project.id}`}>{project.name??project.title}</Link></td><td>{statusLabel(project.status)}</td></tr>)}
    {!projects.rows.length&&<tr><td colSpan={2}>No projects yet.</td></tr>}
   </tbody></table></div>
  </section>
 </>;
}
