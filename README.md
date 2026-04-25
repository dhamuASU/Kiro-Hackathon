# CleanLabel

**Live Demo:** [kirocleanlabel.netlify.app](https://kirocleanlabel.netlify.app/)

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

## Backend startup

### 1. Install Python deps

```bash
cd api
python3 -m venv .venv          # python 3.11+ works; 3.12 preferred
source .venv/bin/activate
pip install --upgrade pip
pip install -e ".[dev]"
```

### 2. Apply migrations to Supabase

You need a Supabase project. Either create one at https://supabase.com or use
your team's existing project. Then apply both migrations in order — pick
whichever method you prefer:

**Option A — psql (works anywhere):**
```bash
export DATABASE_URL='postgresql://postgres:<DB_PASSWORD>@db.<PROJECT_REF>.supabase.co:5432/postgres'
psql "$DATABASE_URL" -f db/migrations/001_initial_schema.sql
psql "$DATABASE_URL" -f db/migrations/002_seed_reference_data.sql
```

**Option B — Supabase dashboard SQL editor:**
Open `https://supabase.com/dashboard/project/<PROJECT_REF>/sql/new`,
paste each migration file, run them in order.

**Option C — Supabase CLI (if installed):**
```bash
supabase link --project-ref <PROJECT_REF>
supabase db push
```

Both migrations are idempotent (`create table if not exists`,
`on conflict do nothing`), so re-running is safe.

### 3. Configure `.env`

```bash
cp .env.example .env
```

Then fill in the four required secrets:

| Variable | Where to find it |
|---|---|
| `SUPABASE_URL` | Project Settings → API → "Project URL" |
| `SUPABASE_SERVICE_ROLE_KEY` | Project Settings → API → "API Keys" → reveal **secret** key (`sb_secret_*` for new projects, or `service_role` JWT on the legacy tab). **Bypasses RLS — backend only.** |
| `SUPABASE_JWT_SECRET` | Project Settings → API → "JWT Keys" → reveal the JWT secret used to sign auth tokens |
| `ANTHROPIC_API_KEY` | https://console.anthropic.com/settings/keys |

The `.env` file is gitignored. Never commit it.

### 4. Verify the database wiring

```bash
python scripts/verify_supabase.py
```

Expected output:
```
✓ categories     got  12
✓ ingredients    got  20
✓ analogies      got  15
✓ bans           got  19
✓ alternatives   got  17
✓ products       got  11
✓ "Sulfates are like sugar."
✓ Supabase wired up.
```

If you see `Invalid API key`, you're on an outdated `supabase-py` (must be
`>=2.10` for the new `sb_secret_*` key format). Re-run
`pip install -e ".[dev]"`.

### 5. Run the server

```bash
uvicorn main:app --reload --port 8000
```

Then in another terminal:

```bash
curl http://localhost:8000/api/health
# → {"status":"ok"}
```

OpenAPI docs at `http://localhost:8000/docs`. The full route catalog lives in
`.kiro/steering/api-contract.md`.

### 6. Run the tests

The test suite lives in `api/tests/` and uses `pytest` + `pytest-asyncio`.
It is intentionally *infrastructure*-focused: it asserts the routing /
auth / error-envelope contract holds, **not** the agent implementations
(those are owned by the agents teammate and tested separately).

#### Prerequisite — env

The tests boot the FastAPI app via `TestClient`, which means `main.py`
imports run, which means `config.py` reads your `.env`. The `.env` you
already configured in step 3 is enough; tests do **not** make outbound
network calls or hit your live Supabase.

If you want to run tests in CI or in a sandbox without a real `.env`,
export inline placeholders before invoking pytest — `pydantic-settings`
is happy as long as the four required vars are *present*:

```bash
SUPABASE_URL=https://placeholder.supabase.co \
SUPABASE_SERVICE_ROLE_KEY=placeholder \
SUPABASE_JWT_SECRET=placeholder \
ANTHROPIC_API_KEY=sk-ant-placeholder \
pytest
```

#### Running everything

```bash
cd api
source .venv/bin/activate
pytest                     # quiet, fail fast
pytest -v                  # one line per test
pytest -v --tb=short       # short tracebacks on failures
```

Expected output:

