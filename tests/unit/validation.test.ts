import { describe,it,expect } from 'vitest';
import { inquirySchema } from '../../src/lib/validation';
import { money,statusLabel } from '../../src/lib/domain';

const valid = {contact_name:'  Riley North  ',email:'riley@example.com',service:'Website development',brief:'We need a new booking website.',budget_cents:450000};
describe('inquiry validation',()=>{
  it('normalizes names and email before validation',()=>{expect(inquirySchema.parse(valid).contact_name).toBe('Riley North');expect(inquirySchema.parse({...valid,email:'  RILEY@Example.com  '}).email).toBe('riley@example.com');expect(inquirySchema.safeParse({...valid,contact_name:'   '}).success).toBe(false);});
  it('rejects malformed email, fractional cents, and impossible budgets',()=>{for(const patch of [{email:'invalid'},{budget_cents:10.5},{budget_cents:-1},{budget_cents:100000001}])expect(inquirySchema.safeParse({...valid,...patch}).success).toBe(false);});
  it('rejects honeypot values and oversized briefs',()=>{expect(inquirySchema.safeParse({...valid,website:'spam'}).success).toBe(false);expect(inquirySchema.safeParse({...valid,brief:'x'.repeat(4001)}).success).toBe(false);});
  it('requires at least 20 brief characters after trimming',()=>{expect(inquirySchema.safeParse({...valid,brief:' '.repeat(10)+'x'.repeat(19)+' '.repeat(10)}).success).toBe(false);expect(inquirySchema.safeParse({...valid,brief:'  '+'x'.repeat(20)+'  '}).success).toBe(true);});
});
describe('presentation helpers',()=>{it('formats USD cents and pipeline labels',()=>{expect(money(450000)).toBe('$4,500');expect(statusLabel('proposal_sent')).toBe('Proposal Sent');});});
