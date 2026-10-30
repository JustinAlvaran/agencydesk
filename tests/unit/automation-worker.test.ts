import { describe, expect, it, vi } from 'vitest';
import { secretMatches } from '../../supabase/functions/_shared/delivery';
import { createAutomationWorker, type WorkerBackend } from '../../supabase/functions/_shared/automation-worker';

const agency = '10000000-0000-4000-8000-000000000001';
function setup(mode: string | undefined = 'dry_run', policy: 'configured' | 'dry_run_only' = 'dry_run_only') {
  const values: Record<string, string | undefined> = { SUPABASE_URL: 'https://own.example.test', SUPABASE_SERVICE_ROLE_KEY: 'unit-only', AUTOMATION_AGENCY_ID: agency, AUTOMATION_DELIVERY_MODE: mode, AUTOMATION_N8N_SECRET: 'unit-n8n-secret-012345678901234567890', AUTOMATION_CRON_SECRET: 'unit-cron-secret-012345678901234567890' };
  const env = vi.fn((name: string) => values[name]);
  const backend: WorkerBackend = {
    adminAgency: vi.fn(async () => null),
    rules: vi.fn(async () => [{ id: 'rule', template_key: 'lead_follow_up' }]),
    claim: vi.fn(async () => []),
    revalidate: vi.fn(async () => true),
    finish: vi.fn(async () => true),
  };
  const createBackend = vi.fn(() => backend);
  const deliver = vi.fn(async () => ({ outcome: 'accepted' as const }));
  const handler = createAutomationWorker({ env, createBackend, deliver, policy, matches: secretMatches });
  const request = (secret = 'unit-n8n-secret-012345678901234567890', body = '{}') => new Request('https://own.example.test/functions/v1/automation-dry-run', { method: 'POST', headers: { 'x-automation-secret': secret }, body });
  return { env, values, backend, createBackend, deliver, handler, request };
}
const job = { id: 'job', agency_id: agency, rule_id: 'rule', lease_token: 'lease', channel: 'email', recipient: 'unit@example.test', subject: 'Unit test', body: 'Unit test', template_key: '' };

