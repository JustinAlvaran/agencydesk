import { cookies } from 'next/headers';
import { z } from 'zod';
import { apiSession, databaseError, endpoint, HttpError, json, readJson, sameOrigin } from '@/lib/http';
import { isDemo } from '@/lib/env';
import { serviceClient } from '@/lib/supabase/admin';
import { initialLeads } from '@/lib/mock-crm-data';
import { activitySummary } from '@/lib/leads/workflow';
import {
  buildMailtoUrl,
  buildPlaybookDraft,
  buildWhatsAppUrl,
  getPlaybookDefinition,
  normalizeWhatsAppDigits,
  type AutomationChannel,
  type AutomationProvider,
  type OutboxEventView,
  type OutboxGetResponse,
  type OutboxJobStatus,
  type OutboxJobView,
  type OutboxPostResponse,
  type PlaybookTemplateKey,
} from '@/lib/automation-playbooks';

const postSchema = z
  .object({
    job_id: z.string().trim().min(1).max(100),
    action: z.enum(['approve', 'cancel', 'mark_sent_manual']),
    note: z.string().trim().max(1000).optional(),
  })
  .strict();

async function hasDemoSessionCookie(): Promise<boolean> {
  try {
    const store = await cookies();
    return Boolean(store.get('agencydesk_staff_session')?.value);
  } catch {
    return false;
  }
}

function summarizeJobs(jobs: OutboxJobView[]) {
  return {
    pending_approval: jobs.filter((j) => j.status === 'pending_approval').length,
    queued: jobs.filter((j) => j.status === 'queued' || j.status === 'processing').length,
    delivered: jobs.filter((j) => ['delivered', 'read', 'accepted', 'simulated'].includes(j.status)).length,
    failed: jobs.filter((j) => j.status === 'failed' || j.status === 'uncertain').length,
    skipped: jobs.filter((j) => j.status === 'skipped').length,
    cancelled: jobs.filter((j) => j.status === 'cancelled').length,
    total: jobs.length,
  };
}

function demoOutboxData(): OutboxGetResponse {
  const now = new Date();
  const isoAgo = (minutes: number) => new Date(now.getTime() - minutes * 60000).toISOString();

  const specs: Array<{
    id: string;
    leadIndex: number;
    templateKey: PlaybookTemplateKey;
    status: OutboxJobStatus;
    channel: AutomationChannel;
    minutesAgo: number;
  }> = [
    {
      id: 'demo-job-1',
      leadIndex: 0,
      templateKey: 'inquiry_acknowledgment',
      status: 'pending_approval',
      channel: 'whatsapp',
      minutesAgo: 12,
    },
    {
      id: 'demo-job-2',
      leadIndex: 1,
      templateKey: 'discovery_followup',
      status: 'pending_approval',
      channel: 'email',
      minutesAgo: 45,
    },
    {
      id: 'demo-job-3',
      leadIndex: 3,
      templateKey: 'proposal_follow_up',
      status: 'queued',
      channel: 'email',
      minutesAgo: 180,
    },
    {
      id: 'demo-job-4',
      leadIndex: 4,
      templateKey: 'proposal_accepted',
      status: 'delivered',
      channel: 'email',
      minutesAgo: 1440,
    },
  ];

  const jobs: OutboxJobView[] = specs.map((spec) => {
    const lead = initialLeads[spec.leadIndex] ?? initialLeads[0];
    const def = getPlaybookDefinition(spec.templateKey);
    const draft = buildPlaybookDraft(lead, spec.templateKey, spec.channel);
    const ts = isoAgo(spec.minutesAgo);
    return {
      id: spec.id,
      rule_id: `demo-rule-${def.template_key}`,
      template_key: def.template_key,
      rule_name: def.name,
      lead_id: lead.id,
      lead_name: lead.contact_name,
      lead_company: lead.company,
      lead_email: lead.email,
      lead_phone: lead.whatsapp || lead.phone || null,
      lead_status: lead.status,
      channel: draft.channel,
      provider: def.default_provider,
      recipient: draft.recipient,
      subject: draft.subject,
      body: draft.body,
      portal_path: null,
      status: spec.status,
      due_at: ts,
      attempts: spec.status === 'delivered' ? 1 : 0,
      last_error: null,
      approved_by: spec.status === 'queued' || spec.status === 'delivered' ? 'staff-admin-id' : null,
      approved_at: spec.status === 'queued' || spec.status === 'delivered' ? ts : null,
      created_at: ts,
      updated_at: ts,
      consent_ok: spec.channel === 'whatsapp' ? Boolean(lead.whatsapp_opt_in) : true,
      wa_me_url: draft.wa_me_url,
      mailto_url: draft.mailto_url,
      source: 'demo',
    };
  });

  const events: OutboxEventView[] = [
    {
      id: 'demo-evt-1',
      event_type: 'inquiry_received',
      state: 'completed',
      lead_id: initialLeads[0].id,
      lead_name: initialLeads[0].contact_name,
      summary: 'Synced Black Mesa AI inquiry to Google Sheets & queued welcome draft',
      created_at: isoAgo(12),
      completed_at: isoAgo(11),
    },
    {
      id: 'demo-evt-2',
      event_type: 'lead_stage_changed',
      state: 'completed',
      lead_id: initialLeads[1].id,
      lead_name: initialLeads[1].contact_name,
      summary: 'new → contacted · 24h discovery follow-up queued',
      created_at: isoAgo(45),
      completed_at: isoAgo(44),
    },
    {
      id: 'demo-evt-3',
      event_type: 'proposal_accepted',
      state: 'completed',
      lead_id: initialLeads[4].id,
      lead_name: initialLeads[4].contact_name,
      summary: 'Proposal accepted · Kickoff welcome delivered',
      created_at: isoAgo(1440),
      completed_at: isoAgo(1439),
    },
  ];

  return {
    mode: 'demo',
    jobs,
    events,
    summary: summarizeJobs(jobs),
  };
}

