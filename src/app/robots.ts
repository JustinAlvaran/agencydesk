import type { MetadataRoute } from 'next';
import { publicURL } from '@/lib/site-url';

export default function robots(): MetadataRoute.Robots {
  return { rules: { userAgent: '*', allow: '/', disallow: ['/crm', '/portal', '/auth', '/api', '/login', '/demo'] }, sitemap: publicURL('/sitemap.xml') };
}