describe('automation dry-run integration boundary', () => {
  it.each(['live', 'LIVE', '', undefined])('refuses server mode %s before claiming or reading provider credentials', async mode => {
    const s = setup(); s.values.AUTOMATION_DELIVERY_MODE = mode;
    const response = await s.handler(s.request('unit-n8n-secret-012345678901234567890', '{"mode":"dry_run"}'));
    expect(response.status).toBe(409);
    expect(await response.json()).toMatchObject({ error: 'dry_run_required' });
    expect(s.backend.claim).not.toHaveBeenCalled(); expect(s.deliver).not.toHaveBeenCalled();
    expect(s.env.mock.calls.flat()).not.toContain('GMAIL_CLIENT_SECRET');
  });
  it('refuses missing/wrong or broad cron secret on the n8n entry', async () => {
    const s = setup();
    for (const key of ['', 'wrong', 'unit-cron-secret-012345678901234567890']) expect((await s.handler(s.request(key))).status).toBe(401);
    expect(s.backend.claim).not.toHaveBeenCalled();
  });
  it('does not let the n8n credential authenticate the general/live worker', async () => {
    const s = setup('live', 'configured');
    expect((await s.handler(s.request())).status).toBe(403);
    expect(s.deliver).not.toHaveBeenCalled();
  });
  it('returns true zero counts from an empty queue without seeding records', async () => {
    const s = setup(); const response = await s.handler(s.request());
    expect(response.status).toBe(200);
    expect(await response.json()).toEqual({ mode: 'dry_run', processed: {}, claimed: 0 });
    expect(s.backend.claim).toHaveBeenCalledWith(agency);
  });
  it('simulates only leased/revalidated jobs without invoking any delivery provider', async () => {
    const s = setup(); vi.mocked(s.backend.claim).mockResolvedValueOnce([job]);
    const response = await s.handler(s.request());
    expect(await response.json()).toEqual({ mode: 'dry_run', processed: { simulated: 1 }, claimed: 1 });
    expect(s.backend.finish).toHaveBeenCalledWith(job, { outcome: 'simulated' });
    expect(s.deliver).not.toHaveBeenCalled();
    expect(s.env.mock.calls.flat()).not.toContain('GMAIL_REFRESH_TOKEN');
  });
  it('does not finish or dispatch a job when consent/approval revalidation refuses it', async () => {
    const s = setup(); vi.mocked(s.backend.claim).mockResolvedValueOnce([job]); vi.mocked(s.backend.revalidate).mockResolvedValue(false);
    expect(await (await s.handler(s.request())).json()).toMatchObject({ processed: { skipped: 1 } });
    expect(s.backend.finish).not.toHaveBeenCalled(); expect(s.deliver).not.toHaveBeenCalled();
  });
  it('refuses a foreign-agency row even if the backend unexpectedly returns it', async () => {
    const s = setup(); vi.mocked(s.backend.claim).mockResolvedValueOnce([{ ...job, agency_id: 'foreign' }]);
    expect((await s.handler(s.request())).status).toBe(503);
    expect(s.backend.revalidate).not.toHaveBeenCalled(); expect(s.backend.finish).not.toHaveBeenCalled();
  });
  it('never reclaims or auto-retries an unrecorded result', async () => {
    const s = setup(); vi.mocked(s.backend.claim).mockResolvedValueOnce([job]); vi.mocked(s.backend.finish).mockResolvedValue(false);
    expect((await s.handler(s.request())).status).toBe(503);
    expect(s.backend.claim).toHaveBeenCalledTimes(1); expect(s.backend.finish).toHaveBeenCalledTimes(1);
  });
  it('uses authenticated admin membership instead of request-supplied agency', async () => {
    const s = setup(); const memberAgency = '10000000-0000-4000-8000-000000000002';
    vi.mocked(s.backend.adminAgency).mockResolvedValue(memberAgency);
    await s.handler(new Request('https://own.example.test', { method: 'POST', headers: { Authorization: 'Bearer unit-admin-jwt' }, body: JSON.stringify({ agency_id: agency }) }));
    expect(s.backend.claim).toHaveBeenCalledWith(memberAgency);
  });
  it('caps claims at five per call and preserves lease identity', async () => {
    const s = setup(); vi.mocked(s.backend.claim).mockResolvedValue([job]);
    const response = await s.handler(s.request());
    expect(await response.json()).toMatchObject({ claimed: 5, processed: { simulated: 5 } });
    expect(s.backend.revalidate).toHaveBeenCalledWith(job);
  });
  it('rejects unsupported methods and bounded oversize bodies without queue changes', async () => {
    const s = setup();
    expect((await s.handler(new Request('https://own.example.test'))).status).toBe(405);
    expect((await s.handler(s.request('unit-n8n-secret-012345678901234567890', 'a'.repeat(1025)))).status).toBe(413);
    expect(s.backend.claim).not.toHaveBeenCalled();
  });
  it('redacts backend diagnostics on failure', async () => {
    const s = setup(); vi.mocked(s.backend.claim).mockRejectedValue(new Error('private connection detail'));
    const response = await s.handler(s.request()); expect(response.status).toBe(503);
    expect(await response.text()).not.toContain('private connection detail');
  });
  it('preserves frozen sender routing and the original live admin worker contract', async () => {
    const s = setup('live', 'configured'); vi.mocked(s.backend.claim).mockResolvedValueOnce([{ ...job, provider: 'gmail' }]);
    const response = await s.handler(s.request('unit-cron-secret-012345678901234567890'));
    expect(await response.json()).toMatchObject({ mode: 'live', processed: { accepted: 1 }, claimed: 1 });
    expect(s.deliver).toHaveBeenCalledWith(expect.objectContaining({ template_key: 'lead_follow_up' }), expect.objectContaining({ mode: 'live', emailProvider: 'gmail' }));
    expect(s.backend.rules).toHaveBeenCalledWith(agency);
  });
  it('rejects multibyte payloads by actual bytes without Content-Length', async () => {
    const s = setup(); expect((await s.handler(s.request('unit-n8n-secret-012345678901234567890', 'Ã©'.repeat(600)))).status).toBe(413);
    expect(s.backend.claim).not.toHaveBeenCalled();
  });

  it('fails closed when an operator reuses the n8n key as the broad cron key', async () => {
    const dry = setup(); dry.values.AUTOMATION_CRON_SECRET = dry.values.AUTOMATION_N8N_SECRET;
    expect((await dry.handler(dry.request())).status).toBe(503); expect(dry.backend.claim).not.toHaveBeenCalled();
    const live = setup('live', 'configured'); live.values.AUTOMATION_CRON_SECRET = live.values.AUTOMATION_N8N_SECRET;
    expect((await live.handler(live.request())).status).toBe(403); expect(live.backend.claim).not.toHaveBeenCalled();
  });

});
