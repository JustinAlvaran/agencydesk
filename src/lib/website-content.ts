import 'server-only';
import snapshot from '@/generated/website-content.json';
import { websiteContentSchema } from './website-schema';
import { visibleServices } from './service-catalog';
export const websiteContent = websiteContentSchema.parse(snapshot.content);
export const websiteContentDigest = snapshot.digest;
export const publicServices = visibleServices(websiteContent.services);
