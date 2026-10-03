import 'server-only';
import {requireStaff,requireUser} from '@/lib/auth';
import type {Lead,Proposal,Project,Task,Contact,DashboardData} from './domain';
import {uuid} from './validation';
import type {Database} from './supabase/database.types';
type TableName=keyof Database['public']['Tables'];
export type SearchParams=Record<string,string|string[]|undefined>;
export function pagination(params:SearchParams) {const page=Math.min(10000,Math.max(1,parseInt(String(params.page||'1'),10)||1));return {page,from:(page-1)*25,to:page*25-1};}
export async function listRows<T>(table:TableName,params:SearchParams={},client=false) {
 const {supabase}=client?await requireUser():await requireStaff();
 const {page,from,to}=pagination(params);
 let query=supabase.from(table).select('*',{count:'exact'}).order('created_at',{ascending:false}).range(from,to);
 if(params.status && typeof params.status==='string') query=query.filter('status','eq',params.status);
 if(table==='leads') {query=params.show==='archived'?query.not('archived_at','is',null):query.is('archived_at',null);if(typeof params.q==='string'&&params.q.trim()) query=query.ilike('contact_name',`%${params.q.replace(/[%_]/g,'').slice(0,100)}%`);}
 const {data,error,count}=await query;if(error) throw new Error('Could not load records. Please try again.');return {rows:(data??[]) as T[],count:count??0,page};
}
export async function row<T>(table:TableName,id:string,client=false) {if(!uuid.safeParse(id).success)return null;const {supabase}=client?await requireUser():await requireStaff();const {data,error}=await supabase.from(table).select('*').filter('id','eq',id).maybeSingle();if(error) throw new Error('Could not load this record.');return data as T|null;}
export async function choices(){const {supabase}=await requireStaff();const [leads,companies,staff]=await Promise.all([supabase.from('leads').select('id,contact_name').is('archived_at',null).order('contact_name').limit(250),supabase.from('companies').select('id,name').order('name').limit(250),supabase.from('staff_members').select('user_id,role').eq('active',true).limit(100)]);if(leads.error||companies.error||staff.error)throw new Error('Could not load form choices.');return {leads:(leads.data??[]) as {id:string;contact_name:string}[],companies:(companies.data??[]) as {id:string;name:string}[],staff:(staff.data??[]) as {user_id:string;role:string}[]};}
export async function related<T>(table:TableName,key:'lead_id'|'series_id'|'revision_id'|'project_id'|'update_id'|'active',id:string,client=false) {const {supabase}=client?await requireUser():await requireStaff();const {data,error}=await supabase.from(table).select('*').filter(key,'eq',id).limit(100);if(error)throw new Error('Could not load related records.');return (data??[]) as T[];}
export async function canDecideProposal(company_id:string){const {supabase,user}=await requireUser();const {data,error}=await supabase.from('client_memberships').select('can_accept_proposals').eq('user_id',user.id).eq('company_id',company_id).eq('active',true).maybeSingle();if(error)throw new Error('Could not check proposal permissions.');return data?.can_accept_proposals===true;}
export async function dashboardData():Promise<DashboardData>{
 const {supabase}=await requireStaff();
 const [leadResult,proposalResult,projectResult,taskResult,metrics]=await Promise.all([listRows<Lead>('leads'),listRows<Proposal>('proposal_series'),listRows<Project>('projects'),listRows<Task>('follow_up_tasks'),supabase.rpc('get_dashboard_metrics')]);
 if(metrics.error)throw new Error('Could not load dashboard totals.');
 const totals=metrics.data as {open_leads:number;pipeline_cents:number;accepted_cents:number;overdue_tasks:number};
 return {leads:leadResult.rows,proposals:proposalResult.rows,projects:projectResult.rows,tasks:taskResult.rows,openLeads:totals.open_leads,pipelineValue:totals.pipeline_cents,acceptedValue:totals.accepted_cents,overdueTasks:totals.overdue_tasks};
}
export type {Contact};
