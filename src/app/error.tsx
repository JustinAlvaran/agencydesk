'use client';
import Link from 'next/link';

export default function ErrorBoundary({ reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return <main id="main-content" className="auth-screen"><section className="auth-card"><h1>Something went wrong.</h1><p>We couldn’t load this page. Please try again.</p><button className="primary-button mt-6" onClick={reset}>Try again</button><Link className="mt-4 block underline" href="/demo">Open the demo workspace</Link></section></main>;
}

