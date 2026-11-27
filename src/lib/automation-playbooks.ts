import type { Lead, LeadStatus } from '@/types/crm';

export type PlaybookTemplateKey =
  | 'inquiry_acknowledgment'
  | 'discovery_followup'
  | 'proposal_notice'
  | 'proposal_follow_up'
  | 'proposal_accepted';

export type AutomationChannel = 'email' | 'whatsapp';
export type AutomationProvider = 'resend' | 'gmail' | 'whatsapp' | 'waha' | 'zoko';

export type OutboxJobStatus =
  | 'pending_approval'
  | 'queued'
  | 'processing'
  | 'simulated'
  | 'accepted'
  | 'delivered'
  | 'read'
  | 'failed'
  | 'uncertain'
  | 'skipped'
  | 'cancelled';

export interface PlaybookDefinition {
  template_key: PlaybookTemplateKey;
  order: number;
  name: string;
  short_label: string;
  stage_trigger: LeadStatus;
  event_type: 'inquiry_received' | 'lead_stage_changed' | 'proposal_published' | 'proposal_accepted';
  description: string;
  default_channel: AutomationChannel;
  default_provider: AutomationProvider;
  default_delay_minutes: number;
  default_approval_required: boolean;
  db_backed: boolean;
  free_stack_tools: string[];
}

export interface PlaybookRuleView {
  id: string;
  template_key: PlaybookTemplateKey;
  order: number;
  name: string;
  short_label: string;
  stage_trigger: LeadStatus;
  event_type: 'inquiry_received' | 'lead_stage_changed' | 'proposal_published' | 'proposal_accepted';
  description: string;
  channel: AutomationChannel;
  provider: AutomationProvider;
  delay_minutes: number;
  approval_required: boolean;
  enabled: boolean;
  db_backed: boolean;
  free_stack_tools: string[];
  stats: {
    pending_approval: number;
    queued: number;
    delivered: number;
    total: number;
  };
}

export interface PlaybooksGetResponse {
  mode: 'live' | 'demo';
  playbooks: PlaybookRuleView[];
  stats: {
    total_rules: number;
    enabled_rules: number;
    pending_approval: number;
    queued: number;
    delivered: number;
    skipped: number;
    failed: number;
  };
}

export interface PlaybooksPatchRequest {
  rule_id?: string;
  template_key?: PlaybookTemplateKey;
  enabled?: boolean;
  approval_required?: boolean;
  delay_minutes?: number;
  channel?: AutomationChannel;
  provider?: AutomationProvider;
}

export interface PlaybooksPatchResponse {
  success: true;
  mode: 'live' | 'demo';
  rule: PlaybookRuleView;
}

export interface PlaybooksPostRequest {
  lead_id: string;
  template_key: PlaybookTemplateKey;
  channel?: AutomationChannel;
  subject?: string;
  body?: string;
}

export interface OutboxJobView {
  id: string;
  rule_id: string | null;
  template_key: PlaybookTemplateKey | string;
  rule_name: string;
  lead_id: string;
  lead_name: string;
  lead_company: string;
  lead_email: string;
  lead_phone: string | null;
  lead_status: LeadStatus | string;
  channel: AutomationChannel;
  provider: AutomationProvider | 'manual';
  recipient: string;
  subject: string;
  body: string;
  portal_path: string | null;
  status: OutboxJobStatus;
  due_at: string;
  attempts: number;
  last_error: string | null;
  approved_by: string | null;
  approved_at: string | null;
  created_at: string;
  updated_at: string;
  consent_ok: boolean;
  wa_me_url: string | null;
  mailto_url: string | null;
  source: 'message_jobs' | 'activity_events' | 'demo';
}

export interface PlaybooksPostResponse {
  success: true;
  mode: 'live' | 'demo';
  job: OutboxJobView;
  consent_warning: string | null;
}

export interface OutboxEventView {
  id: string;
  event_type: string;
  state: string;
  lead_id: string | null;
  lead_name: string | null;
  summary: string;
  created_at: string;
  completed_at: string | null;
}

export interface OutboxGetResponse {
  mode: 'live' | 'demo';
  jobs: OutboxJobView[];
  events: OutboxEventView[];
  summary: {
    pending_approval: number;
    queued: number;
    delivered: number;
    failed: number;
    skipped: number;
    cancelled: number;
    total: number;
  };
}

