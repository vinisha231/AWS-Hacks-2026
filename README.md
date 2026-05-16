# Benefits Navigator

Benefits Navigator is an AWS-powered platform that helps underserved individuals discover and apply for government assistance programs — including SNAP, Medicaid, LIHEAP, housing aid, WIC, and TANF — without needing to understand the bureaucracy behind them.

Instead of filling out complex forms, users have a natural-language conversation powered by Amazon Bedrock, where they simply describe their situation in their own words. The system extracts structured eligibility data automatically and surfaces every program they qualify for, ranked by dollar value, in a single unified view. All interactions are translated in real time across 75+ languages — including Haitian Creole, Vietnamese, Somali, and Arabic — via Amazon Translate, removing language as a barrier entirely. Once eligibility is confirmed, users can upload supporting documents (pay stubs, IDs, lease agreements) directly to Amazon S3, which are automatically linked to their applications in Amazon Aurora, so no one gets dropped at the form. Amazon SNS powers proactive renewal reminders and a full SMS fallback path for users with limited data or no smartphone.

---

## Features

### Auth & Account
- Sign up / log in via Amazon Cognito
- Persistent return sessions
- Delete account

### Profile
- Name, household size, state/location
- Income and employment details
- Number of dependents
- Preferred language (persists across sessions)

### Settings
- Notification preferences (SMS, email, or both)
- Language preference
- Privacy / data sharing settings

### Intake
- Conversational intake — type naturally, no forms required
- Free-text → structured eligibility data via Amazon Bedrock
- Real-time translation of all input/output via Amazon Translate (75+ languages)

### Eligibility
- Cross-program check: SNAP, Medicaid, CHIP, LIHEAP, WIC, TANF, Section 8
- Results ranked by estimated monthly dollar value
- Single unified view of everything you qualify for

### Application
- Auto-fills application fields from intake answers
- Document upload (pay stubs, ID, lease agreements) stored securely in Amazon S3
- Documents auto-linked to application in Aurora

### Tracking
- Application status tracker
- 30-day renewal reminders via Amazon SNS
- Full application history

### Accessibility
- Full SMS fallback — entire flow works over text message (no smartphone required)
- Low-bandwidth optimized frontend
- 75+ languages including underserved communities

---

## Architecture

| Service | Role |
|---|---|
| Amazon Bedrock | Conversational NLP intake — free text → structured data |
| Amazon Translate | Real-time multilingual support (75+ languages) |
| Amazon Aurora Serverless | Users, sessions, eligibility results, applications, documents |
| Amazon S3 | Encrypted document storage |
| Amazon SNS | Renewal reminders + SMS fallback intake |
| AWS Lambda | Intake, eligibility, and application logic |
| Amazon API Gateway | REST API routing |
| Amazon Cognito | Auth and session management |

---

## Project Structure

```
benefits-navigator/
├── intake/
│   └── handler.py          # Conversational intake Lambda
├── eligibility/
│   ├── thresholds.py       # 2025 federal income limits for all 7 programs
│   ├── programs.py         # Cross-program eligibility logic
│   └── handler.py          # Eligibility Lambda
├── application/
│   ├── autofill.py         # Maps intake data to form fields per program
│   ├── documents.py        # S3 upload and document management
│   └── handler.py          # Application Lambda (create, submit, upload, status)
├── db/
│   ├── schema.sql          # Aurora PostgreSQL schema
│   └── connection.py       # DB connection utility
├── utils/
│   ├── translate.py        # Amazon Translate helper
│   └── bedrock.py          # Amazon Bedrock helper
├── api/
│   └── routes.py           # API route definitions
└── template.yaml           # AWS SAM deployment template
```

---

## API Endpoints

| Method | Path | Description |
|---|---|---|
| POST | `/intake` | Submit free-text message, returns session_id + structured data |
| POST | `/eligibility` | Run cross-program eligibility check for a session |
| POST | `/application/create` | Create draft application with auto-filled form data |
| POST | `/application/submit` | Submit application, schedule renewal reminder |
| POST | `/application/upload` | Upload document to S3, link to application |
| GET | `/application/status` | Get application status + linked documents |

---

## Why We Built This

Millions of people miss out on benefits they qualify for because:
- Forms are complex and hard to understand
- Eligibility rules are unclear or vary by state
- Language barriers block access
- Existing tools stop at "you qualify" — they don't help you actually apply

Benefits Navigator closes that gap — from "do I qualify?" all the way to applied, tracked, and renewed.

---

## Competitors

| Tool | Gap |
|---|---|
| Benefits.gov | Official but notoriously hard to navigate |
| mRelief | SNAP only, rigid SMS scripts |
| Aunt Bertha / Findhelp.org | Directory only, no application help |
| GetYourBenefits.org | Eligibility only, no auto-fill or tracking |
| BenefitsCal | California only |
| Propel (Fresh EBT) | SNAP balance tracking, not a full navigator |

Benefits Navigator is the only tool that covers intake → eligibility → auto-fill → document upload → status tracking → renewal reminders in one flow, across all major programs, in 75+ languages.

---

## Setup

```bash
pip install -r requirements.txt
cp .env.example .env
# fill in Aurora, S3, SNS values

# Deploy with SAM
sam build
sam deploy --guided
```
