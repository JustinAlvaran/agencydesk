# AgencyDesk

Modern Agency CRM & Client Workspace built with Next.js 15, React 19, TypeScript, and Tailwind CSS. Connects inbound client inquiries to visual Kanban sales pipelines, versioned proposals, project deliverable tracking, and an automated integration hub.

## Features

- **Public Agency Experience:** Modern dark-mode glassmorphism theme, crimson accent palette (`#EB2428`), responsive typography, and infinite 24-partner logo marquee.
- **Inbound Lead Intake (`/inquire`):** Zod-validated multi-step inquiry intake with instant outbox event emission and automated opportunity scoring.
- **Sales Pipeline Kanban (`/crm/leads`):** Drag-and-drop opportunity cards with weighted win probabilities across stages (`new` → `contacted` → `qualified` → `proposal_sent` → `won`).
- **Staff Admin Gateway (`/crm-admin`):** 1-click administrative entry with Google SSO, GitHub SSO, and session management.
- **Client Workspace & Proposals (`/crm/proposals`, `/portal`):** Versioned proposals, itemized deliverables, transparent review milestones, and client acceptance flows.
- **Automations Hub (`/crm/automations`):** Connectors and webhook handlers for 15 platforms including n8n, Apollo, HubSpot, GoHighLevel, and Slack.
- **Dual-Mode Persistence:** Fully functional local memory/disk store for rapid local development, with automatic zero-config fallback to Supabase PostgreSQL when cloud credentials are provided.

## Getting Started

### Prerequisites

- Node.js >= 18.18.0
- npm >= 9

### Installation & Run

```bash
# Install dependencies
npm install

# Run development server (exclusively port 3000)
npm run dev

# Run full test suite
npm test

# Build for production
npm run build

# Start production server
npm start
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

## Testing

AgencyDesk includes a comprehensive test suite across component, integration, and backend logic:

```bash
npm test
```

## Security & Privacy

- All private API keys, service role secrets, and database credentials remain strictly within `.env.local` (ignored by Git).
- Strict agency boundary isolation and row-level access control.
- Free-only architecture with zero paid Gateway requirements.
