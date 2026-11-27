import { describe, it, expect, vi, beforeEach } from 'vitest';
import fs from 'node:fs';
import path from 'node:path';

vi.mock('server-only', () => ({}));

const mockCookieGet = vi.fn();
vi.mock('next/headers', () => ({
  cookies: vi.fn(async () => ({
    get: mockCookieGet,
  })),
}));

import {
  PLAYBOOK_DEFINITIONS,
  buildMailtoUrl,
  buildPlaybookDraft,
  buildWhatsAppUrl,
  defaultProviderForChannel,
  getPlaybookDefinition,
  isValidChannelProviderPair,
  normalizeWhatsAppDigits,
  recommendNextAction,
  type LeadDraftInput,
} from '@/lib/automation-playbooks';
import {
  GET as getPlaybooks,
  PATCH as patchPlaybook,
  POST as postPlaybookDraft,
} from '@/app/api/crm/automations/playbooks/route';
import {
  GET as getOutbox,
  POST as postOutboxAction,
} from '@/app/api/crm/automations/outbox/route';

function makeLead(overrides: Partial<LeadDraftInput> = {}): LeadDraftInput {
  return {
    id: 'lead-001',
    contact_name: 'Elena Vance',
    email: 'elena@blackmesa.ai',
    company: 'Black Mesa AI',
    service: 'AI & Workflow Automations',
    status: 'new',
    phone: '+639913780170',
    whatsapp: '+639913780170',
    whatsapp_opt_in: true,
    email_opt_in: true,
    budget: 35000,
    ...overrides,
  };
}

