import FeaturesCard from '@/components/ui/features-card';
import React from 'react';
import Image from "next/image";

const features = [
  {
    title: "Pipeline Kanban",
    description: "Visual sales stages with stage-weighted value forecasting, lead scoring, and instant stage progression.",
    icon: <Image src="/features-icon/solutions.webp" alt="Pipeline Kanban" width={78} height={78} />,
    link: "/crm/leads",
  },
  {
    title: "Live Client Portal",
    description: "Dedicated workspace where stakeholders inspect sprint progress, verify deliverables, and access project updates.",
    icon: <Image src="/features-icon/client.webp" alt="Client Portal" width={78} height={78} />,
    link: "/portal",
  },
  {
    title: "Versioned Scopes",
    description: "Itemized proposals with immutable pricing versions, transparent milestones, and single-click client acceptance.",
    icon: <Image src="/features-icon/record.webp" alt="Versioned Scopes" width={78} height={78} />,
    link: "/crm/proposals",
  },
  {
    title: "Automated Workflows",
    description: "Event-driven messaging outbox, automated task reminders for client callbacks, and n8n webhook triggers.",
    icon: <Image src="/features-icon/communication.svg" alt="Automated Workflows" width={78} height={78} />,
    link: "/crm/automations",
  },
  {
    title: "Sprint Delivery Tracker",
    description: "Milestone-driven engineering sprints with real-time percentage completion and deliverable review gates.",
    icon: <Image src="/features-icon/support.svg" alt="Sprint Delivery Tracker" width={78} height={78} />,
    link: "/crm/projects",
  },
  {
    title: "Enterprise Isolation",
    description: "Strict agency data isolation, row-level database security, and audit-ready activity trails for all records.",
    icon: <Image src="/features-icon/expertise.svg" alt="Enterprise Isolation" width={78} height={78} />,
    link: "/crm",
  }
];

const FeaturesSection = () => {
  return (
    <section id="features" data-testid="features" role="region" className="backdrop-blur-2xl flex flex-col justify-center items-center pt-24 sm:pt-28 pb-12 lg:pb-20 scroll-mt-24 px-4 sm:px-8 w-full max-w-7xl mx-auto">
      <div className="text-center max-w-2xl mx-auto mb-12">
        <span className="text-xs font-bold uppercase tracking-wider text-primary">
          Core Capabilities
        </span>
        <h2 className="text-3xl sm:text-4xl font-bold mt-2 text-gray-900 dark:text-white">
          Engineered for High-Velocity Agencies
        </h2>
        <p className="text-sm text-gray-600 dark:text-gray-400 mt-3">
          Everything your agency needs to capture inbound inquiries, agree on transparent scopes, and execute with precision.
        </p>
      </div>

      <article className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-8 w-full items-stretch justify-items-center">
        {features.map((feature, index) => (
          <FeaturesCard key={index} title={feature.title} description={feature.description} icon={feature.icon} link={feature.link} />
        ))}
      </article>
    </section>
  );
};

export default FeaturesSection;
