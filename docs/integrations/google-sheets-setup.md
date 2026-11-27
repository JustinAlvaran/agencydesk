# AgencyDesk CRM <-> Google Sheets Two-Way Integration Guide

This guide details the bidirectional synchronization architecture between Google Sheets (Google account: `kinggucci195@gmail.com`) and the AgencyDesk CRM Kanban board.

---

## 1. Architectural Overview

```
                      ┌────────────────────────────────────────┐
                      │          AgencyDesk Web App            │
                      │   (https://agencydesk-theta.vercel.app)│
                      └──────────────────┬─────────────────────┘
                                         │ 1. Public Inquiry / Staff Lead
                                         ▼
                      ┌────────────────────────────────────────┐
                      │          Supabase PostgreSQL           │
                      │          (`public.leads` table)        │
                      └──────────────────┬─────────────────────┘
                                         │ 2. Webhook Notification
                                         ▼
                      ┌────────────────────────────────────────┐
                      │            n8n Cloud Engine            │
                      │ (https://justinautomaton.app.n8n.cloud)│
                      └─────────┬────────────────────┬─────────┘
                                │                    │
         3a. Append/Upsert Row  │                    │ 3b. Dispatch Alert
                                ▼                    ▼
          ┌───────────────────────────┐    ┌───────────────────────────┐
          │       Google Sheets       │    │      WhatsApp Alert       │
          │ (kinggucci195@gmail.com)  │    │     (+639913780170)       │
          └─────────────┬─────────────┘    └───────────────────────────┘
                        │
                        │ 4. User edits row in Google Sheets
                        ▼
          ┌───────────────────────────┐
          │    Google Apps Script     │
          │   (onEdit / Menu Action)  │
          └─────────────┬─────────────┘
                        │
                        │ 5. POST /api/integrations/n8n/leads/upsert
                        ▼
          ┌───────────────────────────┐
          │   AgencyDesk CRM Kanban   │
          │     (/crm/leads?lead=id)  │
          └───────────────────────────┘
```

---

## 2. Bidirectional Data Flow & Loop Prevention

To prevent infinite loops between the CRM and Google Sheets:
- **Pipeline A (CRM -> Google Sheets)**:
  - When a lead is captured via the website inquiry form or manual staff creation, it is stored in Supabase.
  - n8n receives the webhook, appends the lead row into Google Sheets, and sets `Last Synced By: agencydesk_crm`.
- **Pipeline B (Google Sheets -> CRM Kanban)**:
  - When a sales rep or user edits a row directly in Google Sheets, the Apps Script trigger or inbound webhook runs.
  - The workflow checks `Last Synced By`. If the value is `agencydesk_crm`, execution halts immediately.
  - If edited by the user (`sheets_user`), the lead is upserted into AgencyDesk CRM via `/api/integrations/n8n/leads/upsert`.
  - The Kanban board updates dynamically, and the direct deep link (`https://agencydesk-theta.vercel.app/crm/leads?lead=<leadId>`) is written back to the sheet.

---

## 3. Google Sheet Schema Specifications

| Column # | Column Header | Type | Description |
|---|---|---|---|
| 1 | `Timestamp` | ISO 8601 | Time the inquiry was recorded |
| 2 | `Lead ID` | UUID | Unique lead identifier |
| 3 | `Contact Name` | Text | Prospect full name |
| 4 | `Email` | Email | Prospect primary contact email |
| 5 | `WhatsApp` | E.164 | Mobile number formatted (+63...) |
| 6 | `WhatsApp Opt-in` | YES / NO | Explicit consent flag |
| 7 | `Instagram` | Handle | @handle or profile URL |
| 8 | `Company` | Text | Client business organization |
| 9 | `Service` | Text | Requested service scope |
| 10 | `Budget` | Number | Proposed budget in USD |
| 11 | `Score` | Number (0-100) | Algorithmic qualification score |
| 12 | `Status` | Text | Stage (`new`, `contacted`, `qualified`, `proposal_sent`, `won`, `lost`) |
| 13 | `Source` | Text | Intake channel (`website`, `google_sheets`, `staff`) |
| 14 | `Brief` | Text | Prospect project requirements |
| 15 | `Notes` | Text | Internal review notes and call logs |
| 16 | `Website CRM Link` | URL | Deep-link directly opening the lead drawer |
| 17 | `Sync Hash` | String | Idempotency hash |
| 18 | `Last Synced By` | Text | Origin tag (`agencydesk_crm` or `sheets_user`) |

---

## 4. Setup in Google Sheets (`kinggucci195@gmail.com`)

1. Open [Google Sheets](https://docs.google.com/spreadsheets).
2. Create a new spreadsheet named **`AgencyDesk_Leads_Master`**.
3. Name the first sheet tab **`Leads_Master`**.
4. Click **Extensions > Apps Script**.
5. Copy and paste the script from `docs/integrations/google-sheets-sync.js` into `Code.gs`.
6. Click **Project Settings (Gear icon) > Script Properties**, then add:
   - `N8N_SYNC_WEBHOOK`: `https://justinautomaton.app.n8n.cloud/webhook/agencydesk-sheets-sync`
   - `AGENCYDESK_API_URL`: `https://agencydesk-theta.vercel.app/api/integrations/n8n/leads/upsert`
   - `AUTOMATION_SECRET`: *(Your configured secret)*
7. Click **Triggers (Clock icon) > Add Trigger**:
   - Choose function to run: `onSheetEdit`
   - Select event type: `On edit`
8. Return to your Google Sheet and reload. You will see the **🚀 AgencyDesk CRM** menu at the top. Click **Initialize Master Headers** to populate all columns with proper styling.