describe('Automation Playbooks & Lifecycle Verification', () => {
  const origin = 'http://localhost:3000';

  beforeEach(() => {
    vi.unstubAllEnvs();
    vi.restoreAllMocks();
    vi.stubEnv('APP_URL', origin);
    mockCookieGet.mockReset();
    mockCookieGet.mockImplementation((name: string) =>
      name === 'agencydesk_staff_session' ? { value: 'demo-staff-session' } : undefined
    );
  });

  describe('1. Phone formatting, URL builders & channel/provider validation', () => {
    it('normalizes Philippine 09xx numbers and E.164 numbers cleanly', () => {
      expect(normalizeWhatsAppDigits('09913780170')).toBe('639913780170');
      expect(normalizeWhatsAppDigits('+63 991-378-0170')).toBe('639913780170');
      expect(normalizeWhatsAppDigits('+1 (555) 234-8901')).toBe('15552348901');
      expect(normalizeWhatsAppDigits('123')).toBeNull();
      expect(normalizeWhatsAppDigits('')).toBeNull();
      expect(normalizeWhatsAppDigits(null)).toBeNull();
    });

    it('builds safe wa.me and mailto URLs', () => {
      const wa = buildWhatsAppUrl('09913780170', 'Hi Elena!');
      expect(wa).toBe('https://wa.me/639913780170?text=Hi%20Elena!');
      expect(buildWhatsAppUrl('09913780170')).toBe('https://wa.me/639913780170');
      expect(buildWhatsAppUrl('invalid')).toBeNull();

      const mailto = buildMailtoUrl(' elena@blackmesa.ai\r\n', 'Hello\nWorld', 'Body text');
      expect(mailto).toContain('mailto:elena@blackmesa.ai?');
      expect(mailto).toContain('subject=Hello+World');
      expect(mailto).toContain('body=Body+text');
      expect(buildMailtoUrl('not-an-email')).toBeNull();
      expect(buildMailtoUrl('evil?cc=x@y.com@blackmesa.ai')).toBeNull();
      expect(buildMailtoUrl('evil<script>@blackmesa.ai')).toBeNull();
    });

    it('validates channel/provider pairings and defaults', () => {
      expect(isValidChannelProviderPair('email', 'resend')).toBe(true);
      expect(isValidChannelProviderPair('email', 'gmail')).toBe(true);
      expect(isValidChannelProviderPair('email', 'whatsapp')).toBe(false);

      expect(isValidChannelProviderPair('whatsapp', 'whatsapp')).toBe(true);
      expect(isValidChannelProviderPair('whatsapp', 'waha')).toBe(true);
      expect(isValidChannelProviderPair('whatsapp', 'zoko')).toBe(true);
      expect(isValidChannelProviderPair('whatsapp', 'resend')).toBe(false);

      expect(defaultProviderForChannel('email')).toBe('resend');
      expect(defaultProviderForChannel('whatsapp')).toBe('whatsapp');
    });

    it('exposes all 5 lifecycle playbook definitions in order', () => {
      expect(PLAYBOOK_DEFINITIONS).toHaveLength(5);
      expect(PLAYBOOK_DEFINITIONS.map((p) => p.template_key)).toEqual([
        'inquiry_acknowledgment',
        'discovery_followup',
        'proposal_notice',
        'proposal_follow_up',
        'proposal_accepted',
      ]);
      expect(getPlaybookDefinition('proposal_accepted').stage_trigger).toBe('won');
    });
  });

  describe('2. Next Best Action recommendation across all lead stages & opt-in states', () => {
    it('recommends WhatsApp inquiry acknowledgment for new lead with phone and marks consent_ready when opted in', () => {
      const rec = recommendNextAction(makeLead({ status: 'new', whatsapp_opt_in: true }));
      expect(rec.template_key).toBe('inquiry_acknowledgment');
      expect(rec.channel).toBe('WhatsApp');
      expect(rec.channel_key).toBe('whatsapp');
      expect(rec.priority).toBe('high');
      expect(rec.consent_ready).toBe(true);
      expect(rec.wa_me_url).toContain('https://wa.me/639913780170');
      expect(rec.mailto_url).toContain('mailto:elena@blackmesa.ai');
    });

    it('falls back to email for new lead without phone and marks consent_ready false when WhatsApp opt-in is missing', () => {
      const noPhone = recommendNextAction(
        makeLead({ status: 'new', phone: null, whatsapp: null, whatsapp_opt_in: false, email_opt_in: true })
      );
      expect(noPhone.channel_key).toBe('email');
      expect(noPhone.consent_ready).toBe(true);
      expect(noPhone.wa_me_url).toBeNull();

      const noOptIn = recommendNextAction(
        makeLead({ status: 'new', whatsapp: '09913780170', whatsapp_opt_in: false })
      );
      expect(noOptIn.channel_key).toBe('whatsapp');
      expect(noOptIn.consent_ready).toBe(false);
    });

    it('handles contacted stage with WhatsApp when opted in and Email when not opted in', () => {
      const optedIn = recommendNextAction(makeLead({ status: 'contacted', whatsapp_opt_in: true }));
      expect(optedIn.template_key).toBe('discovery_followup');
      expect(optedIn.channel_key).toBe('whatsapp');
      expect(optedIn.consent_ready).toBe(true);

      const notOptedIn = recommendNextAction(
        makeLead({ status: 'contacted', whatsapp_opt_in: false, email_opt_in: true })
      );
      expect(notOptedIn.template_key).toBe('discovery_followup');
      expect(notOptedIn.channel_key).toBe('email');
      expect(notOptedIn.consent_ready).toBe(true);
    });

    it('recommends proposal_notice on email for qualified stage', () => {
      const rec = recommendNextAction(makeLead({ status: 'qualified', email_opt_in: false }));
      expect(rec.template_key).toBe('proposal_notice');
      expect(rec.channel_key).toBe('email');
      expect(rec.priority).toBe('high');
      expect(rec.consent_ready).toBe(false);
    });

    it('recommends proposal_follow_up for proposal_sent stage', () => {
      const rec = recommendNextAction(makeLead({ status: 'proposal_sent', whatsapp_opt_in: true }));
      expect(rec.template_key).toBe('proposal_follow_up');
      expect(rec.channel_key).toBe('whatsapp');
      expect(rec.priority).toBe('medium');
      expect(rec.consent_ready).toBe(true);

      const emailFallback = recommendNextAction(
        makeLead({ status: 'proposal_sent', phone: null, whatsapp: null, whatsapp_opt_in: false })
      );
      expect(emailFallback.channel_key).toBe('email');
    });

    it('recommends proposal_accepted kickoff for won stage and low-priority check-in for lost stage', () => {
      const won = recommendNextAction(makeLead({ status: 'won' }));
      expect(won.template_key).toBe('proposal_accepted');
      expect(won.channel_key).toBe('email');
      expect(won.priority).toBe('medium');

      const lost = recommendNextAction(makeLead({ status: 'lost' }));
      expect(lost.template_key).toBe('discovery_followup');
      expect(lost.channel_key).toBe('email');
      expect(lost.priority).toBe('low');
    });

    it('builds personalized drafts with normalized recipient', () => {
      const draft = buildPlaybookDraft(
        makeLead({ contact_name: 'Justin Alvaran', whatsapp: '09913780170' }),
        'inquiry_acknowledgment',
        'whatsapp'
      );
      expect(draft.recipient).toBe('+639913780170');
      expect(draft.body).toContain('Justin');
      expect(draft.body).toContain('Black Mesa AI');
    });
  });

  describe('3. n8n Cloud Workflow JSON validation (0 $env references, valid connections & error outputs)', () => {
    const workflowFiles = [
      'infra/n8n/workflows/agencydesk-lead-automation.json',
      'infra/n8n/workflows/agencydesk-post-lead-lifecycle.json',
    ];

    it.each(workflowFiles)(
      '%s parses cleanly, has zero $env references, valid connections, and error outputs',
      (relPath) => {
        const fullPath = path.resolve(process.cwd(), relPath);
        expect(fs.existsSync(fullPath)).toBe(true);

        const raw = fs.readFileSync(fullPath, 'utf8');
        expect(raw).not.toMatch(/\$env\b/);

        const wf = JSON.parse(raw) as {
          name: string;
          nodes: Array<{
            id: string;
            name: string;
            type: string;
            onError?: string;
          }>;
          connections: Record<
            string,
            {
              main?: Array<Array<{ node: string; type: string; index: number }>>;
            }
          >;
        };

        expect(typeof wf.name).toBe('string');
        expect(Array.isArray(wf.nodes)).toBe(true);
        expect(wf.nodes.length).toBeGreaterThan(5);

        const nodeNames = new Set(wf.nodes.map((n) => n.name));
        expect(nodeNames.size).toBe(wf.nodes.length);

        // Validate every connection source and target refers to a real node
        for (const [sourceName, conn] of Object.entries(wf.connections)) {
          expect(nodeNames.has(sourceName)).toBe(true);
          for (const branch of conn.main ?? []) {
            for (const edge of branch) {
              expect(nodeNames.has(edge.node)).toBe(true);
            }
          }
        }

        // Validate all HTTP Request, Google Sheets, and Gmail nodes have continueErrorOutput + main[1]
        const externalNodes = wf.nodes.filter((n) =>
          [
            'n8n-nodes-base.httpRequest',
            'n8n-nodes-base.googleSheets',
            'n8n-nodes-base.gmail',
          ].includes(n.type)
        );
        expect(externalNodes.length).toBeGreaterThan(0);

        for (const node of externalNodes) {
          expect(node.onError).toBe('continueErrorOutput');
          const branches = wf.connections[node.name]?.main ?? [];
          expect(branches.length).toBeGreaterThanOrEqual(2);
          expect(branches[1].length).toBeGreaterThan(0);
        }

        // Verify no invalid `undefined` inside HTTP jsonBody expressions
        expect(raw).not.toMatch(/:\s*undefined\b/);
      }
    );

    it('enforces fail-closed webhook auth, schedule-branch isolation, and HTML escaping in n8n workflows', () => {
      const leadWfPath = path.resolve(
        process.cwd(),
        'infra/n8n/workflows/agencydesk-lead-automation.json'
      );
      const lifecycleWfPath = path.resolve(
        process.cwd(),
        'infra/n8n/workflows/agencydesk-post-lead-lifecycle.json'
      );

      const leadRaw = fs.readFileSync(leadWfPath, 'utf8');
      const lifecycleRaw = fs.readFileSync(lifecycleWfPath, 'utf8');

      // Fail-closed signature check in lead automation webhook & sheets sync
      expect(leadRaw).toContain('!expectedSecret || signature !== expectedSecret');

      // Fail-closed signature check isolated on Webhook branch before Schedule merge
      const lifecycleWf = JSON.parse(lifecycleRaw) as {
        nodes: Array<{ name: string; parameters?: { jsCode?: string } }>;
        connections: Record<string, { main?: Array<Array<{ node: string }>> }>;
      };

      const verifyNode = lifecycleWf.nodes.find((n) => n.name === 'Verify Lifecycle Webhook Signature');
      expect(verifyNode?.parameters?.jsCode).toContain('!expectedSecret || signature !== expectedSecret');

      const webhookTargets =
        lifecycleWf.connections['Webhook - CRM Lifecycle Event']?.main?.[0]?.map((e) => e.node) ?? [];
      expect(webhookTargets).toEqual(['Verify Lifecycle Webhook Signature']);

      const scheduleTargets =
        lifecycleWf.connections['Schedule - Daily Morning Stale Check']?.main?.[0]?.map((e) => e.node) ?? [];
      expect(scheduleTargets).toEqual(['Tag Schedule Trigger']);

      // HTML escaping & URL validation in morning digest
      const digestNode = lifecycleWf.nodes.find((n) => n.name === 'Compile Stale Leads Morning Summary');
      expect(digestNode?.parameters?.jsCode).toContain('const escapeHtml');
      expect(digestNode?.parameters?.jsCode).toContain('sanitizeHttpUrl');
    });
  });

  describe('4. /api/crm/automations/playbooks & /outbox routes in demo mode', () => {
    it('GET /playbooks returns all 5 playbooks and stats in demo mode', async () => {
      const res = await getPlaybooks();
      expect(res.status).toBe(200);
      const data = await res.json();
      expect(data.mode).toBe('demo');
      expect(data.playbooks).toHaveLength(5);
      expect(data.stats.total_rules).toBe(5);
      expect(data.stats.enabled_rules).toBeGreaterThanOrEqual(1);
    });

    it('GET /playbooks fails closed with 503 when unauthenticated in unit test env', async () => {
      mockCookieGet.mockReturnValue(undefined);
      const res = await getPlaybooks();
      expect(res.status).toBe(503);
    });

    it('PATCH /playbooks updates rule config and rejects mismatched channel/provider', async () => {
      const validReq = new Request(`${origin}/api/crm/automations/playbooks`, {
        method: 'PATCH',
        headers: { origin, 'Content-Type': 'application/json' },
        body: JSON.stringify({
          template_key: 'proposal_notice',
          enabled: true,
          channel: 'whatsapp',
          provider: 'waha',
          delay_minutes: 30,
        }),
      });
      const okRes = await patchPlaybook(validReq);
      expect(okRes.status).toBe(200);
      const okJson = await okRes.json();
      expect(okJson.success).toBe(true);
      expect(okJson.rule.enabled).toBe(true);
      expect(okJson.rule.channel).toBe('whatsapp');
      expect(okJson.rule.provider).toBe('waha');

      const badReq = new Request(`${origin}/api/crm/automations/playbooks`, {
        method: 'PATCH',
        headers: { origin, 'Content-Type': 'application/json' },
        body: JSON.stringify({
          template_key: 'proposal_notice',
          channel: 'email',
          provider: 'whatsapp',
        }),
      });
      const badRes = await patchPlaybook(badReq);
      expect(badRes.status).toBe(400);
    });

    it('POST /playbooks queues a draft and emits consent_warning when WhatsApp opt-in is missing', async () => {
      const req = new Request(`${origin}/api/crm/automations/playbooks`, {
        method: 'POST',
        headers: { origin, 'Content-Type': 'application/json' },
        body: JSON.stringify({
          lead_id: 'unknown-lead-id',
          template_key: 'inquiry_acknowledgment',
          channel: 'whatsapp',
        }),
      });

      const res = await postPlaybookDraft(req);
      expect(res.status).toBe(201);
      const data = await res.json();
      expect(data.success).toBe(true);
      expect(data.mode).toBe('demo');
      expect(data.job.status).toBe('pending_approval');
      expect(data.job.consent_ok).toBe(false);
      expect(data.consent_warning).toContain('WhatsApp opt-in');
    });

    it('GET /outbox and POST /outbox handle approve, cancel, and mark_sent_manual in demo mode', async () => {
      const listRes = await getOutbox();
      expect(listRes.status).toBe(200);
      const listData = await listRes.json();
      expect(listData.mode).toBe('demo');
      expect(listData.jobs.length).toBeGreaterThanOrEqual(3);
      expect(listData.events.length).toBeGreaterThanOrEqual(1);
      expect(listData.summary.total).toBe(listData.jobs.length);

      const approveReq = new Request(`${origin}/api/crm/automations/outbox`, {
        method: 'POST',
        headers: { origin, 'Content-Type': 'application/json' },
        body: JSON.stringify({ job_id: 'demo-job-1', action: 'approve' }),
      });
      const approveRes = await postOutboxAction(approveReq);
      expect(approveRes.status).toBe(200);
      const approveJson = await approveRes.json();
      expect(approveJson.status).toBe('queued');

      const cancelReq = new Request(`${origin}/api/crm/automations/outbox`, {
        method: 'POST',
        headers: { origin, 'Content-Type': 'application/json' },
        body: JSON.stringify({ job_id: 'demo-job-2', action: 'cancel' }),
      });
      const cancelRes = await postOutboxAction(cancelReq);
      expect(cancelRes.status).toBe(200);
      const cancelJson = await cancelRes.json();
      expect(cancelJson.status).toBe('cancelled');

      const manualReq = new Request(`${origin}/api/crm/automations/outbox`, {
        method: 'POST',
        headers: { origin, 'Content-Type': 'application/json' },
        body: JSON.stringify({ job_id: 'demo-job-1', action: 'mark_sent_manual' }),
      });
      const manualRes = await postOutboxAction(manualReq);
      expect(manualRes.status).toBe(200);
      const manualJson = await manualRes.json();
      expect(manualJson.status).toBe('delivered');
    });
  });
});
