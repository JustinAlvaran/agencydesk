import { type EmailOtpType } from '@supabase/supabase-js';
import { NextResponse, type NextRequest } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function GET(request: NextRequest) {
  const token_hash = request.nextUrl.searchParams.get('token_hash');
  const type = request.nextUrl.searchParams.get('type');
  if (token_hash && (type === 'invite' || type === 'recovery')) {
    const client = await createClient();
    const { error } = await client.auth.verifyOtp({ token_hash, type: type as EmailOtpType });
    if (!error) return NextResponse.redirect(new URL('/auth/password', request.url));
  }
  return NextResponse.redirect(new URL('/login?error=This+link+is+invalid+or+expired.+Ask+your+administrator+for+a+new+link.', request.url));
}
