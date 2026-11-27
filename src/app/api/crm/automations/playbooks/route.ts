import { cookies } from 'next/headers';
import { z } from 'zod';
import { apiSession, databaseError, endpoint, HttpError, json, readJson, sameOrigin } from '@/lib/http';
import { isDemo } from '@/lib/env';
import { serviceClient } from '@/lib/supabase/admin';
import { initialLeads } from '@/lib/mock-crm-data';
import {
  buildPlaybookDraft,
  defaultProviderForChannel,
  getPlaybookDefinition,
  isValidChannelProviderPair,
  normalizeWhatsAppDigits,
  PLAYBOOK_DEFINITIONS,
  type AutomationChannel,
  type AutomationProvider,
  type OutboxJobView,
  type PlaybookRuleView,
  type PlaybooksGetResponse,
  type PlaybooksPatchResponse,
  type PlaybooksPostResponse,
  type PlaybookTemplateKey,
} from '@/lib/automation-playbooks';
import type { Lead } from '@/types/crm';

const templateKeySchema = z.enum([
  'inquiry_acknowledgment',
  'discovery_followup',
  'proposal_notice',
  'proposal_follow_up',
  'proposal_accepted',
]);

const channelSchema = z.enum(['email', 'whatsapp']);
const providerSchema = z.enum(['resend', 'gmail', 'whatsapp', 'waha', 'zoko']);

const patchSchema = z
  .object({
    rule_id: z.string().min(1).max(100).optional(),
    template_key: templateKeySchema.optional(),
    enabled: z.boolean().optional(),
    approval_required: z.boolean().optional(),
    delay_minutes: z.number().int().min(0).max(43200).optional(),
    channel: channelSchema.optional(),
    provider: providerSchema.optional(),
  })
  .strict()
  .refine((v) => Boolean(v.rule_id || v.template_key), {
    message: 'Specify rule_id or template_key.',
  });

