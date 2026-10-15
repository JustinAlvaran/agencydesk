export type Receipt = { provider: 'resend' | 'whatsapp' | 'waha'; eventId: string; messageId: string; status: 'delivered' | 'read' | 'failed' };
function bytes(value: string): Uint8Array { return Uint8Array.from(atob(value), char => char.charCodeAt(0)); }
async function hmac(body: string, secret: Uint8Array): Promise<Uint8Array> {
  const key = await crypto.subtle.importKey('raw', secret as BufferSource, { name: 'HMAC', hash: 'SHA-256' }, false, ['sign']);
  return new Uint8Array(await crypto.subtle.sign('HMAC', key, new TextEncoder().encode(body)));
}
function equal(a: Uint8Array, b: Uint8Array): boolean {
  if (a.length !== b.length) return false;
  let mismatch = 0;
  for (let i = 0; i < a.length; i++) mismatch |= a[i] ^ b[i];
  return mismatch === 0;
}
export async function verifyMeta(body: string, signature: string | null, secret: string | undefined): Promise<boolean> {
  if (!secret || !signature || !/^sha256=[a-f0-9]{64}$/.test(signature)) return false;
  const expected = await hmac(body, new TextEncoder().encode(secret));
  const received = Uint8Array.from(signature.slice(7).match(/../g)!, pair => parseInt(pair, 16));
  return equal(expected, received);
}
export async function verifyResend(body: string, headers: Headers, secret: string | undefined, now = Date.now()): Promise<boolean> {
  const id = headers.get('svix-id'), timestamp = headers.get('svix-timestamp'), signature = headers.get('svix-signature');
  if (!id || id.length > 300 || !timestamp || !/^\d+$/.test(timestamp) || !signature || signature.length > 4096 || !secret?.startsWith('whsec_')) return false;
  if (Math.abs(now / 1000 - Number(timestamp)) > 300) return false;
  try {
    const expected = await hmac(`${id}.${timestamp}.${body}`, bytes(secret.slice(6)));
    return signature.split(/\s+/).some(value => { const [version, data] = value.split(','); try { return version === 'v1' && equal(expected, bytes(data)); } catch { return false; } });
  } catch { return false; }
}
export async function verifyWaha(body: string, headers: Headers, secret: string | undefined): Promise<boolean> {
  const signature = headers.get('x-webhook-hmac');
  if (!secret || secret.length < 32 || secret.length > 4096 || headers.get('x-webhook-hmac-algorithm') !== 'sha512' || !signature || !/^[a-f0-9]{128}$/.test(signature) || new TextEncoder().encode(body).length > 262144) return false;
  try {
    // WAHA WebhookPlugin.sender signs the exact UTF-8 JSON body with SHA-512 hex.
    const key = await crypto.subtle.importKey('raw', new TextEncoder().encode(secret), { name: 'HMAC', hash: 'SHA-512' }, false, ['sign']);
    const expected = new Uint8Array(await crypto.subtle.sign('HMAC', key, new TextEncoder().encode(body)));
    return equal(expected, Uint8Array.from(signature.match(/../g)!, pair => parseInt(pair, 16)));
  } catch { return false; }
}
export function parseWahaReceipts(body: string, session: string, sender: string, now = Date.now()): Receipt[] {
  if (!/^[A-Za-z0-9_-]{1,64}$/.test(session) || !/^[1-9]\d{7,14}@c\.us$/.test(sender) || new TextEncoder().encode(body).length > 262144) throw new Error('Invalid WAHA receipt scope');
  const data = JSON.parse(body);
  if (!data || data.session !== session || data.me?.id !== sender) throw new Error('Invalid WAHA receipt scope');
  // The timestamp is covered by HMAC. Allow queued retries for 24 hours, with
  // five minutes of clock skew; the database deduplicates durable event IDs.
  if (!Number.isSafeInteger(data.timestamp) || data.timestamp < now - 86400000 || data.timestamp > now + 300000) throw new Error('Invalid WAHA receipt timestamp');
  if (data.event !== 'message.ack') return [];
  const payload = data.payload;
  if (typeof data.id !== 'string' || !/^evt_[a-z0-9]{26}$/.test(data.id) || !payload || payload.fromMe !== true || typeof payload.id !== 'string' || payload.id.length > 300 || !/^true_[1-9]\d{7,19}@(c\.us|lid)_[A-Za-z0-9_-]{1,200}$/.test(payload.id) || !Number.isInteger(payload.ack) || payload.ack < -1 || payload.ack > 4) throw new Error('Invalid WAHA receipt payload');
  const status = payload.ack === -1 ? 'failed' : payload.ack === 2 ? 'delivered' : payload.ack === 3 || payload.ack === 4 ? 'read' : null;
  return status ? [{ provider: 'waha', eventId: data.id, messageId: payload.id, status }] : [];
}
export function parseReceipts(provider: string, body: string, headers = new Headers()): Receipt[] {
  const result: Receipt[] = [];
  const data = JSON.parse(body);
  const safeId = (value: unknown): value is string => typeof value === 'string' && value.length > 0 && value.length <= 300;
  if (provider === 'resend') {
    const status = data.type === 'email.delivered' ? 'delivered' : ['email.bounced', 'email.failed', 'email.complained'].includes(data.type) ? 'failed' : null;
    const id = headers.get('svix-id');
    if (status && safeId(id) && safeId(data.data?.email_id)) result.push({ provider, eventId: id, messageId: data.data.email_id, status });
  } else if (provider === 'whatsapp') {
    if (data.object !== 'whatsapp_business_account' || !Array.isArray(data.entry)) return result;
    for (const entry of data.entry) for (const change of (entry.changes ?? [])) for (const item of (change.value?.statuses ?? [])) {
      if (safeId(item.id) && ['delivered', 'read', 'failed'].includes(item.status) && /^\d{1,20}$/.test(String(item.timestamp))) result.push({ provider, eventId: `${item.id}:${item.status}:${item.timestamp}`.slice(0, 400), messageId: item.id, status: item.status });
    }
  }
  return result;
}
