import React from 'react';
import BenefitsCard from '@/components/ui/benefits-card';
import Image from 'next/image';

const benefits = [
  {
    title: "Fixed-Price Guarantee",
    description: "Every dollar and deliverable is agreed upon in versioned proposals before work begins. Zero surprise invoices.",
    icon: <Image className="w-[clamp(3.75rem,6vw,4rem)] h-[clamp(3.75rem,6vw,4rem)] object-contain" src="/benefits-icons/salary.svg" alt="fixed price" width={60} height={60}/>
  },
  {
    title: "Live Milestone Telemetry",
    description: "Access your dedicated client portal 24/7 to inspect sprint progress, verify deliverables, and review roadmap milestones.",
    icon: <Image className="w-[clamp(3.75rem,6vw,4rem)] h-[clamp(3.75rem,6vw,4rem)] object-contain" src="/benefits-icons/performance-bonus.svg" alt="live telemetry" width={60} height={60}/>
  },
  {
    title: "Senior Engineering Pods",
    description: "Work directly with seasoned software engineers, AI specialists, and UI/UX designers. No junior runarounds.",
    icon: <Image className="w-[clamp(3.75rem,6vw,4rem)] h-[clamp(3.75rem,6vw,4rem)] object-contain" src="/benefits-icons/learning.svg" alt="senior engineering" width={60} height={60}/>
  },
  {
    title: "Rapid MVP Velocity",
    description: "Sprint 1 functional deliverable ready within 14 business days. Fast iterations built on modern Next.js foundations.",
    icon: <Image className="w-[clamp(3.75rem,6vw,4rem)] h-[clamp(3.75rem,6vw,4rem)] object-contain" src="/benefits-icons/flexible-hours.svg" alt="rapid velocity" width={60} height={60}/>
  },
  {
    title: "100% Code Ownership",
    description: "Complete intellectual property and source code rights transferred upon milestone signoff. Zero proprietary lock-in.",
    icon: <Image className="w-[clamp(3.75rem,6vw,4rem)] h-[clamp(3.75rem,6vw,4rem)] object-contain" src="/benefits-icons/remote.svg" alt="code ownership" width={60} height={60}/>
  },
  {
    title: "Enterprise Isolation",
    description: "Multi-tenant database boundaries, Supabase row-level security, and encrypted client data isolation.",
    icon: <Image className="w-[clamp(3.75rem,6vw,4rem)] h-[clamp(3.75rem,6vw,4rem)] object-contain" src="/benefits-icons/healthwellness.svg" alt="enterprise isolation" width={60} height={60}/>
  },
];

const BenefitsSection = () => {
  return (
    <section 
      id="benefits" 
      data-testid="benefits" 
      className="backdrop-blur-2xl flex flex-col gap-6 justify-center items-center py-16 px-4 sm:px-8 w-full max-w-7xl mx-auto"
    >
      <div className="text-center max-w-2xl mx-auto mb-4">
        <span className="text-xs font-bold uppercase tracking-wider text-primary">
          The AgencyDesk Difference
        </span>
        <h3 className="text-3xl sm:text-4xl font-bold text-gray-900 dark:text-white mt-2 leading-tight">
          Why Partner With AgencyDesk?
        </h3>
        <p className="text-sm text-gray-600 dark:text-gray-300 mt-3 font-lato leading-relaxed">
          Predictable delivery, radical clarity, and technical excellence engineered for ambitious founders and enterprises.
        </p>
      </div>
      
      <ul className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-8 w-full mt-6 justify-items-center">
        {benefits.map((benefit, index) => (
          <li key={index} className="w-full flex justify-center">
            <BenefitsCard {...benefit} />
          </li>
        ))}
      </ul>
    </section>
  );
};

export default BenefitsSection;
