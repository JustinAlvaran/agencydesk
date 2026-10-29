import Link from 'next/link';
import {ArrowRight,ArrowUpRight,BriefcaseBusiness,CheckSquare,Clock3,FileCheck2,Inbox,Layers3,PanelsTopLeft} from 'lucide-react';
import type {DashboardData} from '@/lib/domain';
import {money,statusLabel} from '@/lib/domain';
import {demoDashboard} from '@/lib/fixtures';
import {overviewPreview} from '@/lib/workspace-overview';
import styles from './workspace-dashboard.module.css';

type Props={readOnly?:true;data?:DashboardData}|{readOnly:false;data:DashboardData};
const formatDate=(value?:string|null)=>value&&Number.isFinite(Date.parse(value))?new Date(value).toLocaleDateString('en-US',{month:'short',day:'numeric',year:'numeric',timeZone:'UTC'}):'No due date';

function Empty({title,copy}:{title:string;copy:string}) {
  return <div className={styles.empty}><Inbox size={25} aria-hidden='true'/><h3>{title}</h3><p>{copy}</p></div>;
}

export function DashboardView(props:Props) {
  const readOnly=props.readOnly!==false;
  const data=props.data??(readOnly?demoDashboard:null);
  if(!data)throw new Error('Workspace data is required.');
  const base=readOnly?'/demo':'/crm';
  const preview=overviewPreview(data);
  const metrics=[
    {label:'Open leads',value:data.openLeads.toLocaleString('en-US'),icon:PanelsTopLeft,detail:'Across your active pipeline'},
    {label:'Pipeline value',value:money(data.pipelineValue),icon:Layers3,detail:'Open opportunity budgets'},
    {label:'Accepted contract value',value:money(data.acceptedValue),icon:FileCheck2,detail:'Agreed proposal value'},
    {label:'Overdue tasks',value:data.overdueTasks.toLocaleString('en-US'),icon:Clock3,detail:'Follow-ups needing attention'},
  ];
  return <div className={styles.dashboard}>
    <section className={styles.intro} aria-labelledby='overview-title'>
      <div><p className={styles.eyebrow}>AGENCY OPERATIONS</p><h1 id='overview-title'>Overview</h1><p className={styles.introCopy}>A clearer picture. A better next step.</p></div>
      <Link className={styles.primaryAction} href={`${base}/tasks`}>View tasks <ArrowUpRight size={16} aria-hidden='true'/></Link>
    </section>
    <section aria-label='Workspace totals'><dl className={styles.metrics}>{metrics.map(({label,value,icon:Icon,detail},index)=><div className={styles.metric} data-primary={index===0||undefined} key={label}><dt className={styles.metricTop}><span>{label}</span><span className={styles.metricIcon}><Icon size={17} aria-hidden='true'/></span></dt><dd>{value}</dd><dd className={styles.metricDetail}>{detail}</dd></div>)}</dl></section>
    <div className={styles.mainGrid}>
      <section className={styles.panel} aria-labelledby='next-moves-title'>
        <header className={styles.panelHeader}><div><p className={styles.eyebrow}>KEEP THINGS MOVING</p><h2 id='next-moves-title'>Your next moves</h2></div><Link href={`${base}/tasks`}>All tasks <ArrowRight size={15} aria-hidden='true'/></Link></header>
        {preview.tasks.length?<ol className={styles.taskList}>{preview.tasks.map(task=><li key={task.id}><Link href={task.lead_id?`${base}/leads/${task.lead_id}`:`${base}/tasks`}><span className={styles.taskIcon}><CheckSquare size={17} aria-hidden='true'/></span><span className={styles.taskText}><strong>{task.title}</strong><span><Clock3 size={12} aria-hidden='true'/>{formatDate(task.due_at)}</span></span><ArrowUpRight className={styles.rowArrow} size={16} aria-hidden='true'/></Link></li>)}</ol>:<Empty title='No open follow-ups in this preview' copy='Open the task list to review all scheduled work.'/>}
        <p className={styles.previewNote}>Up to four open tasks from the latest loaded records, ordered by due date.</p>
      </section>
      <section className={styles.panel} aria-labelledby='pipeline-title'>
        <header className={styles.panelHeader}><div><p className={styles.eyebrow}>CONVERSATIONS TO OPPORTUNITIES</p><h2 id='pipeline-title'>Pipeline snapshot</h2></div><span className={styles.headingIcon}><PanelsTopLeft size={18} aria-hidden='true'/></span></header>
        {preview.leads.length?<ul className={styles.leadList}>{preview.leads.map(lead=><li key={lead.id}><Link href={`${base}/leads/${lead.id}`}><span className={styles.leadInitial} aria-hidden='true'>{lead.contact_name.trim().slice(0,1).toUpperCase()||'•'}</span><span className={styles.leadIdentity}><strong>{lead.contact_name}</strong><span>{lead.service}</span></span><span className={styles.stage} data-stage={lead.status}>{statusLabel(lead.status)}</span></Link></li>)}</ul>:<Empty title='No open leads in this preview' copy='New inquiries appear here once they enter your pipeline.'/>}
        <footer className={styles.panelFooter}><p>Latest loaded, active leads. See the full pipeline for every record.</p><Link href={`${base}/leads`}>View pipeline <ArrowRight size={14} aria-hidden='true'/></Link></footer>
      </section>
    </div>
    <section className={styles.projectsSection} aria-labelledby='projects-title'>
      <header className={styles.sectionHeader}><div><p className={styles.eyebrow}>FROM PROMISE TO PROGRESS</p><h2 id='projects-title'>Active projects</h2></div><Link href={`${base}/projects`}>All projects <ArrowRight size={15} aria-hidden='true'/></Link></header>
      {preview.projects.length?<div className={styles.projectGrid}>{preview.projects.map(project=><Link className={styles.project} href={`${base}/projects/${project.id}`} key={project.id}><div className={styles.projectTop}><span className={styles.projectIcon}><BriefcaseBusiness size={19} aria-hidden='true'/></span><span className={styles.stage} data-stage='active'>Active</span><ArrowUpRight size={16} className={styles.projectArrow} aria-hidden='true'/></div><h3>{project.name??project.title}</h3>{project.client_name&&<p>{project.client_name}</p>}<div className={styles.projectMeta}><span>Due {formatDate(project.due_date)}</span>{typeof project.progress==='number'&&Number.isFinite(project.progress)&&project.progress>=0&&project.progress<=100&&<span>{project.progress}% complete</span>}</div>{typeof project.progress==='number'&&Number.isFinite(project.progress)&&project.progress>=0&&project.progress<=100&&<div className={styles.progress} aria-hidden='true'><span style={{width:`${project.progress}%`}}/></div>}</Link>)}</div>:<div className={styles.panel}><Empty title='No active projects in this preview' copy='An accepted proposal starts its linked project. Open all projects to review the complete list.'/></div>}
      <p className={styles.previewNote}>Project previews use the latest loaded records. Totals above cover the workspace.</p>
    </section>
  </div>;
}
