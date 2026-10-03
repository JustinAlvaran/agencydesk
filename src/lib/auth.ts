import 'server-only';
import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { isDemo } from '@/lib/env';

export async function requireUser() {
  if (isDemo()) redirect('/demo');
  const supabase = await createClient();
  const { data, error } = await supabase.auth.getUser();
  if (error || !data.user) redirect('/login');
  return { user: data.user, supabase };
}

export async function requireStaff() {
  const session = await requireUser();
  const { data } = await session.supabase.from('staff_members').select('user_id,role,active').eq('user_id', session.user.id).eq('active', true).maybeSingle();
  if (!data) redirect('/portal');
  return { ...session, staff: data as { user_id: string; role: 'admin' | 'staff'; active: boolean } };
}

export async function requireAdmin() {
  const session = await requireStaff();
  if (session.staff.role !== 'admin') redirect('/crm');
  return session;
}