export interface OutboxPostRequest {
  job_id: string;
  action: 'approve' | 'cancel' | 'mark_sent_manual';
  note?: string;
}

export interface OutboxPostResponse {
  success: boolean;
  mode: 'live' | 'demo';
  action: 'approve' | 'cancel' | 'mark_sent_manual';
  status: OutboxJobStatus;
  dispatched_to_n8n: boolean;
  reason?: string | null;
  job?: OutboxJobView;
}

export interface NextActionRecommendation {
  template_key: PlaybookTemplateKey;
  label: string;
  description: string;
  channel: 'WhatsApp' | 'Email' | 'Call';
  channel_key: AutomationChannel;
  priority: 'high' | 'medium' | 'low';
  subject: string;
  draft_message: string;
  wa_me_url: string | null;
  mailto_url: string | null;
  consent_ready: boolean;
}

export interface StagePatchResponse {
  success: true;
  mode?: 'live' | 'demo';
  lead: Lead;
  next_action: NextActionRecommendation;
}

export const PLAYBOOK_DEFINITIONS: readonly PlaybookDefinition[] = [
  {
    template_key: 'inquiry_acknowledgment',
    order: 1,
    name: 'Inquiry Acknowledgment & Owner Alert',
    short_label: 'New Inquiry',
    stage_trigger: 'new',
    event_type: 'inquiry_received',
    description:
      'Syncs new inquiry to Google Sheets, alerts the agency owner via WhatsApp, and prepares a client welcome draft.',
    default_channel: 'whatsapp',
    default_provider: 'whatsapp',
    default_delay_minutes: 0,
    default_approval_required: true,
    db_backed: true,
    free_stack_tools: ['AgencyDesk CRM', 'n8n', 'Google Sheets', 'WhatsApp', 'Gmail'],
  },
  {
    template_key: 'discovery_followup',
    order: 2,
    name: '24h Discovery Call Follow-Up',
    short_label: 'Contacted',
    stage_trigger: 'contacted',
    event_type: 'lead_stage_changed',
    description:
      'Prepares a 24-hour discovery call recap & scheduling follow-up draft once a lead moves to Contacted.',
    default_channel: 'email',
    default_provider: 'gmail',
    default_delay_minutes: 1440,
    default_approval_required: true,
    db_backed: false,
    free_stack_tools: ['AgencyDesk CRM', 'Gmail', 'WhatsApp (wa.me)'],
  },
  {
    template_key: 'proposal_notice',
    order: 3,
    name: 'Proposal Scope Delivery Notice',
    short_label: 'Qualified / Proposal',
    stage_trigger: 'qualified',
    event_type: 'proposal_published',
    description:
      'Delivers the published client portal proposal link and itemized scope summary for review.',
    default_channel: 'email',
    default_provider: 'resend',
    default_delay_minutes: 0,
    default_approval_required: true,
    db_backed: true,
    free_stack_tools: ['AgencyDesk Portal', 'Gmail', 'Resend', 'WhatsApp'],
  },
  {
    template_key: 'proposal_follow_up',
    order: 4,
    name: '72h Proposal Decision Nudge',
    short_label: 'Proposal Sent',
    stage_trigger: 'proposal_sent',
    event_type: 'proposal_published',
    description:
      'Queues a polite 72-hour decision check-in draft if an active proposal is still awaiting client approval.',
    default_channel: 'whatsapp',
    default_provider: 'whatsapp',
    default_delay_minutes: 4320,
    default_approval_required: true,
    db_backed: true,
    free_stack_tools: ['AgencyDesk CRM', 'n8n', 'WhatsApp', 'Gmail'],
  },
  {
    template_key: 'proposal_accepted',
    order: 5,
    name: 'Automated Project Kickoff Welcome',
    short_label: 'Won / Kickoff',
    stage_trigger: 'won',
    event_type: 'proposal_accepted',
    description:
      'Prepares a project kickoff welcome draft with client portal milestone and deliverable links after acceptance.',
    default_channel: 'email',
    default_provider: 'resend',
    default_delay_minutes: 0,
    default_approval_required: true,
    db_backed: true,
    free_stack_tools: ['AgencyDesk Portal', 'Gmail', 'WhatsApp'],
  },
] as const;