```
tests/test_analyze.py::test_health PASSED
tests/test_analyze.py::test_analyze_requires_auth PASSED
tests/test_analyze.py::test_analyze_bad_jwt_is_unauthorized PASSED
tests/test_analyze.py::test_unknown_route_is_enveloped_404 PASSED
tests/test_analyze.py::test_openapi_spec_reachable PASSED
tests/test_onboarding.py::test_complete_onboarding_requires_auth PASSED
tests/test_onboarding.py::test_profile_schema_validation PASSED
======================= 7 passed in 0.96s =======================
```

#### What each test verifies

| Test | What it locks in |
|---|---|
| `test_health` | `GET /api/health` returns `200 {"status":"ok"}`. The dumb-but-essential canary. |
| `test_analyze_requires_auth` | `POST /api/analyze` without an `Authorization` header returns `401` or `403` and the body is the spec'd `{error:{code,message,details}}` envelope (not FastAPI's default `{"detail": ...}`). |
| `test_analyze_bad_jwt_is_unauthorized` | An obviously-bad JWT returns `401 UNAUTHORIZED` (not `500`) and is enveloped. Protects against the JWT verifier swallowing exceptions. |
| `test_unknown_route_is_enveloped_404` | Hitting `/api/totally-fake-route` returns `404 NOT_FOUND` enveloped — proves the `StarletteHTTPException` handler catches routing errors, not just FastAPI-thrown ones. |
| `test_openapi_spec_reachable` | `GET /openapi.json` returns 200 and the document contains every demo-critical path: `/api/health`, `/api/profile`, `/api/onboarding/profile`, `/api/analyze`, `/api/analyze/{analysis_id}/stream`, `/api/scan/barcode`, `/api/scan/label`, `/api/products/resolve`, `/api/alternatives`. Catches accidental router de-registration. |
| `test_complete_onboarding_requires_auth` | `POST /api/onboarding/complete` is auth-gated. |
| `test_profile_schema_validation` | Request bodies failing Pydantic validation surface a `422 VALIDATION_ERROR` envelope (or `403` if auth fires first — both acceptable). |

#### Running a subset

```bash
# Just one file
pytest tests/test_analyze.py -v

# Just one test function
pytest tests/test_analyze.py::test_health -v

# By keyword (anything matching "envelope")
pytest -k envelope -v
```

#### Coverage

```bash
pip install coverage
coverage run -m pytest
coverage report -m              # text summary, with missing-line numbers
coverage html && open htmlcov/index.html   # browseable per-file view
```

#### Stopping on the first failure (when iterating)

```bash
pytest -x          # exit immediately on first failure
pytest -x --pdb    # drop into pdb at the failure
```

#### Live-database verification (separate from pytest)

```bash
python scripts/verify_supabase.py
```

This is an *integration* sanity check, not a pytest test. It hits your
real Supabase project with the service-role key and confirms the seeded
row counts plus the SLS analogy lookup. Run it after migrating a fresh
project, after re-seeding, or any time you suspect the database has
drifted from the migrations.

#### Adding new tests

- Drop a `test_*.py` file in `api/tests/`.
- Use the `TestClient(app)` pattern for HTTP-level tests.
- Don't mock the DB unless you're isolating a specific bug — prefer
  hitting a Supabase **branch** or local Postgres if you need real data.
- The `pyproject.toml` has `asyncio_mode = "auto"`, so any
  `async def test_*` function is automatically awaited.

### Notes

- **LLM-touching endpoints** (`/api/analyze`, `/api/products/resolve`,
  `/api/scan/label`) require both a valid `ANTHROPIC_API_KEY` and the
  agents teammate's implementations in `api/services/agents/*` and
  `api/services/llm/client.py`. Until both ship, those endpoints will
  return `502 LLM_FAILURE` (enveloped) — that's expected and not a bug.
- **What works today without the agents teammate or `ANTHROPIC_API_KEY`:**
  - `GET /api/health`
  - `GET /api/profile`, `POST /api/profile`, `PATCH /api/profile`
    (auth required)
  - `POST /api/onboarding/profile`, `POST /api/onboarding/products`
    (auth required)
  - `GET /api/products/search`, `GET /api/products/common`
  - `POST /api/scan/barcode` (Open Beauty Facts lookup, no LLM)
  - `GET /api/user-products`, `POST /api/user-products`,
    `DELETE /api/user-products/{id}`
  - `GET /api/alternatives` — pure SQL filter
  - `GET /api/ingredient/{inci_name}`
