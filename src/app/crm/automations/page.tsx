"use client";

import React, { useState, useEffect } from "react";
import Image from "next/image";
import {
  BoltIcon,
  CheckCircleIcon,
  ArrowRightIcon,
  SparklesIcon,
  SignalIcon,
  XMarkIcon,
  LinkIcon,
  KeyIcon,
  AdjustmentsHorizontalIcon,
} from "@heroicons/react/24/solid";

interface IntegrationApp {
  id: string;
  name: string;
  role: string;
  description: string;
  category: "CRM & Sales" | "Accounting & ERP" | "Comms & SMS" | "Automation & Glue" | "AI & Web Research" | "Storage & Docs";
  logo: string;
  status: "connected" | "disconnected" | "saved" | "error";
  eventsProcessed: string;
  lastSync: string;
}

const initialApps: IntegrationApp[] = [
  {
    id: "apollo",
    name: "Apollo.io",
    role: "Lead Intelligence",
    description: "The B2B search engine for finding new customer leads.",
    category: "CRM & Sales",
    logo: "/brand-logos/apollo.svg",
    status: "connected",
    eventsProcessed: "12,480 leads",
    lastSync: "3 mins ago",
  },
  {
    id: "n8n",
    name: "n8n",
    role: "Workflow Orchestrator",
    description: "Internal workflow coordinator & webhook dispatcher with fail-closed safety.",
    category: "Automation & Glue",
    logo: "/brand-logos/n8n.svg",
    status: "connected",
    eventsProcessed: "34,910 events",
    lastSync: "Just now",
  },
  {
    id: "ghl",
    name: "GoHighLevel (GHL)",
    role: "Agency Funnel & CRM",
    description: "Multi-channel agency CRM, sales funnel & marketing sequence pipeline.",
    category: "CRM & Sales",
    logo: "/brand-logos/gohighlevel.svg",
    status: "connected",
    eventsProcessed: "8,240 contacts",
    lastSync: "12 mins ago",
  },
  {
    id: "twilio",
    name: "Twilio",
    role: "Automated SMS",
    description: "The background engine that sends automated SMS text messages to customers.",
    category: "Comms & SMS",
    logo: "/brand-logos/twilio.svg",
    status: "connected",
    eventsProcessed: "5,190 SMS",
    lastSync: "1 min ago",
  },
  {
    id: "hubspot",
    name: "HubSpot",
    role: "Rolodex & Deals",
    description: "The digital rolodex & sales pipeline board.",
    category: "CRM & Sales",
    logo: "/brand-logos/hubspot.svg",
    status: "disconnected",
    eventsProcessed: "0 events",
    lastSync: "Not connected",
  },
  {
    id: "qbo",
    name: "QuickBooks Online (QBO)",
    role: "Cash Register & Ledger",
    description: "The digital cash register & tax ledger.",
    category: "Accounting & ERP",
    logo: "/brand-logos/quickbooks.svg",
    status: "disconnected",
    eventsProcessed: "0 invoices",
    lastSync: "Not connected",
  },
  {
    id: "inhouse",
    name: "The In-House App",
    role: "Custom Portal",
    description: "The new custom portal replacing BuilderTrend for office & field crews.",
    category: "CRM & Sales",
    logo: "/brand-logos/inhouse-app.svg",
    status: "connected",
    eventsProcessed: "18,400 updates",
    lastSync: "Real-time",
  },
  {
    id: "buildertrend",
    name: "BuilderTrend",
    role: "Legacy Migration Sync",
    description: "The old, slow construction software they are throwing away.",
    category: "Accounting & ERP",
    logo: "/brand-logos/buildertrend.svg",
    status: "disconnected",
    eventsProcessed: "Archive only",
    lastSync: "Ready to migrate",
  },
  {
    id: "dialpad",
    name: "Dialpad",
    role: "Auto-Recorded Calls",
    description: "The internet phone system on computers and mobile phones that auto-records calls.",
    category: "Comms & SMS",
    logo: "/brand-logos/dialpad.svg",
    status: "disconnected",
    eventsProcessed: "0 calls",
    lastSync: "Not connected",
  },
  {
    id: "asana",
    name: "Asana",
    role: "Project Deadlines",
    description: "The digital to-do list for office project deadlines.",
    category: "Comms & SMS",
    logo: "/brand-logos/asana.svg",
    status: "disconnected",
    eventsProcessed: "0 tasks",
    lastSync: "Not connected",
  },
  {
    id: "slack",
    name: "Slack",
    role: "Team Chat Room",
    description: "The fast internal team chat room.",
    category: "Comms & SMS",
    logo: "/brand-logos/slack.svg",
    status: "connected",
    eventsProcessed: "2,490 alerts",
    lastSync: "5 mins ago",
  },
  {
    id: "dropbox-m365",
    name: "Dropbox & Microsoft 365",
    role: "Digital Filing Cabinet",
    description: "The digital filing cabinet for blueprints, contracts, and spreadsheets.",
    category: "Storage & Docs",
    logo: "/brand-logos/dropbox.svg",
    status: "disconnected",
    eventsProcessed: "0 files",
    lastSync: "Not connected",
  },
  {
    id: "zapier-make",
    name: "Zapier & Make",
    role: "Digital Glue",
    description: "The \"digital glue\" that moves data between all these apps automatically.",
    category: "Automation & Glue",
    logo: "/brand-logos/zapier.svg",
    status: "connected",
    eventsProcessed: "41,800 webhooks",
    lastSync: "4 mins ago",
  },
  {
    id: "claude",
    name: "Claude (Claude Code, Projects, MCP)",
    role: "Smart AI Engine",
    description: "The primary smart AI engine for deep technical analysis and database connections.",
    category: "AI & Web Research",
    logo: "/brand-logos/claude.svg",
    status: "connected",
    eventsProcessed: "1,840 queries",
    lastSync: "Active Session",
  },
  {
    id: "manus",
    name: "Manus AI",
    role: "Autonomous Web Agent",
    description: "The emerging autonomous web-research agent.",
    category: "AI & Web Research",
    logo: "/brand-logos/manus.svg",
    status: "disconnected",
    eventsProcessed: "0 runs",
    lastSync: "Not connected",
  },
];

