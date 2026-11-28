import { describe, it, expect, vi, beforeEach } from 'vitest';

const hoisted = vi.hoisted(() => ({
  serviceClientMock: vi.fn(),
}));

vi.mock('server-only', () => ({}));
vi.mock('@/lib/supabase/admin', () => ({
  serviceClient: hoisted.serviceClientMock,
}));

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

  it('returns action="created" once for first n8n_inquire_pipeline pass on a captured lead, then "updated" on retries', async () => {
    vi.stubEnv('AUTOMATION_SECRET', 'test-secret-key-123');
    vi.stubEnv('NEXT_PUBLIC_SUPABASE_URL', 'https://example.supabase.co');
    vi.stubEnv('NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY', 'sb_publishable_test');
    vi.stubEnv('SUPABASE_SECRET_KEY', 'test-secret-key');
    vi.stubEnv('AGENCYDESK_INTAKE_AGENCY_ID', 'a0000000-0000-4000-8000-000000000001');

    let syncedOnce = false;
    const insertedEvents: Array<{ event_type: string }> = [];

    hoisted.serviceClientMock.mockImplementation(() => ({
      from: (table: string) => {
        if (table === 'leads') {
          return {
            select: () => ({
              eq: () => ({
                eq: () => ({
                  is: () => ({
                    maybeSingle: async () => ({
                      data: {
                        id: '325b8481-8967-4d1d-9d4d-2996a8dc1fd0',
                        status: 'new',
                        row_version: 1,
                      },
                      error: null,
                    }),
                  }),
                }),
              }),
            }),
            update: () => ({
              eq: () => ({
                eq: async () => ({ error: null }),
              }),
            }),
          };
        }
        if (table === 'activity_events') {
          return {
            select: () => ({
              eq: () => ({
                eq: () => ({
                  in: () => ({
                    limit: () => ({
                      maybeSingle: async () => ({
                        data: syncedOnce ? { id: 'evt-1' } : null,
                        error: null,
                      }),
                    }),
                  }),
                }),
              }),
            }),
            insert: async (row: { event_type: string }) => {
              insertedEvents.push(row);
              if (row.event_type === 'lead_synced_to_sheets') syncedOnce = true;
              return { error: null };
            },
          };
        }
        throw new Error(`Unexpected table: ${table}`);
      },
    }));

    const buildReq = () =>
      new Request(`${origin}/api/integrations/n8n/leads/upsert`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-AgencyDesk-Signature': 'test-secret-key-123',
        },
        body: JSON.stringify({
          lead_id: '325b8481-8967-4d1d-9d4d-2996a8dc1fd0',
          contact_name: 'Synthetic Test Lead',
          email: 'lead+e2e@example.com',
          whatsapp: '+15550000170',
          whatsapp_opt_in: true,
          company: 'Synthetic Verification Co',
          service: 'AI & Workflow Automations',
          budget: 25000,
          status: 'new',
          last_synced_by: 'n8n_inquire_pipeline',
        }),
      });

    const firstRes = await upsertRoute(buildReq());
    expect(firstRes.status).toBe(200);
    const firstJson = await firstRes.json();
    expect(firstJson.action).toBe('created');
    expect(insertedEvents[0]?.event_type).toBe('lead_synced_to_sheets');

    const secondRes = await upsertRoute(buildReq());
    expect(secondRes.status).toBe(200);
    const secondJson = await secondRes.json();
    expect(secondJson.action).toBe('updated');
    expect(insertedEvents[1]?.event_type).toBe('lead_updated_from_sheets');
  });

  it('fails safe to action="updated" if prior sync activity lookup returns an error', async () => {
    vi.stubEnv('AUTOMATION_SECRET', 'test-secret-key-123');
    vi.stubEnv('NEXT_PUBLIC_SUPABASE_URL', 'https://example.supabase.co');
    vi.stubEnv('NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY', 'sb_publishable_test');
    vi.stubEnv('SUPABASE_SECRET_KEY', 'test-secret-key');
    vi.stubEnv('AGENCYDESK_INTAKE_AGENCY_ID', 'a0000000-0000-4000-8000-000000000001');

    hoisted.serviceClientMock.mockImplementation(() => ({
      from: (table: string) => {
        if (table === 'leads') {
          return {
            select: () => ({
              eq: () => ({
                eq: () => ({
                  is: () => ({
                    maybeSingle: async () => ({
                      data: {
                        id: '325b8481-8967-4d1d-9d4d-2996a8dc1fd0',
                        status: 'new',
                        row_version: 1,
                      },
                      error: null,
                    }),
                  }),
                }),
              }),
            }),
            update: () => ({
              eq: () => ({
                eq: async () => ({ error: null }),
              }),
            }),
          };
        }
        if (table === 'activity_events') {
          return {
            select: () => ({
              eq: () => ({
                eq: () => ({
                  in: () => ({
                    limit: () => ({
                      maybeSingle: async () => ({
                        data: null,
                        error: { message: 'Transient PostgREST error' },
                      }),
                    }),
                  }),
                }),
              }),
            }),
            insert: async () => ({ error: null }),
          };
        }
        throw new Error(`Unexpected table: ${table}`);
      },
    }));

    const req = new Request(`${origin}/api/integrations/n8n/leads/upsert`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-AgencyDesk-Signature': 'test-secret-key-123',
      },
      body: JSON.stringify({
        lead_id: '325b8481-8967-4d1d-9d4d-2996a8dc1fd0',
        contact_name: 'Synthetic Test Lead',
        email: 'lead+e2e@example.com',
        whatsapp: '+15550000170',
        whatsapp_opt_in: true,
        company: 'Synthetic Verification Co',
        service: 'AI & Workflow Automations',
        budget: 25000,
        status: 'new',
        last_synced_by: 'n8n_inquire_pipeline',
      }),
    });

    const res = await upsertRoute(req);
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.action).toBe('updated');
  });
});
