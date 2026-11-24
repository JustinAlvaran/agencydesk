"use client";

import React from "react";
import Image from "next/image";
import Link from "next/link";
import { ArrowUpRightIcon } from "@heroicons/react/24/solid";

interface CommunitySectionProps {
  title?: string;
  subtitle?: string;
  buttonOneTitle?: string;
  buttonOneHref?: string;
  buttonTwoTitle?: string;
  buttonTwoHref?: string;
}

const CommunitySection = ({
  title,
  subtitle,
  buttonOneTitle,
  buttonOneHref,
  buttonTwoTitle,
  buttonTwoHref,
}: CommunitySectionProps) => {
  return (
    <section id="community" className="backdrop-blur-2xl flex flex-col gap-8 justify-center items-center py-20 px-4 sm:px-8 community-bg w-full">
      <div className="flex flex-col gap-8 items-center text-center max-w-4xl mx-auto">
        
        {/* Emblem Logo */}
        <Image
          src="/logo/agencydesk-logo.svg"
          alt="AgencyDesk Emblem"
          className="w-16 h-16 sm:w-20 sm:h-20 self-center transition-transform hover:scale-110"
          width={80}
          height={80}
        />

        <div className="flex flex-col gap-3 items-center">
          <h3 className="text-3xl sm:text-5xl lg:text-6xl font-bold font-monserrat text-gray-900 dark:text-white leading-tight">
            {title ? (
              title
            ) : (
              <>
                Ready to Accelerate Your <br className="hidden sm:inline" />
                <span className="text-primary">Agency Workflow</span>?
              </>
            )}
          </h3>
          <p className="font-lato text-sm sm:text-lg text-gray-600 dark:text-gray-300 max-w-2xl mt-2 leading-relaxed">
            {subtitle || "Transform unstructured inbound leads into scoped, versioned proposals and track delivery milestones through our real-time client portal."}
          </p>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row gap-4 justify-center items-center mt-4">
          <Link
            href={buttonOneHref || "/inquire"}
            className="flex items-center justify-center gap-2 w-64 py-3.5 rounded-full font-bold text-xs uppercase tracking-wider bg-primary hover:bg-primary/90 text-white shadow-xl shadow-primary/25 transition-all"
          >
            <span>{buttonOneTitle || "Start Project Inquiry"}</span>
            <ArrowUpRightIcon className="w-4 h-4" />
          </Link>

          <Link
            href={buttonTwoHref || "/crm"}
            className="flex items-center justify-center gap-2 w-64 py-3.5 rounded-full font-bold text-xs uppercase tracking-wider bg-white/80 dark:bg-zinc-900/80 hover:bg-white dark:hover:bg-zinc-800 text-gray-900 dark:text-white border border-gray-300 dark:border-zinc-700 transition-all"
          >
            <span>{buttonTwoTitle || "Explore CRM Workspace"}</span>
          </Link>
        </div>

      </div>
    </section>
  );
};

export default CommunitySection;
