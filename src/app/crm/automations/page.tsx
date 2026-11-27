"use client";

import React, { useState, useEffect, useCallback, Suspense } from "react";
import Image from "next/image";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { toast } from "sonner";
import type {
  OutboxEventView,
  OutboxGetResponse,
  OutboxJobStatus,
  OutboxJobView,
  OutboxPostResponse,
  PlaybookRuleView,
  PlaybooksGetResponse,
  PlaybooksPatchResponse,
} from "@/lib/automation-playbooks";
import {
  BoltIcon,
  CheckCircleIcon,
  ArrowRightIcon,
  SparklesIcon,
  SignalIcon,
  XMarkIcon,
  KeyIcon,
  InboxStackIcon,
  ArrowPathIcon,
  ChatBubbleLeftRightIcon,
  EnvelopeIcon,
  ShieldCheckIcon,
  WrenchScrewdriverIcon,
  ClockIcon,
} from "@heroicons/react/24/solid";

type CommandTab = "playbooks" | "outbox" | "connectors";
type OutboxFilter = "all" | "pending_approval" | "queued" | "delivered" | "other";

interface ConnectorApp {
  id: string;
  name: string;
  role: string;
  description: string;
  logo: string;
  status: "connected" | "disconnected" | "saved" | "error";
  lastSync: string;
  tier: "free_core" | "optional_webhook";
  configurableViaApi: boolean;
  setupSteps?: string[];
}

const freeCoreConnectors: ConnectorApp[] = [
  {
    id: "n8n",
    name: "n8n Cloud",
    role: "Workflow Orchestrator ($0/mo)",
    description:
      "Routes inbound inquiries, post-lead stage transitions, and daily stale-lead digests using $vars (no $env needed).",
    logo: "/brand-logos/n8n.svg",
    status: "disconnected",
    lastSync: "Not tested",
    tier: "free_core",
    configurableViaApi: true,
  },
  {
    id: "google-sheets",
    name: "Google Sheets",
    role: "kinggucci195@gmail.com · Master Sync",
    description:
      "2-way sync with AgencyDesk_Leads_Master spreadsheet via n8n Cloud Google OAuth2 whenever leads arrive or change stage.",
    logo: "/brand-logos/google.webp",
    status: "connected",
    lastSync: "OAuth2 via n8n Cloud",
    tier: "free_core",
    configurableViaApi: false,
    setupSteps: [
      "Open n8n Cloud (justinautomaton.app.n8n.cloud) -> Credentials -> Google Sheets OAuth2 API.",
      "Sign in with kinggucci195@gmail.com and authorize spreadsheet access.",
      "Target spreadsheet: AgencyDesk_Leads_Master (tab: Leads_Master).",
    ],
  },
  {
    id: "gmail",
    name: "Gmail & Mailto",
    role: "kinggucci195@gmail.com · Free Email",
    description:
      "Sends morning stale-lead summaries and powers 1-click pre-filled email drafts directly from the Approval Queue.",
    logo: "/brand-logos/google-light.webp",
    status: "connected",
    lastSync: "OAuth2 + 1-click mailto",
    tier: "free_core",
    configurableViaApi: false,
    setupSteps: [
      "Connect Gmail OAuth2 in n8n Cloud using kinggucci195@gmail.com for automated morning digests.",
      "All client-facing follow-ups remain approval-gated and open directly in Gmail via 1-click mailto links.",
    ],
  },
  {
    id: "waha",
    name: "WhatsApp / WAHA",
    role: "+639913780170 · Owner Alerts & wa.me",
    description:
      "Dispatches instant owner intake alerts via /api/crm/automations/whatsapp-dispatch and launches 1-click wa.me client chats.",
    logo: "/brand-logos/inhouse-app.svg",
    status: "connected",
    lastSync: "Ready (+639913780170)",
    tier: "free_core",
    configurableViaApi: false,
    setupSteps: [
      "Set n8n Cloud Variable $vars.OWNER_WHATSAPP_NUMBER=+639913780170 for instant owner alerts.",
      "Client follow-ups open in WhatsApp via safe wa.me links after staff approval (zero paid API fees).",
    ],
  },
  {
    id: "calcom",
    name: "Cal.com (Free Tier)",
    role: "kinggucci195@gmail.com · Discovery Scheduler",
    description:
      "Syncs booked 20-min discovery calls to Google Calendar and dispatches verified webhooks to /api/webhooks/calcom to advance leads and schedule follow-up tasks.",
    logo: "/brand-logos/google.webp",
    status: "connected",
    lastSync: "Webhook /api/webhooks/calcom",
    tier: "free_core",
    configurableViaApi: false,
    setupSteps: [
      "Connect Google Calendar (kinggucci195@gmail.com) in Cal.com free tier.",
      "Add a Cal.com webhook pointing to https://agencydesk-theta.vercel.app/api/webhooks/calcom with CALCOM_WEBHOOK_SECRET.",
      "Optional: set NEXT_PUBLIC_CALCOM_BOOKING_URL to embed the live scheduler on /book.",
    ],
  },
  {
    id: "twilio",
    name: "Twilio",
    role: "Optional Programmable SMS",
    description:
      "Optional SMS/WhatsApp API credentials stored encrypted in Supabase for automated SMS delivery when enabled.",
    logo: "/brand-logos/twilio.svg",
    status: "disconnected",
    lastSync: "Not tested",
    tier: "free_core",
    configurableViaApi: true,
  },
  {
    id: "apollo",
    name: "Apollo.io",
    role: "B2B Lead Intelligence",
    description:
      "Optional B2B prospecting and contact enrichment key stored encrypted on the server.",
    logo: "/brand-logos/apollo.svg",
    status: "disconnected",
    lastSync: "Not tested",
    tier: "free_core",
    configurableViaApi: true,
  },
];

