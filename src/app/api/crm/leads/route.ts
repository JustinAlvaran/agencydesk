import {z} from 'zod';
import {apiSession,endpoint,json,readJson,sameOrigin,databaseError} from '@/lib/http';
import {crmData} from '@/lib/crm-data';
export const GET=()=>endpoint(async()=>{const {supabase}=await apiSession();return json({leads:(await crmData(supabase)).leads});});
export const POST = (request: Request) =>
  endpoint(async () => {
    sameOrigin(request);
    const { supabase } = await apiSession();
    const input = z
      .object({
        submission_id: z.uuid(),
        contact_name: z.string().trim().min(1).max(100),
        email: z.email().max(254),
        service: z.string().trim().min(1).max(100),
        brief: z.string().trim().min(1).max(4000),
        budget: z.number().int().min(0).max(1000000).default(0),
        company_id: z.uuid().nullable().default(null),
        phone: z.string().regex(/^\+[1-9]\d{7,14}$/).nullable().default(null),
        whatsapp: z.union([z.string().regex(/^\+[1-9]\d{7,14}$/), z.literal('')]).nullable().default(null),
        whatsapp_opt_in: z.boolean().default(false),
        instagram: z.string().nullable().default(null),
      })
      .parse(await readJson(request));

    const phoneValue = input.whatsapp || input.phone;
    const { data, error } = await supabase.rpc('create_manual_lead', {
      p_action_id: input.submission_id,
      p_details: {
        ...input,
        phone: phoneValue,
        budget_cents: input.budget * 100,
        source: 'staff',
        email_opt_in: false,
        whatsapp_opt_in: input.whatsapp_opt_in,
        owner_id: null,
      },
    });
    databaseError(error);

    // Asynchronous webhook to n8n automation engine
    if (process.env.N8N_LEAD_WEBHOOK_URL) {
      const secret = process.env.AUTOMATION_SECRET;
      fetch(process.env.N8N_LEAD_WEBHOOK_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(secret ? { 'X-AgencyDesk-Signature': secret, 'Authorization': `Bearer ${secret}` } : {}),
        },
        body: JSON.stringify({
          lead_id: data,
          ...input,
          phone: phoneValue,
          timestamp: new Date().toISOString(),
        }),
      }).catch(() => {});
    }

    return json({ id: data }, 201);
  });
