# FinGuard AI — Financial Fraud Detection and Risk Intelligence Platform

FinGuard AI is an institutional-grade, full-stack financial fraud detection, transaction risk intelligence, and anti-money laundering (AML) compliance platform. It monitors financial transactions in real time, applies a deterministic 8-rule explainable heuristic fraud scoring engine (0–100), creates automated high-severity alerts, coordinates multi-analyst case investigations, and provides compliance officers with downloadable audit reports.

## Key Features

1. **Deterministic Rule-Based Fraud Detection Engine**
   - 8 transparent, configurable heuristic rules:
     - High-Value Outlier (Threshold & baseline spike)
     - High-Frequency Velocity Spike (3+ txns in 15m)
     - Impossible Geolocation Travel Speed (cross-country < 3h)
     - Pre-Transaction Authentication Failures
     - High-Risk Merchant Category (Crypto OTC, offshore casinos, gift cards)
     - High-Value Transfer Post-Credential Reset
     - Currency Structuring / Smurfing ($9,000–$9,999)
     - Anonymizing Device Anomaly (VPN + new hardware fingerprint)
   - Additive weighted scoring capped at 100 with clear risk bands: Low (0–24), Medium (25–49), High (50–74), Critical (75–100).
   - Server-side Gemini AI integration (`gemini-3.8-flash`) for automated crime analysis and investigator brief generation (with automatic rule-summary fallback when offline).

2. **Real-Time Transaction Monitoring & Simulator**
   - Live transaction ingestion with automatic risk classification.
   - Built-in Attack Simulator allowing 1-click execution of attack scenarios (Account Takeover, Velocity Burst, Smurfing, Impossible Travel, Benign Daily Spend).
   - CSV Batch Import with validation, column mapping, and duplicate detection.
   - Sanitized CSV Export preventing formula injection attacks (`=`, `+`, `-`, `@`).

3. **Fraud Alert Management Queue**
   - Tabbed status queues (`new`, `acknowledged`, `under_investigation`, `escalated`, `resolved`, `dismissed`).
   - Analyst assignment, investigator notes thread, and 1-click escalation into full investigation cases.

4. **Investigation Case Workspace**
   - Multi-stage case dossiers (`open`, `in_progress`, `escalated`, `closed`).
   - Evidence repository (IP forensic lookups, sworn customer affidavits, dispute ARNs, device telemetry).
   - Chronological action timeline and investigator notes.
   - Formal human disposition recording (`confirmed_fraud`, `legitimate_activity`, `inconclusive`).

5. **Analytics & Risk Intelligence**
   - 7-day sliding transaction & anomaly area charts.
   - Risk severity distribution breakdown.
   - Top triggered heuristic rules ranking.
   - Merchant category risk matrix and cross-border geographic hotspots.

6. **AML Compliance & Audit Trail**
   - On-demand compliance report generator (AML/BSA SAR readiness).
   - Printable dossier view with loss prevention metrics.
   - Append-only immutable system & analyst audit trail recording actor, action, target entity, IP, and timestamp.

7. **Configurable Settings & RBAC**
   - Heuristic rule weight adjustments and enable/disable toggles.
   - Score band threshold tuning.
   - Role-based access control with server-side enforcement across Admin, Fraud Analyst, and Compliance Officer.

## Demo Credentials

The platform is pre-seeded with three demo accounts for testing role-based access:

| Role | Email | Password | Permissions |
| :--- | :--- | :--- | :--- |
| **Fraud Analyst** | `analyst@finguard.ai` | `Password123!` | Monitor transactions, triage alerts, manage cases |
| **Compliance Officer** | `compliance@finguard.ai` | `Password123!` | Review cases, generate AML reports, view audit trail |
| **System Admin** | `admin@finguard.ai` | `Password123!` | Calibrate heuristic weights, manage users, reset data |

*Note: 1-click quick-role switching buttons are also available in the sidebar and on the login page for rapid evaluation.*