const optionalWebhookApps: ConnectorApp[] = [
  {
    id: "slack",
    name: "Slack",
    role: "Team Webhook Alerts",
    description: "Forward n8n lifecycle events to an internal Slack incoming webhook.",
    logo: "/brand-logos/slack.svg",
    status: "disconnected",
    lastSync: "Optional webhook",
    tier: "optional_webhook",
    configurableViaApi: false,
    setupSteps: [
      "Create an Incoming Webhook URL in your Slack workspace.",
      "Add an HTTP Request node in n8n Cloud triggered by AgencyDesk lifecycle webhooks.",
    ],
  },
  {
    id: "hubspot",
    name: "HubSpot",
    role: "External CRM Bridge",
    description: "Mirror AgencyDesk deals into an external HubSpot portal via n8n webhook.",
    logo: "/brand-logos/hubspot.svg",
    status: "disconnected",
    lastSync: "Optional webhook",
    tier: "optional_webhook",
    configurableViaApi: false,
    setupSteps: [
      "Use the native HubSpot node inside n8n Cloud connected to AgencyDesk's stage-change webhook.",
    ],
  },
  {
    id: "qbo",
    name: "QuickBooks Online",
    role: "Accounting Webhook",
    description: "Sync accepted proposal totals into accounting drafts upon Won / Kickoff.",
    logo: "/brand-logos/quickbooks.svg",
    status: "disconnected",
    lastSync: "Optional webhook",
    tier: "optional_webhook",
    configurableViaApi: false,
    setupSteps: [
      "Trigger on proposal_accepted in infra/n8n/workflows/agencydesk-post-lead-lifecycle.json.",
    ],
  },
  {
    id: "zapier-make",
    name: "Make / Zapier",
    role: "External Webhook Relay",
    description: "Subscribe external no-code scenarios to AgencyDesk lifecycle webhook payloads.",
    logo: "/brand-logos/make.svg",
    status: "disconnected",
    lastSync: "Optional webhook",
    tier: "optional_webhook",
    configurableViaApi: false,
    setupSteps: [
      "Point N8N_LIFECYCLE_WEBHOOK_URL or an n8n fan-out node to your Make/Zapier catch hook.",
    ],
  },
  {
    id: "claude",
    name: "Claude MCP",
    role: "AI Drafting & Analysis",
    description: "Assist with technical scoping and proposal drafting inside your dev workflow.",
    logo: "/brand-logos/claude.svg",
    status: "disconnected",
    lastSync: "Optional webhook",
    tier: "optional_webhook",
    configurableViaApi: false,
    setupSteps: [
      "Connect via local workspace tooling; no client PII is sent automatically without staff action.",
    ],
  },
];

function formatDelayLabel(minutes: number): string {
  if (minutes === 0) return "Instant";
  if (minutes < 60) return `${minutes}m delay`;
  const hours = Math.round(minutes / 60);
  if (hours < 24) return `${hours}h delay`;
  const days = Math.round(hours / 24);
  return `${days * 24}h (${days}d) delay`;
}

