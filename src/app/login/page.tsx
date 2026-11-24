"use client";

import React, { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { useWorkspaceLogin } from "@/hooks/use-workspace-login";
import { ArrowLeftIcon, LockClosedIcon, UserIcon, ArrowRightIcon } from "@heroicons/react/24/solid";

const GoogleIcon = () => (
  <svg className="w-4 h-4 shrink-0" viewBox="0 0 24 24">
    <path
      fill="#4285F4"
      d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
    />
    <path
      fill="#34A853"
      d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
    />
    <path
      fill="#FBBC05"
      d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
    />
    <path
      fill="#EA4335"
      d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
    />
  </svg>
);

const GitHubIcon = () => (
  <svg className="w-4 h-4 shrink-0 fill-current" viewBox="0 0 24 24">
    <path
      fillRule="evenodd"
      clipRule="evenodd"
      d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.53 1.032 1.53 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z"
    />
  </svg>
);

export default function LoginPage() {
  const auth = useWorkspaceLogin();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const isSubmitting = auth.pending;
  const statusText = auth.pending ? "Signing in..." : "Sign In to Workspace";
  const handleOAuth = auth.oauth;
  const handleLogin = (e: React.FormEvent) => { e.preventDefault(); auth.login(email, password); };

  return (
    <div className="radial-gradient-bg min-h-screen py-16 px-4 sm:px-6 lg:px-8 flex flex-col justify-center items-center">
      <div className="w-full max-w-md">
        
        <Link
          href="/"
          className="inline-flex items-center gap-2 text-xs font-semibold text-gray-500 hover:text-primary transition-colors mb-8"
        >
          <ArrowLeftIcon className="w-3.5 h-3.5" />
          <span>Back to Home</span>
        </Link>

        <div className="rounded-3xl bg-white/80 dark:bg-zinc-950/85 backdrop-blur-2xl border border-gray-200 dark:border-zinc-800 p-8 sm:p-10 shadow-2xl">
          
          <div className="text-center pb-6 border-b border-gray-200 dark:border-zinc-800">
            <Link href="/" className="inline-block mb-4">
              <Image
                src="/logo/wordmark-dark.svg"
                alt="AgencyDesk"
                width={180}
                height={46}
                className="dark:block hidden w-36 h-auto mx-auto"
              />
              <Image
                src="/logo/wordmark-light.svg"
                alt="AgencyDesk"
                width={180}
                height={46}
                className="block dark:hidden w-36 h-auto mx-auto"
              />
            </Link>
            <h1 className="text-xl font-bold text-gray-900 dark:text-white">
              Sign In to Workspace
            </h1>
            <p className="text-xs text-gray-500 dark:text-zinc-400 mt-1">
              Access staff CRM or client project portal.
            </p>
          </div>

          {/* Google & GitHub SSO Section */}
          <div className="flex flex-col gap-2 mt-6">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <button
                type="button"
                disabled={isSubmitting}
                onClick={() => handleOAuth("Google")}
                className="
                  flex items-center justify-center gap-2 px-3.5 py-2.5 rounded-xl
                  bg-white dark:bg-zinc-900 border border-gray-300 dark:border-zinc-700/80
                  hover:border-primary/80 dark:hover:border-primary/80
                  text-xs font-semibold text-gray-800 dark:text-zinc-200
                  hover:bg-gray-50 dark:hover:bg-zinc-850
                  shadow-xs hover:shadow-sm
                  transition-[transform,border-color,background-color] duration-150 ease-[cubic-bezier(0.32,0.72,0,1)]
                  active:scale-[0.96] cursor-pointer
                "
              >
                <GoogleIcon />
                <span>Google</span>
              </button>

              <button
                type="button"
                disabled={isSubmitting}
                onClick={() => handleOAuth("GitHub")}
                className="
                  flex items-center justify-center gap-2 px-3.5 py-2.5 rounded-xl
                  bg-white dark:bg-zinc-900 border border-gray-300 dark:border-zinc-700/80
                  hover:border-primary/80 dark:hover:border-primary/80
                  text-xs font-semibold text-gray-800 dark:text-zinc-200
                  hover:bg-gray-50 dark:hover:bg-zinc-850
                  shadow-xs hover:shadow-sm
                  transition-[transform,border-color,background-color] duration-150 ease-[cubic-bezier(0.32,0.72,0,1)]
                  active:scale-[0.96] cursor-pointer
                "
              >
                <GitHubIcon />
                <span>GitHub</span>
              </button>
            </div>

            <p className="text-[11px] text-gray-500 dark:text-zinc-400 text-center mt-1">
              Enterprise SSO for verified agency team members
            </p>

            {/* Divider */}
            <div className="relative my-3">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-gray-200 dark:border-zinc-800" />
              </div>
              <div className="relative flex justify-center text-[10px] uppercase font-bold tracking-wider">
                <span className="bg-white/80 dark:bg-zinc-950 px-3 text-gray-400 dark:text-zinc-500">
                  Or continue with email
                </span>
              </div>
            </div>
          </div>

          <form onSubmit={handleLogin} className="flex flex-col gap-4">
            {auth.error && (
              <div role="alert" className="p-3.5 rounded-2xl bg-primary/10 border border-primary/20 text-xs text-primary flex flex-col gap-1.5">
                <span className="font-semibold">{auth.error}</span>
                {(auth.error.toLowerCase().includes('provider') || auth.error.toLowerCase().includes('cancel') || auth.error.toLowerCase().includes('workspace sign-in')) && (
                  <p className="text-[11px] text-gray-600 dark:text-zinc-400 pt-1 border-t border-primary/15">
                    Enterprise SSO is active for verified workspace members. Sign in with your registered email and password below.
                  </p>
                )}
              </div>
            )}
            <div>
              <label className="block text-xs font-semibold text-gray-700 dark:text-zinc-300 mb-1.5">
                Email Address
              </label>
              <div className="relative">
                <UserIcon className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="email"
                  placeholder="you@company.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full h-11 pl-9 pr-4 rounded-xl bg-gray-50 dark:bg-zinc-900 border border-gray-300 dark:border-zinc-700 text-xs text-gray-900 dark:text-white focus:outline-none focus:border-primary font-mono"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-gray-700 dark:text-zinc-300 mb-1.5">
                Password
              </label>
              <div className="relative">
                <LockClosedIcon className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="password"
                  placeholder="••••••••"
                  autoComplete="current-password" maxLength={128}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full h-11 pl-9 pr-4 rounded-xl bg-gray-50 dark:bg-zinc-900 border border-gray-300 dark:border-zinc-700 text-xs text-gray-900 dark:text-white focus:outline-none focus:border-primary font-mono"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full py-3.5 rounded-full font-bold text-xs uppercase tracking-wider bg-primary hover:bg-primary/90 text-white shadow-lg shadow-primary/20 transition-all mt-2 active:scale-[0.96] cursor-pointer"
            >
              {statusText}
            </button>
          </form>

          {/* Quick Demo Access Buttons */}
          <div className="mt-8 pt-6 border-t border-gray-200 dark:border-zinc-800 flex flex-col gap-2.5">
            <span className="text-[10px] font-bold uppercase tracking-wider text-gray-400 text-center block mb-1">
              Quick Admin &amp; Staff Access
            </span>
            <Link
              href="/crm-admin"
              className="w-full flex items-center justify-between p-3 rounded-xl bg-primary/10 border border-primary/25 text-xs font-semibold text-primary hover:bg-primary hover:text-white transition-all group"
            >
              <span>Launch /crm-admin Gateway</span>
              <ArrowRightIcon className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
            </Link>
            <Link
              href="/portal"
              className="w-full flex items-center justify-between p-3 rounded-xl bg-gray-50 dark:bg-zinc-900/80 border border-gray-200 dark:border-zinc-800 text-xs font-semibold text-gray-800 dark:text-gray-200 hover:border-primary/50 transition-colors"
            >
              <span>Client Portal Demo</span>
              <ArrowRightIcon className="w-3.5 h-3.5 text-primary" />
            </Link>
          </div>

        </div>

      </div>
    </div>
  );
}
