# Hackathon Ownership Map

## Team roles

| Area | Owner | Files they edit |
|------|-------|-----------------|
| FastAPI backend (non-AI) | Backend | `api/routers/`, `api/schemas/`, `api/services/events.py`, `api/services/open_beauty_facts.py`, `api/db/migrations/`, `api/main.py`, `api/deps.py`, `api/config.py` |
| AI layer | agents teammate | `api/services/agents/`, `api/services/llm/`, `api/services/ocr.py` |
| Frontend | Frontend teammate | `web/` (separate directory — not committed in this repo yet) |

Files marked **OWNED BY AGENTS TEAMMATE** at the top of the module are stubs —
the contract is defined, the implementation is theirs.

## Working agreement

- **Contract first.** Pydantic schemas in `api/schemas/` and the route
  definitions in `api/routers/` are the contract between the three of us.
  Change them = Slack announce + regen frontend types.
- **Seeds are idempotent.** `002_seed_reference_data.sql` uses
  `ON CONFLICT DO NOTHING` everywhere so re-running is safe.
- **RLS is always on** for user-scoped tables (`profiles`, `user_products`,
  `analyses`). The backend uses the service-role key for analysis writes.
- **The analogy-first rule wins** any disagreement between design and
  engineering. See `product.md`.

## Demo day checklist

- [ ] Backend deployed to Railway; `/api/health` returns 200
- [ ] Frontend deployed to Vercel; landing loads; login works
- [ ] Supabase project provisioned; both migrations applied; `ingredients`,
      `analogies`, `bans`, `alternatives`, and `products` tables populated
- [ ] End-to-end: sign up → onboard with pre-seeded demo persona → agent
      theater fires on SSE → dashboard renders with at least one analogy
      and one "banned in EU/CA/HI" chip and one swap
- [ ] 3 demo personas ready (Maya / James / Priya)
- [ ] 2–3 min unlisted YouTube walkthrough
- [ ] Devpost / Airtable submission filed
