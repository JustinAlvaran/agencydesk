import { randomUUID } from 'node:crypto';

export const collections = ['site_settings', 'home_page', 'services', 'sample_projects'];

// Promotions also emit items.update. Route visibility-only promotions through
// the visibility flow once; all other promotions use the publication flow.
export function shouldRebuild(trigger, kind) {
  if (!collections.includes(trigger?.collection)) return false;
  const payload = trigger.payload ?? {};
  const keys = Object.keys(payload).filter(key => key !== 'id');
  const visibilityOnly = ['services', 'sample_projects'].includes(trigger.collection)
    && keys.length === 1 && keys[0] === 'visibility'
    && ['visible', 'archived'].includes(payload.visibility);
  return kind === 'visibility' ? visibilityOnly : !visibilityOnly;
}

export function makePublishingFlow(kind) {
  const id = randomUUID();
  const operationIds = Array.from({ length: 5 }, () => randomUUID());
  const guard = `const collections = ${JSON.stringify(collections)};\n${shouldRebuild.toString()}\nmodule.exports = data => ({ rebuild: shouldRebuild(data.$trigger, ${JSON.stringify(kind)}) });`;
  const operations = [
    { id: operationIds[0], key: 'select_public_change', name: 'Select published change', type: 'exec', options: { code: guard }, resolve: operationIds[1] },
    { id: operationIds[1], key: 'check_rebuild', name: 'Rebuild needed', type: 'condition', options: { filter: { select_public_change: { rebuild: { _eq: true } } } }, resolve: operationIds[2] },
    { id: operationIds[2], key: 'request_rebuild', name: 'Request website deployment', type: 'request', options: { method: 'POST', url: '{{$env.VERCEL_DEPLOY_HOOK}}', body: {}, headers: [] }, resolve: operationIds[3], reject: operationIds[4] },
    { id: operationIds[3], key: 'rebuild_requested', name: 'Request accepted', type: 'log', options: { message: 'Website rebuild requested. Publication becomes live after deployment succeeds.' } },
    { id: operationIds[4], key: 'rebuild_failed', name: 'Request failed', type: 'log', options: { message: 'Website rebuild request failed. Published CMS content remains saved; use the owner rebuild action to retry.' } },
  ].map((operation, index) => ({ ...operation, flow: id, position_x: index * 20, position_y: index * 20, resolve: operation.resolve ?? null, reject: operation.reject ?? null }));
  return {
    flow: { id, name: `AgencyDesk ${kind === 'visibility' ? 'visibility' : 'publication'} rebuild`, status: 'inactive', trigger: 'event', accountability: 'activity', operation: null,
      options: { type: 'action', scope: kind === 'visibility' ? ['items.update'] : collections.map(collection => `${collection}.items.promote`), collections: kind === 'visibility' ? ['services', 'sample_projects'] : collections },
    }, operations,
  };
}
