import crypto from 'node:crypto';
import { z } from 'zod';
import { endpoint, json, readJson, HttpError } from '@/lib/http';
import { serviceClient } from '@/lib/supabase/admin';
import { isDemo } from '@/lib/env';
import type { Database } from '@/lib/supabase/database.types';

const E164_REGEX = /^\+[1-9]\d{7,14}$/;

function timingSafeMatch(token: string, secret: string): boolean {
  const hashA = crypto.createHash('sha256').update(token).digest();
  const hashB = crypto.createHash('sha256').update(secret).digest();
  return crypto.timingSafeEqual(hashA, hashB);
}

const leadUpsertSchema = z.object({
  lead_id: z.string().uuid().optional().nullable(),
  contact_name: z.string().trim().min(1).max(100),
  email: z.string().email().max(254).transform((v) => v.toLowerCase().trim()),
  phone: z.string().nullable().optional(),
  whatsapp: z.string().nullable().optional(),
  whatsapp_opt_in: z.boolean().optional(),
  instagram: z.string().nullable().optional(),
  company: z.string().trim().max(200).default('Unassigned Company'),
  service: z.string().trim().min(1).max(100).default('Web & Mobile Applications'),
  brief: z.string().trim().max(4000).default('Lead synced via Google Sheets / External Automation'),
  budget: z.number().min(0).default(0),
  budget_cents: z.number().int().min(0).optional(),
  status: z.enum(['new', 'contacted', 'qualified', 'proposal_sent', 'lost']).default('new'),
  score: z.number().int().min(0).max(100).default(50),
  notes: z.union([z.string(), z.array(z.string())]).optional(),
  source: z.string().trim().min(1).max(100).default('google_sheets'),
  sync_hash: z.string().optional(),
  last_synced_by: z.string().default('n8n_sheets_sync'),
});

