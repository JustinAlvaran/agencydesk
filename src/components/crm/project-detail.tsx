import {DeliverableUpload} from "./deliverable-upload";
import Link from 'next/link';
import {notFound} from 'next/navigation';
import {z} from 'zod';
import {requireUser} from '@/lib/auth';
import {databaseError} from '@/lib/http';
import {MutationForm,fieldClass} from './mutation-form';
export async function ProjectDetail({id}:{id:string}){
 if(!z.uuid().safeParse(id).success)notFound();const {supabase,user}=await requireUser();
 const [project,milestones,sprints,staff]=await Promise.all([supabase.from('projects').select('*').eq('id',id).maybeSingle(),supabase.from('milestones').select('*').eq('project_id',id).order('position'),supabase.from('sprints').select('*').eq('project_id',id).order('starts_at'),supabase.from('staff_members').select('role').eq('user_id',user.id).eq('active',true).maybeSingle()]);
 for(const result of [project,milestones,sprints,staff])databaseError(result.error);if(!project.data)notFound();
 const membership=await supabase.from('client_memberships').select('can_accept_proposals').eq('user_id',user.id).eq('company_id',project.data.company_id).eq('active',true).maybeSingle();databaseError(membership.error);
 const files=await supabase.from('deliverables').select('id,name').eq('project_id',id).order('created_at',{ascending:false});databaseError(files.error);
 return <div className="flex flex-col gap-6"><Link className="text-sm text-primary" href={staff.data?'/crm/projects':'/portal'}>Back to projects</Link><h1 className="text-3xl font-bold">{project.data.name}</h1>
 <div className="grid md:grid-cols-2 gap-4">{(sprints.data??[]).map(s=><section key={s.id} className="rounded-2xl p-5 border border-gray-200 dark:border-zinc-800"><h2 className="font-bold">{s.title}</h2><p className="text-sm text-gray-500">{s.starts_at} – {s.ends_at}</p></section>)}</div>
 <section className="rounded-3xl p-6 border border-gray-200 dark:border-zinc-800"><h2 className="font-bold mb-4">Deliverables</h2>{(files.data??[]).map(file=><a key={file.id} href={`/api/deliverables/${file.id}`} className="block py-2 text-primary text-sm">Download {file.name}</a>)}{!files.data?.length&&<p className="text-sm text-gray-500 mb-4">No deliverables uploaded yet.</p>}{staff.data&&<DeliverableUpload projectId={id}/>}</section>
 {(milestones.data??[]).map(m=><section key={m.id} className="rounded-3xl p-6 bg-white dark:bg-zinc-900/80 border border-gray-200 dark:border-zinc-800 flex flex-col gap-3"><h2 className="font-bold">{m.title}</h2><p className="text-sm">{m.review_status.replaceAll('_',' ')} · {m.due_at?.slice(0,10)||'Not scheduled'}</p>{m.feedback&&<p className="text-sm text-gray-500">Client feedback: {m.feedback}</p>}
 {staff.data&&m.review_status!=='approved'&&<MutationForm command="submit_review" id={m.id} label="Submit for client review"/>}
 {membership.data?.can_accept_proposals&&m.review_status==='review'&&<MutationForm command="review" id={m.id} label="Submit review"><label className="text-sm">Decision<select name="decision" className={fieldClass}><option value="approve">Approve milestone</option><option value="changes">Request changes</option></select></label><label className="text-sm">Feedback<textarea name="feedback" maxLength={4000} className={fieldClass}/></label></MutationForm>}
 </section>)}
 {staff.data&&<div className="grid md:grid-cols-2 gap-6"><details className="rounded-3xl p-6 border border-gray-200 dark:border-zinc-800"><summary className="font-bold mb-4">Add milestone</summary><MutationForm command="milestone" id={id}><label>Title<input required name="title" maxLength={200} className={fieldClass}/></label><label>Due date<input required name="due" type="date" className={fieldClass}/></label></MutationForm></details>
 <details className="rounded-3xl p-6 border border-gray-200 dark:border-zinc-800"><summary className="font-bold mb-4">Plan sprint</summary><MutationForm command="sprint" id={id}><label>Title<input required name="title" maxLength={200} className={fieldClass}/></label><label>Start<input required name="starts" type="date" className={fieldClass}/></label><label>End<input required name="ends" type="date" className={fieldClass}/></label></MutationForm></details></div>}
 </div>;
}
