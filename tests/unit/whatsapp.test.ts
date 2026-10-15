import { describe, expect, it } from 'vitest';
import { reviewedWhatsAppLink, type WhatsAppDraftPurpose } from '../../src/lib/whatsapp';

describe('manual reviewed WhatsApp handoff', () => {
  it('requires permission and an international phone number', () => {
    expect(reviewedWhatsAppLink('+639123456789', 'Hello', false)).toBeNull();
    expect(reviewedWhatsAppLink('09123456789', 'Hello', true)).toBeNull();
    expect(reviewedWhatsAppLink('javascript:alert(1)', 'Hello', true)).toBeNull();
  });
  it('encodes draft text without allowing extra destinations or query fields', () => {
    const result = new URL(reviewedWhatsAppLink('+639123456789', 'Hello &recipient=other\n<test>', true)!);
    expect(result.origin).toBe('https://wa.me');
    expect(result.pathname).toBe('/639123456789');
    expect(result.searchParams.get('text')).toBe('Hello &recipient=other\n<test>');
    expect([...result.searchParams.keys()]).toEqual(['text']);
  });
  it('rejects empty and overlong drafts', () => {
    expect(reviewedWhatsAppLink('+639123456789', '   ', true)).toBeNull();
    expect(reviewedWhatsAppLink('+639123456789', 'x'.repeat(2501), true)).toBeNull();
  });
  it('never hands an internal staff summary to a customer, even with permission', () => {
    expect(reviewedWhatsAppLink('+639123456789', 'Internal lead qualification notes', true, 'summary')).toBeNull();
    expect(reviewedWhatsAppLink('+639123456789', 'Hello', true, 'reply')).not.toBeNull();
    expect(reviewedWhatsAppLink('+639123456789', 'Following up on your inquiry', true, 'follow_up')).not.toBeNull();
    expect(reviewedWhatsAppLink('+639123456789', 'Unknown text purpose', true, 'other' as WhatsAppDraftPurpose)).toBeNull();
  });
});
