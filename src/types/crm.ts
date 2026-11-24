export type LeadStatus = 'new' | 'contacted' | 'qualified' | 'proposal_sent' | 'won' | 'lost';

export interface Lead {
  id: string;
  contact_name: string;
  email: string;
  phone?: string;
  whatsapp?: string;
  whatsapp_opt_in?: boolean;
  instagram?: string;
  company: string;
  service: string;
  brief: string;
  budget: number;
  status: LeadStatus;
  probability: number;
  score?: number;
  row_version?: number;
  budget_range?: string;
  owner: string;
  created_at: string;
  last_activity?: string;
  notes?: string[];
  tasks?: Task[];
}

export interface Contact {
  id: string;
  name: string;
  email: string;
  phone?: string;
  company: string;
  role: string;
  deals_count: number;
  total_value: number;
  created_at: string;
}

export interface Proposal {
  revision_id?: string;
  id: string;
  title: string;
  lead_id?: string;
  company: string;
  version: string;
  scope: string;
  total_cents: number;
  status: 'draft' | 'published' | 'accepted' | 'declined';
  expires_at?: string;
  created_at: string;
}

export interface Project {
  id: string;
  title: string;
  company: string;
  progress: number;
  status: 'planning' | 'in_progress' | 'review' | 'completed';
  milestones: {
    id?: string;
    review_status?: string;
    feedback?: string;
    title: string;
    completed: boolean;
    due_date: string;
  }[];
  due_date: string;
  created_at: string;
}

export interface Task {
  id: string;
  title: string;
  lead_id?: string;
  due_date: string;
  completed: boolean;
  assigned_to: string;
}

export interface ActivityEvent {
  id: string;
  lead_id?: string;
  type: 'call' | 'note' | 'status_change' | 'proposal_created' | 'proposal_accepted';
  title: string;
  actor: string;
  detail: string;
  created_at: string;
}
