"use client";

import React, { useState, useEffect, Suspense } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";

import { Lead, LeadStatus } from "@/types/crm";
import { initialLeads } from "@/lib/mock-crm-data";
import { toast } from "sonner";
import {
  MagnifyingGlassIcon,
  FunnelIcon,
  Squares2X2Icon,
  TableCellsIcon,
  PlusIcon,
  XMarkIcon,
  DocumentTextIcon,
} from "@heroicons/react/24/outline";

const stageDefinitions: { key: LeadStatus; label: string; prob: number; color: string; border: string }[] = [
  { key: "new", label: "New Inquiry", prob: 20, color: "bg-blue-500", border: "border-blue-500/40" },
  { key: "contacted", label: "Contacted", prob: 40, color: "bg-amber-500", border: "border-amber-500/40" },
  { key: "qualified", label: "Qualified", prob: 60, color: "bg-purple-500", border: "border-purple-500/40" },
  { key: "proposal_sent", label: "Proposal Sent", prob: 80, color: "bg-orange-500", border: "border-orange-500/40" },
  { key: "lost", label: "Lost", prob: 0, color: "bg-zinc-500", border: "border-zinc-500/40" },
  { key: "won", label: "Won / Kickoff", prob: 100, color: "bg-emerald-500", border: "border-emerald-500/40" },
];

