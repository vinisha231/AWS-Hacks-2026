# AWS Services Used in Rta

Rta is a multilingual AI-powered government benefits eligibility assistant built entirely on AWS. Below is every AWS service used, what feature it powers, and how we integrated it.

---

## 1. Amazon Bedrock — `us.anthropic.claude-sonnet-4-6`

**What it powers:** All AI-generated content in the app.

| Feature | How Bedrock is used |
|---|---|
| **AI Advocate — Generate Advocacy Letter** | Claude writes a personalized advocacy letter in the user's selected language, plus talking points and common objections to prepare the user |
| **AI Advocate — Practice with Mock Officer** | Claude role-plays as a government caseworker, conducting a realistic interview in the user's language to help them prepare for their real appointment |
| **Ask Questions chatbot (FloatingChatbot)** | Claude answers general benefits questions (SNAP, Medicaid, housing) in the user's chosen language |
| **Program-specific chatbot (ProgramChatbot)** | Claude answers detailed questions about a specific program (eligibility, documents, timelines) in the user's language |

**How:** Lambda functions call `bedrock-runtime` (`InvokeModel` API) with `us.anthropic.claude-sonnet-4-6` model ID. System prompts instruct Claude to respond natively in the target language (Tamil, Spanish, Arabic, etc.) without translation.

---

## 2. AWS Lambda (Python 3.12)

**What it powers:** All backend logic. The frontend is a static React app — Lambda handles every API call.

| Lambda Function | Route | Feature |
|---|---|---|
| `compass-advocate` | `POST /advocate` | Generate advocacy letter OR run roleplay turn with Bedrock |
| `compass-chatbot` | `POST /chat` | Answer general or program-specific questions via Bedrock |
| `compass-eligibility` | `POST /eligibility` | Score user against program rules (income, household size, state) |
| `compass-translate` | `POST /translate` | Translate any text into any of 18 languages via Amazon Translate |
| `compass-polly` | `POST /polly` | Convert text to speech in 13 languages via Amazon Polly |
| `compass-session` | `POST /session` | Persist user answers to Aurora Serverless |
| `compass-sns` | `POST /notify` | Send appointment reminder via Amazon SNS |

**How:** Each Lambda is deployed independently via the AWS Console / CLI and exposed through API Gateway.

---

## 3. Amazon API Gateway (REST API)

**What it powers:** Single HTTPS entry point for the React frontend.

- **API ID:** `rh0xzd2dad` · **Stage:** `prod`
- All Lambda functions are wired to routes under `https://rh0xzd2dad.execute-api.us-east-1.amazonaws.com/prod/`
- API key authentication (`x-api-key` header) protects all POST endpoints
- CORS configured for `*` origin so the Amplify-hosted frontend can call it

---

## 4. Amazon Translate

**What it powers:** Real-time UI translation into 18 languages.

| Feature | How Translate is used |
|---|---|
| **Full UI translation** | On language switch, a batch of all ~80 UI strings is sent to `/translate` and cached in `localStorage`; the app renders entirely in the selected language |
| **Pros & Cons translation** | Each program's pros and cons are translated on demand when the user picks a non-English language |
| **Chatbot response translation** | Chatbot replies (generated in English by Bedrock) are translated to the selected language before display |

**Supported languages:** English, Spanish, French, German, Hindi, Arabic, Chinese (Simplified), Tamil, Telugu, Bengali, Vietnamese, Turkish, Polish, Ukrainian, Swahili, Korean, Japanese, Portuguese.

**How:** Lambda calls `boto3.client('translate').translate_text()` with `SourceLanguageCode` and `TargetLanguageCode`. Returns translated string in the JSON response as `{"translated": ["..."]}`.

---

## 5. Amazon Polly

**What it powers:** Text-to-speech for the AI Advocate mock officer roleplay.

| Feature | How Polly is used |
|---|---|
| **Mock Officer speaks** | Caseworker AI responses are read aloud in the user's language |
| **🔊 Replay button** | User can tap any assistant message to hear it again |

**Voice map (13 languages):**

