import Link from 'next/link';
import { AccountShell } from '@/components/account-shell';
import { PasswordField } from '@/components/password-field';
import { signIn, signInWithGoogle } from './actions';
import { isDemo } from '@/lib/env';

export const metadata = { title: 'Sign in', robots: { index: false, follow: false } };

export default async function Login({ searchParams }: { searchParams: Promise<{ error?: string }> }) {
  const { error } = await searchParams;
  return <AccountShell><h1>Sign in</h1><p>Sign in to your agency workspace or client portal.</p>
    {isDemo() ? <div className="account-demo"><h2>Take a look around</h2><p>This is a read-only demo with fictional records. No account or password needed.</p><Link className="primary-button" href="/demo">Explore the workspace</Link><Link className="secondary-button" href="/demo/portal">View the client experience</Link></div> : <>
      <form action={signIn} className="auth-form"><label htmlFor="email">Email address</label><input id="email" name="email" type="email" autoComplete="email" required/><PasswordField id="password" label="Password"/>{error && <p role="alert" className="error-text">{error}</p>}<button className="primary-button" type="submit">Sign in</button></form>
      <p className="account-help">Forgot your password? Ask your agency administrator for a private recovery link.</p>
      <form action={signInWithGoogle}><button className="secondary-button" type="submit">Continue with Google</button></form>
    </>}
    <p className="account-help">New to the workspace? Staff and clients join by invitation. <Link href="/inquire">Contact the agency</Link> for access.</p>
    {!isDemo() && <p className="account-help"><Link href="/demo">Explore the read-only demo</Link></p>}
  </AccountShell>;
}
