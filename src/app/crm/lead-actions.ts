'use server';
import { revalidatePath } from 'next/cache';
import { requireStaff } from '@/lib/auth';
import { isDemo } from '@/lib/env';
import { formObject, uuid } from '@/lib/validation';
import { manualLeadSchema, leadDetailsSchema, callSchema, callbackDate } from '@/lib/leads/workflow';
import { reportFailure } from '@/lib/operational-log';

function live() { if (isDemo()) throw new Error('Demo mode is read-only.'); }
function checked(error: {message:string}|null) { if (error) {reportFailure('lead_workflow',error);throw new Error('The lead could not be saved.');} }
function refresh() {revalidatePath('/crm','layout');}
export async function createManualLead(form: FormData) {
  live(); const {supabase} = await requireStaff();
  const action_id = uuid.parse(form.get('action_id'));
  const data = manualLeadSchema.parse(formObject(form));
  const {error} = await supabase.rpc('create_manual_lead',{p_action_id:action_id,p_details:data});
  checked(error); refresh();
}
export async function saveLeadDetails(form: FormData) {
  live(); const {supabase} = await requireStaff();
  const {id,...data} = leadDetailsSchema.parse(formObject(form));
  const {error} = await supabase.from('leads').update(data).eq('id',id).select('id').single();
  checked(error); refresh();
}
export async function recordLeadCall(form: FormData) {
  live(); const {supabase} = await requireStaff();
  const data = callSchema.parse(formObject(form));
  const callback_at = data.outcome === 'callback' ? callbackDate(data.callback_at) : null;
  const {error} = await supabase.rpc('log_lead_call',{p_lead_id:data.lead_id,p_outcome:data.outcome,p_note:data.note,p_callback_at:callback_at,p_action_id:data.action_id});
  checked(error); refresh();
}
