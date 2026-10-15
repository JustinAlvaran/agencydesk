import { describe, expect, it } from 'vitest';
import { InquiryError, inquiryHash, parseInquiry, readInquiry } from '../../supabase/functions/_shared/inquiry';
import { assistantAnswers, assistantServiceAnswer } from '../../src/lib/service-assistant';
import fixtures from '../../content/fixtures.json';

const services = fixtures.services.filter(service => service.visibility === 'visible');
const allowed = [...services.map(service => service.title), 'Not sure yet'];
const valid = { contact_name: '  Fictional visitor ', email: ' VISITOR@example.test ', service: allowed[0], brief: 'A fictional agency website with contact capture.', budget_cents: 100000, email_opt_in: false, whatsapp_opt_in: false };

describe('public intake boundary', () => {
  it('normalizes contact information and keeps consent explicitly off', () => {
    expect(parseInquiry(valid, allowed)).toMatchObject({ contact_name: 'Fictional visitor', email: 'visitor@example.test', email_opt_in: false, whatsapp_opt_in: false, phone: null, intake_source: 'website' });
  });
  it.each([
    null, [], { ...valid, service: 'Hidden service' }, { ...valid, email: {} },
    { ...valid, budget_cents: '100000' }, { ...valid, budget_cents: 10000.1 },
    { ...valid, website: 'https://spam.example' }, { ...valid, email_opt_in: 'true' },
    { ...valid, whatsapp_opt_in: true }, { ...valid, phone: { number: '+639171234567' } },
    { ...valid, intake_source: 'admin' }, { ...valid, submission_id: 'not-a-uuid' },
  ])('rejects invalid direct Edge requests before privileged database access (%#)', value => {
    expect(() => parseInquiry(value, allowed)).toThrow(InquiryError);
  });
  it('accepts a valid chatbot submission without trusting a caller-supplied agency', () => {
    const payload = parseInquiry({ ...valid, submission_id: '10000000-0000-4000-8000-000000000001', intake_source: 'website_chatbot', target_agency_id: 'attacker' }, allowed);
    expect(payload.intake_source).toBe('website_chatbot');
    expect(payload).not.toHaveProperty('target_agency_id');
  });
  it('rejects an oversized chunked UTF-8 body even without Content-Length', async () => {
    const input = new Request('https://agency.example', { method: 'POST', body: JSON.stringify({ text: 'é'.repeat(9000) }) });
    await expect(readInquiry(input)).rejects.toMatchObject({ status: 413 });
  });
  it('reads a bounded JSON stream and rejects malformed JSON', async () => {
    await expect(readInquiry(new Request('https://agency.example', { method: 'POST', body: JSON.stringify(valid) }))).resolves.toEqual(valid);
    await expect(readInquiry(new Request('https://agency.example', { method: 'POST', body: '{' }))).rejects.toMatchObject({ status: 400 });
  });
  it('uses a stable SHA-256 fingerprint that changes when consent changes', async () => {
    expect(await inquiryHash('visitor@example.test')).toMatch(/^[a-f0-9]{64}$/);
    expect(await inquiryHash(JSON.stringify(valid))).not.toBe(await inquiryHash(JSON.stringify({ ...valid, email_opt_in: true })));
  });
});

describe('service assistant facts', () => {
  it.each(services)('uses the published description and scope for $title', service => {
    const answer = assistantServiceAnswer(service);
    for (const fact of [service.description, service.bullet_1, service.bullet_2, service.bullet_3]) expect(answer).toContain(fact);
  });
  it('defers price, timeline and human follow-up instead of promising a quote or a live agent', () => {
    expect(assistantAnswers.pricing).toContain('cannot provide a quote');
    expect(assistantAnswers.handoff).toContain('not a live support inbox');
    expect(assistantAnswers.handoff).toContain('separate optional choices');
  });
});
