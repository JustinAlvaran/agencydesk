import type { Database } from '@/lib/supabase/database.types';
export type AutomationRule = Database['public']['Tables']['automation_rules']['Row'];
export type MessageJob = Database['public']['Tables']['message_jobs']['Row'];
export const messageStatuses = ['pending_approval','queued','processing','simulated','accepted','delivered','read','failed','uncertain','skipped','cancelled'] as const;
export const ruleDescriptions: Record<string, string> = {
  inquiry_acknowledgment: 'Acknowledge a new inquiry on a channel the lead opted into.',
  proposal_notice: 'Notify the intended client when a proposal is published in their portal.',
  proposal_follow_up: 'Follow up only while the current proposal remains unanswered and unexpired.',
  proposal_accepted: 'Confirm successful acceptance and link to the resulting project.',
};
