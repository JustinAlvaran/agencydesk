import type { MetadataRoute } from 'next';
import { publicServices } from '@/lib/website-content';
import { publicURL } from '@/lib/site-url';

export default function sitemap(): MetadataRoute.Sitemap {
  return ['/', '/services', '/case-studies', '/inquire', ...publicServices.map(service => `/services/${service.id}`)].map(path => ({ url: publicURL(path) }));
}