| Language | Polly Voice | Engine |
|---|---|---|
| English | Joanna | Neural |
| Spanish | Lupe | Neural |
| French | Léa | Neural |
| German | Vicki | Neural |
| Hindi | Kajal | Neural |
| Arabic | Zeina | Standard |
| Chinese | Zhiyu | Neural |
| Tamil | Kajal (fallback) | Neural |
| Portuguese | Camila | Neural |
| Korean | Seoyeon | Neural |
| Japanese | Takumi | Neural |
| Italian | Bianca | Neural |
| Dutch | Laura | Neural |

**How:** Lambda calls `boto3.client('polly').synthesize_speech()` with `OutputFormat='mp3'` and `Engine='neural'`. Returns a presigned S3 URL or base64 audio that the browser plays via the HTML5 Audio API.

---

## 6. Aurora Serverless v2 (PostgreSQL)

**What it powers:** User session persistence.

- Stores intake form answers (household size, income, state, special circumstances) so users can return to their results without re-entering data
- Session ID generated client-side (`crypto.randomUUID()`) and stored in `localStorage`
- Lambda reads/writes via `boto3` RDS Data API (`execute_statement`)

**Schema (simplified):**
```sql
CREATE TABLE sessions (
  session_id TEXT PRIMARY KEY,
  answers    JSONB,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);
```

---

## 7. Amazon SNS (Simple Notification Service)

**What it powers:** Appointment reminders.

- After a user saves a program to their tracker, they can opt in to a reminder notification
- SNS publishes to an email/SMS topic; Lambda triggers the publish on user request
- Endpoint: `POST /notify`

---

## 8. Amazon S3

**What it powers:** Static asset storage for Polly audio.

- Polly-generated MP3 files are stored in a private S3 bucket
- Lambda returns presigned URLs (15-minute expiry) for the frontend to stream audio directly from S3 without proxying through Lambda

---

## 9. AWS Amplify

**What it powers:** Frontend hosting and continuous deployment.

- React + Vite app is deployed to Amplify Hosting
- Connected to the GitHub repo (`vinisha231/AWS-Hacks-2026`) — every push to `main` triggers a new build
- Provides a public HTTPS URL for judges and users
- Build command: `npm run build` · Publish directory: `dist`

**Environment variables set in Amplify Console:**
```
VITE_API_ENDPOINT = https://rh0xzd2dad.execute-api.us-east-1.amazonaws.com/prod
VITE_API_KEY      = <your API Gateway key>
```

---

## 10. Amazon CloudWatch

**What it powers:** Structured logging and monitoring across all Lambda functions.

- Every Lambda logs structured JSON: `{"level": "INFO", "event": "...", "ts": 1234567890, ...}`
- Tracks request latency, Bedrock model calls, translation errors, and session writes
- Dashboards monitor error rates and p95 latency per endpoint

---

## Architecture Diagram (Text)

```
Browser (React + Vite on Amplify)
        │
        │ HTTPS (x-api-key)
        ▼
API Gateway (REST) ─────────────────────────────┐
        │                                        │
   ┌────┴────┬──────────┬──────────┬─────────┐   │
   ▼         ▼          ▼          ▼         ▼   │
Lambda    Lambda     Lambda     Lambda   Lambda  │
/chat    /advocate  /translate  /polly  /session │
   │         │          │          │        │    │
   ▼         ▼          ▼          ▼        ▼    │
Bedrock   Bedrock   Translate   Polly   Aurora   │
(Claude)  (Claude)              → S3   Serverless│
                                  │              │
                            Presigned URL ───────┘
                            streamed to browser
```

---

## Environment Variables Reference

| Variable | Where to get it | Required |
|---|---|---|
| `VITE_API_ENDPOINT` | API Gateway Console → Your API → Stages → prod → Invoke URL | ✅ Yes |
| `VITE_API_KEY` | API Gateway Console → API Keys → Show | ✅ Yes (if key required) |

Set these in:
- **Local dev:** `.env.local` (copy from `.env.example`)
- **Amplify:** Console → App → Environment variables