const draftActionLocks = new Map<string, Promise<unknown>>();

async function withDraftLock<T>(key: string, fn: () => Promise<T>): Promise<T> {
  const prev = draftActionLocks.get(key) ?? Promise.resolve();
  let release!: () => void;
  const gate = new Promise<void>((resolve) => {
    release = resolve;
  });
  const chained = prev.then(() => gate);
  draftActionLocks.set(key, chained);
  await prev;
  try {
    return await fn();
  } finally {
    release();
    if (draftActionLocks.get(key) === chained) {
      draftActionLocks.delete(key);
    }
  }
}

async function dispatchN8nLifecycleWebhook(payload: Record<string, unknown>): Promise<boolean> {
  if (isDemo()) return false;
  const webhookUrl = process.env.N8N_LIFECYCLE_WEBHOOK_URL;
  if (!webhookUrl) return false;
  try {
    new URL(webhookUrl);
    const secret = process.env.AUTOMATION_SECRET;
    const response = await fetch(webhookUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...(secret ? { 'X-AgencyDesk-Signature': secret, Authorization: `Bearer ${secret}` } : {}),
      },
      body: JSON.stringify(payload),
      signal: AbortSignal.timeout(5000),
    });
    await response.body?.cancel();
    return response.ok;
  } catch {
    return false;
  }
}

interface EventsOutboxRow {
  id: string;
  agency_id: string;
  event_type: string;
  state: string;
  created_at: string;
  completed_at: string | null;
}

