import { readFile, writeFile } from 'node:fs/promises';
import { makePublishingFlow } from '../infra/directus/publishing-flows.mjs';

// Creates inactive, secret-free configuration only. Activation follows the
// hosting gate and private deployment-hook configuration, never draft saves.
const config = JSON.parse(await readFile('.local/cms-secrets.json', 'utf8'));
let token;
async function api(path, method = 'GET', body) {
  const response = await fetch(new URL(path, config.cmsUrl), { method,
    headers: { 'Content-Type': 'application/json', ...(token ? { Authorization: `Bearer ${token}` } : {}) },
    ...(body ? { body: JSON.stringify(body) } : {}), signal: AbortSignal.timeout(60000) });
  const json = await response.json();
  if (!response.ok) throw new Error(`${method} ${path.split('?')[0]} failed (${response.status}, ${json.errors?.[0]?.extensions?.code ?? 'unknown'}): ${json.errors?.[0]?.message ?? 'No diagnostic'}`);
  return json.data;
}
try {
  token = (await api('/auth/login', 'POST', { email: config.ownerEmail, password: config.adminPassword })).access_token;
  const existing = await api('/flows?limit=100&fields=id,name,status');
  const exports = [];
  for (const kind of ['publication', 'visibility']) {
    const definition = makePublishingFlow(kind);
    const found = existing.find(flow => flow.name === definition.flow.name);
    if (found) {
      const current = await api(`/flows/${found.id}?fields=id,operation`);
      if (current.operation) continue;
      definition.flow.id = found.id;
      definition.operations.forEach(operation => { operation.flow = found.id; });
    } else await api('/flows', 'POST', definition.flow);
    for (const operation of definition.operations) await api('/operations', 'POST', { ...operation, resolve: null, reject: null });
    for (const operation of definition.operations) await api(`/operations/${operation.id}`, 'PATCH', { resolve: operation.resolve, reject: operation.reject });
    await api(`/flows/${definition.flow.id}`, 'PATCH', { operation: definition.operations[0].id });
    exports.push({ ...definition, flow: { ...definition.flow, operation: definition.operations[0].id } });
  }
  if (exports.length) await writeFile('infra/directus/publishing-flows.json', JSON.stringify(exports, null, 2) + '\n');
  console.log(`Prepared ${exports.length} inactive publishing flows through REST. No deployment was requested.`);
} catch (error) { console.error(error.message); process.exitCode = 1; }
