# Technology Stack

## Frontend
- Next.js 14 (App Router) + TypeScript + Tailwind CSS + shadcn/ui
- Zustand (local state) + TanStack Query (server state)
- react-hook-form + zod (forms)
- Deployed to Vercel

## Backend
- FastAPI (Python 3.12) + Pydantic v2
- Anthropic Claude (multi-agent orchestration)
- httpx (async HTTP client for Open Beauty Facts)
- Deployed to Railway

## Database
- Supabase (Postgres + Auth + Storage)
- RLS enforced on all user tables
- Frontend uses anon key (public read only)
- Backend uses service role key (full access)

## AI Architecture
- Orchestrator Agent → 5 sub-agents:
  1. Scanner Agent — flags ingredients per product
  2. Profile Reasoner — ranks flags by user goals/skin type
  3. Analogy Writer — generates analogy-first explanations
  4. Alternative Finder — finds cleaner swaps
  5. Regulatory Cross-ref — cites EU/CA/Canada bans (pure DB, no LLM)
- SSE stream for live agent progress in UI

## Conventions
- All API routes prefixed with `/api/`
- Frontend types generated from FastAPI OpenAPI (`npm run codegen`)
- Never call Supabase directly from frontend for writes — go through FastAPI
- Never expose Anthropic API key to frontend
- Analogy rules: respect dose, respect goal, be true, never say "TOXIC"
