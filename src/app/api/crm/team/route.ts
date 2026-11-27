import { z } from 'zod';
import {
  apiSession,
  databaseError,
  endpoint,
  HttpError,
  json,
  readJson,
  sameOrigin,
} from '@/lib/http';
import { isDemo } from '@/lib/env';
import { serviceClient } from '@/lib/supabase/admin';
import {
  getDemoSessionEmail,
  getDemoTeamData,
  hasDemoSessionCookie,
  loadTeamData,
  resolveInviteRedirectUrl,
  resolveOrInviteUser,
} from '@/lib/team-access';

export const dynamic = 'force-dynamic';

const createMemberSchema = z.discriminatedUnion('kind', [
  z
    .object({
      kind: z.literal('staff'),
      email: z.string().trim().toLowerCase().pipe(z.email().max(254)),
      role: z.enum(['staff', 'admin']),
    })
    .strict(),
  z
    .object({
      kind: z.literal('client'),
      email: z.string().trim().toLowerCase().pipe(z.email().max(254)),
      company_id: z.uuid(),
      can_accept_proposals: z.boolean().default(false),
    })
    .strict(),
]);

const patchMemberSchema = z.discriminatedUnion('kind', [
  z
    .object({
      kind: z.literal('staff'),
      user_id: z.union([z.uuid(), z.literal('staff-admin-id')]),
      role: z.enum(['admin', 'staff']).optional(),
      active: z.boolean().optional(),
    })
    .strict()
    .refine((v) => v.role !== undefined || v.active !== undefined, {
      message: 'Specify role or active status to update.',
    }),
  z
    .object({
      kind: z.literal('client'),
      user_id: z.uuid(),
      company_id: z.uuid(),
      active: z.boolean().optional(),
      can_accept_proposals: z.boolean().optional(),
    })
    .strict()
    .refine((v) => v.active !== undefined || v.can_accept_proposals !== undefined, {
      message: 'Specify active or can_accept_proposals to update.',
    }),
]);

export const GET = () =>
  endpoint(async () => {
    if (isDemo() && (await hasDemoSessionCookie())) {
      const email = await getDemoSessionEmail();
      return json(getDemoTeamData(email));
    }

    const { supabase, user, staff } = await apiSession('staff');
    if (!staff) throw new HttpError(403, 'Workspace permission required.');

    const payload = await loadTeamData({
      agencyId: staff.agency_id,
      userId: user.id,
      userEmail: user.email ?? '',
      role: staff.role === 'admin' ? 'admin' : 'staff',
      supabase,
    });

    return json(payload);
  });

