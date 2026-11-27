import crypto from 'node:crypto';
import { z } from 'zod';
import { endpoint, HttpError, json, readBody } from '@/lib/http';
import { isDemo } from '@/lib/env';
import { serviceClient } from '@/lib/supabase/admin';

const E164_REGEX = /^\+[1-9]\d{7,14}$/;

const calcomWebhookSchema = z.object({
  triggerEvent: z.enum(['BOOKING_CREATED', 'BOOKING_RESCHEDULED', 'BOOKING_CANCELLED']),
  createdAt: z.string().optional(),
  payload: z.object({
    uid: z.string().trim().min(1).max(200),
    title: z.string().trim().max(300).optional(),
    description: z.string().trim().max(4000).optional(),
    startTime: z
      .string()
      .trim()
      .min(1)
      .max(100)
      .refine((v) => !Number.isNaN(Date.parse(v)), { message: 'Invalid startTime.' }),
    endTime: z.string().trim().max(100).optional(),
    attendees: z
      .array(
        z.object({
          name: z.string().trim().max(150).optional(),
          email: z.email().max(254).transform((v) => v.toLowerCase().trim()),
          timeZone: z.string().trim().max(100).optional(),
          phoneNumber: z.string().trim().max(50).optional(),
        })
      )
      .min(1),
    videoCallData: z
      .object({
        url: z.string().trim().max(500).optional(),
      })
      .nullable()
      .optional(),
    metadata: z.record(z.string(), z.unknown()).optional(),
    responses: z
      .object({
        phone: z.object({ value: z.string().optional() }).optional(),
        notes: z.object({ value: z.string().optional() }).optional(),
        company: z.object({ value: z.string().optional() }).optional(),
      })
      .passthrough()
      .optional(),
  }),
});

function verifyCalSignature(rawBody: string, headerValue: string, secret: string): boolean {
  const normalized = headerValue.trim().replace(/^sha256=/i, '').toLowerCase();
  if (!/^[a-f0-9]{64}$/.test(normalized)) return false;
  const expected = crypto.createHmac('sha256', secret).update(rawBody, 'utf8').digest();
  const supplied = Buffer.from(normalized, 'hex');
  if (expected.length !== supplied.length) return false;
  return crypto.timingSafeEqual(expected, supplied);
}

function normalizePhone(raw?: string | null): string | null {
  if (!raw) return null;
  let cleaned = raw.replace(/[^\d+]/g, '');
  if (!cleaned) return null;
  if (cleaned.startsWith('09')) {
    cleaned = '+63' + cleaned.slice(1);
  } else if (!cleaned.startsWith('+')) {
    cleaned = '+' + cleaned;
  }
  return E164_REGEX.test(cleaned) ? cleaned : null;
}

function sanitizeMeetingUrl(raw?: string | null): string | null {
  if (!raw) return null;
  try {
    const parsed = new URL(raw);
    if (parsed.protocol !== 'https:') return null;
    return parsed.toString();
  } catch {
    return null;
  }
}

const eventTypeMap: Record<
  z.infer<typeof calcomWebhookSchema>['triggerEvent'],
  'calcom_booking_created' | 'calcom_booking_rescheduled' | 'calcom_booking_cancelled'
> = {
  BOOKING_CREATED: 'calcom_booking_created',
  BOOKING_RESCHEDULED: 'calcom_booking_rescheduled',
  BOOKING_CANCELLED: 'calcom_booking_cancelled',
};

function fireLifecycleWebhook(payload: Record<string, unknown>) {
  if (isDemo()) return;
  const secret = process.env.AUTOMATION_SECRET;
  const webhookUrl = process.env.N8N_LIFECYCLE_WEBHOOK_URL || process.env.N8N_LEAD_WEBHOOK_URL;
  if (!secret || !webhookUrl) return;
  try {
    new URL(webhookUrl);
    void fetch(webhookUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-AgencyDesk-Signature': secret,
        Authorization: `Bearer ${secret}`,
      },
      body: JSON.stringify(payload),
      signal: AbortSignal.timeout(5000),
    }).catch(() => {});
  } catch {
    // Best-effort notification: never fail webhook acknowledgment
  }
}

