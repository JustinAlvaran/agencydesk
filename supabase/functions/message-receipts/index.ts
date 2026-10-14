import { createClient } from 'npm:@supabase/supabase-js@2.117.2';
import { secretMatches } from '../_shared/delivery.ts';
import { verifyMeta, verifyResend, parseReceipts } from '../_shared/receipts.ts';

Deno.serve(async (request: Request) => {
  const url = new URL(request.url), provider = url.searchParams.get('provider');
  const respond = (body: unknown, status = 200) => Response.json(body, { status, headers: { 'Cache-Control': 'no-store' } });
  if (!['resend', 'whatsapp'].includes(provider ?? '')) return respond({ error: 'Unknown provider' }, 400);
  if (request.method === 'GET' && provider === 'whatsapp') {
    const token = Deno.env.get('WHATSAPP_WEBHOOK_VERIFY_TOKEN') ?? '';
    const challenge = url.searchParams.get('hub.challenge');
    if (url.searchParams.get('hub.mode') === 'subscribe' && challenge && challenge.length <= 200 && await secretMatches(url.searchParams.get('hub.verify_token') ?? '', token)) return new Response(challenge, { headers: { 'Content-Type': 'text/plain', 'Cache-Control': 'no-store' } });
    return respond({ error: 'Verification failed' }, 403);
  }
  if (request.method !== 'POST') return respond({ error: 'Method not allowed' }, 405);
  if (Number(request.headers.get('content-length') ?? '0') > 262144) return respond({ error: 'Request too large' }, 413);
  try {
    const body = await request.text();
    if (new TextEncoder().encode(body).length > 262144) return respond({ error: 'Request too large' }, 413);
    const verified = provider === 'whatsapp' ? await verifyMeta(body, request.headers.get('x-hub-signature-256'), Deno.env.get('WHATSAPP_APP_SECRET')) : await verifyResend(body, request.headers, Deno.env.get('RESEND_WEBHOOK_SECRET'));
    if (!verified) return respond({ error: 'Invalid signature' }, 401);
    const databaseUrl = Deno.env.get('SUPABASE_URL'), key = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
    if (!databaseUrl || !key) return respond({ error: 'Receipt configuration is missing' }, 503);
    const admin = createClient(databaseUrl, key, { auth: { persistSession: false, autoRefreshToken: false } });
    const receipts = parseReceipts(provider!, body, request.headers);
    const { error } = await admin.rpc('record_message_receipts', { p_receipts: receipts.map(receipt => ({ provider: receipt.provider, event_id: receipt.eventId, message_id: receipt.messageId, status: receipt.status })) });
    if (error) return respond({ error: 'Could not record receipt' }, 503);
    return respond({ received: true });
  } catch { return respond({ error: 'Invalid receipt request' }, 400); }
});
