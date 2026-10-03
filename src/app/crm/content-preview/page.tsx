import { requireAdmin } from '@/lib/auth';
import { readContentPreview } from '@/lib/directus';
import { homePageSchema, serviceSchema, sampleProjectSchema, siteSettingsSchema } from '@/lib/website-schema';
import { HomeFeatures, ServiceContent, SampleProjectContent } from '@/components/website-content';
export const dynamic = 'force-dynamic';
export const metadata = { title: 'Content preview', robots: { index: false, follow: false } };

export default async function ContentPreview({ searchParams }: { searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  await requireAdmin();
  const params = await searchParams;
  const collection = typeof params.collection === 'string' ? params.collection : 'home_page';
  const item = typeof params.item === 'string' ? params.item : 'main';
  const version = typeof params.version === 'string' ? params.version : 'main';
  let content;
  try { content = await readContentPreview(collection, item, version); }
  catch { /* Keep the selection form available so editors can retry or correct it. */ }
  return <section className="workspace-page">
    <div className="panel p-4"><h1>Website content preview</h1><p>Private preview · {collection} · {version}. This does not publish changes.</p>
      <form method="get" className="mt-4 grid gap-3"><label>Collection<select name="collection" defaultValue={collection}>{['site_settings','home_page','services','sample_projects'].map(name => <option key={name}>{name}</option>)}</select></label><label>Item ID<input name="item" defaultValue={item} required maxLength={80} /></label><label>Version key<input name="version" defaultValue={version} required maxLength={80} /></label><button type="submit">Load preview</button></form>
    </div>
    {!content && <p role="alert" className="mt-6">Preview unavailable. The CMS may be waking up, or this version may not exist. Check the selection and retry. Publication is unchanged.</p>}
    {content && <div className="marketing mt-8">
      {collection === 'home_page' && (() => { const home = homePageSchema.parse(content); return <><section className="hero"><div className="hero-copy"><h1>{home.heading}</h1><p>{home.description}</p></div></section><HomeFeatures home={home} /></>; })()}
      {collection === 'services' && <section className="public-service-list"><ServiceContent service={serviceSchema.parse(content)} /></section>}
      {collection === 'sample_projects' && <section className="public-project-list"><SampleProjectContent project={sampleProjectSchema.parse(content)} /></section>}
      {collection === 'site_settings' && (() => { const site = siteSettingsSchema.parse(content); return <><h2>{site.contact_heading}</h2><p>{site.contact_description}</p><h3>Search listing</h3><p>{site.seo_title}</p><p>{site.seo_description}</p></>; })()}
    </div>}
  </section>;
}
