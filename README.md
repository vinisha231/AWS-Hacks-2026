# Rta — AI Benefits Navigator 🏆 2nd place AWS HACKS 2026 Serverless with Lambda
https://main.d5yz7gwlym2o0.amplifyapp.com

> **AWS Hacks 2026** · Built entirely on AWS

Rta helps underserved individuals discover and apply for government assistance programs — SNAP, Medicaid, LIHEAP, Section 8, WIC, CHIP, EITC, Head Start, and more — without needing to understand the bureaucracy behind them.

Users answer a short conversational intake. Rta checks 10+ programs simultaneously, ranks results by estimated annual dollar value, and guides users from discovery all the way through to applied, tracked, and renewed. Every part of the experience is available in 18+ languages, including Tamil, Arabic, Hindi, and Chinese, powered by Amazon Translate and Amazon Bedrock.

---

## Architecture Diagram

<img width="2689" height="737" alt="Rta Architecture" src="https://github.com/user-attachments/assets/5a41334c-bee6-461a-b492-0f7b51d33051" />

---

## Features

### Benefits Discovery
- Cross-program eligibility check across 10+ programs (SNAP, Medicaid, CHIP, WIC, LIHEAP, Section 8, EITC, Head Start, Free School Meals, SSI)
- Results ranked by estimated annual dollar value
- Real 2025 Federal Poverty Level thresholds baked into eligibility logic
- "Why you qualify / why you don't" explanation per program
- Pros, cons, and estimated time-to-benefit per result

### Conversational Intake
- 9-step guided questionnaire — state, household size, income, employment, dependents, current benefits, special circumstances
- No forms, no jargon — plain language throughout
- Structured eligibility data extracted by Amazon Bedrock

### AI Advocate (powered by Amazon Bedrock + Polly)
- **Generate Advocacy Letter** — Claude writes a personalized letter in the user's language (PDF + DOCX download)
- **Documents Checklist** — program-specific list of documents needed to apply
- **Explain Denial Reasons** — common reasons for denial and how to appeal
- **Practice with Mock Officer** — Claude role-plays as a government caseworker; responses spoken aloud via Amazon Polly in 13 languages

### Multilingual AI Chatbots
- **Floating assistant** — answers general benefits questions in the selected language
- **Program chatbot** — deep Q&A on a specific program (eligibility, timeline, documents)
- Both chatbots respond natively in the user's language via Bedrock; Amazon Translate used as fallback
- Mic input via Web Speech API — speak your question, get an answer, entirely in your language

### Full UI Translation (75+ Languages)
English, Spanish, French, German, Hindi, Arabic, Chinese (Simplified), Tamil, Telugu, Bengali, Vietnamese, Turkish, Polish, Ukrainian, Swahili, Korean, Japanese, Portuguese, and many more 

All UI strings batch-translated via Amazon Translate on first language switch; results cached in localStorage. Pros/cons and chatbot replies translate dynamically.

### Application Assistance
- Pre-filled form fields from intake answers
- Document checklist per program
- Direct links to official government applications

### Application Tracker
- Track status: Not Started → In Progress → Applied → Approved
- Renewal date countdowns with 30-day alerts via Amazon SNS
- Full application history

### Auth & Profile (Amazon Cognito)
- Sign up / sign in with persistent sessions
- Name, state, household size, income, language preference — all persisted
- Email and SMS notification preferences

---

## AWS Services

| Service | Feature |
|---|---|
| **Amazon Bedrock** (`claude-sonnet-4-6`) | AI chatbots, advocacy letter generation, mock officer roleplay, NLP intake |
| **AWS Lambda** (Python 3.12) | All backend logic — 6 functions: chat, advocate, eligibility, translate, polly, session |
| **API Gateway** (REST) | Single HTTPS entry point with API key auth and CORS |
| **Amazon Translate** | Full UI translation + dynamic chatbot/pros-cons translation across 18 languages |
| **Amazon Polly** | Text-to-speech for mock officer roleplay in 75+ languages (Neural TTS) |
| **Aurora Serverless v2** (PostgreSQL) | User session and answer persistence via RDS Data API |
| **Amazon SNS** | Renewal reminder notifications (email + SMS) |
| **Amazon S3** | Polly audio storage with presigned URL delivery |
| **AWS Amplify** | Frontend hosting + CI/CD from GitHub (auto-deploy on push) |
| **Amazon CloudWatch** | Structured JSON logging across all Lambda functions |

