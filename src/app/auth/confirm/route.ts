import { type EmailOtpType } from '@supabase/supabase-js';
import { NextResponse, type NextRequest } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function GET(request: NextRequest) {
  const origin = process.env.APP_URL ?? request.nextUrl.origin;
  const finish = (path: string) => {
    const response = NextResponse.redirect(new URL(path, origin));
    response.headers.set('Cache-Control', 'private, no-store');
    response.headers.set('Referrer-Policy', 'no-referrer');
    return response;
  };
  const token_hash = request.nextUrl.searchParams.get('token_hash');
  const type = request.nextUrl.searchParams.get('type');
  if (token_hash && (type === 'invite' || type === 'recovery')) {
    const client = await createClient();
    const { error } = await client.auth.verifyOtp({ token_hash, type: type as EmailOtpType });
    if (!error) return finish('/auth/password');
  }
  return finish('/login?error=This+link+is+invalid+or+expired.+Ask+your+administrator+for+a+new+link.');
}
