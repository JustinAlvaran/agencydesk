import 'server-only';
import { supabaseEnvironment } from '@/lib/env';
import { reportFailure } from '@/lib/operational-log';

export async function submitInquiry(payload: { contact_name: string; email: string; service: string; brief: string; budget_cents: number; phone?:string; email_opt_in?:boolean; whatsapp_opt_in?:boolean; request_key?: string }) {
  const { url, key } = supabaseEnvironment();
  const anon = process.env.SUPABASE_EDGE_ANON_KEY;
  if (!anon) throw new Error('Public inquiry service is not configured.');
  const response = await fetch(`${url}/functions/v1/inquiry`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', apikey: key, Authorization: `Bearer ${anon}` },
    body: JSON.stringify(payload),
    signal: AbortSignal.timeout(15000),
    cache: 'no-store',
  });
  if (!response.ok) {
    reportFailure('inquiry_submission', {code:`HTTP_${response.status}`});
    if (response.status === 429) throw new Error('Too many inquiries. Please wait a few minutes and try again.');
    throw new Error('We could not save your inquiry. Please try again.');
  }
  return response.json() as Promise<{ id: string }>;
}
