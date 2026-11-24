import React from 'react';
import Image from 'next/image';
import Link from 'next/link';

const AboutUsSection = () => {
  const KPICircleStyle = "rounded-full w-[clamp(12.5rem,24vw,17.5rem)] h-[clamp(12.5rem,24vw,17.5rem)] aspect-square border-2 border-white/60 dark:border-white/10 backdrop-blur-2xl bg-white/20 dark:bg-black/30 transition-[transform,border-color,box-shadow] duration-150 ease-[cubic-bezier(0.32,0.72,0,1)] flex flex-col justify-center items-center gap-2 p-4 shadow-[0_4px_20px_0_rgba(0,0,0,0.10),inset_0_0_20px_0_rgba(255,255,255,0.80)] dark:shadow-[inset_0_0_20px_0_rgba(255,255,255,0.1)] hover:scale-105 active:scale-[0.98] hover:border-primary/80 hover:shadow-primary/20 cursor-pointer group";

  return (
    <section 
      id="aboutus" 
      className="flex flex-col justify-center items-center py-16 h-full backdrop-blur-2xl w-full"
    >
      <div className="flex flex-col gap-8 px-4 sm:px-8 py-10 aboutus-bg h-full w-full max-w-7xl mx-auto">
        <div className="
          flex flex-col 
          gap-8
          justify-center 
          py-12
          px-6 sm:px-12
          backdrop-blur-2xl 
          bg-white/60 dark:bg-zinc-950/60 
          rounded-3xl
          border border-gray-200 dark:border-zinc-800 
          w-full 
          shadow-xl
        ">
          {/* Main Heading */}
          <div className="text-center">
            <span className="text-xs font-bold uppercase tracking-wider text-primary">
              Our Agency Philosophy
            </span>
            <h3 className="text-3xl sm:text-4xl font-bold text-gray-900 dark:text-white mt-2 leading-tight">
              Radical Transparency in Agency Operations
            </h3>
          </div>

          {/* Content Section */}
          <div className="max-w-3xl mx-auto text-center flex flex-col gap-4">
            <h4 className="font-semibold text-lg sm:text-xl text-gray-800 dark:text-gray-200">
              Transforming Client Relationships Through <span className="text-primary">Clarity &amp; Structure</span>
            </h4>
            
            <p className="font-lato text-sm sm:text-base text-gray-600 dark:text-gray-300 leading-relaxed">
              AgencyDesk was built to solve the universal friction points between digital agencies and their clients: ambiguous project scopes, scattered email threads, delayed feedback loops, and unexpected budget surprises.
            </p>
            <p className="font-lato text-sm sm:text-base text-gray-600 dark:text-gray-300 leading-relaxed">
              By enforcing structured inquiry capture, versioned immutable proposals, and live client portal milestones, AgencyDesk ensures every dollar spent aligns with verified business outcomes.
            </p>
          </div>

          {/* Stats Grid - All Clickable */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 justify-items-center items-center w-full mt-6">
            
            {/* Stat Card 1 */}
            <Link href="/crm/proposals" className={KPICircleStyle} title="Explore Versioned Proposals">
              <div className="w-12 h-12 flex items-center justify-center rounded-2xl bg-primary/10 border border-primary/20 text-primary group-hover:scale-110 transition-transform">
                <Image src="/icons/ribbon.svg" alt="Fixed-Scope Clarity" width={36} height={36} />
              </div>
              <span className="font-bold text-2xl sm:text-3xl text-gray-900 dark:text-white tabular-nums">100%</span>
              <p className="text-xs font-semibold uppercase tracking-wider text-gray-500 dark:text-zinc-400 text-center group-hover:text-primary transition-colors">
                Fixed-Scope Clarity ↗
              </p>
            </Link>

            {/* Stat Card 2 */}
            <Link href="/portal" className={KPICircleStyle} title="Open Client Portal Sprints">
              <div className="w-12 h-12 flex items-center justify-center rounded-2xl bg-primary/10 border border-primary/20 text-primary group-hover:scale-110 transition-transform">
                <Image src="/icons/team.svg" alt="Client Portal Sprints" width={36} height={36} />
              </div>
              <span className="font-bold text-2xl sm:text-3xl text-gray-900 dark:text-white">Real-Time</span>
              <p className="text-xs font-semibold uppercase tracking-wider text-gray-500 dark:text-zinc-400 text-center group-hover:text-primary transition-colors">
                Client Portal Sprints ↗
              </p>
            </Link>

            {/* Stat Card 3 */}
            <Link href="/inquire" className={KPICircleStyle} title="Start Scoped Inquiry">
              <div className="w-12 h-12 flex items-center justify-center rounded-2xl bg-primary/10 border border-primary/20 text-primary group-hover:scale-110 transition-transform">
                <Image src="/icons/trophy.svg" alt="Zero Surprise Invoices" width={36} height={36} />
              </div>
              <span className="font-bold text-2xl sm:text-3xl text-gray-900 dark:text-white">Zero</span>
              <p className="text-xs font-semibold uppercase tracking-wider text-gray-500 dark:text-zinc-400 text-center group-hover:text-primary transition-colors">
                Surprise Invoices ↗
              </p>
            </Link>

            {/* Stat Card 4 */}
            <Link href="/crm/automations" className={KPICircleStyle} title="View Outbox Automations">
              <div className="w-12 h-12 flex items-center justify-center rounded-2xl bg-primary/10 border border-primary/20 text-primary group-hover:scale-110 transition-transform">
                <Image src="/icons/globe.svg" alt="Automated Outbox" width={36} height={36} />
              </div>
              <span className="font-bold text-2xl sm:text-3xl text-gray-900 dark:text-white">Automated</span>
              <p className="text-xs font-semibold uppercase tracking-wider text-gray-500 dark:text-zinc-400 text-center group-hover:text-primary transition-colors">
                Outbox &amp; Follow-Ups ↗
              </p>
            </Link>

          </div>

        </div>
      </div>
    </section>
  );
};

export default AboutUsSection;
