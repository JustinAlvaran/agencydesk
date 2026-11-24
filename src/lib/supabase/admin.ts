import 'server-only';
import { createClient } from '@supabase/supabase-js';
import type { Database } from './database.types';
export function serviceClient() {
  const url=process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key=process.env.SUPABASE_SECRET_KEY;
  if(!url || !key) throw new Error('Server database access is not configured.');
  return createClient<Database>(url,key,{auth:{persistSession:false,autoRefreshToken:false}});
}