function formatTimestamp(iso: string): string {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso;
  return d.toLocaleString(undefined, {
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function statusPillClasses(status: OutboxJobStatus): string {
  switch (status) {
    case "pending_approval":
      return "bg-amber-500/15 text-amber-600 dark:text-amber-400 border-amber-500/30";
    case "queued":
    case "processing":
      return "bg-blue-500/15 text-blue-600 dark:text-blue-400 border-blue-500/30";
    case "delivered":
    case "read":
    case "accepted":
    case "simulated":
      return "bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border-emerald-500/30";
    case "failed":
    case "uncertain":
      return "bg-rose-500/15 text-rose-600 dark:text-rose-400 border-rose-500/30";
    default:
      return "bg-gray-200 dark:bg-zinc-800 text-gray-600 dark:text-zinc-400 border-gray-300 dark:border-zinc-700";
  }
}

function AutomationsCommandCenterContent() {
  const searchParams = useSearchParams();
  const initialTabParam = searchParams.get("tab");
  const initialTab: CommandTab =
    initialTabParam === "outbox" || initialTabParam === "connectors" || initialTabParam === "playbooks"
      ? initialTabParam
      : "playbooks";

  const [activeTab, setActiveTab] = useState<CommandTab>(initialTab);
  const [mode, setMode] = useState<"live" | "demo">("demo");
  const [playbooks, setPlaybooks] = useState<PlaybookRuleView[]>([]);
  const [jobs, setJobs] = useState<OutboxJobView[]>([]);
  const [events, setEvents] = useState<OutboxEventView[]>([]);
  const [outboxFilter, setOutboxFilter] = useState<OutboxFilter>("all");
  const [loadingPlaybooks, setLoadingPlaybooks] = useState(true);
  const [loadingOutbox, setLoadingOutbox] = useState(true);
  const [updatingRuleKey, setUpdatingRuleKey] = useState<string | null>(null);
  const [actingJobId, setActingJobId] = useState<string | null>(null);

  // Connectors state
  const [coreApps, setCoreApps] = useState<ConnectorApp[]>(freeCoreConnectors);
  const [activeModalApp, setActiveModalApp] = useState<ConnectorApp | null>(null);
  const [guideApp, setGuideApp] = useState<ConnectorApp | null>(null);
  const [apiKeyInput, setApiKeyInput] = useState("");
  const [accountId, setAccountId] = useState("");
  const [webhookSecret, setWebhookSecret] = useState("");
  const [savingConnector, setSavingConnector] = useState(false);

  useEffect(() => {
    if (
      initialTabParam === "outbox" ||
      initialTabParam === "connectors" ||
      initialTabParam === "playbooks"
    ) {
      setActiveTab(initialTabParam);
    }
  }, [initialTabParam]);

  const loadPlaybooks = useCallback(async () => {
    setLoadingPlaybooks(true);
    try {
      const res = await fetch("/api/crm/automations/playbooks");
      if (!res.ok) throw new Error("Failed to load playbooks");
      const data = (await res.json()) as PlaybooksGetResponse;
      setMode(data.mode);
      setPlaybooks(data.playbooks);
    } catch {
      toast.error("Could not load lifecycle playbooks.");
    } finally {
      setLoadingPlaybooks(false);
    }
  }, []);

  const loadOutbox = useCallback(async () => {
    setLoadingOutbox(true);
    try {
      const res = await fetch("/api/crm/automations/outbox");
      if (!res.ok) throw new Error("Failed to load outbox");
      const data = (await res.json()) as OutboxGetResponse;
      setMode(data.mode);
      setJobs(data.jobs);
      setEvents(data.events);
    } catch {
      toast.error("Could not load approval & outbox queue.");
    } finally {
      setLoadingOutbox(false);
    }
  }, []);

  useEffect(() => {
    void loadPlaybooks();
    void loadOutbox();
    fetch("/api/crm/automations")
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (data?.automations) {
          setCoreApps((prev) =>
            prev.map((app) => {
              const remote = data.automations[app.id];
              if (remote) {
                return {
                  ...app,
                  status: remote.status,
                  lastSync: remote.lastSync || app.lastSync,
                };
              }
              return app;
            })
          );
        }
      })
      .catch(() => {});
  }, [loadPlaybooks, loadOutbox]);

  const handleTogglePlaybook = async (
    rule: PlaybookRuleView,
    patch: { enabled?: boolean; approval_required?: boolean }
  ) => {
    if (updatingRuleKey) return;
    setUpdatingRuleKey(rule.template_key);
    try {
      const res = await fetch("/api/crm/automations/playbooks", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          rule_id: rule.id,
          template_key: rule.template_key,
          ...patch,
        }),
      });
      const data = (await res.json()) as Partial<PlaybooksPatchResponse> & { error?: string };
      if (!res.ok || !data.rule) {
        throw new Error(data.error || "Could not update playbook.");
      }

      setPlaybooks((prev) =>
        prev.map((p) =>
          p.template_key === rule.template_key ? { ...data.rule!, stats: p.stats } : p
        )
      );
      toast.success(
        patch.enabled !== undefined
          ? `${rule.short_label} playbook ${data.rule.enabled ? "enabled" : "paused"}`
          : `Approval gate ${data.rule.approval_required ? "enabled" : "disabled"}`
      );
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Could not update playbook.");
    } finally {
      setUpdatingRuleKey(null);
    }
  };

  const handleOutboxAction = async (
    job: OutboxJobView,
    action: "approve" | "cancel" | "mark_sent_manual"
  ) => {
    if (actingJobId) return;
    setActingJobId(job.id);
    try {
      const res = await fetch("/api/crm/automations/outbox", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ job_id: job.id, action }),
      });
      const data = (await res.json()) as Partial<OutboxPostResponse> & { error?: string };
      if (!res.ok || !data.success) {
        throw new Error(data.reason || data.error || "Action could not be completed.");
      }

      setJobs((prev) =>
        prev.map((j) =>
          j.id === job.id
            ? {
                ...j,
                status: data.status ?? j.status,
                updated_at: new Date().toISOString(),
                ...(data.job ?? {}),
              }
            : j
        )
      );

      if (action === "approve") {
        toast.success(
          data.dispatched_to_n8n
            ? "Approved, queued, and dispatched to n8n"
            : "Approved and queued in outbox"
        );
      } else if (action === "mark_sent_manual") {
        toast.success("Marked as manually sent");
      } else {
        toast.success("Outbox draft cancelled");
      }

      if (mode === "live") {
        void loadOutbox();
        void loadPlaybooks();
      }
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Outbox action failed.");
    } finally {
      setActingJobId(null);
    }
  };

  const handleOpenConnector = (app: ConnectorApp) => {
    if (!app.configurableViaApi) {
      setGuideApp(app);
      return;
    }
    setActiveModalApp(app);
    setApiKeyInput("");
    setAccountId("");
    setWebhookSecret("");
  };

  const handleConnection = async (action: "save" | "test" | "disconnect") => {
    if (!activeModalApp || savingConnector) return;
    setSavingConnector(true);
    try {
      const response = await fetch("/api/crm/automations/connect", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: activeModalApp.id,
          action,
          ...(action === "save"
            ? {
                credentials: {
                  apiKey: apiKeyInput,
                  ...(accountId ? { accountId } : {}),
                  ...(webhookSecret ? { webhookSecret } : {}),
                },
              }
            : {}),
        }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "Could not update connector.");
      setCoreApps((prev) =>
        prev.map((app) =>
          app.id === activeModalApp.id
            ? {
                ...app,
                status: data.status,
                lastSync: action === "test" ? "Checked just now" : "Saved (not tested)",
              }
            : app
        )
      );
      setActiveModalApp((prev) => (prev ? { ...prev, status: data.status } : null));
      setApiKeyInput("");
      setWebhookSecret("");
      toast.success(
        data.message ??
          (action === "save"
            ? "Credentials encrypted and saved. Test the connection next."
            : "Connection disconnected.")
      );
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Could not save connection.");
    } finally {
      setSavingConnector(false);
    }
  };

  const pendingCount = jobs.filter((j) => j.status === "pending_approval").length;
  const queuedCount = jobs.filter((j) => j.status === "queued" || j.status === "processing").length;
  const deliveredCount = jobs.filter((j) =>
    ["delivered", "read", "accepted", "simulated"].includes(j.status)
  ).length;
  const enabledPlaybooksCount = playbooks.filter((p) => p.enabled).length;
  const connectedCoreCount = coreApps.filter((a) => a.status === "connected").length;

  const filteredJobs = jobs.filter((job) => {
    if (outboxFilter === "all") return true;
    if (outboxFilter === "pending_approval") return job.status === "pending_approval";
    if (outboxFilter === "queued") return job.status === "queued" || job.status === "processing";
    if (outboxFilter === "delivered")
      return ["delivered", "read", "accepted", "simulated"].includes(job.status);
    return ["cancelled", "failed", "uncertain", "skipped"].includes(job.status);
  });

  return (
    <div className="flex flex-col gap-6 max-w-7xl mx-auto pb-12">
      {/* Header & Live Metrics */}
      <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-6 pb-6 border-b border-gray-200 dark:border-zinc-800">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 border border-primary/25 text-primary text-xs font-bold uppercase tracking-wider mb-2">
            <SparklesIcon className="w-3.5 h-3.5" />
            <span>Free-First Automation Command Center</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-gray-900 dark:text-white">
            Post-Lead Lifecycle &amp; Approval Outbox
          </h1>
          <p className="text-xs sm:text-sm text-gray-500 dark:text-zinc-400 mt-1 max-w-2xl">
            See exactly what happens after capturing a lead: automated Google Sheet sync, owner WhatsApp alerts, and human-approved client follow-ups via WhatsApp (<span className="font-mono">wa.me</span>) and Gmail.
          </p>
        </div>

        {/* HUD Quick Stats */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 shrink-0">
          <div className="p-3 rounded-2xl bg-white dark:bg-zinc-900/80 border border-gray-200 dark:border-zinc-800 flex flex-col">
            <span className="text-[10px] uppercase font-bold text-gray-400">Active Playbooks</span>
            <span className="text-lg font-extrabold text-gray-900 dark:text-white tabular-nums">
              {enabledPlaybooksCount} / {playbooks.length || 5}
            </span>
          </div>
          <button
            type="button"
            onClick={() => setActiveTab("outbox")}
            className="p-3 rounded-2xl bg-white dark:bg-zinc-900/80 border border-gray-200 dark:border-zinc-800 hover:border-amber-500/50 text-left flex flex-col transition-colors cursor-pointer"
          >
            <span className="text-[10px] uppercase font-bold text-gray-400">Pending Approval</span>
            <span className="text-lg font-extrabold text-amber-500 tabular-nums">
              {pendingCount} drafts
            </span>
          </button>
          <div className="p-3 rounded-2xl bg-white dark:bg-zinc-900/80 border border-gray-200 dark:border-zinc-800 flex flex-col">
            <span className="text-[10px] uppercase font-bold text-gray-400">Queued / Sent</span>
            <span className="text-lg font-extrabold text-emerald-500 tabular-nums">
              {queuedCount} / {deliveredCount}
            </span>
          </div>
          <div className="p-3 rounded-2xl bg-white dark:bg-zinc-900/80 border border-gray-200 dark:border-zinc-800 flex flex-col">
            <span className="text-[10px] uppercase font-bold text-gray-400">Free Core Stack</span>
            <span className="text-sm font-extrabold text-primary flex items-center gap-1.5 mt-1">
              <SignalIcon className="w-4 h-4 text-emerald-500" />
              {connectedCoreCount} / {coreApps.length} live
            </span>
          </div>
        </div>
      </div>

      {/* Primary Section Tabs */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-hide">
        <button
          type="button"
          onClick={() => setActiveTab("playbooks")}
          className={`inline-flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold whitespace-nowrap transition-all cursor-pointer ${
            activeTab === "playbooks"
              ? "bg-primary text-white shadow-md shadow-primary/20"
              : "bg-white dark:bg-zinc-900 text-gray-600 dark:text-zinc-300 border border-gray-200 dark:border-zinc-800 hover:border-primary/40"
          }`}
        >
          <BoltIcon className="w-4 h-4" />
          <span>1. Post-Lead Playbooks</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab("outbox")}
          className={`inline-flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold whitespace-nowrap transition-all cursor-pointer ${
            activeTab === "outbox"
              ? "bg-primary text-white shadow-md shadow-primary/20"
              : "bg-white dark:bg-zinc-900 text-gray-600 dark:text-zinc-300 border border-gray-200 dark:border-zinc-800 hover:border-primary/40"
          }`}
        >
          <InboxStackIcon className="w-4 h-4" />
          <span>2. Approval &amp; Outbox Queue</span>
          {pendingCount > 0 && (
            <span
              className={`px-1.5 py-0.5 rounded-full text-[10px] font-extrabold ${
                activeTab === "outbox"
                  ? "bg-white/20 text-white"
                  : "bg-amber-500/15 text-amber-600 dark:text-amber-400"
              }`}
            >
              {pendingCount}
            </span>
          )}
        </button>

        <button
          type="button"
          onClick={() => setActiveTab("connectors")}
          className={`inline-flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold whitespace-nowrap transition-all cursor-pointer ${
            activeTab === "connectors"
              ? "bg-primary text-white shadow-md shadow-primary/20"
              : "bg-white dark:bg-zinc-900 text-gray-600 dark:text-zinc-300 border border-gray-200 dark:border-zinc-800 hover:border-primary/40"
          }`}
        >
          <WrenchScrewdriverIcon className="w-4 h-4" />
          <span>3. Active Free Stack Connectors</span>
        </button>
      </div>

      {/* TAB 1: POST-LEAD LIFECYCLE PLAYBOOKS */}
      {activeTab === "playbooks" && (
        <div className="flex flex-col gap-6">
          {/* Visual 5-Stage Lifecycle Pipeline */}
          <div className="p-5 sm:p-6 rounded-3xl bg-white dark:bg-zinc-900/80 border border-gray-200 dark:border-zinc-800 shadow-xs">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-5">
              <div>
                <h2 className="text-base font-bold text-gray-900 dark:text-white">
                  What Happens After Finding a Lead
                </h2>
                <p className="text-xs text-gray-500 dark:text-zinc-400 mt-0.5">
                  Each pipeline stage prepares a consent-checked draft before anything reaches the client.
                </p>
              </div>
              <Link
                href="/crm/leads"
                className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold bg-primary/10 text-primary border border-primary/20 hover:bg-primary hover:text-white transition-all shrink-0"
              >
                <span>Open Leads to Trigger Draft</span>
                <ArrowRightIcon className="w-3.5 h-3.5" />
              </Link>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
              {playbooks.map((rule, idx) => (
                <div
                  key={rule.template_key}
                  className={`relative p-3.5 rounded-2xl border transition-all ${
                    rule.enabled || !rule.db_backed
                      ? "bg-gray-50/80 dark:bg-zinc-950/70 border-primary/30"
                      : "bg-gray-50/40 dark:bg-zinc-950/30 border-gray-200 dark:border-zinc-800 opacity-75"
                  }`}
                >
                  <div className="flex items-center justify-between gap-2 mb-2">
                    <span className="text-[10px] font-extrabold uppercase tracking-wider text-primary">
                      Step {idx + 1} · {rule.short_label}
                    </span>
                    <span
                      className={`w-2 h-2 rounded-full ${
                        rule.enabled ? "bg-emerald-500" : !rule.db_backed ? "bg-blue-500" : "bg-gray-400"
                      }`}
                    />
                  </div>
                  <p className="text-xs font-bold text-gray-900 dark:text-white line-clamp-2">
                    {rule.name}
                  </p>
                  <div className="flex items-center gap-1.5 mt-2 text-[10px] text-gray-500 dark:text-zinc-400">
                    <span className="font-semibold uppercase">
                      {rule.channel === "whatsapp" ? "WhatsApp" : "Gmail / Email"}
                    </span>
                    <span>·</span>
                    <span>{formatDelayLabel(rule.delay_minutes)}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Playbook Rule Controls */}
          {loadingPlaybooks ? (
            <div className="p-8 rounded-3xl bg-white dark:bg-zinc-900/60 border border-gray-200 dark:border-zinc-800 text-center text-xs text-gray-500">
              Loading lifecycle playbooks...
            </div>
          ) : (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
              {playbooks.map((rule) => {
                const isUpdating = updatingRuleKey === rule.template_key;
                const toggleDisabled = isUpdating || (mode === "live" && !rule.db_backed);

                return (
                  <div
                    key={rule.template_key}
                    className="p-6 rounded-3xl bg-white dark:bg-zinc-950/80 border border-gray-200 dark:border-zinc-800 shadow-xs flex flex-col justify-between gap-5"
                  >
                    <div>
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <div className="flex flex-wrap items-center gap-2 mb-1.5">
                            <span className="px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-primary/10 text-primary border border-primary/20">
                              Stage: {rule.short_label}
                            </span>
                            <span
                              className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold uppercase border ${
                                rule.channel === "whatsapp"
                                  ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/25"
                                  : "bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/25"
                              }`}
                            >
                              {rule.channel === "whatsapp" ? (
                                <ChatBubbleLeftRightIcon className="w-3 h-3" />
                              ) : (
                                <EnvelopeIcon className="w-3 h-3" />
                              )}
                              <span>{rule.channel} ({rule.provider})</span>
                            </span>
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-gray-100 dark:bg-zinc-900 text-gray-600 dark:text-zinc-300 border border-gray-200 dark:border-zinc-800">
                              <ClockIcon className="w-3 h-3" />
                              <span>{formatDelayLabel(rule.delay_minutes)}</span>
                            </span>
                          </div>

                          <h3 className="text-base font-bold text-gray-900 dark:text-white">
                            {rule.name}
                          </h3>
                        </div>

                        {/* Enable / Pause Toggle */}
                        {mode === "live" && !rule.db_backed ? (
                          <span className="px-2.5 py-1 rounded-full text-[10px] font-bold bg-blue-500/10 text-blue-600 dark:text-blue-400 border border-blue-500/20 shrink-0">
                            On-Demand Ready
                          </span>
                        ) : (
                          <button
                            type="button"
                            disabled={toggleDisabled}
                            onClick={() => handleTogglePlaybook(rule, { enabled: !rule.enabled })}
                            className={`px-3.5 py-1.5 rounded-full text-[11px] font-bold uppercase tracking-wider border transition-all cursor-pointer shrink-0 disabled:opacity-60 ${
                              rule.enabled
                                ? "bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border-emerald-500/30 hover:bg-emerald-500/25"
                                : "bg-gray-100 dark:bg-zinc-900 text-gray-500 dark:text-zinc-400 border-gray-200 dark:border-zinc-700 hover:border-primary/40"
                            }`}
                          >
                            {isUpdating ? "Saving..." : rule.enabled ? "Enabled" : "Paused"}
                          </button>
                        )}
                      </div>

                      <p className="text-xs text-gray-600 dark:text-zinc-300 mt-2 leading-relaxed">
                        {rule.description}
                      </p>

                      {/* Free Stack Badges */}
                      <div className="flex flex-wrap items-center gap-1.5 mt-3">
                        {rule.free_stack_tools.map((tool) => (
                          <span
                            key={tool}
                            className="px-2 py-0.5 rounded-md text-[10px] font-medium bg-gray-100 dark:bg-zinc-900 text-gray-600 dark:text-zinc-400 border border-gray-200/80 dark:border-zinc-800"
                          >
                            {tool}
                          </span>
                        ))}
                      </div>
                    </div>

                    {/* Footer Controls: Approval Gate + Stats */}
                    <div className="pt-4 border-t border-gray-100 dark:border-zinc-800 flex flex-wrap items-center justify-between gap-3">
                      <div className="flex items-center gap-3 text-[11px] text-gray-500 dark:text-zinc-400">
                        <span>
                          <strong className="text-amber-500">{rule.stats.pending_approval}</strong> pending
                        </span>
                        <span>·</span>
                        <span>
                          <strong className="text-blue-500">{rule.stats.queued}</strong> queued
                        </span>
                        <span>·</span>
                        <span>
                          <strong className="text-emerald-500">{rule.stats.delivered}</strong> sent
                        </span>
                      </div>

                      {mode === "live" && !rule.db_backed ? (
                        <span className="text-[11px] text-gray-400 dark:text-zinc-500 italic">
                          Triggered from Lead Drawer
                        </span>
                      ) : (
                        <button
                          type="button"
                          disabled={toggleDisabled}
                          onClick={() =>
                            handleTogglePlaybook(rule, {
                              approval_required: !rule.approval_required,
                            })
                          }
                          className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-[11px] font-semibold border transition-colors cursor-pointer disabled:opacity-60 ${
                            rule.approval_required
                              ? "bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/25"
                              : "bg-gray-100 dark:bg-zinc-900 text-gray-600 dark:text-zinc-400 border-gray-200 dark:border-zinc-800"
                          }`}
                        >
                          <ShieldCheckIcon className="w-3.5 h-3.5" />
                          <span>
                            {rule.approval_required ? "Approval Required: ON" : "Approval Required: OFF"}
                          </span>
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* TAB 2: APPROVAL & OUTBOX QUEUE */}
      {activeTab === "outbox" && (
        <div className="flex flex-col gap-6">
          {/* Queue Toolbar */}
          <div className="p-4 rounded-2xl bg-white dark:bg-zinc-900/80 border border-gray-200 dark:border-zinc-800 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex items-center gap-2 overflow-x-auto scrollbar-hide">
              {(
                [
                  { key: "all", label: `All (${jobs.length})` },
                  { key: "pending_approval", label: `Pending Approval (${pendingCount})` },
                  { key: "queued", label: `Queued (${queuedCount})` },
                  { key: "delivered", label: `Sent / Delivered (${deliveredCount})` },
                  { key: "other", label: "Cancelled / Skipped" },
                ] as { key: OutboxFilter; label: string }[]
              ).map((f) => (
                <button
                  key={f.key}
                  type="button"
                  onClick={() => setOutboxFilter(f.key)}
                  className={`px-3 py-1.5 rounded-full text-[11px] font-semibold whitespace-nowrap transition-all cursor-pointer ${
                    outboxFilter === f.key
                      ? "bg-primary text-white shadow-xs"
                      : "bg-gray-100 dark:bg-zinc-800 text-gray-600 dark:text-zinc-300 hover:bg-gray-200 dark:hover:bg-zinc-700"
                  }`}
                >
                  {f.label}
                </button>
              ))}
            </div>

            <button
              type="button"
              onClick={() => void loadOutbox()}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold bg-gray-100 dark:bg-zinc-800 text-gray-700 dark:text-zinc-200 hover:bg-gray-200 dark:hover:bg-zinc-700 transition-colors self-start sm:self-auto cursor-pointer"
            >
              <ArrowPathIcon className={`w-3.5 h-3.5 ${loadingOutbox ? "animate-spin" : ""}`} />
              <span>Refresh</span>
            </button>
          </div>

          {/* Drafts / Outbox Jobs */}
          {loadingOutbox ? (
            <div className="p-8 rounded-3xl bg-white dark:bg-zinc-900/60 border border-gray-200 dark:border-zinc-800 text-center text-xs text-gray-500">
              Loading outbox queue...
            </div>
          ) : filteredJobs.length === 0 ? (
            <div className="p-10 rounded-3xl bg-white dark:bg-zinc-900/60 border border-dashed border-gray-200 dark:border-zinc-800 text-center">
              <p className="text-sm font-bold text-gray-900 dark:text-white">
                No drafts in this view
              </p>
              <p className="text-xs text-gray-500 dark:text-zinc-400 mt-1">
                Open any lead in the Pipeline Kanban and click &ldquo;Queue Follow-Up Draft&rdquo; to stage a message here.
              </p>
              <Link
                href="/crm/leads"
                className="inline-flex items-center gap-1.5 mt-4 px-4 py-2 rounded-xl bg-primary text-white text-xs font-bold"
              >
                <span>Go to Leads Pipeline</span>
                <ArrowRightIcon className="w-3.5 h-3.5" />
              </Link>
            </div>
          ) : (
            <div className="flex flex-col gap-4">
              {filteredJobs.map((job) => {
                const isActing = actingJobId === job.id;
                const canApprove = job.status === "pending_approval";
                const canMarkSent = ["pending_approval", "queued", "skipped", "failed"].includes(
                  job.status
                );
                const canCancel = job.status === "pending_approval" || job.status === "queued";

                return (
                  <div
                    key={job.id}
                    className="p-5 rounded-3xl bg-white dark:bg-zinc-950/80 border border-gray-200 dark:border-zinc-800 shadow-xs flex flex-col gap-4"
                  >
                    <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3">
                      <div>
                        <div className="flex flex-wrap items-center gap-2">
                          <Link
                            href={`/crm/leads?lead=${encodeURIComponent(job.lead_id)}`}
                            className="text-sm font-bold text-gray-900 dark:text-white hover:text-primary transition-colors"
                          >
                            {job.lead_company} · {job.lead_name}
                          </Link>
                          <span
                            className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase border ${statusPillClasses(
                              job.status
                            )}`}
                          >
                            {job.status.replaceAll("_", " ")}
                          </span>
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-gray-100 dark:bg-zinc-900 text-gray-600 dark:text-zinc-300 border border-gray-200 dark:border-zinc-800">
                            {job.channel === "whatsapp" ? "WhatsApp" : "Email"} · {job.provider}
                          </span>
                        </div>
                        <p className="text-[11px] text-gray-500 dark:text-zinc-400 mt-1">
                          Playbook: <strong className="text-gray-700 dark:text-zinc-200">{job.rule_name}</strong> · To:{" "}
                          <span className="font-mono">{job.recipient || job.lead_email}</span> · Created{" "}
                          {formatTimestamp(job.created_at)}
                        </p>
                      </div>

                      {!job.consent_ok && (
                        <span className="px-2.5 py-1 rounded-xl text-[10px] font-semibold bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/25 shrink-0">
                          Review opt-in / send 1-to-1 manually
                        </span>
                      )}
                    </div>

                    {/* Message Draft Preview */}
                    <div className="p-3.5 rounded-2xl bg-gray-50 dark:bg-zinc-900/70 border border-gray-200/80 dark:border-zinc-800">
                      <p className="text-xs font-bold text-gray-900 dark:text-white mb-1">
                        {job.subject}
                      </p>
                      <p className="text-xs text-gray-600 dark:text-zinc-300 leading-relaxed whitespace-pre-line">
                        {job.body}
                      </p>
                    </div>

                    {/* Action Bar */}
                    <div className="flex flex-wrap items-center justify-between gap-2 pt-1">
                      <div className="flex flex-wrap items-center gap-2">
                        {canApprove && (
                          <button
                            type="button"
                            disabled={isActing}
                            onClick={() => void handleOutboxAction(job, "approve")}
                            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold bg-primary hover:bg-primary/90 text-white shadow-xs transition-all cursor-pointer disabled:opacity-60"
                          >
                            <CheckCircleIcon className="w-3.5 h-3.5" />
                            <span>{isActing ? "Working..." : "Approve & Queue"}</span>
                          </button>
                        )}

                        {job.wa_me_url && (
                          <a
                            href={job.wa_me_url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold bg-emerald-500 hover:bg-emerald-600 text-white shadow-xs transition-colors"
                          >
                            <ChatBubbleLeftRightIcon className="w-3.5 h-3.5" />
                            <span>Open in WhatsApp</span>
                          </a>
                        )}

                        {job.mailto_url && (
                          <a
                            href={job.mailto_url}
                            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold bg-white dark:bg-zinc-900 border border-gray-200 dark:border-zinc-700 hover:border-primary/50 text-gray-800 dark:text-zinc-200 transition-colors"
                          >
                            <EnvelopeIcon className="w-3.5 h-3.5 text-primary" />
                            <span>Open in Gmail</span>
                          </a>
                        )}
                      </div>

                      <div className="flex items-center gap-2">
                        {canMarkSent && (
                          <button
                            type="button"
                            disabled={isActing}
                            onClick={() => void handleOutboxAction(job, "mark_sent_manual")}
                            className="px-3 py-1.5 rounded-xl text-xs font-semibold bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/25 hover:bg-emerald-500/20 transition-colors cursor-pointer disabled:opacity-60"
                          >
                            Mark Sent
                          </button>
                        )}
                        {canCancel && (
                          <button
                            type="button"
                            disabled={isActing}
                            onClick={() => void handleOutboxAction(job, "cancel")}
                            className="px-3 py-1.5 rounded-xl text-xs font-semibold bg-gray-100 dark:bg-zinc-900 text-gray-600 dark:text-zinc-400 border border-gray-200 dark:border-zinc-800 hover:text-rose-500 hover:border-rose-500/30 transition-colors cursor-pointer disabled:opacity-60"
                          >
                            Cancel
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {/* Outbox Event Stream Telemetry */}
          <div className="p-6 sm:p-8 rounded-3xl bg-white dark:bg-zinc-950/80 border border-gray-200 dark:border-zinc-800 shadow-sm">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-5">
              <div>
                <div className="flex items-center gap-2">
                  <BoltIcon className="w-5 h-5 text-primary" />
                  <h2 className="text-lg font-bold text-gray-900 dark:text-white">
                    Outbox Event Stream Telemetry
                  </h2>
                </div>
                <p className="text-xs text-gray-500 dark:text-zinc-400 mt-0.5">
                  Idempotent lifecycle events synced across AgencyDesk CRM, n8n Cloud, and Google Sheets.
                </p>
              </div>
              <span className="px-3 py-1 rounded-full text-xs font-mono font-bold bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/25">
                {events.length} RECENT EVENTS
              </span>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-gray-200 dark:border-zinc-800 text-gray-400 dark:text-zinc-500 uppercase tracking-wider text-[11px]">
                    <th className="py-3 px-4 font-semibold">Event Type</th>
                    <th className="py-3 px-4 font-semibold">Lead</th>
                    <th className="py-3 px-4 font-semibold">Summary</th>
                    <th className="py-3 px-4 font-semibold">State</th>
                    <th className="py-3 px-4 font-semibold">Timestamp</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100 dark:divide-zinc-800">
                  {events.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="p-6 text-center text-gray-500 dark:text-zinc-400">
                        No outbox events recorded yet. Stage transitions and queued drafts will appear here.
                      </td>
                    </tr>
                  ) : (
                    events.map((ev) => (
                      <tr key={ev.id} className="hover:bg-gray-50 dark:hover:bg-zinc-900/50">
                        <td className="py-3 px-4 font-mono font-semibold text-gray-900 dark:text-white">
                          {ev.event_type}
                        </td>
                        <td className="py-3 px-4 text-gray-700 dark:text-zinc-300">
                          {ev.lead_id ? (
                            <Link
                              href={`/crm/leads?lead=${encodeURIComponent(ev.lead_id)}`}
                              className="text-primary hover:underline font-semibold"
                            >
                              {ev.lead_name || "View Lead"}
                            </Link>
                          ) : (
                            "—"
                          )}
                        </td>
                        <td className="py-3 px-4 text-gray-600 dark:text-zinc-300">{ev.summary}</td>
                        <td className="py-3 px-4">
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-bold uppercase bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
                            {ev.state}
                          </span>
                        </td>
                        <td className="py-3 px-4 text-gray-500 dark:text-zinc-400 font-mono">
                          {formatTimestamp(ev.created_at)}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* TAB 3: ACTIVE FREE STACK CONNECTORS */}
      {activeTab === "connectors" && (
        <div className="flex flex-col gap-8">
          <div>
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-4">
              <div>
                <h2 className="text-lg font-bold text-gray-900 dark:text-white">
                  Active Free-First Production Stack
                </h2>
                <p className="text-xs text-gray-500 dark:text-zinc-400">
                  Zero-cost core stack powered by n8n Cloud, Google Sheets &amp; Gmail (kinggucci195@gmail.com), WhatsApp alerts (+639913780170), and encrypted API connectors.
                </p>
              </div>
              <span className="px-3 py-1 rounded-full text-[11px] font-bold bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/25 self-start">
                $0/mo Core Stack
              </span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
              {coreApps.map((app) => {
                const isConnected = app.status === "connected";
                const isSaved = app.status === "saved";

                return (
                  <div
                    key={app.id}
                    className={`group p-6 rounded-3xl border flex flex-col justify-between transition-all shadow-xs ${
                      isConnected
                        ? "bg-white dark:bg-zinc-950/80 border-gray-200 dark:border-zinc-800 hover:border-primary/50"
                        : "bg-gray-50/70 dark:bg-zinc-950/40 border-gray-200/80 dark:border-zinc-800/80 hover:border-gray-300 dark:hover:border-zinc-700"
                    }`}
                  >
                    <div>
                      <div className="flex items-center justify-between mb-4">
                        <div className="flex items-center gap-3 min-w-0">
                          <div className="w-11 h-11 rounded-2xl bg-gray-100 dark:bg-zinc-900 border border-gray-200 dark:border-zinc-700/80 p-2 flex items-center justify-center shrink-0">
                            <Image
                              src={app.logo}
                              alt={`${app.name} logo`}
                              width={32}
                              height={32}
                              className="w-7 h-7 object-contain rounded"
                            />
                          </div>
                          <div className="min-w-0">
                            <h3 className="font-bold text-sm text-gray-900 dark:text-white truncate">
                              {app.name}
                            </h3>
                            <span className="text-[10px] font-mono text-gray-500 dark:text-zinc-400 block truncate">
                              {app.role}
                            </span>
                          </div>
                        </div>

                        <span
                          className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-bold uppercase border shrink-0 ${
                            isConnected
                              ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/25"
                              : isSaved
                              ? "bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/25"
                              : "bg-gray-200 dark:bg-zinc-800 text-gray-500 dark:text-zinc-400 border-gray-300 dark:border-zinc-700"
                          }`}
                        >
                          <span
                            className={`w-1.5 h-1.5 rounded-full ${
                              isConnected
                                ? "bg-emerald-500"
                                : isSaved
                                ? "bg-amber-500"
                                : "bg-gray-400"
                            }`}
                          />
                          <span>{app.status}</span>
                        </span>
                      </div>

                      <p className="text-xs text-gray-600 dark:text-zinc-300 leading-relaxed">
                        {app.description}
                      </p>

                      <div className="mt-4 px-3 py-2 rounded-xl bg-gray-100/70 dark:bg-zinc-900/60 border border-gray-200/60 dark:border-zinc-800 text-[11px] font-mono text-gray-500 dark:text-zinc-400">
                        Sync: {app.lastSync}
                      </div>
                    </div>

                    <div className="mt-5 pt-4 border-t border-gray-100 dark:border-zinc-800/80 flex items-center justify-between">
                      <span className="text-[10px] font-bold uppercase tracking-wider text-gray-400">
                        {app.configurableViaApi ? "Encrypted Secret" : "OAuth / Built-in"}
                      </span>

                      <button
                        type="button"
                        onClick={() => handleOpenConnector(app)}
                        className={`inline-flex items-center gap-1.5 px-4 py-2 rounded-full font-bold text-xs uppercase tracking-wider transition-all cursor-pointer ${
                          app.configurableViaApi
                            ? isConnected
                              ? "bg-white dark:bg-zinc-900 border border-gray-300 dark:border-zinc-700 text-gray-800 dark:text-zinc-200 hover:border-primary/60"
                              : "bg-primary hover:bg-primary/90 text-white shadow-sm shadow-primary/20"
                            : "bg-gray-100 dark:bg-zinc-900 text-gray-700 dark:text-zinc-200 border border-gray-200 dark:border-zinc-700 hover:border-primary/50"
                        }`}
                      >
                        <span>
                          {app.configurableViaApi
                            ? isConnected
                              ? "Configure"
                              : "Connect"
                            : "Setup Guide"}
                        </span>
                        <ArrowRightIcon className="w-3 h-3" />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Additional Webhooks (Optional Secondary Apps) */}
          <div className="p-6 rounded-3xl bg-white dark:bg-zinc-900/60 border border-gray-200 dark:border-zinc-800">
            <div className="mb-4">
              <h3 className="text-sm font-bold text-gray-900 dark:text-white">
                Additional Webhooks &amp; Optional Bridges
              </h3>
              <p className="text-xs text-gray-500 dark:text-zinc-400 mt-0.5">
                Optional external integrations you can fan out to via n8n Cloud webhooks whenever needed.
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3.5">
              {optionalWebhookApps.map((app) => (
                <div
                  key={app.id}
                  className="p-4 rounded-2xl bg-gray-50 dark:bg-zinc-950/60 border border-gray-200/80 dark:border-zinc-800 flex items-center justify-between gap-3"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="w-9 h-9 rounded-xl bg-white dark:bg-zinc-900 border border-gray-200 dark:border-zinc-800 p-1.5 flex items-center justify-center shrink-0">
                      <Image
                        src={app.logo}
                        alt={`${app.name} logo`}
                        width={24}
                        height={24}
                        className="w-5 h-5 object-contain"
                      />
                    </div>
                    <div className="min-w-0">
                      <p className="text-xs font-bold text-gray-900 dark:text-white truncate">
                        {app.name}
                      </p>
                      <p className="text-[11px] text-gray-500 dark:text-zinc-400 truncate">
                        {app.role}
                      </p>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => handleOpenConnector(app)}
                    className="px-3 py-1.5 rounded-xl text-[11px] font-semibold bg-white dark:bg-zinc-900 border border-gray-200 dark:border-zinc-700 text-gray-700 dark:text-zinc-200 hover:border-primary/50 shrink-0 cursor-pointer"
                  >
                    Webhook Info
                  </button>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Interactive Connect / Configure Modal (n8n, twilio, apollo) */}
      {activeModalApp && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-md">
          <div className="w-full max-w-lg rounded-3xl bg-white dark:bg-zinc-950 border border-gray-200 dark:border-zinc-800 p-6 sm:p-8 shadow-2xl relative">
            <div className="flex items-center justify-between pb-4 border-b border-gray-200 dark:border-zinc-800">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-gray-100 dark:bg-zinc-900 p-2 flex items-center justify-center shrink-0 border border-gray-200 dark:border-zinc-800">
                  <Image
                    src={activeModalApp.logo}
                    alt={activeModalApp.name}
                    width={28}
                    height={28}
                    className="w-6 h-6 object-contain"
                  />
                </div>
                <div>
                  <h3 className="font-bold text-lg text-gray-900 dark:text-white">
                    {activeModalApp.status === "connected" ? "Configure" : "Connect"} {activeModalApp.name}
                  </h3>
                  <span className="text-xs text-gray-500 dark:text-zinc-400">
                    {activeModalApp.role}
                  </span>
                </div>
              </div>

              <button
                type="button"
                aria-label="Close modal"
                onClick={() => setActiveModalApp(null)}
                className="p-2 rounded-xl text-gray-400 hover:text-gray-900 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-zinc-800 transition-colors cursor-pointer"
              >
                <XMarkIcon className="w-5 h-5" />
              </button>
            </div>

            <div className="flex flex-col gap-4 py-6">
              <p className="text-xs text-gray-600 dark:text-zinc-300 leading-relaxed">
                {activeModalApp.description}
              </p>

              <div>
                <label className="block text-xs font-semibold text-gray-700 dark:text-zinc-300 mb-1.5 flex items-center gap-1.5">
                  <KeyIcon className="w-3.5 h-3.5 text-primary" />
                  <span>API Key / Client Secret</span>
                </label>
                <input
                  type="password"
                  value={apiKeyInput}
                  onChange={(e) => setApiKeyInput(e.target.value)}
                  placeholder={`Enter your ${activeModalApp.name} API key`}
                  className="w-full h-11 px-4 rounded-xl bg-gray-50 dark:bg-zinc-900 border border-gray-300 dark:border-zinc-700 text-xs text-gray-900 dark:text-white focus:outline-none focus:border-primary font-mono"
                />
              </div>

              {activeModalApp.id === "twilio" && (
                <label className="text-xs font-semibold text-gray-700 dark:text-zinc-300">
                  Account SID
                  <input
                    aria-label="Account SID"
                    value={accountId}
                    onChange={(e) => setAccountId(e.target.value)}
                    placeholder="ACxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx"
                    className="mt-1.5 w-full h-11 px-4 rounded-xl bg-gray-50 dark:bg-zinc-900 border border-gray-300 dark:border-zinc-700 text-xs text-gray-900 dark:text-white focus:outline-none focus:border-primary font-mono"
                  />
                </label>
              )}

              {activeModalApp.id === "n8n" && (
                <label className="text-xs font-semibold text-gray-700 dark:text-zinc-300">
                  Webhook signing secret
                  <input
                    aria-label="Webhook signing secret"
                    type="password"
                    autoComplete="new-password"
                    value={webhookSecret}
                    onChange={(e) => setWebhookSecret(e.target.value)}
                    placeholder="Minimum 32 characters"
                    className="mt-1.5 w-full h-11 px-4 rounded-xl bg-gray-50 dark:bg-zinc-900 border border-gray-300 dark:border-zinc-700 text-xs text-gray-900 dark:text-white focus:outline-none focus:border-primary font-mono"
                  />
                </label>
              )}

              <p className="text-xs text-gray-500 dark:text-zinc-400">
                Credentials are encrypted on the server. Saving does not enable delivery. The n8n API address is set by your administrator.
              </p>
            </div>

            <div className="flex gap-3 pb-4 text-xs">
              <button
                type="button"
                disabled={savingConnector || activeModalApp.status === "disconnected"}
                onClick={() => void handleConnection("test")}
                className="px-4 py-2 rounded-xl border border-primary text-primary font-semibold disabled:opacity-50 cursor-pointer"
              >
                Test Connection
              </button>
              <button
                type="button"
                disabled={savingConnector}
                onClick={() => void handleConnection("disconnect")}
                className="px-4 py-2 rounded-xl border border-gray-300 dark:border-zinc-700 text-gray-700 dark:text-zinc-300 font-semibold cursor-pointer"
              >
                Disconnect
              </button>
            </div>

            <div className="flex items-center justify-end gap-3 pt-4 border-t border-gray-200 dark:border-zinc-800">
              <button
                type="button"
                onClick={() => setActiveModalApp(null)}
                className="px-4 py-2.5 rounded-full text-xs font-semibold text-gray-600 dark:text-zinc-400 hover:text-gray-900 dark:hover:text-white transition-colors cursor-pointer"
              >
                Cancel
              </button>

              <button
                type="button"
                disabled={savingConnector}
                onClick={() => void handleConnection("save")}
                className="px-6 py-2.5 rounded-full font-bold text-xs uppercase tracking-wider text-white bg-primary hover:bg-primary/90 shadow-lg shadow-primary/25 transition-all cursor-pointer disabled:opacity-60"
              >
                {savingConnector ? "Saving…" : "Save Credentials"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Setup Guide Modal for OAuth / Free-Stack / Optional Webhooks */}
      {guideApp && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-md">
          <div className="w-full max-w-lg rounded-3xl bg-white dark:bg-zinc-950 border border-gray-200 dark:border-zinc-800 p-6 sm:p-8 shadow-2xl">
            <div className="flex items-center justify-between pb-4 border-b border-gray-200 dark:border-zinc-800">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-gray-100 dark:bg-zinc-900 p-2 flex items-center justify-center border border-gray-200 dark:border-zinc-800">
                  <Image
                    src={guideApp.logo}
                    alt={guideApp.name}
                    width={24}
                    height={24}
                    className="w-6 h-6 object-contain"
                  />
                </div>
                <div>
                  <h3 className="font-bold text-base text-gray-900 dark:text-white">
                    {guideApp.name} Setup Guide
                  </h3>
                  <span className="text-xs text-gray-500 dark:text-zinc-400">{guideApp.role}</span>
                </div>
              </div>
              <button
                type="button"
                aria-label="Close guide"
                onClick={() => setGuideApp(null)}
                className="p-2 rounded-xl text-gray-400 hover:text-gray-900 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-zinc-800 cursor-pointer"
              >
                <XMarkIcon className="w-5 h-5" />
              </button>
            </div>

            <div className="py-5 space-y-3">
              <p className="text-xs text-gray-600 dark:text-zinc-300 leading-relaxed">
                {guideApp.description}
              </p>
              {guideApp.setupSteps && guideApp.setupSteps.length > 0 && (
                <ul className="space-y-2 pt-2">
                  {guideApp.setupSteps.map((step, i) => (
                    <li
                      key={i}
                      className="p-3 rounded-xl bg-gray-50 dark:bg-zinc-900 border border-gray-200 dark:border-zinc-800 text-xs text-gray-700 dark:text-zinc-200 flex items-start gap-2.5"
                    >
                      <span className="w-5 h-5 rounded-full bg-primary/15 text-primary font-bold text-[10px] flex items-center justify-center shrink-0">
                        {i + 1}
                      </span>
                      <span>{step}</span>
                    </li>
                  ))}
                </ul>
              )}
            </div>

            <div className="flex justify-end pt-4 border-t border-gray-200 dark:border-zinc-800">
              <button
                type="button"
                onClick={() => setGuideApp(null)}
                className="px-5 py-2 rounded-full text-xs font-bold bg-primary text-white cursor-pointer"
              >
                Got it
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default function AutomationsPage() {
  return (
    <Suspense fallback={<div className="p-8 text-xs text-gray-500">Loading command center...</div>}>
      <AutomationsCommandCenterContent />
    </Suspense>
  );
}
