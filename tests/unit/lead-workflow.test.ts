import { describe, expect, it } from 'vitest';
import { callOutcomes, statusAfterCall, callbackDate, manualLeadSchema, activitySummary } from '../../src/lib/leads/workflow';
import { leadStatuses } from '../../src/lib/domain';

describe('lead call rules adapted for AgencyDesk', () => {
  it('never reopens closed leads through a call or callback', () => {
    for (const outcome of callOutcomes) {
      expect(statusAfterCall('won',outcome)).toBe('won');
      expect(statusAfterCall('lost',outcome)).toBe('lost');
    }
  });
  it('does not regress an advanced stage after contact or no answer', () => {
    for (const stage of ['contacted','qualified','proposal_sent'] as const) {
      expect(statusAfterCall(stage,'connected')).toBe(stage);
      expect(statusAfterCall(stage,'no_answer')).toBe(stage);
      expect(statusAfterCall(stage,'callback')).toBe(stage);
    }
    expect(statusAfterCall('new','connected')).toBe('contacted');
    expect(statusAfterCall('new','no_answer')).toBe('new');
  });
  it('records explicit rejection for open leads', () => {
    for (const stage of leadStatuses.filter(stage=>stage!=='won'&&stage!=='lost')) {
      expect(statusAfterCall(stage,'not_interested')).toBe('lost');
      expect(statusAfterCall(stage,'invalid_number')).toBe('lost');
    }
  });
  it('converts Manila callback times and rejects impossible calendar dates', () => {
    expect(callbackDate('2026-10-20T09:30')).toBe('2026-10-20T01:30:00.000Z');
    expect(callbackDate('')).toBeNull();
    expect(()=>callbackDate('2026-02-30T09:30')).toThrow();
    expect(()=>callbackDate('2026-10-20')).toThrow();
  });
});
describe('lead permissions and activity', () => {
  const contact={contact_name:'  Jane Doe ',email:'JANE@EXAMPLE.TEST',phone:'',service:'Website',brief:'New client site',budget_cents:'10000'};
  it('defaults every manual lead to no messaging permission', () => {
    expect(manualLeadSchema.parse(contact)).toMatchObject({contact_name:'Jane Doe',email:'jane@example.test',source:'manual',email_opt_in:false,whatsapp_opt_in:false,phone:null,owner_id:null,company_id:null});
  });
  it('requires an international number for WhatsApp permission', () => {
    expect(manualLeadSchema.safeParse({...contact,whatsapp_opt_in:'on'}).success).toBe(false);
    expect(manualLeadSchema.safeParse({...contact,phone:'09171234567',whatsapp_opt_in:'on'}).success).toBe(false);
    expect(manualLeadSchema.safeParse({...contact,phone:'+1234567'}).success).toBe(false);
    expect(manualLeadSchema.parse({...contact,phone:'+639171234567',whatsapp_opt_in:'on'}).whatsapp_opt_in).toBe(true);
  });
  it('does not expose arbitrary event details or provider diagnostics', () => {
    expect(activitySummary({event_type:'message_failed',detail:{token:'secret',error:'provider dump'}})).toBe('');
    expect(activitySummary({event_type:'lead_call_logged',detail:{outcome:'no_answer',note:'Try tomorrow',token:'secret'}})).toBe('no answer · Try tomorrow');
  });
});
