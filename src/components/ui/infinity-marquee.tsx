"use client";

import Image from "next/image";
import { useTheme } from "next-themes";
import { useEffect, useState } from "react";

export const companies = [
  { 
    name: "Google", 
    logo: "/brand-logos/google.webp",
    lightLogo: "/brand-logos/google-light.webp",
    hasWordmark: true,
  },
  { 
    name: "Meta", 
    logo: "/brand-logos/meta.webp",
    lightLogo: "/brand-logos/meta-light.webp",
    hasWordmark: true,
  },
  { 
    name: "Intel", 
    logo: "/brand-logos/intel.webp",
    lightLogo: "/brand-logos/intel-light.webp",
    hasWordmark: true,
  },
  { 
    name: "Microsoft", 
    logo: "/brand-logos/microsoft.webp",
    lightLogo: "/brand-logos/microsoft-light.webp",
    hasWordmark: true,
  },
  { 
    name: "GitHub", 
    logo: "/brand-logos/github.webp",
    lightLogo: "/brand-logos/github-light.webp",
    hasWordmark: true,
  },
  { 
    name: "IBM", 
    logo: "/brand-logos/ibm.webp",
    lightLogo: "/brand-logos/ibm-light.webp",
    hasWordmark: true,
  },
  { 
    name: "Oracle", 
    logo: "/brand-logos/oracle.webp",
    lightLogo: "/brand-logos/oracle-light.webp",
    hasWordmark: true,
  },
  { 
    name: "Adobe", 
    logo: "/brand-logos/adobe.webp",
    lightLogo: "/brand-logos/adobe-light.webp",
    hasWordmark: true,
  },
  // Added Partner & Platform Websites with dedicated icons & labels
  {
    name: "HubSpot",
    logo: "/brand-logos/hubspot.svg",
    lightLogo: "/brand-logos/hubspot.svg",
    hasWordmark: false,
  },
  {
    name: "QuickBooks",
    logo: "/brand-logos/quickbooks.svg",
    lightLogo: "/brand-logos/quickbooks.svg",
    hasWordmark: false,
  },
  {
    name: "Apollo.io",
    logo: "/brand-logos/apollo.svg",
    lightLogo: "/brand-logos/apollo.svg",
    hasWordmark: false,
  },
  {
    name: "n8n",
    logo: "/brand-logos/n8n.svg",
    lightLogo: "/brand-logos/n8n.svg",
    hasWordmark: false,
  },
  {
    name: "GoHighLevel",
    logo: "/brand-logos/gohighlevel.svg",
    lightLogo: "/brand-logos/gohighlevel.svg",
    hasWordmark: false,
  },
  {
    name: "Twilio",
    logo: "/brand-logos/twilio.svg",
    lightLogo: "/brand-logos/twilio.svg",
    hasWordmark: false,
  },
  {
    name: "Dialpad",
    logo: "/brand-logos/dialpad.svg",
    lightLogo: "/brand-logos/dialpad.svg",
    hasWordmark: false,
  },
  {
    name: "Slack",
    logo: "/brand-logos/slack.svg",
    lightLogo: "/brand-logos/slack.svg",
    hasWordmark: false,
  },
  {
    name: "Asana",
    logo: "/brand-logos/asana.svg",
    lightLogo: "/brand-logos/asana.svg",
    hasWordmark: false,
  },
  {
    name: "Dropbox",
    logo: "/brand-logos/dropbox.svg",
    lightLogo: "/brand-logos/dropbox.svg",
    hasWordmark: false,
  },
  {
    name: "Zapier",
    logo: "/brand-logos/zapier.svg",
    lightLogo: "/brand-logos/zapier.svg",
    hasWordmark: false,
  },
  {
    name: "Make",
    logo: "/brand-logos/make.svg",
    lightLogo: "/brand-logos/make.svg",
    hasWordmark: false,
  },
  {
    name: "Claude",
    logo: "/brand-logos/claude.svg",
    lightLogo: "/brand-logos/claude.svg",
    hasWordmark: false,
  },
  {
    name: "Manus AI",
    logo: "/brand-logos/manus.svg",
    lightLogo: "/brand-logos/manus.svg",
    hasWordmark: false,
  },
  {
    name: "BuilderTrend",
    logo: "/brand-logos/buildertrend.svg",
    lightLogo: "/brand-logos/buildertrend.svg",
    hasWordmark: false,
  },
  {
    name: "The In-House App",
    logo: "/brand-logos/inhouse-app.svg",
    lightLogo: "/brand-logos/inhouse-app.svg",
    hasWordmark: false,
  },
];

export function InfiniteMarquee() {
  const { theme } = useTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const renderBrand = (company: (typeof companies)[0], index: number, prefix: string) => {
    const isLight = mounted && theme === "light";
    const logoSrc = isLight ? company.lightLogo : company.logo;

    return (
      <div
        key={`${prefix}-${index}`}
        className="flex items-center gap-2.5 sm:gap-3 shrink-0 px-3 sm:px-4 py-1.5 transition-all duration-300 opacity-80 hover:opacity-100 group cursor-default"
      >
        <div className="relative flex items-center justify-center shrink-0">
          <Image
            src={logoSrc}
            alt={`${company.name} logo`}
            width={company.hasWordmark ? 120 : 28}
            height={company.hasWordmark ? 36 : 28}
            className={
              company.hasWordmark
                ? "max-h-7 sm:max-h-8 w-auto object-contain"
                : "h-6 sm:h-7 w-6 sm:w-7 object-contain shrink-0"
            }
          />
        </div>
        {!company.hasWordmark && (
          <span className="font-semibold text-xs sm:text-sm text-gray-800 dark:text-gray-200 tracking-tight whitespace-nowrap group-hover:text-primary transition-colors">
            {company.name}
          </span>
        )}
      </div>
    );
  };

  return (
    <div
      data-testid="marquee"
      className="w-full relative z-20 overflow-hidden bg-white/95 dark:bg-black/90 backdrop-blur-xl border-y border-gray-200/60 dark:border-zinc-800 py-4 sm:py-5 shadow-sm"
    >
      <div className="flex animate-marquee hover:[animation-play-state:paused] items-center">
        {/* First set of logos */}
        <div className="flex items-center justify-around shrink-0 gap-6 sm:gap-10 px-4 sm:px-6">
          {companies.map((company, index) => renderBrand(company, index, "first"))}
        </div>

        {/* Duplicate set for seamless loop */}
        <div
          className="flex items-center justify-around shrink-0 gap-6 sm:gap-10 px-4 sm:px-6"
          aria-hidden="true"
        >
          {companies.map((company, index) => renderBrand(company, index, "second"))}
        </div>
      </div>
    </div>
  );
}

export default InfiniteMarquee;
