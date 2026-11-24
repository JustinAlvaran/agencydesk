import { z } from 'zod';
import { endpoint, json, readJson, HttpError } from '@/lib/http';
import { serviceClient } from '@/lib/supabase/admin';
import { isDemo } from '@/lib/env';

const dispatchSchema = z.object({
  to: z.string().min(8).max(30),
  lead_phone: z.string().nullable().optional(),
  message: z.string().min(1).max(4000),
  lead_id: z.string().nullable().optional(),
  timestamp: z.string().optional(),
});

export const POST = (request: Request) =>
  endpoint(async () => {
    // Verify signature if AUTOMATION_SECRET is configured, OR fail closed in production
    const authHeader = request.headers.get('X-AgencyDesk-Signature');
    if (process.env.AUTOMATION_SECRET) {
      if (authHeader !== process.env.AUTOMATION_SECRET) {
        throw new HttpError(401, 'Unauthorized automation signature.');
      }
    } else if (!isDemo()) {
      throw new HttpError(401, 'Automation signature secret is not configured.');
    }

    const payload = dispatchSchema.parse(await readJson(request));

    // Log the automated WhatsApp dispatch to activity_events
    try {
      const supabase = serviceClient();
      await supabase.from('activity_events').insert({
        agency_id: 'a0000000-0000-4000-8000-000000000001',
        event_type: 'whatsapp_alert_dispatched',
        detail: {
          recipient: payload.to,
          lead_phone: payload.lead_phone,
          lead_id: payload.lead_id,
          message_preview: payload.message.slice(0, 150) + '...',
          dispatched_at: payload.timestamp || new Date().toISOString(),
        },
        lead_id:
          payload.lead_id && /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(payload.lead_id)
            ? payload.lead_id
            : null,
      });
    } catch {
      // Non-blocking log persistence: ensure dispatch succeeds even in demo or offline environments
    }

    return json(
      {
        success: true,
        delivered: true,
        recipient: payload.to,
        dispatched_at: new Date().toISOString(),
        message_length: payload.message.length,
      },
      200
    );
  });
