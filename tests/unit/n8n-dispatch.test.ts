import { after } from 'next/server';
import { beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('server-only', () => ({}));
vi.mock('next/server', () => ({
  after: vi.fn(),
}));

import { dispatchN8nWebhook } from '@/lib/n8n-dispatch';

describe('dispatchN8nWebhook', () => {
  beforeEach(() => {
    vi.unstubAllEnvs();
    vi.restoreAllMocks();
    vi.mocked(after).mockReset();
  });

  it('registers the webhook fetch via Next.js after() so serverless runtimes keep it alive', async () => {
    vi.stubEnv('AUTOMATION_SECRET', 'super-secret-value');
    const fetchMock = vi.fn().mockResolvedValue(new Response('{}', { status: 200 }));
    vi.stubGlobal('fetch', fetchMock);

    let scheduledTask: (() => Promise<void>) | undefined;
    vi.mocked(after).mockImplementation((task) => {
      scheduledTask = task as () => Promise<void>;
    });

    dispatchN8nWebhook('https://justinautomaton.app.n8n.cloud/webhook/agencydesk-lead', {
      lead_id: 'lead-123',
      contact_name: 'Justin Test',
    });

    expect(after).toHaveBeenCalledTimes(1);
    expect(fetchMock).not.toHaveBeenCalled();

    await scheduledTask?.();

    expect(fetchMock).toHaveBeenCalledTimes(1);
    const [url, init] = fetchMock.mock.calls[0];
    expect(url).toBe('https://justinautomaton.app.n8n.cloud/webhook/agencydesk-lead');
    expect(init.method).toBe('POST');
    expect(init.headers).toMatchObject({
      'Content-Type': 'application/json',
      'X-AgencyDesk-Signature': 'super-secret-value',
      Authorization: 'Bearer super-secret-value',
    });
  });

  it('falls back to unscheduled fetch when called outside Next.js request context', async () => {
    vi.stubEnv('AUTOMATION_SECRET', 'test-secret');
    const fetchMock = vi.fn().mockResolvedValue(new Response('{}', { status: 200 }));
    vi.stubGlobal('fetch', fetchMock);

    vi.mocked(after).mockImplementation(() => {
      throw new Error('`after` was called outside a request scope.');
    });

    dispatchN8nWebhook('https://justinautomaton.app.n8n.cloud/webhook/agencydesk-lead', {
      lead_id: 'lead-456',
    });

    await Promise.resolve();
    expect(fetchMock).toHaveBeenCalledTimes(1);
  });

  it('skips invalid URLs and missing secrets when requireSecret is true', () => {
    const fetchMock = vi.fn();
    vi.stubGlobal('fetch', fetchMock);

    dispatchN8nWebhook('not-a-valid-url', { lead_id: 'lead-1' });
    dispatchN8nWebhook('https://example.com/hook', { lead_id: 'lead-2' }, { requireSecret: true });
    dispatchN8nWebhook('javascript:alert(1)', { lead_id: 'lead-3' });

    expect(after).not.toHaveBeenCalled();
    expect(fetchMock).not.toHaveBeenCalled();
  });
});
