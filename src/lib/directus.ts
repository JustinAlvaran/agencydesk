import 'server-only';
import { contentCollections, homePageSchema, sampleProjectSchema, serviceSchema, siteSettingsSchema } from './website-schema';
const schemas = { site_settings: siteSettingsSchema, home_page: homePageSchema, services: serviceSchema, sample_projects: sampleProjectSchema };
export async function readContentPreview(collection: string, item: string, version: string) {
  if (!contentCollections.includes(collection as typeof contentCollections[number]) || !/^[a-z0-9-]{1,80}$/.test(item) || !/^[a-zA-Z0-9_-]{1,80}$/.test(version)) throw new Error('Invalid content preview selection');
  const name = collection as typeof contentCollections[number];
  const singleton = name === 'site_settings' || name === 'home_page';
  if (singleton && item !== 'main') throw new Error('Invalid singleton selection');
  if (!process.env.DIRECTUS_URL || !process.env.DIRECTUS_PREVIEW_TOKEN) throw new Error('Content preview is not configured yet');
  const base = new URL(process.env.DIRECTUS_URL);
  if (base.protocol !== 'https:' || base.username || base.password) throw new Error('Invalid CMS configuration');
  const url = new URL(`/items/${name}${singleton ? '' : `/${item}`}`, base);
  url.searchParams.set('fields', Object.keys(schemas[name].shape).join(','));
  if (version !== 'main') url.searchParams.set('version', version);
  const response = await fetch(url, { cache: 'no-store', headers: { Authorization: `Bearer ${process.env.DIRECTUS_PREVIEW_TOKEN}` }, signal: AbortSignal.timeout(60000) });
  if (!response.ok) throw new Error('The CMS could not load this version. Check the version name and try again.');
  return schemas[name].parse((await response.json()).data);
}