function LeadsPipelineContent() {
  const searchParams = useSearchParams();
  const leadParam = searchParams.get("lead");

  const [leads, setLeads] = useState<Lead[]>(initialLeads);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedService, setSelectedService] = useState("all");
  const [viewMode, setViewMode] = useState<"kanban" | "table">("kanban");
  const [activeLead, setActiveLead] = useState<Lead | null>(null);
  const [newNote, setNewNote] = useState("");

  // Sync leads from backend API
  useEffect(() => {
    fetch("/api/crm/leads")
      .then((res) => (res.ok ? res.json() : Promise.reject(new Error("Sync failed"))))
      .then((data) => {
        if (data?.leads && Array.isArray(data.leads)) {
          setLeads(data.leads);
        }
      })
      .catch(() => {
        toast.error("Could not sync live leads. Showing cached workspace view.");
      });
  }, []);

  // Deep-link support: auto-open lead inspection drawer if ?lead=<id> is present
  useEffect(() => {
    if (leadParam && leads.length > 0) {
      const match = leads.find((l) => l.id.toLowerCase() === leadParam.toLowerCase());
      if (match) {
        setActiveLead(match);
      }
    }
  }, [leadParam, leads]);

  const filteredLeads = leads.filter((lead) => {
    const matchesSearch =
      lead.contact_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      lead.company.toLowerCase().includes(searchQuery.toLowerCase()) ||
      lead.email.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesService =
      selectedService === "all" || lead.service.toLowerCase().includes(selectedService.toLowerCase());
    return matchesSearch && matchesService;
  });

  const [saving, setSaving] = useState(false);
  const moveStage = async (id: string, newStage: LeadStatus) => {
    const current = leads.find(l=>l.id===id);
    if (saving || !current) return;
    if (newStage === 'won') { toast.error('Win this deal through client proposal acceptance.'); return; }
    setSaving(true);
    try {
      const response=await fetch(`/api/crm/leads/${id}/stage`,{method:'PATCH',headers:{'Content-Type':'application/json'},body:JSON.stringify({stage:newStage,row_version:current.row_version})});
      const data=await response.json(); if(!response.ok)throw new Error(data.error);
      const updated={...current,status:data.lead.status,probability:data.lead.probability,row_version:data.lead.row_version};
      setLeads(prev=>prev.map(l=>l.id===id?updated:l)); if(activeLead?.id===id)setActiveLead(updated);
      toast.success('Stage saved');
    } catch(error) { toast.error(error instanceof Error?error.message:'Could not save stage.'); }
    finally { setSaving(false); }
  };
  const handleAddNote = async (e: React.FormEvent) => {
    e.preventDefault(); if(!activeLead || !newNote.trim() || saving)return;
    setSaving(true);
    try {
      const response=await fetch(`/api/crm/leads/${activeLead.id}/notes`,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({note:newNote.trim()})});
      const data=await response.json();if(!response.ok)throw new Error(data.error);
      const updated={...activeLead,notes:[...(activeLead.notes??[]),newNote.trim()]};
      setLeads(prev=>prev.map(l=>l.id===updated.id?updated:l));setActiveLead(updated);setNewNote('');toast.success('Note saved');
    } catch(error) { toast.error(error instanceof Error?error.message:'Could not save note.'); }
    finally { setSaving(false); }
  };

  return (
    <div className="flex flex-col gap-6">
      
      {/* Header Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <span className="text-xs font-bold uppercase tracking-wider text-primary">
            Opportunity Management
          </span>
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-white mt-1">
            Sales Pipeline Kanban
          </h1>
          <p className="text-xs sm:text-sm text-gray-500 dark:text-zinc-400 mt-0.5">
            Stage-weighted forecasting and full lead lifecycle tracking.
          </p>
        </div>

        <div className="flex items-center gap-2">
          {/* View Mode Toggle */}
          <div className="flex items-center p-1 rounded-xl bg-gray-100 dark:bg-zinc-900 border border-gray-200 dark:border-zinc-800">
            <button
              onClick={() => setViewMode("kanban")}
              className={`p-1.5 rounded-lg text-xs transition-colors ${
                viewMode === "kanban"
                  ? "bg-white dark:bg-zinc-800 text-gray-900 dark:text-white shadow-xs"
                  : "text-gray-400 hover:text-white"
              }`}
              title="Kanban Board"
            >
              <Squares2X2Icon className="w-4 h-4" />
            </button>
            <button
              onClick={() => setViewMode("table")}
              className={`p-1.5 rounded-lg text-xs transition-colors ${
                viewMode === "table"
                  ? "bg-white dark:bg-zinc-800 text-gray-900 dark:text-white shadow-xs"
                  : "text-gray-400 hover:text-white"
              }`}
              title="Table View"
            >
              <TableCellsIcon className="w-4 h-4" />
            </button>
          </div>

          <Link
            href="/inquire"
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl font-bold text-xs uppercase tracking-wider bg-primary hover:bg-primary/90 text-white shadow-md shadow-primary/20 transition-all"
          >
            <PlusIcon className="w-4 h-4" />
            <span>New Lead</span>
          </Link>
        </div>
      </div>

      {/* Filter & Search Toolbar */}
      <div className="p-4 rounded-2xl bg-white dark:bg-zinc-900/80 border border-gray-200 dark:border-zinc-800 shadow-sm flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="relative w-full sm:w-80">
          <MagnifyingGlassIcon className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Filter by contact, company, or email..."
            className="w-full h-9 pl-9 pr-4 rounded-xl bg-gray-50 dark:bg-zinc-800/80 border border-gray-200 dark:border-zinc-700 text-xs text-gray-900 dark:text-white focus:outline-none focus:border-primary/50"
          />
        </div>

        <div className="flex items-center gap-3 w-full sm:w-auto">
          <div className="flex items-center gap-2 text-xs text-gray-500 dark:text-zinc-400">
            <FunnelIcon className="w-3.5 h-3.5" />
            <span>Service:</span>
          </div>
          <select
            value={selectedService}
            onChange={(e) => setSelectedService(e.target.value)}
            className="h-9 px-3 rounded-xl bg-gray-50 dark:bg-zinc-800/80 border border-gray-200 dark:border-zinc-700 text-xs text-gray-900 dark:text-white focus:outline-none focus:border-primary/50"
          >
            <option value="all">All Services</option>
            <option value="web">Web &amp; Mobile</option>
            <option value="automations">AI &amp; Automations</option>
            <option value="cloud">Cloud &amp; Supabase</option>
            <option value="analytics">Analytics</option>
            <option value="crm">Custom CRM</option>
          </select>

          <span className="text-xs text-gray-400 dark:text-zinc-500 ml-2">
            {filteredLeads.length} leads
          </span>
        </div>
      </div>

      {/* View Mode 1: Kanban Board */}
      {viewMode === "kanban" && (
        <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-4 overflow-x-auto pb-6">
          {stageDefinitions.map((stage) => {
            const stageLeads = filteredLeads.filter((l) => l.status === stage.key);
            const stageBudgetTotal = stageLeads.reduce((acc, l) => acc + l.budget, 0);

            return (
              <div
                key={stage.key}
                className={`flex flex-col rounded-2xl bg-white/70 dark:bg-zinc-900/60 border ${stage.border} p-3.5 min-w-[240px] shadow-xs`}
              >
                {/* Column Header */}
                <div className="flex items-start justify-between pb-3 mb-3 border-b border-gray-100 dark:border-zinc-800">
                  <div>
                    <h3 className="text-xs font-bold uppercase tracking-wider text-gray-900 dark:text-white">
                      {stage.label}
                    </h3>
                    <p className="text-[11px] font-semibold text-primary mt-0.5">
                      ${stageBudgetTotal.toLocaleString()}{" "}
                      <span className="text-[10px] text-gray-400 font-normal">
                        ({stage.prob}%)
                      </span>
                    </p>
                  </div>
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-gray-100 dark:bg-zinc-800 text-gray-600 dark:text-zinc-400">
                    {stageLeads.length}
                  </span>
                </div>

                {/* Cards Stack */}
                <div className="flex flex-col gap-3">
                  {stageLeads.map((lead) => (
                    <div
                      key={lead.id}
                      onClick={() => setActiveLead(lead)}
                      className="p-3.5 rounded-xl bg-white dark:bg-zinc-800/90 border border-gray-200 dark:border-zinc-700/80 hover:border-primary/60 dark:hover:border-primary/60 shadow-xs cursor-pointer transition-all group"
                    >
                      <div className="flex items-start justify-between">
                        <span className="font-bold text-xs text-gray-900 dark:text-white group-hover:text-primary transition-colors">
                          {lead.company}
                        </span>
                        <span className="text-xs font-black text-gray-900 dark:text-white">
                          ${lead.budget.toLocaleString()}
                        </span>
                      </div>

                      <p className="text-[11px] text-gray-500 dark:text-zinc-400 line-clamp-1 mt-1">
                        {lead.service}
                      </p>

                      <p className="text-[11px] text-gray-600 dark:text-zinc-300 line-clamp-2 mt-2 font-lato leading-relaxed">
                        {lead.brief}
                      </p>

                      <div className="flex items-center justify-between mt-3 pt-2.5 border-t border-gray-100 dark:border-zinc-700/50 text-[10px]">
                        <span className="text-gray-500 dark:text-zinc-400 font-medium">
                          {lead.contact_name}
                        </span>
                        <div className="flex items-center gap-1.5">
                          {(lead.whatsapp || lead.phone) && (
                            <span className="px-1.5 py-0.5 rounded text-[9px] font-bold bg-emerald-500/10 text-emerald-500 border border-emerald-500/20" title={lead.whatsapp || lead.phone}>
                              WA
                            </span>
                          )}
                          {lead.instagram && (
                            <span className="px-1.5 py-0.5 rounded text-[9px] font-bold bg-pink-500/10 text-pink-500 border border-pink-500/20" title={lead.instagram}>
                              IG
                            </span>
                          )}
                          <span className="text-primary font-bold">
                            {lead.probability}% Prob
                          </span>
                        </div>
                      </div>
                    </div>
                  ))}

                  {stageLeads.length === 0 && (
                    <div className="py-10 text-center text-xs text-gray-400 dark:text-zinc-600 border border-dashed border-gray-200 dark:border-zinc-800 rounded-xl">
                      No leads in {stage.label}
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* View Mode 2: Dense Table View */}
      {viewMode === "table" && (
        <div className="rounded-2xl bg-white dark:bg-zinc-900/80 border border-gray-200 dark:border-zinc-800 shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-gray-200 dark:border-zinc-800 bg-gray-50 dark:bg-zinc-900 text-gray-400 dark:text-zinc-500 uppercase tracking-wider">
                  <th className="py-3.5 px-4 font-semibold">Company / Lead</th>
                  <th className="py-3.5 px-4 font-semibold">Contact Person</th>
                  <th className="py-3.5 px-4 font-semibold">Service</th>
                  <th className="py-3.5 px-4 font-semibold">Budget</th>
                  <th className="py-3.5 px-4 font-semibold">Stage</th>
                  <th className="py-3.5 px-4 font-semibold">Owner</th>
                  <th className="py-3.5 px-4 font-semibold">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 dark:divide-zinc-800 text-gray-700 dark:text-zinc-300">
                {filteredLeads.map((lead) => (
                  <tr
                    key={lead.id}
                    onClick={() => setActiveLead(lead)}
                    className="hover:bg-gray-50 dark:hover:bg-zinc-800/50 cursor-pointer transition-colors"
                  >
                    <td className="py-3.5 px-4 font-bold text-gray-900 dark:text-white">
                      {lead.company}
                    </td>
                    <td className="py-3.5 px-4">
                      <div>{lead.contact_name}</div>
                      <div className="text-[10px] text-gray-400 flex items-center gap-1.5 mt-0.5">
                        <span>{lead.email}</span>
                        {(lead.whatsapp || lead.phone) && (
                          <span className="px-1 py-0.2 rounded text-[8px] font-bold bg-emerald-500/10 text-emerald-500 border border-emerald-500/20">
                            WA
                          </span>
                        )}
                        {lead.instagram && (
                          <span className="px-1 py-0.2 rounded text-[8px] font-bold bg-pink-500/10 text-pink-500 border border-pink-500/20">
                            IG
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="py-3.5 px-4">{lead.service}</td>
                    <td className="py-3.5 px-4 font-bold text-primary">
                      ${lead.budget.toLocaleString()}
                    </td>
                    <td className="py-3.5 px-4">
                      <span className="px-2.5 py-1 rounded-full text-[10px] font-bold bg-primary/10 text-primary border border-primary/20 uppercase">
                        {lead.status.replace("_", " ")}
                      </span>
                    </td>
                    <td className="py-3.5 px-4 text-gray-500">{lead.owner}</td>
                    <td className="py-3.5 px-4">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setActiveLead(lead);
                        }}
                        className="text-primary hover:underline font-bold text-[11px]"
                      >
                        Inspect
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Slide-Over Detail Drawer Modal */}
      {activeLead && (
        <div className="fixed inset-0 z-50 flex justify-end">
          <div
            onClick={() => setActiveLead(null)}
            className="fixed inset-0 bg-black/60 backdrop-blur-xs transition-opacity"
          />
          <div className="relative z-10 w-full max-w-lg bg-white dark:bg-zinc-950 border-l border-gray-200 dark:border-zinc-800 shadow-2xl p-6 sm:p-8 flex flex-col justify-between overflow-y-auto">
            
            <div>
              {/* Drawer Top */}
              <div className="flex items-start justify-between pb-4 border-b border-gray-200 dark:border-zinc-800">
                <div>
                  <span className="text-[10px] font-bold uppercase tracking-wider text-primary">
                    Lead Inspection
                  </span>
                  <h2 className="text-xl font-bold text-gray-900 dark:text-white mt-0.5">
                    {activeLead.company}
                  </h2>
                  <p className="text-xs text-gray-500 dark:text-zinc-400">
                    Contact: {activeLead.contact_name} ({activeLead.email})
                  </p>
                </div>
                <button
                  onClick={() => setActiveLead(null)}
                  className="p-1 rounded-lg text-gray-400 hover:text-white"
                >
                  <XMarkIcon className="w-5 h-5" />
                </button>
              </div>

              {/* Stage Transition Selector */}
              <div className="my-6">
                <label className="block text-[11px] font-bold uppercase tracking-wider text-gray-500 dark:text-zinc-400 mb-2">
                  Pipeline Stage &amp; Progression
                </label>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                  {stageDefinitions.map((s) => (
                    <button
                      key={s.key}
                      onClick={() => moveStage(activeLead.id, s.key)}
                      className={`px-3 py-2 rounded-xl text-xs font-semibold border text-center transition-all ${
                        activeLead.status === s.key
                          ? "bg-primary text-white border-primary shadow-xs"
                          : "bg-gray-50 dark:bg-zinc-900 border-gray-200 dark:border-zinc-800 text-gray-600 dark:text-zinc-400 hover:border-gray-400"
                      }`}
                    >
                      {s.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Financial & Scope Specs */}
              <div className="grid grid-cols-2 gap-4 p-4 rounded-2xl bg-gray-50 dark:bg-zinc-900/60 border border-gray-200 dark:border-zinc-800 text-xs mb-6">
                <div>
                  <span className="text-gray-400 block text-[10px] uppercase font-bold">Target Budget</span>
                  <span className="text-base font-extrabold text-primary">${activeLead.budget.toLocaleString()}</span>
                </div>
                <div>
                  <span className="text-gray-400 block text-[10px] uppercase font-bold">Probability</span>
                  <span className="text-base font-extrabold text-gray-900 dark:text-white">{activeLead.probability}%</span>
                </div>
                <div className="col-span-2 pt-2 border-t border-gray-200 dark:border-zinc-800">
                  <span className="text-gray-400 block text-[10px] uppercase font-bold">Service Required</span>
                  <span className="font-semibold text-gray-800 dark:text-zinc-200">{activeLead.service}</span>
                </div>
              </div>

              {/* Direct Outreach & Social Channels */}
              <div className="p-4 rounded-2xl bg-gray-50 dark:bg-zinc-900/60 border border-gray-200 dark:border-zinc-800 text-xs mb-6 space-y-3">
                <span className="text-[10px] font-bold uppercase tracking-wider text-gray-500 dark:text-zinc-400 block">
                  Outreach Channels &amp; Automation
                </span>

                {/* WhatsApp Channel */}
                <div className="flex items-center justify-between p-3 rounded-xl bg-white dark:bg-zinc-850 border border-gray-200 dark:border-zinc-750">
                  <div className="flex items-center gap-2.5">
                    <div className="w-8 h-8 rounded-lg bg-emerald-500/10 text-emerald-500 flex items-center justify-center font-bold text-xs">
                      WA
                    </div>
                    <div>
                      <div className="font-bold text-gray-900 dark:text-white flex items-center gap-1.5">
                        <span>{activeLead.whatsapp || activeLead.phone || "No WhatsApp"}</span>
                        {activeLead.whatsapp_opt_in && (
                          <span className="px-1.5 py-0.5 rounded-full text-[9px] font-bold bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30">
                            Opted In
                          </span>
                        )}
                      </div>
                      <div className="text-[10px] text-gray-400">Direct message channel</div>
                    </div>
                  </div>
                  {(activeLead.whatsapp || activeLead.phone) ? (
                    <a
                      href={`https://wa.me/${(activeLead.whatsapp || activeLead.phone || '').replace(/[^0-9]/g, '')}?text=${encodeURIComponent(`Hi ${activeLead.contact_name}, this is Justin from AgencyDesk regarding your inquiry for ${activeLead.service}.`)}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="px-3 py-1.5 rounded-lg text-xs font-bold bg-emerald-500 hover:bg-emerald-600 text-white shadow-xs transition-colors"
                    >
                      Chat on WA
                    </a>
                  ) : (
                    <span className="text-[11px] text-gray-400 italic">Not set</span>
                  )}
                </div>

                {/* Instagram Channel */}
                <div className="flex items-center justify-between p-3 rounded-xl bg-white dark:bg-zinc-850 border border-gray-200 dark:border-zinc-750">
                  <div className="flex items-center gap-2.5">
                    <div className="w-8 h-8 rounded-lg bg-pink-500/10 text-pink-500 flex items-center justify-center font-bold text-xs">
                      IG
                    </div>
                    <div>
                      <div className="font-bold text-gray-900 dark:text-white">
                        {activeLead.instagram ? (
                          activeLead.instagram.startsWith('@') ? activeLead.instagram : `@${activeLead.instagram.replace(/^https?:\/\/(www\.)?instagram\.com\//, '').replace(/\/$/, '')}`
                        ) : (
                          "No Instagram"
                        )}
                      </div>
                      <div className="text-[10px] text-gray-400">Brand &amp; social audit</div>
                    </div>
                  </div>
                  {activeLead.instagram ? (
                    <a
                      href={activeLead.instagram.startsWith('http') ? activeLead.instagram : `https://instagram.com/${activeLead.instagram.replace(/^@/, '')}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="px-3 py-1.5 rounded-lg text-xs font-bold bg-linear-to-r from-purple-500 to-pink-500 hover:opacity-90 text-white shadow-xs transition-opacity"
                    >
                      View IG
                    </a>
                  ) : (
                    <span className="text-[11px] text-gray-400 italic">Not set</span>
                  )}
                </div>
              </div>

              {/* Project Brief */}
              <div className="mb-6">
                <h3 className="text-xs font-bold uppercase tracking-wider text-gray-700 dark:text-zinc-300 mb-1.5">
                  Client Project Brief
                </h3>
                <div className="p-4 rounded-2xl bg-gray-50 dark:bg-zinc-900/40 border border-gray-200 dark:border-zinc-800 text-xs text-gray-700 dark:text-zinc-300 font-lato leading-relaxed">
                  {activeLead.brief}
                </div>
              </div>

              {/* Internal Notes Feed */}
              <div className="mb-6">
                <h3 className="text-xs font-bold uppercase tracking-wider text-gray-700 dark:text-zinc-300 mb-2">
                  Staff Notes &amp; Call Logs
                </h3>
                <div className="flex flex-col gap-2 mb-3">
                  {activeLead.notes && activeLead.notes.length > 0 ? (
                    activeLead.notes.map((note, i) => (
                      <div
                        key={i}
                        className="p-3 rounded-xl bg-white dark:bg-zinc-900 border border-gray-200 dark:border-zinc-800 text-xs text-gray-700 dark:text-zinc-300"
                      >
                        {note}
                      </div>
                    ))
                  ) : (
                    <div className="text-xs text-gray-400 dark:text-zinc-600">
                      No internal notes recorded.
                    </div>
                  )}
                </div>

                <form onSubmit={handleAddNote} className="flex gap-2">
                  <input
                    type="text"
                    value={newNote}
                    onChange={(e) => setNewNote(e.target.value)}
                    placeholder="Log call note or reminder..."
                    className="flex-1 h-9 px-3 rounded-xl bg-gray-50 dark:bg-zinc-900 border border-gray-200 dark:border-zinc-700 text-xs text-gray-900 dark:text-white focus:outline-none focus:border-primary"
                  />
                  <button
                    type="submit"
                    className="px-3.5 py-1.5 rounded-xl font-bold text-xs uppercase bg-primary hover:bg-primary/90 text-white shadow-xs"
                  >
                    Add
                  </button>
                </form>
              </div>

            </div>

            {/* Bottom Actions */}
            <div className="pt-6 border-t border-gray-200 dark:border-zinc-800 flex items-center gap-3">
              <Link
                href="/crm/proposals"
                className="flex-1 flex items-center justify-center gap-2 py-3 rounded-xl font-bold text-xs uppercase tracking-wider bg-primary hover:bg-primary/90 text-white shadow-md shadow-primary/20 transition-all"
              >
                <DocumentTextIcon className="w-4 h-4" />
                <span>Draft Proposal Scope</span>
              </Link>
            </div>

          </div>
        </div>
      )}

    </div>
  );
}

export default function LeadsPipelinePage() {
  return (
    <Suspense fallback={<div className="p-8 text-xs text-gray-500">Loading pipeline...</div>}>
      <LeadsPipelineContent />
    </Suspense>
  );
}
