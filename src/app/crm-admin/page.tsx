"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useWorkspaceLogin } from "@/hooks/use-workspace-login";
import {
  ShieldCheckIcon,
  KeyIcon,
  LockClosedIcon,
  UserIcon,
  ArrowRightIcon,
  ArrowLeftIcon,
  CheckCircleIcon,
  Squares2X2Icon,
  ChartBarIcon,
  DocumentTextIcon,
  UserGroupIcon,
  RocketLaunchIcon,
  BoltIcon,
  EyeIcon,
  EyeSlashIcon,
} from "@heroicons/react/24/solid";

const crmModules = [
  {
    href: "/crm/leads",
    title: "Pipeline Kanban",
    tag: "Core CRM",
    description: "Visual deal stages, weighted pipeline, and live drag-and-drop opportunity cards.",
    icon: Squares2X2Icon,
    color: "text-blue-500 bg-blue-500/10 border-blue-500/20",
  },
  {
    href: "/crm",
    title: "Executive Dashboard",
    tag: "Metrics & KPIs",
    description: "Agency pipeline, proposal values, and project progress.",
    icon: ChartBarIcon,
    color: "text-emerald-500 bg-emerald-500/10 border-emerald-500/20",
  },
  {
    href: "/crm/proposals",
    title: "Proposals & Pricing",
    tag: "Scope Engine",
    description: "Versioned fixed-price contracts, milestone schedules, and immutable client agreements.",
    icon: DocumentTextIcon,
    color: "text-purple-500 bg-purple-500/10 border-purple-500/20",
  },
  {
    href: "/crm/contacts",
    title: "Contacts & Accounts",
    tag: "Directory",
    description: "Multi-tenant company directory, client stakeholders, email communications, and touchpoints.",
    icon: UserGroupIcon,
    color: "text-amber-500 bg-amber-500/10 border-amber-500/20",
  },
  {
    href: "/crm/projects",
    title: "Sprint Project Delivery",
    tag: "Client Portal Sync",
    description: "Active sprint burndowns, deliverable approvals, and client portal milestone gates.",
    icon: RocketLaunchIcon,
    color: "text-primary bg-primary/10 border-primary/20",
  },
  {
    href: "/crm/automations",
    title: "Event Outbox & Automations",
    tag: "System Engine",
    description: "Transactional outbox events, automated follow-ups, and webhook dispatch telemetry.",
    icon: BoltIcon,
    color: "text-rose-500 bg-rose-500/10 border-rose-500/20",
  },
];

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

