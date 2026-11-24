export interface ServiceItem {
  link: string;
  title: string;
  shortDesc?: string;
  icon?: string;
  tag?: string;
}

export const services: ServiceItem[] = [
  {
    link: "/services/web-and-mobile-development",
    title: "Web & Mobile Applications",
    shortDesc: "Bespoke web applications, client portals, and mobile-ready interfaces built with Next.js and TypeScript.",
    tag: "Core Engineering"
  },
  {
    link: "/services/devops-automation",
    title: "AI & Workflow Automations",
    shortDesc: "Intelligent lead scoring, automated CRM pipelines, n8n integrations, and transactional client outbox.",
    tag: "Automation"
  },
  {
    link: "/services/cloud-hosting",
    title: "Cloud & Supabase Architecture",
    shortDesc: "Enterprise database modeling, row-level security, serverless APIs, and resilient edge deployments.",
    tag: "Infrastructure"
  },
  {
    link: "/services/big-data-analytics",
    title: "Pipeline & Revenue Analytics",
    shortDesc: "Real-time CRM metric dashboards, lead attribution tracking, and deal conversion telemetry.",
    tag: "Intelligence"
  },
  {
    link: "/services/content-marketing",
    title: "Growth Systems & Technical SEO",
    shortDesc: "High-converting inbound funnels, SEO architecture, and agency brand authority engines.",
    tag: "Growth"
  },
  {
    link: "/services/research-development",
    title: "Custom CRM & Portal Solutions",
    shortDesc: "Tailored client workspaces, proposal acceptance engines, and custom API integrations.",
    tag: "Enterprise"
  },
];
