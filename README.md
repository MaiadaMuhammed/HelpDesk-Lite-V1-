# HelpDesk Lite (V1 MVP) • HDL-06

> A lightweight internal support ticketing system featuring a strict 5-state finite state machine lifecycle engine, single-agent ownership, automated outbound notification logging with acknowledgment tracking, append-only audit trails, and role-based permissions.

---

## Overview

HelpDesk Lite is built for internal IT and customer support operations. The application guarantees deterministic state transitions, prevents race conditions with single-agent ownership, maintains an immutable audit log of every action, and provides complete stakeholder transparency with simulated email dispatching and agent acknowledgment workflows.

---

## Key Features

### 1. 5-State Finite State Machine (`HDL-06`)
- **Strict State Flow**: Tickets strictly advance through:
  $$\text{NEW} \longrightarrow \text{ASSIGNED} \longrightarrow \text{IN\_PROGRESS} \longrightarrow \text{RESOLVED} \longrightarrow \text{CLOSED (Terminal)}$$
- **Reopen & Unassign Support**: Reopen resolved tickets back to `IN_PROGRESS` or unassign back to the triage pool (`ASSIGNED` $\rightarrow$ `NEW`).
- **Terminal State Lock**: `CLOSED` is an immutable terminal state. Any further mutation or reassignment is strictly prevented.
- **Single-Agent Ownership**: Guarantees that only one assigned agent owns an active ticket at any given time, avoiding concurrent collision.

### 2. Role-Based Access Control (RBAC)
- **Role Switcher**: Switch between active user personas on the fly to simulate and verify permissions:
  - **Requester** (`Sarah Jenkins`): Submit tickets, add discussion messages, verify solutions, and approve closure or request reopens.
  - **Support Agents** (`Alex Rivera`, `Marcus Vance`): Claim tickets from pool, transition states, resolve issues, and acknowledge status change alerts.
  - **Manager** (`Elena Rostova`): Oversee triage queue, view team SLA/MTTR metrics, force-reassign tickets, and override state transitions.

### 3. Outbound Notification Dispatcher & Agent Acknowledgment
- **Automated Transparency Dispatches**: Automatically generates and dispatches simulated email notifications on key lifecycle events:
  - Ticket Creation
  - Ticket Assignment / Reassignment
  - State Transitions (`STATUS_CHANGED`)
  - New Discussion Messages
- **"Mark as Read" / Acknowledgment Workflow**:
  - Support agents can track which status change alerts they have reviewed.
  - One-click **Acknowledge** and **Acknowledge All Status Alerts** actions.
  - Ambient unread alert badges in the ticket queue and navigation tabs.
- **Simulated Email Inspector**:
  - Full MIME header inspection (`Message-ID`, `DKIM`, `SPF`, `X-Priority`, `X-HelpDesk-Status`).
  - Rendered HTML client preview, raw plain-text payload, and SMTP relay envelope verification (250 OK).

### 4. Append-Only Audit Logging & Activity Thread
- Every state transition, assignment change, and message automatically logs an immutable audit entry with actor identity, timestamp, previous state, new state, and reason.
- Activity thread supports rich message history, requester vs. agent formatting, and multi-file attachments (VPN logs, SAML dumps, error screenshots, PDFs).

### 5. Manager Metrics & SLA Tracking
- Real-time calculations for:
  - SLA Target countdown & overdue detection.
  - Mean Time to Resolution (MTTR).
  - Open vs. Resolved ticket breakdown.
  - Priority and category distribution.

### 6. CSV Data Export
- Comprehensive data export modal supporting:
  - Ticket metadata and status history.
  - Conversation activity thread messages.
  - State machine audit log entries.
  - Outbound notification dispatch logs.

### 7. Interactive HDL-06 Verification Test Suite
- Built-in verification runner testing the core state machine against 14 automated unit and boundary tests:
  - Valid forward progressions.
  - Invalid state skips (e.g., `NEW` $\rightarrow$ `RESOLVED`).
  - Unauthorized role transitions.
  - Missing assignee guard validations.
  - Terminal lock enforcement on `CLOSED` tickets.

---

## State Transition Matrix

