import { NextResponse, type NextRequest } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { isDemo } from '@/lib/env';
import { loginDestination } from '@/lib/login-destination';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  const origin = process.env.APP_URL ?? request.nextUrl.origin;
  const finish = (path: string) => {
    const response = NextResponse.redirect(new URL(path, origin));
    response.headers.set('Cache-Control', 'private, no-store');
    response.headers.set('Referrer-Policy', 'no-referrer');
    return response;
  };
  if (isDemo()) return finish('/demo');
  const code = request.nextUrl.searchParams.get('code');
  if (!code || request.nextUrl.searchParams.has('error')) {
    return finish('/login?error=Google+sign-in+was+cancelled+or+could+not+complete.+Please+try+again.');
  }
  const supabase = await createClient();
  try {
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    if (error) return finish('/login?error=Google+sign-in+expired+or+failed.+Please+try+again.');
    const { data, error: identityError } = await supabase.auth.getUser();
    if (identityError || !data.user) {
      await supabase.auth.signOut({ scope: 'local' });
      return finish('/login?error=Could+not+verify+your+sign-in.+Please+try+again.');
    }
    const destination = await loginDestination(supabase, data.user.id);
    if (!destination) {
      await supabase.auth.signOut({ scope: 'local' });
      return finish('/login?error=No+active+workspace+access.+Contact+your+administrator.');
    }
    return finish(destination);
  } catch {
    await supabase.auth.signOut({ scope: 'local' });
    return finish('/login?error=Could+not+verify+workspace+access.+Please+try+again.');
  }
}

