// Owner-only provisioning. Credentials are read from ignored local storage.
import { readFile, writeFile, mkdir } from 'node:fs/promises';
import { randomBytes } from 'node:crypto';

const config = JSON.parse(await readFile('.local/cms-secrets.json', 'utf8'));
const fixtures = JSON.parse(await readFile('content/fixtures.json', 'utf8'));
let token;
async function api(path, method = 'GET', body) {
  const response = await fetch(config.cmsUrl + path, {
    method, headers: { 'Content-Type': 'application/json', ...(token ? { Authorization: `Bearer ${token}` } : {}) },
    ...(body ? { body: JSON.stringify(body) } : {}), signal: AbortSignal.timeout(180000),
  });
  const json = await response.json();
  if (!response.ok) throw new Error(`${method} ${path.split('?')[0]} failed (${response.status}, ${json.errors?.[0]?.extensions?.code ?? 'unknown'})`);
  return json.data;
}

try {
  token = (await api('/auth/login', 'POST', { email: config.ownerEmail, password: config.adminPassword, mode: 'json' })).access_token;
  const license = await api('/license');
  if (license.status !== 'active' || !license.entitlements.custom_permission_rules_enabled.default) throw new Error('Licensed custom permissions required');
  const existing = await api('/collections');
  for (const [collection, records] of Object.entries(fixtures)) {
    const singleton = !Array.isArray(records);
    const sample = singleton ? records : records[0];
    if (!existing.some(item => item.collection === collection)) {
      const fields = Object.entries(sample).map(([field, value], sort) => ({
        field, type: typeof value === 'number' ? 'integer' : ['description', 'seo_description'].includes(field) || field.endsWith('_description') ? 'text' : 'string',
        schema: { is_primary_key: field === 'id', is_nullable: false, ...(typeof value === 'number' ? { default_value: 0 } : {}), ...(field === 'visibility' ? { default_value: 'visible' } : {}) },
        meta: { interface: typeof value === 'number' ? 'input' : field === 'visibility' || field === 'scenario' ? 'select-dropdown' : field.includes('description') ? 'input-multiline' : 'input',
          sort: sort + 1, required: true, readonly: field === 'id', hidden: field === 'id', width: 'full',
          ...(field === 'visibility' ? { options: { choices: [{ text: 'Visible', value: 'visible' }, { text: 'Archived', value: 'archived' }] } } : {}),
          ...(field === 'scenario' ? { options: { choices: ['portal', 'proposals', 'leads'].map(value => ({ text: value, value })) } } : {}),
        },
      }));
      await api('/collections', 'POST', { collection, schema: {}, fields, meta: {
        singleton, versioning: true, accountability: 'all', icon: singleton ? 'description' : 'list',
        note: 'Public website copy only. Save drafts as content versions; promote when ready. Fictional disclosures and navigation remain in code.',
        ...(!singleton ? { sort_field: 'sort', archive_field: 'visibility', archive_value: 'archived', unarchive_value: 'visible', display_template: '{{title}}' } : {}),
      } });
      console.log(`Created ${collection}`);
    }
    const items = await api(`/items/${collection}?limit=100&fields=id`);
    const known = singleton ? items?.id ? [items.id] : [] : items.map(item => item.id);
    for (const record of singleton ? [records] : records) if (!known.includes(record.id)) await api(`/items/${collection}`, singleton ? 'PATCH' : 'POST', record);
    await api(`/collections/${collection}`, 'PATCH', { meta: {
      preview_url: `https://agencydesk-theta.vercel.app/crm/content-preview?collection=${collection}&item={{id}}&version={{$version}}`,
    } });
  }
  const policies = await api('/policies?limit=100');
  config.readers ??= {};
  for (const kind of ['published', 'preview']) {
    const name = `AgencyDesk ${kind} reader`;
    let policy = policies.find(item => item.name === name);
    if (!policy) policy = await api('/policies', 'POST', { name, icon: 'visibility', admin_access: false, app_access: false });
    const permissions = await api(`/permissions?filter[policy][_eq]=${policy.id}&limit=100`);
    for (const [collection, records] of Object.entries(fixtures)) {
      if (!permissions.some(item => item.collection === collection && item.action === 'read')) await api('/permissions', 'POST', {
        policy: policy.id, collection, action: 'read', fields: Object.keys(Array.isArray(records) ? records[0] : records),
        permissions: kind === 'published' && Array.isArray(records) ? { visibility: { _eq: 'visible' } } : {},
      });
    }
    if (kind === 'preview' && !permissions.some(item => item.collection === 'directus_versions')) await api('/permissions', 'POST', {
      policy: policy.id, collection: 'directus_versions', action: 'read', fields: ['id', 'key', 'name', 'collection', 'item', 'delta'],
      permissions: { collection: { _in: Object.keys(fixtures) } },
    });
    if (!config.readers[kind]) {
      const readerToken = randomBytes(32).toString('hex');
      const user = await api('/users', 'POST', { first_name: name, status: 'active', token: readerToken, policies: [{ policy: policy.id }] });
      config.readers[kind] = { userId: user.id, policyId: policy.id, token: readerToken };
      await writeFile('.local/cms-secrets.json', JSON.stringify(config, null, 2));
    }
  }
  const snapshot = await api('/schema/snapshot');
  // Schema export contains no accounts, content, tokens, or passwords. Not a data backup.
  await mkdir('infra/directus', { recursive: true });
  await writeFile('infra/directus/schema.json', JSON.stringify(snapshot, null, 2) + '\n');
  console.log('Collections, initial copy, and API readers configured. Schema exported.');
} catch (error) { console.error(error.message); process.exitCode = 1; }
