'use client';
import Link from 'next/link';
import { useState } from 'react';
import { deliverMessage, renderDeliveryBody } from '../../supabase/functions/_shared/delivery';
const sampleId = '30000000-0000-4000-8000-000000000001';
const samples = {
  inquiry_acknowledgment: { title: 'Inquiry acknowledgment', subject: 'We received your inquiry', body: 'Thank you for your project inquiry. Our team will review your brief and follow up.', path: null },
  proposal_notice: { title: 'Proposal notice', subject: 'Your proposal is ready', body: 'Your proposal is available in the client portal. Please review the scope and pricing.', path: `/portal/proposals/${sampleId}` },
  proposal_follow_up: { title: 'Proposal follow-up', subject: 'A reminder about your proposal', body: 'Your proposal is still awaiting a decision. Please review it before it expires.', path: `/portal/proposals/${sampleId}` },
  proposal_accepted: { title: 'Accepted proposal confirmation', subject: 'Your project is confirmed', body: 'Your proposal was accepted and your project is ready in the client portal.', path: `/portal/projects/${sampleId}` },
} as const;
type Key = keyof typeof samples;
export function DemoAutomation() {
  const [key, setKey] = useState<Key>('proposal_follow_up');
  const [consent, setConsent] = useState(true);
  const [state, setState] = useState('published');
  const [result, setResult] = useState('');
  const [busy, setBusy] = useState(false);
  const sample = samples[key];
  async function simulate() {
    setBusy(true);
    if (!consent) setResult('Skipped: channel permission is missing.');
    else if (key === 'proposal_follow_up' && state !== 'published') setResult(`Skipped: the proposal is ${state}.`);
    else {
      const outcome = await deliverMessage({ id: sampleId, channel: 'email', recipient: 'client@example.test', subject: sample.subject, body: sample.body, template_key: key, portal_path: sample.path }, { mode: 'dry_run' });
      setResult(outcome.outcome === 'simulated' ? 'Simulated. No message was sent and no CRM record was changed.' : 'Preview could not be completed.');
    }
    setBusy(false);
  }
  return <>
    <div className="page-heading"><div><h1>Automations</h1><p className="muted">Explore a fictional message preview and the conditions that stop a reminder.</p></div><Link className="button button-secondary" href="/demo/automations/setup">Own-account setup guide</Link></div>
    <div className="notice"><p>This is a local sample preview. Live rules start disabled and require approval by default. No sending account is connected to this demo.</p></div>
    <div className="automation-demo-grid">
      <section className="panel record-detail"><h2>Preview a rule</h2><div className="form-stack">
        <label className="field">Rule<select value={key} onChange={event => { setKey(event.target.value as Key); setResult(''); }}>{Object.entries(samples).map(([value, item]) => <option value={value} key={value}>{item.title}</option>)}</select></label>
        <label className="checkbox-label"><input type="checkbox" checked={consent} onChange={event => { setConsent(event.target.checked); setResult(''); }}/>Recipient has permitted email updates</label>
        {key === 'proposal_follow_up' && <label className="field">Current proposal state<select value={state} onChange={event => { setState(event.target.value); setResult(''); }}><option value="published">Awaiting a decision</option><option value="accepted">Accepted</option><option value="declined">Declined</option><option value="superseded">Superseded</option><option value="expired">Expired</option></select></label>}
        <button type="button" className="button button-primary" disabled={busy} onClick={simulate}>Run sample dry run</button>
        <p role="status" aria-live="polite">{result}</p>
      </div></section>
      <section className="panel record-detail"><h2>Message preview</h2><p><strong>To:</strong> client@example.test</p><p><strong>Subject:</strong> {sample.subject}</p><pre className="message-preview">{renderDeliveryBody(sample.body, sample.path, 'https://agency.example.test')}</pre><p className="muted">Scheduled from the confirmed CRM event. Follow-ups stop when the proposal is no longer awaiting a decision.</p></section>
    </div>
    <section className="panel record-detail"><h2>What the live workflow does</h2><ol className="automation-steps"><li>Creates the message job with the CRM event.</li><li>Waits for its due time and any required staff approval.</li><li>Rechecks current permission, contact details, membership, and proposal state.</li><li>Claims the job with a lease and processes it through your own sending account.</li><li>Records provider acceptance separately from delivery callbacks. Uncertain sends require review.</li></ol></section>
  </>;
}
