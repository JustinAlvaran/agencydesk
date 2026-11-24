"use client";

import React, { useState } from "react";
import type { Proposal } from "@/types/crm";
import Link from "next/link";
import {CreateRecord} from "@/components/crm/create-record";
import { PlusIcon } from "@heroicons/react/24/outline";

export default function View({proposals,leads=[],companies=[]}: {proposals:Proposal[];leads?:{id:string;contact_name:string}[];companies?:{id:string;name:string}[]}) {

  return (
    <div className="flex flex-col gap-6">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <span className="text-xs font-bold uppercase tracking-wider text-primary">
            Contracting &amp; Scopes
          </span>
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-white mt-1">
            Proposals &amp; Agreed Pricing
          </h1>
          <p className="text-xs sm:text-sm text-gray-500 dark:text-zinc-400 mt-0.5">
            Immutable versioned pricing revisions, itemized scopes, and client approval gates.
          </p>
        </div>

        <CreateRecord kind="proposal" leads={leads} companies={companies} />
      </div>

      {proposals.length===0 && <p className="text-sm text-gray-500">No proposals yet.</p>}
      <p className="text-xs text-gray-500">Showing up to 250 recent records.</p>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {proposals.map((prop) => (
          <div
            key={prop.id}
            className="p-6 rounded-3xl bg-white dark:bg-zinc-900/80 border border-gray-200 dark:border-zinc-800 shadow-sm flex flex-col justify-between"
          >
            <div>
              <div className="flex items-center justify-between mb-3">
                <span className="text-[10px] font-bold font-mono px-2 py-0.5 rounded bg-gray-100 dark:bg-zinc-800 text-gray-600 dark:text-zinc-400">
                  {prop.version}
                </span>
                <span
                  className={`px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                    prop.status === "accepted"
                      ? "bg-emerald-500/10 text-emerald-500 border border-emerald-500/20"
                      : prop.status === "published"
                      ? "bg-orange-500/10 text-orange-500 border border-orange-500/20"
                      : "bg-gray-100 dark:bg-zinc-800 text-gray-600 dark:text-zinc-400"
                  }`}
                >
                  {prop.status}
                </span>
              </div>

              <h2 className="text-base font-bold text-gray-900 dark:text-white">
                {prop.title}
              </h2>
              <p className="text-xs font-semibold text-primary mt-1">
                Client: {prop.company}
              </p>

              <div className="mt-4 p-3 rounded-xl bg-gray-50 dark:bg-zinc-800/50 border border-gray-100 dark:border-zinc-700/50 text-xs text-gray-600 dark:text-zinc-300 font-lato leading-relaxed">
                {prop.scope}
              </div>
            </div>

            <div className="mt-6 pt-4 border-t border-gray-100 dark:border-zinc-800 flex items-center justify-between">
              <div>
                <span className="text-[10px] uppercase font-bold text-gray-400">Total Fixed Value</span>
                <div className="text-lg font-black text-gray-900 dark:text-white">
                  ${(prop.total_cents / 100).toLocaleString()}
                </div>
              </div>
              <Link href={`/crm/proposals/${prop.id}`} className="px-3.5 py-1.5 rounded-xl font-bold text-xs uppercase bg-gray-100 dark:bg-zinc-800 hover:bg-primary hover:text-white text-gray-800 dark:text-gray-200 transition-colors">
                View Scope
              </Link>
            </div>
          </div>
        ))}
      </div>

    </div>
  );
}
