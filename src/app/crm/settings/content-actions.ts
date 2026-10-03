'use server';
import { requireAdmin } from '@/lib/auth';
import { redirect } from 'next/navigation';
export async function rebuildWebsite() {
  await requireAdmin();
  const hook = process.env.VERCEL_DEPLOY_HOOK;
  if (!hook) redirect('/crm/settings?rebuild=unconfigured');
  let succeeded = false;
  try {
    const url = new URL(hook);
    if (url.protocol !== 'https:' || url.hostname !== 'api.vercel.com' || !url.pathname.startsWith('/v1/integrations/deploy/')) throw new Error('Invalid deployment configuration');
    const response = await fetch(url, { method: 'POST', cache: 'no-store', signal: AbortSignal.timeout(15000) });
    succeeded = response.ok;
  } catch { console.error('Website rebuild request failed'); }
  redirect(`/crm/settings?rebuild=${succeeded ? 'requested' : 'failed'}`);
}
