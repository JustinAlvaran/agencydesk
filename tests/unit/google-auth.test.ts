import { beforeEach, describe, expect, it, vi } from 'vitest';
import { NextRequest } from 'next/server';

const mocks = vi.hoisted(() => ({
  exchange: vi.fn(), user: vi.fn(), signOut: vi.fn(), destination: vi.fn(),
}));
vi.mock('@/lib/supabase/server', () => ({ createClient: async () => ({ auth: {
  exchangeCodeForSession: mocks.exchange, getUser: mocks.user, signOut: mocks.signOut,
} }) }));
vi.mock('@/lib/login-destination', () => ({ loginDestination: mocks.destination }));
import { GET } from '@/app/auth/callback/route';

describe('Google OAuth callback boundaries', () => {
  beforeEach(() => {
    vi.resetAllMocks();
    vi.stubEnv('APP_MODE', 'live');
    vi.stubEnv('APP_URL', 'https://agencydesk.example');
    mocks.exchange.mockResolvedValue({ error: null });
    mocks.user.mockResolvedValue({ data: { user: { id: 'verified-user' } }, error: null });
    mocks.signOut.mockResolvedValue({ error: null });
    mocks.destination.mockResolvedValue('/crm');
  });
  it('ignores user-controlled return URLs and redirects only after verified access', async () => {
    const response = await GET(new NextRequest('https://untrusted.example/auth/callback?code=valid&next=https://evil.example'));
    expect(response.headers.get('location')).toBe('https://agencydesk.example/crm');
    expect(response.headers.get('cache-control')).toBe('private, no-store');
    expect(response.headers.get('referrer-policy')).toBe('no-referrer');
    expect(mocks.destination).toHaveBeenCalledWith(expect.anything(), 'verified-user');
  });
  it('does not exchange a cancelled or missing authorization code', async () => {
    const response = await GET(new NextRequest('https://agencydesk.example/auth/callback?error=access_denied&error_description=private-detail'));
    expect(response.headers.get('location')).toContain('/login?error=');
    expect(response.headers.get('location')).not.toContain('private-detail');
    expect(mocks.exchange).not.toHaveBeenCalled();
  });
  it('denies users without active membership and clears the session', async () => {
    mocks.destination.mockResolvedValue(null);
    const response = await GET(new NextRequest('https://agencydesk.example/auth/callback?code=valid'));
    expect(response.headers.get('location')).toContain('No+active+workspace+access');
    expect(mocks.signOut).toHaveBeenCalledOnce();
    expect(mocks.signOut).toHaveBeenCalledWith({ scope: 'local' });
  });
  it('does not check membership after an invalid code', async () => {
    mocks.exchange.mockResolvedValue({ error: { message: 'private-provider-error' } });
    const response = await GET(new NextRequest('https://agencydesk.example/auth/callback?code=invalid'));
    expect(response.headers.get('location')).toContain('/login?error=');
    expect(response.headers.get('location')).not.toContain('private-provider-error');
    expect(mocks.destination).not.toHaveBeenCalled();
  });
  it('fails closed when permission reads fail', async () => {
    mocks.destination.mockRejectedValue(new Error('private-database-detail'));
    const response = await GET(new NextRequest('https://agencydesk.example/auth/callback?code=valid'));
    expect(response.headers.get('location')).toContain('Could+not+verify+workspace+access');
    expect(mocks.signOut).toHaveBeenCalledOnce();
    expect(mocks.signOut).toHaveBeenCalledWith({ scope: 'local' });
  });
  it('keeps fixture previews independent of production OAuth', async () => {
    vi.stubEnv('APP_MODE', 'demo');
    const response = await GET(new NextRequest('https://agencydesk.example/auth/callback?code=valid'));
    expect(response.headers.get('location')).toBe('https://agencydesk.example/demo');
    expect(mocks.exchange).not.toHaveBeenCalled();
  });
});
