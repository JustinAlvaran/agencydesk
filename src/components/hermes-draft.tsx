'use client';

import { useState } from 'react';
import { requestHermesDraft, type DraftResult } from '@/app/crm/hermes-actions';
import { reviewedWhatsAppLink, type WhatsAppDraftPurpose } from '@/lib/whatsapp';

export function HermesDraft({ leadId, phone, whatsappPermitted }: { leadId: string; phone?: string | null; whatsappPermitted: boolean }) {
  const [pending, setPending] = useState(false);
  const [result, setResult] = useState<DraftResult | null>(null);
  const [reviewed, setReviewed] = useState(false);
  const [purpose, setPurpose] = useState<WhatsAppDraftPurpose>('follow_up');
  const [draft, setDraft] = useState('');
  const isSummary = purpose === 'summary';
  const whatsappLink = reviewed ? reviewedWhatsAppLink(phone, draft, whatsappPermitted, purpose) : null;
  async function generate(form: FormData) {
    setPending(true); setResult(null); setReviewed(false);
    try {
      const response = await requestHermesDraft(form);
      setResult(response);
      if (response.ok) { setDraft(response.draft); setPurpose(response.purpose); }
    }
    catch { setResult({ ok: false, message: 'Could not create a Hermes draft. You can still write one yourself below.' }); }
    finally { setPending(false); }
  }
  return <>
    <p className="muted">Write a draft yourself, or ask Hermes for a suggestion from this lead&apos;s service and brief. Creating a draft does not save or send a message.</p>
    <form action={generate}>
      <fieldset className="command-fields" disabled={pending}>
        <input type="hidden" name="lead_id" value={leadId}/>
        <label className="field">Draft purpose<select name="purpose" value={purpose} onChange={event => { setPurpose(event.target.value as WhatsAppDraftPurpose); setDraft(''); setReviewed(false); setResult(null); }}><option value="reply">Initial reply</option><option value="follow_up">Follow-up</option><option value="summary">Staff summary</option></select></label>
        <button className="button button-secondary" type="submit">{pending ? 'Creating draft…' : 'Create Hermes draft'}</button>
      </fieldset>
    </form>
    <p role="status" aria-live="polite" className={result?.ok === false ? 'error-text' : 'muted'}>{pending ? 'Waiting for Hermes…' : result?.message}</p>
    <label className="field">{isSummary ? 'Internal staff summary' : 'Message draft for review'}<textarea rows={8} maxLength={2500} value={draft} disabled={pending} placeholder={isSummary ? 'Write notes for your team.' : 'Write your own reply or follow-up here.'} onChange={event => { setDraft(event.target.value); setReviewed(false); }}/></label>
      {isSummary ? <p className="muted">This summary is for your team. It cannot be opened as a customer WhatsApp message.</p> : whatsappPermitted && phone ? <>
        <label className="checkbox-label"><input type="checkbox" checked={reviewed} onChange={event => setReviewed(event.target.checked)}/>I have reviewed this draft</label>
        {whatsappLink ? <a href={whatsappLink} target="_blank" rel="noopener noreferrer" className="button button-secondary">Open reviewed draft in WhatsApp</a> : null}
        <p className="muted">WhatsApp opens with the text prepared. You choose when to send it in your app. No API account or AI service is needed for a manual draft.</p>
      </> : <p className="muted">A valid phone and WhatsApp permission are needed to open a customer message.</p>}
  </>;
}