export default function CRMAdminPage() {
  const auth = useWorkspaceLogin();
  const [username, setUsername] = useState("admin@agencydesk.com");
  const [password, setPassword] = useState("admin123");
  const [showPassword, setShowPassword] = useState(false);
  const [activeTab, setActiveTab] = useState<"login" | "modules">("login");
  const isAuthenticating = auth.pending;
  const authStatusText = auth.pending ? "Signing in..." : "Sign In to Workspace";
  const handleOAuth = auth.oauth;
  const handleAdminAuth = (e: React.FormEvent) => { e.preventDefault(); auth.login(username, password); };

  return (
    <div className="radial-gradient-bg min-h-screen py-12 px-4 sm:px-6 lg:px-8 flex flex-col justify-center items-center">
      
      {/* Top Navigation Row */}
      <div className="w-full max-w-4xl flex items-center justify-between mb-8">
        <Link
          href="/"
          className="inline-flex items-center gap-2 text-xs font-semibold text-gray-500 hover:text-primary transition-colors"
        >
          <ArrowLeftIcon className="w-3.5 h-3.5" />
          <span>Back to Landing Page</span>
        </Link>

        <div className="flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
          <span className="text-[11px] font-mono text-gray-400 dark:text-zinc-500">
            GATEWAY_NODE: US-EAST-01 · SSL_VERIFIED
          </span>
        </div>
      </div>

      {/* Main Admin Console Container */}
      <div className="w-full max-w-4xl rounded-3xl bg-white/80 dark:bg-zinc-950/90 backdrop-blur-2xl border border-gray-200 dark:border-zinc-800 p-6 sm:p-10 shadow-2xl relative overflow-hidden">
        
        {/* Decorative Top Accent Glow */}
        <div className="absolute top-0 inset-x-0 h-1 bg-gradient-to-r from-transparent via-primary to-transparent" />

        {/* Header Block */}
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between pb-8 border-b border-gray-200 dark:border-zinc-800/80 gap-6">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-2xl bg-primary/10 border border-primary/25 text-primary flex items-center justify-center shrink-0 shadow-lg shadow-primary/15">
              <ShieldCheckIcon className="w-8 h-8" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
                  CRM Admin Gateway
                </h1>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-primary/15 text-primary border border-primary/30">
                  /crm-admin
                </span>
              </div>
              <p className="text-xs text-gray-500 dark:text-zinc-400 mt-1">
                Root administration console for AgencyDesk sales pipelines, client contracts &amp; outbox leases.
              </p>
            </div>
          </div>

          {/* View Mode Switcher */}
          <div className="flex items-center p-1 rounded-2xl bg-gray-100 dark:bg-zinc-900 border border-gray-200 dark:border-zinc-800 self-stretch md:self-auto justify-center">
            <button
              type="button"
              onClick={() => setActiveTab("login")}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold uppercase tracking-wider transition-all ${
                activeTab === "login"
                  ? "bg-primary text-white shadow-md shadow-primary/20"
                  : "text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white"
              }`}
            >
              <KeyIcon className="w-3.5 h-3.5" />
              <span>Admin Auth</span>
            </button>
            <button
              type="button"
              onClick={() => setActiveTab("modules")}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold uppercase tracking-wider transition-all ${
                activeTab === "modules"
                  ? "bg-primary text-white shadow-md shadow-primary/20"
                  : "text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white"
              }`}
            >
              <Squares2X2Icon className="w-3.5 h-3.5" />
              <span>Modules Directory</span>
            </button>
          </div>
        </div>

        {/* Tab 1: Admin Authentication Form */}
        {activeTab === "login" && (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 pt-8">
            
            {/* Left 7 Cols: Login Controls */}
            <form onSubmit={handleAdminAuth} className="lg:col-span-7 flex flex-col gap-4">
            {auth.error && <p role="alert" className="text-sm text-primary">{auth.error}</p>}
              
              {/* Google & GitHub OAuth SSO Section */}
              <div className="flex flex-col gap-2">
                <span className="text-[10px] font-bold uppercase tracking-wider text-gray-500 dark:text-zinc-400">
                  Fast SSO Authentication
                </span>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <button
                    type="button"
                    disabled={isAuthenticating}
                    onClick={() => handleOAuth("Google")}
                    className="
                      flex items-center justify-center gap-2.5 px-4 py-3 rounded-xl
                      bg-white dark:bg-zinc-900 border border-gray-300 dark:border-zinc-700/80
                      hover:border-primary/80 dark:hover:border-primary/80
                      text-xs font-semibold text-gray-800 dark:text-zinc-200
                      hover:bg-gray-50 dark:hover:bg-zinc-850
                      shadow-xs hover:shadow-sm
                      transition-[transform,border-color,background-color,box-shadow] duration-150 ease-[cubic-bezier(0.32,0.72,0,1)]
                      active:scale-[0.96] cursor-pointer group
                    "
                  >
                    <GoogleIcon />
                    <span>Sign in with Google</span>
                  </button>

                  <button
                    type="button"
                    disabled={isAuthenticating}
                    onClick={() => handleOAuth("GitHub")}
                    className="
                      flex items-center justify-center gap-2.5 px-4 py-3 rounded-xl
                      bg-white dark:bg-zinc-900 border border-gray-300 dark:border-zinc-700/80
                      hover:border-primary/80 dark:hover:border-primary/80
                      text-xs font-semibold text-gray-800 dark:text-zinc-200
                      hover:bg-gray-50 dark:hover:bg-zinc-850
                      shadow-xs hover:shadow-sm
                      transition-[transform,border-color,background-color,box-shadow] duration-150 ease-[cubic-bezier(0.32,0.72,0,1)]
                      active:scale-[0.96] cursor-pointer group
                    "
                  >
                    <GitHubIcon />
                    <span>Sign in with GitHub</span>
                  </button>
                </div>

                {/* Divider */}
                <div className="relative my-2">
                  <div className="absolute inset-0 flex items-center">
                    <div className="w-full border-t border-gray-200 dark:border-zinc-800" />
                  </div>
                  <div className="relative flex justify-center text-[10px] uppercase font-bold tracking-wider">
                    <span className="bg-white/80 dark:bg-zinc-950 px-3 text-gray-400 dark:text-zinc-500">
                      Or authenticate with master passkey
                    </span>
                  </div>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-700 dark:text-zinc-300 mb-1.5">
                  Email Address
                </label>
                <div className="relative">
                  <UserIcon className="w-4 h-4 text-gray-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    type="email" autoComplete="username"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    required
                    placeholder="you@company.com"
                    className="w-full h-11 pl-10 pr-4 rounded-xl bg-gray-50 dark:bg-zinc-900 border border-gray-300 dark:border-zinc-700 text-xs text-gray-900 dark:text-white focus:outline-none focus:border-primary transition-colors font-mono"
                  />
                </div>
              </div>

              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="text-xs font-semibold text-gray-700 dark:text-zinc-300">
                    Password
                  </label>
                  <span className="text-[10px] text-gray-400 font-mono">
                    SUPABASE AUTH
                  </span>
                </div>
                <div className="relative">
                  <LockClosedIcon className="w-4 h-4 text-gray-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    type={showPassword ? "text" : "password"}
                    autoComplete="current-password" maxLength={128}
                  value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    className="w-full h-11 pl-10 pr-10 rounded-xl bg-gray-50 dark:bg-zinc-900 border border-gray-300 dark:border-zinc-700 text-xs text-gray-900 dark:text-white focus:outline-none focus:border-primary transition-colors font-mono"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-200"
                  >
                    {showPassword ? (
                      <EyeSlashIcon className="w-4 h-4" />
                    ) : (
                      <EyeIcon className="w-4 h-4" />
                    )}
                  </button>
                </div>
              </div>

              <p className="text-xs text-gray-500">Admin test login: <span className="font-mono text-primary font-bold">admin@agencydesk.com</span> / <span className="font-mono text-primary font-bold">admin123</span></p>
              {/* Charles Liu / Emil Kowalski Dual-Arrow Conveyor Submit Button */}
              <button
                type="submit"
                disabled={isAuthenticating}
                className="
                  group relative w-full overflow-hidden inline-flex items-center justify-center select-none
                  rounded-full font-semibold text-xs uppercase tracking-wider text-white
                  bg-primary hover:bg-primary/90
                  py-4 px-6 gap-2 mt-3
                  shadow-[0_0_0_1px_rgba(0,0,0,0.1),0_2px_4px_rgba(0,0,0,0.08),0_12px_24px_-6px_oklch(65.32%_0.233_25.74_/_0.35)]
                  hover:shadow-[0_0_0_1px_rgba(0,0,0,0.15),0_4px_8px_rgba(0,0,0,0.12),0_16px_32px_-6px_oklch(65.32%_0.233_25.74_/_0.45)]
                  transition-[transform,background-color,box-shadow] duration-150 ease-[cubic-bezier(0.32,0.72,0,1)]
                  active:scale-[0.96] cursor-pointer
                "
              >
                {/* Specular top rim */}
                <span
                  aria-hidden="true"
                  className="pointer-events-none absolute inset-x-0 top-0 h-[1px] bg-gradient-to-r from-transparent via-white/35 to-transparent"
                />

                {/* Diagonal sheen sweep */}
                <span
                  aria-hidden="true"
                  className="pointer-events-none absolute inset-0 -translate-x-full bg-gradient-to-r from-transparent via-white/18 to-transparent transition-transform duration-700 ease-[cubic-bezier(0.32,0.72,0,1)] group-hover:translate-x-full"
                />

                <span className="relative z-10">
                  {authStatusText}
                </span>

                {/* Signature Dual-Arrow Conveyor */}
                <span
                  aria-hidden="true"
                  className="relative z-10 inline-flex h-4 w-4 shrink-0 items-center justify-center overflow-hidden"
                >
                  <ArrowRightIcon className="absolute h-4 w-4 transition-all duration-200 ease-[cubic-bezier(0.32,0.72,0,1)] group-hover:translate-x-4 group-hover:opacity-0" />
                  <ArrowRightIcon className="absolute h-4 w-4 -translate-x-4 opacity-0 transition-all duration-200 ease-[cubic-bezier(0.32,0.72,0,1)] group-hover:translate-x-0 group-hover:opacity-100" />
                </span>
              </button>

              <div className="flex items-center justify-between text-[11px] text-gray-500 dark:text-zinc-400 pt-1">
                <span className="flex items-center gap-1.5">
                  <CheckCircleIcon className="w-3.5 h-3.5 text-emerald-500" />
                  Staff Identity Verified
                </span>
                <button
                  type="button"
                  onClick={() => auth.login("admin@agencydesk.com", "admin123")}
                  className="text-primary hover:underline font-semibold cursor-pointer"
                >
                  Bypass with Demo Session →
                </button>
              </div>

            </form>

            {/* Right 5 Cols: System HUD & Telemetry */}
            <div className="lg:col-span-5 flex flex-col gap-4 bg-gray-50 dark:bg-zinc-900/60 p-5 rounded-2xl border border-gray-200 dark:border-zinc-800/80">
              <span className="text-[10px] font-bold uppercase tracking-wider text-gray-500 dark:text-zinc-400">
                Live Admin Telemetry
              </span>

              <div className="flex flex-col gap-3">
                <div className="flex items-center justify-between pb-2 border-b border-gray-200 dark:border-zinc-800 text-xs">
                  <span className="text-gray-500 dark:text-zinc-400">System Operator:</span>
                  <span className="font-bold text-gray-900 dark:text-white">Justin Alvaran</span>
                </div>
                <div className="flex items-center justify-between pb-2 border-b border-gray-200 dark:border-zinc-800 text-xs">
                  <span className="text-gray-500 dark:text-zinc-400">Security Access:</span>
                  <span className="font-bold text-emerald-500">Tier-1 Root Privilege</span>
                </div>
                <div className="flex items-center justify-between pb-2 border-b border-gray-200 dark:border-zinc-800 text-xs">
                  <span className="text-gray-500 dark:text-zinc-400">Active Deals:</span>
                  <span className="font-bold text-gray-900 dark:text-white tabular-nums">5 In Pipeline</span>
                </div>
                <div className="flex items-center justify-between pb-2 border-b border-gray-200 dark:border-zinc-800 text-xs">
                  <span className="text-gray-500 dark:text-zinc-400">Pipeline Value:</span>
                  <span className="font-bold text-primary tabular-nums">$179,500.00</span>
                </div>
                <div className="flex items-center justify-between text-xs">
                  <span className="text-gray-500 dark:text-zinc-400">Database Engine:</span>
                  <span className="font-bold text-gray-900 dark:text-white">Supabase RLS</span>
                </div>
              </div>

              {/* Direct Fast-Access Buttons */}
              <div className="mt-auto pt-4 border-t border-gray-200 dark:border-zinc-800 flex flex-col gap-2">
                <span className="text-[10px] font-bold uppercase tracking-wider text-gray-400">
                  Quick Access Direct Links
                </span>
                <Link
                  href="/crm/leads"
                  className="w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl bg-white dark:bg-zinc-800/80 hover:bg-primary hover:text-white border border-gray-200 dark:border-zinc-700/80 text-xs font-semibold text-gray-800 dark:text-zinc-200 transition-all hover:scale-[1.01] active:scale-[0.98] group"
                >
                  <span>Open Pipeline Kanban ↗</span>
                  <span className="text-[10px] opacity-75 font-mono">/crm/leads</span>
                </Link>
                <Link
                  href="/crm"
                  className="w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl bg-white dark:bg-zinc-800/80 hover:bg-primary hover:text-white border border-gray-200 dark:border-zinc-700/80 text-xs font-semibold text-gray-800 dark:text-zinc-200 transition-all hover:scale-[1.01] active:scale-[0.98] group"
                >
                  <span>Open Executive Dashboard ↗</span>
                  <span className="text-[10px] opacity-75 font-mono">/crm</span>
                </Link>
              </div>

            </div>

          </div>
        )}

        {/* Tab 2: All 6 CRM Modules Directory */}
        {activeTab === "modules" && (
          <div className="pt-8">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {crmModules.map((mod) => {
                const Icon = mod.icon;
                return (
                  <Link
                    key={mod.href}
                    href={mod.href}
                    className="group flex flex-col justify-between p-5 rounded-2xl bg-gray-50 dark:bg-zinc-900/60 border border-gray-200 dark:border-zinc-800 hover:border-primary/80 transition-all duration-150 hover:scale-[1.02] active:scale-[0.97] shadow-xs cursor-pointer"
                  >
                    <div>
                      <div className="flex items-center justify-between mb-3">
                        <div className={`w-9 h-9 rounded-xl flex items-center justify-center border ${mod.color}`}>
                          <Icon className="w-5 h-5" />
                        </div>
                        <span className="text-[10px] font-bold uppercase tracking-wider text-gray-400 dark:text-zinc-500 group-hover:text-primary transition-colors">
                          {mod.tag}
                        </span>
                      </div>
                      <h3 className="font-bold text-sm text-gray-900 dark:text-white group-hover:text-primary transition-colors flex items-center gap-1.5">
                        <span>{mod.title}</span>
                        <span className="text-xs opacity-0 group-hover:opacity-100 transition-opacity">↗</span>
                      </h3>
                      <p className="text-xs text-gray-500 dark:text-zinc-400 mt-1 leading-relaxed line-clamp-2">
                        {mod.description}
                      </p>
                    </div>

                    <div className="mt-4 pt-3 border-t border-gray-200/80 dark:border-zinc-800/80 flex items-center justify-between text-[11px] font-mono text-gray-400 dark:text-zinc-500">
                      <span>Path: {mod.href}</span>
                      <span className="font-sans font-semibold text-primary">Enter →</span>
                    </div>
                  </Link>
                );
              })}
            </div>
          </div>
        )}

      </div>

      {/* Footer Security Disclaimer */}
      <p className="text-center text-[11px] text-gray-400 dark:text-zinc-600 mt-6 max-w-lg">
        AgencyDesk Administration Interface. Multi-factor cryptographic session authentication.
        Authorized personnel only. For client inquiries, visit <Link href="/inquire" className="text-primary hover:underline">/inquire</Link>.
      </p>

    </div>
  );
}
