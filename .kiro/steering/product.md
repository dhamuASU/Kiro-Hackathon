# Product Overview

## Name
DermaDecode (CleanLabel)

## One-Line Pitch
"Yuka shouts TOXIC. We say sulfates are like sugar — fine in moderation, brutal at scale, and they're working against the acne goal you told us about."

## Frame
Environment / Inclusion crossover (Kiro Spark Challenge @ ASU, 2026)

## What We're Building
A personal skincare assistant. User signs up, walks through onboarding (age, gender, skin type, goals, current products), and our multi-agent AI produces:
1. Chemical breakdown of every product calibrated to their profile
2. Analogy-first explanations (not "TOXIC" — "sulfates are like sugar")
3. Banned-elsewhere context (EU/California/Canada bans as receipts, not headlines)
4. Alternative product recommendations matched to skin type and goals

## Stack
- **Frontend**: Next.js 14 (App Router) + TypeScript + Tailwind + shadcn/ui
- **Backend**: FastAPI (Python 3.12) + Pydantic v2
- **Database**: Supabase (Postgres + Auth + Storage)
- **AI**: Anthropic Claude (multi-agent orchestration)
- **Deploy**: Vercel (frontend) + Railway (backend)

## Color Palette
- Navy `#28396C` — primary, buttons, headings
- Sage `#B5E18B` — safe indicators, success states
- Mint `#F0FFC2` — page background, highlights
- Cream `#EAE6BC` — cards, input fields

## Analogy Rules (MUST follow)
1. Respect dose — "fine in moderation, brutal at scale"
2. Respect the user's goal — explain how the chemical sabotages THEIR specific goal
3. Be true — if the chemistry doesn't match the analogy, don't ship it
4. Never say "TOXIC", "POISON", "AVOID AT ALL COSTS"

## Frontend Pages (App Router)
- `/` — landing page
- `/login` — magic link form
- `/auth/callback` — Supabase auth callback
- `/onboarding` — 5-step wizard (profile → goals → allergies → products → analyzing)
- `/dashboard` — personalized analysis results
- `/product/[id]` — single product deep-dive
- `/settings` — edit profile, manage products

## API Base URL
- Dev: `http://localhost:8000/api`
- Prod: `https://api.dermadecode.app/api`
