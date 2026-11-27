"use client";

import React, { useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import Image from "next/image";
import {signOut} from "@/app/login/actions";
import ThemeSwitcher from "@/components/theme-switcher/theme-switcher";
import {
  ChartBarIcon,
  Squares2X2Icon,
  UserGroupIcon,
  DocumentTextIcon,
  RocketLaunchIcon,
  BoltIcon,
  InboxStackIcon,
  ArrowTopRightOnSquareIcon,
  ArrowRightStartOnRectangleIcon,
  MagnifyingGlassIcon,
  Bars3Icon,
  XMarkIcon,
  ShieldCheckIcon,
  UsersIcon,
} from "@heroicons/react/24/outline";

const coreNavItems = [
  { href: "/crm", label: "Dashboard", icon: ChartBarIcon, exact: true },
  { href: "/crm/leads", label: "Pipeline Kanban", icon: Squares2X2Icon },
  { href: "/crm/contacts", label: "Contacts & Accounts", icon: UserGroupIcon },
  { href: "/crm/proposals", label: "Proposals & Pricing", icon: DocumentTextIcon },
  { href: "/crm/projects", label: "Project Delivery", icon: RocketLaunchIcon },
];

const automationNavItems = [
  { href: "/crm/automations", label: "Automation Center", icon: BoltIcon, exact: true },
  { href: "/crm/automations?tab=outbox", label: "Approval Queue", icon: InboxStackIcon },
];

const workspaceNavItems = [
  { href: "/crm/team", label: "Team & Access", icon: UsersIcon, exact: false },
];

export default function CRMLayout({ children,email,role }: { children: React.ReactNode;email:string;role:string }) {
  const pathname = usePathname();
  const router = useRouter();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [headerSearch, setHeaderSearch] = useState("");

  const allNavItems = [...coreNavItems, ...automationNavItems, ...workspaceNavItems];
  const activeItem = allNavItems.find((item) =>
    item.exact ? pathname === item.href : pathname.startsWith(item.href.split("?")[0])
  );
  const activeTitle = activeItem?.label ?? "AgencyDesk CRM";

  const handleHeaderSearch = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = headerSearch.trim();
    router.push(trimmed ? `/crm/leads?q=${encodeURIComponent(trimmed)}` : "/crm/leads");
  };

  return (
    <div className="min-h-screen bg-gray-50/50 dark:bg-zinc-950 flex flex-col lg:flex-row">
      
      {/* Mobile Sidebar Overlay */}
      {sidebarOpen && (
        <div
          onClick={() => setSidebarOpen(false)}
          className="fixed inset-0 bg-black/60 backdrop-blur-sm z-40 lg:hidden"
        />
      )}

      {/* Sidebar Navigation */}
      <aside
        className={`fixed lg:sticky top-0 left-0 z-50 h-screen w-64 bg-white/95 dark:bg-zinc-950/95 backdrop-blur-2xl border-r border-gray-200 dark:border-zinc-800/80 p-5 flex flex-col justify-between transition-transform duration-200 ease-in-out overflow-y-auto ${
          sidebarOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"
        }`}
      >
        <div>
          {/* Logo */}
          <div className="flex items-center justify-between pb-5 border-b border-gray-200 dark:border-zinc-800/80">
            <Link href="/" className="flex items-center">
              <Image
                src="/logo/wordmark-dark.svg"
                alt="AgencyDesk"
                width={180}
                height={46}
                className="dark:block hidden w-36 h-auto"
              />
              <Image
                src="/logo/wordmark-light.svg"
                alt="AgencyDesk"
                width={180}
                height={46}
                className="block dark:hidden w-36 h-auto"
              />
            </Link>
            <button
              type="button"
              aria-label="Close navigation menu"
              onClick={() => setSidebarOpen(false)}
              className="lg:hidden p-1.5 rounded-lg text-gray-500 dark:text-zinc-400 hover:text-gray-900 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-zinc-900 transition-colors cursor-pointer"
            >
              <XMarkIcon className="w-5 h-5" />
            </button>
          </div>

          <div className="text-[10px] font-bold uppercase tracking-wider text-gray-400 dark:text-zinc-500 px-3 pt-5 pb-2">
            CRM &amp; Delivery
          </div>

          {/* Core CRM Navigation */}
          <nav className="flex flex-col gap-1">
            {coreNavItems.map((item) => {
              const Icon = item.icon;
              const isActive = item.exact
                ? pathname === item.href
                : pathname.startsWith(item.href);

              return (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={() => setSidebarOpen(false)}
                  className={`flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs font-semibold tracking-wide transition-all ${
                    isActive
                      ? "bg-primary text-white shadow-md shadow-primary/25"
                      : "text-gray-600 dark:text-zinc-400 hover:bg-gray-100 dark:hover:bg-zinc-900/80 hover:text-gray-900 dark:hover:text-white"
                  }`}
                >
                  <Icon className="w-4 h-4 shrink-0" />
                  <span>{item.label}</span>
                </Link>
              );
            })}
          </nav>

          <div className="text-[10px] font-bold uppercase tracking-wider text-gray-400 dark:text-zinc-500 px-3 pt-5 pb-2">
            Lifecycle Automations
          </div>

          <nav className="flex flex-col gap-1">
            {automationNavItems.map((item) => {
              const Icon = item.icon;
              const isActive = item.exact && pathname === item.href;

              return (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={() => setSidebarOpen(false)}
                  className={`flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs font-semibold tracking-wide transition-all ${
                    isActive
                      ? "bg-primary text-white shadow-md shadow-primary/25"
                      : "text-gray-600 dark:text-zinc-400 hover:bg-gray-100 dark:hover:bg-zinc-900/80 hover:text-gray-900 dark:hover:text-white"
                  }`}
                >
                  <Icon className="w-4 h-4 shrink-0" />
                  <span>{item.label}</span>
                </Link>
              );
            })}
          </nav>

          <div className="text-[10px] font-bold uppercase tracking-wider text-gray-400 dark:text-zinc-500 px-3 pt-5 pb-2">
            Workspace &amp; Access
          </div>

          <nav className="flex flex-col gap-1">
            {workspaceNavItems.map((item) => {
              const Icon = item.icon;
              const isActive = pathname.startsWith(item.href);

              return (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={() => setSidebarOpen(false)}
                  className={`flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs font-semibold tracking-wide transition-all ${
                    isActive
                      ? "bg-primary text-white shadow-md shadow-primary/25"
                      : "text-gray-600 dark:text-zinc-400 hover:bg-gray-100 dark:hover:bg-zinc-900/80 hover:text-gray-900 dark:hover:text-white"
                  }`}
                >
                  <Icon className="w-4 h-4 shrink-0" />
                  <span>{item.label}</span>
                </Link>
              );
            })}
          </nav>
        </div>

        {/* Bottom Workspace Links */}
        <div className="pt-5 mt-5 border-t border-gray-200 dark:border-zinc-800/80 flex flex-col gap-2">
          <Link
            href="/crm-admin"
            onClick={() => setSidebarOpen(false)}
            className="flex items-center justify-between px-3.5 py-2 rounded-xl text-xs font-semibold text-primary hover:bg-primary/10 transition-colors"
          >
            <span className="flex items-center gap-2">
              <ShieldCheckIcon className="w-4 h-4 text-primary" />
              CRM Admin Console
            </span>
            <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-primary/10 border border-primary/20">
              Staff
            </span>
          </Link>

          <Link
            href="/portal"
            onClick={() => setSidebarOpen(false)}
            className="flex items-center justify-between px-3.5 py-2 rounded-xl text-xs font-medium text-gray-600 dark:text-zinc-400 hover:bg-gray-100 dark:hover:bg-zinc-900 hover:text-primary transition-colors"
          >
            <span className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-emerald-500" />
              Client Portal View
            </span>
            <ArrowTopRightOnSquareIcon className="w-3.5 h-3.5" />
          </Link>

          <form action={signOut}>
            <button
              type="submit"
              className="w-full flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-medium text-gray-500 dark:text-zinc-400 hover:bg-rose-500/10 hover:text-rose-600 dark:hover:text-rose-400 transition-colors cursor-pointer"
            >
              <ArrowRightStartOnRectangleIcon className="w-4 h-4" />
              <span>Sign out</span>
            </button>
          </form>

          {/* Staff Info Pill */}
          <div className="flex items-center gap-3 p-2.5 mt-1 rounded-2xl bg-gray-100 dark:bg-zinc-900/70 border border-gray-200 dark:border-zinc-800">
            <div className="w-8 h-8 rounded-full bg-primary/20 border border-primary/30 text-primary font-bold text-xs flex items-center justify-center shrink-0">
              {email.slice(0,2).toUpperCase()}
            </div>
            <div className="flex flex-col min-w-0">
              <span className="font-semibold text-xs text-gray-900 dark:text-white truncate">
                {email}
              </span>
              <span className="text-[10px] text-gray-500 dark:text-zinc-400 capitalize truncate">
                {role}
              </span>
            </div>
          </div>
        </div>
      </aside>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0">
        
        {/* Workspace Topbar */}
        <header className="sticky top-0 z-30 h-16 bg-white/85 dark:bg-zinc-950/85 backdrop-blur-xl border-b border-gray-200 dark:border-zinc-800/80 px-3 sm:px-6 lg:px-8 flex items-center justify-between gap-3">
          <div className="flex items-center gap-2.5 sm:gap-3 min-w-0 flex-1">
            <button
              type="button"
              aria-label="Open navigation menu"
              onClick={() => setSidebarOpen(true)}
              className="lg:hidden p-2 rounded-xl text-gray-600 dark:text-zinc-400 hover:bg-gray-100 dark:hover:bg-zinc-900 shrink-0 cursor-pointer"
            >
              <Bars3Icon className="w-5 h-5" />
            </button>

            <span className="lg:hidden text-xs font-bold text-gray-900 dark:text-white truncate">
              {activeTitle}
            </span>

            <form onSubmit={handleHeaderSearch} className="relative hidden sm:block w-full max-w-xs md:max-w-sm">
              <MagnifyingGlassIcon className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={headerSearch}
                onChange={(e) => setHeaderSearch(e.target.value)}
                placeholder="Search leads or companies (Enter)..."
                className="w-full h-9 pl-9 pr-4 rounded-xl bg-gray-100 dark:bg-zinc-900 border border-transparent focus:border-primary/50 text-xs text-gray-900 dark:text-white placeholder:text-gray-400 focus:outline-none transition-all"
              />
            </form>
          </div>

          <div className="flex items-center gap-2 sm:gap-3 shrink-0">
            <Link
              href="/crm/automations?tab=outbox"
              className="hidden md:inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full font-semibold text-[11px] bg-gray-100 dark:bg-zinc-900 text-gray-700 dark:text-zinc-300 border border-gray-200 dark:border-zinc-800 hover:border-primary/40 hover:text-primary transition-all"
            >
              <InboxStackIcon className="w-3.5 h-3.5" />
              <span>Outbox</span>
            </Link>
            <Link
              href="/inquire"
              className="inline-flex items-center gap-1 px-2.5 sm:px-3 py-1.5 rounded-full font-bold text-[11px] uppercase tracking-wider bg-primary/10 text-primary border border-primary/20 hover:bg-primary hover:text-white transition-all whitespace-nowrap"
            >
              <span>+</span>
              <span className="sm:hidden">Lead</span>
              <span className="hidden sm:inline">Quick Inquiry</span>
            </Link>
            <ThemeSwitcher />
          </div>
        </header>

        {/* View Content */}
        <main className="flex-1 p-4 sm:p-6 lg:p-8 max-w-7xl w-full mx-auto">
          {children}
        </main>

      </div>

    </div>
  );
}