## Tech Stack

- **Frontend**: React 19, TypeScript, Tailwind CSS, Lucide React, Recharts.
- **Backend**: Node.js, Express.js.
- **Database**:
  - Embedded Persistent File Database Engine (`./data/finguard_db.json`) ensuring 100% out-of-the-box functionality, state persistence across restarts, and atomic writes.
  - Dual-mode architecture ready for external MongoDB URI (`MONGODB_URI`).
- **Authentication**: JWT-based session tokens with `bcryptjs` password hashing.
- **AI Engine**: Google Gemini API (`@google/genai`, model `gemini-3.8-flash`) executed strictly on the server.

## Quickstart & Installation

### Prerequisites
- Node.js >= 20.x
- npm >= 10.x

### 1. Install Dependencies
```bash
npm install
```

### 2. Environment Configuration
Copy `.env.example` to `.env`:
```bash
cp .env.example .env
```

Key environment variables:
```env
PORT=3000
JWT_SECRET="finguard-secret-key-change-in-production"
# Optional Gemini AI key for AI-generated investigator briefs:
GEMINI_API_KEY="YOUR_API_KEY"
```

### 3. Run the Automated Test Suite
Verify that all fraud scoring heuristics, velocity counters, and capping rules pass:
```bash
npm test
```

### 4. Start the Application
```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

## REST API Reference

### Authentication
- `POST /api/auth/login` — Log in with email and password
- `POST /api/auth/register` — Register a new account
- `POST /api/auth/demo-login` — 1-click demo sign-in (`{ "role": "analyst" }`)
- `GET /api/auth/me` — Retrieve current authenticated session

### Transactions
- `GET /api/transactions` — Query paginated transactions with search and filters
- `GET /api/transactions/:id` — Get transaction details and linked records
- `POST /api/transactions` — Submit a transaction for real-time scoring
- `POST /api/transactions/analyze` — Dry-run evaluation without persisting
- `POST /api/transactions/simulate` — Trigger attack simulation scenario
- `POST /api/transactions/import` — Bulk import transactions from CSV/JSON
- `GET /api/transactions/export` — Download sanitized CSV ledger
- `POST /api/transactions/:id/ai-explain` — Generate Gemini AI crime intelligence brief

### Alerts & Investigations
- `GET /api/alerts` — List and filter active alerts
- `PATCH /api/alerts/:id/status` — Update alert triage status
- `PATCH /api/alerts/:id/assign` — Assign alert to an investigator
- `POST /api/alerts/:id/create-case` — Escalate alert to an investigation case
- `GET /api/cases` — List active investigation dossiers
- `POST /api/cases` — Open a new case
- `POST /api/cases/:id/evidence` — Attach forensic artifacts
- `PATCH /api/cases/:id/disposition` — Record final human review disposition

### Analytics & Compliance
- `GET /api/dashboard/summary` — Aggregate real-time KPIs
- `GET /api/dashboard/trends` — Fetch time-series volume and risk distribution
- `GET /api/analytics/overview` — Top heuristics, category risk, and geographic hotspots
- `POST /api/reports/generate` — Generate formal AML compliance report
- `GET /api/audit-events` — Query immutable audit log

## Verification & Testing
Unit tests for the fraud engine can be executed anytime with:
```bash
npm test
```
The test suite covers:
1. Normal transaction baseline (0 risk)
2. High-value outlier detection
3. Rapid velocity spikes (multiple txns in 15m)
4. Impossible geolocation travel speed
5. Structuring / Smurfing pattern detection
6. Compound multi-vector attack scoring capped at 100
7. Automatic alert triggering thresholds
   
## Pitch Deck

[📄 View FinGuard AI Pitch Deck (PDF)](./FinGuard_AI_ExaThon_2026_9Slides.pdf)

## Demo Video

[▶️ Watch FinGuard AI – Project Demo](https://youtu.be/dgavThNaLi8)
