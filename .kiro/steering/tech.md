# Tech Stack

## Frontend (separate repo — owned by frontend teammate)
- Next.js 14 (App Router) + TypeScript (strict)
- Tailwind CSS + shadcn/ui
- Zustand + TanStack Query
- react-hook-form + zod
- Deployed to Vercel

## Backend (`api/` in this repo)
- FastAPI 0.111 + Python 3.12
- Pydantic v2 (single source of truth for request/response shapes)
- supabase-py 2.4.x (service role key; bypasses RLS on backend)
- httpx (async) for Open Beauty Facts
- `sse-starlette` for live agent-progress streaming
- `python-jose` for JWT verification
- Deployed to Railway (`gunicorn -k uvicorn.workers.UvicornWorker`)

## AI
- `anthropic` SDK, `AsyncAnthropic`
- Default model: `claude-3-5-haiku-20241022` (override via `CLAUDE_MODEL` env)
- Claude vision for front/back label OCR
- All LLM calls live in `api/services/llm/` — owned by agents teammate

## Database
- Supabase Postgres (managed)
- UUID PKs via `uuid-ossp`
- `pg_trgm` for fuzzy product / ingredient search
- JSONB for flexible columns (hazard_tags, skin_goals, analysis output)
- RLS: public-read on reference tables; own-row on profile / user_products /
  analyses; service-role-only on analysis_runs

## Migrations
- Plain SQL in `api/db/migrations/`, applied in filename order.
- `001_initial_schema.sql` — tables + RLS + indexes + category seed
- `002_seed_reference_data.sql` — ingredients, analogies, bans, alternatives,
  demo products (idempotent via `ON CONFLICT DO NOTHING`)

## Conventions
- Routers register under `/api` in `main.py`.
- Pydantic schemas in `api/schemas/` are the contract — frontend TS types
  should regen from `openapi.json` (`openapi-typescript`), never hand-written.
- All external calls (OBF, Claude) are `async` with explicit timeouts.
- JWT verification on every protected endpoint via `Depends(current_user)`
  (imported as the `CurrentUser` annotated alias).
- The `AbstractAgent` base enforces the `async def run(input) -> output`
  signature for every sub-agent.
- Error responses always use the `{error: {code, message, details}}` envelope.

## Environment variables
See `api/.env.example`. Notable:
- `CLAUDE_MODEL` — override default Claude model
- `OBF_BASE_URL` — Open Beauty Facts API root (swap to mirror for dev)
- `DEMO_MODE` — reserved for demo-only auth shortcuts