export const POST = (request: Request) =>
  endpoint(async () => {
    if (!request.headers.get('content-type')?.includes('application/json')) {
      throw new HttpError(415, 'Use application/json.');
    }

    const rawBody = await readBody(request, 65536);
    const secret = process.env.CALCOM_WEBHOOK_SECRET;
    const signature = request.headers.get('x-cal-signature-256') ?? '';

    if (secret) {
      if (!verifyCalSignature(rawBody, signature, secret)) {
        throw new HttpError(401, 'Invalid Cal.com webhook signature.');
      }
    } else if (!isDemo()) {
      throw new HttpError(401, 'Cal.com webhook secret is not configured.');
    }

    let parsedJson: unknown;
    try {
      parsedJson = JSON.parse(rawBody);
    } catch {
      throw new HttpError(400, 'Malformed JSON payload.');
    }

    const input = calcomWebhookSchema.parse(parsedJson);
    const attendee = input.payload.attendees[0];
    const attendeeName = (attendee.name || attendee.email.split('@')[0] || 'Cal.com Guest').slice(0, 100);
    const startIso = new Date(input.payload.startTime).toISOString();
    const meetingUrl = sanitizeMeetingUrl(input.payload.videoCallData?.url);
    const normalizedPhone = normalizePhone(
      attendee.phoneNumber || input.payload.responses?.phone?.value
    );
    const companyName = (
      input.payload.responses?.company?.value ||
      (typeof input.payload.metadata?.company === 'string' ? input.payload.metadata.company : '') ||
      ''
    )
      .trim()
      .slice(0, 200);
    const activityEventType = eventTypeMap[input.triggerEvent];

    if (isDemo()) {
      return json({
        success: true,
        mode: 'demo',
        trigger_event: input.triggerEvent,
        event_type: activityEventType,
        booking_uid: input.payload.uid,
        attendee_email: attendee.email,
        start_time: startIso,
        meeting_url: meetingUrl,
      });
    }

    const agencyParsed = z.uuid().safeParse(process.env.AGENCYDESK_INTAKE_AGENCY_ID);
    if (!agencyParsed.success) {
      throw new HttpError(503, 'Workspace intake agency is not configured.');
    }
    const agencyId = agencyParsed.data;
    const supabase = serviceClient();

    const existingRes = await supabase
      .from('leads')
      .select('id, status, phone, company_name')
      .eq('agency_id', agencyId)
      .eq('email', attendee.email)
      .is('archived_at', null)
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle();

    if (existingRes.error) {
      throw new HttpError(503, 'Could not query lead record.');
    }

    let leadId: string;
    let leadStage: string;
    let createdNewLead = false;

    if (existingRes.data) {
      leadId = existingRes.data.id;
      leadStage = existingRes.data.status;

      if (input.triggerEvent !== 'BOOKING_CANCELLED' && existingRes.data.status === 'new') {
        const nextUpdate: { status: string; phone?: string; company_name?: string } = {
          status: 'contacted',
        };
        if (normalizedPhone && !existingRes.data.phone) {
          nextUpdate.phone = normalizedPhone;
        }
        if (companyName && !existingRes.data.company_name) {
          nextUpdate.company_name = companyName;
        }
        const updateRes = await supabase
          .from('leads')
          .update(nextUpdate)
          .eq('id', leadId)
          .eq('agency_id', agencyId);
        if (updateRes.error) {
          throw new HttpError(503, 'Could not update lead stage.');
        }
        leadStage = 'contacted';
      }
    } else {
      leadId = crypto.randomUUID();
      leadStage = input.triggerEvent === 'BOOKING_CANCELLED' ? 'new' : 'contacted';
      createdNewLead = true;
      const briefParts = [
        `Discovery call ${input.triggerEvent.toLowerCase().replace('booking_', '')} via Cal.com.`,
        input.payload.title ? `Topic: ${input.payload.title}` : '',
        input.payload.responses?.notes?.value ? `Notes: ${input.payload.responses.notes.value}` : '',
        input.payload.description ? input.payload.description : '',
      ].filter(Boolean);

      const insertRes = await supabase.from('leads').insert({
        id: leadId,
        agency_id: agencyId,
        contact_name: attendeeName,
        email: attendee.email,
        phone: normalizedPhone,
        company_name: companyName,
        service: 'AI & Workflow Automations',
        brief: briefParts.join(' ').slice(0, 4000),
        budget_cents: 0,
        status: leadStage,
        source: 'calcom',
        email_opt_in: false,
        whatsapp_opt_in: false,
      });

      if (insertRes.error) {
        throw new HttpError(503, 'Could not create Cal.com lead record.');
      }
    }

    const activityRes = await supabase.from('activity_events').insert({
      agency_id: agencyId,
      lead_id: leadId,
      event_type: activityEventType,
      detail: {
        booking_uid: input.payload.uid,
        trigger_event: input.triggerEvent,
        title: input.payload.title ?? 'Discovery Call',
        start_time: startIso,
        end_time: input.payload.endTime ?? null,
        meeting_url: meetingUrl,
        attendee_email: attendee.email,
        attendee_name: attendeeName,
      },
    });
    if (activityRes.error) {
      throw new HttpError(503, 'Could not record booking activity.');
    }

    if (input.triggerEvent !== 'BOOKING_CANCELLED') {
      const taskPrefix =
        input.triggerEvent === 'BOOKING_RESCHEDULED'
          ? 'Rescheduled discovery call'
          : 'Discovery call';
      const taskRes = await supabase.from('follow_up_tasks').insert({
        agency_id: agencyId,
        lead_id: leadId,
        title: `${taskPrefix}: ${attendeeName}`.slice(0, 180),
        due_at: startIso,
      });
      if (taskRes.error) {
        throw new HttpError(503, 'Could not schedule discovery follow-up task.');
      }
    }

    fireLifecycleWebhook({
      event: activityEventType,
      event_type: activityEventType,
      booking_uid: input.payload.uid,
      lead_id: leadId,
      created_new_lead: createdNewLead,
      stage: leadStage,
      contact_name: attendeeName,
      email: attendee.email,
      phone: normalizedPhone,
      company: companyName || 'Unassigned company',
      start_time: startIso,
      meeting_url: meetingUrl,
      timestamp: new Date().toISOString(),
    });

    return json({
      success: true,
      mode: 'live',
      trigger_event: input.triggerEvent,
      event_type: activityEventType,
      lead_id: leadId,
      stage: leadStage,
      created_new_lead: createdNewLead,
    });
  });
