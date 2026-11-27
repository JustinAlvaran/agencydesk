import React from "react";
import Link from "next/link";
import { getSEOMetadata } from "@/utils/seoMetadata";
import { ScaleIcon } from "@heroicons/react/24/solid";

export async function generateMetadata() {
  return getSEOMetadata("agencydesk-theta.vercel.app", "/terms-of-service");
}

export default function TermsOfServicePage() {
  return (
    <div className="min-h-screen flex flex-col py-12 px-4 sm:px-6 lg:px-16 radial-gradient-bg mt-10 2xl:mt-16">
      <main className="max-w-4xl w-full mx-auto">
        <div className="bg-white/80 dark:bg-zinc-950/80 px-6 py-5 rounded-2xl border border-gray-200 dark:border-zinc-800 mb-8 flex items-center gap-4 shadow-sm backdrop-blur-xl">
          <div className="w-12 h-12 rounded-xl bg-primary flex items-center justify-center shrink-0 shadow-md shadow-primary/20">
            <ScaleIcon className="w-6 h-6 text-white" />
          </div>
          <div>
            <p className="text-[11px] font-bold uppercase tracking-widest text-primary">
              Legal &amp; Engagement Terms
            </p>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-gray-900 dark:text-white">
              Terms of Service
            </h1>
            <p className="text-xs text-gray-500 dark:text-zinc-400 mt-0.5">
              Effective Date: November 27, 2026 · AgencyDesk
            </p>
          </div>
        </div>

        <article className="flex flex-col gap-6 bg-white/85 dark:bg-zinc-950/80 border border-gray-200 dark:border-zinc-800 p-6 sm:p-10 rounded-3xl backdrop-blur-xl shadow-xl text-sm text-gray-700 dark:text-zinc-300 leading-relaxed">
          <p>
            Welcome to <strong>AgencyDesk</strong>. These Terms of Service (&ldquo;Terms&rdquo;)
            govern your access to and use of{" "}
            <span className="font-mono text-xs text-primary">https://agencydesk-theta.vercel.app</span>,
            our project inquiry and discovery booking flows, and our client portal workspace. By
            using our services, you agree to these Terms.
          </p>

          <section className="space-y-2">
            <h2 className="text-lg font-bold text-primary">
              1. Agency Engagements &amp; Fixed-Price Proposals
            </h2>
            <p>
              Project inquiries and discovery calls are exploratory until a formal versioned
              proposal is published in the AgencyDesk Client Portal and formally accepted. Accepted
              proposals define the fixed scope, milestone schedule, and deliverable acceptance
              criteria for the engagement.
            </p>
          </section>

          <section className="space-y-2">
            <h2 className="text-lg font-bold text-primary">
              2. Client Portal Approvals &amp; Workspace Accounts
            </h2>
            <ul className="list-disc pl-5 space-y-1.5">
              <li>
                You are responsible for maintaining the confidentiality of your portal login links
                and account credentials.
              </li>
              <li>
                Milestone approvals and proposal acceptances recorded through authenticated client
                accounts constitute binding project sign-off for that deliverable phase.
              </li>
              <li>
                Notify us promptly at{" "}
                <a className="underline text-primary" href="mailto:inquiries@agencydesk.dev">
                  inquiries@agencydesk.dev
                </a>{" "}
                if you suspect unauthorized access.
              </li>
            </ul>
          </section>

          <section className="space-y-2">
            <h2 className="text-lg font-bold text-primary">3. Acceptable Use</h2>
            <p>
              You agree to use AgencyDesk only for lawful business inquiries and project
              collaboration. Automated scraping, unauthorized credential probing, spam submissions,
              or interference with workspace isolation controls is strictly prohibited.
            </p>
          </section>

          <section className="space-y-2">
            <h2 className="text-lg font-bold text-primary">4. Intellectual Property</h2>
            <p>
              AgencyDesk platform code, interface designs, and documentation remain the property of
              AgencyDesk and its licensors. Ownership of custom client deliverables transfers upon
              milestone completion and full payment according to the accepted proposal terms.
            </p>
          </section>

          <section className="space-y-2">
            <h2 className="text-lg font-bold text-primary">5. Limitation of Liability</h2>
            <p>
              To the maximum extent permitted by applicable law, AgencyDesk provides this website and
              portal on an &ldquo;as is&rdquo; basis and is not liable for indirect, incidental, or
              consequential damages arising from third-party service outages or client-provided
              content.
            </p>
          </section>

          <section className="space-y-2">
            <h2 className="text-lg font-bold text-primary">6. Changes &amp; Contact</h2>
            <p>
              We may update these Terms periodically with an updated effective date. Questions
              regarding these Terms may be directed to{" "}
              <a className="underline text-primary" href="mailto:inquiries@agencydesk.dev">
                inquiries@agencydesk.dev
              </a>
              .
            </p>
          </section>

          <div className="pt-4 border-t border-gray-200 dark:border-zinc-800 flex flex-wrap items-center gap-4 text-xs">
            <Link href="/privacy-policy" className="text-primary hover:underline font-semibold">
              Read Privacy Policy
            </Link>
            <Link href="/book" className="text-gray-500 dark:text-zinc-400 hover:text-primary underline">
              Book Discovery Call
            </Link>
          </div>
        </article>
      </main>
    </div>
  );
}
