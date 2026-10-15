'use server';

import { z } from 'zod';
import { requireStaff } from '@/lib/auth';
import { isDemo } from '@/lib/env';
import { formObject, uuid } from '@/lib/validation';
import { reportFailure } from '@/lib/operational-log';
import type { WhatsAppDraftPurpose } from '@/lib/whatsapp';

export type DraftResult = { ok: false; message: string } | { ok: true; message: string; draft: string; purpose: WhatsAppDraftPurpose };

export async function requestHermesDraft(form: FormData): Promise<DraftResult> {
  if (isDemo()) return { ok: false, message: 'Hermes drafts require your live staff workspace.' };
  const { supabase } = await requireStaff();
  const input = z.object({ lead_id: uuid, purpose: z.enum(['reply', 'follow_up', 'summary']) }).safeParse(formObject(form));
  if (!input.success) return { ok: false, message: 'Choose a lead and draft purpose.' };
  // The caller's session and lead RLS enforce agency ownership before any AI request.
  const { data: lead, error: leadError } = await supabase.from('leads').select('id').eq('id', input.data.lead_id).is('archived_at', null).maybeSingle();
  if (leadError) {
    reportFailure('hermes_draft_lead', leadError);
    return { ok: false, message: 'Could not load this lead. You can still write a draft yourself.' };
  }
  if (!lead) return { ok: false, message: 'Choose an active lead in your staff workspace.' };
  const { data, error } = await supabase.functions.invoke('hermes-draft', { body: input.data });
  if (error) {
    reportFailure('hermes_draft', error);
    return { ok: false, message: 'Hermes is unavailable. You can write and review a draft yourself below.' };
  }
  if (data?.requires_approval !== true || typeof data.draft !== 'string' || !data.draft.trim() || data.draft.length > 2500) {
    return { ok: false, message: 'Hermes did not return a complete draft.' };
  }
  return { ok: true, message: input.data.purpose === 'summary' ? 'Staff summary ready. Keep this text internal.' : 'Draft ready. Review it before using it in a message.', draft: data.draft.trim(), purpose: input.data.purpose };
}
