import { createClient } from 'npm:@supabase/supabase-js@2.117.2';
import { secretMatches } from '../_shared/delivery.ts';
import { verifyMeta, verifyResend, verifyWaha, parseWahaReceipts, parseReceipts } from '../_shared/receipts.ts';

Deno.serve(async (request: Request) => {
  const url = new URL(request.url), provider = url.searchParams.get('provider');
  const respond = (body: unknown, status = 200) => Response.json(body, { status, headers: { 'Cache-Control': 'no-store' } });
  if (!['resend', 'whatsapp', 'waha'].includes(provider ?? '')) return respond({ error: 'Unknown provider' }, 400);
  if (request.method === 'GET' && provider === 'whatsapp') {
    const token = Deno.env.get('WHATSAPP_WEBHOOK_VERIFY_TOKEN') ?? '';
    const challenge = url.searchParams.get('hub.challenge');
    if (url.searchParams.get('hub.mode') === 'subscribe' && challenge && challenge.length <= 200 && await secretMatches(url.searchParams.get('hub.verify_token') ?? '', token)) return new Response(challenge, { headers: { 'Content-Type': 'text/plain', 'Cache-Control': 'no-store' } });
    return respond({ error: 'Verification failed' }, 403);
  }
  if (request.method !== 'POST') return respond({ error: 'Method not allowed' }, 405);
  if (Number(request.headers.get('content-length') ?? '0') > 262144) return respond({ error: 'Request too large' }, 413);
  try {
    // Enforce the bound while streaming too, including missing/forged Content-Length.
    const reader = request.body?.getReader();
    const chunks: Uint8Array[] = []; let size = 0;
    if (reader) while (true) {
      const { done, value } = await reader.read(); if (done) break;
      size += value.length;
      if (size > 262144) { await reader.cancel(); return respond({ error: 'Request too large' }, 413); }
      chunks.push(value);
    }
    const bytes = new Uint8Array(size); let offset = 0;
    for (const chunk of chunks) { bytes.set(chunk, offset); offset += chunk.length; }
    const body = new TextDecoder('utf-8', { fatal: true }).decode(bytes);
    if (new TextEncoder().encode(body).length > 262144) return respond({ error: 'Request too large' }, 413);
    const wahaSecret = Deno.env.get('WAHA_WEBHOOK_SECRET'), wahaSession = Deno.env.get('WAHA_SESSION') ?? '', wahaSender = Deno.env.get('WAHA_SENDER_ID') ?? '';
    if (provider === 'waha' && (!wahaSecret || wahaSecret.length < 32 || wahaSecret.length > 4096 || !/^[A-Za-z0-9_-]{1,64}$/.test(wahaSession) || !/^[1-9]\d{7,14}@c\.us$/.test(wahaSender))) return respond({ error: 'Receipt configuration is missing' }, 503);
    const verified = provider === 'waha' ? await verifyWaha(body, request.headers, wahaSecret) : provider === 'whatsapp' ? await verifyMeta(body, request.headers.get('x-hub-signature-256'), Deno.env.get('WHATSAPP_APP_SECRET')) : await verifyResend(body, request.headers, Deno.env.get('RESEND_WEBHOOK_SECRET'));
    if (!verified) return respond({ error: 'Invalid signature' }, 401);
    const receipts = provider === 'waha' ? parseWahaReceipts(body, wahaSession, wahaSender) : parseReceipts(provider!, body, request.headers);
    if (!receipts.length) return respond({ received: true });
    const databaseUrl = Deno.env.get('SUPABASE_URL'), key = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
    if (!databaseUrl || !key) return respond({ error: 'Receipt configuration is missing' }, 503);
    const admin = createClient(databaseUrl, key, { auth: { persistSession: false, autoRefreshToken: false } });
    const { error } = await admin.rpc('record_message_receipts', { p_receipts: receipts.map(receipt => ({ provider: receipt.provider, event_id: receipt.eventId, message_id: receipt.messageId, status: receipt.status })) });
    if (error) return respond({ error: 'Could not record receipt' }, 503);
    return respond({ received: true });
  } catch { return respond({ error: 'Invalid receipt request' }, 400); }
});