const categories = [
  "All Apps",
  "CRM & Sales",
  "Accounting & ERP",
  "Comms & SMS",
  "Automation & Glue",
  "AI & Web Research",
  "Storage & Docs",
];

export default function AutomationsPage() {
  const [apps, setApps] = useState<IntegrationApp[]>(initialApps.map(app=>({...app,status:"disconnected",eventsProcessed:"No delivery enabled",lastSync:"Not tested"})));
  const [selectedCategory, setSelectedCategory] = useState("All Apps");
  const [activeModalApp, setActiveModalApp] = useState<IntegrationApp | null>(null);
  const [apiKeyInput, setApiKeyInput] = useState("");
  const [accountId, setAccountId] = useState("");
  const [webhookSecret, setWebhookSecret] = useState("");
  const [saving, setSaving] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Sync automation connection states from backend API
  useEffect(() => {
    fetch("/api/crm/automations")
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (data?.automations) {
          setApps((prev) =>
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
      .catch((err) => console.error("Failed to fetch automations status:", err));
  }, []);

  const filteredApps = apps.filter((app) => {
    if (selectedCategory === "All Apps") return true;
    return app.category === selectedCategory;
  });

  const connectedCount = apps.filter((a) => a.status === "connected").length;

  const handleOpenConnect = (app: IntegrationApp) => {
    if(!['apollo','twilio','n8n'].includes(app.id)){setToastMessage('This connector is planned and is not available yet.');return;}
    setActiveModalApp(app);setApiKeyInput('');setAccountId('');setWebhookSecret('');
  };
  const handleConnection = async (action: 'save'|'test'|'disconnect') => {
    if(!activeModalApp || saving)return;setSaving(true);
    try {
      const response=await fetch('/api/crm/automations/connect',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({id:activeModalApp.id,action,...(action==='save'?{credentials:{apiKey:apiKeyInput,...(accountId?{accountId}:{}),...(webhookSecret?{webhookSecret}:{})}}:{})})});
      const data=await response.json();if(!response.ok)throw new Error(data.error);
      setApps(prev=>prev.map(app=>app.id===activeModalApp.id?{...app,status:data.status,lastSync:action==='test'?'Checked just now':'Not tested'}:app));
      setActiveModalApp(prev=>prev?{...prev,status:data.status}:null);setApiKeyInput('');setWebhookSecret('');
      setToastMessage(data.message??(action==='save'?'Credentials encrypted and saved. Test the connection next.':'Connection disconnected.'));
    }catch(error){setToastMessage(error instanceof Error?error.message:'Could not save connection.');}
    finally{setSaving(false);}
  };

  return (
    <div className="flex flex-col gap-8 max-w-7xl mx-auto pb-12">
      
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed top-6 right-6 z-50 flex items-center gap-2.5 px-4 py-3 rounded-2xl bg-zinc-900 text-white border border-primary/50 shadow-2xl animate-in fade-in slide-in-from-top-4">
          <CheckCircleIcon className="w-5 h-5 text-emerald-500" />
          <span className="text-xs font-semibold">{toastMessage}</span>
        </div>
      )}

      {/* Header & Live Integration Metrics */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 pb-6 border-b border-gray-200 dark:border-zinc-800">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 border border-primary/25 text-primary text-xs font-bold uppercase tracking-wider mb-2">
            <SparklesIcon className="w-3.5 h-3.5" />
            <span>Digital Stack Connectors</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-gray-900 dark:text-white">
            Workflow Automations &amp; App Integrations
          </h1>
          <p className="text-xs sm:text-sm text-gray-500 dark:text-zinc-400 mt-1 max-w-2xl">
            Synchronize your AgencyDesk CRM with Apollo, n8n, GoHighLevel, Twilio, HubSpot, QuickBooks, Dialpad, Slack, Claude, and your in-house custom app.
          </p>
        </div>

        {/* HUD Quick Stats */}
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 shrink-0">
          <div className="p-3 rounded-2xl bg-white dark:bg-zinc-900/80 border border-gray-200 dark:border-zinc-800 flex flex-col">
            <span className="text-[10px] uppercase font-bold text-gray-400">Connected Apps</span>
            <span className="text-lg font-extrabold text-emerald-500 tabular-nums">
              {connectedCount} of {apps.length}
            </span>
          </div>
          <div className="p-3 rounded-2xl bg-white dark:bg-zinc-900/80 border border-gray-200 dark:border-zinc-800 flex flex-col">
            <span className="text-[10px] uppercase font-bold text-gray-400">Monthly Events</span>
            <span className="text-lg font-extrabold text-gray-900 dark:text-white tabular-nums">
              —
            </span>
          </div>
          <div className="p-3 rounded-2xl bg-white dark:bg-zinc-900/80 border border-gray-200 dark:border-zinc-800 col-span-2 sm:col-span-1 flex flex-col">
            <span className="text-[10px] uppercase font-bold text-gray-400">Outbox Engine</span>
            <span className="text-lg font-extrabold text-primary flex items-center gap-1.5">
              <SignalIcon className="w-4 h-4 text-emerald-500 animate-pulse" />
              Not running
            </span>
          </div>
        </div>
      </div>

      {/* Category Filter Pills */}
      <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-hide">
        {categories.map((cat) => (
          <button
            key={cat}
            onClick={() => setSelectedCategory(cat)}
            className={`px-3.5 py-1.5 rounded-full text-xs font-semibold uppercase tracking-wider whitespace-nowrap transition-all duration-150 active:scale-[0.96] cursor-pointer ${
              selectedCategory === cat
                ? "bg-primary text-white shadow-md shadow-primary/20"
                : "bg-gray-100 dark:bg-zinc-900 text-gray-600 dark:text-zinc-400 hover:text-gray-900 dark:hover:text-white border border-transparent hover:border-gray-300 dark:hover:border-zinc-700"
            }`}
          >
            {cat}
          </button>
        ))}
      </div>

      {/* Integrations Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredApps.map((app) => {
          const isConnected = app.status === "connected";
          return (
            <div
              key={app.id}
              className={`
                group relative p-6 rounded-3xl backdrop-blur-xl border flex flex-col justify-between
                transition-all duration-150 hover:scale-[1.01] shadow-xs
                ${
                  isConnected
                    ? "bg-white/80 dark:bg-zinc-950/80 border-gray-200 dark:border-zinc-800 hover:border-primary/50"
                    : "bg-gray-50/70 dark:bg-zinc-950/40 border-gray-200/80 dark:border-zinc-800/60 opacity-90 hover:opacity-100 hover:border-gray-400 dark:hover:border-zinc-700"
                }
              `}
            >
              <div>
                {/* Top Row: Logo + Status Badge */}
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-2xl bg-gray-100 dark:bg-zinc-900 border border-gray-200 dark:border-zinc-700/80 p-2 flex items-center justify-center shrink-0 shadow-xs group-hover:scale-105 transition-transform">
                      <Image
                        src={app.logo}
                        alt={`${app.name} logo`}
                        width={36}
                        height={36}
                        className="w-8 h-8 object-contain rounded"
                      />
                    </div>
                    <div>
                      <h3 className="font-bold text-base text-gray-900 dark:text-white group-hover:text-primary transition-colors">
                        {app.name}
                      </h3>
                      <span className="text-[10px] font-mono text-gray-500 dark:text-zinc-400">
                        {app.role}
                      </span>
                    </div>
                  </div>

                  <span
                    className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider border ${
                      isConnected
                        ? "bg-emerald-500/10 text-emerald-500 border-emerald-500/25"
                        : "bg-gray-200 dark:bg-zinc-800 text-gray-500 dark:text-zinc-400 border-gray-300 dark:border-zinc-700"
                    }`}
                  >
                    <span
                      className={`w-1.5 h-1.5 rounded-full ${
                        isConnected ? "bg-emerald-500 animate-pulse" : "bg-gray-400"
                      }`}
                    />
                    <span>{app.status}</span>
                  </span>
                </div>

                {/* Description */}
                <p className="text-xs text-gray-600 dark:text-zinc-300 leading-relaxed font-lato">
                  {app.description}
                </p>

                {/* Metadata Row */}
                <div className="mt-4 p-3 rounded-2xl bg-gray-100/70 dark:bg-zinc-900/60 border border-gray-200/60 dark:border-zinc-800/80 flex items-center justify-between text-[11px] font-mono">
                  <span className="text-gray-500 dark:text-zinc-400">Volume: {app.eventsProcessed}</span>
                  <span className="text-gray-400 dark:text-zinc-500">Sync: {app.lastSync}</span>
                </div>
              </div>

              {/* Action Button: Charles Liu / Emil Kowalski Dual-Arrow Conveyor & Tactile Press */}
              <div className="mt-6 pt-4 border-t border-gray-100 dark:border-zinc-800/80 flex items-center justify-between">
                <span className="text-[10px] font-bold uppercase tracking-wider text-gray-400">
                  {app.category}
                </span>

                <button
                  type="button"
                  onClick={() => handleOpenConnect(app)}
                  className={`
                    group/btn relative overflow-hidden inline-flex items-center justify-center gap-2
                    px-4 py-2 rounded-full font-semibold text-xs tracking-wider uppercase
                    transition-[transform,background-color,border-color,box-shadow] duration-150 ease-[cubic-bezier(0.32,0.72,0,1)]
                    active:scale-[0.96] cursor-pointer
                    ${
                      isConnected
                        ? "bg-white dark:bg-zinc-900 border border-gray-300 dark:border-zinc-700 text-gray-800 dark:text-zinc-200 hover:border-primary/80 hover:text-primary shadow-xs"
                        : "bg-primary hover:bg-primary/90 text-white shadow-md shadow-primary/20"
                    }
                  `}
                >
                  <span className="relative z-10">
                    {isConnected ? "Configure" : "Connect"}
                  </span>
                  
                  {/* Dual-Arrow Glide */}
                  <span
                    aria-hidden="true"
                    className="relative z-10 inline-flex h-3.5 w-3.5 shrink-0 items-center justify-center overflow-hidden"
                  >
                    <ArrowRightIcon className="absolute h-3.5 w-3.5 transition-all duration-200 ease-[cubic-bezier(0.32,0.72,0,1)] group-hover/btn:translate-x-3.5 group-hover/btn:opacity-0" />
                    <ArrowRightIcon className="absolute h-3.5 w-3.5 -translate-x-3.5 opacity-0 transition-all duration-200 ease-[cubic-bezier(0.32,0.72,0,1)] group-hover/btn:translate-x-0 group-hover/btn:opacity-100" />
                  </span>
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {/* Transactional Outbox Pipeline HUD */}
      <div className="mt-6 p-6 sm:p-8 rounded-3xl bg-white dark:bg-zinc-950/80 border border-gray-200 dark:border-zinc-800 shadow-xl">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-6">
          <div>
            <div className="flex items-center gap-2">
              <BoltIcon className="w-5 h-5 text-primary" />
              <h2 className="text-lg font-bold text-gray-900 dark:text-white">
                Deterministic Outbox Event Stream
              </h2>
            </div>
            <p className="text-xs text-gray-500 dark:text-zinc-400 mt-0.5">
              Guaranteed, idempotent webhook events dispatched across Apollo, Twilio, Slack, and your in-house application.
            </p>
          </div>
          <span className="px-3 py-1 rounded-full text-xs font-mono font-bold bg-emerald-500/10 text-emerald-500 border border-emerald-500/25">
            OUTBOX_HEALTH: 100% OK
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-gray-200 dark:border-zinc-800 text-gray-400 dark:text-zinc-500 uppercase tracking-wider text-[11px]">
                <th className="py-3 px-4 font-semibold">Event ID</th>
                <th className="py-3 px-4 font-semibold">Destination App</th>
                <th className="py-3 px-4 font-semibold">Payload Trigger</th>
                <th className="py-3 px-4 font-semibold">Status</th>
                <th className="py-3 px-4 font-semibold">Timestamp</th>
              </tr>
            </thead>
            <tbody><tr><td colSpan={4} className="p-4 text-gray-500">No delivery worker is enabled. Connection checks do not send messages.</td></tr></tbody>
          </table>
        </div>
      </div>

      {/* Interactive Connect / Configure Modal */}
      {activeModalApp && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-md animate-in fade-in">
          <div className="w-full max-w-lg rounded-3xl bg-white dark:bg-zinc-950 border border-gray-200 dark:border-zinc-800 p-6 sm:p-8 shadow-2xl relative">
            
            {/* Modal Header */}
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
                    {activeModalApp.role} · {activeModalApp.category}
                  </span>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setActiveModalApp(null)}
                className="p-2 rounded-xl text-gray-400 hover:text-white hover:bg-zinc-800 transition-colors cursor-pointer"
              >
                <XMarkIcon className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Body */}
            <div className="flex flex-col gap-4 py-6">
              <p className="text-xs text-gray-600 dark:text-zinc-300 font-lato leading-relaxed">
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

              {activeModalApp.id === 'twilio' && <label className="text-xs">Account SID<input aria-label="Account SID" value={accountId} onChange={e=>setAccountId(e.target.value)} className="w-full h-11 px-4 rounded-xl bg-gray-50 dark:bg-zinc-900 border border-gray-300 dark:border-zinc-700" /></label>}
              {activeModalApp.id === 'n8n' && <label className="text-xs">Webhook signing secret<input aria-label="Webhook signing secret" type="password" autoComplete="new-password" value={webhookSecret} onChange={e=>setWebhookSecret(e.target.value)} className="w-full h-11 px-4 rounded-xl bg-gray-50 dark:bg-zinc-900 border border-gray-300 dark:border-zinc-700" /></label>}
              <p className="text-xs text-gray-500">Credentials are encrypted on the server. Saving does not enable delivery. The n8n API address is set by your administrator.</p>

            </div>

            {/* Modal Actions */}
            <div className="flex gap-3 pb-4 text-xs"><button disabled={saving || activeModalApp.status==='disconnected'} onClick={()=>handleConnection('test')} className="px-4 py-2 rounded-xl border border-primary text-primary">Test Connection</button><button disabled={saving} onClick={()=>handleConnection('disconnect')} className="px-4 py-2 rounded-xl border border-gray-300">Disconnect</button></div>
            <div className="flex items-center justify-end gap-3 pt-4 border-t border-gray-200 dark:border-zinc-800">
              <button
                type="button"
                onClick={() => setActiveModalApp(null)}
                className="px-4 py-2.5 rounded-full text-xs font-semibold text-gray-600 dark:text-zinc-400 hover:text-white transition-colors cursor-pointer"
              >
                Cancel
              </button>
              
              <button
                type="button"
                disabled={saving} onClick={() => handleConnection("save")}
                className={`
                  px-6 py-2.5 rounded-full font-bold text-xs uppercase tracking-wider text-white
                  transition-all duration-150 active:scale-[0.96] shadow-lg cursor-pointer
                  ${
                    activeModalApp.status === "connected"
                      ? "bg-rose-600 hover:bg-rose-700 shadow-rose-600/20"
                      : "bg-primary hover:bg-primary/90 shadow-primary/25"
                  }
                `}
              >
                {saving ? "Saving…" : "Save Credentials"}
              </button>
            </div>

          </div>
        </div>
      )}

    </div>
  );
}
