"use client";

import React from "react";
import Link from "next/link";
import type {Lead,Project,Task,ActivityEvent} from "@/types/crm";
import { 
  CurrencyDollarIcon, 
  BriefcaseIcon, 
  CheckCircleIcon, 
  ClockIcon,
  ArrowRightIcon,
  Squares2X2Icon,
  BoltIcon,
  InboxStackIcon,
  SparklesIcon,
} from "@heroicons/react/24/solid";

const stageDisplayConfig: { key: Lead["status"]; label: string; color: string }[] = [
  { key: "new", label: "New Inquiry", color: "bg-blue-500" },
  { key: "contacted", label: "Contacted", color: "bg-amber-500" },
  { key: "qualified", label: "Qualified", color: "bg-purple-500" },
  { key: "proposal_sent", label: "Proposal Sent", color: "bg-orange-500" },
  { key: "won", label: "Won", color: "bg-emerald-500" },
  { key: "lost", label: "Lost", color: "bg-zinc-400 dark:bg-zinc-600" },
];

export default function View({
  initialLeads = [],
  initialProjects = [],
  initialTasks = [],
  initialActivities = [],
  totalPipeline = 0,
  weightedPipeline = 0,
  openLeads = 0,
  acceptedValue = 0,
}: {
  initialLeads?: Lead[];
  initialProjects?: Project[];
  initialTasks?: Task[];
  initialActivities?: ActivityEvent[];
  totalPipeline?: number;
  weightedPipeline?: number;
  openLeads?: number;
  acceptedValue?: number;
}) {
  const stageRows = stageDisplayConfig.map(({ key, label, color }) => {
    const rows = initialLeads.filter((l) => l.status === key);
    return {
      key,
      stage: label,
      count: rows.length,
      sum: rows.reduce((a, l) => a + l.budget, 0),
      color,
      pct: `${initialLeads.length ? Math.round((rows.length / initialLeads.length) * 100) : 0}%`,
    };
  });

  const newLeadsCount = initialLeads.filter((l) => l.status === "new").length;
  const qualifiedCount = initialLeads.filter((l) => l.status === "qualified").length;
  const proposalSentCount = initialLeads.filter((l) => l.status === "proposal_sent").length;
  const priorityLeads = initialLeads
    .filter((l) => l.status !== "won" && l.status !== "lost")
    .slice(0, 3);
  const pendingTasksCount = initialTasks.filter((t) => !t.completed).length;

  return (
    <div className="flex flex-col gap-8">
      
      {/* Top Welcome & Quick Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <span className="text-xs font-bold uppercase tracking-wider text-primary">
            Executive Telemetry
          </span>
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-white mt-1">
            Agency Operations Dashboard
          </h1>
          <p className="text-xs sm:text-sm text-gray-500 dark:text-zinc-400 mt-0.5">
            Live pipeline health, after-lead playbooks, and approval-gated outreach.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          <Link
            href="/crm/automations?tab=outbox"
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl font-bold text-xs uppercase tracking-wider bg-white dark:bg-zinc-900 border border-gray-200 dark:border-zinc-800 hover:border-primary/50 text-gray-800 dark:text-zinc-200 shadow-xs transition-all"
          >
            <InboxStackIcon className="w-4 h-4 text-primary" />
            <span>Approval Queue</span>
          </Link>
          <Link
            href="/crm/leads"
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl font-bold text-xs uppercase tracking-wider bg-primary hover:bg-primary/90 text-white shadow-lg shadow-primary/20 transition-all"
          >
            <Squares2X2Icon className="w-4 h-4" />
            <span>Open Pipeline Kanban</span>
          </Link>
        </div>
      </div>

      {/* KPI Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        
        {/* Stat 1: Total Pipeline */}
        <div className="p-5 rounded-2xl bg-white dark:bg-zinc-900/80 border border-gray-200 dark:border-zinc-800 shadow-sm flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold uppercase tracking-wider text-gray-500 dark:text-zinc-400">
              Total Active Pipeline
            </span>
            <div className="p-2 rounded-xl bg-primary/10 text-primary">
              <CurrencyDollarIcon className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-4">
            <div className="text-2xl sm:text-3xl font-black text-gray-900 dark:text-white">
              ${totalPipeline.toLocaleString()}
            </div>
            <p className="text-[11px] text-gray-400 dark:text-zinc-500 mt-1">
              Weighted forecast: <span className="font-semibold text-gray-700 dark:text-zinc-300">${weightedPipeline.toLocaleString()}</span>
            </p>
          </div>
        </div>

        {/* Stat 2: Active Opportunities */}
        <div className="p-5 rounded-2xl bg-white dark:bg-zinc-900/80 border border-gray-200 dark:border-zinc-800 shadow-sm flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold uppercase tracking-wider text-gray-500 dark:text-zinc-400">
              Active Opportunities
            </span>
            <div className="p-2 rounded-xl bg-blue-500/10 text-blue-500">
              <BriefcaseIcon className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-4">
            <div className="text-2xl sm:text-3xl font-black text-gray-900 dark:text-white">
              {openLeads} In Flight
            </div>
            <p className="text-[11px] text-gray-400 dark:text-zinc-500 mt-1">
              Avg ticket: <span className="font-semibold text-gray-700 dark:text-zinc-300">${Math.round(openLeads ? totalPipeline / openLeads : 0).toLocaleString()}</span>
            </p>
          </div>
        </div>

        {/* Stat 3: Agreed Proposals */}
        <div className="p-5 rounded-2xl bg-white dark:bg-zinc-900/80 border border-gray-200 dark:border-zinc-800 shadow-sm flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold uppercase tracking-wider text-gray-500 dark:text-zinc-400">
              Contracted Value
            </span>
            <div className="p-2 rounded-xl bg-emerald-500/10 text-emerald-500">
              <CheckCircleIcon className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-4">
            <div className="text-2xl sm:text-3xl font-black text-emerald-500">
              ${acceptedValue.toLocaleString()}
            </div>
            <p className="text-[11px] text-gray-400 dark:text-zinc-500 mt-1">
              Accepted proposal value
            </p>
          </div>
        </div>

        {/* Stat 4: Pending Follow-ups */}
        <div className="p-5 rounded-2xl bg-white dark:bg-zinc-900/80 border border-gray-200 dark:border-zinc-800 shadow-sm flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold uppercase tracking-wider text-gray-500 dark:text-zinc-400">
              Pending Tasks
            </span>
            <div className="p-2 rounded-xl bg-amber-500/10 text-amber-500">
              <ClockIcon className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-4">
            <div className="text-2xl sm:text-3xl font-black text-gray-900 dark:text-white">
              {pendingTasksCount} Due
            </div>
            <p className="text-[11px] text-gray-400 dark:text-zinc-500 mt-1">
              {newLeadsCount} new · {proposalSentCount} proposal follow-ups
            </p>
          </div>
        </div>

      </div>

      {/* Quick-Access Next Actions & Automations Panel */}
      <div className="p-6 rounded-3xl bg-white dark:bg-zinc-900/80 border border-gray-200 dark:border-zinc-800 shadow-sm">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-5">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-primary/10 text-primary">
              <SparklesIcon className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-base font-bold text-gray-900 dark:text-white">
                Next Actions &amp; Automations
              </h2>
              <p className="text-xs text-gray-500 dark:text-zinc-400">
                What happens after capturing a lead — jump straight to outreach, playbooks, or outbox approvals.
              </p>
            </div>
          </div>
          <Link
            href="/crm/automations"
            className="text-xs font-semibold text-primary hover:underline inline-flex items-center gap-1 shrink-0"
          >
            <span>Open Automation Center</span>
            <ArrowRightIcon className="w-3 h-3" />
          </Link>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-5">
          <Link
            href="/crm/leads"
            className="group p-4 rounded-2xl bg-gray-50 dark:bg-zinc-800/50 border border-gray-200 dark:border-zinc-800 hover:border-primary/50 transition-all flex flex-col justify-between gap-3"
          >
            <div className="flex items-center justify-between">
              <span className="inline-flex items-center gap-1.5 text-xs font-bold text-gray-900 dark:text-white group-hover:text-primary transition-colors">
                <Squares2X2Icon className="w-4 h-4 text-primary" />
                Leads Pipeline &amp; Next Action
              </span>
              <ArrowRightIcon className="w-3.5 h-3.5 text-gray-400 group-hover:text-primary group-hover:translate-x-0.5 transition-all" />
            </div>
            <p className="text-xs text-gray-500 dark:text-zinc-400 leading-relaxed">
              {newLeadsCount} new inquiries &amp; {qualifiedCount} qualified deals ready for call logging or 1-click follow-up drafts.
            </p>
          </Link>

          <Link
            href="/crm/automations?tab=outbox"
            className="group p-4 rounded-2xl bg-gray-50 dark:bg-zinc-800/50 border border-gray-200 dark:border-zinc-800 hover:border-emerald-500/50 transition-all flex flex-col justify-between gap-3"
          >
            <div className="flex items-center justify-between">
              <span className="inline-flex items-center gap-1.5 text-xs font-bold text-gray-900 dark:text-white group-hover:text-emerald-600 dark:group-hover:text-emerald-400 transition-colors">
                <InboxStackIcon className="w-4 h-4 text-emerald-500" />
                Approval &amp; Outbox Queue
              </span>
              <ArrowRightIcon className="w-3.5 h-3.5 text-gray-400 group-hover:text-emerald-500 group-hover:translate-x-0.5 transition-all" />
            </div>
            <p className="text-xs text-gray-500 dark:text-zinc-400 leading-relaxed">
              Review drafted WhatsApp (<span className="font-mono">wa.me</span>) and Gmail follow-ups before anything goes to clients.
            </p>
          </Link>

          <Link
            href="/crm/automations?tab=playbooks"
            className="group p-4 rounded-2xl bg-gray-50 dark:bg-zinc-800/50 border border-gray-200 dark:border-zinc-800 hover:border-blue-500/50 transition-all flex flex-col justify-between gap-3"
          >
            <div className="flex items-center justify-between">
              <span className="inline-flex items-center gap-1.5 text-xs font-bold text-gray-900 dark:text-white group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
                <BoltIcon className="w-4 h-4 text-blue-500" />
                Post-Lead Lifecycle Playbooks
              </span>
              <ArrowRightIcon className="w-3.5 h-3.5 text-gray-400 group-hover:text-blue-500 group-hover:translate-x-0.5 transition-all" />
            </div>
            <p className="text-xs text-gray-500 dark:text-zinc-400 leading-relaxed">
              Toggle the 5-stage free-first workflow: Inquiry, Discovery, Proposal Notice, 72h Nudge, and Won Kickoff.
            </p>
          </Link>
        </div>

        {priorityLeads.length > 0 && (
          <div className="pt-4 border-t border-gray-100 dark:border-zinc-800">
            <span className="text-[10px] font-bold uppercase tracking-wider text-gray-400 dark:text-zinc-500 block mb-2.5">
              Open Leads Waiting for Action
            </span>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              {priorityLeads.map((lead) => (
                <Link
                  key={lead.id}
                  href={`/crm/leads?lead=${encodeURIComponent(lead.id)}`}
                  className="p-3 rounded-xl bg-gray-50/70 dark:bg-zinc-950/60 border border-gray-200 dark:border-zinc-800 hover:border-primary/50 transition-colors flex items-center justify-between gap-2"
                >
                  <div className="min-w-0">
                    <p className="text-xs font-bold text-gray-900 dark:text-white truncate">
                      {lead.company}
                    </p>
                    <p className="text-[11px] text-gray-500 dark:text-zinc-400 truncate">
                      {lead.contact_name} · {lead.status.replaceAll("_", " ")}
                    </p>
                  </div>
                  <span className="px-2 py-1 rounded-lg bg-primary/10 text-primary text-[10px] font-bold shrink-0">
                    Inspect
                  </span>
                </Link>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Main 2-Column Section */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Left 2 Cols: Pipeline Summary & Active Sprints */}
        <div className="lg:col-span-2 flex flex-col gap-8">
          
          {/* Pipeline Stage Health */}
          <div className="p-6 rounded-3xl bg-white dark:bg-zinc-900/80 border border-gray-200 dark:border-zinc-800 shadow-sm">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h2 className="text-base font-bold text-gray-900 dark:text-white">
                  Active Pipeline by Stage
                </h2>
                <p className="text-xs text-gray-500 dark:text-zinc-400">
                  Deal distribution from new inquiry intake to signed contracts.
                </p>
              </div>
              <Link
                href="/crm/leads"
                className="text-xs font-semibold text-primary hover:underline flex items-center gap-1"
              >
                <span>View Kanban</span>
                <ArrowRightIcon className="w-3 h-3" />
              </Link>
            </div>

            {initialLeads.length === 0 ? (
              <div className="py-10 text-center rounded-2xl border border-dashed border-gray-200 dark:border-zinc-800">
                <p className="text-xs font-semibold text-gray-700 dark:text-zinc-300">
                  No leads in the pipeline yet
                </p>
                <p className="text-[11px] text-gray-500 dark:text-zinc-400 mt-1">
                  Submit a client inquiry or inspect the Kanban board to get started.
                </p>
                <Link
                  href="/inquire"
                  className="inline-flex items-center gap-1.5 mt-3 px-4 py-2 rounded-xl bg-primary text-white text-xs font-bold"
                >
                  Create First Inquiry
                </Link>
              </div>
            ) : (
              <div className="flex flex-col gap-3">
                {stageRows.map((row) => (
                  <div key={row.key} className="flex flex-col gap-1.5">
                    <div className="flex items-center justify-between text-xs">
                      <span className="font-semibold text-gray-700 dark:text-zinc-300">
                        {row.stage} ({row.count})
                      </span>
                      <span className="font-bold text-gray-900 dark:text-white">
                        ${row.sum.toLocaleString()}
                      </span>
                    </div>
                    <div className="w-full bg-gray-100 dark:bg-zinc-800 h-2 rounded-full overflow-hidden">
                      <div className={`${row.color} h-full rounded-full transition-all`} style={{ width: row.pct }} />
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Active Client Delivery Projects */}
          <div className="p-6 rounded-3xl bg-white dark:bg-zinc-900/80 border border-gray-200 dark:border-zinc-800 shadow-sm">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h2 className="text-base font-bold text-gray-900 dark:text-white">
                  Active Sprint Deliverables
                </h2>
                <p className="text-xs text-gray-500 dark:text-zinc-400">
                  Projects synced with live client portals.
                </p>
              </div>
              <Link
                href="/crm/projects"
                className="text-xs font-semibold text-primary hover:underline flex items-center gap-1"
              >
                <span>All Projects</span>
                <ArrowRightIcon className="w-3 h-3" />
              </Link>
            </div>

            {initialProjects.length === 0 ? (
              <div className="py-8 text-center rounded-2xl border border-dashed border-gray-200 dark:border-zinc-800">
                <p className="text-xs font-semibold text-gray-700 dark:text-zinc-300">
                  No active sprint deliverables
                </p>
                <p className="text-[11px] text-gray-500 dark:text-zinc-400 mt-1">
                  Accepted proposals automatically appear here for milestone tracking.
                </p>
              </div>
            ) : (
              <div className="flex flex-col gap-4">
                {initialProjects.map((project) => (
                  <div
                    key={project.id}
                    className="p-4 rounded-2xl bg-gray-50 dark:bg-zinc-800/50 border border-gray-200/80 dark:border-zinc-700/60 flex flex-col gap-3"
                  >
                    <div className="flex items-center justify-between">
                      <div>
                        <span className="font-bold text-sm text-gray-900 dark:text-white">
                          {project.title}
                        </span>
                        <p className="text-xs text-gray-500 dark:text-zinc-400 mt-0.5">
                          Client: {project.company} · Target: {project.due_date}
                        </p>
                      </div>
                      <span className="text-xs font-bold px-2.5 py-1 rounded-full bg-primary/10 text-primary border border-primary/20">
                        {project.progress}% Complete
                      </span>
                    </div>
                    <div className="w-full bg-gray-200 dark:bg-zinc-700 h-2 rounded-full overflow-hidden">
                      <div
                        className="bg-primary h-full rounded-full transition-all"
                        style={{ width: `${project.progress}%` }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

        </div>

        {/* Right Col: Tasks & Activity Stream */}
        <div className="flex flex-col gap-8">
          
          {/* Action Tasks */}
          <div className="p-6 rounded-3xl bg-white dark:bg-zinc-900/80 border border-gray-200 dark:border-zinc-800 shadow-sm">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-base font-bold text-gray-900 dark:text-white">
                Follow-Up Queue
              </h2>
              <Link href="/crm/leads" className="text-xs font-semibold text-primary hover:underline">
                Leads
              </Link>
            </div>
            {initialTasks.length === 0 ? (
              <div className="py-8 text-center rounded-2xl border border-dashed border-gray-200 dark:border-zinc-800">
                <p className="text-xs font-semibold text-gray-700 dark:text-zinc-300">
                  All caught up
                </p>
                <p className="text-[11px] text-gray-500 dark:text-zinc-400 mt-1">
                  Open any lead to queue a follow-up draft or log a call.
                </p>
              </div>
            ) : (
              <div className="flex flex-col gap-3">
                {initialTasks.map((task) => (
                  <div
                    key={task.id}
                    className={`p-3 rounded-xl border text-xs flex items-start gap-3 transition-colors ${
                      task.completed
                        ? "bg-gray-50 dark:bg-zinc-900/40 border-gray-200 dark:border-zinc-800/50 opacity-60 line-through"
                        : "bg-white dark:bg-zinc-800/80 border-gray-200 dark:border-zinc-700"
                    }`}
                  >
                    <div className="mt-0.5 shrink-0">
                      <div className={`w-3.5 h-3.5 rounded-full border ${task.completed ? "bg-emerald-500 border-emerald-500" : "border-gray-400"}`} />
                    </div>
                    <div className="flex flex-col min-w-0">
                      <span className="font-semibold text-gray-900 dark:text-white">
                        {task.title}
                      </span>
                      <span className="text-[10px] text-gray-400 dark:text-zinc-500 mt-1">
                        Due: {task.due_date} · {task.assigned_to}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Activity Feed */}
          <div className="p-6 rounded-3xl bg-white dark:bg-zinc-900/80 border border-gray-200 dark:border-zinc-800 shadow-sm">
            <h2 className="text-base font-bold text-gray-900 dark:text-white mb-4">
              Live Team Activity
            </h2>
            {initialActivities.length === 0 ? (
              <div className="py-8 text-center rounded-2xl border border-dashed border-gray-200 dark:border-zinc-800">
                <p className="text-xs font-semibold text-gray-700 dark:text-zinc-300">
                  No recent activity
                </p>
                <p className="text-[11px] text-gray-500 dark:text-zinc-400 mt-1">
                  Stage updates, call logs, and outbox events appear here.
                </p>
              </div>
            ) : (
              <div className="flex flex-col gap-4">
                {initialActivities.map((act) => (
                  <div key={act.id} className="flex items-start gap-3 text-xs">
                    <div className="w-2 h-2 rounded-full bg-primary mt-1.5 shrink-0" />
                    <div className="flex flex-col">
                      <span className="font-bold text-gray-900 dark:text-white">
                        {act.title}
                      </span>
                      <p className="text-gray-600 dark:text-zinc-400 text-[11px] mt-0.5">
                        {act.detail}
                      </p>
                      <span className="text-[10px] text-gray-400 dark:text-zinc-500 mt-1">
                        {act.actor} · {act.created_at}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

        </div>

      </div>

    </div>
  );
}
