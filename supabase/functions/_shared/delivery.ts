export type DeliveryOutcome = { outcome: 'simulated' | 'accepted' | 'retry' | 'failed' | 'uncertain'; providerMessageId?: string; errorCode?: string; retryAfterSeconds?: number };
export type DeliveryJob = { id: string; channel: string; recipient: string; subject: string; body: string; template_key: string; portal_path?: string | null; provider?: string | null };
export type DeliveryConfig = { mode?: string; emailProvider?: string; resendKey?: string; fromEmail?: string; gmailClientId?: string; gmailClientSecret?: string; gmailRefreshToken?: string; gmailFromEmail?: string; whatsappProvider?: string; whatsappToken?: string; whatsappPhoneId?: string; graphVersion?: string; templateMap?: string; zokoKey?: string; zokoTemplateMap?: string; wahaURL?: string; wahaKey?: string; wahaSession?: string; appURL?: string };
type Template = { name: string; language: string; body_parameters: Array<'body' | 'subject'> };
const failure = (errorCode: string): DeliveryOutcome => ({ outcome: 'failed', errorCode });

export function renderDeliveryBody(body: string, portalPath?: string | null, appURL?: string, channel = 'email'): string | null {
  const format = (value: string) => channel === 'whatsapp' ? value.replace(/\s+/g,' ').trim() : value;
  if (!portalPath) return format(body);
  if (!/^\/portal\/(proposals|projects)\/[0-9a-f-]{36}$/i.test(portalPath) || !appURL) return null;
  try {
    const origin = new URL(appURL);
    if (origin.username || origin.password || origin.search || origin.hash || origin.pathname !== '/') return null;
    if (origin.protocol !== 'https:' && !(origin.protocol === 'http:' && ['localhost','127.0.0.1'].includes(origin.hostname))) return null;
    return format(`${body}\n\n${new URL(portalPath, origin).href}`);
  } catch { return null; }
}

function retryDelay(value: string | null): number | undefined {
  if (!value) return undefined;
  const seconds = /^\d+$/.test(value) ? Number(value) : Math.ceil((Date.parse(value) - Date.now()) / 1000);
  return Number.isFinite(seconds) ? Math.max(1, seconds) : undefined;
}

function templateFor(config: string | undefined, key: string): Template | null {
  try {
    if (!config || config.length > 20000) return null;
    const map = JSON.parse(config);
    if (!map || typeof map !== 'object' || !Object.hasOwn(map, key)) return null;
    const value = map[key];
    if (!value || typeof value.name !== 'string' || typeof value.language !== 'string' || !/^[a-z0-9_]{1,512}$/.test(value.name) || !/^[a-z]{2,3}(?:_[A-Z]{2})?$/.test(value.language)) return null;
    if (!Array.isArray(value.body_parameters) || value.body_parameters.length > 10 || value.body_parameters.some((field: unknown) => field !== 'body' && field !== 'subject')) return null;
    return value as Template;
  } catch { return null; }
}

function utf8Base64(value: string): string {
  return btoa(Array.from(new TextEncoder().encode(value), byte => String.fromCharCode(byte)).join(''));
}

function mimeSubject(subject: string): string {
  const chunks: string[] = [];
  let chunk = '';
  for (const character of subject) {
    if (new TextEncoder().encode(chunk + character).length > 42) { chunks.push(chunk); chunk = ''; }
    chunk += character;
  }
  if (chunk) chunks.push(chunk);
  return chunks.map(value => `=?UTF-8?B?${utf8Base64(value)}?=`).join('\r\n ');
}

async function boundedJSON(response: Response): Promise<Record<string, unknown>> {
  const reader = response.body?.getReader();
  if (!reader) throw new Error('missing_body');
  const chunks: Uint8Array[] = [];
  let size = 0;
  try {
    for (;;) {
      const { done, value } = await reader.read();
      if (done) break;
      size += value.length;
      if (size > 65536) { await reader.cancel(); throw new Error('response_too_large'); }
      chunks.push(value);
    }
  } finally { reader.releaseLock(); }
  const bytes = new Uint8Array(size);
  let offset = 0;
  for (const chunk of chunks) { bytes.set(chunk, offset); offset += chunk.length; }
  const value = JSON.parse(new TextDecoder().decode(bytes));
  if (!value || typeof value !== 'object' || Array.isArray(value)) throw new Error('invalid_response');
  return value;
}

