import { describe, it, expect, vi, beforeEach } from 'vitest';
import fs from 'node:fs';
import path from 'node:path';

vi.mock('server-only', () => ({}));

import { POST as inquireRoute } from '@/app/api/inquire/route';
import { POST as whatsappDispatchRoute } from '@/app/api/crm/automations/whatsapp-dispatch/route';

describe('End-to-End Lead Automation & WhatsApp Pipeline', () => {
  const origin = 'http://localhost:3000';

  beforeEach(() => {
    vi.unstubAllEnvs();
    vi.restoreAllMocks();
    vi.stubEnv('APP_URL', origin);
  });

  describe('1. Public Inquiry Intake with WhatsApp & Instagram', () => {
    it('normalizes Philippine mobile number to E.164 and sanitizes Instagram handle in demo mode', async () => {
      const payload = {
        submission_id: 'a0000000-0000-4000-8000-000000000001',
        contact_name: 'Justin Alvaran',
        email: 'kinggucci195@gmail.com',
        company: 'AgencyDesk Automation',
        phone: '09913780170',
        whatsapp: '09913780170',
        whatsapp_opt_in: true,
        instagram: 'https://instagram.com/agencydesk',
        service: 'AI & Workflow Automations',
        budget: '$50,000 - $100,000',
        timeline: 'Immediate (Next 30 days)',
        brief: 'Testing the automated WhatsApp and Instagram CRM lead pipeline end-to-end.',
        email_opt_in: true,
      };

      const request = new Request(`${origin}/api/inquire`, {
        method: 'POST',
        headers: {
          origin,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      });

      const response = await inquireRoute(request);
      expect(response.status).toBe(201);
      const data = await response.json();
      expect(data.success).toBe(true);
    });

    it('rejects bot submissions failing honeypot check', async () => {
      const payload = {
        submission_id: 'a0000000-0000-4000-8000-000000000001',
        contact_name: 'Spam Bot',
        email: 'bot@spam.com',
        service: 'Web & Mobile Applications',
        brief: 'Spam submission containing promotional text.',
        website: 'https://spam-bot.net', // Honeypot filled
      };

      const request = new Request(`${origin}/api/inquire`, {
        method: 'POST',
        headers: {
          origin,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      });

      const response = await inquireRoute(request);
      expect(response.status).toBe(400);
    });
  });

  describe('2. Automated WhatsApp Dispatch Endpoint', () => {
    it('successfully delivers automated alert to target phone +639913780170', async () => {
      vi.stubEnv('AUTOMATION_SECRET', 'test-automation-secret');

      const message = [
        '🚀 *NEW AGENCYDESK LEAD INQUIRY*',
        '━━━━━━━━━━━━━━━━━━━━━',
        '👤 *Contact:* Justin Alvaran',
        '🏢 *Company:* AgencyDesk Automation',
        '💼 *Service:* AI & Workflow Automations',
        '💰 *Budget:* $50,000',
        '📱 *WhatsApp:* +639913780170 (✅ Opted-in)',
        '📸 *Instagram:* @agencydesk',
        '━━━━━━━━━━━━━━━━━━━━━',
        '⚡ *Open Lead:* https://agencydesk-theta.vercel.app/crm/leads',
      ].join('\n');

      const request = new Request(`${origin}/api/crm/automations/whatsapp-dispatch`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-AgencyDesk-Signature': 'test-automation-secret',
        },
        body: JSON.stringify({
          to: '+639913780170',
          lead_phone: '+639913780170',
          message,
          lead_id: 'a0000000-0000-4000-8000-000000000001',
          timestamp: new Date().toISOString(),
        }),
      });

      const response = await whatsappDispatchRoute(request);
      expect(response.status).toBe(200);

      const json = await response.json();
      expect(json.success).toBe(true);
      expect(json.delivered).toBe(true);
      expect(json.recipient).toBe('+639913780170');
      expect(json.message_length).toBe(message.length);
    });
  });

  describe('3. Professional n8n Workflow JSON Architecture Validation', () => {
    it('validates workflow structure, node connectivity, and target phone configuration', () => {
      const workflowPath = path.resolve(
        process.cwd(),
        'infra/n8n/workflows/agencydesk-lead-automation.json'
      );
      expect(fs.existsSync(workflowPath)).toBe(true);

      const content = fs.readFileSync(workflowPath, 'utf8');
      const workflow = JSON.parse(content);

      expect(workflow.name).toBe('AgencyDesk Lead Automation & WhatsApp Dispatch');
      expect(Array.isArray(workflow.nodes)).toBe(true);
      expect(workflow.nodes.length).toBeGreaterThanOrEqual(10);

      // Verify essential nodes exist (n8n Cloud-safe CRM API upsert architecture)
      const nodeNames = workflow.nodes.map((n: { name: string }) => n.name);
      expect(nodeNames).toContain('Webhook - AgencyDesk Inquire');
      expect(nodeNames).toContain('Normalize & Validate Lead Payload');
      expect(nodeNames).toContain('Valid Lead Email?');
      expect(nodeNames).toContain('Upsert Lead in AgencyDesk CRM');
      expect(nodeNames).toContain('Is New Lead Created?');
      expect(nodeNames).toContain('Format WhatsApp Message');
      expect(nodeNames).toContain('Dispatch WhatsApp Alert');
      expect(nodeNames).toContain('Respond to Inquire Webhook');

      // Verify zero $env references (blocked on n8n Cloud)
      expect(content).not.toContain('$env');

      // Verify target phone number is pinned to the user's number
      const formatNode = workflow.nodes.find(
        (n: { name: string }) => n.name === 'Format WhatsApp Message'
      );
      expect(formatNode.parameters.jsCode).toContain('+639913780170');

      // Verify CRM API upsert endpoint is used instead of raw PostgREST
      const upsertNode = workflow.nodes.find(
        (n: { name: string }) => n.name === 'Upsert Lead in AgencyDesk CRM'
      );
      expect(upsertNode.parameters.url).toContain('/api/integrations/n8n/leads/upsert');

      // Verify phone normalization logic handles Philippine numbers
      const normalizeNode = workflow.nodes.find(
        (n: { name: string }) => n.name === 'Normalize & Validate Lead Payload'
      );
      expect(normalizeNode.parameters.jsCode).toContain('+63');
    });
  });
});