export const POST = (request: Request) =>
  endpoint(async () => {
    sameOrigin(request);

    if (isDemo() && (await hasDemoSessionCookie())) {
      const input = createMemberSchema.parse(await readJson(request));
      const demo = getDemoTeamData(await getDemoSessionEmail());
      if (input.kind === 'staff') {
        const existing = demo.staff.find(
          (s) => s.email.toLowerCase() === input.email.toLowerCase()
        );
        return json(
          {
            ok: true,
            invited: !existing,
            member: {
              user_id: existing?.user_id ?? crypto.randomUUID(),
              email: input.email,
              role: input.role,
              active: true,
            },
          },
          201
        );
      }

      const company = demo.companies.find((c) => c.id === input.company_id);
      if (!company) {
        throw new HttpError(404, 'Company not found in your agency.');
      }
      const existingClient = demo.clients.find(
        (c) =>
          c.email.toLowerCase() === input.email.toLowerCase() &&
          c.company_id === input.company_id
      );
      return json(
        {
          ok: true,
          invited: !existingClient,
          member: {
            user_id: existingClient?.user_id ?? crypto.randomUUID(),
            email: input.email,
            company_id: company.id,
            company_name: company.name,
            active: true,
            can_accept_proposals: input.can_accept_proposals,
          },
        },
        201
      );
    }

    const { supabase, staff } = await apiSession('admin');
    if (!staff || staff.role !== 'admin') {
      throw new HttpError(403, 'Workspace admin permission required.');
    }

    const input = createMemberSchema.parse(await readJson(request));
    const admin = serviceClient();
    const redirectTo = resolveInviteRedirectUrl(request);

    if (input.kind === 'staff') {
      const { user: targetUser, invited } = await resolveOrInviteUser(
        admin,
        input.email,
        redirectTo
      );

      const existingStaffRes = await admin
        .from('staff_members')
        .select('user_id,agency_id,role,active')
        .eq('user_id', targetUser.id)
        .maybeSingle();
      databaseError(existingStaffRes.error);

      if (existingStaffRes.data && existingStaffRes.data.agency_id !== staff.agency_id) {
        throw new HttpError(409, 'This user already belongs to another agency.');
      }

      if (existingStaffRes.data) {
        const updateRes = await admin
          .from('staff_members')
          .update({ role: input.role, active: true })
          .eq('user_id', targetUser.id)
          .eq('agency_id', staff.agency_id)
          .select('user_id,role,active')
          .single();
        databaseError(updateRes.error);
      } else {
        const insertRes = await admin.from('staff_members').insert({
          user_id: targetUser.id,
          agency_id: staff.agency_id,
          role: input.role,
          active: true,
        });
        databaseError(insertRes.error);
      }

      return json(
        {
          ok: true,
          invited,
          member: {
            user_id: targetUser.id,
            email: targetUser.email ?? input.email,
            role: input.role,
            active: true,
          },
        },
        201
      );
    }

    const companyRes = await supabase
      .from('companies')
      .select('id,name,agency_id')
      .eq('id', input.company_id)
      .eq('agency_id', staff.agency_id)
      .maybeSingle();
    databaseError(companyRes.error);
    if (!companyRes.data) {
      throw new HttpError(404, 'Company not found in your agency.');
    }

    const { user: targetUser, invited } = await resolveOrInviteUser(
      admin,
      input.email,
      redirectTo
    );

    const existingClientRes = await admin
      .from('client_memberships')
      .select('user_id,company_id,agency_id')
      .eq('user_id', targetUser.id)
      .eq('company_id', companyRes.data.id)
      .eq('agency_id', staff.agency_id)
      .maybeSingle();
    databaseError(existingClientRes.error);

    if (existingClientRes.data) {
      const updateClientRes = await admin
        .from('client_memberships')
        .update({
          active: true,
          can_accept_proposals: input.can_accept_proposals,
        })
        .eq('user_id', targetUser.id)
        .eq('company_id', companyRes.data.id)
        .eq('agency_id', staff.agency_id);
      databaseError(updateClientRes.error);
    } else {
      const insertClientRes = await admin.from('client_memberships').insert({
        user_id: targetUser.id,
        company_id: companyRes.data.id,
        agency_id: staff.agency_id,
        active: true,
        can_accept_proposals: input.can_accept_proposals,
      });
      databaseError(insertClientRes.error);
    }

    return json(
      {
        ok: true,
        invited,
        member: {
          user_id: targetUser.id,
          email: targetUser.email ?? input.email,
          company_id: companyRes.data.id,
          company_name: companyRes.data.name,
          active: true,
          can_accept_proposals: input.can_accept_proposals,
        },
      },
      201
    );
  });