export const GET = () =>
  endpoint(async () => {
    if (isDemo() && (await hasDemoSessionCookie())) {
      return json(demoOutboxData());
    }

    const { supabase } = await apiSession();
    if (isDemo()) {
      return json(demoOutboxData());
    }

    const outboxClient = supabase as unknown as {
      from: (table: 'events_outbox') => {
        select: (cols: string) => {
          order: (col: string, opts: { ascending: boolean }) => {
            limit: (n: number) => Promise<{
              data: EventsOutboxRow[] | null;
              error: { code?: string } | null;
            }>;
          };
        };
      };
    };

    const [jobsRes, rulesRes, leadsRes, companiesRes, outboxRes, draftEventsRes, recentActivityRes] =
      await Promise.all([
        supabase.from('message_jobs').select('*').order('created_at', { ascending: false }).limit(100),
        supabase.from('automation_rules').select('id,template_key,name'),
        supabase
          .from('leads')
          .select('id,contact_name,email,phone,company_name,company_id,status,email_opt_in,whatsapp_opt_in')
          .limit(500),
        supabase.from('companies').select('id,name').limit(500),
        outboxClient.from('events_outbox').select('*').order('created_at', { ascending: false }).limit(50),
        supabase
          .from('activity_events')
          .select('*')
          .in('event_type', [
            'playbook_draft_queued',
            'playbook_draft_approved',
            'playbook_draft_cancelled',
            'manual_message_sent',
          ])
          .order('created_at', { ascending: false })
          .limit(200),
        supabase.from('activity_events').select('*').order('created_at', { ascending: false }).limit(60),
      ]);

    databaseError(jobsRes.error);
    databaseError(rulesRes.error);
    databaseError(leadsRes.error);
    databaseError(companiesRes.error);
    databaseError(outboxRes.error);
    databaseError(draftEventsRes.error);
    databaseError(recentActivityRes.error);

    const ruleMap = new Map((rulesRes.data ?? []).map((r) => [r.id, r]));
    const companyMap = new Map((companiesRes.data ?? []).map((c) => [c.id, c.name]));
    const leadMap = new Map((leadsRes.data ?? []).map((l) => [l.id, l]));
    const draftActivities = draftEventsRes.data ?? [];
    const activities = recentActivityRes.data ?? [];

    // Build manual-sent / draft-action overrides from filtered draft activity_events
    const manualSentByJobId = new Map<string, { sent_at: string; actor_id: string | null }>();
    const draftEventsChronological = [...draftActivities].reverse();
    const activityDrafts = new Map<string, OutboxJobView>();

    for (const ev of draftEventsChronological) {
      const detail = ev.detail && typeof ev.detail === 'object' ? (ev.detail as Record<string, unknown>) : {};
      const targetJobId = typeof detail.job_id === 'string' ? detail.job_id : null;

      if (ev.event_type === 'manual_message_sent' && targetJobId) {
        manualSentByJobId.set(targetJobId, {
          sent_at: typeof detail.sent_at === 'string' ? detail.sent_at : ev.created_at,
          actor_id: ev.actor_id,
        });
      }

      if (ev.event_type === 'playbook_draft_queued' && ev.lead_id) {
        const lead = leadMap.get(ev.lead_id);
        const templateKey = (
          typeof detail.template_key === 'string' ? detail.template_key : 'inquiry_acknowledgment'
        ) as PlaybookTemplateKey;
        const def = getPlaybookDefinition(templateKey);
        const channel = (detail.channel === 'whatsapp' ? 'whatsapp' : 'email') as AutomationChannel;
        const body = typeof detail.body === 'string' ? detail.body : '';
        const subject = typeof detail.subject === 'string' ? detail.subject : def.name;
        const leadCompany =
          lead?.company_name || (lead?.company_id ? companyMap.get(lead.company_id) ?? '' : '') || 'Unassigned company';
        const leadEmail = lead?.email ?? (channel === 'email' && typeof detail.recipient === 'string' ? detail.recipient : '');
        const leadPhone = lead?.phone ?? null;
        const hasPhone = Boolean(normalizeWhatsAppDigits(leadPhone));
        const consentOk =
          typeof detail.consent_ok === 'boolean'
            ? detail.consent_ok
            : channel === 'whatsapp'
            ? Boolean(lead?.whatsapp_opt_in && hasPhone)
            : Boolean(lead?.email_opt_in);

        activityDrafts.set(ev.id, {
          id: ev.id,
          rule_id: typeof detail.rule_id === 'string' ? detail.rule_id : null,
          template_key: templateKey,
          rule_name: def.name,
          lead_id: ev.lead_id,
          lead_name: lead?.contact_name ?? 'Workspace Lead',
          lead_company: leadCompany,
          lead_email: leadEmail,
          lead_phone: leadPhone,
          lead_status: lead?.status ?? 'new',
          channel,
          provider: def.default_provider,
          recipient: typeof detail.recipient === 'string' ? detail.recipient : leadEmail,
          subject,
          body,
          portal_path: null,
          status: 'pending_approval',
          due_at: typeof detail.due_at === 'string' ? detail.due_at : ev.created_at,
          attempts: 0,
          last_error: typeof detail.consent_warning === 'string' ? 'consent_review_required' : null,
          approved_by: null,
          approved_at: null,
          created_at: ev.created_at,
          updated_at: ev.created_at,
          consent_ok: consentOk,
          wa_me_url: buildWhatsAppUrl(leadPhone, body),
          mailto_url: buildMailtoUrl(leadEmail, subject, body),
          source: 'activity_events',
        });
      } else if (ev.event_type === 'playbook_draft_approved' && targetJobId) {
        const draft = activityDrafts.get(targetJobId);
        if (draft) {
          draft.status = 'queued';
          draft.approved_by = ev.actor_id;
          draft.approved_at = ev.created_at;
          draft.updated_at = ev.created_at;
        }
      } else if (ev.event_type === 'playbook_draft_cancelled' && targetJobId) {
        const draft = activityDrafts.get(targetJobId);
        if (draft) {
          draft.status = 'cancelled';
          draft.last_error = 'staff_cancelled';
          draft.updated_at = ev.created_at;
        }
      } else if (ev.event_type === 'manual_message_sent' && targetJobId) {
        const draft = activityDrafts.get(targetJobId);
        if (draft) {
          draft.status = 'delivered';
          draft.provider = 'manual';
          draft.approved_by = ev.actor_id;
          draft.approved_at = ev.created_at;
          draft.updated_at = ev.created_at;
          draft.last_error = null;
        }
      }
    }

    const dbEventIdsInJobs = new Set((jobsRes.data ?? []).map((j) => j.event_id));
    const dbJobs: OutboxJobView[] = (jobsRes.data ?? []).map((job) => {
      const rule = ruleMap.get(job.rule_id);
      const lead = leadMap.get(job.lead_id);
      const leadCompany =
        lead?.company_name || (lead?.company_id ? companyMap.get(lead.company_id) ?? '' : '') || 'Unassigned company';
      const manual = manualSentByJobId.get(job.id);
      const effectiveStatus: OutboxJobStatus = manual ? 'delivered' : (job.status as OutboxJobStatus);
      const channel = job.channel as AutomationChannel;
      const hasPhone = Boolean(normalizeWhatsAppDigits(lead?.phone));
      const consentOk =
        channel === 'whatsapp'
          ? Boolean(lead?.whatsapp_opt_in && hasPhone)
          : Boolean(lead?.email_opt_in);

      return {
        id: job.id,
        rule_id: job.rule_id,
        template_key: rule?.template_key ?? 'inquiry_acknowledgment',
        rule_name: rule?.name ?? 'Lifecycle Rule',
        lead_id: job.lead_id,
        lead_name: lead?.contact_name ?? 'Workspace Lead',
        lead_company: leadCompany,
        lead_email: lead?.email ?? (channel === 'email' ? job.recipient : ''),
        lead_phone: lead?.phone ?? (channel === 'whatsapp' ? job.recipient : null),
        lead_status: lead?.status ?? 'new',
        channel,
        provider: manual ? 'manual' : (job.provider as AutomationProvider),
        recipient: job.recipient,
        subject: job.subject,
        body: job.body,
        portal_path: job.portal_path,
        status: effectiveStatus,
        due_at: job.due_at,
        attempts: job.attempts,
        last_error: manual ? null : job.last_error,
        approved_by: job.approved_by ?? manual?.actor_id ?? null,
        approved_at: job.approved_at ?? manual?.sent_at ?? null,
        created_at: job.created_at,
        updated_at: manual?.sent_at ?? job.updated_at,
        consent_ok: consentOk,
        wa_me_url: buildWhatsAppUrl(lead?.phone ?? (channel === 'whatsapp' ? job.recipient : null), job.body),
        mailto_url: buildMailtoUrl(lead?.email ?? (channel === 'email' ? job.recipient : null), job.subject, job.body),
        source: 'message_jobs',
      };
    });

    const extraActivityJobs = Array.from(activityDrafts.values()).filter((d) => !dbEventIdsInJobs.has(d.id));
    const allJobs = [...dbJobs, ...extraActivityJobs].sort(
      (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
    );

    const activityById = new Map([...draftActivities, ...activities].map((a) => [a.id, a]));
    const events: OutboxEventView[] = (outboxRes.data ?? []).map((ev) => {
      const act = activityById.get(ev.id);
      const lead = act?.lead_id ? leadMap.get(act.lead_id) : undefined;
      const summary = act
        ? activitySummary({ event_type: act.event_type, detail: act.detail }) ||
          act.event_type.replaceAll('_', ' ')
        : ev.event_type.replaceAll('_', ' ');

      return {
        id: ev.id,
        event_type: ev.event_type,
        state: ev.state,
        lead_id: act?.lead_id ?? null,
        lead_name: lead?.contact_name ?? null,
        summary,
        created_at: ev.created_at,
        completed_at: ev.completed_at,
      };
    });

    const response: OutboxGetResponse = {
      mode: 'live',
      jobs: allJobs,
      events,
      summary: summarizeJobs(allJobs),
    };

    return json(response);
  });

export const POST = (request: Request) =>
  endpoint(async () => {
    sameOrigin(request);
    const input = postSchema.parse(await readJson(request));

    const handleDemoAction = async (): Promise<OutboxPostResponse> => {
      const demo = demoOutboxData();
      const target = demo.jobs.find((j) => j.id === input.job_id) ?? demo.jobs[0];
      const now = new Date().toISOString();

      let nextStatus: OutboxJobStatus = target.status;
      if (input.action === 'approve') {
        nextStatus = 'queued';
      } else if (input.action === 'cancel') {
        nextStatus = 'cancelled';
      } else {
        nextStatus = 'delivered';
      }

      return {
        success: true,
        mode: 'demo',
        action: input.action,
        status: nextStatus,
        dispatched_to_n8n: false,
        job: {
          ...target,
          status: nextStatus,
          approved_by: input.action === 'cancel' ? target.approved_by : 'staff-admin-id',
          approved_at: input.action === 'cancel' ? target.approved_at : now,
          updated_at: now,
        },
      };
    };

    if (isDemo() && (await hasDemoSessionCookie())) {
      return json(await handleDemoAction());
    }

    const { supabase, user, staff } = await apiSession();
    if (isDemo()) {
      return json(await handleDemoAction());
    }

    const jobId = z.uuid().parse(input.job_id);
    const now = new Date().toISOString();

    // 1. Check message_jobs first
    const jobRes = await supabase.from('message_jobs').select('*').eq('id', jobId).maybeSingle();
    databaseError(jobRes.error);

    if (jobRes.data) {
      const job = jobRes.data;

      if (input.action === 'approve') {
        const { data: approved, error: rpcErr } = await supabase.rpc('approve_message_job', {
          p_job_id: job.id,
        });
        databaseError(rpcErr);

        const refreshed = await supabase.from('message_jobs').select('*').eq('id', job.id).single();
        databaseError(refreshed.error);
        const updated = refreshed.data!;

        if (!approved) {
          if (updated.status === 'skipped') {
            return json(
              {
                success: false,
                mode: 'live',
                action: 'approve',
                status: 'skipped',
                dispatched_to_n8n: false,
                reason: updated.last_error ?? 'ineligible',
              } satisfies OutboxPostResponse,
              409
            );
          }
          throw new HttpError(409, 'Message job is no longer awaiting approval.');
        }

        const dispatched = await dispatchN8nLifecycleWebhook({
          event: 'message_job_approved',
          job_id: updated.id,
          lead_id: updated.lead_id,
          channel: updated.channel,
          recipient: updated.recipient,
          subject: updated.subject,
          body: updated.body,
          approved_by: user.id,
          approved_at: updated.approved_at ?? now,
          timestamp: now,
        });

        return json({
          success: true,
          mode: 'live',
          action: 'approve',
          status: updated.status as OutboxJobStatus,
          dispatched_to_n8n: dispatched,
        } satisfies OutboxPostResponse);
      }

      if (input.action === 'cancel') {
        const { data: cancelled, error: rpcErr } = await supabase.rpc('cancel_message_job', {
          p_job_id: job.id,
        });
        databaseError(rpcErr);
        if (!cancelled) {
          throw new HttpError(409, 'Only pending or queued jobs can be cancelled.');
        }
        return json({
          success: true,
          mode: 'live',
          action: 'cancel',
          status: 'cancelled',
          dispatched_to_n8n: false,
        } satisfies OutboxPostResponse);
      }

      // mark_sent_manual on message_jobs:
      if (!['pending_approval', 'queued', 'skipped', 'failed'].includes(job.status)) {
        throw new HttpError(409, `Cannot mark a ${job.status} job as manually sent.`);
      }

      // If queued or pending_approval, cancel from automated worker queue first so
      // an external worker cannot double-send a message staff sent manually.
      if (job.status === 'pending_approval' || job.status === 'queued') {
        const { error: cancelErr } = await supabase.rpc('cancel_message_job', { p_job_id: job.id });
        databaseError(cancelErr);
      }

      const adminDb = serviceClient();
      const eventInsert = await adminDb.from('activity_events').insert({
        agency_id: staff!.agency_id,
        actor_id: user.id,
        lead_id: job.lead_id,
        event_type: 'manual_message_sent',
        detail: {
          job_id: job.id,
          channel: job.channel,
          recipient: job.recipient,
          subject: job.subject,
          note: input.note ?? '',
          sent_at: now,
        },
      });
      if (eventInsert.error) {
        throw new HttpError(503, 'Could not record manual delivery confirmation.');
      }

      return json({
        success: true,
        mode: 'live',
        action: 'mark_sent_manual',
        status: 'delivered',
        dispatched_to_n8n: false,
      } satisfies OutboxPostResponse);
    }

    // 2. Fall back to activity_events-backed draft (playbook_draft_queued)
    return withDraftLock(jobId, async () => {
      const draftEventRes = await supabase
        .from('activity_events')
        .select('*')
        .eq('id', jobId)
        .eq('event_type', 'playbook_draft_queued')
        .maybeSingle();
      databaseError(draftEventRes.error);
      const draftEv = draftEventRes.data;
      const draftLeadId = draftEv?.lead_id;
      if (!draftEv || !draftLeadId) {
        throw new HttpError(404, 'Outbox job not found.');
      }
      const detail =
        draftEv.detail && typeof draftEv.detail === 'object'
          ? (draftEv.detail as Record<string, unknown>)
          : {};
      const detailTemplateKey = typeof detail.template_key === 'string' ? detail.template_key : null;
      const detailChannel = detail.channel === 'whatsapp' ? 'whatsapp' : 'email';
      const detailRecipient = typeof detail.recipient === 'string' ? detail.recipient : '';
      const detailSubject = typeof detail.subject === 'string' ? detail.subject : '';
      const detailBody = typeof detail.body === 'string' ? detail.body : '';

      // Check current resolved state of this activity draft
      const historyRes = await supabase
        .from('activity_events')
        .select('id,event_type,detail,created_at')
        .eq('lead_id', draftLeadId)
        .in('event_type', ['playbook_draft_approved', 'playbook_draft_cancelled', 'manual_message_sent'])
        .order('created_at', { ascending: true })
        .order('id', { ascending: true });
      databaseError(historyRes.error);

      const priorEvents = (historyRes.data ?? []).filter((h) => {
        const d = h.detail && typeof h.detail === 'object' ? (h.detail as Record<string, unknown>) : {};
        return d.job_id === jobId;
      });

      const isAlreadyFinal = priorEvents.some((p) =>
        ['playbook_draft_cancelled', 'manual_message_sent'].includes(p.event_type)
      );
      if (isAlreadyFinal) {
        throw new HttpError(409, 'This draft has already been completed or cancelled.');
      }

      const adminDb = serviceClient();

      if (input.action === 'approve') {
        if (priorEvents.some((p) => p.event_type === 'playbook_draft_approved')) {
          throw new HttpError(409, 'This draft is already approved and queued.');
        }

        const [leadRes, suppressionRes] = await Promise.all([
          supabase
            .from('leads')
            .select('email_opt_in,whatsapp_opt_in,phone,status,archived_at')
            .eq('id', draftLeadId)
            .maybeSingle(),
          supabase.rpc('lead_message_suppression', { p_lead_id: draftLeadId }),
        ]);
        databaseError(leadRes.error);
        databaseError(suppressionRes.error);

        const lead = leadRes.data;
        if (!lead || lead.archived_at) {
          throw new HttpError(409, 'Lead is archived or unavailable.');
        }
        if (lead.status === 'lost') {
          return json(
            {
              success: false,
              mode: 'live',
              action: 'approve',
              status: 'skipped',
              dispatched_to_n8n: false,
              reason: 'lead_closed',
            } satisfies OutboxPostResponse,
            409
          );
        }

        const isSuppressed = (suppressionRes.data ?? []).some(
          (s) => s.channel === detailChannel && s.suppressed
        );
        if (isSuppressed) {
          return json(
            {
              success: false,
              mode: 'live',
              action: 'approve',
              status: 'skipped',
              dispatched_to_n8n: false,
              reason: 'recipient_suppressed',
            } satisfies OutboxPostResponse,
            409
          );
        }

        if (detailChannel === 'whatsapp' && (!lead.whatsapp_opt_in || !lead.phone)) {
          return json(
            {
              success: false,
              mode: 'live',
              action: 'approve',
              status: 'pending_approval',
              dispatched_to_n8n: false,
              reason: !lead.phone ? 'phone_missing' : 'whatsapp_consent_missing',
            } satisfies OutboxPostResponse,
            409
          );
        }
        if (detailChannel === 'email' && !lead.email_opt_in) {
          return json(
            {
              success: false,
              mode: 'live',
              action: 'approve',
              status: 'pending_approval',
              dispatched_to_n8n: false,
              reason: 'email_consent_missing',
            } satisfies OutboxPostResponse,
            409
          );
        }

        const approveInsert = await adminDb
          .from('activity_events')
          .insert({
            agency_id: staff!.agency_id,
            actor_id: user.id,
            lead_id: draftLeadId,
            event_type: 'playbook_draft_approved',
            detail: {
              job_id: jobId,
              template_key: detailTemplateKey,
              channel: detailChannel,
              approved_at: now,
            },
          })
          .select('id')
          .single();
        if (approveInsert.error || !approveInsert.data) {
          throw new HttpError(503, 'Could not approve draft.');
        }

        // Cross-instance race check: only the earliest approved event may dispatch to n8n
        const verifyApprovals = await supabase
          .from('activity_events')
          .select('id,detail,created_at')
          .eq('lead_id', draftLeadId)
          .eq('event_type', 'playbook_draft_approved')
          .order('created_at', { ascending: true })
          .order('id', { ascending: true });
        databaseError(verifyApprovals.error);
        const matchingApprovals = (verifyApprovals.data ?? []).filter((ev) => {
          const d = ev.detail && typeof ev.detail === 'object' ? (ev.detail as Record<string, unknown>) : {};
          return d.job_id === jobId;
        });
        if (matchingApprovals.length > 0 && matchingApprovals[0].id !== approveInsert.data.id) {
          throw new HttpError(409, 'This draft is already approved and queued.');
        }

        const dispatched = await dispatchN8nLifecycleWebhook({
          event: 'message_job_approved',
          job_id: jobId,
          lead_id: draftLeadId,
          channel: detailChannel,
          recipient: detailRecipient,
          subject: detailSubject,
          body: detailBody,
          approved_by: user.id,
          approved_at: now,
          timestamp: now,
        });

        return json({
          success: true,
          mode: 'live',
          action: 'approve',
          status: 'queued',
          dispatched_to_n8n: dispatched,
        } satisfies OutboxPostResponse);
      }

      if (input.action === 'cancel') {
        const cancelInsert = await adminDb.from('activity_events').insert({
          agency_id: staff!.agency_id,
          actor_id: user.id,
          lead_id: draftLeadId,
          event_type: 'playbook_draft_cancelled',
          detail: {
            job_id: jobId,
            cancelled_at: now,
          },
        });
        if (cancelInsert.error) {
          throw new HttpError(503, 'Could not cancel draft.');
        }

        return json({
          success: true,
          mode: 'live',
          action: 'cancel',
          status: 'cancelled',
          dispatched_to_n8n: false,
        } satisfies OutboxPostResponse);
      }

      // mark_sent_manual for activity_events draft
      const sentInsert = await adminDb.from('activity_events').insert({
        agency_id: staff!.agency_id,
        actor_id: user.id,
        lead_id: draftLeadId,
        event_type: 'manual_message_sent',
        detail: {
          job_id: jobId,
          channel: detailChannel,
          recipient: detailRecipient,
          subject: detailSubject,
          note: input.note ?? '',
          sent_at: now,
        },
      });
      if (sentInsert.error) {
        throw new HttpError(503, 'Could not record manual send.');
      }

      return json({
        success: true,
        mode: 'live',
        action: 'mark_sent_manual',
        status: 'delivered',
        dispatched_to_n8n: false,
      } satisfies OutboxPostResponse);
    });
  });
