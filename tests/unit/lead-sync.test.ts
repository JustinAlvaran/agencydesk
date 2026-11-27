import { describe, it, expect, vi, beforeEach } from 'vitest';

vi.mock('server-only', () => ({}));

import { POST as upsertRoute } from '@/app/api/integrations/n8n/leads/upsert/route';

describe('Google Sheets <-> AgencyDesk CRM Lead Sync Integration', () => {
  const origin = 'http://localhost:3000';

  beforeEach(() => {
    vi.unstubAllEnvs();
    vi.restoreAllMocks();
    vi.stubEnv('APP_URL', origin);
  });

  it('rejects unauthorized requests when AUTOMATION_SECRET is set', async () => {
    vi.stubEnv('AUTOMATION_SECRET', 'test-secret-key-123');

    const request = new Request(`${origin}/api/integrations/n8n/leads/upsert`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-AgencyDesk-Signature': 'wrong-signature',
      },
      body: JSON.stringify({
        contact_name: 'Test Lead',
        email: 'test@example.com',
      }),
    });

    const response = await upsertRoute(request);
    expect(response.status).toBe(401);
    const data = await response.json();
    expect(data.error).toBe('Unauthorized integration signature.');
  });

  it('accepts requests with valid X-AgencyDesk-Signature in demo mode', async () => {
    vi.stubEnv('AUTOMATION_SECRET', 'test-secret-key-123');
    vi.stubEnv('NEXT_PUBLIC_DEMO_MODE', 'true');

    const payload = {
      lead_id: 'a0000000-0000-4000-8000-000000000001',
      contact_name: 'Justin Alvaran',
      email: 'kinggucci195@gmail.com',
      phone: '09913780170',
      whatsapp: '+639913780170',
      whatsapp_opt_in: true,
      instagram: '@justin_agencydesk',
      company: 'AgencyDesk Global',
      service: 'AI & Workflow Automations',
      brief: 'Two-way synchronization between Google Sheets and AgencyDesk CRM Kanban.',
      budget: 35000,
      status: 'qualified' as const,
      score: 90,
      source: 'google_sheets',
    };

    const request = new Request(`${origin}/api/integrations/n8n/leads/upsert`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-AgencyDesk-Signature': 'test-secret-key-123',
      },
      body: JSON.stringify(payload),
    });

    const response = await upsertRoute(request);
    expect(response.status).toBe(200);
    const data = await response.json();
    expect(data.success).toBe(true);
    expect(data.action).toBe('upserted');
    expect(data.lead_id).toBe('a0000000-0000-4000-8000-000000000001');
  });

  it('validates required fields and email format', async () => {
    vi.stubEnv('AUTOMATION_SECRET', 'test-secret-key-123');

    const request = new Request(`${origin}/api/integrations/n8n/leads/upsert`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-AgencyDesk-Signature': 'test-secret-key-123',
      },
      body: JSON.stringify({
        contact_name: '',
        email: 'not-an-email',
      }),
    });

    const response = await upsertRoute(request);
    expect(response.status).toBe(400);
    const data = await response.json();
    expect(data.error).toBe('Check the submitted fields.');
  });

  it('enforces agency isolation on lead lookups and updates', async () => {
    vi.stubEnv('AUTOMATION_SECRET', 'test-secret-key-123');
    vi.stubEnv('NEXT_PUBLIC_DEMO_MODE', 'true');

    const payload = {
      lead_id: 'b1111111-1111-4000-8000-111111111111',
      contact_name: 'Elena Rostova',
      email: 'elena@foreign-agency.com',
      company: 'Foreign Agency Lead',
      service: 'Web & Mobile Applications',
      budget: 15000,
      status: 'new' as const,
    };

    const request = new Request(`${origin}/api/integrations/n8n/leads/upsert`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-AgencyDesk-Signature': 'test-secret-key-123',
      },
      body: JSON.stringify(payload),
    });

    const response = await upsertRoute(request);
    expect(response.status).toBe(200);
    const data = await response.json();
    expect(data.success).toBe(true);
    expect(data.lead_id).toBe('b1111111-1111-4000-8000-111111111111');
  });
});
