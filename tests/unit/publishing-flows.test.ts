import { describe, expect, it } from 'vitest';
// The deployed guard uses the same JavaScript function inside Directus's sandbox.
import { shouldRebuild } from '../../infra/directus/publishing-flows.mjs';

describe('publication event routing', () => {
  it('routes a normal promotion once, even when it includes visibility', () => {
    const event = { collection: 'services', payload: { title: 'Website delivery', visibility: 'visible' } };
    expect(shouldRebuild(event, 'publication')).toBe(true);
    expect(shouldRebuild(event, 'visibility')).toBe(false);
  });
  it('routes an archive or visibility-only promotion once', () => {
    const event = { collection: 'services', payload: { visibility: 'archived' } };
    expect(shouldRebuild(event, 'publication')).toBe(false);
    expect(shouldRebuild(event, 'visibility')).toBe(true);
  });
  it('ignores native draft saves and unrelated records', () => {
    const event = { collection: 'directus_versions', payload: { delta: { title: 'Draft' } } };
    expect(shouldRebuild(event, 'publication')).toBe(false);
    expect(shouldRebuild(event, 'visibility')).toBe(false);
  });
});
