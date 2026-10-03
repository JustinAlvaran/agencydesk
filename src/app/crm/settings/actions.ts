'use server';
import { z } from 'zod';
import { requireAdmin } from '@/lib/auth';
import { reportFailure } from '@/lib/operational-log';

export async function generateAccessLink(_previous: { link?: string; error?: string }, form: FormData): Promise<{ link?: string; error?: string }> {
  const { supabase } = await requireAdmin();
  const input = z.object({ email: z.string().trim().email(), role: z.enum(['client','staff','admin']), type:z.enum(['invite','recovery']), company_id:z.union([z.string().uuid(),z.literal('')]) }).safeParse(Object.fromEntries(form));
  if (!input.success) return {error:'Enter a valid email and account role.'};
  if (input.data.type === 'invite' && input.data.role === 'client' && !input.data.company_id) return {error:'Select a company for the client.'};
  const {data,error} = await supabase.functions.invoke('admin-invite', {body:{...input.data,can_accept_proposals:form.get('can_accept_proposals')==='on',app_url:process.env.APP_URL || 'http://localhost:3000'}});
  if (error || !data?.link) { reportFailure('access_link_generation',error); return {error:'Unable to generate access link. Confirm the account and company, then try again.'}; }
  return {link:data.link};
}
