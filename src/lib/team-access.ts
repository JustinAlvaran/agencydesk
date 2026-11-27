import 'server-only';
import { cookies } from 'next/headers';
import type { SupabaseClient, User } from '@supabase/supabase-js';
import type { Database } from '@/lib/supabase/database.types';
import { isDemo } from '@/lib/env';
import { databaseError, HttpError } from '@/lib/http';
import { serviceClient } from '@/lib/supabase/admin';

export const ROOT_AGENCY_ID = 'a0000000-0000-4000-8000-000000000001';

export type StaffRole = 'admin' | 'staff';

export interface TeamCurrentUser {
  user_id: string;
  email: string;
  role: StaffRole;
  agency_id: string;
  agency_name: string;
  agency_slug: string;
  is_platform_admin: boolean;
}

export interface TeamStaffMember {
  user_id: string;
  email: string;
  role: StaffRole;
  active: boolean;
}

export interface TeamClientMember {
  user_id: string;
  email: string;
  company_id: string;
  company_name: string;
  active: boolean;
  can_accept_proposals: boolean;
}

export interface TeamCompany {
  id: string;
  name: string;
}

export interface TeamDataResponse {
  currentUser: TeamCurrentUser;
  staff: TeamStaffMember[];
  clients: TeamClientMember[];
  companies: TeamCompany[];
}

export interface AgencyAdminSummary {
  user_id: string;
  email: string;
}

export interface AgencySummary {
  id: string;
  name: string;
  slug: string;
  intake_enabled: boolean;
  created_at: string;
  staff_count: number;
  admins: AgencyAdminSummary[];
}

export interface AgenciesListResponse {
  agencies: AgencySummary[];
}

export const DEMO_COMPANIES: TeamCompany[] = [
  { id: '11111111-1111-4000-8000-000000000001', name: 'Black Mesa AI' },
  { id: '11111111-1111-4000-8000-000000000002', name: 'Northwind Logistics' },
  { id: '11111111-1111-4000-8000-000000000003', name: 'Aether Health' },
  { id: '11111111-1111-4000-8000-000000000004', name: 'Nexus Fintech' },
  { id: '11111111-1111-4000-8000-000000000005', name: 'Horizon Ventures' },
];

export function isPlatformAdmin(
  staff: { agency_id: string; role: string; active?: boolean } | null | undefined
): boolean {
  return Boolean(
    staff &&
      staff.active !== false &&
      staff.agency_id === ROOT_AGENCY_ID &&
      staff.role === 'admin'
  );
}

export async function hasDemoSessionCookie(): Promise<boolean> {
  try {
    const store = await cookies();
    return Boolean(store.get('agencydesk_staff_session')?.value);
  } catch {
    return false;
  }
}

export async function getDemoSessionEmail(): Promise<string> {
  try {
    const store = await cookies();
    const raw = store.get('agencydesk_staff_session')?.value;
    if (raw && raw.includes('@')) return raw;
  } catch {
    // Ignore cookie read errors outside request scope
  }
  return 'admin@agencydesk.com';
}

export function getDemoTeamData(email = 'admin@agencydesk.com'): TeamDataResponse {
  return {
    currentUser: {
      user_id: 'staff-admin-id',
      email,
      role: 'admin',
      agency_id: ROOT_AGENCY_ID,
      agency_name: 'AgencyDesk',
      agency_slug: 'agencydesk',
      is_platform_admin: true,
    },
    staff: [
      { user_id: 'staff-admin-id', email, role: 'admin', active: true },
      {
        user_id: '00000000-0000-4000-8000-000000000102',
        email: 'elena@agencydesk.com',
        role: 'staff',
        active: true,
      },
      {
        user_id: '00000000-0000-4000-8000-000000000103',
        email: 'marco@agencydesk.com',
        role: 'staff',
        active: false,
      },
    ],
    clients: [
      {
        user_id: '22222222-2222-4000-8000-000000000001',
        email: 'client@blackmesa.ai',
        company_id: DEMO_COMPANIES[0].id,
        company_name: DEMO_COMPANIES[0].name,
        active: true,
        can_accept_proposals: true,
      },
      {
        user_id: '22222222-2222-4000-8000-000000000002',
        email: 'ops@northwind.io',
        company_id: DEMO_COMPANIES[1].id,
        company_name: DEMO_COMPANIES[1].name,
        active: true,
        can_accept_proposals: false,
      },
    ],
    companies: DEMO_COMPANIES,
  };
}

