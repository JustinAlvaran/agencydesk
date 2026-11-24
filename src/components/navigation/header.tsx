"use client";

import { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import ThemeSwitcher from "@/components/theme-switcher/theme-switcher";
import { motion, AnimatePresence } from "framer-motion";
import { services } from "@/constant/services";
import { ChevronDownIcon, Bars3Icon, XMarkIcon } from "@heroicons/react/24/outline";
import { 
  BriefcaseIcon, 
  UserGroupIcon, 
  DocumentTextIcon, 
  RocketLaunchIcon, 
  BoltIcon,
  ArrowUpRightIcon,
  ShieldCheckIcon
} from "@heroicons/react/24/solid";

interface NavLink {
  href: string;
  label: string;
  hasDropdown?: boolean;
  dropdownType?: "services" | "crm";
}

const navLinks: NavLink[] = [
  { href: "/", label: "HOME" },
  { href: "/services", label: "SERVICES", hasDropdown: true, dropdownType: "services" },
  { href: "/crm", label: "CRM WORKSPACE", hasDropdown: true, dropdownType: "crm" },
  { href: "/portal", label: "CLIENT PORTAL" },
  { href: "/about", label: "ABOUT" },
];

const crmMenuItems = [
  {
    href: "/crm/leads",
    title: "Pipeline Kanban",
    description: "Visual deal stages, lead scoring & conversion",
    icon: BriefcaseIcon,
  },
  {
    href: "/crm/contacts",
    title: "Contacts & Accounts",
    description: "Client directory, communications & activity log",
    icon: UserGroupIcon,
  },
  {
    href: "/crm/proposals",
    title: "Proposals & Pricing",
    description: "Versioned scopes, line items & acceptance",
    icon: DocumentTextIcon,
  },
  {
    href: "/crm/projects",
    title: "Project Delivery",
    description: "Milestones, sprint progress & deliverables",
    icon: RocketLaunchIcon,
  },
  {
    href: "/crm/automations",
    title: "Workflow Automations",
    description: "Event-driven CRM outbox & notifications",
    icon: BoltIcon,
  },
  {
    href: "/crm-admin",
    title: "CRM Admin Gateway",
    description: "Staff login, credentials, role privileges & system telemetry",
    icon: ShieldCheckIcon,
  },
];

const Header = () => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [activeDropdown, setActiveDropdown] = useState<"services" | "crm" | null>(null);
  const [mobileServicesOpen, setMobileServicesOpen] = useState(false);
  const [mobileCrmOpen, setMobileCrmOpen] = useState(false);

  const toggleMenu = () => setIsMenuOpen((prev) => !prev);
  const closeDropdown = () => setActiveDropdown(null);

  return (
    <header className="fixed top-0 left-0 right-0 z-50 
      bg-white/85 dark:bg-black/60 backdrop-blur-xl shadow-lg 
      border-b border-gray-200/70 dark:border-gray-800/60
      w-full transition-all duration-300">
      <nav className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-20 transition-all duration-300">
          
          {/* Logo */}
          <div className="shrink-0 flex items-center">
            <Link href="/" className="flex items-center group">
              <Image
                src="/logo/wordmark-dark.svg"
                alt="AgencyDesk"
                width={220}
                height={56}
                className="dark:block hidden w-40 sm:w-44 h-auto shrink-0 transition-transform duration-200 group-hover:scale-105"
                priority
              />
              <Image
                src="/logo/wordmark-light.svg"
                alt="AgencyDesk"
                width={220}
                height={56}
                className="block dark:hidden w-40 sm:w-44 h-auto shrink-0 transition-transform duration-200 group-hover:scale-105"
                priority
              />
            </Link>
          </div>

          {/* Desktop Nav */}
          <div className="hidden xl:flex items-center gap-1 2xl:gap-3">
            {navLinks.map((link) => (
              <div 
                key={link.label} 
                className="relative"
                onMouseEnter={() => link.hasDropdown && setActiveDropdown(link.dropdownType || null)}
                onMouseLeave={() => setActiveDropdown(null)}
              >
                {link.hasDropdown ? (
                  <div className="relative">
                    <button
                      onClick={() => 
                        setActiveDropdown(activeDropdown === link.dropdownType ? null : (link.dropdownType || null))
                      }
                      className="group flex items-center gap-1.5 px-3 py-2 text-xs font-semibold tracking-wider uppercase text-gray-800 dark:text-gray-200 hover:text-primary dark:hover:text-primary transition-colors"
                    >
                      {link.label}
                      <ChevronDownIcon 
                        className={`w-3.5 h-3.5 transition-transform duration-200 ${
                          activeDropdown === link.dropdownType ? "rotate-180 text-primary" : "text-gray-400 group-hover:text-primary"
                        }`} 
                      />
                    </button>

                    {/* Services Dropdown */}
                    <AnimatePresence>
                      {activeDropdown === "services" && link.dropdownType === "services" && (
                        <motion.div
                          initial={{ opacity: 0, y: 8, scale: 0.98 }}
                          animate={{ opacity: 1, y: 0, scale: 1 }}
                          exit={{ opacity: 0, y: 8, scale: 0.98 }}
                          transition={{ duration: 0.18 }}
                          className="absolute top-full left-0 mt-2 w-80 p-3
                            bg-white/95 dark:bg-zinc-950/95 backdrop-blur-2xl 
                            rounded-2xl shadow-2xl border border-gray-200/80 dark:border-zinc-800
                            overflow-hidden z-50"
                        >
                          <div className="text-[10px] font-bold uppercase tracking-wider text-gray-400 dark:text-zinc-500 px-3 py-1.5 mb-1">
                            Capabilities &amp; Solutions
                          </div>
                          <div className="flex flex-col gap-1">
                            {services.map((service, i) => (
                              <Link
                                key={i}
                                href={service.link}
                                onClick={closeDropdown}
                                className="group flex flex-col px-3 py-2 text-left rounded-xl
                                  text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-zinc-900/90
                                  transition-all duration-150"
                              >
                                <span className="font-semibold text-xs text-gray-900 dark:text-white group-hover:text-primary transition-colors">
                                  {service.title}
                                </span>
                                {service.shortDesc && (
                                  <span className="text-[11px] text-gray-500 dark:text-zinc-400 line-clamp-1 mt-0.5">
                                    {service.shortDesc}
                                  </span>
                                )}
                              </Link>
                            ))}
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>

                    {/* CRM Workspace Dropdown */}
                    <AnimatePresence>
                      {activeDropdown === "crm" && link.dropdownType === "crm" && (
                        <motion.div
                          initial={{ opacity: 0, y: 8, scale: 0.98 }}
                          animate={{ opacity: 1, y: 0, scale: 1 }}
                          exit={{ opacity: 0, y: 8, scale: 0.98 }}
                          transition={{ duration: 0.18 }}
                          className="absolute top-full left-0 mt-2 w-88 p-3
                            bg-white/95 dark:bg-zinc-950/95 backdrop-blur-2xl 
                            rounded-2xl shadow-2xl border border-gray-200/80 dark:border-zinc-800
                            overflow-hidden z-50"
                        >
                          <div className="flex items-center justify-between px-3 py-1.5 mb-1">
                            <span className="text-[10px] font-bold uppercase tracking-wider text-gray-400 dark:text-zinc-500">
                              Agency Operating System
                            </span>
                            <span className="text-[9px] font-semibold uppercase px-2 py-0.5 rounded-full bg-primary/10 text-primary border border-primary/20">
                              Live Demo
                            </span>
                          </div>
                          <div className="flex flex-col gap-1">
                            {crmMenuItems.map((item, i) => {
                              const Icon = item.icon;
                              return (
                                <Link
                                  key={i}
                                  href={item.href}
                                  onClick={closeDropdown}
                                  className="group flex items-start gap-3 px-3 py-2 rounded-xl
                                    text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-zinc-900/90
                                    transition-all duration-150"
                                >
                                  <div className="p-1.5 rounded-lg bg-gray-100 dark:bg-zinc-800 text-gray-600 dark:text-gray-300 group-hover:bg-primary/15 group-hover:text-primary transition-colors mt-0.5 shrink-0">
                                    <Icon className="w-4 h-4" />
                                  </div>
                                  <div className="flex flex-col">
                                    <span className="font-semibold text-xs text-gray-900 dark:text-white group-hover:text-primary transition-colors">
                                      {item.title}
                                    </span>
                                    <span className="text-[11px] text-gray-500 dark:text-zinc-400 line-clamp-1">
                                      {item.description}
                                    </span>
                                  </div>
                                </Link>
                              );
                            })}
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>

                  </div>
                ) : (
                  <Link
                    href={link.href}
                    className="px-3 py-2 text-xs font-semibold tracking-wider uppercase text-gray-800 dark:text-gray-200 hover:text-primary dark:hover:text-primary transition-colors"
                  >
                    {link.label}
                  </Link>
                )}
              </div>
            ))}
          </div>

          {/* Right Action Controls */}
          <div className="flex items-center gap-3 sm:gap-4">
            <ThemeSwitcher />

            <Link
              href="/crm-admin"
              className="hidden md:inline-flex items-center gap-1.5 text-xs font-semibold tracking-wider uppercase text-gray-700 dark:text-gray-300 hover:text-primary transition-colors px-2 py-1"
            >
              <ShieldCheckIcon className="w-3.5 h-3.5 text-primary" />
              <span>CRM Admin</span>
            </Link>

            <Link
              href="/login"
              className="hidden md:inline-flex text-xs font-semibold tracking-wider uppercase text-gray-600 dark:text-gray-400 hover:text-primary transition-colors px-2 py-1"
            >
              Sign In
            </Link>

            {/* Glowing Start Inquiry CTA Button with Charles/Emil Kowalski dual-arrow glide & tactile press */}
            <Link
              href="/inquire"
              className="
                hidden sm:inline-flex group relative items-center gap-2 overflow-hidden rounded-full
                px-4 sm:px-5 py-2.5
                font-semibold text-xs uppercase tracking-wider text-white
                bg-primary hover:bg-primary/90
                shadow-lg shadow-primary/25 hover:shadow-primary/40
                transition-[transform,background-color,box-shadow] duration-150 ease-[cubic-bezier(0.32,0.72,0,1)]
                active:scale-[0.96]
              "
            >
              {/* Specular top rim */}
              <span
                aria-hidden="true"
                className="pointer-events-none absolute inset-x-0 top-0 h-[1px] bg-gradient-to-r from-transparent via-white/30 to-transparent"
              />

              {/* Diagonal sheen sweep */}
              <span
                aria-hidden="true"
                className="pointer-events-none absolute inset-0 -translate-x-full bg-gradient-to-r from-transparent via-white/20 to-transparent transition-transform duration-600 ease-[cubic-bezier(0.32,0.72,0,1)] group-hover:translate-x-full"
              />

              <span className="relative z-10">Start inquiry</span>

              {/* Diagonal Dual-Arrow Glide (↗) */}
              <span
                aria-hidden="true"
                className="relative z-10 inline-flex h-3.5 w-3.5 shrink-0 items-center justify-center overflow-hidden"
              >
                {/* Arrow 1: Exits top-right */}
                <ArrowUpRightIcon className="absolute h-3.5 w-3.5 transition-all duration-200 ease-[cubic-bezier(0.32,0.72,0,1)] group-hover:translate-x-3.5 group-hover:-translate-y-3.5 group-hover:opacity-0" />
                {/* Arrow 2: Enters from bottom-left */}
                <ArrowUpRightIcon className="absolute h-3.5 w-3.5 -translate-x-3.5 translate-y-3.5 opacity-0 transition-all duration-200 ease-[cubic-bezier(0.32,0.72,0,1)] group-hover:translate-x-0 group-hover:translate-y-0 group-hover:opacity-100" />
              </span>
            </Link>

            {/* Mobile Hamburger Button */}
            <button
              onClick={toggleMenu}
              aria-label="Toggle navigation menu"
              className="xl:hidden p-2 rounded-xl text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-zinc-900 transition-colors"
            >
              {isMenuOpen ? (
                <XMarkIcon className="w-6 h-6" />
              ) : (
                <Bars3Icon className="w-6 h-6" />
              )}
            </button>
          </div>

        </div>
      </nav>

      {/* Mobile Slide-in Drawer */}
      <AnimatePresence>
        {isMenuOpen && (
          <>
            <motion.div
              className="fixed inset-0 bg-black/60 backdrop-blur-sm z-40 xl:hidden"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
              onClick={toggleMenu}
            />
            <motion.div
              className="fixed top-0 right-0 z-50 h-screen w-80 max-w-[85vw]
                bg-white/95 dark:bg-zinc-950/95 backdrop-blur-2xl
                border-l border-gray-200 dark:border-zinc-800
                shadow-2xl flex flex-col p-6 overflow-y-auto"
              initial={{ x: "100%" }}
              animate={{ x: 0 }}
              exit={{ x: "100%" }}
              transition={{ type: "spring", damping: 25, stiffness: 200 }}
            >
              <div className="flex justify-between items-center pb-4 border-b border-gray-200 dark:border-zinc-800">
                <span className="text-xs font-bold uppercase tracking-widest text-primary">
                  Navigation
                </span>
                <button
                  onClick={toggleMenu}
                  aria-label="Close menu"
                  className="p-1.5 rounded-lg text-gray-500 hover:bg-gray-100 dark:hover:bg-zinc-900"
                >
                  <XMarkIcon className="w-5 h-5" />
                </button>
              </div>

              <div className="flex flex-col gap-2 mt-4">
                <Link
                  href="/"
                  onClick={() => setIsMenuOpen(false)}
                  className="px-3 py-2.5 rounded-xl font-semibold text-sm text-gray-800 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-zinc-900 hover:text-primary transition-colors"
                >
                  Home
                </Link>

                {/* Services Section in Mobile - Collapsible Accordion */}
                <div className="flex flex-col">
                  <button
                    type="button"
                    onClick={() => setMobileServicesOpen(!mobileServicesOpen)}
                    className="flex items-center justify-between px-3 py-2 text-xs font-bold uppercase tracking-wider text-gray-700 dark:text-zinc-300 hover:text-primary transition-colors cursor-pointer"
                  >
                    <span>Services</span>
                    <ChevronDownIcon
                      className={`w-3.5 h-3.5 transition-transform duration-200 ${
                        mobileServicesOpen ? "rotate-180 text-primary" : "text-gray-400"
                      }`}
                    />
                  </button>
                  <AnimatePresence>
                    {mobileServicesOpen && (
                      <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: "auto" }}
                        exit={{ opacity: 0, height: 0 }}
                        className="flex flex-col pl-2 border-l-2 border-primary/30 ml-3 my-1 overflow-hidden"
                      >
                        {services.map((s, i) => (
                          <Link
                            key={i}
                            href={s.link}
                            onClick={() => setIsMenuOpen(false)}
                            className="px-3 py-1.5 text-xs text-gray-600 dark:text-gray-400 hover:text-primary transition-colors"
                          >
                            {s.title}
                          </Link>
                        ))}
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>

                {/* CRM Section in Mobile - Collapsible Accordion */}
                <div className="flex flex-col">
                  <button
                    type="button"
                    onClick={() => setMobileCrmOpen(!mobileCrmOpen)}
                    className="flex items-center justify-between px-3 py-2 text-xs font-bold uppercase tracking-wider text-gray-700 dark:text-zinc-300 hover:text-primary transition-colors cursor-pointer"
                  >
                    <span>CRM Workspace</span>
                    <ChevronDownIcon
                      className={`w-3.5 h-3.5 transition-transform duration-200 ${
                        mobileCrmOpen ? "rotate-180 text-primary" : "text-gray-400"
                      }`}
                    />
                  </button>
                  <AnimatePresence>
                    {mobileCrmOpen && (
                      <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: "auto" }}
                        exit={{ opacity: 0, height: 0 }}
                        className="flex flex-col pl-2 border-l-2 border-primary/30 ml-3 my-1 overflow-hidden"
                      >
                        {crmMenuItems.map((item, i) => (
                          <Link
                            key={i}
                            href={item.href}
                            onClick={() => setIsMenuOpen(false)}
                            className="px-3 py-1.5 text-xs text-gray-600 dark:text-gray-400 hover:text-primary transition-colors flex items-center gap-2"
                          >
                            <item.icon className="w-3.5 h-3.5 text-primary shrink-0" />
                            <span>{item.title}</span>
                          </Link>
                        ))}
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>

                <div className="border-t border-gray-200 dark:border-zinc-800 my-2" />

                <Link
                  href="/portal"
                  onClick={() => setIsMenuOpen(false)}
                  className="px-3 py-2.5 rounded-xl font-semibold text-sm text-gray-800 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-zinc-900 hover:text-primary transition-colors"
                >
                  Client Portal
                </Link>

                <Link
                  href="/about"
                  onClick={() => setIsMenuOpen(false)}
                  className="px-3 py-2.5 rounded-xl font-semibold text-sm text-gray-800 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-zinc-900 hover:text-primary transition-colors"
                >
                  About AgencyDesk
                </Link>

                <Link
                  href="/crm-admin"
                  onClick={() => setIsMenuOpen(false)}
                  className="px-3 py-2.5 rounded-xl font-semibold text-sm text-primary hover:bg-primary/10 transition-colors flex items-center gap-2"
                >
                  <ShieldCheckIcon className="w-4 h-4 text-primary" />
                  <span>CRM Admin Console</span>
                </Link>

                <Link
                  href="/login"
                  onClick={() => setIsMenuOpen(false)}
                  className="px-3 py-2.5 rounded-xl font-semibold text-sm text-gray-800 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-zinc-900 hover:text-primary transition-colors"
                >
                  Staff Sign In
                </Link>
              </div>

              <div className="mt-auto pt-6 border-t border-gray-200 dark:border-zinc-800">
                <Link
                  href="/inquire"
                  onClick={() => setIsMenuOpen(false)}
                  className="group relative w-full flex items-center justify-center gap-2 overflow-hidden py-3 rounded-xl
                    font-semibold text-xs uppercase tracking-wider bg-primary hover:bg-primary/90 text-white shadow-lg shadow-primary/20
                    transition-[transform,background-color,box-shadow] duration-150 ease-[cubic-bezier(0.32,0.72,0,1)]
                    active:scale-[0.96]"
                >
                  <span
                    aria-hidden="true"
                    className="pointer-events-none absolute inset-x-0 top-0 h-[1px] bg-gradient-to-r from-transparent via-white/30 to-transparent"
                  />
                  <span className="relative z-10">Start inquiry</span>
                  <span
                    aria-hidden="true"
                    className="relative z-10 inline-flex h-4 w-4 shrink-0 items-center justify-center overflow-hidden"
                  >
                    <ArrowUpRightIcon className="absolute h-4 w-4 transition-all duration-200 ease-[cubic-bezier(0.32,0.72,0,1)] group-hover:translate-x-4 group-hover:-translate-y-4 group-hover:opacity-0" />
                    <ArrowUpRightIcon className="absolute h-4 w-4 -translate-x-4 translate-y-4 opacity-0 transition-all duration-200 ease-[cubic-bezier(0.32,0.72,0,1)] group-hover:translate-x-0 group-hover:translate-y-0 group-hover:opacity-100" />
                  </span>
                </Link>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </header>
  );
};

export default Header;
