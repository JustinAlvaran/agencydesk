import 'server-only';
import {requireStaff} from '@/lib/auth';
import {uuid} from '@/lib/validation';
import type {Task} from '@/lib/domain';

export async function leadTasks(id:string){
 uuid.parse(id);
 const {supabase}=await requireStaff();
 const queriedAt=new Date().toISOString();
 const {data,error,count}=await supabase.from('follow_up_tasks')
  .select('id,title,due_at,completed_at,lead_id,assigned_to,created_at',{count:'exact'})
  .eq('lead_id',id).is('completed_at',null)
  .order('due_at',{ascending:true,nullsFirst:false}).order('id',{ascending:true}).limit(20);
 if(error)throw new Error('Could not load lead tasks. Please try again.');
 return {rows:(data??[]) as Task[],count:count??0,queriedAt};
}
