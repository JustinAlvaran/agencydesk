"use client";

import React, { useState } from "react";
import type { Project } from "@/types/crm";
import Link from "next/link";
import {CreateRecord} from "@/components/crm/create-record";
import { CheckCircleIcon, ClockIcon } from "@heroicons/react/24/solid";

export default function View({projects,leads=[],companies=[]}: {projects:Project[];leads?:{id:string;contact_name:string}[];companies?:{id:string;name:string}[]}) {

  return (
    <div className="flex flex-col gap-6">
      
      {/* Header */}
      <div>
        <span className="text-xs font-bold uppercase tracking-wider text-primary">
          Execution &amp; Sprints
        </span>
        <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-white mt-1">
          Project Delivery Tracker
        </h1>
        <p className="text-xs sm:text-sm text-gray-500 dark:text-zinc-400 mt-0.5">
          Milestone progress and deliverables synced directly with client workspaces.
        </p>
      </div>

      {projects.length===0 && <p className="text-sm text-gray-500">No projects yet.</p>}
      <p className="text-xs text-gray-500">Showing up to 250 recent records.</p>
      <div className="flex flex-col gap-6">
        {projects.map((project) => (
          <div
            key={project.id}
            className="p-6 sm:p-8 rounded-3xl bg-white dark:bg-zinc-900/80 border border-gray-200 dark:border-zinc-800 shadow-sm flex flex-col gap-6"
          >
            {/* Project Header */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <div className="flex items-center gap-2">
                  <h2 className="text-lg sm:text-xl font-bold text-gray-900 dark:text-white">
                    <Link href={`/crm/projects/${project.id}`}>{project.title}</Link>
                  </h2>
                  <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-emerald-500/10 text-emerald-500 border border-emerald-500/20">
                    {project.status.replaceAll("_", " ")}
                  </span>
                </div>
                <p className="text-xs text-gray-500 dark:text-zinc-400 mt-1">
                  Client Account: <span className="font-semibold text-gray-700 dark:text-zinc-300">{project.company}</span> · Target Delivery: <span className="font-semibold text-gray-700 dark:text-zinc-300">{project.due_date}</span>
                </p>
              </div>

              <div className="flex items-center gap-4 self-end sm:self-auto">
                <div className="text-right">
                  <span className="text-[10px] font-bold uppercase text-gray-400">Completion</span>
                  <div className="text-xl font-black text-primary">{project.progress}%</div>
                </div>
              </div>
            </div>

            {/* Progress Bar */}
            <div className="w-full bg-gray-100 dark:bg-zinc-800 h-2.5 rounded-full overflow-hidden">
              <div
                className="bg-primary h-full rounded-full transition-all duration-500"
                style={{ width: `${project.progress}%` }}
              />
            </div>

            {/* Milestones Roadmap */}
            <div>
              <h3 className="text-xs font-bold uppercase tracking-wider text-gray-700 dark:text-zinc-300 mb-3">
                Milestone Deliverable Sprints
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {project.milestones.map((m, i) => (
                  <div
                    key={i}
                    className={`p-3.5 rounded-2xl border text-xs flex items-center justify-between transition-colors ${
                      m.completed
                        ? "bg-emerald-500/5 border-emerald-500/20 text-gray-800 dark:text-zinc-200"
                        : "bg-gray-50 dark:bg-zinc-800/40 border-gray-200 dark:border-zinc-700 text-gray-600 dark:text-zinc-400"
                    }`}
                  >
                    <div className="flex items-center gap-2.5 min-w-0">
                      {m.completed ? (
                        <CheckCircleIcon className="w-4 h-4 text-emerald-500 shrink-0" />
                      ) : (
                        <ClockIcon className="w-4 h-4 text-primary shrink-0" />
                      )}
                      <span className="font-semibold truncate">{m.title}</span>
                    </div>
                    <span className="text-[10px] font-mono text-gray-400 shrink-0 ml-2">
                      {m.due_date}
                    </span>
                  </div>
                ))}
              </div>
            </div>

          </div>
        ))}
      </div>

    </div>
  );
}
