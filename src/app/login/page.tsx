import Link from 'next/link';

import { signIn, signInWithGoogle } from './actions';
import { isDemo } from '@/lib/env';

export default async function Login({ searchParams }: { searchParams: Promise<{ error?: string }> }) {
  const { error } = await searchParams;
  return <main id="main-content" className="auth-screen"><Link className="auth-back" href="/">Back to home</Link><section className="auth-card"><h1>Sign in</h1><p>Sign in to your agency workspace or client portal.</p>{isDemo() ? <div className="mt-8"><p className="mb-5">This deployment is a read-only portfolio demo. Explore the workspace without an account.</p><Link className="primary-button" href="/demo">Explore demo</Link></div> : <><form action={signInWithGoogle}><button className="secondary-button" type="submit">Continue with Google</button></form><form action={signIn} className="auth-form"><label htmlFor="email">Email address</label><input id="email" name="email" type="email" autoComplete="email" required /><label htmlFor="password">Password</label><input id="password" name="password" type="password" minLength={8} autoComplete="current-password" required />{error && <p role="alert" className="text-red-400">{error}</p>}<button className="primary-button" type="submit">Sign in</button><p className="text-sm">Need access or a password reset? Contact your agency administrator for a private invitation or recovery link.</p></form></>}<Link className="mt-6 inline-block text-sm " href="/demo">Explore the read-only demo</Link></section></main>;
}
