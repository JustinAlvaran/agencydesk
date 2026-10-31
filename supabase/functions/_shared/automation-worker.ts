import type { DeliveryConfig, DeliveryJob, DeliveryOutcome } from './delivery.ts';

export type WorkerJob = DeliveryJob & { agency_id: string; rule_id: string; lease_token: string };
export interface WorkerBackend {
  adminAgency(token: string): Promise<string | null>;
  rules(agencyId: string): Promise<Array<{ id: string; template_key: string }>>;
  claim(agencyId: string): Promise<WorkerJob[]>;
  revalidate(job: WorkerJob): Promise<boolean>;
  finish(job: WorkerJob, outcome: DeliveryOutcome): Promise<boolean>;
}
type Dependencies = {
  env(name: string): string | undefined;
  createBackend(url: string, key: string): WorkerBackend;
  deliver(job: DeliveryJob, config: DeliveryConfig): Promise<DeliveryOutcome>;
  policy: 'configured' | 'dry_run_only';
  matches(actual: string, expected: string): Promise<boolean>;
};

export function createAutomationWorker({ env, createBackend, deliver, policy, matches }: Dependencies) {
  return async (request: Request): Promise<Response> => {
    const headers = { 'Content-Type': 'application/json', 'Cache-Control': 'no-store' };
    const respond = (body: unknown, status = 200) => new Response(JSON.stringify(body), { status, headers });
    if (request.method !== 'POST') return respond({ error: 'Method not allowed' }, 405);
    try {
      const url = env('SUPABASE_URL'), key = env('SUPABASE_SERVICE_ROLE_KEY');
      if (!url || !key) return respond({ error: 'Worker configuration is missing' }, 503);
      const backend = createBackend(url, key);
      let agencyId = env('AUTOMATION_AGENCY_ID') ?? null;
      // The n8n key cannot authenticate the general worker, even if it is configured live.
      const suppliedSecret = request.headers.get('x-automation-secret') ?? '';
      const n8nSecret = env('AUTOMATION_N8N_SECRET') ?? '';
      const cronSecret = env('AUTOMATION_CRON_SECRET') ?? '';
      const isN8nSecret = await matches(suppliedSecret, n8nSecret);
      if (policy === 'configured' && isN8nSecret) return respond({ error: 'Integration credential cannot access the general worker' }, 403);
      if (policy === 'dry_run_only' && await matches(n8nSecret, cronSecret)) return respond({ error: 'Integration requires a separate credential' }, 503);
      const secretAuthorized = policy === 'dry_run_only' ? isN8nSecret : await matches(suppliedSecret, cronSecret);
      if (!secretAuthorized) {
        const match = request.headers.get('Authorization')?.match(/^Bearer (.+)$/);
        if (!match || match[1].length > 8192) return respond({ error: 'Authentication required' }, 401);
        agencyId = await backend.adminAgency(match[1]);
        if (!agencyId) return respond({ error: 'Administrator access required' }, 403);
      }
      if (!agencyId || !/^[0-9a-f]{8}-(?:[0-9a-f]{4}-){3}[0-9a-f]{12}$/i.test(agencyId)) return respond({ error: 'Automation agency is not configured' }, 503);
      // Bound actual bytes, including streamed bodies without a Content-Length header.
      if (Number(request.headers.get('content-length') ?? '0') > 1024) return respond({ error: 'Request too large' }, 413);
      const reader = request.body?.getReader();
      if (reader) {
        let size = 0;
        try {
          for (;;) {
            const { done, value } = await reader.read();
            if (done) break;
            size += value.byteLength;
            if (size > 1024) { await reader.cancel(); return respond({ error: 'Request too large' }, 413); }
          }
        } finally { reader.releaseLock(); }
      }
      const configuredMode = env('AUTOMATION_DELIVERY_MODE');
      // Explicit server opt-in. A body/header cannot downgrade a live worker after dispatch.
      if (policy === 'dry_run_only' && configuredMode !== 'dry_run') return respond({ error: 'dry_run_required', message: 'This endpoint requires explicit server dry-run configuration. No jobs were claimed.' }, 409);
      const mode = configuredMode ?? 'dry_run';
      if (!['dry_run', 'live'].includes(mode)) return respond({ error: 'Invalid delivery mode' }, 503);
      // Never read sender credentials for simulation, and never call a provider adapter.
      const config: DeliveryConfig = mode === 'dry_run' ? { mode } : {
        mode, emailProvider: env('EMAIL_PROVIDER'), resendKey: env('RESEND_API_KEY'), fromEmail: env('AUTOMATION_FROM_EMAIL'),
        whatsappToken: env('WHATSAPP_ACCESS_TOKEN'), whatsappPhoneId: env('WHATSAPP_PHONE_NUMBER_ID'), graphVersion: env('WHATSAPP_GRAPH_VERSION'), templateMap: env('WHATSAPP_TEMPLATE_MAP'),
        zokoKey: env('ZOKO_API_KEY'), zokoTemplateMap: env('ZOKO_TEMPLATE_MAP'), gmailClientId: env('GMAIL_CLIENT_ID'),
        gmailClientSecret: env('GMAIL_AGENCY_ID') === agencyId ? env('GMAIL_CLIENT_SECRET') : undefined,
        gmailRefreshToken: env('GMAIL_REFRESH_TOKEN'), gmailFromEmail: env('GMAIL_FROM_EMAIL'), wahaURL: env('WAHA_API_URL'),
        wahaKey: env('WAHA_AGENCY_ID') === agencyId ? env('WAHA_API_KEY') : undefined, wahaSession: env('WAHA_SESSION'), appURL: env('APP_URL'),
      };
      const rules = await backend.rules(agencyId);
      const templates = new Map(rules.map(rule => [rule.id, rule.template_key]));
      const counts: Record<string, number> = {};
      let claimed = 0;
      // One lease at a time; the database owns approval, eligibility and concurrency.
      for (let index = 0; index < 5; index++) {
        const jobs = await backend.claim(agencyId);
        const job = jobs[0];
        if (!job) break;
        if (job.agency_id !== agencyId) return respond({ error: 'Queue workspace could not be verified', processed: counts }, 503);
        claimed++;
        if (!await backend.revalidate(job)) { counts.skipped = (counts.skipped ?? 0) + 1; continue; }
        const outcome: DeliveryOutcome = mode === 'dry_run' ? { outcome: 'simulated' } : await deliver({ ...job, template_key: templates.get(job.rule_id) ?? '' }, {
          ...config, emailProvider: job.provider === 'gmail' ? 'gmail' : config.emailProvider,
          whatsappProvider: job.provider === 'waha' ? 'waha' : job.provider === 'zoko' ? 'zoko' : 'meta',
        });
        if (!await backend.finish(job, outcome)) return respond({ error: 'Delivery result could not be recorded. Review lease recovery before retrying.', processed: counts }, 503);
        counts[outcome.outcome] = (counts[outcome.outcome] ?? 0) + 1;
      }
      return respond({ mode, processed: counts, claimed });
    } catch { return respond({ error: 'Automation worker could not complete the batch' }, 503); }
  };
}
