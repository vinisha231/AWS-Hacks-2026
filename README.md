# Compass — Benefits Navigator

> **AWS Hacks 2026**

Compass is an AWS-powered platform that helps underserved individuals discover and apply for government assistance programs — including SNAP, Medicaid, LIHEAP, Section 8, WIC, CHIP, EITC, Head Start, and more — without needing to understand the bureaucracy behind them.

Instead of filling out complex forms, users answer a short conversational intake. Compass checks 10+ programs at once, ranks results by estimated annual dollar value, and guides users all the way through to applied, tracked, and renewed.

---

## Features

### Benefits Discovery
- Cross-program eligibility check (SNAP, Medicaid, CHIP, WIC, LIHEAP, Section 8, EITC, Head Start, Free School Meals, SSI)
- Results ranked by estimated annual value
- Real 2024 Federal Poverty Level thresholds
- "Why you qualify" explanation per program

### Conversational Intake
- 6-step guided questionnaire (state, household size, income, situation, current benefits)
- No forms, no jargon — plain language throughout
- Free-text → structured eligibility data (Bedrock-ready)

### Application Assistance
- Pre-filled form fields from intake answers
- Document checklist per program (know what to gather before you start)
- Direct links to official applications
- One-click status tracking

### Application Tracker
- Track status: Not started → In progress → Applied → Approved
- Renewal date countdowns with 30-day alerts
- Full application history

### Auth & Account (Amazon Cognito)
- Sign up / sign in with persistent 7-day sessions
- Delete account
- Cognito-ready — swap `src/services/auth.js` for Amplify when User Pool is configured

### Profile
- Name, state/location, household size, number of dependents
- Income details, employment status
- Preferred language (persists across sessions)

### Settings
- Email notification preferences (renewal reminders via Amazon SNS)
- SMS notification preferences (Amazon SNS)
- Language preference
- Privacy / data sharing settings
- Change password, delete account

### Multilingual
- Full English + Spanish support
- Instant language switching — no page reload
- Vietnamese, Haitian Creole, Arabic, Somali scaffolded (Amazon Translate-ready)

---

## Tech Stack

| Layer | Service |
|---|---|
| Frontend | React + Vite, Tailwind CSS, Zustand |
| Auth | Amazon Cognito |
| AI Intake | Amazon Bedrock (Claude) |
| Translation | Amazon Translate |
| Notifications | Amazon SNS (email + SMS renewals) |
| Document Storage | Amazon S3 |
| Database | Amazon Aurora Serverless (PostgreSQL) |
| API | AWS API Gateway + Lambda |
| Deployment | AWS Amplify / Vercel |

---

## Running Locally

```bash
npm install
npm run dev
```

Copy `.env.example` to `.env.local` and fill in your AWS credentials:

```bash
cp .env.example .env.local
```

### Environment Variables

```
VITE_API_KEY=your_api_gateway_key
VITE_AWS_REGION=us-east-1
VITE_COGNITO_USER_POOL_ID=us-east-1_XXXXXXXXX
VITE_COGNITO_CLIENT_ID=XXXXXXXXXXXXXXXXXXXXXXXXXX
```

---

## Architecture

```
User Browser
    │
    └── React Frontend (Vite + Tailwind)
          ├── Zustand store (persisted locally)
          ├── Amazon Cognito — auth sessions
          │
          └── AWS API Gateway (x-api-key auth)
                ├── /translate   → Amazon Translate (75+ languages)
                ├── /eligibility → Lambda + Aurora (eligibility logic)
                ├── /notify      → Amazon SNS (renewal reminders)
                └── /documents   → Amazon S3 (document upload)
```

---

## Team

Built at AWS Hacks 2026.
