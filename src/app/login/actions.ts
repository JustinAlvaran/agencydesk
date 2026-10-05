'use server';
import { redirect } from 'next/navigation';
import { z } from 'zod';
import { createClient } from '@/lib/supabase/server';
import { isDemo } from '@/lib/env';
import { loginDestination } from '@/lib/login-destination';

export async function signInWithGoogle() {
  if (isDemo()) redirect('/demo');
  const origin = process.env.APP_URL;
  if (!origin) redirect('/login?error=Google+sign-in+is+not+configured');
  const supabase = await createClient();
  const { data, error } = await supabase.auth.signInWithOAuth({
    provider: 'google',
    options: { redirectTo: new URL('/auth/callback', origin).toString(), skipBrowserRedirect: true },
  });
  if (error || !data.url) redirect('/login?error=Google+sign-in+is+unavailable.+Please+try+again.');
  redirect(data.url);
}

export async function signIn(formData: FormData) {
  if (isDemo()) redirect('/demo');
  const input = z.object({ email: z.string().trim().email(), password: z.string().min(8).max(128) }).safeParse(Object.fromEntries(formData));
  if (!input.success) redirect('/login?error=Please+enter+a+valid+email+and+password');
  const supabase = await createClient();
  const { error } = await supabase.auth.signInWithPassword(input.data);
  if (error) redirect('/login?error=Email+or+password+is+incorrect');
  const { data: user } = await supabase.auth.getUser();
  if (!user.user) redirect('/login?error=Please+sign+in+again');
  const destination = await loginDestination(supabase, user.user.id);
  if (!destination) {
    await supabase.auth.signOut({ scope: 'local' });
    redirect('/login?error=No+active+workspace+access.+Contact+your+administrator.');
  }
  redirect(destination);
}

export async function signOut() {
  if (!isDemo()) { const supabase = await createClient(); await supabase.auth.signOut(); }
  redirect('/');
}