export function getDemoAgenciesData(email = 'admin@agencydesk.com'): AgenciesListResponse {
  return {
    agencies: [
      {
        id: ROOT_AGENCY_ID,
        name: 'AgencyDesk',
        slug: 'agencydesk',
        intake_enabled: true,
        created_at: '2026-10-05T03:17:07.000Z',
        staff_count: 3,
        admins: [{ user_id: 'staff-admin-id', email }],
      },
      {
        id: 'a0000000-0000-4000-8000-000000000002',
        name: 'Northstar Studio',
        slug: 'northstar-studio',
        intake_enabled: true,
        created_at: '2026-11-10T09:00:00.000Z',
        staff_count: 4,
        admins: [
          {
            user_id: '33333333-3333-4000-8000-000000000001',
            email: 'founder@northstar.studio',
          },
        ],
      },
      {
        id: 'a0000000-0000-4000-8000-000000000003',
        name: 'Apex Digital',
        slug: 'apex-digital',
        intake_enabled: false,
        created_at: '2026-11-18T14:30:00.000Z',
        staff_count: 2,
        admins: [
          {
            user_id: '33333333-3333-4000-8000-000000000002',
            email: 'alex@apexdigital.co',
          },
        ],
      },
    ],
  };
}

export function resolveInviteRedirectUrl(request: Request): string {
  const configured = process.env.APP_URL;
  let origin: string | null = null;
  if (configured) {
    const parsed = new URL(configured);
    if (parsed.protocol === 'http:' || parsed.protocol === 'https:') {
      origin = parsed.origin;
    }
  }
  if (!origin) {
    const headerOrigin = request.headers.get('origin');
    if (headerOrigin) {
      const parsed = new URL(headerOrigin);
      if (parsed.protocol === 'http:' || parsed.protocol === 'https:') {
        origin = parsed.origin;
      }
    }
  }
  if (!origin) {
    throw new HttpError(503, 'Application origin is not configured.');
  }
  return new URL('/auth/callback', origin).toString();
}

async function listAuthUsers(
  admin: SupabaseClient<Database>,
  matchOrStop: (users: User[], map: Map<string, User>) => boolean
): Promise<Map<string, User>> {
  const found = new Map<string, User>();
  const perPage = 1000;
  for (let page = 1; page <= 10; page++) {
    const res = await admin.auth.admin.listUsers({ page, perPage });
    if (res.error) {
      throw new HttpError(503, 'Could not verify workspace user directory.');
    }
    const users = res.data?.users ?? [];
    for (const u of users) {
      found.set(u.id, u);
    }
    if (matchOrStop(users, found) || users.length < perPage) {
      break;
    }
  }
  return found;
}

export async function buildUserEmailMap(
  admin: SupabaseClient<Database>,
  userIds: string[],
  seed?: { id: string; email?: string | null }
): Promise<Map<string, string>> {
  const emails = new Map<string, string>();
  if (seed?.id && seed.email) {
    emails.set(seed.id, seed.email);
  }
  const needed = new Set(userIds.filter((id) => !emails.has(id)));
  if (needed.size === 0) return emails;

  const users = await listAuthUsers(admin, () => {
    for (const id of needed) {
      if (!emails.has(id)) return false;
    }
    return true;
  });
  for (const [id, user] of users.entries()) {
    if (user.email) emails.set(id, user.email);
  }
  return emails;
}

export async function resolveOrInviteUser(
  admin: SupabaseClient<Database>,
  email: string,
  redirectTo: string
): Promise<{ user: User; invited: boolean }> {
  const normalizedEmail = email.trim().toLowerCase();
  let matchedUser: User | undefined;

  await listAuthUsers(admin, (batch) => {
    const hit = batch.find((u) => u.email?.trim().toLowerCase() === normalizedEmail);
    if (hit) {
      matchedUser = hit;
      return true;
    }
    return false;
  });

  if (matchedUser) {
    return { user: matchedUser, invited: false };
  }

  const inviteRes = await admin.auth.admin.inviteUserByEmail(normalizedEmail, {
    redirectTo,
  });
  if (inviteRes.error || !inviteRes.data?.user) {
    const msg = inviteRes.error?.message?.toLowerCase() ?? '';
    if (msg.includes('already') || msg.includes('registered') || msg.includes('exists')) {
      throw new HttpError(409, 'A user with this email already exists.');
    }
    throw new HttpError(503, 'Could not send workspace invitation.');
  }

  return { user: inviteRes.data.user, invited: true };
}

