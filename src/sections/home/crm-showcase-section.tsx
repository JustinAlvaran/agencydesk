"use client";

import React, { useState } from "react";
import Link from "next/link";
import { 
  BriefcaseIcon, 
  DocumentTextIcon, 
  RocketLaunchIcon, 
  ArrowRightIcon,
  CheckCircleIcon,
  SparklesIcon,
  ClockIcon,
} from "@heroicons/react/24/solid";

interface LeadItem {
  id: string;
  contact: string;
  company: string;
  service: string;
  budget: string;
  stage: "new" | "contacted" | "qualified" | "proposal_sent" | "won";
  probability: number;
}

const initialLeads: LeadItem[] = [
  { id: "1", contact: "Elena Vance", company: "Black Mesa AI", service: "Next.js Web Portal", budget: "$28,000", stage: "new", probability: 20 },
  { id: "2", contact: "Marcus Brody", company: "Northwind Logistics", service: "Automated CRM Outbox", budget: "$16,500", stage: "contacted", probability: 40 },
  { id: "3", contact: "Sarah Chen", company: "Aether Health", service: "Cloud & Supabase Architecture", budget: "$45,000", stage: "qualified", probability: 60 },
  { id: "4", contact: "David Miller", company: "Nexus Fintech", service: "Revenue Telemetry System", budget: "$32,000", stage: "proposal_sent", probability: 80 },
  { id: "5", contact: "Amara Patel", company: "Horizon Ventures", service: "Full-Stack Agency Platform", budget: "$58,000", stage: "won", probability: 100 },
];

const stages = [
  { key: "new", label: "New Inquiry", color: "border-blue-500/50" },
  { key: "contacted", label: "Contacted", color: "border-amber-500/50" },
  { key: "qualified", label: "Qualified", color: "border-purple-500/50" },
  { key: "proposal_sent", label: "Proposal Sent", color: "border-orange-500/50" },
  { key: "won", label: "Won / Kickoff", color: "border-emerald-500/50" },
];

