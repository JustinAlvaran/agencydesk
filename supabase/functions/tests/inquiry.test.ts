import assert from 'node:assert/strict';
type Handler = (request: Request) => Response | Promise<Response>;
let inquiryHandler: Handler;
const originalServe = Deno.serve;
Deno.serve = ((handler: Handler) => { inquiryHandler = handler; return {}; }) as unknown as typeof Deno.serve;
await import('../inquiry/index.ts');
Deno.serve = originalServe;

const agency = 'a0000000-0000-4000-8000-000000000001';
const id = '80000000-0000-4000-8000-000000000001';
const payload = { contact_name: 'Fictional visitor', email: 'visitor@example.test', service: 'Business websites', brief: 'A fictional website inquiry for verification.', budget_cents: 100000, email_opt_in: false, whatsapp_opt_in: false, intake_source: 'website_chatbot', submission_id: id };
const request = (body: unknown = payload) => new Request('https://agency-test.invalid/inquiry', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) });

async function withDatabase(run: (calls: string[]) => Promise<void>, rpcError?: { code: string; message: string }) {
  Deno.env.set('SUPABASE_URL', 'https://agency-test.invalid');
  Deno.env.set('SUPABASE_SERVICE_ROLE_KEY', 'fictional-server-key');
  const originalFetch = globalThis.fetch;
  const calls: string[] = [];
  globalThis.fetch = async (input, init) => {
    const url = new URL(typeof input === 'string' ? input : input instanceof URL ? input.href : input.url);
    assert.equal(url.hostname, 'agency-test.invalid', 'No real database or messaging service is contacted');
    calls.push(url.pathname);
    if (url.pathname === '/rest/v1/agencies') {
      assert.equal(url.searchParams.get('slug'), 'eq.agencydesk');
      return Response.json({ id: agency });
    }
    assert.equal(url.pathname, '/rest/v1/rpc/submit_website_inquiry');
    const body = JSON.parse(String(init?.body));
    assert.equal(body.p_agency_id, agency, 'Agency is resolved by the server');
    assert.equal(body.p_submission_id, id);
    assert.equal(body.p_source, 'website_chatbot');
    assert.match(body.p_request_key, /^[a-f0-9]{64}$/);
    assert.match(body.p_payload_hash, /^[a-f0-9]{64}$/);
    assert.equal(body.p_email_opt_in, false);
    assert.equal(body.p_whatsapp_opt_in, false);
    return rpcError ? Response.json(rpcError, { status: 400 }) : Response.json(id);
  };
  try { await run(calls); } finally { globalThis.fetch = originalFetch; }
}

Deno.test('inquiry rejects an unpublished service before touching the database', async () => {
  await withDatabase(async calls => {
    assert.equal((await inquiryHandler(request({ ...payload, service: 'Unpublished service' }))).status, 400);
    assert.deepEqual(calls, []);
  });
});
Deno.test('inquiry rejects oversized direct requests before touching the database', async () => {
  await withDatabase(async calls => {
    assert.equal((await inquiryHandler(request({ ...payload, brief: 'x'.repeat(17000) }))).status, 413);
    assert.deepEqual(calls, []);
  });
});
Deno.test('inquiry binds the idempotent request and consent to the configured agency', async () => {
  await withDatabase(async calls => {
    const result = await inquiryHandler(request({ ...payload, target_agency_id: 'attacker', request_key: 'attacker' }));
    assert.equal(result.status, 201);
    assert.deepEqual(await result.json(), { id });
    assert.deepEqual(calls, ['/rest/v1/agencies', '/rest/v1/rpc/submit_website_inquiry']);
  });
});
Deno.test('inquiry exposes a conflict when a submission key is reused with different consent', async () => {
  await withDatabase(async () => {
    assert.equal((await inquiryHandler(request())).status, 409);
  }, { code: '23505', message: 'Submission content changed' });
});
Deno.test('inquiry preserves persistent rate-limit status without exposing database diagnostics', async () => {
  await withDatabase(async () => {
    const result = await inquiryHandler(request());
    assert.equal(result.status, 429);
    assert.equal((await result.text()).includes('private'), false);
  }, { code: 'P0001', message: 'private.inquiry_requests rate limit exceeded' });
});
