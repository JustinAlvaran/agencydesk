import Link from 'next/link';
import {leadStatuses,money,statusLabel,type Lead} from '@/lib/domain';
import {ActionForm} from '@/app/crm/action-form';
import {moveLeadStage} from '@/app/crm/lead-stage-action';
import styles from './lead-workspace.module.css';

export function LeadWorkspace({leads,total,view='board',stageFilter='',returnTo='/crm/leads',readOnly=false}:{leads:Lead[];total:number;view?:'board'|'table';stageFilter?:string;returnTo?:string;readOnly?:boolean}){
 const href=(id:string)=>`/crm/leads/${id}?returnTo=${encodeURIComponent(returnTo)}`;
 return <div className={styles.workspace}>
  <header className={styles.summary}><h2>{view==='board'?'Your pipeline':'All leads'}</h2><p>{leads.length} on this page · {total} matching {total===1?'lead':'leads'}</p></header>
  {view==='board'?<><p className="muted">Stage counts describe this page. Open a lead to review its conversation and next steps.</p><div className={styles.board} role="region" aria-label="Lead pipeline stages">{leadStatuses.filter(stage=>!stageFilter||stageFilter===stage).map(stage=>{
   const records=leads.filter(lead=>lead.status===stage);
   return <section className={styles.column} key={stage} aria-label={`${statusLabel(stage)} leads`}><h3>{statusLabel(stage)} <span aria-label={`${records.length} on this page`}>{records.length}</span></h3><div className={styles.cards}>{records.map(lead=><article className={styles.card} key={lead.id}>
    <div className={styles.identity}><span className={styles.avatar} aria-hidden="true">{lead.contact_name.slice(0,1).toUpperCase()}</span><Link href={href(lead.id)}>{lead.contact_name}</Link></div>
    <p className={styles.service}>{lead.service}</p><span className={styles.budget}>{money(lead.budget_cents)}</span>
    <p className={styles.meta}>{lead.owner_id?`Owner ${lead.owner_id.slice(0,8)}`:'Unassigned'}</p><p className={styles.meta}><span className={styles.source}>{lead.source??'website'}</span><time dateTime={lead.created_at}>{new Date(lead.created_at).toLocaleDateString('en-US',{timeZone:'Asia/Manila',month:'short',day:'numeric',year:'numeric'})}</time></p>
    {!readOnly&&!lead.archived_at&&lead.status!=='won'?<div className={styles.stageForm}><ActionForm key={`${lead.id}-${lead.status}`} action={moveLeadStage}><input type="hidden" name="id" value={lead.id}/><input type="hidden" name="expected_status" value={lead.status}/><label>Move {lead.contact_name} to stage<select className="input" name="status" defaultValue={lead.status}>{leadStatuses.filter(value=>value!=='won').map(value=><option value={value} key={value}>{statusLabel(value)}</option>)}</select></label><button type="submit" className="button button-secondary">Update stage</button></ActionForm></div>:null}
    {lead.status==='won'?<p className={styles.meta}>Won through proposal acceptance</p>:null}
   </article>)}</div>{!records.length?<div className={styles.empty}><strong>No {statusLabel(stage).toLowerCase()} leads on this page</strong>{readOnly?'No records are loaded in this design preview.':'Adjust the filters or add a genuine inquiry to begin.'}</div>:null}</section>;
  })}</div></>:<div className={styles.tableWrap} role="region" aria-label="Leads table" tabIndex={0}><table className="data-table"><thead><tr>{['Contact','Service','Stage','Owner','Budget','Source'].map(title=><th scope="col" key={title}>{title}</th>)}</tr></thead><tbody>{leads.map(lead=><tr key={lead.id}><td><Link className="table-title" href={href(lead.id)}>{lead.contact_name}</Link><span className="table-subtitle">{lead.email}</span></td><td>{lead.service}</td><td><span className="work-status" data-status={lead.status}>{statusLabel(lead.status)}</span></td><td>{lead.owner_id?.slice(0,8)??'Unassigned'}</td><td>{money(lead.budget_cents)}</td><td>{lead.source??'website'}</td></tr>)}{!leads.length?<tr><td colSpan={6}>No leads match these filters.</td></tr>:null}</tbody></table></div>}
 </div>;
}
