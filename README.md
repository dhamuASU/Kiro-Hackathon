# CleanLabel (DermaDecode)

A personal skincare coach that explains the chemistry in your bathroom using
everyday analogies — not scare tactics. Onboard once, tell us your skin type
and goals, and a multi-agent AI breaks down your products the way a friend
with a chemistry degree would.

> **The pitch:** Yuka shouts *"TOXIC."* We say *"sulfates are like sugar — fine
> in moderation, brutal at scale, and they're working against the hydration
> goal you told us about."*

## Repository layout

```
cleanlabel/
├── api/                       # FastAPI backend (Python 3.12)
│   ├── main.py                # App entry, routers, error-envelope handlers
│   ├── config.py              # Env-driven settings (Supabase, Anthropic, OBF)
│   ├── deps.py                # JWT verifier, Supabase client singleton
│   ├── routers/               # HTTP endpoints — one module per cluster
│   ├── schemas/               # Pydantic v2 contracts (source of truth)
│   ├── services/
│   │   ├── agents/            # Orchestrator + 5 sub-agents  (agents teammate)
│   │   ├── llm/               # Anthropic wrapper + prompts   (agents teammate)
│   │   ├── ocr.py             # Claude-vision label OCR       (agents teammate)
│   │   ├── events.py          # SSE event bus
│   │   └── open_beauty_facts.py  # OBF lookup + cache
│   ├── db/
│   │   └── migrations/        # 001_initial_schema.sql + 002_seed_reference_data.sql
│   └── tests/
├── .kiro/                     # Kiro steering, specs, hooks
└── web/                       # Next.js frontend  (frontend teammate — not in this repo yet)
```

## Backend quick-start

```bash
cd api
python3.12 -m venv .venv && source .venv/bin/activate
pip install -e .[dev]

# 1. Create a Supabase project, then apply schema + seed:
psql "$DATABASE_URL" -f db/migrations/001_initial_schema.sql
psql "$DATABASE_URL" -f db/migrations/002_seed_reference_data.sql

# 2. Configure env (see .env.example)
cp .env.example .env
# fill in SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, SUPABASE_JWT_SECRET,
# ANTHROPIC_API_KEY

# 3. Run
uvicorn main:app --reload --port 8000
# OpenAPI: http://localhost:8000/docs
```

## Stack

- **Backend:** FastAPI 0.111, Python 3.12, Pydantic v2, supabase-py, httpx
- **AI:** Anthropic Claude (`claude-3-5-haiku-20241022` default) via `anthropic` SDK; vision for label OCR
- **DB:** Supabase Postgres (RLS, JSONB, pg_trgm + GIN)
- **Streaming:** Server-Sent Events via `sse-starlette` for live agent progress
- **External:** Open Beauty Facts for product + ingredient lookup

## Multi-agent architecture (the centerpiece)

```
                Orchestrator
        ┌────────────┼────────────┐
        │            │            │
   Scanner    Profile Reasoner   Analogy Writer
        │            │            │
        └──── Alternative Finder ────┘
                     │
               Regulatory Xref  (pure SQL, no LLM)
```

Each sub-agent has a narrow input/output schema in `api/schemas/agent.py`
and its own module in `api/services/agents/`. The orchestrator streams
`agent.started` / `agent.progress` / `agent.done` events over SSE so the
frontend can render the live theater during onboarding.

## Team ownership

| Area | Owner |
|------|-------|
| FastAPI routers, Pydantic schemas, Supabase migrations + seed, error envelope, SSE infra | You (backend) |
| Orchestrator + 5 sub-agents, LLM client, prompt tuning, Claude-vision OCR | agents teammate |
| Next.js app, onboarding wizard, dashboard, agent-theater UI | Frontend teammate |

Files marked `OWNED BY AGENTS TEAMMATE` at the top are stubs — the contract is
defined, the implementation is theirs.

## What's not in scope for the hackathon

- Native mobile apps (web + mobile browser `getUserMedia` only)
- Medical diagnosis / treatment claims
- Binary "safe/unsafe" verdicts (always analogies and dose)
- Training our own models (all AI is Claude)
- The debunked "2kg of chemicals absorbed/year" stat
