import Link from 'next/link';
import { requireStaff } from '@/lib/auth';
import { pagination, type SearchParams } from '@/lib/data';
import { statusLabel } from '@/lib/domain';
import { messageStatuses, ruleDescriptions } from '@/lib/automation/types';
import { renderDeliveryBody } from '../../../../supabase/functions/_shared/delivery';
import { Heading, Panel, Pages } from '../workspace-ui';
import { CommandForm } from './command-form';
import { configureRule, approveJob, cancelJob, processBatch, processDryRunBatch, retryJob } from './actions';

const date = (value: string) => new Intl.DateTimeFormat('en-US', { dateStyle: 'medium', timeStyle: 'short', timeZone: 'Asia/Manila' }).format(new Date(value));
export default async function Automations({ searchParams }: { searchParams: Promise<SearchParams> }) {
  const filters = await searchParams;
  const { supabase, staff } = await requireStaff();
  const { page, from, to } = pagination(filters);
  let jobQuery = supabase.from('message_jobs').select('*', { count: 'exact' }).order('created_at', { ascending: false }).order('id', { ascending: false }).range(from, to);
  const status = typeof filters.status === 'string' && messageStatuses.includes(filters.status as typeof messageStatuses[number]) ? filters.status : '';
  if (status) jobQuery = jobQuery.eq('status', status);
  const [ruleResult, jobsResult] = await Promise.all([supabase.from('automation_rules').select('*').order('created_at').order('id'), jobQuery]);
  if (ruleResult.error || jobsResult.error) return <><Heading title="Automations"/><div className="notice"><p>The automation tables could not be loaded. Apply the AgencyDesk migrations to your own project before using this screen.</p><Link href="/crm/automations/setup">Connection and setup guide</Link></div></>;
  const rules = ruleResult.data ?? [], jobs = jobsResult.data ?? [];
  const ruleNames = new Map(rules.map(rule => [rule.id, rule.name]));
  return <>
    <Heading title="Automations" description="Review rules, approve messages, and follow delivery outcomes."/>
    <Panel title="Delivery connection">
      <p>Rules start disabled. Approval is required by default. The worker starts in dry-run mode and records simulations without contacting a sending service.</p>
      <p className="info-note">Dry run completes due approved jobs as simulated; it is not a read-only preview. Those jobs will not send later. The dedicated dry-run action refuses live server configuration.</p>
      <p className="info-note">Your worker controls the delivery mode. A live batch sends eligible approved messages through your own connected accounts.</p>
      <div className="form-row"><Link className="button button-secondary" href="/crm/automations/setup">Connect your own account</Link>{staff.role === 'admin' && <><CommandForm action={processDryRunBatch}><button className="button button-secondary" type="submit">Run approved jobs in dry run</button></CommandForm><CommandForm action={processBatch}><button className="button button-primary" type="submit">Process due approved jobs</button></CommandForm></>}</div>
    </Panel>
    <Panel title="Rules"><div className="automation-rules">{rules.map(rule => <section key={rule.id} className="automation-rule">
      <h3>{rule.name}</h3><p className="muted">{ruleDescriptions[rule.template_key]}</p>
      {staff.role === 'admin' ? <CommandForm action={configureRule}>
        <input type="hidden" name="id" value={rule.id}/>
        <div className="form-grid"><label className="field">Send with<select name="provider" defaultValue={rule.provider}><option value="resend">Email · Resend</option><option value="gmail">Email · Gmail</option><option value="whatsapp">WhatsApp · Meta</option><option value="zoko">WhatsApp · Zoko</option><option value="waha">WhatsApp · WAHA (unofficial)</option></select></label><label className="field">Delay in minutes<input name="delay_minutes" type="number" min="0" max="43200" step="1" defaultValue={rule.delay_minutes} required/></label></div>
        <div className="form-row"><label className="checkbox-label"><input name="enabled" type="checkbox" defaultChecked={rule.enabled}/>Enabled</label><label className="checkbox-label"><input name="approval_required" type="checkbox" defaultChecked={rule.approval_required}/>Require staff approval</label></div>
        <button className="button button-secondary" type="submit">Save {rule.name.toLowerCase()}</button>
      </CommandForm> : <p>{rule.enabled ? 'Enabled' : 'Disabled'} · {statusLabel(rule.provider)} · {rule.delay_minutes} minutes · {rule.approval_required ? 'Approval required' : 'Automatic after checks'}</p>}
    </section>)}</div></Panel>
    <Heading title="Message history" description="Publication, provider acceptance, and delivery are different states."/>
    <form className="list-filters"><label className="field">Message status<select name="status" defaultValue={status}><option value="">All statuses</option>{messageStatuses.map(value => <option key={value} value={value}>{statusLabel(value)}</option>)}</select></label><button className="button button-secondary" type="submit">Filter history</button></form>
    <div className="stack">{jobs.map(job => <section className="panel message-record" key={job.id}>
      <div className="panel-heading"><div><h2>{ruleNames.get(job.rule_id) ?? 'Message'}</h2><p>{statusLabel(job.status)} · {statusLabel(job.provider)} · Due {date(job.due_at)}</p></div><Link href={`/crm/leads/${job.lead_id}`}>Open lead</Link></div>
      <div className="record-detail"><p><strong>To:</strong> {job.recipient || 'Destination unavailable'}</p><p><strong>Subject:</strong> {job.subject}</p><details><summary>Preview message and outcome</summary><pre className="message-preview">{renderDeliveryBody(job.body, job.portal_path, process.env.APP_URL, job.channel) ?? `${job.body}\nPortal origin must be configured.`}</pre><p className="muted">{job.attempts} attempts{job.last_error ? ` · ${statusLabel(job.last_error)}` : ''}</p>{job.channel === 'whatsapp' && job.provider !== 'waha' && <p className="muted">Preview shows the body parameter. Your approved template supplies its fixed wording.</p>}{job.provider_message_id && <p className="muted">Provider reference: {job.provider_message_id}</p>}{job.status === 'uncertain' && <p className="notice">The sending result is unknown. Check the provider before trying again; this job will not resend automatically.</p>}{job.status === 'simulated' && <p className="muted">Dry-run result. No message was sent.</p>}</details>
      <div className="form-row">{job.status === 'pending_approval' && <CommandForm action={approveJob}><input type="hidden" name="id" value={job.id}/><button type="submit" className="button button-primary">Approve message</button></CommandForm>}{['pending_approval','queued'].includes(job.status) && <CommandForm action={cancelJob}><input type="hidden" name="id" value={job.id}/><button type="submit" className="button button-secondary">Cancel message</button></CommandForm>}{staff.role === 'admin' && job.status === 'failed' && !job.provider_message_id && job.attempts < 5 && ['email_not_configured','whatsapp_not_configured','whatsapp_template_not_configured','zoko_not_configured','zoko_template_not_configured','waha_not_configured','gmail_not_configured','gmail_authentication_failed','gmail_token_unavailable','message_provider_mismatch','unsupported_whatsapp_provider','portal_origin_not_configured','invalid_delivery_mode','unsupported_email_provider','provider_authentication_failed','provider_rejected','whatsapp_parameter_too_long'].includes(job.last_error ?? '') && <CommandForm action={retryJob}><input type="hidden" name="id" value={job.id}/><button type="submit" className="button button-secondary">Retry after fixing the issue</button></CommandForm>}</div></div>
    </section>)}{!jobs.length && <p className="notice">No messages match these filters. Enable a rule, collect explicit channel permission, and perform its matching CRM event to create a job.</p>}</div>
    <Pages page={page} count={jobsResult.count ?? 0} base="/crm/automations" filters={filters}/>
  </>;
}
