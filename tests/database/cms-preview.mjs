import assert from 'node:assert/strict';
import { readFile, writeFile } from 'node:fs/promises';
import { createServerClient } from '@supabase/ssr';
const env = Object.fromEntries((await readFile('.env.local', 'utf8')).split(/\r?\n/).filter(line => line.includes('=') && !line.startsWith('#')).map(line => { const i = line.indexOf('='); return [line.slice(0, i), line.slice(i + 1).replace(/^"|"$/g, '')]; }));
const accounts = JSON.parse(await readFile('.local/accounts.json', 'utf8'));
const owner = JSON.parse(await readFile('.local/supabase-owner-account.json', 'utf8'));
const origin = process.env.CMS_TEST_APP_URL ?? 'http://localhost:3200';
if (!['localhost','127.0.0.1'].includes(new URL(origin).hostname)) throw new Error('This verification changes a membership briefly; use only the configured local app');
const clients = {};
for (const [name, account] of Object.entries({ admin: accounts.find(a => a.role === 'admin'), client: accounts.find(a => a.role === 'clientA'), owner })) {
  const jar = new Map();
  const client = createServerClient(env.NEXT_PUBLIC_SUPABASE_URL, env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY, { cookies: { getAll: () => [...jar].map(([name,value]) => ({name,value})), setAll: values => values.forEach(({name,value}) => jar.set(name,value)) } });
  const result = await client.auth.signInWithPassword(account);
  assert.equal(result.error,null, `${name} authenticates`);
  clients[name] = { client, cookie: () => [...jar].map(([name,value]) => `${name}=${value}`).join('; ') };
}
const report = [];
async function request(name, path) {
  const response = await fetch(origin + path, { redirect: 'manual', headers: name ? { Cookie: clients[name].cookie() } : {}, signal: AbortSignal.timeout(70000) });
  const body = await response.text();
  report.push({ name: name ?? 'anonymous', path, status: response.status, location: response.headers.get('location'), cacheControl: response.headers.get('cache-control') });
  return { response, body };
}
const path = '/crm/content-preview?collection=services&item=business-websites&version=security-check';
function assertDenied(result, destination) {
  // Next.js can stream its shell before an authenticated component redirects.
  const headerRedirect = result.response.status === 307 && result.response.headers.get('location')?.includes(destination);
  const streamedRedirect = result.response.status === 200 && result.body.includes('NEXT_REDIRECT') && result.body.includes(destination);
  assert.ok(headerRedirect || streamedRedirect, `Redirects to ${destination}`);
  assert.doesNotMatch(result.body, /Unpublished security check|Website content preview/);
  assert.match(result.response.headers.get('cache-control'), /no-store/);
}
const anonymous = await request(null, path);
assertDenied(anonymous, '/login');
const client = await request('client',path);
assertDenied(client, '/portal');
const preview = await request('owner',path);
assert.equal(preview.response.status,200);assert.match(preview.body,/Unpublished security check/);assert.match(preview.response.headers.get('cache-control'),/no-store/);assert.match(preview.body,/noindex/);
const publicPage = await request(null,'/services');
assert.equal(publicPage.response.status,200);assert.doesNotMatch(publicPage.body,/Unpublished security check/);
const invalid = await request('owner','/crm/content-preview?collection=directus_users&item=main&version=main');
assert.equal(invalid.response.status,200);assert.match(invalid.body,/Preview unavailable/);
const downgrade = await clients.admin.client.from('staff_members').update({role:'staff'}).eq('user_id',owner.id);
assert.equal(downgrade.error,null);
try {
  const nonAdmin = await request('owner',path);
  assertDenied(nonAdmin, '/crm');
} finally {
  const restoreRole = await clients.admin.client.from('staff_members').update({role:'admin'}).eq('user_id',owner.id);
  assert.equal(restoreRole.error,null);
}
const revoke = await clients.admin.client.from('staff_members').update({active:false}).eq('user_id',owner.id);
assert.equal(revoke.error,null);
try {
  const removed = await request('owner',path);
  assertDenied(removed, '/portal');
} finally {
  const restore = await clients.admin.client.from('staff_members').update({active:true}).eq('user_id',owner.id);
  assert.equal(restore.error,null);
}
await writeFile('artifacts/cms-preview-verification.json',JSON.stringify({checkedAt:new Date().toISOString(),report},null,2));
console.log('CMS preview guards, draft isolation, no-store/noindex, invalid selection, and existing-session membership removal passed');
