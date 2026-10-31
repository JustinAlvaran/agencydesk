import Link from 'next/link';
import {ActionForm} from '@/app/crm/action-form';
import {createTask,completeTask} from '@/app/actions';
import {Field,Submit} from '@/app/crm/workspace-ui';
import type {Task} from '@/lib/domain';
import styles from './lead-workspace.module.css';

export function LeadNextActions({leadId,ownerId,archived,tasks,total,queriedAt,userId,staff}:{leadId:string;ownerId:string|null;archived:boolean;tasks:Task[];total:number;queriedAt:string;userId:string;staff:{user_id:string;role:string}[]}){
 return <section className={`${styles.contact} ${styles.tasks}`} aria-labelledby="lead-next-actions"><h2 id="lead-next-actions">Next actions</h2><p>{total} open {total===1?'task':'tasks'} · earliest due first</p>
  {tasks.length?<ul className={styles.taskList}>{tasks.map(task=>{const overdue=!!task.due_at&&new Date(task.due_at).getTime()<new Date(queriedAt).getTime();return <li key={task.id}><strong>{task.title}</strong><p>{overdue?'Overdue · ':''}{task.due_at?<time dateTime={task.due_at}>{new Date(task.due_at).toLocaleString('en-US',{timeZone:'Asia/Manila',dateStyle:'medium',timeStyle:'short'})}</time>:'No due date'}<br/>{task.assigned_to===userId?'Assigned to you':task.assigned_to?`Owner ${task.assigned_to.slice(0,8)}`:'Unassigned'}</p><ActionForm action={completeTask}><input type="hidden" name="id" value={task.id}/><Submit>Mark complete</Submit></ActionForm></li>;})}</ul>:<p>No open tasks. Set a clear next step after your conversation.</p>}
  {total>tasks.length?<p>Showing the earliest {tasks.length} of {total} open tasks.</p>:null}
  {!archived?<details><summary>Add a follow-up task</summary><ActionForm action={createTask}><input type="hidden" name="lead_id" value={leadId}/><Field name="title" label="Task title"/><Field name="due_at" label="Due date and time (Manila)" type="datetime-local"/><label className="field">Assigned to<select className="input" name="assigned_to" defaultValue={staff.some(person=>person.user_id===ownerId)?ownerId??'':''}><option value="">Unassigned</option>{staff.map(person=><option key={person.user_id} value={person.user_id}>{person.role} · {person.user_id.slice(0,8)}</option>)}</select></label><p>This is an internal reminder, not a calendar reservation or automatic message.</p><Submit>Create task</Submit></ActionForm></details>:<p>Restore this archived lead before adding another follow-up.</p>}
  <p><Link href="/crm/tasks">Open task workspace</Link></p>
 </section>;
}
