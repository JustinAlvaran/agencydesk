import Link from 'next/link';
import { rebuildWebsite } from './content-actions';
import { requireAdmin } from '@/lib/auth';
import { AccessForm } from './access-form';

export default async function Settings({ searchParams }: { searchParams: Promise<Record<string, string | undefined>> }) {
  const query = await searchParams;
  const { supabase } = await requireAdmin();
  const { data, error } = await supabase.from('companies').select('id,name').order('name').limit(200);
  if (error) throw new Error('Could not load companies.');
  const rebuildMessage = query.rebuild === 'requested' ? 'Rebuild requested. Content goes live after the deployment succeeds.' : query.rebuild === 'unconfigured' ? 'Publishing connection is not configured yet.' : 'Rebuild request failed. The previous website remains online.';
  return <section className="workspace-page">
    <div className="page-heading"><h1>People & access</h1><p>Invite your team and give clients access to their own projects.</p></div>
    <div className="panel mt-8 p-6">
      <h2 className="mb-2 text-xl font-semibold">Private account links</h2>
      <p className="mb-6 text-sm muted">Create a company in Contacts before inviting its clients. Recovery links do not change existing permissions.</p>
      <AccessForm companies={data ?? []} />
    </div>
    <div className="panel mt-8 p-6">
      <h2>Website content</h2>
      {query.rebuild && <p role="status">{rebuildMessage}</p>}
      <p>Edit drafts in Directus, preview them here, and promote when ready. Published CMS content becomes live only after a successful website deployment.</p>
      {process.env.DIRECTUS_URL && <a href={process.env.DIRECTUS_URL + '/admin'} target="_blank" rel="noopener noreferrer">Manage website content</a>}
      <p><Link href="/crm/content-preview" target="_blank" rel="noopener noreferrer">Preview website content</Link></p>
      <form action={rebuildWebsite}><button type="submit" disabled={!process.env.VERCEL_DEPLOY_HOOK}>Rebuild website</button></form>
    </div>
  </section>;
}
