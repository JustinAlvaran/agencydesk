"use client";

import React, { useState } from "react";
import Link from "next/link";
import { toast } from "sonner";
import {
  ArrowLeftIcon,
  ArrowUpRightIcon,
  CalendarDaysIcon,
  CheckCircleIcon,
  ClockIcon,
  SparklesIcon,
  VideoCameraIcon,
} from "@heroicons/react/24/solid";

const SERVICES = [
  "Web & Mobile Applications",
  "AI & Workflow Automations",
  "Cloud & Supabase Architecture",
  "Pipeline & Revenue Analytics",
  "Growth Systems & Technical SEO",
  "Custom CRM & Client Portal",
] as const;

const SLOT_WINDOWS = [
  "Tomorrow · Morning (9:00 AM - 12:00 PM)",
  "Tomorrow · Afternoon (1:00 PM - 5:00 PM)",
  "This Week · Evening / Flexible",
  "Next Week · Any Available 20-Min Slot",
] as const;

const TIMEZONES = [
  "Asia/Manila (GMT+8)",
  "America/Los_Angeles (PST/PDT)",
  "America/New_York (EST/EDT)",
  "Europe/London (GMT/BST)",
  "UTC",
] as const;

function getSafeCalcomUrl(raw?: string): string | null {
  if (!raw) return null;
  const trimmed = raw.trim();
  if (/^https:\/\/(app\.)?cal\.com\/[A-Za-z0-9_/-]+$/i.test(trimmed)) {
    return trimmed;
  }
  return null;
}

