# Rta — Benefits Navigator

> **AWS Hacks 2026**

Rta is an AWS-powered platform that helps underserved individuals discover and apply for government assistance programs — including SNAP, Medicaid, LIHEAP, Section 8, WIC, CHIP, EITC, Head Start, and more — without needing to understand the bureaucracy behind them.

Instead of filling out complex forms, users answer a short conversational intake. Rta checks 10+ programs at once, ranks results by estimated annual dollar value, and guides users all the way through to applied, tracked, and renewed. All interactions are translated in real time across 75+ languages via Amazon Translate.

---

## Features

### Benefits Discovery
- Cross-program eligibility check (SNAP, Medicaid, CHIP, WIC, LIHEAP, Section 8, EITC, Head Start, Free School Meals, SSI)
- Results ranked by estimated annual value
- Real 2025 Federal Poverty Level thresholds
- "Why you qualify" explanation per program

### Conversational Intake
- 9-step guided questionnaire (state, household size, income, situation, current benefits)
- No forms, no jargon — plain language throughout
- Free-text → structured eligibility data via Amazon Bedrock

### Application Assistance
- Pre-filled form fields from intake answers
- Document checklist per program
- Document upload (pay stubs, ID, lease agreements) stored securely in Amazon S3
- Direct links to official applications

### Application Tracker
- Track status: Not started → In progress → Applied → Approved
- Renewal date countdowns with 30-day alerts via Amazon SNS
- Full application history

### Auth & Account (Amazon Cognito)
- Sign up / sign in with persistent sessions
- Delete account

### Profile
- Name, state/location, household size, number of dependents
- Income details, employment status
- Preferred language (persists across sessions)

### Settings
- Email and SMS notification preferences (Amazon SNS)
- Language preference
- Privacy / data sharing settings

### Multilingual
- Full English + Spanish support
- Instant language switching — no page reload
- Vietnamese, Haitian Creole, Arabic, Somali scaffolded (Amazon Translate-ready)
- SMS fallback — full flow works over text message (no smartphone required)

---

## Tech Stack

| Layer | Service |
|---|---|
| Frontend | React + Vite, Tailwind CSS, Zustand |
| Auth | Amazon Cognito |
| AI Intake | Amazon Bedrock |
| Translation | Amazon Translate (75+ languages) |
| Notifications | Amazon SNS (email + SMS renewals) |
| Document Storage | Amazon S3 |
| Database | Amazon Aurora Serverless (PostgreSQL) |
| API | AWS API Gateway + Lambda |

---

## Architecture

```
User Browser
    │
    └── React Frontend (Vite + Tailwind)
          ├── Zustand store (persisted locally)
          ├── Amazon Cognito — auth sessions
          │
          └── AWS API Gateway
                ├── /intake      → Lambda + Bedrock (NLP intake)
                ├── /eligibility → Lambda + Aurora (eligibility logic)
                ├── /translate   → Amazon Translate (75+ languages)
                ├── /application → Lambda + S3 + Aurora (apply, upload, track)
                └── /notify      → Amazon SNS (renewal reminders)
```

---

## Project Structure

```
Rta/
├── src/                        # React frontend
│   ├── pages/                  # Intake, Results, Apply, Tracker, Auth, Profile, Settings
│   ├── components/             # Layout, LanguagePicker
│   ├── contexts/               # AuthContext
│   ├── store/                  # Zustand store
│   ├── services/               # auth.js (Cognito-ready)
│   ├── i18n/                   # translations.js (EN + ES)
│   └── data/                   # programs.js (eligibility data)
├── intake/
│   └── handler.py              # Conversational intake Lambda
├── eligibility/
│   ├── thresholds.py           # 2025 federal income limits for all 7 programs
│   ├── programs.py             # Cross-program eligibility logic
│   └── handler.py              # Eligibility Lambda
├── application/
│   ├── autofill.py             # Maps intake data to form fields per program
│   ├── documents.py            # S3 upload and document management
│   └── handler.py              # Application Lambda (create, submit, upload, status)
├── db/
│   ├── schema.sql              # Aurora PostgreSQL schema
│   ├── connection.py           # DB connection utility
│   └── seed.sql                # Demo seed data
├── utils/
│   ├── translate.py            # Amazon Translate helper
│   ├── bedrock.py              # Amazon Bedrock helper
│   └── response.py             # Shared HTTP response helpers
├── api/
│   └── routes.py               # API route definitions
└── template.yaml               # AWS SAM deployment template
```

---

## Running Locally

**Frontend:**
```bash
npm install
npm run dev
```

**Backend (Lambda):**
```bash
pip install -r requirements.txt
cp .env.example .env
sam build && sam deploy --guided
```

---

## Competitors

| Tool | Gap |
|---|---|
| Benefits.gov | Official but hard to navigate |
| mRelief | SNAP only, no application help |
| Aunt Bertha / Findhelp.org | Directory only, no eligibility or auto-fill |
| GetYourBenefits.org | Eligibility only, no tracking |
| BenefitsCal | California only |
| Propel (Fresh EBT) | SNAP balance tracking, not a full navigator |

Rta is the only tool that covers intake → eligibility → auto-fill → document upload → status tracking → renewal reminders in one flow, across 10+ programs, in 75+ languages.
