import { describe, expect, it } from 'vitest';
import { parseWahaReceipts, verifyWaha } from '../../supabase/functions/_shared/receipts';

const secret = 'own-test-waha-webhook-secret-1234567890';
const session = 'default', sender = '639171234567@c.us';
const now = Date.now();
const event = { id: 'evt_01aaaaaaaaaaaaaaaaaaaaaaaa', event: 'message.ack', timestamp: now, session, me: { id: sender }, payload: { id: 'true_639181234567@c.us_ABCD1234', fromMe: true, ack: 2, _data: { body: 'never persist chats' } } };
async function headers(body: string) {
  const key = await crypto.subtle.importKey('raw', new TextEncoder().encode(secret), { name: 'HMAC', hash: 'SHA-512' }, false, ['sign']);
  const signature = new Uint8Array(await crypto.subtle.sign('HMAC', key, new TextEncoder().encode(body)));
  return new Headers({ 'X-Webhook-Hmac': Array.from(signature, value => value.toString(16).padStart(2, '0')).join(''), 'X-Webhook-Hmac-Algorithm': 'sha512' });
}
describe('WAHA signed message receipts', () => {
  it('verifies the exact documented SHA512 raw body and rejects unsigned or altered bodies', async () => {
    const body = JSON.stringify(event), signed = await headers(body);
    expect(await verifyWaha(body, signed, secret)).toBe(true);
    expect(await verifyWaha(body + ' ', signed, secret)).toBe(false);
    expect(await verifyWaha(body, signed, 'another-own-private-secret-1234567890')).toBe(false);
    expect(await verifyWaha(body, new Headers(), secret)).toBe(false);
    expect(await verifyWaha(body, signed, undefined)).toBe(false);
    signed.set('X-Webhook-Hmac-Algorithm', 'sha256');
    expect(await verifyWaha(body, signed, secret)).toBe(false);
  });
  it('extracts only sanitized IDs and delivery statuses, with stable IDs on retries', () => {
    const expected = [{ provider: 'waha', eventId: event.id, messageId: event.payload.id, status: 'delivered' }];
    expect(parseWahaReceipts(JSON.stringify(event), session, sender, now)).toEqual(expected);
    expect(parseWahaReceipts(JSON.stringify(event), session, sender, now + 3600000)).toEqual(expected);
  });
  it('requires the configured session and sender even for otherwise valid signed payloads', () => {
    for (const invalid of [{ ...event, session: 'another' }, { ...event, me: { id: '639191234567@c.us' } }, { ...event, me: undefined }]) expect(() => parseWahaReceipts(JSON.stringify(invalid), session, sender, now)).toThrow();
    for (const [configuredSession, configuredSender] of [['', sender], [session, ''], [session, '+639171234567']]) expect(() => parseWahaReceipts(JSON.stringify(event), configuredSession, configuredSender, now)).toThrow();
  });
  it('does not mistake server ACK or pending ACK for delivered', () => {
    for (const ack of [0, 1]) expect(parseWahaReceipts(JSON.stringify({ ...event, payload: { ...event.payload, ack } }), session, sender, now)).toEqual([]);
    for (const [ack, status] of [[-1, 'failed'], [2, 'delivered'], [3, 'read'], [4, 'read']]) expect(parseWahaReceipts(JSON.stringify({ ...event, payload: { ...event.payload, ack } }), session, sender, now)[0].status).toBe(status);
  });
  it('ignores incoming chat events and rejects forged outgoing IDs, groups or invalid ACKs', () => {
    expect(parseWahaReceipts(JSON.stringify({ ...event, event: 'message' }), session, sender, now)).toEqual([]);
    for (const payload of [{ ...event.payload, fromMe: false }, { ...event.payload, id: 'false_639181234567@c.us_ABCD' }, { ...event.payload, id: 'true_123456789@g.us_ABCD' }, { ...event.payload, ack: 5 }, { ...event.payload, ack: '2' }]) expect(() => parseWahaReceipts(JSON.stringify({ ...event, payload }), session, sender, now)).toThrow();
  });
  it('accepts a queued retry within24 hours, rejects stale or future signed event timestamps', () => {
    expect(parseWahaReceipts(JSON.stringify(event), session, sender, now + 23 * 3600000)).toHaveLength(1);
    for (const timestamp of [now - 86400001, now + 300001, String(now), null]) expect(() => parseWahaReceipts(JSON.stringify({ ...event, timestamp }), session, sender, now)).toThrow();
  });
  it('bounds payload bytes and signature size before parsing', async () => {
    const body = 'x'.repeat(262145);
    expect(await verifyWaha(body, await headers(body), secret)).toBe(false);
    expect(() => parseWahaReceipts(body, session, sender, now)).toThrow();
    const signed = await headers('{}'); signed.set('x-webhook-hmac', 'a'.repeat(129));
    expect(await verifyWaha('{}', signed, secret)).toBe(false);
  });
});
