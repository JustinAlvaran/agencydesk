import { afterEach, describe, expect, it, vi } from 'vitest';
import { NextRequest } from 'next/server';
const { verify } = vi.hoisted(() => ({ verify: vi.fn() }));
vi.mock('@/lib/supabase/server', () => ({ createClient: async () => ({ auth: { verifyOtp: verify } }) }));
import { GET } from '../../src/app/auth/confirm/route';
afterEach(() => { vi.unstubAllEnvs(); vi.clearAllMocks(); });

describe('hosted invitation and recovery redirects', () => {
  it.each(['invite', 'recovery'])('returns %s to the configured host without leaking its token', async type => {
    vi.stubEnv('APP_URL', 'https://agency.example'); verify.mockResolvedValue({ error: null });
    const response = await GET(new NextRequest(`http://internal-host/auth/confirm?type=${type}&token_hash=fictional-token&next=https://untrusted.example`));
    expect(verify).toHaveBeenCalledWith({ type, token_hash: 'fictional-token' });
    expect(response.headers.get('location')).toBe('https://agency.example/auth/password');
    expect(response.headers.get('cache-control')).toBe('private, no-store');
    expect(response.headers.get('referrer-policy')).toBe('no-referrer');
  });
  it('rejects an unsupported token type without verifying it', async () => {
    vi.stubEnv('APP_URL', 'https://agency.example');
    const response = await GET(new NextRequest('http://internal-host/auth/confirm?type=signup&token_hash=fictional-token'));
    expect(verify).not.toHaveBeenCalled();
    expect(response.headers.get('location')).toContain('https://agency.example/login?error=');
    expect(response.headers.get('location')).not.toContain('fictional-token');
  });
});
