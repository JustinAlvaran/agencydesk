import { describe, expect, it } from 'vitest';
import fixtures from '../../content/fixtures.json';
import { websiteContentSchema, sampleProjectSchema } from '../../src/lib/website-schema';
describe('website content contract', () => {
  it('accepts the original fictional content without credentials', () => {
    expect(websiteContentSchema.parse(fixtures).services).toHaveLength(3);
  });
  it('rejects CMS-controlled navigation destinations', () => {
    expect(sampleProjectSchema.safeParse({ ...fixtures.sample_projects[0], scenario: 'https://attacker.example' }).success).toBe(false);
  });
  it('rejects missing required copy and oversized lists', () => {
    expect(websiteContentSchema.safeParse({ ...fixtures, home_page: { ...fixtures.home_page, heading: '' } }).success).toBe(false);
    expect(websiteContentSchema.safeParse({ ...fixtures, services: Array(101).fill(fixtures.services[0]) }).success).toBe(false);
  });
});

