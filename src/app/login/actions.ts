'use server';
import { redirect } from 'next/navigation';
import { z } from 'zod';
import { createClient } from '@/lib/supabase/server';
import { isDemo } from '@/lib/env';

export async function signIn(formData: FormData) {
  if (isDemo()) redirect('/demo');
  const input = z.object({ email: z.string().trim().email(), password: z.string().min(8).max(128) }).safeParse(Object.fromEntries(formData));
  if (!input.success) redirect('/login?error=Please+enter+a+valid+email+and+password');
  const supabase = await createClient();
  const { error } = await supabase.auth.signInWithPassword(input.data);
  if (error) redirect('/login?error=Email+or+password+is+incorrect');
  const { data: user } = await supabase.auth.getUser();
  const { data: staff } = await supabase.from('staff_members').select('user_id').eq('user_id', user.user!.id).eq('active', true).maybeSingle();
  redirect(staff ? '/crm' : '/portal');
}

export async function signOut() {
  if (!isDemo()) { const supabase = await createClient(); await supabase.auth.signOut(); }
  redirect('/');
}
