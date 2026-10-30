import { beforeEach, describe, expect, it, vi } from 'vitest';
const mocks = vi.hoisted(() => ({ admin: vi.fn(), invoke: vi.fn(), refresh: vi.fn(), report: vi.fn(), demo: vi.fn(() => false) }));
vi.mock('next/cache', () => ({ revalidatePath: mocks.refresh }));
vi.mock('@/lib/auth', () => ({ requireAdmin: mocks.admin, requireStaff: vi.fn() }));
vi.mock('@/lib/env', () => ({ isDemo: mocks.demo }));
vi.mock('@/lib/operational-log', () => ({ reportFailure: mocks.report }));
import { processDryRunBatch } from '../../src/app/crm/automations/actions';

beforeEach(() => { vi.clearAllMocks(); mocks.demo.mockReturnValue(false); mocks.admin.mockResolvedValue({ supabase: { functions: { invoke: mocks.invoke } } }); });
describe('approved-job dry-run button', () => {
  it('requires admin before invoking only the dedicated mode-locked endpoint', async () => {
    mocks.admin.mockRejectedValue(new Error('Administrator required'));
    await expect(processDryRunBatch()).rejects.toThrow('Administrator required');
    expect(mocks.invoke).not.toHaveBeenCalled();
  });
  it('reports real zero counts and refreshes the queue after a successful result', async () => {
    mocks.invoke.mockResolvedValue({ data: { mode: 'dry_run', claimed: 0, processed: {} }, error: null });
    const result = await processDryRunBatch();
    expect(mocks.invoke).toHaveBeenCalledExactlyOnceWith('automation-dry-run', { body: {} });
    expect(result).toMatchObject({ ok: true }); expect(result.message).toContain('0 approved due jobs');
    expect(mocks.refresh).toHaveBeenCalledWith('/crm/automations');
  });
  it('does not fall back to the general worker on errors or reveal diagnostics', async () => {
    mocks.invoke.mockResolvedValue({ data: null, error: new Error('private connection details') });
    const result = await processDryRunBatch();
    expect(result.ok).toBe(false); expect(result.message).not.toContain('private connection details');
    expect(mocks.invoke).toHaveBeenCalledTimes(1); expect(mocks.refresh).not.toHaveBeenCalled();
  });
  it.each([{ mode: 'live', claimed: 1 }, { mode: 'dry_run', claimed: -1 }, { mode: 'dry_run', claimed: 6 }, { mode: 'dry_run', claimed: 1.5 }, null])('refuses malformed or live result %j', async data => {
    mocks.invoke.mockResolvedValue({ data, error: null }); expect((await processDryRunBatch()).ok).toBe(false);
    expect(mocks.invoke).toHaveBeenCalledTimes(1);
  });
  it('does not mutate the demo workspace', async () => {
    mocks.demo.mockReturnValue(true); await expect(processDryRunBatch()).rejects.toThrow('read-only');
    expect(mocks.admin).not.toHaveBeenCalled(); expect(mocks.invoke).not.toHaveBeenCalled();
  });
  it.each([{ accepted: 1 }, { simulated: 0 }, { simulated: '1' }, null, []])('refuses unsafe or incomplete processed counts %j', async processed => {
    mocks.invoke.mockResolvedValue({ data: { mode: 'dry_run', claimed: 1, processed }, error: null });
    expect((await processDryRunBatch()).ok).toBe(false); expect(mocks.refresh).not.toHaveBeenCalled();
  });

});
