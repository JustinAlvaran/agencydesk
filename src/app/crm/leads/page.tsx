"use client";

import React, { useState, useEffect, Suspense, useMemo, useRef } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { Lead, LeadStatus } from "@/types/crm";
import { initialLeads } from "@/lib/mock-crm-data";
import {
  recommendNextAction,
  buildWhatsAppUrl,
  buildMailtoUrl,
  type PlaybooksPostResponse,
  type StagePatchResponse,
} from "@/lib/automation-playbooks";
import { toast } from "sonner";
import {
  MagnifyingGlassIcon,
  FunnelIcon,
  Squares2X2Icon,
  TableCellsIcon,
  PlusIcon,
  XMarkIcon,
  DocumentTextIcon,
  BoltIcon,
  PhoneIcon,
  EnvelopeIcon,
  ChatBubbleLeftRightIcon,
  ArrowRightIcon,
  SparklesIcon,
} from "@heroicons/react/24/outline";

const stageDefinitions: {
  key: LeadStatus;
  label: string;
  shortLabel: string;
  prob: number;
  color: string;
  border: string;
}[] = [
  { key: "new", label: "New Inquiry", shortLabel: "New", prob: 20, color: "bg-blue-500", border: "border-blue-500/40" },
  { key: "contacted", label: "Contacted", shortLabel: "Contacted", prob: 40, color: "bg-amber-500", border: "border-amber-500/40" },
  { key: "qualified", label: "Qualified", shortLabel: "Qualified", prob: 60, color: "bg-purple-500", border: "border-purple-500/40" },
  { key: "proposal_sent", label: "Proposal Sent", shortLabel: "Proposal Sent", prob: 80, color: "bg-orange-500", border: "border-orange-500/40" },
  { key: "won", label: "Won / Kickoff", shortLabel: "Won", prob: 100, color: "bg-emerald-500", border: "border-emerald-500/40" },
  { key: "lost", label: "Lost", shortLabel: "Lost", prob: 0, color: "bg-zinc-500", border: "border-zinc-500/40" },
];

const actionableStagePills: { key: Exclude<LeadStatus, "won">; label: string }[] = [
  { key: "new", label: "New" },
  { key: "contacted", label: "Contacted" },
  { key: "qualified", label: "Qualified" },
  { key: "proposal_sent", label: "Proposal Sent" },
  { key: "lost", label: "Lost" },
];

type SmartFilterKey = "all" | "whatsapp" | "instagram" | "high_score";
type CallOutcomeKey = "Connected" | "No Answer" | "Callback" | "Not Interested";

const callOutcomes: CallOutcomeKey[] = ["Connected", "No Answer", "Callback", "Not Interested"];

function computeLeadScore(lead: Lead): number {
  if (typeof lead.score === "number") return lead.score;
  return (
    (lead.budget > 0 ? 25 : 0) +
    (lead.company && lead.company !== "Unassigned company" ? 25 : 0) +
    (lead.brief && lead.brief.length >= 100 ? 25 : 0) +
    (["qualified", "proposal_sent", "won"].includes(lead.status) ? 25 : 0)
  );
}

function getLeadSourceLabel(lead: Lead): string {
  if (lead.instagram) return "Instagram";
  if (lead.whatsapp || lead.phone) return "WhatsApp";
  return "Web Intake";
}