export const POST = (request: Request) =>
  endpoint(async () => {
    // 1. Constant-time signature / Authorization check (AUTOMATION_SECRET only)
    const authHeader = request.headers.get('X-AgencyDesk-Signature');
    const bearer = request.headers.get('Authorization')?.replace(/^Bearer\s+/i, '');
    const token = authHeader || bearer;

    const secret = process.env.AUTOMATION_SECRET;
    if (secret) {
      if (!token || !timingSafeMatch(token, secret)) {
        throw new HttpError(401, 'Unauthorized integration signature.');
      }
    } else if (!isDemo()) {
      throw new HttpError(401, 'Integration signature secret is not configured.');
    }

    // 2. Parse & validate payload
    const payload = leadUpsertSchema.parse(await readJson(request));

    if (isDemo()) {
      return json({
        success: true,
        action: 'upserted',
        lead_id: payload.lead_id || 'demo-lead-' + Date.now(),
        mode: 'demo',
      }, 200);
    }

    const supabase = serviceClient();
    const configuredAgencyId = process.env.AGENCYDESK_INTAKE_AGENCY_ID;
    if (!configuredAgencyId && !isDemo()) {
      throw new HttpError(500, 'Intake agency is not configured.');
    }
    const agencyId = configuredAgencyId || 'a0000000-0000-4000-8000-000000000001';
    const appUrl = (process.env.APP_URL || 'https://agencydesk-theta.vercel.app').replace(/\/+$/, '');

    // Normalize phone number to strict E.164
    const rawPhone = payload.whatsapp || payload.phone || '';
    let cleanPhone = rawPhone.replace(/[^\d+]/g, '');
    if (cleanPhone.startsWith('09')) {
      cleanPhone = '+63' + cleanPhone.slice(1);
    } else if (cleanPhone && !cleanPhone.startsWith('+')) {
      cleanPhone = '+' + cleanPhone;
    }
    const validatedPhone = E164_REGEX.test(cleanPhone) ? cleanPhone : null;

    const totalCents = payload.budget_cents ?? Math.round(payload.budget * 100);

    // 3. Check for existing lead by ID or email (strictly scoped to agency_id and unarchived)
    let existingId: string | null = null;
    let existingStatus: string | null = null;
    if (payload.lead_id) {
      const { data } = await supabase
        .from('leads')
        .select('id, status, row_version')
        .eq('agency_id', agencyId)
        .eq('id', payload.lead_id)
        .is('archived_at', null)
        .maybeSingle();
      if (data) {
        existingId = data.id;
        existingStatus = data.status;
      }
    }

    if (!existingId) {
      const { data } = await supabase
        .from('leads')
        .select('id, status, row_version')
        .eq('agency_id', agencyId)
        .eq('email', payload.email)
        .is('archived_at', null)
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle();
      if (data) {
        existingId = data.id;
        existingStatus = data.status;
      }
    }

    // 4. Update or Insert
    if (existingId) {
      const updateData: Database['public']['Tables']['leads']['Update'] = {
        contact_name: payload.contact_name,
        service: payload.service,
        budget_cents: totalCents,
        updated_at: new Date().toISOString(),
      };
      if (validatedPhone) updateData.phone = validatedPhone;
      // Preserve 'won' status to avoid guard_lead() rejection
      if (payload.status && existingStatus !== 'won') {
        updateData.status = payload.status;
      }
      if (payload.whatsapp_opt_in !== undefined && (validatedPhone || !payload.whatsapp_opt_in)) {
        updateData.whatsapp_opt_in = payload.whatsapp_opt_in;
      }
      if (payload.company) updateData.company_name = payload.company;
      if (payload.brief && payload.brief !== 'Lead synced via Google Sheets / External Automation') {
        updateData.brief = payload.brief;
      }

      const { error: updateError } = await supabase
        .from('leads')
        .update(updateData)
        .eq('agency_id', agencyId)
        .eq('id', existingId);

      if (updateError) {
        console.error('Failed to update lead in database:', updateError);
        throw new HttpError(500, 'Database operation could not be completed.');
      }

      // Log activity event
      try {
        await supabase.from('activity_events').insert({
          agency_id: agencyId,
          event_type: 'lead_updated_from_sheets',
          detail: {
            lead_id: existingId,
            contact_name: payload.contact_name,
            email: payload.email,
            status: payload.status,
            synced_by: payload.last_synced_by,
            sync_hash: payload.sync_hash,
            notes: payload.notes,
          },
          lead_id: existingId,
        });
      } catch {
        // Non-blocking log persistence
      }

      return json({
        success: true,
        action: 'updated',
        lead_id: existingId,
        status: existingStatus === 'won' ? 'won' : payload.status,
        crm_url: `${appUrl}/crm/leads?lead=${existingId}`,
      }, 200);
    } else {
      // For new records, generate server-authoritative UUID to prevent cross-tenant key collision
      const newLeadId = crypto.randomUUID();
      const insertData: Database['public']['Tables']['leads']['Insert'] = {
        id: newLeadId,
        agency_id: agencyId,
        contact_name: payload.contact_name,
        email: payload.email,
        phone: validatedPhone,
        company_name: payload.company,
        service: payload.service,
        brief: payload.brief,
        budget_cents: totalCents,
        status: payload.status,
        source: payload.source,
        whatsapp_opt_in: Boolean(payload.whatsapp_opt_in && validatedPhone),
        email_opt_in: false,
      };

      const { error: insertError } = await supabase.from('leads').insert(insertData);
      if (insertError) {
        console.error('Failed to create lead in database:', insertError);
        throw new HttpError(500, 'Database operation could not be completed.');
      }

      // Log activity event
      try {
        await supabase.from('activity_events').insert({
          agency_id: agencyId,
          event_type: 'lead_created_from_sheets',
          detail: {
            lead_id: newLeadId,
            contact_name: payload.contact_name,
            email: payload.email,
            status: payload.status,
            synced_by: payload.last_synced_by,
            sync_hash: payload.sync_hash,
            notes: payload.notes,
          },
          lead_id: newLeadId,
        });
      } catch {
        // Non-blocking log persistence
      }

      return json({
        success: true,
        action: 'created',
        lead_id: newLeadId,
        status: payload.status,
        crm_url: `${appUrl}/crm/leads?lead=${newLeadId}`,
      }, 201);
    }
  });
