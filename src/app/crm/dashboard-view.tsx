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
  Squares2X2Icon
} from "@heroicons/react/24/solid";

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
  const stageRows=['new','contacted','qualified','proposal_sent','won','lost'].map(stage=>{const rows=initialLeads.filter(l=>l.status===stage);return {stage:stage.replaceAll('_',' '),count:rows.length,sum:rows.reduce((a,l)=>a+l.budget,0),color:'bg-primary',pct:`${initialLeads.length?rows.length/initialLeads.length*100:0}%`};});
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
            Agency totals and the latest 250 records. Refresh to see new changes.
          </p>
        </div>

        <div className="flex items-center gap-3">
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
              {initialTasks.filter((t) => !t.completed).length} Due
            </div>
            <p className="text-[11px] text-gray-400 dark:text-zinc-500 mt-1">
              Zero overdue discovery calls
            </p>
          </div>
        </div>

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

            <div className="flex flex-col gap-3">
              {stageRows.map((row, i) => (
                <div key={i} className="flex flex-col gap-1.5">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-semibold text-gray-700 dark:text-zinc-300">
                      {row.stage} ({row.count})
                    </span>
                    <span className="font-bold text-gray-900 dark:text-white">
                      ${row.sum.toLocaleString()}
                    </span>
                  </div>
                  <div className="w-full bg-gray-100 dark:bg-zinc-800 h-2 rounded-full overflow-hidden">
                    <div className={`${row.color} h-full rounded-full`} style={{ width: row.pct }} />
                  </div>
                </div>
              ))}
            </div>
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
          </div>

        </div>

        {/* Right Col: Tasks & Activity Stream */}
        <div className="flex flex-col gap-8">
          
          {/* Action Tasks */}
          <div className="p-6 rounded-3xl bg-white dark:bg-zinc-900/80 border border-gray-200 dark:border-zinc-800 shadow-sm">
            <h2 className="text-base font-bold text-gray-900 dark:text-white mb-4">
              Follow-Up Queue
            </h2>
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
          </div>

          {/* Activity Feed */}
          <div className="p-6 rounded-3xl bg-white dark:bg-zinc-900/80 border border-gray-200 dark:border-zinc-800 shadow-sm">
            <h2 className="text-base font-bold text-gray-900 dark:text-white mb-4">
              Live Team Activity
            </h2>
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
          </div>

        </div>

      </div>

    </div>
  );
}
