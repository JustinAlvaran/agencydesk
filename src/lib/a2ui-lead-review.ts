import {z} from 'zod';
import {demoLeads} from './fixtures';
import {money, statusLabel, type Lead} from './domain';

// An identifier only: this catalog is registered locally and is never fetched.
export const LEAD_CATALOG_ID = 'https://agencydesk.example/a2ui/lead-review/v1';
export const LEAD_SURFACE_ID = 'lead-review';
export const leadPresets = [
  {id: 'open', label: 'Show open leads', title: 'Your open pipeline', description: 'Four conversations to move forward. Pick a lead to see the brief and a suggested next step.'},
  {id: 'proposals', label: 'Review proposal follow-ups', title: 'Keep the conversation moving', description: 'Sample leads at the proposal stage. Confirm the context before planning a follow-up.'},
  {id: 'closed', label: 'Explore closed leads', title: 'Learn from the outcomes', description: 'Won and lost sample leads, together for a quick review.'},
] as const;
export type LeadPreset = typeof leadPresets[number]['id'];

const suggestions: Record<Lead['status'], string> = {
  new: 'Review the inquiry and prepare discovery questions.',
  contacted: 'Review the conversation before planning the next touchpoint.',
  qualified: 'Turn the discovery notes into a scoped proposal.',
  proposal_sent: 'Review the proposal and ask whether anything needs clarification.',
  won: 'Prepare the project handoff and agree on the next milestone.',
  lost: 'Review the outcome and capture a lesson for future inquiries.',
};

type LeadCard = {id: string; component: 'LeadCard'; name: string; service: string; stage: string; budget: string; onInspect: {event: {name: 'inspect_lead'; context: {leadId: string}}}};
type LeadDetail = {id: string; component: 'LeadDetail'; name: string; service: string; brief: string; nextStep: string};
type Review = {id: 'root'; component: 'LeadReview'; title: string; description: string; count: number; children: string[]};
export type LeadSurfaceMessage = {version: '1.0'; createSurface: {surfaceId: string; catalogId: string; components: (Review | LeadCard | LeadDetail)[]}};

export function buildLeadSurface(preset: LeadPreset, selectedId?: string): LeadSurfaceMessage {
  const option = leadPresets.find(item => item.id === preset);
  if (!option) throw new Error('Unsupported sample view');
  const leads = demoLeads.filter(lead => preset === 'closed'
    ? lead.status === 'won' || lead.status === 'lost'
    : preset === 'proposals' ? lead.status === 'proposal_sent' : lead.status !== 'won' && lead.status !== 'lost');
  const selected = selectedId === undefined ? undefined : leads.find(lead => lead.id === selectedId);
  if (selectedId !== undefined && !selected) throw new Error('Sample lead is outside this view');
  const cards: LeadCard[] = leads.map(lead => ({
    id: `lead_${lead.id}`, component: 'LeadCard', name: lead.contact_name,
    service: lead.service, stage: statusLabel(lead.status), budget: money(lead.budget_cents),
    onInspect: {event: {name: 'inspect_lead', context: {leadId: lead.id}}},
  }));
  const detail: LeadDetail[] = selected ? [{id: 'lead_detail', component: 'LeadDetail', name: selected.contact_name, service: selected.service, brief: selected.brief, nextStep: suggestions[selected.status]}] : [];
  return {version: '1.0', createSurface: {
    surfaceId: LEAD_SURFACE_ID, catalogId: LEAD_CATALOG_ID,
    components: [{id: 'root', component: 'LeadReview', title: option.title, description: option.description, count: leads.length, children: [...cards.map(card => card.id), ...detail.map(item => item.id)]}, ...cards, ...detail],
  }};
}

const localAction = z.object({
  surfaceId: z.literal(LEAD_SURFACE_ID), name: z.literal('inspect_lead'),
  context: z.object({leadId: z.string().refine(id => demoLeads.some(lead => lead.id === id))}).strict(),
}).passthrough(); // SDK adds sourceComponentId and timestamp; neither grants authority.

export function readLeadAction(action: unknown): string | null {
  const parsed = localAction.safeParse(action);
  return parsed.success ? parsed.data.context.leadId : null;
}
