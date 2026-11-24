import {requireUser} from "@/lib/auth";
import {crmData} from "@/lib/crm-data";


import React from "react";
import Link from "next/link";
import { CheckCircleIcon, ClockIcon, DocumentTextIcon, ArrowLeftIcon } from "@heroicons/react/24/solid";

export default async function ClientPortalPage() {
  const {supabase}=await requireUser();
  const data=await crmData(supabase,true);

  return (
    <div className="radial-gradient-bg min-h-screen py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-5xl mx-auto">
        
        {/* Back Link */}
        <div className="flex items-center justify-between mb-8">
          <Link
            href="/"
            className="inline-flex items-center gap-2 text-xs font-semibold text-gray-500 hover:text-primary transition-colors"
          >
            <ArrowLeftIcon className="w-3.5 h-3.5" />
            <span>Back to AgencyDesk Home</span>
          </Link>

          <span className="px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider bg-emerald-500/10 text-emerald-500 border border-emerald-500/20">
            Authenticated Client Session
          </span>
        </div>

        <h1 className="text-3xl font-bold mb-6">Your client workspace</h1>
        {data.projects.length===0&&<p className="text-gray-500 mb-6">Your agency has not assigned a project yet.</p>}
        {data.projects.map(project=><section key={project.id} className="rounded-3xl bg-white/80 dark:bg-zinc-950/80 backdrop-blur-2xl border border-gray-200 dark:border-zinc-800 p-6 sm:p-10 shadow-2xl mb-8">
          <h2 className="text-2xl font-bold">{project.title}</h2><p className="text-sm text-gray-500 mt-2">{project.company} · {project.progress}% complete</p>
          <div className="w-full bg-gray-200 dark:bg-zinc-800 h-2.5 rounded-full overflow-hidden my-6"><div className="bg-primary h-full rounded-full" style={{width:`${project.progress}%`}}/></div>
          <div className="grid md:grid-cols-2 gap-4">{project.milestones.map((m,i)=><div key={m.id??i} className="p-4 rounded-2xl border border-gray-200 dark:border-zinc-800 text-sm"><h3 className="font-bold">{m.title}</h3><p>{m.review_status?.replaceAll('_',' ')} · {m.due_date}</p></div>)}</div>
          <Link className="inline-block mt-6 text-primary text-sm font-bold" href={`/portal/projects/${project.id}`}>Review milestones and deliverables</Link>
        </section>)}
        <section className="rounded-3xl bg-white/80 dark:bg-zinc-950/80 border border-gray-200 dark:border-zinc-800 p-6 sm:p-10"><h2 className="text-xl font-bold mb-4">Proposal scopes</h2>
        {data.proposals.length===0&&<p className="text-gray-500 text-sm">No published proposals yet.</p>}
        {data.proposals.map(p=><Link key={p.id} href={`/portal/proposals/${p.id}`} className="block py-4 border-b border-gray-200 dark:border-zinc-800"><strong>{p.title}</strong><span className="block text-sm text-gray-500">{p.version} · {p.status} · ${(p.total_cents/100).toLocaleString()}</span></Link>)}
        </section>

      </div>
    </div>
  );
}
