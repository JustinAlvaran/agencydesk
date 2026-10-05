import { describe, expect, it } from 'vitest';
import type { SupabaseClient } from '@supabase/supabase-js';
import type { Database } from '@/lib/supabase/database.types';
import { loginDestination } from '@/lib/login-destination';

function membershipClient(staff: boolean, client: boolean, failed = false) {
  const filters: Array<[string, string, unknown]> = [];
  const supabase = { from(table: string) {
    const query = { select() { return query; }, eq(field: string, value: unknown) {
      filters.push([table, field, value]); return query;
    }, limit() { return Promise.resolve({ error: failed ? new Error('unavailable') : null,
      data: (table === 'staff_members' ? staff : client) ? [{ user_id: 'current-user' }] : [] }); } };
    return query;
  } } as unknown as SupabaseClient<Database>;
  return { supabase, filters };
}

describe('login membership routing', () => {
  it.each([
    [true, false, '/crm'], [false, true, '/portal'], [true, true, '/crm'], [false, false, null],
  ])('routes staff=%s client=%s to %s', async (staff, client, destination) => {
    const { supabase, filters } = membershipClient(staff as boolean, client as boolean);
    expect(await loginDestination(supabase, 'current-user')).toBe(destination);
    for (const table of ['staff_members', 'client_memberships']) {
      expect(filters).toContainEqual([table, 'user_id', 'current-user']);
      expect(filters).toContainEqual([table, 'active', true]);
    }
  });
  it('denies access on database errors', async () => {
    const { supabase } = membershipClient(true, false, true);
    await expect(loginDestination(supabase, 'current-user')).rejects.toThrow('Could not verify');
  });
});