export function getPlaybookDefinition(key: PlaybookTemplateKey): PlaybookDefinition {
  return PLAYBOOK_DEFINITIONS.find((item) => item.template_key === key) ?? PLAYBOOK_DEFINITIONS[0];
}

export function normalizeWhatsAppDigits(rawPhone?: string | null): string | null {
  if (!rawPhone) return null;
  let cleaned = rawPhone.replace(/[^\d+]/g, '');
  if (!cleaned) return null;
  if (cleaned.startsWith('09')) {
    cleaned = '+63' + cleaned.slice(1);
  }
  const digits = cleaned.startsWith('+') ? cleaned.slice(1) : cleaned;
  if (!/^[1-9]\d{7,14}$/.test(digits)) return null;
  return digits;
}

export function buildWhatsAppUrl(rawPhone?: string | null, message?: string): string | null {
  const digits = normalizeWhatsAppDigits(rawPhone);
  if (!digits) return null;
  if (!message?.trim()) return `https://wa.me/${digits}`;
  return `https://wa.me/${digits}?text=${encodeURIComponent(message.trim())}`;
}

export function buildMailtoUrl(email?: string | null, subject?: string, body?: string): string | null {
  const trimmedEmail = (email ?? '').replace(/[\r\n]/g, '').trim();
  if (
    !trimmedEmail ||
    /[?#&<>\\]/.test(trimmedEmail) ||
    !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmedEmail)
  ) {
    return null;
  }
  const params = new URLSearchParams();
  if (subject?.trim()) params.set('subject', subject.replace(/[\r\n]/g, ' ').trim());
  if (body?.trim()) params.set('body', body.trim());
  const qs = params.toString();
  return qs ? `mailto:${trimmedEmail}?${qs}` : `mailto:${trimmedEmail}`;
}

export type LeadDraftInput = Pick<
  Lead,
  'id' | 'contact_name' | 'email' | 'service' | 'status'
> & {
  company?: string;
  phone?: string | null;
  whatsapp?: string | null;
  whatsapp_opt_in?: boolean;
  email_opt_in?: boolean;
  budget?: number;
};

export function buildPlaybookDraft(
  lead: LeadDraftInput,
  templateKey: PlaybookTemplateKey,
  preferredChannel?: AutomationChannel
): {
  channel: AutomationChannel;
  recipient: string;
  subject: string;
  body: string;
  wa_me_url: string | null;
  mailto_url: string | null;
} {
  const def = getPlaybookDefinition(templateKey);
  const firstName = lead.contact_name.trim().split(/\s+/)[0] || 'there';
  const companyLabel =
    lead.company && lead.company !== 'Unassigned company' ? lead.company : 'your team';
  const serviceLabel = lead.service || 'your project';
  const rawPhone = lead.whatsapp || lead.phone || null;
  const digits = normalizeWhatsAppDigits(rawPhone);
  const channel: AutomationChannel = preferredChannel ?? def.default_channel;
  const recipient =
    channel === 'whatsapp'
      ? digits
        ? `+${digits}`
        : rawPhone ?? ''
      : lead.email.trim().toLowerCase();

  let subject: string;
  let body: string;

  switch (templateKey) {
    case 'inquiry_acknowledgment':
      subject = `Thanks for reaching out to AgencyDesk (${serviceLabel})`;
      body = `Hi ${firstName}, thanks for sharing your ${serviceLabel} brief for ${companyLabel}. I reviewed your goals and would love to lock in a quick 15-minute discovery call—what time works best for you tomorrow?`;
      break;
    case 'discovery_followup':
      subject = `Following up on our ${serviceLabel} discovery chat`;
      body = `Hi ${firstName}, great connecting with you about ${companyLabel}'s ${serviceLabel} goals. Let me know if you have any extra requirements to include before I put together your itemized scope and timeline.`;
      break;
    case 'proposal_notice':
      subject = `Your AgencyDesk proposal for ${companyLabel} is ready`;
      body = `Hi ${firstName}, your itemized ${serviceLabel} proposal for ${companyLabel} is ready to review in your AgencyDesk client portal. Let me know if you'd like to walk through any line items or milestones together.`;
      break;
    case 'proposal_follow_up':
      subject = `Checking in on your ${serviceLabel} proposal`;
      body = `Hi ${firstName}, just checking in on the ${serviceLabel} proposal we sent over for ${companyLabel}. Do you have any questions on scope, timeline, or next steps before the proposal window closes?`;
      break;
    case 'proposal_accepted':
      subject = `Welcome aboard! ${companyLabel} project kickoff`;
      body = `Hi ${firstName}, thrilled to kick off ${serviceLabel} with ${companyLabel}! Your project workspace and Sprint 1 milestones are now live in your AgencyDesk portal—we'll share our first check-in update shortly.`;
      break;
  }

  return {
    channel,
    recipient,
    subject,
    body,
    wa_me_url: buildWhatsAppUrl(rawPhone, body),
    mailto_url: buildMailtoUrl(lead.email, subject, body),
  };
}

