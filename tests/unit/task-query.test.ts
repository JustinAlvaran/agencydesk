import { beforeEach, describe, expect, it, vi } from 'vitest';
import { createClient } from '@supabase/supabase-js';

vi.mock('server-only', () => ({}));
const { staff } = vi.hoisted(() => ({ staff: vi.fn() }));
vi.mock('@/lib/auth', () => ({ requireStaff: staff, requireUser: vi.fn() }));
import { listFollowUpTasks } from '@/lib/data';

describe('follow-up task query', () => {
  let requested: URL;
  const userId = '11111111-1111-4111-8111-111111111111';
  beforeEach(() => {
    const supabase = createClient('https://own-project.example.test', 'test-publishable-key', {
      auth: { persistSession: false, autoRefreshToken: false },
      global: { fetch: async (input) => {
        requested = new URL(String(input));
        return new Response('[]', { status: 200, headers: { 'Content-Type': 'application/json', 'Content-Range': '*/0' } });
      } },
    });
    staff.mockResolvedValue({ supabase, user: { id: userId } });
  });

  it('defaults to open tasks and orders due dates before applying pagination', async () => {
    const result = await listFollowUpTasks({ page: '2' });
    expect(requested.searchParams.get('completed_at')).toBe('is.null');
    expect(requested.searchParams.get('order')).toBe('due_at.asc.nullslast,id.asc');
    expect(requested.searchParams.get('offset')).toBe('25');
    expect(requested.searchParams.get('limit')).toBe('25');
    expect(requested.searchParams.get('select')).toContain('lead:leads(id,contact_name)');
    expect(result.status).toBe('open');
  });

  it('uses the authenticated user for mine, and retains the open condition for overdue tasks', async () => {
    await listFollowUpTasks({ owner: 'mine', status: 'overdue' });
    expect(requested.searchParams.get('assigned_to')).toBe(`eq.${userId}`);
    expect(requested.searchParams.get('completed_at')).toBe('is.null');
    const deadline = requested.searchParams.get('due_at');
    expect(deadline?.startsWith('lt.')).toBe(true);
    expect(Number.isFinite(Date.parse(deadline!.slice(3)))).toBe(true);
  });

  it('supports completed and unassigned without accepting arbitrary owner input', async () => {
    await listFollowUpTasks({ owner: 'unassigned', status: 'completed' });
    expect(requested.searchParams.get('assigned_to')).toBe('is.null');
    expect(requested.searchParams.get('completed_at')).toBe('not.is.null');
    await listFollowUpTasks({ owner: userId, status: 'all' });
    expect(requested.searchParams.has('assigned_to')).toBe(false);
    expect(requested.searchParams.has('completed_at')).toBe(false);
  });
});