function safeInstagramHref(raw?: string): string | null {
  if (!raw) return null;
  const trimmed = raw.trim();
  if (!trimmed) return null;
  if (/^https:\/\/(www\.)?instagram\.com\/[A-Za-z0-9._]+\/?$/i.test(trimmed)) {
    return trimmed;
  }
  const stripped = trimmed
    .replace(/^https?:\/\/(www\.)?instagram\.com\//i, "")
    .replace(/^@/, "")
    .replace(/[^A-Za-z0-9._]/g, "");
  return stripped ? `https://instagram.com/${stripped}` : null;
}

function LeadsPipelineContent() {
  const searchParams = useSearchParams();
  const leadParam = searchParams.get("lead");
  const queryParam = searchParams.get("q") ?? "";

  const [leads, setLeads] = useState<Lead[]>(initialLeads);
  const [searchQuery, setSearchQuery] = useState(queryParam);
  const [selectedService, setSelectedService] = useState("all");
  const [smartFilter, setSmartFilter] = useState<SmartFilterKey>("all");
  const [viewMode, setViewMode] = useState<"kanban" | "table">("kanban");
  const [activeLead, setActiveLead] = useState<Lead | null>(null);
  const [newNote, setNewNote] = useState("");
  const [draftBody, setDraftBody] = useState("");
  const [queuingDraft, setQueuingDraft] = useState(false);
  const [queuedDraftUrl, setQueuedDraftUrl] = useState<string | null>(null);
  const [callOutcome, setCallOutcome] = useState<CallOutcomeKey>("Connected");
  const [callNote, setCallNote] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    setSearchQuery(queryParam);
  }, [queryParam]);

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

  const activeRecommendation = useMemo(
    () => (activeLead ? recommendNextAction(activeLead) : null),
    [activeLead]
  );

  const lastDraftKeyRef = useRef<string | null>(null);
  useEffect(() => {
    if (!activeLead || !activeRecommendation) {
      lastDraftKeyRef.current = null;
      return;
    }
    const key = `${activeLead.id}:${activeLead.status}`;
    if (lastDraftKeyRef.current !== key) {
      lastDraftKeyRef.current = key;
      setDraftBody(activeRecommendation.draft_message);
      setQueuedDraftUrl(null);
    }
  }, [activeLead, activeRecommendation]);

  const filteredLeads = useMemo(() => {
    return leads.filter((lead) => {
      const q = searchQuery.trim().toLowerCase();
      const matchesSearch =
        !q ||
        lead.contact_name.toLowerCase().includes(q) ||
        lead.company.toLowerCase().includes(q) ||
        lead.email.toLowerCase().includes(q) ||
        lead.service.toLowerCase().includes(q);
      const matchesService =
        selectedService === "all" || lead.service.toLowerCase().includes(selectedService.toLowerCase());
      const matchesSmart =
        smartFilter === "all" ||
        (smartFilter === "whatsapp" && Boolean(lead.whatsapp || lead.phone)) ||
        (smartFilter === "instagram" && Boolean(lead.instagram)) ||
        (smartFilter === "high_score" && computeLeadScore(lead) >= 70);

      return matchesSearch && matchesService && matchesSmart;
    });
  }, [leads, searchQuery, selectedService, smartFilter]);

  const smartCounts = useMemo(
    () => ({
      all: leads.length,
      whatsapp: leads.filter((l) => Boolean(l.whatsapp || l.phone)).length,
      instagram: leads.filter((l) => Boolean(l.instagram)).length,
      high_score: leads.filter((l) => computeLeadScore(l) >= 70).length,
    }),
    [leads]
  );

  const moveStage = async (id: string, newStage: LeadStatus) => {
    const current = leads.find((l) => l.id === id);
    if (saving || !current) return;
    if (newStage === "won") {
      toast.error("Win this deal through client proposal acceptance.");
      return;
    }
    setSaving(true);
    try {
      const response = await fetch(`/api/crm/leads/${id}/stage`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ stage: newStage, row_version: current.row_version }),
      });
      const data = (await response.json()) as Partial<StagePatchResponse> & { error?: string };
      if (!response.ok || !data.lead) throw new Error(data.error || "Could not save stage.");

      const updated: Lead = {
        ...current,
        status: data.lead.status,
        probability: data.lead.probability,
        row_version: data.lead.row_version,
        last_activity: data.lead.last_activity ?? current.last_activity,
      };
      setLeads((prev) => prev.map((l) => (l.id === id ? updated : l)));
      if (activeLead?.id === id) setActiveLead(updated);

      if (data.next_action) {
        toast.success(`Stage updated to ${newStage.replaceAll("_", " ")}`, {
          description: `Next best action: ${data.next_action.label}`,
        });
      } else {
        toast.success("Stage saved");
      }
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Could not save stage.");
    } finally {
      setSaving(false);
    }
  };

  const handleQueueFollowUpDraft = async () => {
    if (!activeLead || !activeRecommendation || queuingDraft) return;
    setQueuingDraft(true);
    try {
      const response = await fetch("/api/crm/automations/playbooks", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          lead_id: activeLead.id,
          template_key: activeRecommendation.template_key,
          channel: activeRecommendation.channel_key,
          subject: activeRecommendation.subject,
          body: draftBody.trim() || activeRecommendation.draft_message,
        }),
      });
      const data = (await response.json()) as Partial<PlaybooksPostResponse> & { error?: string };
      if (!response.ok || !data.job) {
        throw new Error(data.error || "Could not queue follow-up draft.");
      }

      setQueuedDraftUrl("/crm/automations?tab=outbox");
      toast.success("Follow-up draft added to Approval Queue", {
        description: data.consent_warning ?? `${activeRecommendation.channel} draft ready for review.`,
      });
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Could not queue follow-up draft.");
    } finally {
      setQueuingDraft(false);
    }
  };

  const saveLeadNoteText = async (lead: Lead, noteText: string) => {
    const response = await fetch(`/api/crm/leads/${lead.id}/notes`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ note: noteText }),
    });
    const data = await response.json().catch(() => ({}));
    if (!response.ok) throw new Error(data.error || "Could not save note.");
    const updated = { ...lead, notes: [...(lead.notes ?? []), noteText] };
    setLeads((prev) => prev.map((l) => (l.id === updated.id ? updated : l)));
    setActiveLead(updated);
  };

  const handleAddNote = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeLead || !newNote.trim() || saving) return;
    setSaving(true);
    try {
      await saveLeadNoteText(activeLead, newNote.trim());
      setNewNote("");
      toast.success("Note saved");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Could not save note.");
    } finally {
      setSaving(false);
    }
  };

  const handleLogCallOutcome = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeLead || saving) return;
    setSaving(true);
    const formatted = `[Call: ${callOutcome}] ${callNote.trim() || "Logged call outcome from lead drawer."}`;
    try {
      await saveLeadNoteText(activeLead, formatted);
      setCallNote("");
      toast.success(`Logged call outcome: ${callOutcome}`);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Could not log call outcome.");
    } finally {
      setSaving(false);
    }
  };

  const activeWaUrl = activeLead
    ? buildWhatsAppUrl(activeLead.whatsapp || activeLead.phone, draftBody)
    : null;
  const activeMailtoUrl =
    activeLead && activeRecommendation
      ? buildMailtoUrl(activeLead.email, activeRecommendation.subject, draftBody)
      : null;
  const activeIgUrl = safeInstagramHref(activeLead?.instagram);

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
            Stage-weighted forecasting, lead scoring, and 1-click after-lead follow-up drafts.
          </p>
        </div>

        <div className="flex items-center gap-2">
          {/* View Mode Toggle */}
          <div className="flex items-center p-1 rounded-xl bg-gray-100 dark:bg-zinc-900 border border-gray-200 dark:border-zinc-800">
            <button
              type="button"
              onClick={() => setViewMode("kanban")}
              className={`p-1.5 rounded-lg text-xs transition-colors cursor-pointer ${
                viewMode === "kanban"
                  ? "bg-white dark:bg-zinc-800 text-gray-900 dark:text-white shadow-xs"
                  : "text-gray-500 dark:text-zinc-400 hover:text-gray-900 dark:hover:text-white"
              }`}
              title="Kanban Board"
            >
              <Squares2X2Icon className="w-4 h-4" />
            </button>
            <button
              type="button"
              onClick={() => setViewMode("table")}
              className={`p-1.5 rounded-lg text-xs transition-colors cursor-pointer ${
                viewMode === "table"
                  ? "bg-white dark:bg-zinc-800 text-gray-900 dark:text-white shadow-xs"
                  : "text-gray-500 dark:text-zinc-400 hover:text-gray-900 dark:hover:text-white"
              }`}
              title="Table View"
            >
              <TableCellsIcon className="w-4 h-4" />
            </button>
          </div>

          <Link
            href="/crm/automations?tab=outbox"
            className="hidden sm:inline-flex items-center gap-1.5 px-3 py-2 rounded-xl font-semibold text-xs bg-white dark:bg-zinc-900 border border-gray-200 dark:border-zinc-800 text-gray-700 dark:text-zinc-200 hover:border-primary/50 transition-all"
          >
            <BoltIcon className="w-3.5 h-3.5 text-primary" />
            <span>Outbox</span>
          </Link>

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
      <div className="p-4 rounded-2xl bg-white dark:bg-zinc-900/80 border border-gray-200 dark:border-zinc-800 shadow-sm flex flex-col gap-3">
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
          <div className="relative w-full sm:w-80">
            <MagnifyingGlassIcon className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Filter by contact, company, service, or email..."
              className="w-full h-9 pl-9 pr-4 rounded-xl bg-gray-50 dark:bg-zinc-800/80 border border-gray-200 dark:border-zinc-700 text-xs text-gray-900 dark:text-white focus:outline-none focus:border-primary/50"
            />
          </div>

          <div className="flex items-center gap-3 w-full sm:w-auto justify-between sm:justify-end">
            <div className="flex items-center gap-2">
              <div className="flex items-center gap-1.5 text-xs text-gray-500 dark:text-zinc-400">
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
            </div>

            <span className="text-xs font-semibold text-gray-500 dark:text-zinc-400 tabular-nums">
              {filteredLeads.length} leads
            </span>
          </div>
        </div>

        {/* Smart Filter Pills */}
        <div className="flex items-center gap-2 overflow-x-auto pt-1 scrollbar-hide">
          {(
            [
              { key: "all", label: "All", count: smartCounts.all },
              { key: "whatsapp", label: "WhatsApp Ready", count: smartCounts.whatsapp },
              { key: "instagram", label: "Instagram", count: smartCounts.instagram },
              { key: "high_score", label: "High Score 70+", count: smartCounts.high_score },
            ] as { key: SmartFilterKey; label: string; count: number }[]
          ).map((pill) => (
            <button
              key={pill.key}
              type="button"
              onClick={() => setSmartFilter(pill.key)}
              className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[11px] font-semibold whitespace-nowrap transition-all cursor-pointer ${
                smartFilter === pill.key
                  ? "bg-primary text-white shadow-xs"
                  : "bg-gray-100 dark:bg-zinc-800/80 text-gray-600 dark:text-zinc-300 hover:bg-gray-200 dark:hover:bg-zinc-800"
              }`}
            >
              <span>{pill.label}</span>
              <span
                className={`px-1.5 py-0.2 rounded-full text-[10px] font-bold ${
                  smartFilter === pill.key
                    ? "bg-white/20 text-white"
                    : "bg-gray-200 dark:bg-zinc-700 text-gray-600 dark:text-zinc-300"
                }`}
              >
                {pill.count}
              </span>
            </button>
          ))}
        </div>
      </div>

      {/* View Mode 1: 6-Column Responsive Kanban Board */}
      {viewMode === "kanban" && (
        <div className="overflow-x-auto pb-6">
          <div className="grid grid-cols-1 md:grid-flow-col md:auto-cols-[260px] lg:grid-flow-row lg:grid-cols-6 lg:auto-cols-auto lg:min-w-[1080px] gap-3.5">
            {stageDefinitions.map((stage) => {
              const stageLeads = filteredLeads.filter((l) => l.status === stage.key);
              const stageBudgetTotal = stageLeads.reduce((acc, l) => acc + l.budget, 0);

              return (
                <div
                  key={stage.key}
                  className={`flex flex-col rounded-2xl bg-white/75 dark:bg-zinc-900/60 border ${stage.border} p-3 min-w-0 shadow-xs`}
                >
                  {/* Column Header */}
                  <div className="flex items-start justify-between pb-3 mb-3 border-b border-gray-100 dark:border-zinc-800">
                    <div className="min-w-0">
                      <div className="flex items-center gap-1.5">
                        <span className={`w-2 h-2 rounded-full shrink-0 ${stage.color}`} />
                        <h3 className="text-[11px] font-bold uppercase tracking-wider text-gray-900 dark:text-white truncate">
                          {stage.label}
                        </h3>
                      </div>
                      <p className="text-[11px] font-semibold text-primary mt-0.5">
                        ${stageBudgetTotal.toLocaleString()}{" "}
                        <span className="text-[10px] text-gray-400 font-normal">
                          ({stage.prob}%)
                        </span>
                      </p>
                    </div>
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-gray-100 dark:bg-zinc-800 text-gray-600 dark:text-zinc-400 shrink-0">
                      {stageLeads.length}
                    </span>
                  </div>

                  {/* Cards Stack */}
                  <div className="flex flex-col gap-3">
                    {stageLeads.map((lead) => {
                      const score = computeLeadScore(lead);
                      const sourceLabel = getLeadSourceLabel(lead);
                      return (
                        <div
                          key={lead.id}
                          onClick={() => setActiveLead(lead)}
                          className="p-3 rounded-xl bg-white dark:bg-zinc-800/90 border border-gray-200 dark:border-zinc-700/80 hover:border-primary/60 dark:hover:border-primary/60 shadow-xs cursor-pointer transition-all group"
                        >
                          <div className="flex items-start justify-between gap-2">
                            <span className="font-bold text-xs text-gray-900 dark:text-white group-hover:text-primary transition-colors line-clamp-1">
                              {lead.company}
                            </span>
                            <span className="text-xs font-black text-gray-900 dark:text-white shrink-0">
                              ${lead.budget.toLocaleString()}
                            </span>
                          </div>

                          {/* Score & Source Badges */}
                          <div className="flex flex-wrap items-center gap-1.5 mt-1.5">
                            <span
                              className={`px-1.5 py-0.5 rounded text-[9px] font-bold border ${
                                score >= 70
                                  ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/25"
                                  : score >= 45
                                  ? "bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/25"
                                  : "bg-gray-100 dark:bg-zinc-700/60 text-gray-600 dark:text-zinc-300 border-gray-200 dark:border-zinc-700"
                              }`}
                            >
                              Score {score}
                            </span>
                            <span className="px-1.5 py-0.5 rounded text-[9px] font-semibold bg-gray-100 dark:bg-zinc-900 text-gray-600 dark:text-zinc-300 border border-gray-200 dark:border-zinc-700">
                              {sourceLabel}
                            </span>
                          </div>

                          <p className="text-[11px] text-gray-500 dark:text-zinc-400 line-clamp-1 mt-1.5">
                            {lead.service}
                          </p>

                          <p className="text-[11px] text-gray-600 dark:text-zinc-300 line-clamp-2 mt-1.5 font-lato leading-relaxed">
                            {lead.brief}
                          </p>

                          <div className="flex items-center justify-between mt-3 pt-2 border-t border-gray-100 dark:border-zinc-700/50 text-[10px]">
                            <span className="text-gray-500 dark:text-zinc-400 font-medium truncate">
                              {lead.contact_name}
                            </span>
                            <div className="flex items-center gap-1 shrink-0">
                              {(lead.whatsapp || lead.phone) && (
                                <span
                                  className="px-1.5 py-0.5 rounded text-[9px] font-bold bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20"
                                  title={lead.whatsapp || lead.phone}
                                >
                                  WA
                                </span>
                              )}
                              {lead.instagram && (
                                <span
                                  className="px-1.5 py-0.5 rounded text-[9px] font-bold bg-pink-500/10 text-pink-600 dark:text-pink-400 border border-pink-500/20"
                                  title={lead.instagram}
                                >
                                  IG
                                </span>
                              )}
                            </div>
                          </div>
                        </div>
                      );
                    })}

                    {stageLeads.length === 0 && (
                      <div className="py-10 px-2 text-center text-[11px] text-gray-400 dark:text-zinc-500 border border-dashed border-gray-200 dark:border-zinc-800 rounded-xl">
                        No leads in {stage.shortLabel}
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
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
                  <th className="py-3.5 px-4 font-semibold">Score / Source</th>
                  <th className="py-3.5 px-4 font-semibold">Service</th>
                  <th className="py-3.5 px-4 font-semibold">Budget</th>
                  <th className="py-3.5 px-4 font-semibold">Stage</th>
                  <th className="py-3.5 px-4 font-semibold">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 dark:divide-zinc-800 text-gray-700 dark:text-zinc-300">
                {filteredLeads.map((lead) => {
                  const score = computeLeadScore(lead);
                  return (
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
                            <span className="px-1 rounded text-[8px] font-bold bg-emerald-500/10 text-emerald-500 border border-emerald-500/20">
                              WA
                            </span>
                          )}
                          {lead.instagram && (
                            <span className="px-1 rounded text-[8px] font-bold bg-pink-500/10 text-pink-500 border border-pink-500/20">
                              IG
                            </span>
                          )}
                        </div>
                      </td>
                      <td className="py-3.5 px-4">
                        <div className="flex items-center gap-1.5">
                          <span className="font-bold text-gray-900 dark:text-white">{score}</span>
                          <span className="text-[10px] text-gray-400">· {getLeadSourceLabel(lead)}</span>
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
                      <td className="py-3.5 px-4">
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            setActiveLead(lead);
                          }}
                          className="text-primary hover:underline font-bold text-[11px] cursor-pointer"
                        >
                          Inspect
                        </button>
                      </td>
                    </tr>
                  );
                })}
                {filteredLeads.length === 0 && (
                  <tr>
                    <td colSpan={7} className="py-10 text-center text-xs text-gray-500 dark:text-zinc-400">
                      No leads match your current filter.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Slide-Over Detail Drawer Modal */}
      {activeLead && activeRecommendation && (
        <div className="fixed inset-0 z-50 flex justify-end">
          <div
            onClick={() => setActiveLead(null)}
            className="fixed inset-0 bg-black/60 backdrop-blur-xs transition-opacity"
          />
          <div className="relative z-10 w-full max-w-xl bg-white dark:bg-zinc-950 border-l border-gray-200 dark:border-zinc-800 shadow-2xl p-6 sm:p-8 flex flex-col justify-between overflow-y-auto">
            
            <div>
              {/* Drawer Top */}
              <div className="flex items-start justify-between pb-4 border-b border-gray-200 dark:border-zinc-800">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-primary">
                      Lead Inspection
                    </span>
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/25">
                      Score {computeLeadScore(activeLead)}
                    </span>
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-gray-100 dark:bg-zinc-900 text-gray-600 dark:text-zinc-300 border border-gray-200 dark:border-zinc-800">
                      {getLeadSourceLabel(activeLead)}
                    </span>
                  </div>
                  <h2 className="text-xl font-bold text-gray-900 dark:text-white mt-1">
                    {activeLead.company}
                  </h2>
                  <p className="text-xs text-gray-500 dark:text-zinc-400">
                    Contact: {activeLead.contact_name} ({activeLead.email})
                  </p>
                </div>
                <button
                  type="button"
                  aria-label="Close lead inspection drawer"
                  onClick={() => setActiveLead(null)}
                  className="p-1.5 rounded-lg text-gray-400 hover:text-gray-900 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-zinc-900 transition-colors cursor-pointer"
                >
                  <XMarkIcon className="w-5 h-5" />
                </button>
              </div>

              {/* Next Best Action & Automation Card */}
              <div className="my-5 p-4 rounded-2xl bg-primary/5 dark:bg-primary/10 border border-primary/25 space-y-3">
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <SparklesIcon className="w-4 h-4 text-primary shrink-0" />
                    <div>
                      <span className="text-[10px] font-bold uppercase tracking-wider text-primary block">
                        Next Best Action &amp; Automation
                      </span>
                      <h3 className="text-sm font-bold text-gray-900 dark:text-white">
                        {activeRecommendation.label}
                      </h3>
                    </div>
                  </div>
                  <div className="flex items-center gap-1.5 shrink-0">
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-bold uppercase bg-white dark:bg-zinc-900 text-gray-800 dark:text-zinc-200 border border-gray-200 dark:border-zinc-700">
                      {activeRecommendation.channel}
                    </span>
                    <span
                      className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase ${
                        activeRecommendation.priority === "high"
                          ? "bg-rose-500/15 text-rose-600 dark:text-rose-400"
                          : "bg-amber-500/15 text-amber-600 dark:text-amber-400"
                      }`}
                    >
                      {activeRecommendation.priority}
                    </span>
                  </div>
                </div>

                <p className="text-xs text-gray-600 dark:text-zinc-300 leading-relaxed">
                  {activeRecommendation.description}
                </p>

                <div>
                  <label className="block text-[10px] font-bold uppercase tracking-wider text-gray-500 dark:text-zinc-400 mb-1">
                    Ready-to-send follow-up draft
                  </label>
                  <textarea
                    rows={3}
                    value={draftBody}
                    onChange={(e) => setDraftBody(e.target.value)}
                    className="w-full p-2.5 rounded-xl bg-white dark:bg-zinc-900 border border-gray-200 dark:border-zinc-700 text-xs text-gray-900 dark:text-white focus:outline-none focus:border-primary resize-y"
                  />
                </div>

                <div className="flex flex-wrap items-center gap-2">
                  <button
                    type="button"
                    disabled={queuingDraft}
                    onClick={handleQueueFollowUpDraft}
                    className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl font-bold text-xs bg-primary hover:bg-primary/90 text-white shadow-xs transition-all cursor-pointer disabled:opacity-60"
                  >
                    <BoltIcon className="w-3.5 h-3.5" />
                    <span>{queuingDraft ? "Queuing..." : "Queue Follow-Up Draft"}</span>
                  </button>

                  {activeWaUrl && (
                    <a
                      href={activeWaUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl font-bold text-xs bg-emerald-500 hover:bg-emerald-600 text-white shadow-xs transition-colors"
                    >
                      <ChatBubbleLeftRightIcon className="w-3.5 h-3.5" />
                      <span>WhatsApp Chat</span>
                    </a>
                  )}

                  {activeMailtoUrl && (
                    <a
                      href={activeMailtoUrl}
                      className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl font-bold text-xs bg-white dark:bg-zinc-900 border border-gray-200 dark:border-zinc-700 hover:border-primary/50 text-gray-800 dark:text-zinc-200 transition-colors"
                    >
                      <EnvelopeIcon className="w-3.5 h-3.5 text-primary" />
                      <span>Email Draft</span>
                    </a>
                  )}
                </div>

                {queuedDraftUrl && (
                  <div className="pt-1">
                    <Link
                      href={queuedDraftUrl}
                      className="inline-flex items-center gap-1 text-[11px] font-bold text-primary hover:underline"
                    >
                      <span>Draft queued — open Approval &amp; Outbox Queue</span>
                      <ArrowRightIcon className="w-3 h-3" />
                    </Link>
                  </div>
                )}
              </div>

              {/* 1-Click Stage Progression Pills */}
              <div className="my-5">
                <div className="flex items-center justify-between mb-2">
                  <label className="block text-[11px] font-bold uppercase tracking-wider text-gray-500 dark:text-zinc-400">
                    Stage Progression
                  </label>
                  {activeLead.status === "won" && (
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/15 text-emerald-600 dark:text-emerald-400">
                      Won via Proposal Acceptance
                    </span>
                  )}
                </div>
                <div className="flex flex-wrap gap-2">
                  {actionableStagePills.map((s) => (
                    <button
                      key={s.key}
                      type="button"
                      disabled={saving}
                      onClick={() => moveStage(activeLead.id, s.key)}
                      className={`px-3 py-1.5 rounded-full text-xs font-semibold border transition-all cursor-pointer disabled:opacity-60 ${
                        activeLead.status === s.key
                          ? "bg-primary text-white border-primary shadow-xs"
                          : "bg-gray-50 dark:bg-zinc-900 border-gray-200 dark:border-zinc-800 text-gray-600 dark:text-zinc-400 hover:border-gray-400 dark:hover:border-zinc-600"
                      }`}
                    >
                      {s.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Financial & Scope Specs */}
              <div className="grid grid-cols-2 gap-4 p-4 rounded-2xl bg-gray-50 dark:bg-zinc-900/60 border border-gray-200 dark:border-zinc-800 text-xs mb-5">
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
              <div className="p-4 rounded-2xl bg-gray-50 dark:bg-zinc-900/60 border border-gray-200 dark:border-zinc-800 text-xs mb-5 space-y-3">
                <span className="text-[10px] font-bold uppercase tracking-wider text-gray-500 dark:text-zinc-400 block">
                  Outreach Channels
                </span>

                {/* WhatsApp Channel */}
                <div className="flex items-center justify-between p-3 rounded-xl bg-white dark:bg-zinc-900 border border-gray-200 dark:border-zinc-800">
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
                  {activeWaUrl ? (
                    <a
                      href={activeWaUrl}
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
                <div className="flex items-center justify-between p-3 rounded-xl bg-white dark:bg-zinc-900 border border-gray-200 dark:border-zinc-800">
                  <div className="flex items-center gap-2.5">
                    <div className="w-8 h-8 rounded-lg bg-pink-500/10 text-pink-500 flex items-center justify-center font-bold text-xs">
                      IG
                    </div>
                    <div>
                      <div className="font-bold text-gray-900 dark:text-white">
                        {activeLead.instagram ? (
                          activeLead.instagram.startsWith("@")
                            ? activeLead.instagram
                            : `@${activeLead.instagram.replace(/^https?:\/\/(www\.)?instagram\.com\//, "").replace(/\/$/, "")}`
                        ) : (
                          "No Instagram"
                        )}
                      </div>
                      <div className="text-[10px] text-gray-400">Brand &amp; social audit</div>
                    </div>
                  </div>
                  {activeIgUrl ? (
                    <a
                      href={activeIgUrl}
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

              {/* Quick Log Call Outcome Form */}
              <form
                onSubmit={handleLogCallOutcome}
                className="p-4 rounded-2xl bg-gray-50 dark:bg-zinc-900/60 border border-gray-200 dark:border-zinc-800 text-xs mb-5 space-y-3"
              >
                <div className="flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-wider text-gray-700 dark:text-zinc-300">
                  <PhoneIcon className="w-3.5 h-3.5 text-primary" />
                  <span>Log Call Outcome</span>
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-1.5">
                  {callOutcomes.map((outcome) => (
                    <button
                      key={outcome}
                      type="button"
                      onClick={() => setCallOutcome(outcome)}
                      className={`px-2 py-1.5 rounded-lg text-[11px] font-semibold border transition-colors cursor-pointer ${
                        callOutcome === outcome
                          ? "bg-primary/15 border-primary text-primary font-bold"
                          : "bg-white dark:bg-zinc-900 border-gray-200 dark:border-zinc-700 text-gray-600 dark:text-zinc-300"
                      }`}
                    >
                      {outcome}
                    </button>
                  ))}
                </div>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={callNote}
                    onChange={(e) => setCallNote(e.target.value)}
                    placeholder="Optional call takeaway or next callback time..."
                    className="flex-1 h-9 px-3 rounded-xl bg-white dark:bg-zinc-900 border border-gray-200 dark:border-zinc-700 text-xs text-gray-900 dark:text-white focus:outline-none focus:border-primary"
                  />
                  <button
                    type="submit"
                    disabled={saving}
                    className="px-3.5 py-1.5 rounded-xl font-bold text-xs bg-zinc-900 dark:bg-white text-white dark:text-zinc-900 hover:opacity-90 transition-opacity cursor-pointer disabled:opacity-60"
                  >
                    Log Call
                  </button>
                </div>
              </form>

              {/* Project Brief */}
              <div className="mb-5">
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
                    placeholder="Add internal note or reminder..."
                    className="flex-1 h-9 px-3 rounded-xl bg-gray-50 dark:bg-zinc-900 border border-gray-200 dark:border-zinc-700 text-xs text-gray-900 dark:text-white focus:outline-none focus:border-primary"
                  />
                  <button
                    type="submit"
                    disabled={saving}
                    className="px-3.5 py-1.5 rounded-xl font-bold text-xs uppercase bg-primary hover:bg-primary/90 text-white shadow-xs cursor-pointer disabled:opacity-60"
                  >
                    Add
                  </button>
                </form>
              </div>

            </div>

            {/* Bottom Actions */}
            <div className="pt-5 border-t border-gray-200 dark:border-zinc-800 flex items-center gap-3">
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