export default function BookDiscoveryPage() {
  const calcomUrl = getSafeCalcomUrl(process.env.NEXT_PUBLIC_CALCOM_BOOKING_URL);

  const [selectedService, setSelectedService] = useState<string>(SERVICES[1]);
  const [slotWindow, setSlotWindow] = useState<string>(SLOT_WINDOWS[0]);
  const [timezone, setTimezone] = useState<string>(TIMEZONES[0]);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [company, setCompany] = useState("");
  const [whatsapp, setWhatsapp] = useState("");
  const [notes, setNotes] = useState("");
  const [whatsappOptIn, setWhatsappOptIn] = useState(true);
  const [emailOptIn, setEmailOptIn] = useState(true);
  const [submissionId, setSubmissionId] = useState(() => crypto.randomUUID());
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (submitting) return;
    setSubmitting(true);

    const composedBrief = `Discovery Call Request (${slotWindow} · ${timezone}). ${
      notes.trim() || "Interested in scoping a 20-minute architecture and timeline walkthrough."
    }`;

    try {
      const response = await fetch("/api/inquire", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          submission_id: submissionId,
          contact_name: name,
          email,
          company,
          phone: whatsapp,
          whatsapp,
          whatsapp_opt_in: whatsappOptIn,
          email_opt_in: emailOptIn,
          service: selectedService,
          budget: "$25,000 - $50,000",
          timeline: "Immediate (Within 2-4 weeks)",
          brief: composedBrief.length >= 20 ? composedBrief : `${composedBrief} Looking to start soon.`,
        }),
      });

      if (!response.ok) {
        const err = await response.json().catch(() => ({}));
        throw new Error(err.error || "Could not submit discovery slot request.");
      }

      setSubmitted(true);
      toast.success("Discovery slot request received!", {
        description: "We will confirm your Google Calendar invite within 24 hours.",
      });
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Could not submit request.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="radial-gradient-bg min-h-screen py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-5xl mx-auto">
        <Link
          href="/"
          className="inline-flex items-center gap-2 text-xs font-semibold text-gray-500 hover:text-primary transition-colors mb-8"
        >
          <ArrowLeftIcon className="w-3.5 h-3.5" />
          <span>Back to Home</span>
        </Link>

        {/* Hero Header */}
        <div className="rounded-3xl bg-white/85 dark:bg-zinc-950/85 backdrop-blur-2xl border border-gray-200 dark:border-zinc-800 p-6 sm:p-10 shadow-2xl mb-8">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 border border-primary/25 text-primary text-xs font-bold uppercase tracking-wider mb-3">
            <CalendarDaysIcon className="w-3.5 h-3.5" />
            <span>20-Minute Discovery Call</span>
          </div>
          <h1 className="text-2xl sm:text-4xl font-extrabold text-gray-900 dark:text-white">
            Schedule a Project Scoping Call
          </h1>
          <p className="text-xs sm:text-sm text-gray-600 dark:text-zinc-400 mt-2 max-w-2xl leading-relaxed">
            Walk through your product architecture, CRM workflows, or automation goals directly with
            AgencyDesk engineering. Calls sync directly to Google Calendar and trigger instant scoping
            follow-ups.
          </p>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mt-6">
            <div className="p-3.5 rounded-2xl bg-gray-50 dark:bg-zinc-900/70 border border-gray-200 dark:border-zinc-800 flex items-center gap-3">
              <ClockIcon className="w-5 h-5 text-primary shrink-0" />
              <div>
                <p className="text-xs font-bold text-gray-900 dark:text-white">20 Minutes</p>
                <p className="text-[11px] text-gray-500 dark:text-zinc-400">Focused scope &amp; budget fit</p>
              </div>
            </div>
            <div className="p-3.5 rounded-2xl bg-gray-50 dark:bg-zinc-900/70 border border-gray-200 dark:border-zinc-800 flex items-center gap-3">
              <VideoCameraIcon className="w-5 h-5 text-emerald-500 shrink-0" />
              <div>
                <p className="text-xs font-bold text-gray-900 dark:text-white">Google Meet / Video</p>
                <p className="text-[11px] text-gray-500 dark:text-zinc-400">Calendar invite sent automatically</p>
              </div>
            </div>
            <div className="p-3.5 rounded-2xl bg-gray-50 dark:bg-zinc-900/70 border border-gray-200 dark:border-zinc-800 flex items-center gap-3">
              <SparklesIcon className="w-5 h-5 text-blue-500 shrink-0" />
              <div>
                <p className="text-xs font-bold text-gray-900 dark:text-white">Fixed Proposal in 48h</p>
                <p className="text-[11px] text-gray-500 dark:text-zinc-400">Clear milestones, no guesswork</p>
              </div>
            </div>
          </div>
        </div>

        {/* Main Scheduler / Request Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          {/* Left Panel: Cal.com Live Embed OR Sync Guide */}
          <div className="lg:col-span-6 flex flex-col gap-6">
            {calcomUrl ? (
              <div className="rounded-3xl bg-white/85 dark:bg-zinc-950/85 border border-gray-200 dark:border-zinc-800 p-5 shadow-xl flex flex-col gap-4 h-full">
                <div className="flex items-center justify-between gap-2">
                  <div>
                    <h2 className="text-base font-bold text-gray-900 dark:text-white">
                      Instant Cal.com Booking
                    </h2>
                    <p className="text-xs text-gray-500 dark:text-zinc-400">
                      Pick any open slot synced with Google Calendar.
                    </p>
                  </div>
                  <a
                    href={calcomUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1 px-3 py-1.5 rounded-full text-xs font-bold bg-primary/10 text-primary border border-primary/20 hover:bg-primary hover:text-white transition-colors shrink-0"
                  >
                    <span>Open Cal.com</span>
                    <ArrowUpRightIcon className="w-3.5 h-3.5" />
                  </a>
                </div>
                <iframe
                  src={`${calcomUrl}?embed=true`}
                  title="AgencyDesk Discovery Call Scheduler"
                  className="w-full min-h-[540px] rounded-2xl border border-gray-200 dark:border-zinc-800 bg-white"
                />
              </div>
            ) : (
              <div className="rounded-3xl bg-white/85 dark:bg-zinc-950/85 border border-gray-200 dark:border-zinc-800 p-6 sm:p-8 shadow-xl flex flex-col justify-between gap-6">
                <div className="space-y-4">
                  <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-bold uppercase tracking-wider bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
                    Free-First Cal.com + Google Calendar Sync
                  </span>
                  <h2 className="text-xl font-bold text-gray-900 dark:text-white">
                    Direct Calendar Sync Architecture
                  </h2>
                  <p className="text-xs sm:text-sm text-gray-600 dark:text-zinc-300 leading-relaxed">
                    Request your preferred 20-minute window on the right, or connect a free Cal.com
                    event link for instant self-serve booking.
                  </p>

                  <div className="space-y-2.5 pt-2">
                    <div className="p-3.5 rounded-2xl bg-gray-50 dark:bg-zinc-900/70 border border-gray-200 dark:border-zinc-800 text-xs">
                      <p className="font-bold text-gray-900 dark:text-white">
                        1. Google Calendar Sync (kinggucci195@gmail.com)
                      </p>
                      <p className="text-gray-500 dark:text-zinc-400 mt-1">
                        Cal.com free tier checks conflicts against Google Calendar and creates Meet
                        links automatically.
                      </p>
                    </div>
                    <div className="p-3.5 rounded-2xl bg-gray-50 dark:bg-zinc-900/70 border border-gray-200 dark:border-zinc-800 text-xs">
                      <p className="font-bold text-gray-900 dark:text-white">
                        2. AgencyDesk Webhook Sync (/api/webhooks/calcom)
                      </p>
                      <p className="text-gray-500 dark:text-zinc-400 mt-1">
                        Confirmed bookings advance the lead to Contacted, log a discovery task, and
                        notify the owner on WhatsApp.
                      </p>
                    </div>
                    <div className="p-3.5 rounded-2xl bg-gray-50 dark:bg-zinc-900/70 border border-gray-200 dark:border-zinc-800 text-xs">
                      <p className="font-bold text-gray-900 dark:text-white">
                        3. Optional Live Embed Variable
                      </p>
                      <p className="text-gray-500 dark:text-zinc-400 mt-1">
                        Set <span className="font-mono">NEXT_PUBLIC_CALCOM_BOOKING_URL</span> to{" "}
                        <span className="font-mono">https://cal.com/&lt;handle&gt;/discovery</span>{" "}
                        to embed the live calendar widget here.
                      </p>
                    </div>
                  </div>
                </div>

                <div className="pt-4 border-t border-gray-200 dark:border-zinc-800 flex items-center justify-between text-xs">
                  <span className="text-gray-500 dark:text-zinc-400">Prefer async scoping?</span>
                  <Link href="/inquire" className="font-bold text-primary hover:underline">
                    Full Project Brief Form →
                  </Link>
                </div>
              </div>
            )}
          </div>

          {/* Right Panel: Discovery Slot / Custom Time Form */}
          <div className="lg:col-span-6">
            {submitted ? (
              <div className="rounded-3xl bg-white/85 dark:bg-zinc-950/85 border border-gray-200 dark:border-zinc-800 p-8 sm:p-10 text-center shadow-xl">
                <div className="w-14 h-14 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-500 flex items-center justify-center mx-auto mb-5">
                  <CheckCircleIcon className="w-8 h-8" />
                </div>
                <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
                  Discovery Slot Requested
                </h2>
                <p className="text-xs sm:text-sm text-gray-600 dark:text-zinc-300 mt-2 leading-relaxed">
                  Thanks, <strong>{name}</strong>. We logged your request for{" "}
                  <span className="text-primary font-semibold">{slotWindow}</span> ({timezone}) and
                  will send your calendar invite shortly.
                </p>
                <div className="mt-6 flex flex-col sm:flex-row gap-3 justify-center">
                  <button
                    type="button"
                    onClick={() => {
                      setSubmitted(false);
                      setSubmissionId(crypto.randomUUID());
                    }}
                    className="px-5 py-2.5 rounded-full text-xs font-bold uppercase tracking-wider bg-gray-100 dark:bg-zinc-900 text-gray-800 dark:text-zinc-200 cursor-pointer"
                  >
                    Request Another Time
                  </button>
                  <Link
                    href="/"
                    className="px-5 py-2.5 rounded-full text-xs font-bold uppercase tracking-wider bg-primary text-white"
                  >
                    Back to Home
                  </Link>
                </div>
              </div>
            ) : (
              <form
                onSubmit={handleSubmit}
                className="rounded-3xl bg-white/85 dark:bg-zinc-950/85 border border-gray-200 dark:border-zinc-800 p-6 sm:p-8 shadow-xl flex flex-col gap-5"
              >
                <div>
                  <h2 className="text-lg font-bold text-gray-900 dark:text-white">
                    {calcomUrl ? "Request Custom Time" : "Request a 20-Min Discovery Slot"}
                  </h2>
                  <p className="text-xs text-gray-500 dark:text-zinc-400 mt-0.5">
                    Pick your preferred time window and we&apos;ll confirm with a Google Meet invite.
                  </p>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                  <div>
                    <label className="block text-xs font-semibold text-gray-700 dark:text-zinc-300 mb-1">
                      Your Name *
                    </label>
                    <input
                      type="text"
                      required
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      placeholder="Alex Rivera"
                      className="w-full h-10 px-3.5 rounded-xl bg-gray-50 dark:bg-zinc-900 border border-gray-300 dark:border-zinc-700 text-xs text-gray-900 dark:text-white focus:border-primary focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-gray-700 dark:text-zinc-300 mb-1">
                      Work Email *
                    </label>
                    <input
                      type="email"
                      required
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="alex@company.com"
                      className="w-full h-10 px-3.5 rounded-xl bg-gray-50 dark:bg-zinc-900 border border-gray-300 dark:border-zinc-700 text-xs text-gray-900 dark:text-white focus:border-primary focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-gray-700 dark:text-zinc-300 mb-1">
                      Company
                    </label>
                    <input
                      type="text"
                      value={company}
                      onChange={(e) => setCompany(e.target.value)}
                      placeholder="Northwind Ops"
                      className="w-full h-10 px-3.5 rounded-xl bg-gray-50 dark:bg-zinc-900 border border-gray-300 dark:border-zinc-700 text-xs text-gray-900 dark:text-white focus:border-primary focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-gray-700 dark:text-zinc-300 mb-1">
                      WhatsApp (Optional)
                    </label>
                    <input
                      type="tel"
                      inputMode="tel"
                      value={whatsapp}
                      onChange={(e) => setWhatsapp(e.target.value)}
                      placeholder="+63 991 378 0170"
                      className="w-full h-10 px-3.5 rounded-xl bg-gray-50 dark:bg-zinc-900 border border-gray-300 dark:border-zinc-700 text-xs text-gray-900 dark:text-white focus:border-primary focus:outline-none font-mono"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-gray-700 dark:text-zinc-300 mb-1">
                    Primary Topic
                  </label>
                  <select
                    value={selectedService}
                    onChange={(e) => setSelectedService(e.target.value)}
                    className="w-full h-10 px-3.5 rounded-xl bg-gray-50 dark:bg-zinc-900 border border-gray-300 dark:border-zinc-700 text-xs text-gray-900 dark:text-white focus:border-primary focus:outline-none"
                  >
                    {SERVICES.map((svc) => (
                      <option key={svc} value={svc}>
                        {svc}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                  <div>
                    <label className="block text-xs font-semibold text-gray-700 dark:text-zinc-300 mb-1">
                      Preferred Time Window
                    </label>
                    <select
                      value={slotWindow}
                      onChange={(e) => setSlotWindow(e.target.value)}
                      className="w-full h-10 px-3.5 rounded-xl bg-gray-50 dark:bg-zinc-900 border border-gray-300 dark:border-zinc-700 text-xs text-gray-900 dark:text-white focus:border-primary focus:outline-none"
                    >
                      {SLOT_WINDOWS.map((slot) => (
                        <option key={slot} value={slot}>
                          {slot}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-gray-700 dark:text-zinc-300 mb-1">
                      Your Timezone
                    </label>
                    <select
                      value={timezone}
                      onChange={(e) => setTimezone(e.target.value)}
                      className="w-full h-10 px-3.5 rounded-xl bg-gray-50 dark:bg-zinc-900 border border-gray-300 dark:border-zinc-700 text-xs text-gray-900 dark:text-white focus:border-primary focus:outline-none"
                    >
                      {TIMEZONES.map((tz) => (
                        <option key={tz} value={tz}>
                          {tz}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-gray-700 dark:text-zinc-300 mb-1">
                    Agenda / Context (Optional)
                  </label>
                  <textarea
                    rows={3}
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    placeholder="What would you like to build or automate?"
                    className="w-full p-3 rounded-xl bg-gray-50 dark:bg-zinc-900 border border-gray-300 dark:border-zinc-700 text-xs text-gray-900 dark:text-white focus:border-primary focus:outline-none resize-y"
                  />
                </div>

                <div className="flex flex-col gap-2 text-xs text-gray-600 dark:text-zinc-400">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={emailOptIn}
                      onChange={(e) => setEmailOptIn(e.target.checked)}
                      className="w-4 h-4 rounded border-gray-300 text-primary"
                    />
                    <span>Send calendar confirmation and scoping notes via email</span>
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={whatsappOptIn}
                      onChange={(e) => setWhatsappOptIn(e.target.checked)}
                      className="w-4 h-4 rounded border-gray-300 text-emerald-500"
                    />
                    <span>Send quick scheduling confirmation on WhatsApp</span>
                  </label>
                </div>

                <button
                  type="submit"
                  disabled={submitting}
                  className="w-full flex items-center justify-center gap-2 py-3.5 rounded-full font-bold text-xs uppercase tracking-wider bg-primary hover:bg-primary/90 text-white shadow-lg shadow-primary/25 transition-all cursor-pointer disabled:opacity-60"
                >
                  <span>{submitting ? "Requesting Slot..." : "Request Discovery Call"}</span>
                  <ArrowUpRightIcon className="w-4 h-4" />
                </button>
              </form>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
