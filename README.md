# 🔥 Flare — Recovery Companion App

> **UWBHacks 2026**

Flare is an anonymous, AI-powered addiction recovery companion. It meets users in their most vulnerable moments, when a craving hits, when they've relapsed, or when they just need someone to talk to — and responds with empathy, personalized voice support, and science-backed strategies. No email. No phone number. No judgment.

---

## Features

### I'm Craving
The most important button in the app. When a user feels the pull, they press this and Flare immediately:
1. Shows a calming screen to slow them down
2. Opens a **voice check-in** — Flare speaks and listens to the user
3. Analyzes their emotional state using **Gemma 4 AI** (detects depleted hormone pathway: dopamine, serotonin, oxytocin, or endorphins)
4. Responds with a voice message matched to their emotional state
5. Serves a **personalized activity** (exercise, journaling, breathing, social connection) to redirect the craving

### I Relapsed
A compassionate, non-judgmental relapse flow:
- Flare speaks an opening prompt and listens to what happened
- User types or dictates their reflection
- AI identifies the **exact trigger** (e.g. "stress at work", "loneliness at night")
- Returns 4 **personalized improvement steps** tied directly to that trigger — not generic advice
- Flare reads the response and improvement steps aloud via the user's chosen voice
- Streak resets and Day 1 begins with encouragement

### Voice Companion
Users can record a voice of someone they trust (a parent, partner, friend) and Flare will use that cloned voice for all support messages — so support feels like it's coming from someone they love. Built on **ElevenLabs voice cloning**.

### Recovery Map (Activity)
A fantasy RPG-style map showing the user's recovery journey as an adventure. Each milestone (Day 3, Day 7, Day 14, Day 30, Day 100) is a zone to unlock. Locked zones appear in fog. Unlocked zones glow with a trail connecting them.

### Daily Check-In
A daily voice check-in that asks how the user is doing. Flare responds with an affirmation spoken in the companion's voice.

### Milestones
Tracks recovery milestones:
- First Spark (Day 1)
- 3-Day Flame (Day 3)
- One Week (Day 7)
- Two Weeks (Day 14)
- One Month (Day 30)
- 100 Days (Day 100)

### Peer Connect
Anonymous real-time peer support chat. Users connect with others in recovery without revealing any personal information — username only. Powered by **Socket.io**.

### Streak Calendar
Interactive calendar showing login/clean days. Users can tap days to simulate streaks and see what their progress could look like.

### NFT Milestone Badges
When users hit major milestones, they can mint a **Solana NFT badge** on devnet as a permanent, on-chain record of their achievement.

### Goals
Users set up to 5 personal quit goals in their profile and designate one as their main goal — displayed front and center on the home screen as a constant reminder of why they're doing this.

---

## Tech Stack

| Layer | Tech |
|---|---|
| Frontend | React + Vite, Tailwind CSS, Zustand (persist) |
| Backend | Node.js + Express, deployed on DigitalOcean |
| Database | Supabase (PostgreSQL) |
| AI | Google Gemma 4 (mood analysis, spark generation, relapse reflection) |
| Voice | ElevenLabs TTS + Voice Cloning (Creator plan) |
| Real-time | Socket.io (Peer Connect) |
| Blockchain | Solana devnet, `@solana/web3.js`, Metaplex |
| Deployment | Vercel (frontend), DigitalOcean App Platform (backend) |

---

## Architecture

```
User Browser (Vercel)
    │
    ├── React Frontend
    │     ├── Zustand store (persisted locally, no PII)
    │     ├── ElevenLabs service (TTS + voice clone)
    │     └── Solana wallet adapter
    │
    └── Express Backend (DigitalOcean)
          ├── /api/auth          → username/password auth (Supabase)
          ├── /api/gemini        → mood analysis, sparks, relapse reflection
          ├── /api/elevenlabs    → TTS proxy + voice cloning
          └── Socket.io          → Peer Connect real-time chat
```

---

## Privacy First

- **No email. No phone number.** Just a username and password.
- All personal reflection data stays local (Zustand localStorage).
- Peer Connect is fully anonymous — username only, no profile linking.
- Voice clones are stored in ElevenLabs under the user's account only.

---

## Running Locally

### Prerequisites
- Node.js 18+
- A `.env` file for the server (see below)

### Frontend
```bash
npm install
npm run dev
```

### Backend
```bash
cd server
npm install
npm run dev
```

### Environment Variables

**Frontend (`.env`)**
```
VITE_SERVER_URL=http://localhost:3001
```

**Backend (`server/.env`)**
```
SUPABASE_URL=your_supabase_url
SUPABASE_SERVICE_KEY=your_supabase_service_key
ELEVENLABS_API_KEY=your_elevenlabs_key
GEMINI_API_KEY=your_gemini_key
PORT=3001
```

---

## Deployment

- **Frontend**: Vercel — set `VITE_SERVER_URL` to your backend URL in Vercel Environment Variables
- **Backend**: DigitalOcean App Platform — set all server env vars in the App Platform dashboard

---

## Team

Built with love (and very little sleep) at UWBHacks 2026.
