export const inquiryLimit = 16000;
export class InquiryError extends Error {
  constructor(message: string, public status = 400) { super(message); }
}
export function parseInquiry(value: unknown, allowedServices: readonly string[]) {
  if (!value || typeof value !== 'object' || Array.isArray(value)) throw new InquiryError('Invalid inquiry');
  const body = value as Record<string, unknown>;
  const required = (key: string) => {
    if (typeof body[key] !== 'string') throw new InquiryError('Invalid inquiry');
    return body[key].trim();
  };
  const contact_name = required('contact_name'), email = required('email').toLowerCase();
  const service = required('service'), brief = required('brief');
  const budget_cents = body.budget_cents;
  if (!contact_name || contact_name.length > 100 || email.length > 254 || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)
    || !allowedServices.includes(service) || brief.length < 20 || brief.length > 4000
    || typeof budget_cents !== 'number' || !Number.isSafeInteger(budget_cents) || budget_cents < 10000 || budget_cents > 100000000
    || (body.website !== undefined && body.website !== '')) throw new InquiryError('Invalid inquiry');
  if (body.phone !== undefined && body.phone !== null && typeof body.phone !== 'string') throw new InquiryError('Invalid channel preferences');
  const phone = typeof body.phone === 'string' && body.phone.trim() ? body.phone.trim() : null;
  if ((phone !== null && !/^\+[1-9]\d{7,14}$/.test(phone))
    || (body.email_opt_in !== undefined && typeof body.email_opt_in !== 'boolean')
    || (body.whatsapp_opt_in !== undefined && typeof body.whatsapp_opt_in !== 'boolean')
    || (body.whatsapp_opt_in === true && !phone)) throw new InquiryError('Invalid channel preferences');
  const source = body.intake_source ?? 'website';
  if (source !== 'website' && source !== 'website_chatbot') throw new InquiryError('Invalid inquiry source');
  if (body.submission_id !== undefined && (typeof body.submission_id !== 'string'
    || !/^[a-f0-9]{8}-[a-f0-9]{4}-[1-8][a-f0-9]{3}-[89ab][a-f0-9]{3}-[a-f0-9]{12}$/i.test(body.submission_id))) throw new InquiryError('Invalid submission');
  return { contact_name, email, service, brief, budget_cents, phone,
    email_opt_in: body.email_opt_in === true, whatsapp_opt_in: body.whatsapp_opt_in === true,
    intake_source: source, submission_id: body.submission_id as string | undefined };
}

// Bound the streamed body too: Content-Length is optional and cannot be trusted.
export async function readInquiry(request: Request): Promise<unknown> {
  if (Number(request.headers.get('content-length')) > inquiryLimit) throw new InquiryError('Inquiry is too large', 413);
  if (!request.body) throw new InquiryError('Provide a valid inquiry');
  const reader = request.body.getReader();
  const chunks: Uint8Array[] = []; let length = 0;
  try {
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      length += value.byteLength;
      if (length > inquiryLimit) { await reader.cancel(); throw new InquiryError('Inquiry is too large', 413); }
      chunks.push(value);
    }
  } finally { reader.releaseLock(); }
  const bytes = new Uint8Array(length); let offset = 0;
  for (const chunk of chunks) { bytes.set(chunk, offset); offset += chunk.byteLength; }
  try { return JSON.parse(new TextDecoder('utf-8', { fatal: true }).decode(bytes)); }
  catch { throw new InquiryError('Provide a valid inquiry'); }
}

export async function inquiryHash(value: string) {
  const digest = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(value));
  return Array.from(new Uint8Array(digest), byte => byte.toString(16).padStart(2, '0')).join('');
}
