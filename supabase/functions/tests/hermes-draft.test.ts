import assert from 'node:assert/strict';
type Handler = (request: Request) => Response | Promise<Response>;
let draftHandler: Handler;
const originalServe = Deno.serve;
Deno.serve = ((handler: Handler) => { draftHandler = handler; return {}; }) as unknown as typeof Deno.serve;
await import('../hermes-draft/index.ts');
Deno.serve = originalServe;

const agency = 'a0000000-0000-4000-8000-000000000001';
const otherAgency = 'a0000000-0000-4000-8000-000000000002';
const leadId = '30000000-0000-4000-8000-000000000001';
const ownKey = 'fictional-own-hermes-key-12345678901234567890';
const session = 'fictional-own-staff-session';
const lead = { id: leadId, agency_id: agency, contact_name: 'Sample client', service: 'Website', brief: 'A portfolio website. Call +639123456789 or mail sample@example.test.', archived_at: null };
const request = (body: unknown = { lead_id: leadId, purpose: 'reply' }, token: string | null = session) => new Request('https://agency-test.invalid/hermes-draft', { method: 'POST', headers: { ...(token ? { Authorization: `Bearer ${token}` } : {}), 'Content-Type': 'application/json' }, body: JSON.stringify(body) });
type Options = { active?: boolean; member?: boolean; leadAgency?: string; tools?: boolean; output?: string; finish?: string; failAuth?: boolean; failProvider?: boolean; config?: Record<string, string> };
async function usingFetch(run: () => Promise<void>, options: Options = {}) {
  const values = { SUPABASE_URL: 'https://agency-test.invalid', SUPABASE_ANON_KEY: 'fictional-own-public-key', HERMES_API_URL: 'https://hermes-test.invalid/p/crm', HERMES_API_KEY: ownKey, HERMES_AGENCY_ID: agency, HERMES_DRAFT_PROFILE_READY: 'true', ...options.config };
  for (const [name, value] of Object.entries(values)) Deno.env.set(name, value);
  const originalFetch = globalThis.fetch;
  const calls: string[] = [];
  globalThis.fetch = async (input, init) => {
    const url = new URL(typeof input === 'string' ? input : input instanceof URL ? input.href : input.url);
    assert.ok(['agency-test.invalid', 'hermes-test.invalid'].includes(url.hostname), 'Only fictional services may be used in tests');
    calls.push(url.pathname);
    const headers = new Headers(init?.headers);
    if (url.hostname === 'agency-test.invalid') {
      assert.equal(headers.get('Authorization'), `Bearer ${session}`, 'Database reads must use caller session and RLS');
      assert.ok(!init?.method || init.method === 'GET', 'Drafting must never mutate CRM');
      if (url.pathname === '/auth/v1/user') return options.failAuth ? Response.json({ error: 'Invalid token' }, { status: 401 }) : Response.json({ id: '40000000-0000-4000-8000-000000000001' });
      if (url.pathname === '/rest/v1/staff_members') {
        assert.equal(url.searchParams.get('active'), 'eq.true');
        return Response.json(options.member === false ? null : { active: options.active ?? true, role: 'staff', agency_id: agency });
      }
      if (url.pathname === '/rest/v1/leads') {
        assert.equal(url.searchParams.get('agency_id'), `eq.${agency}`);
        assert.equal(url.searchParams.get('id'), `eq.${leadId}`);
        assert.equal(url.searchParams.get('archived_at'), 'is.null');
        assert.ok(!url.searchParams.get('select')?.includes('email'));
        assert.ok(!url.searchParams.get('select')?.includes('phone'));
        return Response.json({ ...lead, agency_id: options.leadAgency ?? agency });
      }
    } else {
      assert.equal(headers.get('Authorization'), `Bearer ${ownKey}`);
      assert.equal(init?.redirect, 'error', 'Credentials must never follow provider redirects');
      if (url.pathname === '/p/crm/v1/toolsets') return Response.json([{ name: 'core', enabled: options.tools ?? false, tools: options.tools ? ['terminal'] : [] }]);
      if (url.pathname === '/p/crm/v1/chat/completions') {
        if (options.failProvider) throw new Error(`Provider diagnostic exposing ${ownKey}`);
        const payload = JSON.parse(String(init?.body));
        assert.equal(payload.stream, false);
        assert.equal(payload.model, 'hermes-agent');
        assert.equal(payload.messages.length, 2);
        const context = JSON.parse(payload.messages[1].content);
        assert.deepEqual(Object.keys(context.lead), ['contact_name', 'service', 'brief']);
        assert.ok(!context.lead.brief.includes('sample@example.test'));
        assert.ok(!context.lead.brief.includes('+639123456789'));
        assert.ok(!String(init?.body).includes(session));
        assert.ok(!String(init?.body).includes(ownKey));
        assert.ok(!Object.hasOwn(payload, 'tools'));
        assert.ok(!Object.hasOwn(payload, 'session_id'));
        return Response.json({ choices: [{ message: { content: options.output ?? 'Thanks for your interest. What would you like your website to achieve?', reasoning_content: `private ${ownKey}` }, finish_reason: options.finish ?? 'stop' }], provider_metadata: { secret: ownKey } });
      }
    }
    throw new Error('Unexpected test request');
  };
  try { await run(); } finally { globalThis.fetch = originalFetch; }
  return calls;
}