> Full details on every service, voice map, language list, and architecture diagram in [`aws.md`](./aws.md)

---

## Tech Stack

| Layer | Technology |
|---|---|
| Frontend | React 18 + Vite, Tailwind CSS, Zustand |
| Auth | Amazon Cognito |
| AI | Amazon Bedrock (Claude Sonnet 4.6) |
| Voice | Amazon Polly (Neural TTS) + Web Speech API |
| Translation | Amazon Translate (18 languages) |
| Notifications | Amazon SNS |
| Database | Aurora Serverless v2 (PostgreSQL) |
| API | API Gateway + Lambda (Python 3.12) |
| Hosting | AWS Amplify |

---

## Architecture

```
Browser (React + Vite on Amplify)
        │
        │ HTTPS + x-api-key
        ▼
  API Gateway (REST)
        │
   ┌────┴──────┬──────────┬──────────┬──────────┬─────────┐
   ▼           ▼          ▼          ▼          ▼         ▼
Lambda      Lambda     Lambda     Lambda     Lambda   Lambda
/chat      /advocate  /translate  /polly   /session  /eligibility
   │           │          │          │          │
   ▼           ▼          ▼          ▼          ▼
Bedrock     Bedrock   Translate   Polly     Aurora
(Claude)    (Claude)              → S3    Serverless
```

---

## Project Structure

```
Rta/
├── src/
│   ├── pages/            # Landing, Intake, Results, Apply, Tracker, Auth, Profile, Settings
│   ├── components/       # Layout, FloatingChatbot, ProgramChatbot, AdvocatePanel, LanguagePicker
│   ├── contexts/         # AuthContext, TranslationContext
│   ├── hooks/            # useTranslation
│   ├── store/            # Zustand store (language, answers, auth)
│   ├── services/         # chatbotApi, advocateApi, translate, pollyApi
│   ├── i18n/             # translations.js (EN source + 17 auto-translated)
│   └── data/             # programs.js (eligibility rules, FPL thresholds)
├── lambda/
│   ├── advocate/         # Letter generation + roleplay (Bedrock)
│   ├── eligibility/      # Cross-program eligibility scoring
│   ├── polly/            # TTS synthesis + S3
│   ├── session/          # Aurora read/write
│   ├── sns/              # Renewal reminders
│   └── translate/        # Amazon Translate wrapper
├── aws.md                # Full AWS service documentation
└── README.md
```

---

## Running Locally

**1. Clone and install:**
```bash
git clone https://github.com/vinisha231/AWS-Hacks-2026.git
cd AWS-Hacks-2026
npm install
```

**2. Set environment variables:**
```bash
cp .env.example .env.local
# Fill in:
# VITE_API_ENDPOINT=https://<api-id>.execute-api.us-east-1.amazonaws.com/prod
# VITE_API_KEY=<your API Gateway key>
```

**3. Run:**
```bash
npm run dev
# → http://localhost:5173
```

---

## Deploying to AWS Amplify

1. Go to [Amplify Console](https://console.aws.amazon.com/amplify) → **New App** → **Host web app**
2. Connect GitHub → `vinisha231/AWS-Hacks-2026` → branch: `main`
3. Build settings (auto-detected):
   - Build command: `npm run build`
   - Publish directory: `dist`
4. Add environment variables:
   ```
   VITE_API_ENDPOINT = https://<api-id>.execute-api.us-east-1.amazonaws.com/prod
   VITE_API_KEY      = <your API Gateway key>
   ```
5. Deploy — every push to `main` auto-deploys.

---

## Competitive Landscape

| Tool | Gap |
|---|---|
| Benefits.gov | Official but hard to navigate, no eligibility check |
| mRelief | SNAP only, no application help |
| Aunt Bertha / Findhelp.org | Directory only — no eligibility or auto-fill |
| GetYourBenefits.org | Eligibility only, no tracking |
| BenefitsCal | California only |
| Propel (Fresh EBT) | SNAP balance tracking, not a full navigator |

**Rta is the only tool** that covers intake → AI eligibility → auto-fill → document checklist → AI advocate → status tracking → renewal reminders → multilingual voice support — in one flow, across 10+ programs, in 18+ languages.
