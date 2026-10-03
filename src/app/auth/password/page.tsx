import { redirect } from 'next/navigation';
import { requireUser } from '@/lib/auth';
import { z } from 'zod';

async function setPassword(form: FormData) {
  'use server';
  const { supabase } = await requireUser();
  const password = z.string().min(12).max(128).safeParse(form.get('password'));
  if (!password.success || form.get('password') !== form.get('confirmation')) redirect('/auth/password?error=Use+matching+passwords+of+at+least+12+characters');
  const { error } = await supabase.auth.updateUser({ password: password.data });
  if (error) redirect('/auth/password?error=Unable+to+set+password.+Please+request+a+new+link.');
  redirect('/login');
}

export default async function Password({ searchParams }: { searchParams: Promise<{ error?: string }> }) {
  await requireUser();
  const { error } = await searchParams;
  return <main id="main-content" className="auth-screen"><section className="auth-card"><h1>Set your password.</h1><p>Use at least 12 characters.</p><form action={setPassword} className="auth-form"><label htmlFor="password">New password</label><input id="password" name="password" type="password" autoComplete="new-password" minLength={12} maxLength={128} required /><label htmlFor="confirmation">Confirm password</label><input id="confirmation" name="confirmation" type="password" autoComplete="new-password" required />{error && <p role="alert">{error}</p>}<button className="primary-button" type="submit">Save password</button></form></section></main>;
}
