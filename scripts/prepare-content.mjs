import { readFile, writeFile, mkdir, rename } from 'node:fs/promises';
import { createHash } from 'node:crypto';
import { websiteContentSchema } from '../src/lib/website-schema.ts';

const source = process.env.CONTENT_SOURCE ?? 'fixtures';
if (!['fixtures', 'directus'].includes(source)) throw new Error('Invalid CONTENT_SOURCE');
const fixtures = JSON.parse(await readFile('content/fixtures.json', 'utf8'));
let content;
if (source === 'fixtures') content = fixtures;
else {
  const base = new URL(process.env.DIRECTUS_URL ?? '');
  if (base.protocol !== 'https:' || base.username || base.password || !process.env.DIRECTUS_PUBLISHED_TOKEN) throw new Error('Server-side Directus configuration required');
  const deadline = Date.now() + 180000;
  for (let attempt = 1; attempt <= 3; attempt++) {
    try {
      const results = await Promise.all(Object.entries(fixtures).map(async ([collection, sample]) => {
        const list = Array.isArray(sample);
        const url = new URL(`/items/${collection}`, base);
        url.searchParams.set('fields', Object.keys(list ? sample[0] : sample).join(','));
        if (list) { url.searchParams.set('limit', '101'); url.searchParams.set('sort', 'sort,id'); url.searchParams.set('filter[visibility][_eq]', 'visible'); }
        const response = await fetch(url, { cache: 'no-store', headers: { Authorization: `Bearer ${process.env.DIRECTUS_PUBLISHED_TOKEN}` }, signal: AbortSignal.timeout(Math.max(1, Math.min(60000, deadline - Date.now()))) });
        if (!response.ok) throw new Error(`CMS content request failed (${response.status})`);
        const json = await response.json();
        if (list && json.data.length > 100) throw new Error('CMS content exceeds portfolio item limit');
        return [collection, json.data];
      }));
      content = Object.fromEntries(results); break;
    } catch {
      if (attempt === 3 || Date.now() >= deadline) throw new Error('CMS content preparation failed. Existing deployment remains online; fixtures were not substituted.');
    }
  }
}
content = websiteContentSchema.parse(content);
const digest = createHash('sha256').update(JSON.stringify(content)).digest('hex');
await mkdir('src/generated', { recursive: true });
await writeFile('src/generated/website-content.tmp', JSON.stringify({ source, digest, content }, null, 2));
await rename('src/generated/website-content.tmp', 'src/generated/website-content.json');
console.log(`Website content prepared (${source}, sha256 ${digest})`);
