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
  getDemoAgenciesData,
  getDemoSessionEmail,
  hasDemoSessionCookie,
  isPlatformAdmin,
  loadAgenciesData,
  resolveInviteRedirectUrl,
  resolveOrInviteUser,
} from '@/lib/team-access';

export const dynamic = 'force-dynamic';

const createAgencySchema = z
  .object({
    name: z.string().trim().min(1).max(200),
    slug: z
      .string()
      .trim()
      .regex(/^[a-z0-9][a-z0-9-]{2,79}$/),
    founder_email: z.string().trim().toLowerCase().pipe(z.email().max(254)),
  })
  .strict();

const patchAgencySchema = z
  .object({
    id: z.uuid(),
    intake_enabled: z.boolean(),
  })
  .strict();

export const GET = () =>
  endpoint(async () => {
    if (isDemo() && (await hasDemoSessionCookie())) {
      const email = await getDemoSessionEmail();
      return json(getDemoAgenciesData(email));
    }

    const { staff } = await apiSession('admin');
    if (!isPlatformAdmin(staff)) {
      throw new HttpError(403, 'Platform admin permission required.');
    }

    return json(await loadAgenciesData());
  });

export const POST = (request: Request) =>
  endpoint(async () => {
    sameOrigin(request);

    if (isDemo() && (await hasDemoSessionCookie())) {
      const input = createAgencySchema.parse(await readJson(request));
      const demo = getDemoAgenciesData(await getDemoSessionEmail());
      if (demo.agencies.some((a) => a.slug === input.slug)) {
        throw new HttpError(409, 'An agency with this slug already exists.');
      }

      const agencyId = crypto.randomUUID();
      const founderId = crypto.randomUUID();
      return json(
        {
          ok: true,
          invited: true,
          agency: {
            id: agencyId,
            name: input.name,
            slug: input.slug,
            intake_enabled: true,
            created_at: new Date().toISOString(),
            staff_count: 1,
            admins: [{ user_id: founderId, email: input.founder_email }],
          },
          founder: {
            user_id: founderId,
            email: input.founder_email,
            role: 'admin',
            active: true,
            invited: true,
          },
        },
        201
      );
    }

    const { staff } = await apiSession('admin');
    if (!isPlatformAdmin(staff)) {
      throw new HttpError(403, 'Platform admin permission required.');
    }

    const input = createAgencySchema.parse(await readJson(request));
    const admin = serviceClient();

    const slugRes = await admin
      .from('agencies')
      .select('id')
      .eq('slug', input.slug)
      .maybeSingle();
    databaseError(slugRes.error);
    if (slugRes.data) {
      throw new HttpError(409, 'An agency with this slug already exists.');
    }

    const redirectTo = resolveInviteRedirectUrl(request);
    const { user: founderUser, invited } = await resolveOrInviteUser(
      admin,
      input.founder_email,
      redirectTo
    );

    const existingStaffRes = await admin
      .from('staff_members')
      .select('user_id,agency_id')
      .eq('user_id', founderUser.id)
      .maybeSingle();
    databaseError(existingStaffRes.error);
    if (existingStaffRes.data) {
      throw new HttpError(409, 'Founder account already belongs to an agency.');
    }

    const agencyInsertRes = await admin
      .from('agencies')
      .insert({
        name: input.name,
        slug: input.slug,
        intake_enabled: true,
      })
      .select('id,name,slug,intake_enabled,created_at')
      .single();
    databaseError(agencyInsertRes.error);

    const newAgency = agencyInsertRes.data;
    if (!newAgency) {
      throw new HttpError(503, 'Could not create agency.');
    }

    const staffInsertRes = await admin.from('staff_members').insert({
      user_id: founderUser.id,
      agency_id: newAgency.id,
      role: 'admin',
      active: true,
    });

    if (staffInsertRes.error) {
      await admin.from('agencies').delete().eq('id', newAgency.id);
      databaseError(staffInsertRes.error);
    }

    const founderEmail = founderUser.email ?? input.founder_email;
    return json(
      {
        ok: true,
        invited,
        agency: {
          id: newAgency.id,
          name: newAgency.name,
          slug: newAgency.slug,
          intake_enabled: Boolean(newAgency.intake_enabled),
          created_at: newAgency.created_at,
          staff_count: 1,
          admins: [{ user_id: founderUser.id, email: founderEmail }],
        },
        founder: {
          user_id: founderUser.id,
          email: founderEmail,
          role: 'admin' as const,
          active: true,
          invited,
        },
      },
      201
    );
  });

export const PATCH = (request: Request) =>
  endpoint(async () => {
    sameOrigin(request);

    if (isDemo() && (await hasDemoSessionCookie())) {
      const input = patchAgencySchema.parse(await readJson(request));
      const demo = getDemoAgenciesData(await getDemoSessionEmail());
      const existing = demo.agencies.find((a) => a.id === input.id);
      if (!existing) {
        throw new HttpError(404, 'Agency not found.');
      }
      return json({
        ok: true,
        agency: {
          ...existing,
          intake_enabled: input.intake_enabled,
        },
      });
    }

    const { staff } = await apiSession('admin');
    if (!isPlatformAdmin(staff)) {
      throw new HttpError(403, 'Platform admin permission required.');
    }

    const input = patchAgencySchema.parse(await readJson(request));
    const admin = serviceClient();

    const updateRes = await admin
      .from('agencies')
      .update({ intake_enabled: input.intake_enabled })
      .eq('id', input.id)
      .select('id,name,slug,intake_enabled,created_at')
      .maybeSingle();
    databaseError(updateRes.error);

    if (!updateRes.data) {
      throw new HttpError(404, 'Agency not found.');
    }

    return json({
      ok: true,
      agency: updateRes.data,
    });
  });
