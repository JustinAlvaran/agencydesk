"use client";

import React, { useState } from "react";
import Link from "next/link";
import { toast } from "sonner";
import {
  ArrowLeftIcon,
  CheckCircleIcon,
  SparklesIcon,
  ArrowUpRightIcon,
  BoltIcon,
  TableCellsIcon,
  ChatBubbleLeftRightIcon,
} from "@heroicons/react/24/solid";

const servicesOptions = [
  "Web & Mobile Applications",
  "AI & Workflow Automations",
  "Cloud & Supabase Architecture",
  "Pipeline & Revenue Analytics",
  "Growth Systems & Technical SEO",
  "Custom CRM & Client Portal",
];

const budgetRanges = [
  "$10,000 - $25,000",
  "$25,000 - $50,000",
  "$50,000 - $100,000",
  "$100,000+",
];

const timelines = [
  "Immediate (Within 2-4 weeks)",
  "Next quarter (1-3 months)",
  "Flexible / Planning phase",
];

export default function InquirePage() {
  const [selectedService, setSelectedService] = useState(servicesOptions[0]);
  const [selectedBudget, setSelectedBudget] = useState(budgetRanges[1]);
  const [selectedTimeline, setSelectedTimeline] = useState(timelines[0]);
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    company: "",
    phone: "",
    whatsapp: "",
    instagram: "",
    brief: "",
    emailOptIn: false,
    whatsappOptIn: true,
  });
  const [submissionId, setSubmissionId] = useState(() => crypto.randomUUID());
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);

    try {
      // Post to backend inquiry endpoint
      const response = await fetch("/api/inquire", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          submission_id: submissionId,
          email_opt_in: formData.emailOptIn,
          whatsapp_opt_in: formData.whatsappOptIn,
          contact_name: formData.name,
          email: formData.email,
          company: formData.company,
          phone: formData.whatsapp || formData.phone,
          whatsapp: formData.whatsapp || formData.phone,
          instagram: formData.instagram,
          service: selectedService,
          budget: selectedBudget,
          timeline: selectedTimeline,
          brief: formData.brief,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || "Failed to submit inquiry");
      }

      setSubmitted(true);
      toast.success("Inquiry Received!", {
        description: "Our agency principal will review your project brief and follow up within 24 hours.",
      });
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Submission error";
      toast.error(msg);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="radial-gradient-bg min-h-screen py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-3xl mx-auto">
        
        {/* Top Back Link */}
        <Link
          href="/"
          className="inline-flex items-center gap-2 text-xs font-semibold text-gray-500 hover:text-primary transition-colors mb-8"
        >
          <ArrowLeftIcon className="w-3.5 h-3.5" />
          <span>Back to Home</span>
        </Link>

        {submitted ? (
          <div className="rounded-3xl bg-white/80 dark:bg-zinc-950/80 backdrop-blur-2xl border border-gray-200 dark:border-zinc-800 p-8 sm:p-14 text-center shadow-2xl">
            <div className="w-16 h-16 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-500 flex items-center justify-center mx-auto mb-6">
              <CheckCircleIcon className="w-10 h-10" />
            </div>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
              Inquiry Submitted Successfully
            </h1>
            <p className="text-sm text-gray-600 dark:text-gray-300 mt-3 max-w-lg mx-auto">
              Thank you, <span className="font-semibold text-gray-900 dark:text-white">{formData.name}</span>. We have recorded your project parameters for <span className="text-primary font-semibold">{formData.company || selectedService}</span>.
            </p>
            <div className="mt-6 grid grid-cols-1 sm:grid-cols-3 gap-3 text-left max-w-2xl mx-auto">
              <div className="p-3.5 rounded-2xl bg-gray-50 dark:bg-zinc-900/70 border border-gray-200 dark:border-zinc-800">
                <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-600 dark:text-emerald-400">
                  1. Logged
                </span>
                <p className="text-xs font-semibold text-gray-900 dark:text-white mt-0.5">
                  CRM Intake Saved
                </p>
                <p className="text-[11px] text-gray-500 dark:text-zinc-400 mt-0.5">
                  Added to our active deal pipeline.
                </p>
              </div>
              <div className="p-3.5 rounded-2xl bg-gray-50 dark:bg-zinc-900/70 border border-gray-200 dark:border-zinc-800">
                <span className="text-[10px] font-bold uppercase tracking-wider text-primary">
                  2. Synced
                </span>
                <p className="text-xs font-semibold text-gray-900 dark:text-white mt-0.5">
                  Sheet &amp; Owner Alert
                </p>
                <p className="text-[11px] text-gray-500 dark:text-zinc-400 mt-0.5">
                  Principal notified for scoping review.
                </p>
              </div>
              <div className="p-3.5 rounded-2xl bg-gray-50 dark:bg-zinc-900/70 border border-gray-200 dark:border-zinc-800">
                <span className="text-[10px] font-bold uppercase tracking-wider text-blue-600 dark:text-blue-400">
                  3. Next (&lt;24h)
                </span>
                <p className="text-xs font-semibold text-gray-900 dark:text-white mt-0.5">
                  Discovery Response
                </p>
                <p className="text-[11px] text-gray-500 dark:text-zinc-400 mt-0.5">
                  Reply via {formData.whatsappOptIn && (formData.whatsapp || formData.phone) ? "WhatsApp & Email" : "Email"}.
                </p>
              </div>
            </div>
            <div className="mt-8 flex flex-col sm:flex-row items-center justify-center gap-4">
              <Link
                href="/crm"
                className="w-full sm:w-auto px-6 py-3 rounded-full font-bold text-xs uppercase tracking-wider bg-primary hover:bg-primary/90 text-white shadow-lg shadow-primary/20 transition-all"
              >
                Open Your Workspace
              </Link>
              <button
                onClick={() => { setSubmitted(false); setSubmissionId(crypto.randomUUID()); }}
                className="w-full sm:w-auto px-6 py-3 rounded-full font-bold text-xs uppercase tracking-wider bg-gray-100 dark:bg-zinc-900 hover:bg-gray-200 dark:hover:bg-zinc-800 text-gray-800 dark:text-gray-200 transition-all"
              >
                Submit Another Inquiry
              </button>
            </div>
          </div>
        ) : (
          <div className="rounded-3xl bg-white/80 dark:bg-zinc-950/80 backdrop-blur-2xl border border-gray-200 dark:border-zinc-800 p-6 sm:p-12 shadow-2xl">
            
            <div className="text-center sm:text-left mb-8 pb-6 border-b border-gray-200 dark:border-zinc-800">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 border border-primary/25 text-primary text-xs font-bold uppercase tracking-wider mb-2">
                <SparklesIcon className="w-3.5 h-3.5" />
                <span>Fixed-Price Project Scoping</span>
              </div>
              <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-white">
                Start Your Project Inquiry
              </h1>
              <p className="text-xs sm:text-sm text-gray-500 dark:text-gray-400 mt-1">
                Share your timeline, target budget, and scope requirements. We craft fixed-price proposals within 48 hours.
              </p>
            </div>

            <form onSubmit={handleSubmit} className="flex flex-col gap-6">
              
              {/* Service Selection */}
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-gray-700 dark:text-zinc-300 mb-2">
                  1. Select Primary Capability
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {servicesOptions.map((opt) => (
                    <button
                      type="button"
                      key={opt}
                      onClick={() => setSelectedService(opt)}
                      className={`px-3.5 py-2.5 rounded-xl text-left text-xs font-medium border transition-all ${
                        selectedService === opt
                          ? "bg-primary/10 border-primary text-primary font-bold shadow-xs"
                          : "bg-gray-50 dark:bg-zinc-900/60 border-gray-200 dark:border-zinc-800 text-gray-700 dark:text-zinc-300 hover:border-gray-400"
                      }`}
                    >
                      {opt}
                    </button>
                  ))}
                </div>
              </div>

              {/* Budget Range */}
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-gray-700 dark:text-zinc-300 mb-2">
                  2. Target Investment Budget
                </label>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                  {budgetRanges.map((range) => (
                    <button
                      type="button"
                      key={range}
                      onClick={() => setSelectedBudget(range)}
                      className={`px-3 py-2.5 rounded-xl text-center text-xs font-semibold border transition-all ${
                        selectedBudget === range
                          ? "bg-primary/10 border-primary text-primary font-bold shadow-xs"
                          : "bg-gray-50 dark:bg-zinc-900/60 border-gray-200 dark:border-zinc-800 text-gray-700 dark:text-zinc-300 hover:border-gray-400"
                      }`}
                    >
                      {range}
                    </button>
                  ))}
                </div>
              </div>

              {/* Target Launch Timeline */}
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-gray-700 dark:text-zinc-300 mb-2">
                  3. Target Launch Timeline
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                  {timelines.map((time) => (
                    <button
                      type="button"
                      key={time}
                      onClick={() => setSelectedTimeline(time)}
                      className={`px-3 py-2.5 rounded-xl text-center text-xs font-semibold border transition-all ${
                        selectedTimeline === time
                          ? "bg-primary/10 border-primary text-primary font-bold shadow-xs"
                          : "bg-gray-50 dark:bg-zinc-900/60 border-gray-200 dark:border-zinc-800 text-gray-700 dark:text-zinc-300 hover:border-gray-400"
                      }`}
                    >
                      {time}
                    </button>
                  ))}
                </div>
              </div>

              {/* Contact Information */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-gray-700 dark:text-zinc-300 mb-1.5">
                    Your Name *
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    placeholder="Elena Vance"
                    className="w-full h-11 px-4 rounded-xl bg-gray-50 dark:bg-zinc-900 border border-gray-300 dark:border-zinc-700 text-xs text-gray-900 dark:text-white focus:border-primary focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-gray-700 dark:text-zinc-300 mb-1.5">
                    Work Email *
                  </label>
                  <input
                    type="email"
                    required
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    placeholder="elena@blackmesa.ai"
                    className="w-full h-11 px-4 rounded-xl bg-gray-50 dark:bg-zinc-900 border border-gray-300 dark:border-zinc-700 text-xs text-gray-900 dark:text-white focus:border-primary focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-gray-700 dark:text-zinc-300 mb-1.5">
                    Company / Organization
                  </label>
                  <input
                    type="text"
                    value={formData.company}
                    onChange={(e) => setFormData({ ...formData, company: e.target.value })}
                    placeholder="Black Mesa Research"
                    className="w-full h-11 px-4 rounded-xl bg-gray-50 dark:bg-zinc-900 border border-gray-300 dark:border-zinc-700 text-xs text-gray-900 dark:text-white focus:border-primary focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-gray-700 dark:text-zinc-300 mb-1.5 flex items-center justify-between">
                    <span>WhatsApp Number</span>
                    <span className="text-[10px] text-emerald-600 dark:text-emerald-400 font-bold uppercase tracking-wider">Fast Response</span>
                  </label>
                  <input
                    type="tel"
                    inputMode="tel"
                    value={formData.whatsapp || formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value, whatsapp: e.target.value })}
                    placeholder="+63 991 378 0170 or +1 555 234 5678"
                    className="w-full h-11 px-4 rounded-xl bg-gray-50 dark:bg-zinc-900 border border-gray-300 dark:border-zinc-700 text-xs text-gray-900 dark:text-white focus:border-primary focus:outline-none font-mono"
                  />
                  <p className="text-[11px] text-gray-500 dark:text-zinc-400 mt-1.5 leading-relaxed">
                    International E.164 format recommended (e.g. <span className="font-mono text-gray-700 dark:text-zinc-300">+639913780170</span> or <span className="font-mono text-gray-700 dark:text-zinc-300">+15551234567</span>). Local <span className="font-mono">09xx</span> PH numbers auto-convert to <span className="font-mono">+63</span>.
                  </p>
                </div>

                <div className="sm:col-span-2">
                  <label className="block text-xs font-semibold text-gray-700 dark:text-zinc-300 mb-1.5 flex items-center justify-between">
                    <span>Instagram Profile / Handle (Optional)</span>
                    <span className="text-[10px] text-pink-600 dark:text-pink-400 font-bold uppercase tracking-wider">Brand Audit</span>
                  </label>
                  <input
                    type="text"
                    value={formData.instagram}
                    onChange={(e) => setFormData({ ...formData, instagram: e.target.value })}
                    placeholder="@yourbrand or instagram.com/company"
                    className="w-full h-11 px-4 rounded-xl bg-gray-50 dark:bg-zinc-900 border border-gray-300 dark:border-zinc-700 text-xs text-gray-900 dark:text-white focus:border-primary focus:outline-none"
                  />
                  <p className="text-[11px] text-gray-500 dark:text-zinc-400 mt-1.5">
                    Share your <span className="font-mono text-gray-700 dark:text-zinc-300">@handle</span> so we can review your brand &amp; funnel before our call.
                  </p>
                </div>
              </div>

              {/* Project Brief */}
              <div>
                <label className="block text-xs font-semibold text-gray-700 dark:text-zinc-300 mb-1.5">
                  Project Brief &amp; Target Objectives *
                </label>
                <textarea
                  required
                  rows={4}
                  value={formData.brief}
                  onChange={(e) => setFormData({ ...formData, brief: e.target.value })}
                  placeholder="Outline your target users, key integrations, feature wishlist, or existing codebase..."
                  className="w-full p-4 rounded-xl bg-gray-50 dark:bg-zinc-900 border border-gray-300 dark:border-zinc-700 text-xs text-gray-900 dark:text-white focus:border-primary focus:outline-none resize-y"
                />
              </div>

              <div className="flex flex-col gap-2.5">
                <div className="flex items-center gap-2.5">
                  <input
                    type="checkbox"
                    id="consent"
                    checked={formData.emailOptIn}
                    onChange={(e) => setFormData({ ...formData, emailOptIn: e.target.checked })}
                    className="w-4 h-4 rounded border-gray-300 text-primary focus:ring-primary cursor-pointer"
                  />
                  <label htmlFor="consent" className="text-xs text-gray-500 dark:text-zinc-400 cursor-pointer">
                    I agree to receive the itemized proposal scope and milestone updates via email.
                  </label>
                </div>

                <div className="flex items-center gap-2.5">
                  <input
                    type="checkbox"
                    id="whatsappConsent"
                    checked={formData.whatsappOptIn}
                    onChange={(e) => setFormData({ ...formData, whatsappOptIn: e.target.checked })}
                    className="w-4 h-4 rounded border-gray-300 text-emerald-500 focus:ring-emerald-500 cursor-pointer"
                  />
                  <label htmlFor="whatsappConsent" className="text-xs text-gray-600 dark:text-zinc-300 cursor-pointer flex items-center gap-1.5">
                    <span>Send quick updates &amp; scope summary via</span>
                    <strong className="text-emerald-500 font-bold">WhatsApp</strong>
                  </label>
                </div>
              </div>

              {/* What Happens Next Reassurance Block */}
              <div className="p-4 sm:p-5 rounded-2xl bg-gray-50/90 dark:bg-zinc-900/60 border border-gray-200 dark:border-zinc-800">
                <div className="flex items-center justify-between mb-3">
                  <span className="text-[11px] font-bold uppercase tracking-wider text-gray-700 dark:text-zinc-300">
                    What happens next
                  </span>
                  <span className="text-[10px] font-semibold text-emerald-600 dark:text-emerald-400">
                    No spam · Human review
                  </span>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div className="flex items-start gap-2.5 p-3 rounded-xl bg-white dark:bg-zinc-950/70 border border-gray-200/80 dark:border-zinc-800">
                    <div className="w-7 h-7 rounded-lg bg-primary/10 text-primary flex items-center justify-center shrink-0">
                      <BoltIcon className="w-4 h-4" />
                    </div>
                    <div>
                      <p className="text-xs font-bold text-gray-900 dark:text-white">
                        1. Instant CRM Intake
                      </p>
                      <p className="text-[11px] text-gray-500 dark:text-zinc-400 mt-0.5 leading-snug">
                        Your scope, budget, and timeline are logged immediately.
                      </p>
                    </div>
                  </div>

                  <div className="flex items-start gap-2.5 p-3 rounded-xl bg-white dark:bg-zinc-950/70 border border-gray-200/80 dark:border-zinc-800">
                    <div className="w-7 h-7 rounded-lg bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shrink-0">
                      <TableCellsIcon className="w-4 h-4" />
                    </div>
                    <div>
                      <p className="text-xs font-bold text-gray-900 dark:text-white">
                        2. Sheet &amp; Owner Alert
                      </p>
                      <p className="text-[11px] text-gray-500 dark:text-zinc-400 mt-0.5 leading-snug">
                        Synced to our tracking sheet and flagged for our principal.
                      </p>
                    </div>
                  </div>

                  <div className="flex items-start gap-2.5 p-3 rounded-xl bg-white dark:bg-zinc-950/70 border border-gray-200/80 dark:border-zinc-800">
                    <div className="w-7 h-7 rounded-lg bg-blue-500/10 text-blue-600 dark:text-blue-400 flex items-center justify-center shrink-0">
                      <ChatBubbleLeftRightIcon className="w-4 h-4" />
                    </div>
                    <div>
                      <p className="text-xs font-bold text-gray-900 dark:text-white">
                        3. Discovery Within 24h
                      </p>
                      <p className="text-[11px] text-gray-500 dark:text-zinc-400 mt-0.5 leading-snug">
                        We follow up via WhatsApp or email with clear next steps.
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Submit Button */}
              <button
                type="submit"
                disabled={submitting}
                className="w-full flex items-center justify-center gap-2 py-4 rounded-full font-bold text-xs uppercase tracking-wider bg-primary hover:bg-primary/90 text-white shadow-xl shadow-primary/25 transition-all duration-200 cursor-pointer disabled:opacity-60"
              >
                <span>{submitting ? "Submitting Inquiry..." : "Submit Inquiry for Proposal"}</span>
                <ArrowUpRightIcon className="w-4 h-4" />
              </button>

            </form>

          </div>
        )}

      </div>
    </div>
  );
}
