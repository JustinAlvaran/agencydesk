import {ActionForm} from '@/app/crm/action-form';
import {choices,listRows,type SearchParams} from '@/lib/data';
import type {Task} from '@/lib/domain';
import {createTask,completeTask} from '@/app/actions';
import {Heading,Field,Submit,Pages} from '../workspace-ui';

export default async function Page({searchParams}:{searchParams:Promise<SearchParams>}){
 const records=await listRows<Task>('follow_up_tasks',await searchParams);
 const options=await choices();
 return <>
  <Heading title="Tasks"/>
  <div className="panel table-scroll" role="region" aria-label="Tasks" tabIndex={0}>
   <table className="data-table"><thead><tr><th scope="col">Task</th><th scope="col">Lead</th><th scope="col">Due (Manila)</th><th scope="col">Status</th><th scope="col">Action</th></tr></thead><tbody>
    {records.rows.map(task=><tr key={task.id}><td className="table-title">{task.title}</td><td>{options.leads.find(lead=>lead.id===task.lead_id)?.contact_name??'Unavailable'}</td><td>{task.due_at?new Date(task.due_at).toLocaleString('en-US',{timeZone:'Asia/Manila',dateStyle:'medium',timeStyle:'short'}):'Not set'}</td><td>{task.completed_at?'Completed':'Open'}</td><td>{!task.completed_at&&<ActionForm action={completeTask}><input type="hidden" name="id" value={task.id}/><Submit>Mark complete</Submit></ActionForm>}</td></tr>)}
    {!records.rows.length&&<tr><td colSpan={5}>No tasks yet.</td></tr>}
   </tbody></table>
  </div>
  <Pages {...records} base="/crm/tasks"/>
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
