'use client';

import React, { useEffect } from 'react';
import Link from 'next/link';

export default function CRMError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error('CRM workspace error boundary caught exception:', error.message || 'Unknown error');
  }, [error]);

  return (
    <div className="min-h-[70vh] flex items-center justify-center p-6">
      <div className="max-w-md w-full p-8 rounded-3xl bg-white dark:bg-zinc-900 border border-gray-200 dark:border-zinc-800 shadow-xl text-center flex flex-col items-center">
        <div className="w-12 h-12 rounded-2xl bg-amber-500/10 text-amber-500 flex items-center justify-center font-bold text-xl mb-4 border border-amber-500/20">
          !
        </div>
        <h2 className="text-xl font-bold text-gray-900 dark:text-white">
          Workspace Temporarily Unavailable
        </h2>
        <p className="text-xs sm:text-sm text-gray-500 dark:text-zinc-400 mt-2 leading-relaxed">
          The CRM workspace encountered a transient connectivity error while retrieving live records. Your data and account permissions remain safe.
        </p>
        {error.digest && (
          <p className="mt-3 text-[11px] font-mono text-gray-400 dark:text-zinc-500 bg-gray-50 dark:bg-zinc-800/50 px-2.5 py-1 rounded-lg">
            Error ID: {error.digest}
          </p>
        )}
        <div className="mt-6 flex items-center gap-3 w-full">
          <button
            onClick={() => reset()}
            className="flex-1 inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl font-bold text-xs uppercase tracking-wider bg-primary hover:bg-primary/90 text-white shadow-md shadow-primary/20 transition-all cursor-pointer"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" strokeWidth="2" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" d="M16.023 9.348h4.992v-.001M2.985 19.644v-4.992m0 0h4.992m-4.993 0 3.181 3.183a8.25 8.25 0 0 0 13.803-3.7M4.031 9.865a8.25 8.25 0 0 1 13.803-3.7l3.181 3.182m0-4.991v4.99" />
            </svg>
            <span>Try Again</span>
          </button>
          <Link
            href="/"
            className="inline-flex items-center justify-center gap-1.5 px-4 py-2.5 rounded-xl font-semibold text-xs text-gray-600 dark:text-zinc-400 hover:bg-gray-100 dark:hover:bg-zinc-800 transition-colors"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" strokeWidth="2" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" d="m2.25 12 8.954-8.955c.44-.439 1.152-.439 1.591 0L21.75 12M4.5 9.75v10.125c0 .621.504 1.125 1.125 1.125H9.75v-4.875c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125V21h4.125c.621 0 1.125-.504 1.125-1.125V9.75M8.25 21h8.25" />
            </svg>
            <span>Home</span>
          </Link>
        </div>
      </div>
    </div>
  );
}