- **Auth-gated endpoints** require a Supabase JWT in the
  `Authorization: Bearer <jwt>` header. For local testing, either log a
  user in via the frontend (Supabase Auth produces real tokens) or
  hand-sign one with `python -c "import jwt; print(jwt.encode({'sub': 'test-user', 'aud': 'authenticated', 'role': 'authenticated', 'exp': 9999999999}, '<JWT_SECRET>', algorithm='HS256'))"`
  using the same `SUPABASE_JWT_SECRET` from your `.env`.

## Daily dev workflow

Once you've done the one-time setup above, the recurring loop is short:

```bash
cd api
source .venv/bin/activate
uvicorn main:app --reload --port 8000   # terminal 1 — backend with autoreload
pytest -v                                # terminal 2 — run after each change
python scripts/verify_supabase.py        # whenever DB state is suspect
```

`--reload` watches the `api/` tree, so saving a Python file restarts the
worker. Schema or seed changes (DDL / new migrations) require a manual
re-apply via psql or the Supabase dashboard — autoreload does *not*
re-run migrations.

## Troubleshooting

| Symptom | Most likely cause | Fix |
|---|---|---|
| `supabase._sync.client.SupabaseException: Invalid API key` on startup or in `verify_supabase.py` | `supabase-py` is pinned to a pre-2.10 version that rejects the new `sb_secret_*` / `sb_publishable_*` key format. | `pip install -U "supabase>=2.10"` (and confirm `pyproject.toml` has the right pin). |
| `pydantic_settings... Field required` on first import | A required env var is missing from `.env` (`SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY`, `SUPABASE_JWT_SECRET`, or `ANTHROPIC_API_KEY`). | Diff your `.env` against `.env.example`; pydantic-settings prints the field name in the error. |
| `httpx.ConnectTimeout` to `*.supabase.co` | Network egress blocked, VPN intercepting, or wrong project ref. | `curl -v https://<PROJECT_REF>.supabase.co/rest/v1/` should return 401, not hang. |
| `502 LLM_FAILURE` envelope on `/api/analyze`, `/api/products/resolve`, or `/api/scan/label` | Either the `ANTHROPIC_API_KEY` is missing/bogus, or the agents teammate's stubs in `api/services/{agents,llm}/` haven't been implemented yet. | Check `.env`, then check the relevant module's docstring — every stub raises `NotImplementedError("... — owned by agents teammate")`. |
| `403 FORBIDDEN — Not authenticated` when you sent an `Authorization` header | FastAPI's `HTTPBearer` raises 403 (not 401) when the header is malformed — e.g. missing the literal word `Bearer`, or the JWT has the wrong `aud` claim. | Header must be exactly `Authorization: Bearer <jwt>`. JWT must have `aud=authenticated` and be signed HS256 with `SUPABASE_JWT_SECRET`. |
| `401 UNAUTHORIZED — Invalid or expired token` | JWT signature or expiry check failed. | Re-sign with the *current* `SUPABASE_JWT_SECRET`, or refresh on the frontend. JWTs are HS256-verified server-side; if you rotated the JWT secret in Supabase, every existing token is invalid. |
| `404 NOT_FOUND` enveloped on a route you expect to exist | Route may have been removed or the path has a typo. | Hit `GET /openapi.json` and `grep`. The OpenAPI doc is generated from the routers, so if a route isn't there, it really doesn't exist. |
| `pytest` says `7 passed` but I added a new test and it didn't run | Test file or function name doesn't match `test_*.py` / `test_*`. | Pytest only auto-collects matching names. Rename or invoke explicitly: `pytest tests/my_module.py::specific_test`. |
| `verify_supabase.py` says `got 0 (expected ≥ 12)` for categories | Migration `001` wasn't applied to *this* project. | Apply it (step 2). Verify via `select count(*) from categories` in the Supabase SQL editor. |
| Migration apply fails with `permission denied for schema auth` | You're hitting Supabase via a non-privileged role. | Use the Supabase dashboard SQL editor (which runs as `postgres`), or psql with the URL that uses `postgres:<DB_PASSWORD>@db.<ref>...`. |
| RLS rejects a query I think should work | The service-role key bypasses RLS, but the legacy anon key (or `sb_publishable_*`) does not. | Make sure the backend is using `SUPABASE_SERVICE_ROLE_KEY`, not `SUPABASE_ANON_KEY`. The frontend uses the anon/publishable key, never service role. |

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
