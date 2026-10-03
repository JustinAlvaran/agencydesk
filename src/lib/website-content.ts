import 'server-only';
import snapshot from '@/generated/website-content.json';
import { websiteContentSchema } from './website-schema';
export const websiteContent = websiteContentSchema.parse(snapshot.content);
export const websiteContentDigest = snapshot.digest;