export function recommendNextAction(lead: LeadDraftInput): NextActionRecommendation {
  const hasPhone = Boolean(normalizeWhatsAppDigits(lead.whatsapp || lead.phone));

  let templateKey: PlaybookTemplateKey;
  let label: string;
  let description: string;
  let priority: 'high' | 'medium' | 'low';
  let preferredChannel: AutomationChannel;

  switch (lead.status) {
    case 'new':
      templateKey = 'inquiry_acknowledgment';
      label = 'Send Inquiry Welcome & Book Discovery Call';
      description =
        'Acknowledge the new lead within 5 minutes and propose a 15-minute discovery slot.';
      priority = 'high';
      preferredChannel = hasPhone ? 'whatsapp' : 'email';
      break;
    case 'contacted':
      templateKey = 'discovery_followup';
      label = 'Send 24h Discovery Follow-Up';
      description =
        'Recap discovery notes, confirm scope inputs, and qualify budget/timeline.';
      priority = 'high';
      preferredChannel = hasPhone && lead.whatsapp_opt_in ? 'whatsapp' : 'email';
      break;
    case 'qualified':
      templateKey = 'proposal_notice';
      label = 'Publish & Deliver Itemized Proposal';
      description =
        'Create the proposal in AgencyDesk and notify the client with their portal link.';
      priority = 'high';
      preferredChannel = 'email';
      break;
    case 'proposal_sent':
      templateKey = 'proposal_follow_up';
      label = 'Send 72h Proposal Decision Nudge';
      description =
        'Follow up on the active proposal to unblock legal/budget review and close the deal.';
      priority = 'medium';
      preferredChannel = hasPhone ? 'whatsapp' : 'email';
      break;
    case 'won':
      templateKey = 'proposal_accepted';
      label = 'Send Kickoff Welcome & Portal Guide';
      description =
        'Confirm Sprint 1 milestones and share client portal deliverable access.';
      priority = 'medium';
      preferredChannel = 'email';
      break;
    case 'lost':
    default:
      templateKey = 'discovery_followup';
      label = 'Archive & Schedule 60-Day Check-In';
      description =
        'Keep the relationship warm with a light close-out note for future projects.';
      priority = 'low';
      preferredChannel = 'email';
      break;
  }

  const draft = buildPlaybookDraft(lead, templateKey, preferredChannel);
  const consentReady =
    preferredChannel === 'whatsapp'
      ? Boolean(lead.whatsapp_opt_in && hasPhone)
      : Boolean(lead.email_opt_in);

  return {
    template_key: templateKey,
    label,
    description,
    channel: preferredChannel === 'whatsapp' ? 'WhatsApp' : 'Email',
    channel_key: preferredChannel,
    priority,
    subject: draft.subject,
    draft_message: draft.body,
    wa_me_url: draft.wa_me_url,
    mailto_url: draft.mailto_url,
    consent_ready: consentReady,
  };
}

export function isValidChannelProviderPair(
  channel: AutomationChannel,
  provider: AutomationProvider
): boolean {
  if (channel === 'email') return provider === 'resend' || provider === 'gmail';
  return provider === 'whatsapp' || provider === 'waha' || provider === 'zoko';
}

export function defaultProviderForChannel(channel: AutomationChannel): AutomationProvider {
  return channel === 'email' ? 'resend' : 'whatsapp';
}
