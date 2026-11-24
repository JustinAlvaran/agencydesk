"use client";

import Image from "next/image";
import { useTheme } from "next-themes";
import { useEffect, useState } from "react";

export const companies = [
  { 
    name: "Google", 
    logo: "/brand-logos/google.webp",
    lightLogo: "/brand-logos/google-light.webp"
  },
  { 
    name: "Meta", 
    logo: "/brand-logos/meta.webp",
    lightLogo: "/brand-logos/meta-light.webp"
  },
  { 
    name: "Intel", 
    logo: "/brand-logos/intel.webp",
    lightLogo: "/brand-logos/intel-light.webp"
  },
  { 
    name: "Microsoft", 
    logo: "/brand-logos/microsoft.webp",
    lightLogo: "/brand-logos/microsoft-light.webp"
  },
  { 
    name: "GitHub", 
    logo: "/brand-logos/github.webp",
    lightLogo: "/brand-logos/github-light.webp"
  },
  { 
    name: "IBM", 
    logo: "/brand-logos/ibm.webp",
    lightLogo: "/brand-logos/ibm-light.webp"
  },
  { 
    name: "Oracle", 
    logo: "/brand-logos/oracle.webp",
    lightLogo: "/brand-logos/oracle-light.webp"
  },
  { 
    name: "Adobe", 
    logo: "/brand-logos/adobe.webp",
    lightLogo: "/brand-logos/adobe-light.webp"
  },
  // Added Partner & Platform Websites
  {
    name: "HubSpot",
    logo: "/brand-logos/hubspot.svg",
    lightLogo: "/brand-logos/hubspot.svg"
  },
  {
    name: "QuickBooks",
    logo: "/brand-logos/quickbooks.svg",
    lightLogo: "/brand-logos/quickbooks.svg"
  },
  {
    name: "Apollo.io",
    logo: "/brand-logos/apollo.svg",
    lightLogo: "/brand-logos/apollo.svg"
  },
  {
    name: "n8n",
    logo: "/brand-logos/n8n.svg",
    lightLogo: "/brand-logos/n8n.svg"
  },
  {
    name: "GoHighLevel",
    logo: "/brand-logos/gohighlevel.svg",
    lightLogo: "/brand-logos/gohighlevel.svg"
  },
  {
    name: "Twilio",
    logo: "/brand-logos/twilio.svg",
    lightLogo: "/brand-logos/twilio.svg"
  },
  {
    name: "Dialpad",
    logo: "/brand-logos/dialpad.svg",
    lightLogo: "/brand-logos/dialpad.svg"
  },
  {
    name: "Slack",
    logo: "/brand-logos/slack.svg",
    lightLogo: "/brand-logos/slack.svg"
  },
  {
    name: "Asana",
    logo: "/brand-logos/asana.svg",
    lightLogo: "/brand-logos/asana.svg"
  },
  {
    name: "Dropbox",
    logo: "/brand-logos/dropbox.svg",
    lightLogo: "/brand-logos/dropbox.svg"
  },
  {
    name: "Zapier",
    logo: "/brand-logos/zapier.svg",
    lightLogo: "/brand-logos/zapier.svg"
  },
  {
    name: "Make",
    logo: "/brand-logos/make.svg",
    lightLogo: "/brand-logos/make.svg"
  },
  {
    name: "Claude",
    logo: "/brand-logos/claude.svg",
    lightLogo: "/brand-logos/claude.svg"
  },
  {
    name: "Manus AI",
    logo: "/brand-logos/manus.svg",
    lightLogo: "/brand-logos/manus.svg"
  },
  {
    name: "BuilderTrend",
    logo: "/brand-logos/buildertrend.svg",
    lightLogo: "/brand-logos/buildertrend.svg"
  },
  {
    name: "The In-House App",
    logo: "/brand-logos/inhouse-app.svg",
    lightLogo: "/brand-logos/inhouse-app.svg"
  },
];

export function InfiniteMarquee() {
  const { theme } = useTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return (
      <div data-testid="marquee" className="w-full overflow-hidden bg-white dark:bg-black backdrop-blur-xl border border-border/50 py-6 sm:py-8">
        <div className="flex animate-marquee">
          {/* First set of logos */}
          <div className="flex items-center justify-around min-w-full shrink-0 gap-8 sm:gap-16 px-4 sm:px-8">
            {companies.map((company, index) => (
              <div
                key={`first-${index}`}
                className="flex items-center justify-center h-10 sm:h-12 w-28 sm:w-32 transition-all duration-300 opacity-70 hover:opacity-100"
              >
                <Image
                  src={company.logo}
                  alt={`${company.name} logo`}
                  width={128}
                  height={48}
                  className="max-h-8 sm:max-h-12 w-auto object-contain"
                />
              </div>
            ))}
          </div>

          {/* Duplicate set for seamless loop */}
          <div className="flex items-center justify-around min-w-full shrink-0 gap-8 sm:gap-16 px-4 sm:px-8">
            {companies.map((company, index) => (
              <div
                key={`second-${index}`}
                className="flex items-center justify-center h-10 sm:h-12 w-28 sm:w-32 transition-all duration-300 opacity-70 hover:opacity-100"
              >
                <Image
                  src={company.logo}
                  alt={`${company.name} logo`}
                  width={128}
                  height={48}
                  className="max-h-8 sm:max-h-12 w-auto object-contain"
                />
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full overflow-hidden bg-white dark:bg-black backdrop-blur-xl border border-border/50 py-6 sm:py-8">
      <div className="flex animate-marquee hover:[animation-play-state:paused]">
        {/* First set of logos */}
        <div className="flex items-center justify-around min-w-full shrink-0 gap-8 sm:gap-16 px-4 sm:px-8">
          {companies.map((company, index) => (
            <div
              key={`first-${index}`}
              className="flex items-center justify-center h-10 sm:h-12 w-28 sm:w-32 transition-all duration-300 opacity-80 hover:opacity-100"
            >
              <Image
                src={theme === "light" ? company.lightLogo : company.logo}
                alt={`${company.name} logo`}
                width={128}
                height={48}
                className="max-h-8 sm:max-h-12 w-auto object-contain"
              />
            </div>
          ))}
        </div>

        {/* Duplicate set for seamless loop */}
        <div className="flex items-center justify-around min-w-full shrink-0 gap-8 sm:gap-16 px-4 sm:px-8" aria-hidden="true">
          {companies.map((company, index) => (
            <div
              key={`second-${index}`}
              className="flex items-center justify-center h-10 sm:h-12 w-28 sm:w-32 transition-all duration-300 opacity-80 hover:opacity-100"
            >
              <Image
                src={theme === "light" ? company.lightLogo : company.logo}
                alt={`${company.name} logo`}
                width={128}
                height={48}
                className="max-h-8 sm:max-h-12 w-auto object-contain"
              />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

export default InfiniteMarquee;
