'use server';

import { redirect } from 'next/navigation';
import { cookies, headers } from 'next/headers';
import { z } from 'zod';
import { createClient } from '@/lib/supabase/server';
import { isConfigured } from '@/lib/env';
import { loginDestination } from '@/lib/login-destination';

export async function signIn(form: FormData): Promise<{ error: string }> {
  const input = z
    .object({
      email: z.string().trim().email().max(254),
      password: z.string().min(1).max(128),
    })
    .safeParse(Object.fromEntries(form));

  if (!input.success) return { error: 'Enter a valid email and password.' };

  if (!isConfigured()) {
    if (input.data.email === 'admin@agencydesk.com' && input.data.password === 'admin123') {
      const cookieStore = await cookies();
      cookieStore.set('agencydesk_staff_session', input.data.email, {
        path: '/',
        httpOnly: true,
        sameSite: 'lax',
        secure: process.env.NODE_ENV === 'production',
        maxAge: 60 * 60 * 24 * 7,
      });
      redirect('/crm');
    }
    return { error: 'Invalid credentials. Demo admin login is admin@agencydesk.com / admin123.' };
  }

  const client = await createClient();
  const { error } = await client.auth.signInWithPassword(input.data);
  if (error) return { error: 'Email or password is incorrect.' };
  const { data } = await client.auth.getUser();
  const destination = data.user && (await loginDestination(client, data.user.id));
  if (!destination) {
    await client.auth.signOut({ scope: 'local' });
    return { error: 'No active workspace access. Contact your administrator.' };
  }
  redirect(destination);
}

export async function signInWithProvider(provider: 'google' | 'github'): Promise<{ error: string }> {
  if (!isConfigured()) return { error: 'Workspace sign-in is not configured yet.' };
  if (provider !== 'google' && provider !== 'github') return { error: 'Unsupported sign-in provider.' };

  let origin = process.env.APP_URL;
  try {
    const headerList = await headers();
    const host = headerList.get('x-forwarded-host') || headerList.get('host');
    const proto = headerList.get('x-forwarded-proto') || 'https';
    if (host) origin = `${proto}://${host}`;
  } catch {
    // Fallback to APP_URL if outside header request scope
  }

  if (!origin) return { error: 'Workspace sign-in is not configured yet.' };

  const client = await createClient();
  const { data, error } = await client.auth.signInWithOAuth({
    provider,
    options: {
      redirectTo: new URL('/auth/callback', origin).toString(),
      skipBrowserRedirect: true,
    },
  });
  if (error || !data.url) return { error: error?.message || 'Provider sign-in is unavailable. Try again later.' };
  redirect(data.url);
}

export async function signOut() {
  if (isConfigured()) {
    const client = await createClient();
    await client.auth.signOut({ scope: 'local' });
  } else {
    const cookieStore = await cookies();
    cookieStore.delete('agencydesk_staff_session');
  }
  redirect('/login');
}
