import React from "react";
import Link from "next/link";
import { ArrowLeftIcon } from "@heroicons/react/24/solid";

export function AccountShell({ children }: { children: React.ReactNode }) {
  return (
    <div className="radial-gradient-bg min-h-screen py-16 px-4 sm:px-6 lg:px-8 flex flex-col justify-center items-center">
      <div className="w-full max-w-md">
        <Link
          href="/"
          className="inline-flex items-center gap-2 text-xs font-semibold text-gray-500 hover:text-primary transition-colors mb-6"
        >
          <ArrowLeftIcon className="w-3.5 h-3.5" />
          <span>Back to Home</span>
        </Link>

        <div className="rounded-3xl bg-white/80 dark:bg-zinc-950/80 backdrop-blur-2xl border border-gray-200 dark:border-zinc-800 p-8 shadow-2xl">
          {children}
        </div>
      </div>
    </div>
  );
}
