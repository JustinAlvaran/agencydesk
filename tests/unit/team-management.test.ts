import { beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('server-only', () => ({}));

const hoisted = vi.hoisted(() => ({
  cookiesGet: vi.fn(),
  createServerClient: vi.fn(),
  createAdminClient: vi.fn(),
}));

vi.mock('next/headers', () => ({
  cookies: vi.fn(async () => ({
    get: hoisted.cookiesGet,
  })),
}));

vi.mock('@/lib/supabase/server', () => ({
  createClient: hoisted.createServerClient,
}));

vi.mock('@/lib/supabase/admin', () => ({
  serviceClient: hoisted.createAdminClient,
}));

import { ROOT_AGENCY_ID, isPlatformAdmin } from '@/lib/team-access';
import {
  GET as getTeam,
  POST as postTeam,
  PATCH as patchTeam,
} from '@/app/api/crm/team/route';
import {
  GET as getAgencies,
  POST as postAgencies,
  PATCH as patchAgencies,
} from '@/app/api/crm/agencies/route';

const ORIGIN = 'http://localhost:3000';
const AGENCY_B_ID = 'b0000000-0000-4000-8000-000000000002';
const USER_ADMIN_1 = '10000000-0000-4000-8000-000000000001';
const USER_ADMIN_2 = '10000000-0000-4000-8000-000000000002';
const USER_STAFF_1 = '10000000-0000-4000-8000-000000000003';
const USER_CLIENT_1 = '20000000-0000-4000-8000-000000000001';
const USER_NEW_INVITE = '30000000-0000-4000-8000-000000000001';
const COMPANY_1 = '40000000-0000-4000-8000-000000000001';
const COMPANY_OTHER_AGENCY = '40000000-0000-4000-8000-000000000099';

type Row = Record<string, unknown>;

interface MockDbState {
  agencies: Row[];
  staff_members: Row[];
  client_memberships: Row[];
  companies: Row[];
  authUsers: Array<{ id: string; email: string }>;
  failStaffInsert?: boolean;
}

function makeQueryBuilder(
  table: keyof Omit<MockDbState, 'authUsers' | 'failStaffInsert'>,
  state: MockDbState,
  filters: Array<{ col: string; val: unknown }> = [],
  mode: 'select' | 'insert' | 'update' | 'delete' = 'select',
  payload?: Row | Row[],
  callsLog?: Array<{ table: string; op: string; filters: Array<{ col: string; val: unknown }> }>
) {
  const applyFilters = (rows: Row[]) =>
    rows.filter((r) => filters.every((f) => r[f.col] === f.val));

  const execute = async (): Promise<{ data: unknown; error: { code?: string; message?: string } | null }> => {
    callsLog?.push({ table, op: mode, filters: [...filters] });

    if (mode === 'insert') {
      if (table === 'staff_members' && state.failStaffInsert) {
        return { data: null, error: { code: '23505', message: 'Simulated staff insert failure' } };
      }
      const rowsToInsert = Array.isArray(payload) ? payload : [payload!];
      const inserted = rowsToInsert.map((r) => ({
        id: r.id ?? crypto.randomUUID(),
        created_at: r.created_at ?? '2026-11-27T12:00:00.000Z',
        ...r,
      }));
      state[table].push(...inserted);
      return { data: inserted, error: null };
    }

    if (mode === 'update') {
      const matched = applyFilters(state[table]);
      for (const row of matched) {
        Object.assign(row, payload);
      }
      return { data: matched.map((r) => ({ ...r })), error: null };
    }

    if (mode === 'delete') {
      const remaining = state[table].filter((r) => !filters.every((f) => r[f.col] === f.val));
      const deletedCount = state[table].length - remaining.length;
      state[table] = remaining;
      return { data: { deletedCount }, error: null };
    }

    return { data: applyFilters(state[table]).map((r) => ({ ...r })), error: null };
  };

  const builder: Record<string, unknown> = {
    select: () => builder,
    insert: (row: Row | Row[]) =>
      makeQueryBuilder(table, state, filters, 'insert', row, callsLog),
    update: (patch: Row) =>
      makeQueryBuilder(table, state, filters, 'update', patch, callsLog),
    delete: () =>
      makeQueryBuilder(table, state, filters, 'delete', undefined, callsLog),
    eq: (col: string, val: unknown) => {
      filters.push({ col, val });
      return builder;
    },
    order: () => builder,
    maybeSingle: async () => {
      const res = await execute();
      if (res.error) return { data: null, error: res.error };
      const rows = Array.isArray(res.data) ? res.data : [];
      return { data: rows[0] ?? null, error: null };
    },
    single: async () => {
      const res = await execute();
      if (res.error) return { data: null, error: res.error };
      const rows = Array.isArray(res.data) ? res.data : [];
      if (!rows[0]) {
        return { data: null, error: { code: 'PGRST116', message: 'Not found' } };
      }
      return { data: rows[0], error: null };
    },
    then: (onFulfilled: (val: unknown) => unknown, onRejected?: (err: unknown) => unknown) =>
      execute().then(onFulfilled, onRejected),
  };

  return builder;
}

function createLiveHarness(opts: {
  caller: { id: string; email: string } | null;
  state: MockDbState;
}) {
  const queryLog: Array<{ table: string; op: string; filters: Array<{ col: string; val: unknown }> }> = [];
  const inviteUserByEmail = vi.fn(async (email: string) => {
    const existing = opts.state.authUsers.find(
      (u) => u.email.toLowerCase() === email.toLowerCase()
    );
    if (existing) {
      return { data: { user: null }, error: { message: 'User already registered' } };
    }
    const created = { id: USER_NEW_INVITE, email };
    opts.state.authUsers.push(created);
    return { data: { user: created }, error: null };
  });

  const listUsers = vi.fn(async () => ({
    data: { users: opts.state.authUsers },
    error: null,
  }));

  const serverClient = {
    auth: {
      getUser: vi.fn(async () => ({
        data: { user: opts.caller },
        error: null,
      })),
    },
    from: (table: keyof Omit<MockDbState, 'authUsers' | 'failStaffInsert'>) =>
      makeQueryBuilder(table, opts.state, [], 'select', undefined, queryLog),
  };

  const adminClient = {
    auth: {
      admin: {
        listUsers,
        inviteUserByEmail,
      },
    },
    from: (table: keyof Omit<MockDbState, 'authUsers' | 'failStaffInsert'>) =>
      makeQueryBuilder(table, opts.state, [], 'select', undefined, queryLog),
  };

  hoisted.createServerClient.mockResolvedValue(serverClient);
  hoisted.createAdminClient.mockReturnValue(adminClient);

  return { queryLog, inviteUserByEmail, listUsers };
}

function enableLiveEnv() {
  vi.stubEnv('NEXT_PUBLIC_SUPABASE_URL', 'https://example.supabase.co');
  vi.stubEnv('NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY', 'sb_publishable_test');
  vi.stubEnv('SUPABASE_SECRET_KEY', 'sb_secret_test');
}

function jsonReq(url: string, method: string, body?: unknown, originHeader: string | null = ORIGIN) {
  const headers: Record<string, string> = {};
  if (originHeader !== null) headers.origin = originHeader;
  if (body !== undefined) headers['content-type'] = 'application/json';
  return new Request(url, {
    method,
    headers,
    body: body !== undefined ? JSON.stringify(body) : undefined,
  });
}

function defaultState(): MockDbState {
  return {
    agencies: [
      {
        id: ROOT_AGENCY_ID,
        name: 'AgencyDesk',
        slug: 'agencydesk',
        intake_enabled: true,
        created_at: '2026-10-05T03:17:07.000Z',
      },
      {
        id: AGENCY_B_ID,
        name: 'Beta Agency',
        slug: 'beta-agency',
        intake_enabled: true,
        created_at: '2026-11-01T00:00:00.000Z',
      },
    ],
    staff_members: [
      { user_id: USER_ADMIN_1, agency_id: ROOT_AGENCY_ID, role: 'admin', active: true },
      { user_id: USER_STAFF_1, agency_id: ROOT_AGENCY_ID, role: 'staff', active: true },
      { user_id: USER_ADMIN_2, agency_id: AGENCY_B_ID, role: 'admin', active: true },
    ],
    client_memberships: [
      {
        user_id: USER_CLIENT_1,
        company_id: COMPANY_1,
        agency_id: ROOT_AGENCY_ID,
        active: true,
        can_accept_proposals: true,
      },
      {
        user_id: '20000000-0000-4000-8000-000000000099',
        company_id: COMPANY_OTHER_AGENCY,
        agency_id: AGENCY_B_ID,
        active: true,
        can_accept_proposals: false,
      },
    ],
    companies: [
      { id: COMPANY_1, name: 'Black Mesa AI', agency_id: ROOT_AGENCY_ID },
      { id: COMPANY_OTHER_AGENCY, name: 'Other Agency Co', agency_id: AGENCY_B_ID },
    ],
    authUsers: [
      { id: USER_ADMIN_1, email: 'root-admin@agencydesk.com' },
      { id: USER_STAFF_1, email: 'staff@agencydesk.com' },
      { id: USER_ADMIN_2, email: 'beta-founder@beta.agency' },
      { id: USER_CLIENT_1, email: 'client@blackmesa.ai' },
    ],
  };
}

describe('Team & Agency Management Backend', () => {
  beforeEach(() => {
    vi.unstubAllEnvs();
    vi.restoreAllMocks();
    vi.stubEnv('APP_URL', ORIGIN);
    vi.stubEnv('NEXT_PUBLIC_SUPABASE_URL', '');
    vi.stubEnv('NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY', '');
    hoisted.cookiesGet.mockReturnValue(undefined);
  });

  describe('1. Fail-closed unconfigured / unauthenticated & CSRF origin checks', () => {
    it('fails closed (503) when unconfigured and no demo session cookie exists', async () => {
      expect((await getTeam()).status).toBe(503);
      expect(
        (await postTeam(jsonReq(`${ORIGIN}/api/crm/team`, 'POST', { kind: 'staff', email: 'a@b.com', role: 'staff' }))).status
      ).toBe(503);
      expect(
        (await patchTeam(jsonReq(`${ORIGIN}/api/crm/team`, 'PATCH', { kind: 'staff', user_id: USER_STAFF_1, active: false }))).status
      ).toBe(503);
      expect((await getAgencies()).status).toBe(503);
      expect(
        (await postAgencies(jsonReq(`${ORIGIN}/api/crm/agencies`, 'POST', { name: 'New', slug: 'new-co', founder_email: 'f@new.co' }))).status
      ).toBe(503);
      expect(
        (await patchAgencies(jsonReq(`${ORIGIN}/api/crm/agencies`, 'PATCH', { id: AGENCY_B_ID, intake_enabled: false }))).status
      ).toBe(503);
    });

    it('rejects unauthenticated requests with 401 in live mode', async () => {
      enableLiveEnv();
      createLiveHarness({ caller: null, state: defaultState() });

      expect((await getTeam()).status).toBe(401);
      expect((await getAgencies()).status).toBe(401);
      expect(
        (await postTeam(jsonReq(`${ORIGIN}/api/crm/team`, 'POST', { kind: 'staff', email: 'a@b.com', role: 'staff' }))).status
      ).toBe(401);
    });

    it('enforces sameOrigin (403) on all POST and PATCH routes', async () => {
      enableLiveEnv();
      createLiveHarness({
        caller: { id: USER_ADMIN_1, email: 'root-admin@agencydesk.com' },
        state: defaultState(),
      });

      const evil = 'https://evil.example';
      expect((await postTeam(jsonReq(`${ORIGIN}/api/crm/team`, 'POST', {}, evil))).status).toBe(403);
      expect((await patchTeam(jsonReq(`${ORIGIN}/api/crm/team`, 'PATCH', {}, evil))).status).toBe(403);
      expect((await postAgencies(jsonReq(`${ORIGIN}/api/crm/agencies`, 'POST', {}, evil))).status).toBe(403);
      expect((await patchAgencies(jsonReq(`${ORIGIN}/api/crm/agencies`, 'PATCH', {}, evil))).status).toBe(403);
      expect((await postTeam(jsonReq(`${ORIGIN}/api/crm/team`, 'POST', {}, null))).status).toBe(403);
    });
  });

  describe('2. Role gates & platform admin checks', () => {
    it('identifies platform admin only for active admin in ROOT_AGENCY_ID', () => {
      expect(isPlatformAdmin({ agency_id: ROOT_AGENCY_ID, role: 'admin', active: true })).toBe(true);
      expect(isPlatformAdmin({ agency_id: ROOT_AGENCY_ID, role: 'staff', active: true })).toBe(false);
      expect(isPlatformAdmin({ agency_id: AGENCY_B_ID, role: 'admin', active: true })).toBe(false);
      expect(isPlatformAdmin({ agency_id: ROOT_AGENCY_ID, role: 'admin', active: false })).toBe(false);
    });

    it('rejects non-staff authenticated user with 403', async () => {
      enableLiveEnv();
      createLiveHarness({
        caller: { id: USER_CLIENT_1, email: 'client@blackmesa.ai' },
        state: defaultState(),
      });

      expect((await getTeam()).status).toBe(403);
      expect((await getAgencies()).status).toBe(403);
    });

    it('allows non-admin staff to GET /api/crm/team (read-only) but blocks mutations & agencies with 403', async () => {
      enableLiveEnv();
      createLiveHarness({
        caller: { id: USER_STAFF_1, email: 'staff@agencydesk.com' },
        state: defaultState(),
      });

      const res = await getTeam();
      expect(res.status).toBe(200);
      const data = await res.json();
      expect(data.currentUser.role).toBe('staff');
      expect(data.currentUser.is_platform_admin).toBe(false);

      expect(
        (await postTeam(jsonReq(`${ORIGIN}/api/crm/team`, 'POST', { kind: 'staff', email: 'x@agencydesk.com', role: 'staff' }))).status
      ).toBe(403);
      expect(
        (await patchTeam(jsonReq(`${ORIGIN}/api/crm/team`, 'PATCH', { kind: 'staff', user_id: USER_ADMIN_1, active: false }))).status
      ).toBe(403);
      expect((await getAgencies()).status).toBe(403);
    });

    it('blocks non-root agency admin from /api/crm/agencies with 403', async () => {
      enableLiveEnv();
      createLiveHarness({
        caller: { id: USER_ADMIN_2, email: 'beta-founder@beta.agency' },
        state: defaultState(),
      });

      const teamRes = await getTeam();
      expect(teamRes.status).toBe(200);
      const teamData = await teamRes.json();
      expect(teamData.currentUser.agency_id).toBe(AGENCY_B_ID);
      expect(teamData.currentUser.is_platform_admin).toBe(false);

      expect((await getAgencies()).status).toBe(403);
      expect(
        (await postAgencies(jsonReq(`${ORIGIN}/api/crm/agencies`, 'POST', { name: 'Gamma', slug: 'gamma-co', founder_email: 'g@gamma.co' }))).status
      ).toBe(403);
      expect(
        (await patchAgencies(jsonReq(`${ORIGIN}/api/crm/agencies`, 'PATCH', { id: ROOT_AGENCY_ID, intake_enabled: false }))).status
      ).toBe(403);
    });
  });

  describe('3. Cross-agency isolation', () => {
    it('scopes GET /api/crm/team strictly to caller agency_id', async () => {
      enableLiveEnv();
      const state = defaultState();
      createLiveHarness({
        caller: { id: USER_ADMIN_2, email: 'beta-founder@beta.agency' },
        state,
      });

      const res = await getTeam();
      expect(res.status).toBe(200);
      const data = await res.json();

      expect(data.currentUser.agency_id).toBe(AGENCY_B_ID);
      expect(data.currentUser.agency_name).toBe('Beta Agency');
      expect(data.staff).toHaveLength(1);
      expect(data.staff[0].user_id).toBe(USER_ADMIN_2);
      expect(data.companies).toEqual([{ id: COMPANY_OTHER_AGENCY, name: 'Other Agency Co' }]);
      expect(data.clients).toHaveLength(1);
      expect(data.clients[0].company_id).toBe(COMPANY_OTHER_AGENCY);
    });

    it('fails closed (409) when inviting a staff user who already belongs to a DIFFERENT agency', async () => {
      enableLiveEnv();
      const state = defaultState();
      const { inviteUserByEmail } = createLiveHarness({
        caller: { id: USER_ADMIN_1, email: 'root-admin@agencydesk.com' },
        state,
      });

      const res = await postTeam(
        jsonReq(`${ORIGIN}/api/crm/team`, 'POST', {
          kind: 'staff',
          email: 'beta-founder@beta.agency',
          role: 'staff',
        })
      );
      expect(res.status).toBe(409);
      expect(inviteUserByEmail).not.toHaveBeenCalled();
      expect(state.staff_members.find((s) => s.user_id === USER_ADMIN_2)?.agency_id).toBe(AGENCY_B_ID);
    });

    it('rejects client invitation (404) when company_id belongs to a different agency before inviting auth user', async () => {
      enableLiveEnv();
      const state = defaultState();
      const { inviteUserByEmail } = createLiveHarness({
        caller: { id: USER_ADMIN_1, email: 'root-admin@agencydesk.com' },
        state,
      });

      const res = await postTeam(
        jsonReq(`${ORIGIN}/api/crm/team`, 'POST', {
          kind: 'client',
          email: 'new-client@other.co',
          company_id: COMPANY_OTHER_AGENCY,
          can_accept_proposals: true,
        })
      );
      expect(res.status).toBe(404);
      expect(inviteUserByEmail).not.toHaveBeenCalled();
    });

    it('blocks cross-agency PATCH /api/crm/team with 404 and filters by caller agency_id', async () => {
      enableLiveEnv();
      const state = defaultState();
      const { queryLog } = createLiveHarness({
        caller: { id: USER_ADMIN_1, email: 'root-admin@agencydesk.com' },
        state,
      });

      const res = await patchTeam(
        jsonReq(`${ORIGIN}/api/crm/team`, 'PATCH', {
          kind: 'staff',
          user_id: USER_ADMIN_2,
          active: false,
        })
      );
      expect(res.status).toBe(404);
      expect(state.staff_members.find((s) => s.user_id === USER_ADMIN_2)?.active).toBe(true);
      expect(
        queryLog.some(
          (q) =>
            q.table === 'staff_members' &&
            q.filters.some((f) => f.col === 'agency_id' && f.val === ROOT_AGENCY_ID)
        )
      ).toBe(true);
    });
  });

  describe('4. Last-admin & self-deactivation guards + staff/client CRUD', () => {
    it('blocks self-deactivation with 409 even when another admin exists', async () => {
      enableLiveEnv();
      const state = defaultState();
      state.staff_members.push({
        user_id: USER_NEW_INVITE,
        agency_id: ROOT_AGENCY_ID,
        role: 'admin',
        active: true,
      });
      createLiveHarness({
        caller: { id: USER_ADMIN_1, email: 'root-admin@agencydesk.com' },
        state,
      });

      const res = await patchTeam(
        jsonReq(`${ORIGIN}/api/crm/team`, 'PATCH', {
          kind: 'staff',
          user_id: USER_ADMIN_1,
          active: false,
        })
      );
      expect(res.status).toBe(409);
    });

    it('blocks demoting or deactivating the last active admin of an agency (409)', async () => {
      enableLiveEnv();
      const state = defaultState();
      createLiveHarness({
        caller: { id: USER_ADMIN_1, email: 'root-admin@agencydesk.com' },
        state,
      });

      const demoteRes = await patchTeam(
        jsonReq(`${ORIGIN}/api/crm/team`, 'PATCH', {
          kind: 'staff',
          user_id: USER_ADMIN_1,
          role: 'staff',
        })
      );
      expect(demoteRes.status).toBe(409);

      // Add a second active admin, then demoting first should succeed
      state.staff_members.push({
        user_id: USER_NEW_INVITE,
        agency_id: ROOT_AGENCY_ID,
        role: 'admin',
        active: true,
      });
      const okRes = await patchTeam(
        jsonReq(`${ORIGIN}/api/crm/team`, 'PATCH', {
          kind: 'staff',
          user_id: USER_NEW_INVITE,
          role: 'staff',
        })
      );
      expect(okRes.status).toBe(200);
      expect(state.staff_members.find((s) => s.user_id === USER_NEW_INVITE)?.role).toBe('staff');
    });

    it('invites new staff and client members in live mode with safe redirectTo', async () => {
      enableLiveEnv();
      const state = defaultState();
      const { inviteUserByEmail } = createLiveHarness({
        caller: { id: USER_ADMIN_1, email: 'root-admin@agencydesk.com' },
        state,
      });

      const staffRes = await postTeam(
        jsonReq(`${ORIGIN}/api/crm/team`, 'POST', {
          kind: 'staff',
          email: 'new-staff@agencydesk.com',
          role: 'admin',
        })
      );
      expect(staffRes.status).toBe(201);
      const staffData = await staffRes.json();
      expect(staffData.ok).toBe(true);
      expect(staffData.invited).toBe(true);
      expect(staffData.member).toMatchObject({
        user_id: USER_NEW_INVITE,
        email: 'new-staff@agencydesk.com',
        role: 'admin',
        active: true,
      });
      expect(inviteUserByEmail).toHaveBeenCalledWith('new-staff@agencydesk.com', {
        redirectTo: `${ORIGIN}/auth/callback`,
      });

      // Re-inviting existing user in same agency does not call inviteUserByEmail
      inviteUserByEmail.mockClear();
      const clientRes = await postTeam(
        jsonReq(`${ORIGIN}/api/crm/team`, 'POST', {
          kind: 'client',
          email: 'client@blackmesa.ai',
          company_id: COMPANY_1,
          can_accept_proposals: false,
        })
      );
      expect(clientRes.status).toBe(201);
      const clientData = await clientRes.json();
      expect(clientData.ok).toBe(true);
      expect(clientData.invited).toBe(false);
      expect(clientData.member.can_accept_proposals).toBe(false);
      expect(inviteUserByEmail).not.toHaveBeenCalled();

      // Updating client permissions via PATCH
      const patchClientRes = await patchTeam(
        jsonReq(`${ORIGIN}/api/crm/team`, 'PATCH', {
          kind: 'client',
          user_id: USER_CLIENT_1,
          company_id: COMPANY_1,
          can_accept_proposals: true,
          active: false,
        })
      );
      expect(patchClientRes.status).toBe(200);
      const updated = state.client_memberships.find(
        (c) => c.user_id === USER_CLIENT_1 && c.company_id === COMPANY_1
      );
      expect(updated?.active).toBe(false);
      expect(updated?.can_accept_proposals).toBe(true);
    });
  });

  describe('5. Platform Admin Agency Onboarding & Rollback', () => {
    it('lists agencies with staff_count and admin emails for platform admin', async () => {
      enableLiveEnv();
      createLiveHarness({
        caller: { id: USER_ADMIN_1, email: 'root-admin@agencydesk.com' },
        state: defaultState(),
      });

      const res = await getAgencies();
      expect(res.status).toBe(200);
      const data = await res.json();
      expect(data.agencies).toHaveLength(2);
      expect(data.agencies[0]).toMatchObject({
        id: ROOT_AGENCY_ID,
        slug: 'agencydesk',
        staff_count: 2,
        admins: [{ user_id: USER_ADMIN_1, email: 'root-admin@agencydesk.com' }],
      });
    });

    it('creates a new agency, invites founder as admin, and validates slug/conflicts', async () => {
      enableLiveEnv();
      const state = defaultState();
      createLiveHarness({
        caller: { id: USER_ADMIN_1, email: 'root-admin@agencydesk.com' },
        state,
      });

      const badSlug = await postAgencies(
        jsonReq(`${ORIGIN}/api/crm/agencies`, 'POST', {
          name: 'Bad Slug',
          slug: 'INVALID_SLUG!',
          founder_email: 'founder@new.co',
        })
      );
      expect(badSlug.status).toBe(400);

      const conflictFounder = await postAgencies(
        jsonReq(`${ORIGIN}/api/crm/agencies`, 'POST', {
          name: 'Gamma Studio',
          slug: 'gamma-studio',
          founder_email: 'staff@agencydesk.com',
        })
      );
      expect(conflictFounder.status).toBe(409);

      const okRes = await postAgencies(
        jsonReq(`${ORIGIN}/api/crm/agencies`, 'POST', {
          name: 'Gamma Studio',
          slug: 'gamma-studio',
          founder_email: 'founder@gamma.studio',
        })
      );
      expect(okRes.status).toBe(201);
      const created = await okRes.json();
      expect(created.ok).toBe(true);
      expect(created.agency.slug).toBe('gamma-studio');
      expect(created.founder).toMatchObject({
        user_id: USER_NEW_INVITE,
        email: 'founder@gamma.studio',
        role: 'admin',
        active: true,
        invited: true,
      });
      expect(state.agencies).toHaveLength(3);
      expect(
        state.staff_members.find(
          (s) => s.user_id === USER_NEW_INVITE && s.agency_id === created.agency.id && s.role === 'admin'
        )
      ).toBeDefined();
    });

    it('rolls back the newly created agency row if inserting the founder fails', async () => {
      enableLiveEnv();
      const state = defaultState();
      state.failStaffInsert = true;
      createLiveHarness({
        caller: { id: USER_ADMIN_1, email: 'root-admin@agencydesk.com' },
        state,
      });

      const res = await postAgencies(
        jsonReq(`${ORIGIN}/api/crm/agencies`, 'POST', {
          name: 'Rollback Studio',
          slug: 'rollback-studio',
          founder_email: 'founder@rollback.studio',
        })
      );
      expect(res.status).toBe(409);
      expect(state.agencies.some((a) => a.slug === 'rollback-studio')).toBe(false);
    });

    it('updates agency intake_enabled via PATCH /api/crm/agencies', async () => {
      enableLiveEnv();
      const state = defaultState();
      createLiveHarness({
        caller: { id: USER_ADMIN_1, email: 'root-admin@agencydesk.com' },
        state,
      });

      const res = await patchAgencies(
        jsonReq(`${ORIGIN}/api/crm/agencies`, 'PATCH', {
          id: AGENCY_B_ID,
          intake_enabled: false,
        })
      );
      expect(res.status).toBe(200);
      const data = await res.json();
      expect(data.agency.intake_enabled).toBe(false);
      expect(state.agencies.find((a) => a.id === AGENCY_B_ID)?.intake_enabled).toBe(false);
    });
  });

  describe('6. Demo mode support with demo session cookie', () => {
    it('supports GET/POST/PATCH on /api/crm/team and /api/crm/agencies in demo mode', async () => {
      hoisted.cookiesGet.mockImplementation((name: string) =>
        name === 'agencydesk_staff_session' ? { value: 'admin@agencydesk.com' } : undefined
      );

      const teamGet = await getTeam();
      expect(teamGet.status).toBe(200);
      const teamData = await teamGet.json();
      expect(teamData.currentUser.is_platform_admin).toBe(true);
      expect(teamData.currentUser.agency_id).toBe(ROOT_AGENCY_ID);
      expect(teamData.companies.length).toBeGreaterThan(0);

      const teamPost = await postTeam(
        jsonReq(`${ORIGIN}/api/crm/team`, 'POST', {
          kind: 'staff',
          email: 'demo-hire@agencydesk.com',
          role: 'staff',
        })
      );
      expect(teamPost.status).toBe(201);

      const selfDeactivate = await patchTeam(
        jsonReq(`${ORIGIN}/api/crm/team`, 'PATCH', {
          kind: 'staff',
          user_id: 'staff-admin-id',
          active: false,
        })
      );
      expect(selfDeactivate.status).toBe(409);

      const agenciesGet = await getAgencies();
      expect(agenciesGet.status).toBe(200);
      const agenciesData = await agenciesGet.json();
      expect(agenciesData.agencies.length).toBeGreaterThanOrEqual(2);

      const agencyPost = await postAgencies(
        jsonReq(`${ORIGIN}/api/crm/agencies`, 'POST', {
          name: 'Demo Partner',
          slug: 'demo-partner',
          founder_email: 'founder@demopartner.io',
        })
      );
      expect(agencyPost.status).toBe(201);

      const agencyPatch = await patchAgencies(
        jsonReq(`${ORIGIN}/api/crm/agencies`, 'PATCH', {
          id: ROOT_AGENCY_ID,
          intake_enabled: false,
        })
      );
      expect(agencyPatch.status).toBe(200);
    });
  });
});
