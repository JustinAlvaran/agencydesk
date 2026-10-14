import { z } from 'zod';
import type { LeadStatus } from '@/lib/domain';

export const callOutcomes = ['connected', 'no_answer', 'callback', 'not_interested', 'invalid_number'] as const;
export type CallOutcome = typeof callOutcomes[number];

// Adapted from ApartmentHub's outcome rules: an activity never undoes a
// completed sale or advances an already qualified lead backwards.
export function statusAfterCall(status: LeadStatus, outcome: CallOutcome): LeadStatus {
  if (status === 'won' || status === 'lost') return status;
  if (outcome === 'not_interested' || outcome === 'invalid_number') return 'lost';
  if (outcome === 'connected' && status === 'new') return 'contacted';
  return status;
}

const optionalUuid = z.union([z.uuid(), z.literal('')]).default('').transform(value => value || null);
const optIn = z.enum(['on', 'true', 'false']).optional().transform(value => value === 'on' || value === 'true');
export const leadContactSchema = z.object({
  contact_name: z.string().trim().min(1).max(100),
  email: z.string().trim().toLowerCase().max(254).pipe(z.email()),
  phone: z.string().trim().max(32).regex(/^(?:\+[1-9]\d{7,14})?$/, 'Use an international phone number, such as +639171234567.').default('').transform(value => value || null),
  service: z.string().trim().min(1).max(100),
  brief: z.string().trim().min(1).max(4000),
  budget_cents: z.coerce.number().int().min(0).max(100000000),
  email_opt_in: optIn,
  whatsapp_opt_in: optIn,
}).refine(value => !value.whatsapp_opt_in || !!value.phone, {path:['phone'],message:'A WhatsApp number is required when WhatsApp permission is recorded.'});
export const manualLeadSchema = leadContactSchema.safeExtend({source:z.string().trim().min(1).max(80).default('manual'),owner_id:optionalUuid,company_id:optionalUuid});
export const leadDetailsSchema = leadContactSchema.safeExtend({id:z.uuid()});
export const callSchema = z.object({lead_id:z.uuid(), action_id:z.uuid(), outcome:z.enum(callOutcomes), note:z.string().trim().max(4000).default(''), callback_at:z.string().default('')}).refine(value => value.outcome !== 'callback' || !!value.callback_at, {path:['callback_at'],message:'Choose a callback time.'});

export function callbackDate(value: string): string | null {
  if (!value) return null;
  const local = z.string().regex(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}$/).parse(value);
  const parsed = new Date(`${local}:00+08:00`);
  const iso = z.iso.datetime().parse(parsed.toISOString());
  // JavaScript normalizes impossible dates; reject rather than scheduling them.
  const normalized = new Date(parsed.getTime() + 8 * 3600000).toISOString().slice(0,16);
  if (normalized !== local) throw new Error('Choose a valid callback date.');
  return iso;
}

export function activitySummary(event: {event_type:string;detail:unknown}): string {
  const detail = event.detail && typeof event.detail === 'object' ? event.detail as Record<string,unknown> : {};
  const text = (key:string) => typeof detail[key] === 'string' ? String(detail[key]).slice(0,4000) : '';
  const readable = (value:string) => value.replaceAll('_',' ');
  if (event.event_type === 'lead_stage_changed') return `${readable(text('from'))} → ${readable(text('to'))}`;
  if (event.event_type === 'lead_call_logged') return [readable(text('outcome')), text('note')].filter(Boolean).join(' · ');
  if (event.event_type === 'callback_scheduled') return text('callback_at') ? `Callback: ${new Date(text('callback_at')).toLocaleString('en-US',{timeZone:'Asia/Manila'})}` : '';
  if (event.event_type === 'lead_owner_changed') return text('to') ? `Assigned to ${text('to').slice(0,8)}` : 'Unassigned';
  return '';
}
