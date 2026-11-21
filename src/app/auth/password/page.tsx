import { redirect } from 'next/navigation';
import { requireUser } from '@/lib/auth';
import { z } from 'zod';
import { AccountShell } from '@/components/account-shell';
import { PasswordField } from '@/components/password-field';

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
  return <AccountShell><h1>Set your password.</h1><p>Use at least 12 characters to secure your account.</p><form action={setPassword} className="auth-form"><PasswordField id="password" label="New password" minLength={12} autoComplete="new-password"/><PasswordField id="confirmation" label="Confirm password" minLength={12} autoComplete="new-password"/>{error && <p role="alert" className="error-text">{error}</p>}<button className="primary-button" type="submit">Save password</button></form><p className="account-help">Your agency invitation determines which workspace you can access.</p></AccountShell>;
}
