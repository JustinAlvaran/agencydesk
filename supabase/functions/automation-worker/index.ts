import { createClient } from 'npm:@supabase/supabase-js@2.117.2';
import { deliverMessage, secretMatches, type DeliveryJob } from '../_shared/delivery.ts';

Deno.serve(async (request: Request) => {
  const headers = { 'Content-Type': 'application/json', 'Cache-Control': 'no-store' };
  const respond = (body: unknown, status = 200) => new Response(JSON.stringify(body), { status, headers });
  if (request.method !== 'POST') return respond({ error: 'Method not allowed' }, 405);
  try {
    const url = Deno.env.get('SUPABASE_URL'), key = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
    if (!url || !key) return respond({ error: 'Worker configuration is missing' }, 503);
    const admin = createClient(url, key, { auth: { persistSession: false, autoRefreshToken: false } });
    let agencyId = Deno.env.get('AUTOMATION_AGENCY_ID') ?? null;
    let authorized = await secretMatches(request.headers.get('x-automation-secret') ?? '', Deno.env.get('AUTOMATION_CRON_SECRET') ?? '');
    if (!authorized) {
      const match = request.headers.get('Authorization')?.match(/^Bearer (.+)$/);
      if (!match || match[1].length > 8192) return respond({ error: 'Authentication required' }, 401);
      const { data: identity, error } = await admin.auth.getUser(match[1]);
      if (error || !identity.user) return respond({ error: 'Authentication required' }, 401);
      const { data: membership, error: membershipError } = await admin.from('staff_members').select('role,active,agency_id').eq('user_id', identity.user.id).eq('active', true).eq('role', 'admin').maybeSingle();
      authorized = !membershipError && !!membership;
      agencyId = membership?.agency_id ?? null;
    }
    if (!authorized) return respond({ error: 'Administrator access required' }, 403);
    if (!agencyId || !/^[0-9a-f]{8}-(?:[0-9a-f]{4}-){3}[0-9a-f]{12}$/i.test(agencyId)) return respond({ error: 'Automation agency is not configured' }, 503);
    if (Number(request.headers.get('content-length') ?? '0') > 1024 || (await request.text()).length > 1024) return respond({ error: 'Request too large' }, 413);
    const config = { mode: Deno.env.get('AUTOMATION_DELIVERY_MODE') ?? 'dry_run', emailProvider: Deno.env.get('EMAIL_PROVIDER'), resendKey: Deno.env.get('RESEND_API_KEY'), fromEmail: Deno.env.get('AUTOMATION_FROM_EMAIL'), whatsappToken: Deno.env.get('WHATSAPP_ACCESS_TOKEN'), whatsappPhoneId: Deno.env.get('WHATSAPP_PHONE_NUMBER_ID'), graphVersion: Deno.env.get('WHATSAPP_GRAPH_VERSION'), templateMap: Deno.env.get('WHATSAPP_TEMPLATE_MAP'), appURL: Deno.env.get('APP_URL') };
    if (!['dry_run', 'live'].includes(config.mode)) return respond({ error: 'Invalid delivery mode' }, 503);
    const { data: rules, error: rulesError } = await admin.from('automation_rules').select('id,template_key');
    if (rulesError) return respond({ error: 'Could not load automation rules' }, 503);
    const templates = new Map((rules ?? []).map(rule => [rule.id, rule.template_key]));
    const counts: Record<string, number> = {};
    let claimed = 0;
    // Claim only the next job: a crash must not strand unsent rows in a batch.
    for (let index = 0; index < 5; index++) {
      const { data: jobs, error: claimError } = await admin.rpc('claim_message_jobs', { p_limit: 1, p_agency_id: agencyId });
      if (claimError) return respond({ error: 'Could not claim automation jobs', processed: counts }, 503);
      const job = jobs?.[0];
      if (!job) break;
      claimed++;
      const { data: eligible, error: guardError } = await admin.rpc('revalidate_message_job', { p_job_id: job.id, p_lease_token: job.lease_token });
      if (guardError) return respond({ error: 'Dispatch eligibility could not be verified', processed: counts }, 503);
      if (eligible !== true) { counts.skipped = (counts.skipped ?? 0) + 1; continue; }
      const outcome = await deliverMessage({ ...job, template_key: templates.get(job.rule_id) ?? '' } as DeliveryJob, config);
      const { data: finished, error: finishError } = await admin.rpc('finish_message_job', { p_job_id: job.id, p_lease_token: job.lease_token, p_outcome: outcome.outcome, p_provider_message_id: outcome.providerMessageId ?? null, p_error_code: outcome.errorCode ?? null, p_retry_after_seconds: outcome.retryAfterSeconds ?? null });
      // A lost result stays processing and becomes uncertain on lease recovery.
      if (finishError || finished !== true) return respond({ error: 'Delivery result could not be recorded. Review lease recovery before retrying.', processed: counts }, 503);
      counts[outcome.outcome] = (counts[outcome.outcome] ?? 0) + 1;
    }
    return respond({ mode: config.mode, processed: counts, claimed });
  } catch { return respond({ error: 'Automation worker could not complete the batch' }, 503); }
});
