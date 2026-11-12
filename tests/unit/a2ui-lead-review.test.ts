import {describe, expect, it} from 'vitest';
import {buildLeadSurface, readLeadAction} from '@/lib/a2ui-lead-review';
import {Catalog, MessageProcessor} from '@a2ui/web_core/v1_0';
import {reviewApi, leadCardApi, leadDetailApi} from '@/lib/a2ui-lead-catalog';
import {LEAD_CATALOG_ID} from '@/lib/a2ui-lead-review';

describe('fictional A2UI lead review', () => {
  it('starts with the four open sample leads in a protocol 1.0 surface', () => {
    const message = buildLeadSurface('open');
    expect(message.version).toBe('1.0');
    expect(message.createSurface.components.filter(component => component.component === 'LeadCard').map(component => component.id)).toEqual(['lead_1', 'lead_2', 'lead_3', 'lead_4']);
    expect(JSON.stringify(message)).not.toMatch(/email|example\.com|https?:\/\/(?!agencydesk\.example\/)/);
  });

  it('filters proposal follow-ups and closed leads without inventing overdue dates', () => {
    expect(buildLeadSurface('proposals').createSurface.components.filter(component => component.component === 'LeadCard').map(component => component.id)).toEqual(['lead_2']);
    expect(buildLeadSurface('closed').createSurface.components.filter(component => component.component === 'LeadCard').map(component => component.id)).toEqual(['lead_5', 'lead_6']);
  });

  it('includes a selected fixture detail only when it belongs to the displayed set', () => {
    const details = buildLeadSurface('open', '1').createSurface.components.filter(component => component.component === 'LeadDetail');
    expect(details).toHaveLength(1);
    expect(details[0]).toMatchObject({name: 'Maya Chen', service: 'Brand & website'});
    expect(() => buildLeadSurface('open', '5')).toThrow();
    expect(() => buildLeadSurface('open', 'unknown')).toThrow();
  });

  it('rejects unknown presets and accepts only well-formed local inspect actions', () => {
    expect(() => buildLeadSurface('send-all' as 'open')).toThrow();
    expect(readLeadAction({surfaceId: 'lead-review', name: 'inspect_lead', context: {leadId: '1'}})).toBe('1');
    for (const action of [null, {}, {surfaceId: 'other', name: 'inspect_lead', context: {leadId: '1'}}, {surfaceId: 'lead-review', name: 'send', context: {leadId: '1'}}, {surfaceId: 'lead-review', name: 'inspect_lead', context: {leadId: 'unknown'}}, {surfaceId: 'lead-review', name: 'inspect_lead', context: {leadId: '1', url: 'https://example.com'}}]) {
      expect(readLeadAction(action)).toBeNull();
    }
  });

  it('validates every preset and detail using the official SDK in separate sessions', () => {
    const catalog = new Catalog(LEAD_CATALOG_ID, '1.0', [reviewApi, leadCardApi, leadDetailApi]);
    for (const preset of ['open', 'proposals', 'closed'] as const) {
      const message = buildLeadSurface(preset);
      const cards = message.createSurface.components.filter(component => component.component === 'LeadCard');
      for (const card of cards) {
        const processor = new MessageProcessor([catalog]);
        expect(processor.getSurfaces().size).toBe(0);
        expect(() => processor.processMessages([buildLeadSurface(preset, card.id.slice(5))])).not.toThrow();
        expect(processor.getSurfaces().size).toBe(1);
        processor.dispose();
      }
    }
  });

  it('rejects unregistered components and exposes no remote functions', () => {
    const catalog = new Catalog(LEAD_CATALOG_ID, '1.0', [reviewApi, leadCardApi, leadDetailApi]);
    const processor = new MessageProcessor([catalog]);
    const message = buildLeadSurface('open');
    const untrusted = JSON.parse(JSON.stringify(message));
    untrusted.createSurface.components[1].component = 'ExecutableHtml';
    expect(() => processor.processMessages([untrusted])).toThrow();
    expect(catalog.functions.size).toBe(0);
    processor.dispose();
  });
});