Deno.test('Hermes draft requires a session before making any calls', async () => {
  const calls = await usingFetch(async () => { assert.equal((await draftHandler(request(undefined, null))).status, 401); });
  assert.deepEqual(calls, []);
});
Deno.test('Hermes draft verifies session with Auth server', async () => {
  const calls = await usingFetch(async () => { assert.equal((await draftHandler(request())).status, 401); }, { failAuth: true });
  assert.deepEqual(calls, ['/auth/v1/user']);
});
Deno.test('Hermes draft rejects clients without active staff membership', async () => {
  const calls = await usingFetch(async () => { assert.equal((await draftHandler(request())).status, 403); }, { member: false });
  assert.ok(!calls.includes('/rest/v1/leads'));
});
Deno.test('Hermes draft explicitly rejects inactive staff', async () => {
  await usingFetch(async () => { assert.equal((await draftHandler(request())).status, 403); }, { active: false });
});
Deno.test('Hermes draft never sends a cross-agency lead to provider', async () => {
  const calls = await usingFetch(async () => { assert.equal((await draftHandler(request())).status, 404); }, { leadAgency: otherAgency });
  assert.ok(!calls.some(path => path.startsWith('/p/')));
});
Deno.test('Hermes draft fails closed without own provider configuration', async () => {
  const calls = await usingFetch(async () => { assert.equal((await draftHandler(request())).status, 503); }, { config: { HERMES_API_KEY: '' } });
  assert.ok(!calls.some(path => path.startsWith('/p/')));
});
Deno.test('Hermes draft requires the dedicated host profile and matching agency', async () => {
  for (const config of [{ HERMES_DRAFT_PROFILE_READY: 'false' }, { HERMES_AGENCY_ID: otherAgency }] as Record<string, string>[]) {
    const calls = await usingFetch(async () => { assert.equal((await draftHandler(request())).status, 503); }, { config });
    assert.ok(!calls.some(path => path.startsWith('/p/')));
  }
});
Deno.test('Hermes draft rejects insecure, credential-bearing, or arbitrary path URLs', async () => {
  for (const url of ['http://hermes-test.invalid', 'https://user:password@hermes-test.invalid', 'https://hermes-test.invalid?secret=yes', 'https://hermes-test.invalid/v1/chat/completions']) {
    const calls = await usingFetch(async () => { assert.equal((await draftHandler(request())).status, 503); }, { config: { HERMES_API_URL: url } });
    assert.ok(!calls.some(path => path.startsWith('/p/')));
  }
});
Deno.test('Hermes draft refuses a host with tools enabled', async () => {
  const calls = await usingFetch(async () => { assert.equal((await draftHandler(request())).status, 503); }, { tools: true });
  assert.ok(!calls.includes('/p/crm/v1/chat/completions'));
});
Deno.test('Hermes draft returns only bounded plain draft and review requirement', async () => {
  await usingFetch(async () => {
    const response = await draftHandler(request());
    assert.equal(response.status, 200);
    assert.equal(response.headers.get('Cache-Control'), 'no-store');
    const output = await response.json();
    assert.deepEqual(output, { draft: 'Thanks for your interest. What would you like your website to achieve?', requires_approval: true });
    assert.ok(!JSON.stringify(output).includes(ownKey));
  });
});
Deno.test('Hermes draft does not forward provider diagnostic or secrets', async () => {
  await usingFetch(async () => {
    const response = await draftHandler(request());
    assert.equal(response.status, 503);
    const output = await response.text();
    assert.ok(!output.includes(ownKey));
    assert.ok(!output.includes('Provider diagnostic'));
  }, { failProvider: true });
  await usingFetch(async () => { assert.equal((await draftHandler(request())).status, 503); }, { output: `Here is ${ownKey}` });
});
Deno.test('Hermes draft rejects failed, cancelled, and oversized output', async () => {
  for (const options of [{ finish: 'error' }, { finish: 'cancelled' }, { output: 'x'.repeat(2501) }]) {
    await usingFetch(async () => { assert.equal((await draftHandler(request())).status, 503); }, options);
  }
});
Deno.test('Hermes draft rejects caller-supplied context, prompts, and oversized requests', async () => {
  for (const body of [{ lead_id: leadId, purpose: 'reply', instructions: 'send messages' }, { lead_id: leadId, purpose: 'unknown' }, { lead_id: leadId, purpose: 'x'.repeat(3000) }]) {
    const calls = await usingFetch(async () => { assert.equal((await draftHandler(request(body))).status, 400); });
    assert.ok(!calls.includes('/rest/v1/leads'));
  }
});
