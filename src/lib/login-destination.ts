import type { SupabaseClient } from '@supabase/supabase-js';
import type { Database } from '@/lib/supabase/database.types';

export async function loginDestination(supabase: SupabaseClient<Database>, userId: string) {
  const [staff, clients] = await Promise.all([
    supabase.from('staff_members').select('user_id').eq('user_id', userId).eq('active', true).limit(1),
    supabase.from('client_memberships').select('user_id').eq('user_id', userId).eq('active', true).limit(1),
  ]);
  if (staff.error || clients.error) throw new Error('Could not verify workspace access.');
  if (staff.data?.length) return '/crm';
  if (clients.data?.length) return '/portal';
  return null;
}
