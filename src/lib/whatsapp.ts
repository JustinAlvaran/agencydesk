export type WhatsAppDraftPurpose = 'reply' | 'follow_up' | 'summary';

export function reviewedWhatsAppLink(phone: string | null | undefined, draft: string, permitted: boolean, purpose: WhatsAppDraftPurpose = 'reply'): string | null {
  // Staff summaries are internal context, never a customer-message handoff.
  if (!['reply', 'follow_up'].includes(purpose) || !permitted || !phone || !/^\+[1-9]\d{7,14}$/.test(phone) || !draft.trim() || draft.length > 2500) return null;
  const url = new URL(`https://wa.me/${phone.slice(1)}`);
  url.searchParams.set('text', draft.trim());
  return url.href;
}
