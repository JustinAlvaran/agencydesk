import { cookies } from 'next/headers';
import { z } from 'zod';
import { apiSession, endpoint, json, readJson, sameOrigin, databaseError, HttpError } from '@/lib/http';
import { leadView } from '@/lib/crm-data';
import { isDemo } from '@/lib/env';
import { initialLeads } from '@/lib/mock-crm-data';
import { recommendNextAction, type StagePatchResponse } from '@/lib/automation-playbooks';

const stageBodySchema = z
  .object({
    stage: z.enum(['new', 'contacted', 'qualified', 'proposal_sent', 'lost']),
    row_version: z.number().int().positive().optional(),
  })
  .strict();

const stageProbability: Record<'new' | 'contacted' | 'qualified' | 'proposal_sent' | 'lost', number> = {
  new: 20,
  contacted: 40,
  qualified: 60,
  proposal_sent: 80,
  lost: 0,
};

async function hasDemoSessionCookie(): Promise<boolean> {
  try {
    const store = await cookies();
    return Boolean(store.get('agencydesk_staff_session')?.value);
  } catch {
    return false;
  }
}

function fireStageWebhook(
  lead: ReturnType<typeof leadView>,
  nextAction: ReturnType<typeof recommendNextAction>
) {
  if (isDemo()) return;
  const webhookUrl = process.env.N8N_LIFECYCLE_WEBHOOK_URL || process.env.N8N_LEAD_WEBHOOK_URL;
  if (!webhookUrl) return;
  try {
    new URL(webhookUrl);
    const secret = process.env.AUTOMATION_SECRET;
    void fetch(webhookUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...(secret ? { 'X-AgencyDesk-Signature': secret, Authorization: `Bearer ${secret}` } : {}),
      },
      body: JSON.stringify({
        event: 'lead_stage_changed',
        lead_id: lead.id,
        stage: lead.status,
        row_version: lead.row_version,
        contact_name: lead.contact_name,
        email: lead.email,
        phone: lead.phone ?? null,
        company: lead.company,
        service: lead.service,
        next_action: {
          template_key: nextAction.template_key,
          label: nextAction.label,
          channel: nextAction.channel,
          priority: nextAction.priority,
        },
        timestamp: new Date().toISOString(),
      }),
      signal: AbortSignal.timeout(5000),
    }).catch(() => {});
  } catch {
    // Best-effort notification: never fail the stage transition
  }
}

export const PATCH = (request: Request, { params }: { params: Promise<{ id: string }> }) =>
  endpoint(async () => {
    sameOrigin(request);
    const rawId = (await params).id;

    if (isDemo() && (await hasDemoSessionCookie())) {
      const input = stageBodySchema.parse(await readJson(request));
      const base = initialLeads.find((l) => l.id === rawId);
      if (!base) throw new HttpError(404, 'Lead not found.');
      const updated = {
        ...base,
        status: input.stage,
        probability: stageProbability[input.stage],
        row_version: (input.row_version ?? base.row_version ?? 1) + 1,
        last_activity: new Date().toISOString(),
      };
      const nextAction = recommendNextAction(updated);
      return json({
        success: true,
        mode: 'demo',
        lead: updated,
        next_action: nextAction,
      } satisfies StagePatchResponse);
    }

    const { supabase } = await apiSession();
    const id = z.uuid().parse(rawId);
    const input = z
      .object({
        stage: z.enum(['new', 'contacted', 'qualified', 'proposal_sent', 'lost']),
        row_version: z.number().int().positive(),
      })
      .strict()
      .parse(await readJson(request));

    const { data, error } = await supabase.rpc('update_lead_stage', {
      p_id: id,
      p_version: input.row_version,
      p_stage: input.stage,
    });
    databaseError(error);

    const lead = leadView(data!);
    const nextAction = recommendNextAction(lead);
    fireStageWebhook(lead, nextAction);

    return json({
      success: true,
      mode: 'live',
      lead,
      next_action: nextAction,
    } satisfies StagePatchResponse);
  });
