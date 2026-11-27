import { describe, it, expect, vi, beforeEach } from 'vitest';
import crypto from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';

vi.mock('server-only', () => ({}));

import nextConfig from '../../next.config';
import sitemap from '@/app/sitemap';
import robots from '@/app/robots';
import { GET as healthGet } from '@/app/api/health/route';
import { POST as calcomWebhookPost } from '@/app/api/webhooks/calcom/route';

describe('Production Readiness, SEO, Security Headers & Cal.com Integration', () => {
  beforeEach(() => {
    vi.unstubAllEnvs();
    vi.restoreAllMocks();
  });

  describe('1. Zero legacy CITC branding in legal, 404, and SEO files', () => {
    const filesToCheck = [
      'src/app/privacy-policy/page.tsx',
      'src/app/terms-of-service/page.tsx',
      'src/app/not-found.tsx',
      'src/utils/seoMetadata.ts',
    ];

    it.each(filesToCheck)('%s contains zero legacy CITC domains or emails', (relPath) => {
      const fullPath = path.resolve(process.cwd(), relPath);
      expect(fs.existsSync(fullPath)).toBe(true);
      const content = fs.readFileSync(fullPath, 'utf8');

      expect(content).not.toMatch(/citc-ph\.com/i);
      expect(content).not.toMatch(/CITC IT Website/i);
      expect(content).not.toMatch(/support@citc-ph\.com/i);
      expect(content).not.toMatch(/privacy@citc-ph\.com/i);
    });
  });

  describe('2. Next.js Security Headers & Config', () => {
    it('exports poweredByHeader: false and security headers on /:path*', async () => {
      expect(nextConfig.poweredByHeader).toBe(false);
      expect(typeof nextConfig.headers).toBe('function');

      const headerRules = await nextConfig.headers!();
      expect(headerRules.length).toBeGreaterThanOrEqual(1);

      const catchAll = headerRules.find((r) => r.source === '/:path*');
      expect(catchAll).toBeDefined();

      const map = new Map(catchAll!.headers.map((h) => [h.key, h.value]));
      expect(map.get('X-Frame-Options')).toBe('DENY');
      expect(map.get('X-Content-Type-Options')).toBe('nosniff');
      expect(map.get('Referrer-Policy')).toBe('strict-origin-when-cross-origin');
      expect(map.get('Strict-Transport-Security')).toContain('max-age=63072000');
    });
  });

  describe('3. Sitemap & Robots Metadata Routes', () => {
    it('sitemap includes public routes including /book, /privacy-policy, and /terms-of-service', () => {
      const entries = sitemap();
      const urls = entries.map((e) => e.url);

      expect(urls.some((u) => u.endsWith('/'))).toBe(true);
      expect(urls.some((u) => u.endsWith('/inquire'))).toBe(true);
      expect(urls.some((u) => u.endsWith('/book'))).toBe(true);
      expect(urls.some((u) => u.endsWith('/privacy-policy'))).toBe(true);
      expect(urls.some((u) => u.endsWith('/terms-of-service'))).toBe(true);
      expect(urls.some((u) => u.includes('/crm'))).toBe(false);
    });

    it('robots disallows /crm/, /portal/, and /api/ while allowing /', () => {
      const config = robots();
      const rules = Array.isArray(config.rules) ? config.rules : [config.rules];
      const wildcard = rules.find((r) => r.userAgent === '*');
      expect(wildcard).toBeDefined();
      expect(wildcard!.allow).toBe('/');

      const disallowed = Array.isArray(wildcard!.disallow)
        ? wildcard!.disallow
        : [wildcard!.disallow];
      expect(disallowed).toContain('/api/');
      expect(disallowed).toContain('/crm/');
      expect(disallowed).toContain('/portal/');
      expect(config.sitemap).toMatch(/\/sitemap\.xml$/);
    });
  });

  describe('4. /api/health endpoint', () => {
    it('returns 200 { ok: true } with Cache-Control: no-store and zero secrets', async () => {
      const res = await healthGet();
      expect(res.status).toBe(200);
      expect(res.headers.get('Cache-Control')).toContain('no-store');

      const data = await res.json();
      expect(data.ok).toBe(true);
      expect(data.service).toBe('agencydesk');
      expect(['demo', 'live']).toContain(data.mode);
      expect(typeof data.timestamp).toBe('string');

      const serialized = JSON.stringify(data);
      expect(serialized).not.toMatch(/SUPABASE|SECRET|KEY|TOKEN/i);
    });
  });

  describe('5. /api/webhooks/calcom HMAC-SHA256 verification & payload handling', () => {
    const sampleBooking = {
      triggerEvent: 'BOOKING_CREATED',
      payload: {
        uid: 'cal-uid-12345',
        title: 'AgencyDesk 20-Min Discovery Call',
        startTime: '2026-12-01T10:00:00.000Z',
        attendees: [
          {
            name: 'Justin Alvaran',
            email: 'justin@agencydesk.com',
            phoneNumber: '09913780170',
          },
        ],
        videoCallData: {
          url: 'https://meet.google.com/abc-defg-hij',
        },
        responses: {
          company: { value: 'AgencyDesk Co' },
        },
      },
    };

    it('fails closed with 401 in live mode when CALCOM_WEBHOOK_SECRET is missing', async () => {
      vi.stubEnv('NEXT_PUBLIC_SUPABASE_URL', 'https://example.supabase.co');
      vi.stubEnv('NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY', 'test-anon-key');
      vi.stubEnv('CALCOM_WEBHOOK_SECRET', '');

      const req = new Request('http://localhost:3000/api/webhooks/calcom', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(sampleBooking),
      });

      const res = await calcomWebhookPost(req);
      expect(res.status).toBe(401);
    });

    it('rejects invalid X-Cal-Signature-256 with 401 when secret is configured', async () => {
      vi.stubEnv('CALCOM_WEBHOOK_SECRET', 'cal-secret-xyz');

      const req = new Request('http://localhost:3000/api/webhooks/calcom', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Cal-Signature-256': '0'.repeat(64),
        },
        body: JSON.stringify(sampleBooking),
      });

      const res = await calcomWebhookPost(req);
      expect(res.status).toBe(401);
    });

    it('accepts valid HMAC-SHA256 signed payload in demo mode and returns normalized fields', async () => {
      const secret = 'cal-secret-xyz';
      vi.stubEnv('CALCOM_WEBHOOK_SECRET', secret);
      const rawBody = JSON.stringify(sampleBooking);
      const sig = crypto.createHmac('sha256', secret).update(rawBody, 'utf8').digest('hex');

      const req = new Request('http://localhost:3000/api/webhooks/calcom', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Cal-Signature-256': sig,
        },
        body: rawBody,
      });

      const res = await calcomWebhookPost(req);
      expect(res.status).toBe(200);
      const data = await res.json();
      expect(data.success).toBe(true);
      expect(data.mode).toBe('demo');
      expect(data.event_type).toBe('calcom_booking_created');
      expect(data.booking_uid).toBe('cal-uid-12345');
      expect(data.attendee_email).toBe('justin@agencydesk.com');
      expect(data.meeting_url).toBe('https://meet.google.com/abc-defg-hij');
    });
  });

  describe('6. n8n Post-Lead Lifecycle Workflow Cal.com support', () => {
    it('supports calcom_booking_created with zero $env references', () => {
      const wfPath = path.resolve(
        process.cwd(),
        'infra/n8n/workflows/agencydesk-post-lead-lifecycle.json'
      );
      const raw = fs.readFileSync(wfPath, 'utf8');
      expect(raw).not.toMatch(/\$env\b/);
      expect(raw).toContain('calcom_booking_created');

      const wf = JSON.parse(raw) as { nodes: Array<{ name: string }> };
      expect(Array.isArray(wf.nodes)).toBe(true);
      expect(wf.nodes.length).toBeGreaterThanOrEqual(30);
    });
  });
});
