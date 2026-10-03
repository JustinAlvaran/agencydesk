export function isDemo() { return process.env.APP_MODE !== 'live'; }

export function supabaseEnvironment() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;
  if (!url || !key) throw new Error('Supabase configuration is missing. Set the documented environment variables before using live mode.');
  return { url, key };
}
