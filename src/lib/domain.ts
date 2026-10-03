export const leadStatuses = ['new', 'contacted', 'qualified', 'proposal_sent', 'won', 'lost'] as const;
export type LeadStatus = typeof leadStatuses[number];
export interface Lead { id: string; company_id?:string|null; contact_name: string; email: string; service: string; brief: string; budget_cents: number; status: LeadStatus; owner_id: string | null; archived_at: string | null; created_at: string }
export interface Contact { id: string; name: string; email: string; company_id: string | null; created_at: string }
export interface Task { id: string; title: string; due_at: string | null; completed_at: string | null; lead_id: string | null; assigned_to: string | null; created_at: string }
export interface Proposal { id: string; title: string; lead_id: string; company_id: string; created_at: string; status?: string; total_cents?: number; client_name?: string }
export interface ProposalRevision { id: string; series_id: string; version: number; scope: string; status: 'draft'|'published'|'accepted'|'declined'|'superseded'; total_cents: number; expires_at: string | null; created_at: string }
export interface ProposalItem { id: string; revision_id: string; description: string; quantity: number; unit_price_cents: number; position: number }
export interface Project { id: string; title: string; name?:string; company_id: string; accepted_revision_id: string; status: string; created_at: string; client_name?: string; progress?: number; due_date?: string }
export interface Milestone { id: string; project_id: string; title: string; due_at: string | null; status:string; position: number }
export interface ProjectUpdate { id: string; project_id: string; body: string; created_at: string }
export interface Comment { id: string; update_id: string; body: string; author_id: string; created_at: string }
export interface Note { id: string; lead_id: string; body: string; author_id: string; created_at: string }
export interface DashboardData { leads: Lead[]; proposals: Proposal[]; projects: Project[]; tasks: Task[]; openLeads: number; pipelineValue: number; acceptedValue: number; overdueTasks: number }
export function money(cents: number) { return new Intl.NumberFormat('en-US', {style:'currency',currency:'USD',maximumFractionDigits:0}).format(cents / 100); }
export function statusLabel(value: string) { return value.replaceAll('_',' ').replace(/\b\w/g, letter => letter.toUpperCase()); }
