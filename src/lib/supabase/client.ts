'use client';
import { createBrowserClient } from '@supabase/ssr';
import { supabaseEnvironment } from '@/lib/env';
import type { Database } from './database.types';

export function createClient() {
  const { url, key } = supabaseEnvironment();
  return createBrowserClient<Database>(url, key);
}
