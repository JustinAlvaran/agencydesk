import 'server-only';
import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { supabaseEnvironment } from '@/lib/env';
import type { Database } from './database.types';

export async function createClient() {
  const jar = await cookies();
  const { url, key } = supabaseEnvironment();
  return createServerClient<Database>(url, key, {
    cookies: {
      getAll() { return jar.getAll(); },
      setAll(values) {
        try { values.forEach(({ name, value, options }) => jar.set(name, value, options)); }
        catch { /* Server Components cannot write cookies; proxy refreshes the session. */ }
      },
    },
  });
}
