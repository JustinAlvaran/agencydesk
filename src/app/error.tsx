"use client";

import React from "react";
import Link from "next/link";

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <div className="min-h-[75vh] bg-white dark:bg-zinc-950 flex items-center justify-center px-4 py-16">
      <div className="max-w-md w-full text-center p-8 rounded-3xl bg-white/90 dark:bg-zinc-900/80 border border-gray-200 dark:border-zinc-800 shadow-xl">
        <span className="inline-block px-3 py-1 rounded-full text-[11px] font-bold uppercase tracking-wider bg-rose-500/10 text-rose-600 dark:text-rose-400 border border-rose-500/20 mb-4">
          Unexpected Error
        </span>
        <h1 className="text-2xl font-extrabold text-gray-900 dark:text-white mb-2">
          Something went wrong
        </h1>
        <p className="text-sm text-gray-600 dark:text-zinc-400 leading-relaxed mb-6">
          We hit an unexpected issue loading this view. Please try again or return to the AgencyDesk
          home page.
        </p>

        {error.digest && (
          <p className="text-[11px] font-mono text-gray-400 dark:text-zinc-500 mb-6">
            Reference: {error.digest}
          </p>
        )}

        <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
          <button
            type="button"
            onClick={() => reset()}
            className="w-full sm:w-auto px-6 py-3 rounded-full font-bold text-xs uppercase tracking-wider bg-primary hover:bg-primary/90 text-white shadow-lg shadow-primary/20 transition-all cursor-pointer"
          >
            Try Again
          </button>
          <Link
            href="/"
            className="w-full sm:w-auto px-6 py-3 rounded-full font-bold text-xs uppercase tracking-wider bg-gray-100 dark:bg-zinc-800 hover:bg-gray-200 dark:hover:bg-zinc-700 text-gray-800 dark:text-zinc-200 transition-all"
          >
            Go Back Home
          </Link>
        </div>
      </div>
    </div>
  );
}
