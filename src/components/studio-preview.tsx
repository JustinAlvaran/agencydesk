import Link from 'next/link';
import { ArrowUpRight, Circle, LayoutGrid, ArrowRight } from 'lucide-react';
import { demoDashboard } from '@/lib/fixtures';
import styles from '@/app/home.module.css';
import { BrandMark } from './brand-mark';

export function StudioPreview() {
  const data = demoDashboard;
  const project = data.projects[0];
  const metrics = [
    ['Active leads', data.openLeads],
    ['Projects', data.projects.length],
    ['Proposals', data.proposals.length],
    ['Open tasks', data.tasks.filter(task => !task.completed_at).length],
  ] as const;
  return <section className={styles['preview-frame']} aria-label="AgencyDesk workflow preview">
    <div className={styles['preview-top']}><div className={styles['window-dots']} aria-hidden><i/><i/><i/></div><span>AgencyDesk / Workspace</span><span className={styles['preview-demo']}>Fictional demo</span></div>
    <div className={styles['preview-body']}>
      <aside className={styles['preview-sidebar']} aria-label="Illustrative workspace navigation">
        <span className={styles.brand}><BrandMark size={26}/>AgencyDesk</span>
        <span className={styles['preview-agency']}>STUDIO WORKSPACE</span>
        {['Overview', 'Leads', 'Projects', 'Tasks', 'Proposals', 'Contacts'].map((label,index)=><div className={index===0?styles.selected:undefined} key={label}><LayoutGrid size={13} aria-hidden/>{label}</div>)}
      </aside>
      <div className={styles['preview-content']}>
        <div className={styles['preview-breadcrumb']}>Workspace <span>/</span> Overview</div>
        <div className={styles['preview-heading']}><div><h3>Your work, in view.</h3><p>Follow-ups, proposals, and delivery in one place.</p></div><Link className={styles['preview-action']} href="/demo">Open demo<ArrowUpRight size={13} aria-hidden/></Link></div>
        <dl className={styles['preview-stats']}>{metrics.map(([label,value])=><div key={label}><dt><span>{label}</span></dt><dd><strong>{String(value).padStart(2,'0')}</strong></dd></div>)}</dl>
        <div className={styles['preview-columns']}>
          <section><h4 className={styles['preview-section-title']}>Next follow-ups</h4>{data.tasks.slice(0,3).map(task=><div className={styles['preview-task']} key={task.id}><Circle size={15} aria-hidden/><div><strong>{task.title}</strong><span>Sample task</span></div></div>)}</section>
          {project&&<section><h4 className={styles['preview-section-title']}>Project delivery</h4><div className={styles['preview-project']}><span className={styles['project-monogram']} aria-hidden>F.</span><div><strong>{project.client_name}</strong><span>{project.title}</span></div><small>{project.progress}%</small></div><div className={styles.progress} aria-hidden><span style={{width:project.progress+'%'}}/></div><div className={styles['preview-milestone']}>Discovery<ArrowRight size={12} aria-hidden/><strong>Design</strong><ArrowRight size={12} aria-hidden/>Build</div><p className={styles['preview-project-note']}>Shared with the client<Link href="/demo/portal">View portal<ArrowUpRight size={12} aria-hidden/></Link></p></section>}
        </div>
      </div>
    </div>
    <p className={styles['preview-note']}>Illustrative interface with fictional records. Explore the demo to try the workspace.</p>
  </section>;
}
