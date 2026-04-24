---
date: 2026-04-24T23:10:15Z
agent: master
type: change
status: shipped
tags: [docs, env, gitignore, steering]
references: []
---

# Project docs, env template, gitignore

## Why

The Kiro scaffold arrived with a generic multi-framework README and a set
of steering files that still described the AWS/Lambda/DynamoDB default
template. Frontend and Agents teammates need accurate onboarding
documentation that reflects what's actually in the repo — Next.js (theirs),
FastAPI + Supabase (here), Anthropic via `anthropic` SDK.

Also needed: a root `.gitignore`, an `.env.example` documenting every
required key, and a local `.env` skeleton the team can fill in without
digging through `config.py`.

## What changed

- **`README.md`** — rewritten to describe CleanLabel / DermaDecode: the
  pitch, repo layout, stack, multi-agent diagram, three-lane ownership
  table, non-goals, local quick-start. Was the generic hackathon template.
- **`.kiro/steering/product.md`** — was "TBD — describe what you're
  building here." Now the full product doc: the four winning moves, the
  three analogy rules, target personas, non-goals, demo-moment mapping.
- **`.kiro/steering/api-contract.md`** — was generic CRUD examples.
  Now: the real endpoint catalog (all 20 routes), SSE event shapes, the
  `{error: {code, message, details}}` envelope, error codes enum,
  response conventions (UUID strings, ISO 8601 UTC, JSONB round-trips).
- **`.kiro/steering/tech.md`** — was React + Lambda + DynamoDB. Now
  documents the real stack: FastAPI 0.111, Pydantic v2, supabase-py,
  httpx, sse-starlette, python-jose, anthropic SDK, Claude model,
  Postgres + pg_trgm + GIN.
- **`.kiro/steering/structure.md`** — was the generic CDK layout. Now
  mirrors the actual directory tree including `services/agents/` (agents
  lane) and `services/llm/` (agents lane).
- **`.kiro/steering/hackathon.md`** — was the AWS SSO + CDK deploy guide.
  Now the three-lane ownership map, the working agreement, and the
  demo-day checklist.
- **`api/.env.example`** — every required + optional key with inline
  comments on where to obtain each value.
- **`api/.env`** — local skeleton with `REPLACE_WITH_...` placeholders
  so the team can fill in quickly. Gitignored.
- **`.gitignore`** (new, root) — Python, venvs, `.env` variants (keeps
  `.env.example`), Node, macOS, editors, Supabase CLI, logs.

## Files touched

- `README.md`
- `.kiro/steering/{product,api-contract,tech,structure,hackathon}.md`
- `api/.env.example`
- `api/.env` (local, gitignored)
- `.gitignore` (new)

## Cross-agent requests

None. Everything here is Master-lane documentation.

## Risks / rollback

- `api/.env` is gitignored by the `.env` rule in the root `.gitignore`.
  If you need to check if yours is being tracked: `git check-ignore -v
  api/.env` — should output the rule hit.
- The steering files are consumed by both humans and the Kiro harness;
  if the harness picks up stale content after an edit, run the IDE's
  `Reload Kiro` command (or restart).
- The `README.md` promises `psql "$DATABASE_URL" -f ...` works — that
  requires a `DATABASE_URL` pointing at your Supabase instance. If
  you're using the Supabase dashboard SQL editor instead, paste each
  migration file in order.
