import Link from 'next/link';
import {ActionForm} from '@/app/crm/action-form';
import {choices,listFollowUpTasks,type SearchParams} from '@/lib/data';
import {createTask,completeTask} from '@/app/actions';
import {Heading,Field,Submit,Pages} from '../workspace-ui';

export default async function Page({searchParams}:{searchParams:Promise<SearchParams>}){
 const filters=await searchParams;
 const [records,options]=await Promise.all([listFollowUpTasks(filters),choices()]);
 const now=new Date(records.queriedAt).getTime();
 const ownerLabel=(id:string|null)=>{if(!id)return 'Unassigned';if(id===records.userId)return 'You';const staff=options.staff.find(person=>person.user_id===id);return `${staff?.role??'Staff'} · ${id.slice(0,8)}`;};
 return <>
  <Heading title="Tasks" description="Open follow-ups appear earliest due first. Times are shown in Asia/Manila."/>
  <form className="list-filters" aria-label="Task filters">
   <label className="field">Status<select className="input" name="status" defaultValue={records.status}><option value="open">Open tasks</option><option value="overdue">Overdue tasks</option><option value="completed">Completed tasks</option><option value="all">All tasks</option></select></label>
   <label className="field">Assigned to<select className="input" name="owner" defaultValue={records.owner}><option value="">All staff</option><option value="mine">Assigned to me</option><option value="unassigned">Unassigned</option></select></label>
   <button className="button button-primary" type="submit">Apply filters</button>
   {(records.status!=='open'||records.owner)?<Link className="button button-secondary" href="/crm/tasks">Clear</Link>:null}
  </form>
  <div className="panel table-scroll" role="region" aria-label="Tasks" tabIndex={0}>
   <table className="data-table"><thead><tr><th scope="col">Task</th><th scope="col">Lead</th><th scope="col">Due (Manila)</th><th scope="col">Assigned to</th><th scope="col">Status</th><th scope="col">Action</th></tr></thead><tbody>
    {records.rows.map(task=>{const overdue=!task.completed_at&&!!task.due_at&&new Date(task.due_at).getTime()<now;return <tr className="task-data-row" data-overdue={overdue||undefined} key={task.id}><td className="table-title">{task.title}</td><td>{task.lead?<Link href={`/crm/leads/${task.lead.id}`}>{task.lead.contact_name}</Link>:'Unavailable'}</td><td>{task.due_at?<time dateTime={task.due_at}>{new Date(task.due_at).toLocaleString('en-US',{timeZone:'Asia/Manila',dateStyle:'medium',timeStyle:'short'})}</time>:'Not set'}</td><td>{ownerLabel(task.assigned_to)}</td><td><span className="work-status" data-status={task.completed_at?'completed':overdue?'overdue':'open'}>{task.completed_at?'Completed':overdue?'Overdue':'Open'}</span></td><td>{!task.completed_at&&<ActionForm action={completeTask}><input type="hidden" name="id" value={task.id}/><Submit>Mark complete</Submit></ActionForm>}</td></tr>;})}
    {!records.rows.length&&<tr><td colSpan={6}>No tasks match these filters.</td></tr>}
   </tbody></table>
  </div>
  <Pages {...records} base="/crm/tasks" filters={{status:records.status,owner:records.owner}}/>
  <details className="create-record"><summary>Create task</summary>
   <ActionForm action={createTask}><div className="form-grid">
    <Field name="title" label="Task title"/>
    <label className="field">Lead<select className="input" name="lead_id" required><option value="">Choose a lead</option>{options.leads.map(lead=><option key={lead.id} value={lead.id}>{lead.contact_name}</option>)}</select></label>
    <Field name="due_at" label="Due date and time (Manila)" type="datetime-local"/>
    <label className="field">Assigned to<select className="input" name="assigned_to"><option value="">Unassigned</option>{options.staff.map(staff=><option key={staff.user_id} value={staff.user_id}>{staff.role} · {staff.user_id.slice(0,8)}</option>)}</select></label>
   </div><Submit>Create task</Submit></ActionForm>
  </details>
 </>;
}