export default function CRMShowcaseSection() {
  const [activeTab, setActiveTab] = useState<"kanban" | "proposals" | "portal">("kanban");
  const [leads, setLeads] = useState<LeadItem[]>(initialLeads);

  const moveStage = (id: string, direction: "next" | "prev") => {
    const stageOrder: LeadItem["stage"][] = ["new", "contacted", "qualified", "proposal_sent", "won"];
    setLeads((prev) =>
      prev.map((lead) => {
        if (lead.id !== id) return lead;
        const currentIndex = stageOrder.indexOf(lead.stage);
        const nextIndex = direction === "next" 
          ? Math.min(currentIndex + 1, stageOrder.length - 1)
          : Math.max(currentIndex - 1, 0);
        return {
          ...lead,
          stage: stageOrder[nextIndex],
          probability: (nextIndex + 1) * 20,
        };
      })
    );
  };

  return (
    <section className="w-full max-w-7xl mx-auto py-16 px-4 sm:px-6 lg:px-8">
      {/* Header */}
      <div className="flex flex-col md:flex-row items-center md:items-end justify-between gap-6 mb-12">
        <div className="text-center md:text-left">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 border border-primary/25 text-primary text-xs font-bold uppercase tracking-wider mb-3">
            <SparklesIcon className="w-4 h-4" />
            <span>Interactive Operational Sandbox</span>
          </div>
          <h2 className="text-3xl sm:text-4xl font-bold text-gray-900 dark:text-white">
            Experience the AgencyDesk Engine
          </h2>
          <p className="text-sm text-gray-600 dark:text-gray-400 mt-2 max-w-xl">
            Live preview of how incoming leads flow into scoped proposals and active client portal sprints.
          </p>
        </div>

        {/* View Switcher Tabs */}
        <div className="flex items-center overflow-x-auto max-w-full p-1 rounded-2xl bg-gray-100 dark:bg-zinc-900 border border-gray-200 dark:border-zinc-800 scrollbar-none">
          <button
            onClick={() => setActiveTab("kanban")}
            className={`shrink-0 flex items-center gap-1.5 sm:gap-2 px-3 sm:px-4 py-2 rounded-xl text-[11px] sm:text-xs font-bold uppercase tracking-wider transition-all cursor-pointer ${
              activeTab === "kanban"
                ? "bg-primary text-white shadow-md shadow-primary/20"
                : "text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white"
            }`}
          >
            <BriefcaseIcon className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
            <span>Kanban Pipeline</span>
          </button>
          <button
            onClick={() => setActiveTab("proposals")}
            className={`shrink-0 flex items-center gap-1.5 sm:gap-2 px-3 sm:px-4 py-2 rounded-xl text-[11px] sm:text-xs font-bold uppercase tracking-wider transition-all cursor-pointer ${
              activeTab === "proposals"
                ? "bg-primary text-white shadow-md shadow-primary/20"
                : "text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white"
            }`}
          >
            <DocumentTextIcon className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
            <span>Proposals</span>
          </button>
          <button
            onClick={() => setActiveTab("portal")}
            className={`shrink-0 flex items-center gap-1.5 sm:gap-2 px-3 sm:px-4 py-2 rounded-xl text-[11px] sm:text-xs font-bold uppercase tracking-wider transition-all cursor-pointer ${
              activeTab === "portal"
                ? "bg-primary text-white shadow-md shadow-primary/20"
                : "text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white"
            }`}
          >
            <RocketLaunchIcon className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
            <span>Client Portal</span>
          </button>
        </div>
      </div>

      {/* Main Interactive Stage Container */}
      <div className="relative rounded-3xl bg-white/70 dark:bg-zinc-950/80 backdrop-blur-2xl border border-gray-200/80 dark:border-zinc-800 shadow-2xl p-6 sm:p-8 overflow-hidden">
        
        {/* Metric Badges Top Bar */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-8 pb-6 border-b border-gray-200 dark:border-zinc-800/80">
          <div className="flex flex-col">
            <span className="text-[11px] font-bold uppercase tracking-wider text-gray-500 dark:text-zinc-500">
              Total Active Pipeline
            </span>
            <div className="flex items-baseline gap-2 mt-1">
              <span className="text-xl sm:text-2xl font-extrabold text-gray-900 dark:text-white tabular-nums">
                $179,500
              </span>
              <span className="text-[10px] font-bold text-emerald-500 bg-emerald-500/10 px-1.5 py-0.5 rounded tabular-nums">
                +14% MoM
              </span>
            </div>
            <span className="text-[10px] text-gray-400 dark:text-zinc-500 mt-0.5 tabular-nums">
              Weighted: $118,200
            </span>
          </div>

          <div className="flex flex-col">
            <span className="text-[11px] font-bold uppercase tracking-wider text-gray-500 dark:text-zinc-500">
              Active Opportunities
            </span>
            <div className="flex items-baseline gap-2 mt-1">
              <span className="text-xl sm:text-2xl font-extrabold text-gray-900 dark:text-white tabular-nums">
                5 In Flight
              </span>
            </div>
            <span className="text-[10px] text-gray-400 dark:text-zinc-500 mt-0.5 tabular-nums">
              Avg ticket: $35.9k
            </span>
          </div>

          <div className="flex flex-col">
            <span className="text-[11px] font-bold uppercase tracking-wider text-gray-500 dark:text-zinc-500">
              Proposal Win Rate
            </span>
            <div className="flex items-baseline gap-2 mt-1">
              <span className="text-xl sm:text-2xl font-extrabold text-emerald-500 tabular-nums">
                82.4%
              </span>
            </div>
            <span className="text-[10px] text-gray-400 dark:text-zinc-500 mt-0.5">
              Fixed-scope guarantee
            </span>
          </div>

          <div className="flex flex-col">
            <span className="text-[11px] font-bold uppercase tracking-wider text-gray-500 dark:text-zinc-500">
              Sprint Velocity
            </span>
            <div className="flex items-baseline gap-2 mt-1">
              <span className="text-xl sm:text-2xl font-extrabold text-primary tabular-nums">
                100% On-Time
              </span>
            </div>
            <span className="text-[10px] text-gray-400 dark:text-zinc-500 mt-0.5">
              Zero scope creep
            </span>
          </div>
        </div>

        {/* Tab 1: Interactive Kanban View */}
        {activeTab === "kanban" && (
          <div className="flex flex-col">
            <div className="flex items-center justify-between mb-4">
              <span className="text-xs font-bold uppercase tracking-wider text-gray-700 dark:text-zinc-300">
                Live Sales Pipeline Board (Click arrows to transition stages)
              </span>
              <span className="text-xs text-gray-400 dark:text-zinc-500">
                Showing 5 deal cards
              </span>
            </div>

            <div className="flex lg:grid lg:grid-cols-5 gap-4 overflow-x-auto pb-4 scrollbar-hide">
              {stages.map((stage) => {
                const stageLeads = leads.filter((l) => l.stage === stage.key);
                return (
                  <div
                    key={stage.key}
                    className={`flex flex-col rounded-2xl bg-gray-50/80 dark:bg-zinc-900/60 border ${stage.color} p-3.5 min-w-[210px]`}
                  >
                    <div className="flex items-center justify-between pb-2 mb-2 border-b border-gray-200/60 dark:border-zinc-800">
                      <span className="text-xs font-bold uppercase tracking-wider text-gray-800 dark:text-zinc-200">
                        {stage.label}
                      </span>
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-white dark:bg-zinc-800 text-gray-600 dark:text-zinc-400">
                        {stageLeads.length}
                      </span>
                    </div>

                    <div className="flex flex-col gap-2.5">
                      {stageLeads.map((lead) => (
                        <div
                          key={lead.id}
                          className="p-3 rounded-xl bg-white dark:bg-zinc-800/90 border border-gray-200/80 dark:border-zinc-700/60 shadow-xs hover:border-primary/50 transition-all group"
                        >
                          <div className="flex items-start justify-between">
                            <Link href="/crm/leads" className="font-bold text-xs text-gray-900 dark:text-white hover:text-primary transition-colors flex items-center gap-1 group/name">
                              <span>{lead.company}</span>
                              <span className="text-[10px] opacity-0 group-hover/name:opacity-100 transition-opacity text-primary">↗</span>
                            </Link>
                            <span className="text-[11px] font-semibold text-primary tabular-nums">
                              {lead.budget}
                            </span>
                          </div>
                          <p className="text-[11px] text-gray-500 dark:text-zinc-400 mt-0.5 line-clamp-1">
                            {lead.service}
                          </p>
                          <div className="flex items-center justify-between mt-3 pt-2 border-t border-gray-100 dark:border-zinc-700/40 text-[10px]">
                            <span className="text-gray-400 dark:text-zinc-400 font-medium">
                              {lead.contact}
                            </span>
                            <div className="flex items-center gap-1">
                              {lead.stage !== "new" && (
                                <button
                                  onClick={() => moveStage(lead.id, "prev")}
                                  className="px-1.5 py-0.5 rounded bg-gray-100 dark:bg-zinc-700 hover:text-primary transition-colors text-[9px] font-bold"
                                  title="Previous Stage"
                                >
                                  &larr;
                                </button>
                              )}
                              {lead.stage !== "won" && (
                                <button
                                  onClick={() => moveStage(lead.id, "next")}
                                  className="px-1.5 py-0.5 rounded bg-primary/10 text-primary hover:bg-primary hover:text-white transition-colors text-[9px] font-bold"
                                  title="Next Stage"
                                >
                                  &rarr;
                                </button>
                              )}
                            </div>
                          </div>
                        </div>
                      ))}
                      {stageLeads.length === 0 && (
                        <div className="py-6 text-center text-xs text-gray-400 dark:text-zinc-600 border border-dashed border-gray-200 dark:border-zinc-800 rounded-xl">
                          No deals
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Tab 2: Proposals View */}
        {activeTab === "proposals" && (
          <div className="flex flex-col gap-4">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold uppercase tracking-wider text-gray-700 dark:text-zinc-300">
                Published &amp; Agreed Scope Packages
              </span>
              <span className="text-xs text-emerald-500 font-bold">
                Immutable Pricing Active
              </span>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-gray-200 dark:border-zinc-800 text-gray-400 dark:text-zinc-500 uppercase tracking-wider">
                    <th className="py-3 px-4 font-semibold">Proposal Title</th>
                    <th className="py-3 px-4 font-semibold">Client</th>
                    <th className="py-3 px-4 font-semibold">Scope Version</th>
                    <th className="py-3 px-4 font-semibold">Value</th>
                    <th className="py-3 px-4 font-semibold">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100 dark:divide-zinc-800/60 text-gray-700 dark:text-zinc-300">
                  <tr 
                    onClick={() => window.location.href = '/crm/proposals'} 
                    className="hover:bg-gray-50 dark:hover:bg-zinc-900/50 transition-colors cursor-pointer group"
                  >
                    <td className="py-3 px-4 font-bold text-gray-900 dark:text-white group-hover:text-primary transition-colors">Next.js Web Portal MVP ↗</td>
                    <td className="py-3 px-4">Black Mesa AI</td>
                    <td className="py-3 px-4"><span className="px-2 py-0.5 rounded bg-zinc-100 dark:bg-zinc-800 font-mono text-[10px]">v1.2 (Signed)</span></td>
                    <td className="py-3 px-4 font-semibold text-primary">$28,000</td>
                    <td className="py-3 px-4"><span className="px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-500 font-bold text-[10px]">Accepted</span></td>
                  </tr>
                  <tr 
                    onClick={() => window.location.href = '/crm/proposals'} 
                    className="hover:bg-gray-50 dark:hover:bg-zinc-900/50 transition-colors cursor-pointer group"
                  >
                    <td className="py-3 px-4 font-bold text-gray-900 dark:text-white group-hover:text-primary transition-colors">Enterprise Cloud Architecture ↗</td>
                    <td className="py-3 px-4">Aether Health</td>
                    <td className="py-3 px-4"><span className="px-2 py-0.5 rounded bg-zinc-100 dark:bg-zinc-800 font-mono text-[10px]">v2.0 (Published)</span></td>
                    <td className="py-3 px-4 font-semibold text-primary">$45,000</td>
                    <td className="py-3 px-4"><span className="px-2 py-0.5 rounded-full bg-orange-500/10 text-orange-500 font-bold text-[10px]">Under Review</span></td>
                  </tr>
                  <tr 
                    onClick={() => window.location.href = '/crm/proposals'} 
                    className="hover:bg-gray-50 dark:hover:bg-zinc-900/50 transition-colors cursor-pointer group"
                  >
                    <td className="py-3 px-4 font-bold text-gray-900 dark:text-white group-hover:text-primary transition-colors">Full-Stack Agency Platform ↗</td>
                    <td className="py-3 px-4">Horizon Ventures</td>
                    <td className="py-3 px-4"><span className="px-2 py-0.5 rounded bg-zinc-100 dark:bg-zinc-800 font-mono text-[10px]">v1.0 (Signed)</span></td>
                    <td className="py-3 px-4 font-semibold text-primary">$58,000</td>
                    <td className="py-3 px-4"><span className="px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-500 font-bold text-[10px]">Accepted</span></td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Tab 3: Client Portal View */}
        {activeTab === "portal" && (
          <div className="flex flex-col gap-6">
            <div className="flex items-center justify-between pb-4 border-b border-gray-200 dark:border-zinc-800">
              <div>
                <span className="text-[10px] font-bold uppercase tracking-wider text-primary">Client Workspace Preview</span>
                <h3 className="text-lg font-bold text-gray-900 dark:text-white">Horizon Ventures · Full-Stack Platform</h3>
              </div>
              <span className="px-3 py-1 rounded-full bg-emerald-500/10 text-emerald-500 font-bold text-xs">
                Sprint 3 of 4 Active
              </span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div 
                onClick={() => window.location.href = '/portal'} 
                className="p-4 rounded-2xl bg-gray-50 dark:bg-zinc-900 border border-gray-200 dark:border-zinc-800 flex flex-col justify-between cursor-pointer hover:border-primary/80 transition-all group"
              >
                <div>
                  <span className="text-[11px] font-bold uppercase text-gray-400 group-hover:text-primary transition-colors">Sprint Progress ↗</span>
                  <div className="flex items-center justify-between mt-2">
                    <span className="text-2xl font-black text-gray-900 dark:text-white">75%</span>
                    <span className="text-xs text-emerald-500 font-bold">Ahead of schedule</span>
                  </div>
                  <div className="w-full bg-gray-200 dark:bg-zinc-800 h-2 rounded-full overflow-hidden mt-3">
                    <div className="bg-primary h-full rounded-full w-3/4" />
                  </div>
                </div>
                <p className="text-[11px] text-gray-500 dark:text-zinc-400 mt-4">
                  Target milestone signoff: Friday, Dec 1
                </p>
              </div>

              <div 
                onClick={() => window.location.href = '/portal'} 
                className="p-4 rounded-2xl bg-gray-50 dark:bg-zinc-900 border border-gray-200 dark:border-zinc-800 md:col-span-2 cursor-pointer hover:border-primary/80 transition-all group"
              >
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-bold uppercase text-gray-400 group-hover:text-primary transition-colors">Milestone Roadmap ↗</span>
                  <span className="text-[10px] text-primary font-bold">Open Full Portal View</span>
                </div>
                <div className="flex flex-col gap-2.5 mt-3">
                  <div className="flex items-center justify-between p-2 rounded-xl bg-white dark:bg-zinc-800/80 text-xs">
                    <div className="flex items-center gap-2">
                      <CheckCircleIcon className="w-4 h-4 text-emerald-500" />
                      <span className="font-semibold text-gray-900 dark:text-white">Phase 1: Architecture &amp; Database Schemas</span>
                    </div>
                    <span className="text-emerald-500 font-bold text-[10px]">Completed</span>
                  </div>
                  <div className="flex items-center justify-between p-2 rounded-xl bg-white dark:bg-zinc-800/80 text-xs">
                    <div className="flex items-center gap-2">
                      <CheckCircleIcon className="w-4 h-4 text-emerald-500" />
                      <span className="font-semibold text-gray-900 dark:text-white">Phase 2: CRM Core &amp; Pipeline Views</span>
                    </div>
                    <span className="text-emerald-500 font-bold text-[10px]">Completed</span>
                  </div>
                  <div className="flex items-center justify-between p-2 rounded-xl bg-primary/10 border border-primary/20 text-xs">
                    <div className="flex items-center gap-2">
                      <ClockIcon className="w-4 h-4 text-primary animate-spin" />
                      <span className="font-semibold text-gray-900 dark:text-white">Phase 3: Client Portal &amp; Outbox Automation</span>
                    </div>
                    <span className="text-primary font-bold text-[10px]">In Progress</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Footer CTA Banner */}
        <div className="mt-8 pt-6 border-t border-gray-200 dark:border-zinc-800/80 flex flex-col sm:flex-row items-center justify-between gap-4">
          <p className="text-xs text-gray-500 dark:text-zinc-400 text-center sm:text-left">
            Ready to inspect the live CRM database, contact directory, and proposal builder?
          </p>
          <Link
            href="/crm"
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full font-bold text-xs uppercase tracking-wider bg-primary hover:bg-primary/90 text-white shadow-md shadow-primary/20 transition-all duration-200 group"
          >
            <span>Launch Full CRM Workspace</span>
            <ArrowRightIcon className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
          </Link>
        </div>

      </div>
    </section>
  );
}