export async function loadTeamData(params: {
  agencyId: string;
  userId: string;
  userEmail: string;
  role: StaffRole;
  supabase: SupabaseClient<Database>;
  adminClient?: SupabaseClient<Database>;
}): Promise<TeamDataResponse> {
  const { agencyId, userId, userEmail, role, supabase } = params;
  const admin = params.adminClient ?? serviceClient();

  const [agencyRes, staffRes, clientsRes, companiesRes] = await Promise.all([
    supabase.from('agencies').select('id,name,slug').eq('id', agencyId).maybeSingle(),
    supabase
      .from('staff_members')
      .select('user_id,role,active,agency_id')
      .eq('agency_id', agencyId),
    supabase
      .from('client_memberships')
      .select('user_id,company_id,active,can_accept_proposals,agency_id')
      .eq('agency_id', agencyId),
    supabase.from('companies').select('id,name,agency_id').eq('agency_id', agencyId).order('name'),
  ]);

  databaseError(agencyRes.error);
  databaseError(staffRes.error);
  databaseError(clientsRes.error);
  databaseError(companiesRes.error);

  const staffRows = staffRes.data ?? [];
  const clientRows = clientsRes.data ?? [];
  const companyRows = companiesRes.data ?? [];

  const allUserIds = Array.from(
    new Set([
      userId,
      ...staffRows.map((s) => s.user_id),
      ...clientRows.map((c) => c.user_id),
    ])
  );
  const emailByUserId = await buildUserEmailMap(admin, allUserIds, {
    id: userId,
    email: userEmail,
  });

  const companyNameById = new Map(companyRows.map((c) => [c.id, c.name]));

  const staff: TeamStaffMember[] = staffRows
    .filter((s) => s.agency_id === agencyId)
    .map((s) => ({
      user_id: s.user_id,
      email: emailByUserId.get(s.user_id) ?? 'Unknown user',
      role: s.role === 'admin' ? 'admin' : 'staff',
      active: Boolean(s.active),
    }));

  const clients: TeamClientMember[] = clientRows
    .filter((c) => c.agency_id === agencyId)
    .map((c) => ({
      user_id: c.user_id,
      email: emailByUserId.get(c.user_id) ?? 'Unknown user',
      company_id: c.company_id,
      company_name: companyNameById.get(c.company_id) ?? 'Unknown company',
      active: Boolean(c.active),
      can_accept_proposals: Boolean(c.can_accept_proposals),
    }));

  const companies: TeamCompany[] = companyRows
    .filter((c) => c.agency_id === agencyId)
    .map((c) => ({ id: c.id, name: c.name }));

  return {
    currentUser: {
      user_id: userId,
      email: emailByUserId.get(userId) ?? userEmail,
      role,
      agency_id: agencyId,
      agency_name: agencyRes.data?.name ?? 'Agency Workspace',
      agency_slug: agencyRes.data?.slug ?? 'agency',
      is_platform_admin: isPlatformAdmin({ agency_id: agencyId, role, active: true }),
    },
    staff,
    clients,
    companies,
  };
}

export async function loadAgenciesData(
  adminClient?: SupabaseClient<Database>
): Promise<AgenciesListResponse> {
  const admin = adminClient ?? serviceClient();

  const [agenciesRes, staffRes] = await Promise.all([
    admin
      .from('agencies')
      .select('id,name,slug,intake_enabled,created_at')
      .order('created_at', { ascending: true }),
    admin.from('staff_members').select('user_id,agency_id,role,active'),
  ]);

  databaseError(agenciesRes.error);
  databaseError(staffRes.error);

  const agencyRows = agenciesRes.data ?? [];
  const staffRows = staffRes.data ?? [];

  const adminUserIds = Array.from(
    new Set(
      staffRows
        .filter((s) => s.role === 'admin' && s.active)
        .map((s) => s.user_id)
    )
  );
  const emailByUserId = await buildUserEmailMap(admin, adminUserIds);

  const agencies: AgencySummary[] = agencyRows.map((agency) => {
    const agencyStaff = staffRows.filter((s) => s.agency_id === agency.id);
    const admins = agencyStaff
      .filter((s) => s.role === 'admin' && s.active)
      .map((s) => ({
        user_id: s.user_id,
        email: emailByUserId.get(s.user_id) ?? 'Unknown admin',
      }));

    return {
      id: agency.id,
      name: agency.name,
      slug: agency.slug,
      intake_enabled: Boolean(agency.intake_enabled),
      created_at: agency.created_at,
      staff_count: agencyStaff.length,
      admins,
    };
  });

  return { agencies };
}

export async function loadTeamPageSnapshot(params: {
  userId: string;
  userEmail: string;
  role: StaffRole;
  agencyId: string;
  supabase: SupabaseClient<Database> | null;
}): Promise<{ team: TeamDataResponse; agencies: AgencySummary[] }> {
  if (isDemo() || !params.supabase) {
    const email = params.userEmail || (await getDemoSessionEmail());
    return {
      team: getDemoTeamData(email),
      agencies: getDemoAgenciesData(email).agencies,
    };
  }

  const team = await loadTeamData({
    agencyId: params.agencyId,
    userId: params.userId,
    userEmail: params.userEmail,
    role: params.role,
    supabase: params.supabase,
  });

  const agencies = team.currentUser.is_platform_admin
    ? (await loadAgenciesData()).agencies
    : [];

  return { team, agencies };
}
