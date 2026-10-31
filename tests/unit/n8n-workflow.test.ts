import { describe, expect, it } from 'vitest';
import workflow from '../../infra/n8n/workflows/process-approved-dry-run.json';
const http = workflow.nodes.find(node => node.type === 'n8n-nodes-base.httpRequest')!;
const guard = workflow.nodes.find(node => node.type === 'n8n-nodes-base.if')!;
const expression = guard.parameters.conditions!.conditions[0].leftValue;
// Evaluate the trusted expression from our checked-in template, never workflow/customer inputs.
const verify = ($json: unknown) => new Function('$json', `return (${expression.slice(3, -2).trim()});`)($json);
describe('manual n8n queue template contract', () => {
  it('contains no credentials, sample records, pinned data, sending or scheduling nodes', () => {
    expect(workflow.active).toBe(false); expect(workflow.pinData).toEqual({});
    expect(workflow.settings.availableInMCP).toBe(false);
    expect(workflow.nodes.every(node => ['manualTrigger','httpRequest','if','noOp','stopAndError','stickyNote'].some(type => node.type === `n8n-nodes-base.${type}`))).toBe(true);
    expect(workflow.nodes.some(node => Object.hasOwn(node, 'credentials'))).toBe(false);
  });
  it('fails closed until an owner binds the verified endpoint and credentials', () => {
    const url = http.parameters.url!;
    expect(() => new Function(`return (${url.slice(3,-2).trim()});`)()).toThrow('Configure the verified AgencyDesk');
    expect(http.parameters.authentication).toBe('genericCredentialType');
    expect(http.parameters.genericAuthType).toBe('httpHeaderAuth');
    expect(http.retryOnFail).toBe(false); expect(http.onError).toBe('stopWorkflow');
    expect(http.parameters.options!.redirect!.redirect.followRedirects).toBe(false);
    expect(http.parameters.options!.response!.response.neverError).toBe(false);
  });
  it('accepts empty and simulated aggregate results only', () => {
    expect(verify({ statusCode: 200, body: { mode: 'dry_run', claimed: 0, processed: {} } })).toBe(true);
    expect(verify({ statusCode: 200, body: { mode: 'dry_run', claimed: 5, processed: { simulated: 4, skipped: 1 } } })).toBe(true);
  });
  it.each([
    { mode: 'live', claimed: 1, processed: { accepted: 1 } },
    { mode: 'dry_run', claimed: 1, processed: { accepted: 1 } },
    { mode: 'dry_run', claimed: 1, processed: { simulated: 0 } },
    { mode: 'dry_run', claimed: 6, processed: { simulated: 6 } },
    { mode: 'dry_run', claimed: 1, processed: { simulated: '1' } },
    { mode: 'dry_run', claimed: 0, processed: [] },
    null,
  ])('refuses unsafe or malformed result %j', body => expect(verify({ statusCode: 200, body })).toBe(false));
  it('refuses non-200 even with an otherwise safe body', () => expect(verify({ statusCode: 503, body: { mode: 'dry_run', claimed: 0, processed: {} } })).toBe(false));
  it('connects success and refusal to distinct terminal paths', () => {
    expect(workflow.connections['Confirm dry-run outcome'].main.map(output => output[0].node)).toEqual(['Dry-run confirmed', 'Refuse unsafe worker response']);
    for (const value of Object.values(workflow.connections)) for (const branch of value.main) for (const connection of branch) expect(workflow.nodes.some(node => node.name === connection.node)).toBe(true);
  });
});
