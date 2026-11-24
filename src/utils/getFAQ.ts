export interface FAQItem {
  id: string;
  question: string;
  answer: string;
  status: string;
  order?: number;
}



const DEFAULT_FAQS: FAQItem[] = [
  {
    id: "faq-1",
    question: "How does AgencyDesk handle fixed scope proposals?",
    answer: "Every proposal generated in AgencyDesk contains explicit deliverables, milestone dates, and fixed fees. Any out-of-scope requests require a versioned change order approved by both agency and client before work begins.",
    status: "published",
    order: 1,
  },
  {
    id: "faq-2",
    question: "Can clients track sprint velocity and deliverables directly?",
    answer: "Yes! Clients receive dedicated access to the Client Portal with real-time sprint burndown, review artifacts, task statuses, and milestone approval capabilities.",
    status: "published",
    order: 2,
  },
  {
    id: "faq-3",
    question: "How does the CRM pipeline prevent deal slippage?",
    answer: "Our pipeline uses weighted probability calculations based on deal stage, automated follow-up reminders, and activity history tracking inspired by Atomic CRM and LeadForge workflows.",
    status: "published",
    order: 3,
  },
  {
    id: "faq-4",
    question: "Is client and agency data securely isolated?",
    answer: "Absolutely. AgencyDesk employs strict data isolation and role-based permissions ensuring client confidentiality, private notes, and internal margins remain protected at all times.",
    status: "published",
    order: 4,
  },
  {
    id: "faq-5",
    question: "How do automated notifications work?",
    answer: "Our deterministic transactional outbox dispatcher guarantees that webhook events, lead status updates, and milestone notifications are delivered reliably without dropped payloads or duplicates.",
    status: "published",
    order: 5,
  },
];

export async function fetchFAQs(): Promise<FAQItem[]> { return DEFAULT_FAQS; }
