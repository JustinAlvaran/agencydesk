import 'server-only';
import { redirect } from 'next/navigation';
import { cookies } from 'next/headers';
import type { User, SupabaseClient } from '@supabase/supabase-js';
import type { Database } from '@/lib/supabase/database.types';
import { createClient } from '@/lib/supabase/server';
import { isDemo } from '@/lib/env';

export async function requireUser() {
  if (isDemo()) {
    const cookieStore = await cookies();
    const sessionCookie = cookieStore.get('agencydesk_staff_session');
    if (!sessionCookie?.value) {
      redirect('/login?error=Please+sign+in+with+admin@agencydesk.com');
    }
    const email = sessionCookie.value.includes('@')
      ? sessionCookie.value
      : 'admin@agencydesk.com';
    return {
      user: {
        id: 'staff-admin-id',
        email,
        app_metadata: {},
        user_metadata: { name: 'Justin Alvaran (Admin)' },
        aud: 'authenticated',
        created_at: new Date().toISOString(),
      } as unknown as User,
      supabase: null as unknown as SupabaseClient<Database>,
    };
  }
  const supabase = await createClient();
  const { data, error } = await supabase.auth.getUser();
  if (error || !data.user) redirect('/login');
  return { user: data.user, supabase };
}

export async function requireStaff() {
  const session = await requireUser();
  if (isDemo()) {
    return {
      ...session,
      staff: {
        user_id: 'staff-admin-id',
        role: 'admin' as const,
        active: true,
        agency_id: 'agency-main-id',
      }
    };
  }
  const { data } = await session.supabase.from('staff_members').select('user_id,role,active,agency_id').eq('user_id', session.user.id).eq('active', true).maybeSingle();
  if (!data) redirect('/portal');
  return { ...session, staff: data as { user_id: string; role: 'admin' | 'staff'; active: boolean; agency_id: string } };
}

export async function requireAdmin() {
  const session = await requireStaff();
  if (session.staff.role !== 'admin') redirect('/crm');
  return session;
}
