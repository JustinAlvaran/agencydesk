'use server';
import { revalidatePath } from 'next/cache';
import { z } from 'zod';
import { requireAdmin, requireStaff } from '@/lib/auth';
import { isDemo } from '@/lib/env';
import { uuid, formObject } from '@/lib/validation';
import { reportFailure } from '@/lib/operational-log';

export type CommandResult = { ok: boolean; message: string };
function live() { if (isDemo()) throw new Error('The sample workspace is read-only.'); }
function checked(error: unknown) { if (error) { reportFailure('automation_command', error); throw new Error('Could not save the automation change. Check your access and current job state.'); } }
function refresh() { revalidatePath('/crm/automations'); }
export async function configureRule(form: FormData): Promise<CommandResult> {
  live(); const { supabase } = await requireAdmin();
  const data = z.object({ id: uuid, provider: z.enum(['resend','gmail','whatsapp','zoko','waha']), delay_minutes: z.coerce.number().int().min(0).max(43200), enabled: z.string().optional(), approval_required: z.string().optional() }).parse(formObject(form));
  const { error } = await supabase.rpc('configure_automation_rule', { p_rule_id: data.id, p_channel: ['resend','gmail'].includes(data.provider) ? 'email' : 'whatsapp', p_provider: data.provider, p_delay_minutes: data.delay_minutes, p_enabled: data.enabled === 'on', p_approval_required: data.approval_required === 'on' });
  checked(error); refresh(); return { ok: true, message: 'Rule saved. Changes apply to new events; existing jobs are rechecked before dispatch.' };
}
export async function approveJob(form: FormData): Promise<CommandResult> {
  live(); const { supabase } = await requireStaff();
  const { data, error } = await supabase.rpc('approve_message_job', { p_job_id: uuid.parse(form.get('id')) });
  checked(error); refresh(); return data === true ? { ok: true, message: 'Approval recorded. The job will run when due if its recipient and record are still eligible.' } : { ok: false, message: 'This job can no longer be approved. Review its latest state and eligibility.' };
}
export async function cancelJob(form: FormData): Promise<CommandResult> {
  live(); const { supabase } = await requireStaff();
  const { data, error } = await supabase.rpc('cancel_message_job', { p_job_id: uuid.parse(form.get('id')) });
  checked(error); refresh(); return data === true ? { ok: true, message: 'Job cancelled.' } : { ok: false, message: 'This job is no longer pending. Review its current outcome.' };
}
export async function processDryRunBatch(): Promise<CommandResult> {
  live(); const { supabase } = await requireAdmin();
  const { data, error } = await supabase.functions.invoke('automation-dry-run', { body: {} });
  if (error) { reportFailure('automation_dry_run', error); return { ok: false, message: 'Dry run unavailable. The dedicated automation-dry-run function must be deployed and explicitly configured for dry-run mode. No fallback to the live worker was attempted.' }; }
  if (!data || data.mode !== 'dry_run' || !Number.isInteger(data.claimed) || data.claimed < 0 || data.claimed > 5) return { ok: false, message: 'Unexpected dry-run result. Review the queue before retrying.' };
  const counts = data.processed;
  if (!counts || typeof counts !== 'object' || Array.isArray(counts) || !Object.entries(counts).every(([key, value]) => ['simulated','skipped'].includes(key) && Number.isInteger(value) && Number(value) >= 0) || Object.values(counts).reduce<number>((sum, value) => sum + Number(value), 0) !== data.claimed) return { ok: false, message: 'Unexpected dry-run outcome counts. Review the queue before retrying.' };
  refresh();
  return { ok: true, message: `Dry run completed: ${data.claimed} approved due jobs claimed. No messages sent. Simulated jobs are complete and will not later send automatically.` };
}
export async function processBatch(): Promise<CommandResult> {
  live(); const { supabase } = await requireAdmin();
  const { data, error } = await supabase.functions.invoke('automation-worker', { body: {} });
  if (error) { reportFailure('automation_worker', error); return { ok: false, message: 'Worker unavailable. Deploy automation-worker to your AgencyDesk Supabase project and configure its own secrets, then try again.' }; }
  if (!data || !['dry_run','live'].includes(data.mode) || !Number.isInteger(data.claimed)) return { ok: false, message: 'The worker returned an unexpected result. Review the worker before retrying.' };
  refresh();
  const values = Object.entries(data.processed ?? {}).filter(([key, value]) => ['simulated','accepted','retry','failed','uncertain','skipped'].includes(key) && typeof value === 'number');
  return { ok: true, message: `${data.mode === 'dry_run' ? 'Dry run' : 'Live batch'} completed: ${data.claimed} jobs claimed${values.length ? ` (${values.map(([key,value]) => `${value} ${key}`).join(', ')})` : ''}. Provider acceptance is separate from confirmed delivery.` };
}
export async function retryJob(form: FormData): Promise<CommandResult> {
  live(); const { supabase } = await requireAdmin();
  const { data, error } = await supabase.rpc('retry_message_job', { p_job_id: uuid.parse(form.get('id')) });
  checked(error); refresh(); return data === true ? { ok: true, message: 'Job reset after a known rejection or configuration failure. Review and approve it again if required.' } : { ok: false, message: 'This job cannot be retried safely. Review eligibility, attempt limits, and the provider outcome.' };
}
