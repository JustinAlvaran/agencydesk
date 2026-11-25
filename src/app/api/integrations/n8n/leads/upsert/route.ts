import { z } from 'zod';
import { endpoint, json, readJson, HttpError } from '@/lib/http';
import { serviceClient } from '@/lib/supabase/admin';
import { isDemo } from '@/lib/env';

const leadUpsertSchema = z.object({
  lead_id: z.string().uuid().optional().nullable(),
  contact_name: z.string().trim().min(1).max(100),
  email: z.string().email().max(254).transform((v) => v.toLowerCase().trim()),
  phone: z.string().nullable().optional(),
  whatsapp: z.string().nullable().optional(),
  whatsapp_opt_in: z.boolean().default(false),
  instagram: z.string().nullable().optional(),
  company: z.string().trim().max(200).default('Unassigned Company'),
  service: z.string().trim().min(1).max(100).default('Web & Mobile Applications'),
  brief: z.string().trim().max(4000).default('Lead synced via Google Sheets / External Automation'),
  budget: z.number().min(0).default(0),
  budget_cents: z.number().int().min(0).optional(),
  status: z.enum(['new', 'contacted', 'qualified', 'proposal_sent', 'won', 'lost']).default('new'),
  score: z.number().int().min(0).max(100).default(50),
  notes: z.union([z.string(), z.array(z.string())]).optional(),
  source: z.string().default('google_sheets'),
  sync_hash: z.string().optional(),
  last_synced_by: z.string().default('n8n_sheets_sync'),
});

// Database generates probability and score automatically based on status, budget, brief, etc.

export const POST = (request: Request) =>
  endpoint(async () => {
    // 1. Signature / Authorization check
    const authHeader = request.headers.get('X-AgencyDesk-Signature');
    const bearer = request.headers.get('Authorization')?.replace(/^Bearer\s+/i, '');
    const token = authHeader || bearer;

    const secret = process.env.AUTOMATION_SECRET || process.env.INTAKE_RATE_SECRET;
    if (secret) {
      if (token !== secret) {
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
    const agencyId = process.env.AGENCYDESK_INTAKE_AGENCY_ID || 'a0000000-0000-4000-8000-000000000001';

    // Normalize phone number to E.164
    let rawPhone = payload.whatsapp || payload.phone || '';
    let cleanPhone = rawPhone.replace(/[^\d+]/g, '');
    if (cleanPhone.startsWith('09')) {
      cleanPhone = '+63' + cleanPhone.slice(1);
    } else if (cleanPhone && !cleanPhone.startsWith('+')) {
      cleanPhone = '+' + cleanPhone;
    }

    const totalCents = payload.budget_cents ?? Math.round(payload.budget * 100);

    // 3. Check for existing lead by ID or email (strictly scoped to agency_id)
    let existingId: string | null = null;
    if (payload.lead_id) {
      const { data } = await supabase
        .from('leads')
        .select('id, status, row_version')
        .eq('agency_id', agencyId)
        .eq('id', payload.lead_id)
        .maybeSingle();
      if (data) existingId = data.id;
    }

    if (!existingId) {
      const { data } = await supabase
        .from('leads')
        .select('id, status, row_version')
        .eq('agency_id', agencyId)
        .eq('email', payload.email)
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle();
      if (data) existingId = data.id;
    }

    // 4. Update or Insert
    if (existingId) {
      const updateData: Record<string, unknown> = {
        contact_name: payload.contact_name,
        service: payload.service,
        budget_cents: totalCents,
        updated_at: new Date().toISOString(),
      };
      if (cleanPhone) updateData.phone = cleanPhone;
      if (payload.status) updateData.status = payload.status;
      if (payload.whatsapp_opt_in !== undefined) updateData.whatsapp_opt_in = payload.whatsapp_opt_in;
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
        throw new HttpError(500, `Failed to update lead: ${updateError.message}`);
      }

      // Log activity
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
        status: payload.status,
        crm_url: `https://agencydesk-theta.vercel.app/crm/leads?lead=${existingId}`,
      }, 200);
    } else {
      const newLeadId = payload.lead_id || crypto.randomUUID();
      const insertData = {
        id: newLeadId,
        agency_id: agencyId,
        contact_name: payload.contact_name,
        email: payload.email,
        phone: cleanPhone || null,
        company_name: payload.company,
        service: payload.service,
        brief: payload.brief,
        budget_cents: totalCents,
        status: payload.status,
        source: payload.source,
        whatsapp_opt_in: payload.whatsapp_opt_in,
        email_opt_in: false,
      };

      const { error: insertError } = await supabase.from('leads').insert(insertData);
      if (insertError) {
        throw new HttpError(500, `Failed to create lead: ${insertError.message}`);
      }

      // Log activity
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
        crm_url: `https://agencydesk-theta.vercel.app/crm/leads?lead=${newLeadId}`,
      }, 201);
    }
  });