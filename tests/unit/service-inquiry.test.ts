import { afterEach, describe, expect, it, vi } from 'vitest';
import fixtures from '../../content/fixtures.json';
import { inquiryService, visibleServices } from '../../src/lib/service-catalog';
import { websiteContentSchema } from '../../src/lib/website-schema';

const { submit } = vi.hoisted(() => ({ submit: vi.fn() }));
vi.mock('@/lib/supabase/inquiry', () => ({ submitInquiry: submit }));
vi.mock('@/lib/website-content', () => ({ publicServices: fixtures.services.filter(service => service.visibility === 'visible') }));
import { POST } from '../../src/app/api/inquiries/route';

afterEach(() => { vi.unstubAllEnvs(); vi.clearAllMocks(); });
const services = websiteContentSchema.parse(fixtures).services;
const payload = { contact_name: 'Fictional inquiry', email: 'inquiry@example.test', service: 'CRM and automation setup', brief: 'Please connect the lead intake and follow-up workflow.', budget_cents: 100000, email_opt_in: false, whatsapp_opt_in: false };
function request(service: string) { return new Request('https://agency.example/api/inquiries', { method: 'POST', headers: { Origin: 'https://agency.example', 'Content-Type': 'application/json' }, body: JSON.stringify({ ...payload, service }) }); }

describe('published service handoff', () => {
  it('never exposes an archived service through preselection', () => {
    const archived = { ...services[0], visibility: 'archived' as const };
    expect(visibleServices([archived, services[1]])).toEqual([services[1]]);
    expect(inquiryService([archived], archived.id)).toBe('');
    expect(inquiryService(services, 'https://attacker.example')).toBe('');
    expect(inquiryService(services, [services[0].id, services[1].id])).toBe('');
  });
  it('resolves a service slug to the same title stored in the CRM', () => {
    expect(inquiryService(services, 'crm-automation')).toBe(payload.service);
  });
  it('rejects duplicate route IDs before publishing a content snapshot', () => {
    expect(websiteContentSchema.safeParse({ ...fixtures, services: [services[0], { ...services[1], id: services[0].id }] }).success).toBe(false);
  });
  it('rejects stale or injected service choices before calling the lead backend', async () => {
    vi.stubEnv('APP_MODE', 'live');
    expect((await POST(request('Unpublished service'))).status).toBe(400);
    expect(submit).not.toHaveBeenCalled();
  });
  it('passes the approved service and unchecked preferences to the lead backend', async () => {
    vi.stubEnv('APP_MODE', 'live'); submit.mockResolvedValue({ id: 'fictional' });
    expect((await POST(request(payload.service))).status).toBe(201);
    expect(submit).toHaveBeenCalledWith(payload);
  });
  it('supports an undecided inquiry without forcing a service commitment', async () => {
    vi.stubEnv('APP_MODE', 'live'); submit.mockResolvedValue({ id: 'fictional' });
    expect((await POST(request('Not sure yet'))).status).toBe(201);
  });
  it('accepts the configured public origin when a host reconstructs an internal request URL', async () => {
    vi.stubEnv('APP_MODE', 'live'); vi.stubEnv('APP_URL', 'https://agency.example'); submit.mockResolvedValue({ id: 'fictional' });
    const proxied = new Request('http://internal-host/api/inquiries', { method: 'POST', headers: { Origin: 'https://agency.example', 'Content-Type': 'application/json' }, body: JSON.stringify(payload) });
    expect((await POST(proxied)).status).toBe(201);
  });
  it('does not trust a reflected Host and Origin over the configured public origin', async () => {
    vi.stubEnv('APP_MODE', 'live'); vi.stubEnv('APP_URL', 'https://agency.example');
    const reflected = new Request('https://untrusted.example/api/inquiries', { method: 'POST', headers: { Origin: 'https://untrusted.example', 'Content-Type': 'application/json' }, body: JSON.stringify(payload) });
    expect((await POST(reflected)).status).toBe(403);
    expect(submit).not.toHaveBeenCalled();
  });
});
