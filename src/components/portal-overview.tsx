import Link from 'next/link';
import { ArrowUpRight, FileText, FolderOpen } from 'lucide-react';
import { money, statusLabel, type Project, type Proposal } from '@/lib/domain';
import styles from './portal-overview.module.css';

export function PortalOverview({projects,proposals,readOnly}:{projects:Project[];proposals:Proposal[];readOnly:boolean}) {
  const base = readOnly ? '/demo/portal' : '/portal';
  const sharedProposals = proposals.filter(proposal=>proposal.status!=='draft');
  return <div className={styles.portal}>
    <header className={styles.heading}><p>Your shared workspace</p><h1>Client workspace</h1><p>Your projects, agreed proposals, and shared updates.</p></header>
    <div className={styles.layout}>
      <section aria-labelledby="client-projects"><div className={styles.sectionHeading}><h2 id="client-projects">Your projects</h2>{!readOnly&&<Link href="/portal/projects">View all<ArrowUpRight size={14} aria-hidden/></Link>}</div>
        {projects.length?projects.map(project=>{
          const progress = typeof project.progress==='number'&&Number.isFinite(project.progress)&&project.progress>=0&&project.progress<=100?project.progress:null;
          return <article className={styles.project} key={project.id}><div className={styles.projectHeading}><span className={styles.projectMark} aria-hidden><FolderOpen size={22}/></span><div><h3><Link href={base+'/projects/'+project.id}>{project.name??project.title}</Link></h3><p>{statusLabel(project.status)}</p></div><ArrowUpRight size={18} aria-hidden/></div>
            {progress!==null&&<div className={styles.progressBlock}><div><span>Project progress</span><strong>{progress}%</strong></div><progress value={progress} max={100} aria-label={(project.name??project.title)+' progress'}/></div>}
            <div className={styles.projectFooter}><p>Milestones and shared updates</p><Link href={base+'/projects/'+project.id}>View project<ArrowUpRight size={15} aria-hidden/></Link></div>
          </article>;
        }):<div className={styles.empty}><FolderOpen size={24} aria-hidden/><h3>No projects yet</h3><p>Projects shared with your company will appear here.</p></div>}
      </section>
      <section aria-labelledby="client-proposals"><div className={styles.sectionHeading}><h2 id="client-proposals">Your proposals</h2>{!readOnly&&<Link href="/portal/proposals">View all<ArrowUpRight size={14} aria-hidden/></Link>}</div>
        {sharedProposals.length?sharedProposals.map(proposal=><article className={styles.proposal} key={proposal.id}><FileText size={20} aria-hidden/><div><h3><Link href={base+'/proposals/'+proposal.id}>{proposal.title}</Link></h3><p>{proposal.status?statusLabel(proposal.status):'Shared proposal'}</p>{typeof proposal.total_cents==='number'&&Number.isFinite(proposal.total_cents)&&<strong>{money(proposal.total_cents)}</strong>}<Link className={styles.proposalLink} href={base+'/proposals/'+proposal.id}>View proposal<ArrowUpRight size={14} aria-hidden/></Link></div></article>):<div className={styles.empty}><FileText size={24} aria-hidden/><h3>No shared proposals</h3><p>Proposals shared with your company will appear here.</p></div>}
        <aside className={styles.nextStep}><h3>Keep the next step clear.</h3><p>Open a proposal to review its scope, or a project to see milestones and shared updates.</p></aside>
      </section>
    </div>
  </div>;
}