const postSchema = z
  .object({
    lead_id: z.string().trim().min(1).max(100),
    template_key: templateKeySchema,
    channel: channelSchema.optional(),
    subject: z.string().trim().min(1).max(200).optional(),
    body: z.string().trim().min(1).max(4000).optional(),
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

function demoPlaybooksResponse(overrides?: Partial<PlaybookRuleView>): PlaybooksGetResponse {
  const playbooks: PlaybookRuleView[] = PLAYBOOK_DEFINITIONS.map((def) => {
    const base: PlaybookRuleView = {
      id: `demo-rule-${def.template_key}`,
      template_key: def.template_key,
      order: def.order,
      name: def.name,
      short_label: def.short_label,
      stage_trigger: def.stage_trigger,
      event_type: def.event_type,
      description: def.description,
      channel: def.default_channel,
      provider: def.default_provider,
      delay_minutes: def.default_delay_minutes,
      approval_required: def.default_approval_required,
      enabled: def.template_key === 'inquiry_acknowledgment' || def.template_key === 'proposal_follow_up',
      db_backed: def.db_backed,
      free_stack_tools: def.free_stack_tools,
      stats: {
        pending_approval: def.template_key === 'inquiry_acknowledgment' || def.template_key === 'proposal_follow_up' ? 1 : 0,
        queued: def.template_key === 'proposal_notice' ? 1 : 0,
        delivered: def.template_key === 'proposal_accepted' ? 1 : 0,
        total: def.template_key === 'discovery_followup' ? 0 : 1,
      },
    };
    if (overrides && overrides.template_key === def.template_key) {
      return { ...base, ...overrides };
    }
    return base;
  });

  return {
    mode: 'demo',
    playbooks,
    stats: {
      total_rules: playbooks.length,
      enabled_rules: playbooks.filter((p) => p.enabled).length,
      pending_approval: 2,
      queued: 1,
      delivered: 1,
      skipped: 0,
      failed: 0,
    },
  };
}

export const GET = () =>
  endpoint(async () => {
    if (isDemo() && (await hasDemoSessionCookie())) {
      return json(demoPlaybooksResponse());
    }

    const { supabase } = await apiSession();
    if (isDemo()) {
      return json(demoPlaybooksResponse());
    }

    const [rulesResult, jobsResult, draftEventsResult] = await Promise.all([
      supabase.from('automation_rules').select('*').order('created_at'),
      supabase.from('message_jobs').select('id,rule_id,status'),
      supabase
        .from('activity_events')
        .select('id,event_type,detail')
        .in('event_type', ['playbook_draft_queued', 'playbook_draft_approved', 'playbook_draft_cancelled', 'manual_message_sent'])
        .order('created_at', { ascending: false })
        .limit(200),
    ]);

    databaseError(rulesResult.error);
    databaseError(jobsResult.error);
    databaseError(draftEventsResult.error);

    const dbRules = rulesResult.data ?? [];
    const jobs = jobsResult.data ?? [];

    // Reconcile draft activity events that weren't inserted into message_jobs
    const jobIds = new Set(jobs.map((j) => j.id));
    const draftStateById = new Map<string, { template_key: string; status: string }>();
    for (const ev of [...(draftEventsResult.data ?? [])].reverse()) {
      const detail = ev.detail && typeof ev.detail === 'object' ? (ev.detail as Record<string, unknown>) : {};
      if (ev.event_type === 'playbook_draft_queued' && !jobIds.has(ev.id)) {
        draftStateById.set(ev.id, {
          template_key: typeof detail.template_key === 'string' ? detail.template_key : 'inquiry_acknowledgment',
          status: typeof detail.status === 'string' ? detail.status : 'pending_approval',
        });
      } else if (ev.event_type === 'playbook_draft_approved' && typeof detail.job_id === 'string') {
        const existing = draftStateById.get(detail.job_id);
        if (existing) existing.status = 'queued';
      } else if (ev.event_type === 'playbook_draft_cancelled' && typeof detail.job_id === 'string') {
        const existing = draftStateById.get(detail.job_id);
        if (existing) existing.status = 'cancelled';
      } else if (ev.event_type === 'manual_message_sent' && typeof detail.job_id === 'string') {
        const existing = draftStateById.get(detail.job_id);
        if (existing) existing.status = 'delivered';
      }
    }

    const playbooks: PlaybookRuleView[] = PLAYBOOK_DEFINITIONS.map((def) => {
      const row = dbRules.find((r) => r.template_key === def.template_key);
      const ruleJobs = row ? jobs.filter((j) => j.rule_id === row.id) : [];
      const extraDrafts = Array.from(draftStateById.values()).filter((d) => d.template_key === def.template_key);

      const pendingApproval =
        ruleJobs.filter((j) => j.status === 'pending_approval').length +
        extraDrafts.filter((d) => d.status === 'pending_approval').length;
      const queued =
        ruleJobs.filter((j) => j.status === 'queued' || j.status === 'processing').length +
        extraDrafts.filter((d) => d.status === 'queued').length;
      const delivered =
        ruleJobs.filter((j) => ['delivered', 'read', 'accepted', 'simulated'].includes(j.status)).length +
        extraDrafts.filter((d) => d.status === 'delivered').length;

      return {
        id: row?.id ?? `playbook:${def.template_key}`,
        template_key: def.template_key,
        order: def.order,
        name: row?.name || def.name,
        short_label: def.short_label,
        stage_trigger: def.stage_trigger,
        event_type: def.event_type,
        description: def.description,
        channel: (row?.channel as AutomationChannel) ?? def.default_channel,
        provider: (row?.provider as AutomationProvider) ?? def.default_provider,
        delay_minutes: row?.delay_minutes ?? def.default_delay_minutes,
        approval_required: row?.approval_required ?? def.default_approval_required,
        enabled: row?.enabled ?? false,
        db_backed: Boolean(row),
        free_stack_tools: def.free_stack_tools,
        stats: {
          pending_approval: pendingApproval,
          queued,
          delivered,
          total: ruleJobs.length + extraDrafts.length,
        },
      };
    });

    const response: PlaybooksGetResponse = {
      mode: 'live',
      playbooks,
      stats: {
        total_rules: playbooks.length,
        enabled_rules: playbooks.filter((p) => p.enabled).length,
        pending_approval:
          jobs.filter((j) => j.status === 'pending_approval').length +
          Array.from(draftStateById.values()).filter((d) => d.status === 'pending_approval').length,
        queued:
          jobs.filter((j) => j.status === 'queued' || j.status === 'processing').length +
          Array.from(draftStateById.values()).filter((d) => d.status === 'queued').length,
        delivered:
          jobs.filter((j) => ['delivered', 'read', 'accepted', 'simulated'].includes(j.status)).length +
          Array.from(draftStateById.values()).filter((d) => d.status === 'delivered').length,
        skipped: jobs.filter((j) => j.status === 'skipped').length,
        failed: jobs.filter((j) => j.status === 'failed' || j.status === 'uncertain').length,
      },
    };

    return json(response);
  });

export const PATCH = (request: Request) =>
  endpoint(async () => {
    sameOrigin(request);
    const input = patchSchema.parse(await readJson(request));

    if (isDemo() && (await hasDemoSessionCookie())) {
      const key: PlaybookTemplateKey =
        input.template_key ??
        ((PLAYBOOK_DEFINITIONS.find((d) => `demo-rule-${d.template_key}` === input.rule_id)?.template_key ??
          'inquiry_acknowledgment') as PlaybookTemplateKey);
      const demo = demoPlaybooksResponse();
      const current = demo.playbooks.find((p) => p.template_key === key) ?? demo.playbooks[0];
      const nextChannel = input.channel ?? current.channel;
      const nextProvider =
        input.provider ??
        (nextChannel === current.channel ? current.provider : defaultProviderForChannel(nextChannel));
      if (!isValidChannelProviderPair(nextChannel, nextProvider)) {
        throw new HttpError(400, 'Selected provider does not match the messaging channel.');
      }
      const updated: PlaybookRuleView = {
        ...current,
        enabled: input.enabled ?? current.enabled,
        approval_required: input.approval_required ?? current.approval_required,
        delay_minutes: input.delay_minutes ?? current.delay_minutes,
        channel: nextChannel,
        provider: nextProvider,
      };
      const payload: PlaybooksPatchResponse = { success: true, mode: 'demo', rule: updated };
      return json(payload);
    }

    const { supabase } = await apiSession('admin');
    if (isDemo()) {
      const key = input.template_key ?? 'inquiry_acknowledgment';
      const current = demoPlaybooksResponse().playbooks.find((p) => p.template_key === key)!;
      const nextChannel = input.channel ?? current.channel;
      const nextProvider =
        input.provider ??
        (nextChannel === current.channel ? current.provider : defaultProviderForChannel(nextChannel));
      if (!isValidChannelProviderPair(nextChannel, nextProvider)) {
        throw new HttpError(400, 'Selected provider does not match the messaging channel.');
      }
      return json({
        success: true,
        mode: 'demo',
        rule: {
          ...current,
          enabled: input.enabled ?? current.enabled,
          approval_required: input.approval_required ?? current.approval_required,
          delay_minutes: input.delay_minutes ?? current.delay_minutes,
          channel: nextChannel,
          provider: nextProvider,
        },
      } satisfies PlaybooksPatchResponse);
    }

    const isUuid = input.rule_id ? z.uuid().safeParse(input.rule_id).success : false;
    let query = supabase.from('automation_rules').select('*');
    if (isUuid && input.rule_id) {
      query = query.eq('id', input.rule_id);
    } else if (input.template_key) {
      query = query.eq('template_key', input.template_key);
    } else {
      throw new HttpError(409, 'This stage playbook runs on-demand and has no toggleable database rule yet.');
    }

    const existing = await query.maybeSingle();
    databaseError(existing.error);
    if (!existing.data) {
      throw new HttpError(
        409,
        'This playbook is not backed by a persisted automation rule in the database.'
      );
    }

    const nextChannel = (input.channel ?? existing.data.channel) as AutomationChannel;
    const nextProvider = (input.provider ??
      (nextChannel === existing.data.channel
        ? existing.data.provider
        : defaultProviderForChannel(nextChannel))) as AutomationProvider;

    if (!isValidChannelProviderPair(nextChannel, nextProvider)) {
      throw new HttpError(400, 'Selected provider does not match the messaging channel.');
    }

    const { error: rpcError } = await supabase.rpc('configure_automation_rule', {
      p_rule_id: existing.data.id,
      p_enabled: input.enabled ?? existing.data.enabled,
      p_delay_minutes: input.delay_minutes ?? existing.data.delay_minutes,
      p_approval_required: input.approval_required ?? existing.data.approval_required,
      p_channel: nextChannel,
      p_provider: nextProvider,
    });
    databaseError(rpcError);

    const refreshed = await supabase
      .from('automation_rules')
      .select('*')
      .eq('id', existing.data.id)
      .single();
    databaseError(refreshed.error);

    const def = getPlaybookDefinition(refreshed.data!.template_key as PlaybookTemplateKey);
    const ruleView: PlaybookRuleView = {
      id: refreshed.data!.id,
      template_key: def.template_key,
      order: def.order,
      name: refreshed.data!.name || def.name,
      short_label: def.short_label,
      stage_trigger: def.stage_trigger,
      event_type: def.event_type,
      description: def.description,
      channel: refreshed.data!.channel as AutomationChannel,
      provider: refreshed.data!.provider as AutomationProvider,
      delay_minutes: refreshed.data!.delay_minutes,
      approval_required: refreshed.data!.approval_required,
      enabled: refreshed.data!.enabled,
      db_backed: true,
      free_stack_tools: def.free_stack_tools,
      stats: { pending_approval: 0, queued: 0, delivered: 0, total: 0 },
    };

    const payload: PlaybooksPatchResponse = { success: true, mode: 'live', rule: ruleView };
    return json(payload);
  });

export const POST = (request: Request) =>
  endpoint(async () => {
    sameOrigin(request);
    const input = postSchema.parse(await readJson(request));

    const buildDemoDraftResponse = (): PlaybooksPostResponse => {
      const lead: Lead =
        initialLeads.find((l) => l.id === input.lead_id) ??
        ({
          id: input.lead_id,
          contact_name: 'Workspace Lead',
          email: 'client@example.com',
          company: 'Client Team',
          service: 'Web & Mobile Applications',
          brief: 'Project inquiry',
          budget: 0,
          status: 'new',
          probability: 20,
          owner: 'Justin Alvaran',
          created_at: new Date().toISOString(),
        } satisfies Lead);

      const def = getPlaybookDefinition(input.template_key);
      const draft = buildPlaybookDraft(lead, input.template_key, input.channel);
      const subject = input.subject ?? draft.subject;
      const body = input.body ?? draft.body;
      const now = new Date().toISOString();
      const hasPhone = Boolean(normalizeWhatsAppDigits(lead.whatsapp || lead.phone));
      const consentOk = draft.channel === 'whatsapp' ? Boolean(lead.whatsapp_opt_in && hasPhone) : true;
      const consentWarning =
        draft.channel === 'whatsapp' && !consentOk
          ? 'WhatsApp opt-in or valid phone number is not recorded. Recorded as staff review draft—use 1-to-1 wa.me chat manually.'
          : null;

      const job: OutboxJobView = {
        id: `demo-job-${Date.now()}`,
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
        subject,
        body,
        portal_path: null,
        status: 'pending_approval',
        due_at: now,
        attempts: 0,
        last_error: consentWarning ? 'consent_review_required' : null,
        approved_by: null,
        approved_at: null,
        created_at: now,
        updated_at: now,
        consent_ok: consentOk,
        wa_me_url: draft.wa_me_url,
        mailto_url: draft.mailto_url,
        source: 'demo',
      };

      return { success: true, mode: 'demo', job, consent_warning: consentWarning };
    };

    if (isDemo() && (await hasDemoSessionCookie())) {
      return json(buildDemoDraftResponse(), 201);
    }

    const { supabase, user, staff } = await apiSession();
    if (isDemo()) {
      return json(buildDemoDraftResponse(), 201);
    }

    const leadId = z.uuid().parse(input.lead_id);
    const leadRes = await supabase
      .from('leads')
      .select('*')
      .eq('id', leadId)
      .is('archived_at', null)
      .maybeSingle();
    databaseError(leadRes.error);
    if (!leadRes.data) {
      throw new HttpError(404, 'Lead not found in this workspace.');
    }

    const row = leadRes.data;
    let companyName = row.company_name || '';
    if (!companyName && row.company_id) {
      const companyRes = await supabase
        .from('companies')
        .select('name')
        .eq('id', row.company_id)
        .maybeSingle();
      companyName = companyRes.data?.name ?? '';
    }

    const def = getPlaybookDefinition(input.template_key);
    const ruleRes = await supabase
      .from('automation_rules')
      .select('*')
      .eq('template_key', input.template_key)
      .maybeSingle();
    databaseError(ruleRes.error);

    const chosenChannel =
      input.channel ?? ((ruleRes.data?.channel as AutomationChannel | undefined) ?? def.default_channel);
    const draft = buildPlaybookDraft(
      {
        id: row.id,
        contact_name: row.contact_name,
        email: row.email,
        phone: row.phone,
        whatsapp_opt_in: row.whatsapp_opt_in,
        email_opt_in: row.email_opt_in,
        company: companyName || 'Unassigned company',
        service: row.service,
        status: row.status as Lead['status'],
      },
      input.template_key,
      chosenChannel
    );

    const subject = input.subject ?? draft.subject;
    const body = input.body ?? draft.body;
    const hasPhone = Boolean(normalizeWhatsAppDigits(row.phone));

    const suppressionRes = await supabase.rpc('lead_message_suppression', { p_lead_id: row.id });
    const suppressed = (suppressionRes.data ?? []).some(
      (s) => s.channel === chosenChannel && s.suppressed
    );

    let consentWarning: string | null = null;
    if (suppressed) {
      consentWarning = `Recipient is suppressed for ${chosenChannel}. Draft saved for staff reference only.`;
    } else if (chosenChannel === 'whatsapp' && (!row.whatsapp_opt_in || !hasPhone)) {
      consentWarning = !hasPhone
        ? 'Lead has no valid phone/WhatsApp number. Update contact details or send via Email.'
        : 'WhatsApp opt-in is not recorded. Recorded as staff review draft—confirm consent or use 1-to-1 wa.me manually.';
    } else if (chosenChannel === 'email' && !row.email_opt_in) {
      consentWarning =
        'Email automation opt-in is not recorded. Recorded as staff review draft—send manually via Gmail or record permission first.';
    }

    const consentOk =
      !suppressed &&
      (chosenChannel === 'whatsapp' ? Boolean(row.whatsapp_opt_in && hasPhone) : Boolean(row.email_opt_in));

    const now = new Date().toISOString();
    const delayMins = ruleRes.data?.delay_minutes ?? def.default_delay_minutes;
    const dueAt = new Date(Date.now() + delayMins * 60000).toISOString();

    const adminDb = serviceClient();
    const eventInsert = await adminDb
      .from('activity_events')
      .insert({
        agency_id: staff!.agency_id,
        actor_id: user.id,
        lead_id: row.id,
        event_type: 'playbook_draft_queued',
        detail: {
          template_key: def.template_key,
          rule_id: ruleRes.data?.id ?? null,
          channel: chosenChannel,
          recipient: draft.recipient,
          subject,
          body,
          status: 'pending_approval',
          consent_ok: consentOk,
          consent_warning: consentWarning,
          due_at: dueAt,
        },
      })
      .select('id, created_at')
      .single();

    if (eventInsert.error || !eventInsert.data) {
      throw new HttpError(503, 'Could not record follow-up draft.');
    }

    // Best-effort insert into message_jobs when a matching DB automation_rule exists.
    // Note: if direct table insert is restricted by DB role grants, the activity_events
    // draft record above remains authoritative in the outbox view.
    let jobId = eventInsert.data.id;
    let source: OutboxJobView['source'] = 'activity_events';

    if (ruleRes.data && ruleRes.data.channel === chosenChannel) {
      let revisionId: string | null = null;
      if (def.template_key !== 'inquiry_acknowledgment') {
        const seriesRes = await supabase
          .from('proposal_series')
          .select('id')
          .eq('lead_id', row.id)
          .order('created_at', { ascending: false })
          .limit(1)
          .maybeSingle();
        if (seriesRes.data?.id) {
          const revRes = await supabase
            .from('proposal_revisions')
            .select('id')
            .eq('series_id', seriesRes.data.id)
            .order('version', { ascending: false })
            .limit(1)
            .maybeSingle();
          revisionId = revRes.data?.id ?? null;
        }
      }

      const jobInsert = await adminDb
        .from('message_jobs')
        .insert({
          agency_id: staff!.agency_id,
          rule_id: ruleRes.data.id,
          event_id: eventInsert.data.id,
          lead_id: row.id,
          revision_id: revisionId,
          channel: chosenChannel,
          provider: ruleRes.data.provider,
          recipient: draft.recipient,
          subject,
          body,
          status: 'pending_approval',
          due_at: dueAt,
          last_error: consentWarning ? 'consent_review_required' : null,
        })
        .select('id')
        .maybeSingle();

      if (!jobInsert.error && jobInsert.data?.id) {
        jobId = jobInsert.data.id;
        source = 'message_jobs';
      }
    }

    const job: OutboxJobView = {
      id: jobId,
      rule_id: ruleRes.data?.id ?? null,
      template_key: def.template_key,
      rule_name: ruleRes.data?.name ?? def.name,
      lead_id: row.id,
      lead_name: row.contact_name,
      lead_company: companyName || 'Unassigned company',
      lead_email: row.email,
      lead_phone: row.phone,
      lead_status: row.status,
      channel: chosenChannel,
      provider: (ruleRes.data?.provider as AutomationProvider | undefined) ?? def.default_provider,
      recipient: draft.recipient,
      subject,
      body,
      portal_path: null,
      status: 'pending_approval',
      due_at: dueAt,
      attempts: 0,
      last_error: consentWarning ? 'consent_review_required' : null,
      approved_by: null,
      approved_at: null,
      created_at: now,
      updated_at: now,
      consent_ok: consentOk,
      wa_me_url: draft.wa_me_url,
      mailto_url: draft.mailto_url,
      source,
    };

    const payload: PlaybooksPostResponse = {
      success: true,
      mode: 'live',
      job,
      consent_warning: consentWarning,
    };

    return json(payload, 201);
  });
