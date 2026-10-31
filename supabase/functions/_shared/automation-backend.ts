import { createClient } from 'npm:@supabase/supabase-js@2.117.2';
import type { WorkerBackend, WorkerJob } from './automation-worker.ts';

export function createAutomationBackend(url: string, key: string): WorkerBackend {
  const admin = createClient(url, key, { auth: { persistSession: false, autoRefreshToken: false } });
  return {
    async adminAgency(token) {
      const { data: identity, error } = await admin.auth.getUser(token);
      if (error || !identity.user) return null;
      const { data, error: membershipError } = await admin.from('staff_members').select('agency_id').eq('user_id', identity.user.id).eq('active', true).eq('role', 'admin').maybeSingle();
      return membershipError ? null : data?.agency_id ?? null;
    },
    async rules(agencyId) {
      const { data, error } = await admin.from('automation_rules').select('id,template_key').eq('agency_id', agencyId);
      if (error) throw new Error('rules_unavailable');
      return data ?? [];
    },
    async claim(agencyId) {
      const { data, error } = await admin.rpc('claim_message_jobs', { p_limit: 1, p_agency_id: agencyId });
      if (error) throw new Error('claim_unavailable');
      return (data ?? []) as WorkerJob[];
    },
    async revalidate(job) {
      const { data, error } = await admin.rpc('revalidate_message_job', { p_job_id: job.id, p_lease_token: job.lease_token });
      if (error) throw new Error('eligibility_unavailable');
      return data === true;
    },
    async finish(job, outcome) {
      const { data, error } = await admin.rpc('finish_message_job', { p_job_id: job.id, p_lease_token: job.lease_token, p_outcome: outcome.outcome, p_provider_message_id: outcome.providerMessageId ?? null, p_error_code: outcome.errorCode ?? null, p_retry_after_seconds: outcome.retryAfterSeconds ?? null });
      return !error && data === true;
    },
  };
}