async function deliverGmail(job: DeliveryJob, body: string, config: DeliveryConfig, request: typeof fetch): Promise<DeliveryOutcome> {
  if (job.provider != null && job.provider !== 'gmail') return failure('message_provider_mismatch');
  const credentials = [config.gmailClientId, config.gmailClientSecret, config.gmailRefreshToken];
  if (credentials.some(value => !value || value.length > 4096 || /[\r\n\u0000]/.test(value)) || !config.gmailFromEmail) return failure('gmail_not_configured');
  // A single bare ASCII mailbox only: no display names, address lists, or header injection.
  const mailbox = /^[A-Za-z0-9!#$%&'*+/=?^_`{|}~-]+(?:\.[A-Za-z0-9!#$%&'*+/=?^_`{|}~-]+)*@[A-Za-z0-9](?:[A-Za-z0-9-]*[A-Za-z0-9])?(?:\.[A-Za-z0-9](?:[A-Za-z0-9-]*[A-Za-z0-9])?)+$/;
  if ([job.recipient, config.gmailFromEmail].some(value => value.length > 254 || !mailbox.test(value)) || !job.subject || job.subject.length > 200 || /[\r\n\u0000-\u001f\u007f]/.test(job.subject)) return failure('invalid_email');
  let accessToken: string;
  try {
    const response = await request('https://oauth2.googleapis.com/token', {
      method: 'POST', headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({ client_id: config.gmailClientId!, client_secret: config.gmailClientSecret!, refresh_token: config.gmailRefreshToken!, grant_type: 'refresh_token' }).toString(),
      redirect: 'error', signal: AbortSignal.timeout(10000),
    });
    if (!response.ok) return failure(response.status === 400 || response.status === 401 || response.status === 403 ? 'gmail_authentication_failed' : 'gmail_token_unavailable');
    const token = await boundedJSON(response);
    if (typeof token.access_token !== 'string' || !/^[\x21-\x7e]{1,4096}$/.test(token.access_token) || String(token.token_type).toLowerCase() !== 'bearer') return failure('gmail_token_unavailable');
    accessToken = token.access_token;
  } catch { return failure('gmail_token_unavailable'); } // No message request occurred: safe to correct config and retry.
  const encodedBody = utf8Base64(body.replace(/\r?\n/g, '\r\n')).match(/.{1,76}/g)?.join('\r\n') ?? '';
  const mime = [`From: ${config.gmailFromEmail}`, `To: ${job.recipient}`, `Subject: ${mimeSubject(job.subject)}`, 'MIME-Version: 1.0', 'Content-Type: text/plain; charset=UTF-8', 'Content-Transfer-Encoding: base64', '', encodedBody, ''].join('\r\n');
  const raw = utf8Base64(mime).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
  try {
    const response = await request('https://gmail.googleapis.com/gmail/v1/users/me/messages/send', {
      method: 'POST', headers: { Authorization: `Bearer ${accessToken}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ raw }), redirect: 'error', signal: AbortSignal.timeout(10000),
    });
    // Gmail has no send idempotency key. Ambiguous results must never be blindly resent.
    if (response.status >= 500 || response.status === 408) return { outcome: 'uncertain', errorCode: 'provider_result_unknown' };
    if (response.status === 429) { const delay = retryDelay(response.headers.get('retry-after')); return delay !== undefined && delay > 86400 ? { outcome: 'uncertain', errorCode: 'provider_retry_window_exceeded' } : { outcome: 'retry', errorCode: 'provider_rate_limited', retryAfterSeconds: delay }; }
    if (!response.ok) return failure(response.status === 401 || response.status === 403 ? 'provider_authentication_failed' : 'provider_rejected');
    const data = await boundedJSON(response);
    if (typeof data.id !== 'string' || !/^[A-Za-z0-9_-]{1,300}$/.test(data.id)) return { outcome: 'uncertain', errorCode: 'provider_acknowledgment_invalid' };
    return { outcome: 'accepted', providerMessageId: data.id };
  } catch { return { outcome: 'uncertain', errorCode: 'network_result_unknown' }; }
}

export async function deliverMessage(job: DeliveryJob, config: DeliveryConfig, request: typeof fetch = fetch): Promise<DeliveryOutcome> {
  // No missing or misspelled mode can accidentally enable live delivery.
  if (!config.mode || config.mode === 'dry_run') return { outcome: 'simulated' };
  if (config.mode !== 'live') return failure('invalid_delivery_mode');
  if (!job.body || job.body.length > 10000 || !job.recipient || !/^[0-9a-f-]{36}$/i.test(job.id)) return failure('invalid_message');
  const body = renderDeliveryBody(job.body, job.portal_path, config.appURL, job.channel);
  if (body === null || (job.portal_path && !config.appURL?.startsWith('https://'))) return failure('portal_origin_not_configured');
  let url: string;
  let headers: Record<string, string>;
  let payload: Record<string, unknown>;
  if (job.channel === 'email') {
    if (config.emailProvider === 'gmail') return deliverGmail(job, body, config, request);
    if ((config.emailProvider ?? 'resend') !== 'resend') return failure('unsupported_email_provider');
    if (!config.resendKey || !config.fromEmail) return failure('email_not_configured');
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(job.recipient) || /[\r\n]/.test(config.fromEmail) || job.subject.length > 200) return failure('invalid_email');
    url = 'https://api.resend.com/emails';
    headers = { Authorization: `Bearer ${config.resendKey}`, 'Content-Type': 'application/json', 'Idempotency-Key': `agencydesk/message/${job.id}` };
    payload = { from: config.fromEmail, to: [job.recipient], subject: job.subject, text: body, tags: [{ name: 'agencydesk_job_id', value: job.id }] };
  } else if (job.channel === 'whatsapp') {
    const provider = config.whatsappProvider ?? 'meta';
    if (provider !== 'meta' && provider !== 'zoko' && provider !== 'waha') return failure('unsupported_whatsapp_provider');
    if (!/^\+[1-9]\d{7,14}$/.test(job.recipient)) return failure('invalid_phone');
    if (provider === 'waha') {
      // The origin is operator configuration, never a lead-controlled URL. Hosted delivery
      // requires HTTPS; a localhost-only Docker instance cannot be reached from an Edge Function.
      if (!config.wahaKey || config.wahaKey.length < 32 || config.wahaKey.length > 4096 || /[^\x21-\x7e]/.test(config.wahaKey) || !/^[A-Za-z0-9_-]{1,64}$/.test(config.wahaSession ?? '')) return failure('waha_not_configured');
      try {
        const origin = new URL(config.wahaURL ?? '');
        if (origin.protocol !== 'https:' || origin.username || origin.password || origin.pathname !== '/' || origin.search || origin.hash) return failure('waha_not_configured');
        url = new URL('/api/sendText', origin).href;
      } catch { return failure('waha_not_configured'); }
      headers = { 'X-Api-Key': config.wahaKey, 'Content-Type': 'application/json' };
      // WAHA MessageTextRequest: no generated message ID or idempotency guarantee is assumed.
      payload = { session: config.wahaSession, chatId: `${job.recipient.slice(1)}@c.us`, text: body, linkPreview: false };
    } else {
      if (provider === 'zoko' ? !config.zokoKey || /[\r\n]/.test(config.zokoKey) : !config.whatsappToken || !/^\d{5,30}$/.test(config.whatsappPhoneId ?? '') || !/^v\d+\.\d+$/.test(config.graphVersion ?? '')) return failure('whatsapp_not_configured');
      const template = templateFor(provider === 'zoko' ? config.zokoTemplateMap : config.templateMap, job.template_key);
      if (!template) return failure('whatsapp_template_not_configured');
      const parameters = template.body_parameters.map(field => (field === 'body' ? body : job.subject).replace(/\s+/g,' ').trim());
      if (parameters.some(value => !value || value.length > 1024)) return failure('whatsapp_parameter_too_long');
      if (provider === 'zoko') {
        url = 'https://chat.zoko.io/v2/message';
        headers = { apikey: config.zokoKey!, 'Content-Type': 'application/json' };
        payload = { channel: 'whatsapp', recipient: job.recipient.slice(1), type: 'template', templateId: template.name, templateLanguage: template.language, templateArgs: parameters };
      } else {
        url = `https://graph.facebook.com/${config.graphVersion}/${config.whatsappPhoneId}/messages`;
        headers = { Authorization: `Bearer ${config.whatsappToken}`, 'Content-Type': 'application/json' };
        payload = { messaging_product: 'whatsapp', to: job.recipient.slice(1), type: 'template', template: { name: template.name, language: { code: template.language }, components: parameters.length ? [{ type: 'body', parameters: parameters.map(text => ({ type: 'text', text })) }] : [] } };
      }
    }
  } else return failure('unsupported_channel');
  // The queue freezes the provider. Changing configuration must never reroute a queued job.
  const provider = job.channel === 'email' ? 'resend' : config.whatsappProvider === 'waha' ? 'waha' : config.whatsappProvider === 'zoko' ? 'zoko' : 'whatsapp';
  if (job.provider !== undefined && job.provider !== null && job.provider !== provider) return failure('message_provider_mismatch');
  try {
    const response = await request(url, { method: 'POST', headers, body: JSON.stringify(payload), signal: AbortSignal.timeout(10000), redirect: 'error' });
    if (response.status === 429) { const delay = retryDelay(response.headers.get('retry-after')); return delay !== undefined && delay > 86400 ? { outcome: 'uncertain', errorCode: 'provider_retry_window_exceeded' } : { outcome: 'retry', errorCode: 'provider_rate_limited', retryAfterSeconds: delay }; }
    // A server failure can occur after acceptance; review instead of blind resends.
    if (response.status >= 500 || response.status === 408) return { outcome: 'uncertain', errorCode: 'provider_result_unknown' };
    if (!response.ok) return failure(response.status === 401 || response.status === 403 ? 'provider_authentication_failed' : 'provider_rejected');
    const raw = await response.text();
    if (raw.length > 65536) return { outcome: 'uncertain', errorCode: 'provider_acknowledgment_invalid' };
    const data = JSON.parse(raw);
    if (provider === 'waha') {
      // WAHA WAMessage is acceptance only. A negative/missing ACK is not proof
      // that a resend is safe, and incoming/foreign message objects are not send ACKs.
      // WEBJS sendText returns its native Message with id._serialized; the
      // WAMessage response used by other engines exposes the same ID as a string.
      const id = typeof data?.id === 'string' ? data.id : data?.id?._serialized;
      if (typeof id !== 'string' || id.length > 300 || !/^true_[1-9]\d{7,19}@(c\.us|lid)_[A-Za-z0-9_-]{1,200}$/.test(id) || data.fromMe !== true || !Number.isInteger(data.ack) || data.ack < 0 || data.ack > 4) return { outcome: 'uncertain', errorCode: 'provider_acknowledgment_invalid' };
      return { outcome: 'accepted', providerMessageId: id };
    }
    const zoko = job.channel === 'whatsapp' && config.whatsappProvider === 'zoko';
    // Zoko's response body has its own status. Never infer acceptance from HTTP alone.
    if (zoko && !['200', '201', '202'].includes(String(data.status))) return { outcome: 'uncertain', errorCode: 'provider_acknowledgment_invalid' };
    const id = job.channel === 'email' ? data.id : zoko ? data.messageId : data.messages?.[0]?.id;
    if (typeof id !== 'string' || id.length < 1 || id.length > 300) return { outcome: 'uncertain', errorCode: 'provider_acknowledgment_missing' };
    if (zoko && !/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id)) return { outcome: 'uncertain', errorCode: 'provider_acknowledgment_invalid' };
    return { outcome: 'accepted', providerMessageId: id };
  } catch { return { outcome: 'uncertain', errorCode: 'network_result_unknown' }; }
}

export async function secretMatches(actual: string, expected: string): Promise<boolean> {
  if (!expected || expected.length < 32 || actual.length > 4096) return false;
  const encode = (value: string) => new TextEncoder().encode(value);
  const [a, b] = await Promise.all([crypto.subtle.digest('SHA-256', encode(actual)), crypto.subtle.digest('SHA-256', encode(expected))]);
  const left = new Uint8Array(a), right = new Uint8Array(b);
  let mismatch = 0;
  for (let i = 0; i < left.length; i++) mismatch |= left[i] ^ right[i];
  return mismatch === 0;
}
