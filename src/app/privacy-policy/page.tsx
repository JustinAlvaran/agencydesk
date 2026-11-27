import React from "react";
import Link from "next/link";
import { getSEOMetadata } from "@/utils/seoMetadata";
import { CheckCircleIcon, ShieldCheckIcon } from "@heroicons/react/24/solid";

export async function generateMetadata() {
  return getSEOMetadata("agencydesk-theta.vercel.app", "/privacy-policy");
}

export default function PrivacyPolicyPage() {
  return (
    <div className="min-h-screen flex flex-col py-12 px-4 sm:px-6 lg:px-16 radial-gradient-bg mt-10 2xl:mt-16">
      <main className="max-w-4xl w-full mx-auto">
        <div className="bg-white/80 dark:bg-zinc-950/80 px-6 py-5 rounded-2xl border border-gray-200 dark:border-zinc-800 mb-8 flex items-center gap-4 shadow-sm backdrop-blur-xl">
          <div className="w-12 h-12 rounded-xl bg-primary flex items-center justify-center shrink-0 shadow-md shadow-primary/20">
            <ShieldCheckIcon className="w-6 h-6 text-white" />
          </div>
          <div>
            <p className="text-[11px] font-bold uppercase tracking-widest text-primary">
              Legal &amp; Data Governance
            </p>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-gray-900 dark:text-white">
              Privacy Policy
            </h1>
            <p className="text-xs text-gray-500 dark:text-zinc-400 mt-0.5">
              Effective Date: November 27, 2026 · AgencyDesk
            </p>
          </div>
        </div>

        <article className="flex flex-col gap-6 bg-white/85 dark:bg-zinc-950/80 border border-gray-200 dark:border-zinc-800 p-6 sm:p-10 rounded-3xl backdrop-blur-xl shadow-xl text-sm text-gray-700 dark:text-zinc-300 leading-relaxed">
          <p>
            Your privacy matters to us at <strong>AgencyDesk</strong> (&ldquo;AgencyDesk&rdquo;,
            &ldquo;we&rdquo;, &ldquo;our&rdquo;, or &ldquo;us&rdquo;). This Privacy Policy explains how
            we collect, use, store, and protect your information when you visit{" "}
            <span className="font-mono text-xs text-primary">https://agencydesk-theta.vercel.app</span>,
            submit project inquiries, schedule discovery calls, or collaborate inside our client
            portal.
          </p>

          <section className="space-y-3">
            <h2 className="text-lg font-bold text-primary">1. Information We Collect</h2>
            <ul className="space-y-2.5">
              <li className="flex gap-3 items-start">
                <CheckCircleIcon className="mt-0.5 w-5 h-5 text-primary shrink-0" aria-hidden />
                <span>
                  <strong>Inquiry &amp; Lead Details:</strong> Contact name, work email, company name,
                  service category, target budget, timeline, project brief, optional WhatsApp phone
                  number, and optional Instagram handle submitted through{" "}
                  <Link href="/inquire" className="text-primary underline">
                    /inquire
                  </Link>{" "}
                  or{" "}
                  <Link href="/book" className="text-primary underline">
                    /book
                  </Link>
                  .
                </span>
              </li>
              <li className="flex gap-3 items-start">
                <CheckCircleIcon className="mt-0.5 w-5 h-5 text-primary shrink-0" aria-hidden />
                <span>
                  <strong>Workspace &amp; Portal Records:</strong> Proposal approvals, milestone
                  feedback, and staff activity logs associated with your engagement.
                </span>
              </li>
              <li className="flex gap-3 items-start">
                <CheckCircleIcon className="mt-0.5 w-5 h-5 text-primary shrink-0" aria-hidden />
                <span>
                  <strong>Session &amp; Security Telemetry:</strong> Essential authentication cookies
                  and request metadata required to protect workspaces and prevent abuse.
                </span>
              </li>
            </ul>
          </section>

          <section className="space-y-3">
            <h2 className="text-lg font-bold text-primary">
              2. WhatsApp &amp; Email Opt-In / Opt-Out Consent
            </h2>
            <p>
              We only send automated or follow-up project messages based on the communication
              preferences you explicitly select. You may opt out of email or WhatsApp follow-ups at
              any time by replying &ldquo;STOP&rdquo; or emailing{" "}
              <a className="underline text-primary" href="mailto:inquiries@agencydesk.dev">
                inquiries@agencydesk.dev
              </a>
              .
            </p>
            <p className="p-4 rounded-2xl bg-emerald-500/10 border border-emerald-500/25 text-xs text-gray-800 dark:text-zinc-200">
              <strong>Strict Mobile Data Commitment:</strong> Mobile numbers, WhatsApp opt-in status,
              and text-message originator consent data are <strong>never</strong> sold, rented, or
              shared with third parties or affiliates for marketing or promotional purposes.
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="text-lg font-bold text-primary">
              3. Cookies &amp; Supabase Authentication
            </h2>
            <p>
              AgencyDesk uses essential cookies managed via Supabase Auth to maintain signed-in staff
              and client portal sessions. You can disable non-essential cookies in your browser
              settings; disabling essential session cookies will prevent portal login.
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="text-lg font-bold text-primary">
              4. Infrastructure &amp; Workflow Sub-Processors
            </h2>
            <p>
              To deliver scoping, scheduling, and project management workflows, AgencyDesk processes
              authorized workspace records through vetted service providers:
            </p>
            <ul className="space-y-2">
              <li className="flex gap-3 items-start">
                <CheckCircleIcon className="mt-0.5 w-5 h-5 text-primary shrink-0" aria-hidden />
                <span>
                  <strong>Supabase:</strong> PostgreSQL database storage, row-level security, and
                  authentication.
                </span>
              </li>
              <li className="flex gap-3 items-start">
                <CheckCircleIcon className="mt-0.5 w-5 h-5 text-primary shrink-0" aria-hidden />
                <span>
                  <strong>Vercel:</strong> Application hosting and edge transport encryption.
                </span>
              </li>
              <li className="flex gap-3 items-start">
                <CheckCircleIcon className="mt-0.5 w-5 h-5 text-primary shrink-0" aria-hidden />
                <span>
                  <strong>n8n Cloud &amp; Google Workspace (Sheets / Gmail):</strong> Internal lead
                  synchronization and staff-approved follow-up preparation under the agency
                  operator&apos;s workspace (<span className="font-mono text-xs">kinggucci195@gmail.com</span>).
                </span>
              </li>
              <li className="flex gap-3 items-start">
                <CheckCircleIcon className="mt-0.5 w-5 h-5 text-primary shrink-0" aria-hidden />
                <span>
                  <strong>Cal.com:</strong> Optional discovery-call scheduling and Google Calendar
                  synchronization.
                </span>
              </li>
            </ul>
          </section>

          <section className="space-y-3">
            <h2 className="text-lg font-bold text-primary">5. Your Access &amp; Deletion Rights</h2>
            <p>
              You may request access to, correction of, export of, or deletion of your personal data
              at any time by contacting us at{" "}
              <a className="underline text-primary" href="mailto:inquiries@agencydesk.dev">
                inquiries@agencydesk.dev
              </a>
              . We respond to verified requests within 30 days.
            </p>
          </section>

          <section className="space-y-3 pt-4 border-t border-gray-200 dark:border-zinc-800">
            <h2 className="text-lg font-bold text-primary">6. Contact Us</h2>
            <address className="not-italic text-xs sm:text-sm space-y-1">
              <p className="font-bold text-gray-900 dark:text-white">AgencyDesk</p>
              <p>
                Operator Contact:{" "}
                <a className="underline text-primary" href="mailto:inquiries@agencydesk.dev">
                  inquiries@agencydesk.dev
                </a>{" "}
                (Owner Workspace: kinggucci195@gmail.com)
              </p>
            </address>
            <div className="pt-3 flex flex-wrap items-center gap-4 text-xs">
              <Link href="/terms-of-service" className="text-primary hover:underline font-semibold">
                View Terms of Service
              </Link>
              <Link href="/inquire" className="text-gray-500 dark:text-zinc-400 hover:text-primary underline">
                Submit Project Inquiry
              </Link>
            </div>
          </section>
        </article>
      </main>
    </div>
  );
}