export const PATCH = (request: Request) =>
  endpoint(async () => {
    sameOrigin(request);

    if (isDemo() && (await hasDemoSessionCookie())) {
      const input = patchMemberSchema.parse(await readJson(request));
      const demo = getDemoTeamData(await getDemoSessionEmail());

      if (input.kind === 'staff') {
        const target = demo.staff.find((s) => s.user_id === input.user_id);
        if (!target) {
          throw new HttpError(404, 'Team member not found in your agency.');
        }
        if (input.user_id === demo.currentUser.user_id && input.active === false) {
          throw new HttpError(409, 'You cannot deactivate your own account.');
        }
        const nextRole = input.role ?? target.role;
        const nextActive = input.active ?? target.active;
        const remainingActiveAdmins = demo.staff.filter(
          (s) => s.user_id !== target.user_id && s.role === 'admin' && s.active
        ).length;
        if (
          target.role === 'admin' &&
          target.active &&
          (nextRole !== 'admin' || !nextActive) &&
          remainingActiveAdmins === 0
        ) {
          throw new HttpError(409, 'Each agency must retain at least one active admin.');
        }

        return json({
          ok: true,
          member: {
            ...target,
            role: nextRole,
            active: nextActive,
          },
        });
      }

      const clientTarget = demo.clients.find(
        (c) => c.user_id === input.user_id && c.company_id === input.company_id
      );
      if (!clientTarget) {
        throw new HttpError(404, 'Client membership not found in your agency.');
      }

      return json({
        ok: true,
        member: {
          ...clientTarget,
          active: input.active ?? clientTarget.active,
          can_accept_proposals:
            input.can_accept_proposals ?? clientTarget.can_accept_proposals,
        },
      });
    }

    const { supabase, user, staff } = await apiSession('admin');
    if (!staff || staff.role !== 'admin') {
      throw new HttpError(403, 'Workspace admin permission required.');
    }

    const input = patchMemberSchema.parse(await readJson(request));

    if (input.kind === 'staff') {
      if (input.user_id === 'staff-admin-id') {
        throw new HttpError(400, 'Check the submitted fields.');
      }
      if (input.user_id === user.id && input.active === false) {
        throw new HttpError(409, 'You cannot deactivate your own account.');
      }

      const targetRes = await supabase
        .from('staff_members')
        .select('user_id,agency_id,role,active')
        .eq('user_id', input.user_id)
        .eq('agency_id', staff.agency_id)
        .maybeSingle();
      databaseError(targetRes.error);

      if (!targetRes.data) {
        throw new HttpError(404, 'Team member not found in your agency.');
      }

      const nextRole = input.role ?? (targetRes.data.role === 'admin' ? 'admin' : 'staff');
      const nextActive = input.active ?? Boolean(targetRes.data.active);
      const wasActiveAdmin = targetRes.data.role === 'admin' && Boolean(targetRes.data.active);

      if (wasActiveAdmin && (nextRole !== 'admin' || !nextActive)) {
        const activeAdminsRes = await supabase
          .from('staff_members')
          .select('user_id')
          .eq('agency_id', staff.agency_id)
          .eq('role', 'admin')
          .eq('active', true);
        databaseError(activeAdminsRes.error);

        const remainingActiveAdmins = (activeAdminsRes.data ?? []).filter(
          (a) => a.user_id !== input.user_id
        ).length;
        if (remainingActiveAdmins === 0) {
          throw new HttpError(409, 'Each agency must retain at least one active admin.');
        }
      }

      const updateRes = await supabase
        .from('staff_members')
        .update({ role: nextRole, active: nextActive })
        .eq('user_id', input.user_id)
        .eq('agency_id', staff.agency_id)
        .select('user_id,role,active')
        .single();
      databaseError(updateRes.error);

      return json({
        ok: true,
        member: updateRes.data,
      });
    }

    const clientTargetRes = await supabase
      .from('client_memberships')
      .select('user_id,company_id,agency_id,active,can_accept_proposals')
      .eq('user_id', input.user_id)
      .eq('company_id', input.company_id)
      .eq('agency_id', staff.agency_id)
      .maybeSingle();
    databaseError(clientTargetRes.error);

    if (!clientTargetRes.data) {
      throw new HttpError(404, 'Client membership not found in your agency.');
    }

    const nextClientActive = input.active ?? Boolean(clientTargetRes.data.active);
    const nextCanAccept =
      input.can_accept_proposals ?? Boolean(clientTargetRes.data.can_accept_proposals);

    const updateClientRes = await supabase
      .from('client_memberships')
      .update({
        active: nextClientActive,
        can_accept_proposals: nextCanAccept,
      })
      .eq('user_id', input.user_id)
      .eq('company_id', input.company_id)
      .eq('agency_id', staff.agency_id)
      .select('user_id,company_id,active,can_accept_proposals')
      .single();
    databaseError(updateClientRes.error);

    return json({
      ok: true,
      member: updateClientRes.data,
    });
  });