| Current State | Target State | Permitted Roles | Invariants & Preconditions | Post-Conditions |
| :--- | :--- | :--- | :--- | :--- |
| `NEW` | `ASSIGNED` | `AGENT`, `MANAGER` | `assignedToId` must be specified or claimed. | Assignee set, audit entry logged. |
| `ASSIGNED` | `IN_PROGRESS` | `AGENT`, `MANAGER` | Must have active assigned agent. | Status moves to `IN_PROGRESS`. |
| `ASSIGNED` | `NEW` | `AGENT`, `MANAGER` | Ticket unassigned back to triage pool. | `assignedToId` reset to `null`. |
| `IN_PROGRESS` | `RESOLVED` | `AGENT`, `MANAGER` | Resolution summary provided. | `resolvedAt` timestamp recorded. |
| `IN_PROGRESS` | `ASSIGNED` | `AGENT`, `MANAGER` | Work temporarily paused. | Reverts to `ASSIGNED`. |
| `RESOLVED` | `CLOSED` | `REQUESTER`, `MANAGER` | Solution confirmed satisfactory. | `closedAt` recorded; terminal lock engaged. |
| `RESOLVED` | `IN_PROGRESS` | `REQUESTER`, `MANAGER`, `AGENT` | Defect persists (reopen). | `resolvedAt` cleared; status set to `IN_PROGRESS`. |
| `CLOSED` | *None* | *None* | Terminal state. | Transitions strictly forbidden. |

---

## Project Structure

```
├── docs/
│   └── HDL-06-LIFECYCLE-ENGINE.md   # Architectural spec & sequence diagrams
├── src/
│   ├── components/
│   │   ├── ActivityThread.tsx       # Conversation timeline & message composer
│   │   ├── AuditTrailView.tsx       # State machine audit history viewer
│   │   ├── ExportCSVModal.tsx       # CSV export configuration dialog
│   │   ├── LifecycleStepper.tsx     # Visual lifecycle progress bar & transitions
│   │   ├── ManagerMetrics.tsx       # Team SLA, MTTR & distribution analytics
│   │   ├── NotificationHistoryView.tsx # Transparency log & email inspector
│   │   ├── TestRunnerView.tsx       # Automated HDL-06 test suite execution UI
│   │   ├── TicketAttachmentList.tsx # Attachment previews and downloads
│   │   └── TicketSubmissionModal.tsx# New ticket submission modal
│   ├── engine/
│   │   ├── stateMachine.ts          # Pure FSM transition engine & domain errors
│   │   └── stateMachine.test.ts     # 14-test verification suite & mock datasets
│   ├── hooks/
│   │   └── useTicketLifecycle.ts    # React hook for ticket transition state
│   ├── services/
│   │   ├── csvExportService.ts      # CSV formatting and file download helpers
│   │   ├── notificationService.ts   # Outbound notification dispatch & read tracking
│   │   └── pollingService.ts        # Background message simulation
│   ├── types/
│   │   └── ticket.ts                # TypeScript interfaces, enums, & types
│   ├── utils/
│   │   └── sampleAttachmentData.ts  # Embedded sample attachments (logs, screenshots)
│   ├── App.tsx                      # Root application layout & state coordinator
│   ├── main.tsx                     # React entry point
│   └── index.css                    # Tailwind CSS imports
├── index.html                       # HTML entry point
├── metadata.json                    # Application metadata
├── package.json                     # Dependencies and scripts
└── vite.config.ts                   # Vite configuration
```

---

## Getting Started

### Prerequisites
- **Node.js**: v18.0.0 or higher
- **npm** or **bun**

### Installation

1. Clone the repository or open the project workspace:
   ```bash
   cd helpdesk-lite
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

### Running in Development

Start the local Vite development server:

```bash
npm run dev
```

The application will be accessible at `http://localhost:3000`.

### Building for Production

Compile the production bundle:

```bash
npm run build
```

The optimized static assets will be generated in the `dist/` directory.

### Code Quality & Typechecking

Run TypeScript typecheck and linting:

```bash
npm run lint
```

---

## Technology Stack

- **Framework**: [React 19](https://react.dev/) + [Vite](https://vitejs.dev/)
- **Language**: [TypeScript](https://www.typescriptlang.org/) (Strict mode)
- **Styling**: [Tailwind CSS v4](https://tailwindcss.com/)
- **Icons**: [Lucide React](https://lucide.dev/)
- **Animation**: [Motion](https://motion.dev/)

---

## License

Private / Internal Project. All rights reserved.
