'use server';
import { redirect } from 'next/navigation';
import { z } from 'zod';
import { createClient } from '@/lib/supabase/server';
import { isConfigured } from '@/lib/env';
import { loginDestination } from '@/lib/login-destination';

export async function signIn(form: FormData): Promise<{ error: string }> {
  if (!isConfigured()) return { error: 'Workspace sign-in is not configured yet. Contact your administrator.' };

  const input = z.object({ email: z.string().trim().email().max(254), password: z.string().min(1).max(128) }).safeParse(Object.fromEntries(form));
  if (!input.success) return { error: 'Enter a valid email and password.' };
  const client = await createClient();
  const { error } = await client.auth.signInWithPassword(input.data);
  if (error) return { error: 'Email or password is incorrect.' };
  const { data } = await client.auth.getUser();
  const destination = data.user && await loginDestination(client, data.user.id);
  if (!destination) {
    await client.auth.signOut({ scope: 'local' });
    return { error: 'No active workspace access. Contact your administrator.' };
  }
  redirect(destination);
}

export async function signInWithProvider(provider: 'google' | 'github'): Promise<{ error: string }> {
  if (!isConfigured()) return { error: 'Workspace sign-in is not configured yet.' };

  if (!process.env.APP_URL) return { error: 'Workspace sign-in is not configured yet.' };
  if (provider !== 'google' && provider !== 'github') return { error: 'Unsupported sign-in provider.' };
  const client = await createClient();
  const { data, error } = await client.auth.signInWithOAuth({ provider, options: {
    redirectTo: new URL('/auth/callback', process.env.APP_URL).toString(), skipBrowserRedirect: true,
  } });
  if (error || !data.url) return { error: 'Provider sign-in is unavailable. Try again later.' };
  redirect(data.url);
}

export async function signOut() {
  if (isConfigured()) { 
    const client = await createClient(); 
    await client.auth.signOut({ scope: 'local' }); 
  }
  redirect('/login');
}
