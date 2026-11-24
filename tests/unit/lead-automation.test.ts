import { describe, it, expect, vi, beforeEach } from 'vitest';
vi.mock('server-only', () => ({}));

import { leadView } from '@/lib/crm-data';
import { POST as whatsappDispatch } from '@/app/api/crm/automations/whatsapp-dispatch/route';

describe('Lead Automation & Social Channels', () => {
  beforeEach(() => {
    vi.unstubAllEnvs();
    vi.restoreAllMocks();
  });

  describe('leadView data mapping', () => {
    it('correctly maps whatsapp, whatsapp_opt_in, and instagram from lead row', () => {
      const mockRow = {
        id: 'lead-test-1',
        agency_id: 'a0000000-0000-4000-8000-000000000001',
        contact_name: 'Justin Alvaran',
        email: 'justin@agencydesk.com',
        phone: '+639913780170',
        whatsapp: '+639913780170',
        whatsapp_opt_in: true,
        instagram: '@justin_agencydesk',
        company_id: null,
        company_name: 'AgencyDesk Co',
        service: 'AI & Workflow Automations',
        brief: 'Need an automated WhatsApp lead pipeline with n8n.',
        budget_cents: 3500000,
        status: 'new' as const,
        probability: 20,
        score: 85,
        owner_id: null,
        owner_name: 'Justin Alvaran',
        created_at: '2026-11-25T00:00:00Z',
        updated_at: '2026-11-25T00:00:00Z',
        row_version: 1,
      };

      const view = leadView(mockRow as unknown as Parameters<typeof leadView>[0]);

      expect(view.whatsapp).toBe('+639913780170');
      expect(view.whatsapp_opt_in).toBe(true);
      expect(view.instagram).toBe('@justin_agencydesk');
      expect(view.budget).toBe(35000);
      expect(view.score).toBe(85);
    });

    it('falls back to phone when whatsapp column is empty', () => {
      const mockRow = {
        id: 'lead-test-2',
        agency_id: 'a0000000-0000-4000-8000-000000000001',
        contact_name: 'Elena Vance',
        email: 'elena@blackmesa.ai',
        phone: '+15552348901',
        company_name: 'Black Mesa',
        service: 'Web & Mobile Applications',
        brief: 'Portal upgrade with telemetry.',
        budget_cents: 2000000,
        status: 'new' as const,
        created_at: '2026-11-25T00:00:00Z',
        updated_at: '2026-11-25T00:00:00Z',
        row_version: 1,
      };

      const view = leadView(mockRow as unknown as Parameters<typeof leadView>[0]);
      expect(view.whatsapp).toBe('+15552348901');
      expect(view.whatsapp_opt_in).toBe(false);
      expect(view.instagram).toBeUndefined();
    });
  });

  describe('WhatsApp Dispatch Endpoint', () => {
    it('accepts valid dispatch payload for target number', async () => {
      vi.stubEnv('AUTOMATION_SECRET', 'test-signature');
      const request = new Request('http://localhost:3000/api/crm/automations/whatsapp-dispatch', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-AgencyDesk-Signature': 'test-signature',
        },
        body: JSON.stringify({
          to: '+639913780170',
          message: '🚀 New AgencyDesk Lead: Justin Alvaran',
          lead_id: 'lead-test-1',
          timestamp: new Date().toISOString(),
        }),
      });

      const response = await whatsappDispatch(request);
      expect(response.status).toBe(200);

      const json = await response.json();
      expect(json.success).toBe(true);
      expect(json.delivered).toBe(true);
      expect(json.recipient).toBe('+639913780170');
    });

    it('rejects dispatch if automation signature is invalid when configured', async () => {
      vi.stubEnv('AUTOMATION_SECRET', 'super-secret-signature');

      const request = new Request('http://localhost:3000/api/crm/automations/whatsapp-dispatch', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-AgencyDesk-Signature': 'wrong-signature',
        },
        body: JSON.stringify({
          to: '+639913780170',
          message: 'Test message',
        }),
      });

      const response = await whatsappDispatch(request);
      expect(response.status).toBe(401);
    });

    it('allows dispatch when correct automation signature is provided', async () => {
      vi.stubEnv('AUTOMATION_SECRET', 'super-secret-signature');

      const request = new Request('http://localhost:3000/api/crm/automations/whatsapp-dispatch', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-AgencyDesk-Signature': 'super-secret-signature',
        },
        body: JSON.stringify({
          to: '+639913780170',
          message: 'Test message',
        }),
      });

      const response = await whatsappDispatch(request);
      expect(response.status).toBe(200);
      const json = await response.json();
      expect(json.success).toBe(true);
    });

    it('fails closed when not in demo mode and secret is missing', async () => {
      vi.stubEnv('NEXT_PUBLIC_SUPABASE_URL', 'https://example.supabase.co');
      vi.stubEnv('NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY', 'test-anon-key');
      vi.stubEnv('AUTOMATION_SECRET', '');

      const request = new Request('http://localhost:3000/api/crm/automations/whatsapp-dispatch', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          to: '+639913780170',
          message: 'Test message',
        }),
      });

      const response = await whatsappDispatch(request);
      expect(response.status).toBe(401);
    });
  });
});
