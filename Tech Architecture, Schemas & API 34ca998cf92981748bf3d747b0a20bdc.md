# Tech Architecture, Schemas & API

> ⚠️ **This is the contract document.** Frontend, Backend, and Data all build against the schemas and endpoints defined here. Freeze by end of Day 1. Any change = Slack announce + doc update + type regen.
> 

---

# 1. Architecture Overview

```
┌──────────────────┐         ┌──────────────────┐         ┌──────────────────┐
│  Next.js 14 App  │  HTTPS  │  FastAPI Backend │  SQL    │    Supabase      │
│  (Vercel)        ├───────▶│  (Railway)       ├───────▶│  Postgres + Auth │
│  App Router      │         │  Python 3.12     │         │  + Storage       │
│  Tailwind + TS   │         │  Pydantic v2     │         │                  │
└──────┬──────────┘         └──────┬──────────┘         └──────────────────┘
       │ Supabase JWT          │
       │ (auth on frontend)    ▼
       └─────────────────┌────────────────────────┐
                          │  AI Layer (Claude)             │
                          │  ┌────────────────────────┐ │
                          │  │  Orchestrator Agent  │ │
                          │  └──────┬───────────────┘ │
                          │  ┌────────────────────────┐ │
                          │  │ Sub-agents:          │ │
                          │  │  • Scanner           │ │
                          │  │  • Profile Reasoner  │ │
                          │  │  • Analogy Writer    │ │
                          │  │  • Alternative Finder│ │
                          │  │  • Regulatory X-ref  │ │
                          │  └────────────────────────┘ │
                          └───────────────────────────────────┘
                                  ▲
                                  │
                          ┌───────────┴───────────┐
                          │ Open Beauty Facts │
                          │ (product lookup)  │
                          └─────────────────────┘
```

## End-to-end onboarding flow

1. User hits landing → clicks **Sign up** → Supabase email magic link.
2. User completes onboarding wizard (profile + goals + products) — each step `POST`s to FastAPI.
3. On final submit, frontend calls `POST /api/analyze` → FastAPI creates an `analyses` row with `status=pending`, kicks off the orchestrator as a background task, returns `{ analysis_id }`.
4. Frontend opens `GET /api/analyze/{id}/stream` (SSE) — receives a stream of agent-progress events to render the live theater.
5. Orchestrator runs sub-agents (Scanner → Profile Reasoner → Analogy Writer → Alternative Finder → Regulatory Cross-ref) and writes their outputs to `analysis_runs` as it goes.
6. Orchestrator composes final output, writes to `analyses.output`, marks `status=completed`, emits final SSE event.
7. Frontend redirects to `/dashboard` and renders the result.

---

# 2. Stack Summary

| Layer | Choice | Why |
| --- | --- | --- |
| Frontend framework | **Next.js 14 (App Router)** | SSR + streaming for fast first paint on mobile, file-based routing |
| Frontend language | **TypeScript (strict)** | Types regenerated from FastAPI OpenAPI — contract enforcement |
| Styling | **Tailwind CSS**  • **shadcn/ui** | Speed, consistent tokens, accessible primitives |
| State | **Zustand**  • **TanStack Query** | Local + server state, no Redux bloat |
| Forms | **react-hook-form**  • **zod** | Type-safe, validates against backend schemas |
| Backend framework | **FastAPI 0.110+** | Async, Pydantic v2, OpenAPI auto-gen |
| Backend language | **Python 3.12** |  |
| Validation | **Pydantic v2** | Single source of truth for I/O schemas |
| LLM SDK | **`anthropic`** (Claude) | Multi-agent orchestration, tool use, vision (P1) |
| HTTP client | **httpx** (async) | For Open Beauty Facts |
| Barcode decode | **ZXing WebAssembly** (`@zxing/browser`) | In-browser barcode scan, no backend round-trip for the decode |
| Vision OCR | **Claude vision** (`anthropic` SDK, image input) | Front-of-product brand+name extraction; back-of-product ingredient OCR |
| Database | **Supabase Postgres** | RLS, JSONB, generous free tier |
| Auth | **Supabase Auth** (email magic links) | Plug-and-play, RLS-aware |
| Storage | **Supabase Storage** | For label-photo uploads (P1) |
| DB migrations | **Supabase Studio SQL**  • **`supabase` CLI** | Run idempotent migrations on deploy |
| Realtime | **SSE (FastAPI `EventSourceResponse`)** | Stream agent progress |
| Frontend deploy | **Vercel** | Zero-config, preview branches |
| Backend deploy | **Railway** | One-click Python, env vars in UI |

---

# 3. Frontend — Next.js 14

## 3.1 Directory structure

```jsx
web/
├── app/
│   ├── layout.tsx                       # Root layout, fonts, metadata, providers
│   ├── page.tsx                         # Landing page
│   ├── (auth)/
│   │   ├── login/page.tsx               # Magic link form
│   │   └── callback/page.tsx            # Supabase auth callback
│   ├── (app)/                           # Auth-gated layout group
│   │   ├── layout.tsx                   # Checks session, redirects to /login if absent
│   │   ├── onboarding/
│   │   │   ├── page.tsx                 # Wizard shell (steps 1–4)
│   │   │   └── analyzing/page.tsx       # Step 5: agent theater + SSE listener
│   │   ├── dashboard/
│   │   │   └── page.tsx                 # Main analysis view
│   │   ├── product/
│   │   │   └── [id]/page.tsx            # Single product deep-dive
│   │   ├── ingredient/
│   │   │   └── [name]/page.tsx          # Learn mode (P2)
│   │   └── settings/page.tsx            # Edit profile, manage products
├── components/
│   ├── onboarding/
│   │   ├── StepProfile.tsx              # Age + gender + skin type
│   │   ├── StepGoals.tsx                # Multi-select goals
│   │   ├── StepAllergies.tsx
│   │   ├── StepProducts.tsx             # Per-category picker
│   │   ├── ProductPicker.tsx            # Search + common-dropdown + paste + camera
│   │   ├── CameraCapture.tsx            # Three modes: barcode | front | back
│   │   └── AgentTheater.tsx             # Live SSE progress UI
│   ├── dashboard/
│   │   ├── ProfileHeader.tsx            # Skin type + goal chips
│   │   ├── ProductCard.tsx              # Compact per-product card
│   │   ├── IngredientRow.tsx            # Analogy-first row
│   │   ├── BannedChip.tsx               # "Banned in EU" small chip
│   │   └── SwapCard.tsx                 # Alternative product
│   └── ui/                              # shadcn/ui primitives
├── lib/
│   ├── api.ts                           # Typed fetch wrappers around FastAPI
│   ├── supabase.ts                      # Supabase client (auth only on frontend)
│   ├── types.ts                         # Generated from openapi-typescript
│   └── sse.ts                           # EventSource wrapper for agent stream
├── store/
│   ├── onboarding.ts                    # Zustand: in-progress onboarding state
│   └── session.ts                       # Zustand: cached profile
└── public/
```

## 3.2 Conventions

- **Server components by default.** Client components only for interactivity (forms, modals, SSE listener, charts).
- **Auth on the frontend.** Supabase JS SDK handles login + session. FastAPI receives the JWT and validates it server-side.
- **No direct Supabase writes from frontend.** Frontend reads `ingredients`, `categories`, `products`, `alternatives` directly via the anon key (RLS-enforced public-read). All writes go through FastAPI.
- **Types regenerate from FastAPI.** `npm run codegen` → runs `openapi-typescript http://localhost:8000/openapi.json -o lib/types.ts`. Never edit by hand.
- **All Claude API calls go through FastAPI.** API key never touches the browser.

---

# 4. Backend — FastAPI

## 4.1 Directory structure

```jsx
api/
├── main.py                          # FastAPI app, middleware, router registration
├── config.py                        # pydantic-settings
├── deps.py                          # current_user, supabase client, jwt verifier
├── routers/
│   ├── health.py                    # GET /api/health
│   ├── profile.py                   # /api/profile
│   ├── onboarding.py                # /api/onboarding/*
│   ├── products.py                  # /api/products/*
│   ├── scan.py                      # /api/scan/* (camera: barcode + label OCR)
│   ├── user_products.py             # /api/user-products/*
│   ├── analyze.py                   # /api/analyze and SSE stream
│   ├── ingredients.py               # GET /api/ingredient/{name}  (Learn mode, P2)
│   └── alternatives.py              # GET /api/alternatives
├── schemas/                         # Pydantic v2 models (the contract)
│   ├── profile.py
│   ├── product.py
│   ├── ingredient.py
│   ├── analysis.py
│   └── agent.py                     # Per-agent input/output schemas
├── services/
│   ├── agents/                      # The five sub-agents (each a class)
│   │   ├── base.py                  # AbstractAgent
│   │   ├── orchestrator.py
│   │   ├── scanner.py
│   │   ├── profile_reasoner.py
│   │   ├── analogy_writer.py
│   │   ├── alternative_finder.py
│   │   └── regulatory_xref.py
│   ├── llm/
│   │   ├── client.py                # Anthropic client wrapper
│   │   └── prompts.py               # All prompt templates
│   ├── open_beauty_facts.py
│   ├── ocr.py                       # Claude vision wrapper for label scans
│   ├── supabase_client.py
│   └── events.py                    # SSE event bus
├── db/
│   ├── migrations/                  # SQL files (run via supabase CLI)
│   └── seed/
│       ├── ingredients.py
│       ├── bans.py
│       ├── analogies.py
│       ├── alternatives.py
│       └── categories.py
├── tests/
│   ├── test_agents.py               # Sub-agent unit tests with mocked LLM
│   ├── test_analyze.py
│   └── test_onboarding.py
└── pyproject.toml
```

## 4.2 Conventions

- **Pydantic schemas are the source of truth.** Frontend TS types derive from them via OpenAPI.
- **Sub-agents are classes that inherit from `AbstractAgent`** — each implements `async run(input) -> output` with strict input/output schemas.
- **All external calls (OBF, Claude) are `async`** with explicit timeouts.
- **Every endpoint sets `response_model`** so OpenAPI + frontend types stay accurate.
- **JWT verification on every protected endpoint** via `Depends(current_user)`.

---

# 5. AI Agent Architecture

The centerpiece. One orchestrator, five sub-agents. Each sub-agent has a narrow contract and is independently testable.

## 5.1 Orchestrator pattern

```python
# api/services/agents/orchestrator.py (sketch)
class OrchestratorAgent(AbstractAgent):
    async def run(self, input: OrchestratorInput) -> OrchestratorOutput:
        # 1. For each product, call Scanner
        scans = await asyncio.gather(*[
            self.scanner.run(ScannerInput(product=p)) for p in input.products
        ])
        await self.emit("scanner.done", {"product_count": len(scans)})

        # 2. Profile Reasoner ranks flagged ingredients per user
        ranked = await self.profile_reasoner.run(
            ProfileReasonerInput(profile=input.profile, scans=scans)
        )
        await self.emit("profile_reasoner.done", {"flagged_count": len(ranked.flagged)})

        # 3. For each flagged ingredient, write an analogy
        analogies = await asyncio.gather(*[
            self.analogy_writer.run(
                AnalogyWriterInput(ingredient=f, profile=input.profile)
            ) for f in ranked.flagged
        ])
        await self.emit("analogy_writer.done", {"count": len(analogies)})

        # 4. Find alternatives per flagged product
        alternatives = await asyncio.gather(*[
            self.alternative_finder.run(
                AlternativeFinderInput(
                    category=p.category_slug,
                    avoid_tags=p.flagged_tags,
                    profile=input.profile,
                )
            ) for p in ranked.flagged_products
        ])
        await self.emit("alternative_finder.done", {"count": len(alternatives)})

        # 5. Regulatory cross-reference (pure DB, no LLM)
        bans = await self.regulatory_xref.run(
            RegulatoryXrefInput(ingredient_ids=[f.ingredient_id for f in ranked.flagged])
        )
        await self.emit("regulatory_xref.done", {"banned_count": len(bans)})

        # 6. Compose final output
        return self.compose(profile=input.profile, scans=scans, ranked=ranked,
                            analogies=analogies, alternatives=alternatives, bans=bans)
```

## 5.2 Per-agent contracts

### 5.2.1 Scanner Agent

- **Job:** Read one product's ingredient list → flag the ingredients of concern
- **Input:** `{ product: { id, name, ingredients_parsed[] } }`
- **Output:** `{ product_id, flagged: [{ inci_name, position, hazard_tags[], known_in_db: bool }] }`
- **Logic:** First, look up each INCI in `ingredients` table. If known + has hazard tags, flag it. If unknown (~5% of cases), call LLM with strict prompt to classify.
- **LLM use:** Only for unknown ingredients (DB-first).

### 5.2.2 Profile Reasoner

- **Job:** Given user profile + scanner results, rank flagged ingredients by relevance to *this* user
- **Input:** `{ profile: {...}, scans: [...] }`
- **Output:** `{ flagged: [{ ingredient_id, product_id, relevance: 'high'|'medium'|'low', reason }] }`
- **Logic:** Cross-reference flagged ingredient's `goals_against` field against user's `skin_goals`; ingredients targeting a stated goal get bumped to high. Skin type matters (sensitive skin → irritant tags bumped).
- **LLM use:** Yes — the ranking is judgment-y, LLM does it well.

### 5.2.3 Analogy Writer

- **Job:** Generate one analogy line + full explanation for one flagged ingredient, calibrated to one user goal
- **Input:** `{ ingredient: {...}, profile: {...}, goal_slug: str }`
- **Output:** `{ analogy_one_liner: str, full_explanation: str, source: 'curated'|'llm', fact_check_passed: bool }`
- **Logic:** Look up `analogies` table by `(ingredient_id, goal_slug)`. If hit → use curated. If miss → call LLM with strict prompt (must obey three rules: respect dose, respect goal, be true). Run a fact-check pass: a second LLM call asks "is this analogy accurate to the chemistry?"
- **LLM use:** Yes for misses; fact-check pass is also LLM.

### 5.2.4 Alternative Finder

- **Job:** Suggest 1–3 cleaner products for a flagged product
- **Input:** `{ category_slug, avoid_tags[], profile }`
- **Output:** `{ alternatives: [{ name, brand, price, image_url, url, reason }] }`
- **Logic:** Query `alternatives` table where `category_slug` matches, `free_of_tags` covers `avoid_tags`, and `good_for_skin_types` includes user's skin type. Sort by goal-match.
- **LLM use:** Optional fallback only when no curated match exists.

### 5.2.5 Regulatory Cross-ref

- **Job:** For each flagged ingredient, list every regulatory ban
- **Input:** `{ ingredient_ids: [uuid] }`
- **Output:** `{ bans: [{ ingredient_id, region, regulation_ref, source_url, reason }] }`
- **Logic:** Pure SQL query against `bans` table. No LLM — we want exact citations, not paraphrased ones.
- **LLM use:** None.

## 5.3 Why this architecture wins for Kiro

- Each sub-agent gets its own **spec file** in `.kiro/specs/`
- Each sub-agent's prompt is a **steering rule** (`steering/agent-analogy-rules.md`)
- A **hook** validates that every agent class has matching spec + tests on save
- The orchestrator pattern is **multi-agent, spec-driven, schema-locked** — the exact thing Kiro is built to reward

---

# 6. Database — Supabase

## 6.1 Connection model

- **Backend (FastAPI)** uses the **service role key** — full read/write, bypasses RLS. Lives only in backend env.
- **Frontend** uses the **anon key** with RLS — can read public tables (`ingredients`, `categories`, `products`, `alternatives`, `bans`, `analogies`); can read/write only its own user's rows in `profiles`, `user_products`, `analyses`.
- **Anthropic key** lives only on backend.

## 6.2 RLS overview

| Table | Public read (anon) | Auth read (own row) | Auth write (own row) |
| --- | --- | --- | --- |
| `categories` | ✅ |  |  |
| `products` | ✅ |  |  |
| `ingredients` | ✅ |  |  |
| `bans` | ✅ |  |  |
| `analogies` | ✅ |  |  |
| `alternatives` | ✅ |  |  |
| `profiles` |  | ✅ (own) | ✅ (own) |
| `user_products` |  | ✅ (own) | ✅ (own) |
| `analyses` |  | ✅ (own) | service-role only |
| `analysis_runs` |  | service-role only | service-role only |

---

# 7. Database Schemas (SQL DDL)

All tables use UUID primary keys (`gen_random_uuid()`). `created_at` / `updated_at` are `timestamptz default now()`.

## 7.1 `profiles` — user onboarding profile

```sql
create table profiles (
  id                  uuid primary key references auth.users(id) on delete cascade,
  display_name        text,
  age_range           text not null check (age_range in ('under_18','18_24','25_34','35_44','45_54','55_plus')),
  gender              text not null check (gender in ('female','male','non_binary','prefer_not_to_say')),
  skin_type           text not null check (skin_type in ('sensitive','dry','oily','combination','normal')),
  skin_goals          jsonb not null default '[]',         -- ['reduce_acne','hydration']
  allergies           jsonb not null default '[]',         -- free-text array
  life_stage          text check (life_stage in ('none','pregnant','nursing','ttc','parent_of_infant')),  -- P1
  onboarding_complete boolean not null default false,
  created_at          timestamptz not null default now(),
  updated_at          timestamptz not null default now()
);

alter table profiles enable row level security;
create policy "users can read own profile" on profiles for select using (auth.uid() = id);
create policy "users can upsert own profile" on profiles for insert with check (auth.uid() = id);
create policy "users can update own profile" on profiles for update using (auth.uid() = id);
```

## 7.2 `categories` — product category reference

```sql
create table categories (
  slug                       text primary key,    -- 'shampoo','conditioner','body_wash',...
  display_name               text not null,
  display_order              int  not null default 0,
  is_required_in_onboarding  boolean not null default false,
  icon                       text                  -- emoji or icon name
);
```

Seed values:

```
shampoo, conditioner, body_wash, face_cleanser, moisturizer, sunscreen,
deodorant, toothpaste, lip_balm, makeup_foundation, serum, eye_cream
```

## 7.3 `products` — master product cache (Open Beauty Facts + LLM-resolved + user-pasted)

```sql
create table products (
  id                 uuid primary key default gen_random_uuid(),
  off_id             text unique,                          -- Open Beauty Facts barcode/slug
  name               text not null,
  brand              text,
  category_slug      text references categories(slug),
  ingredients_raw    text,                                 -- original comma-separated string
  ingredients_parsed jsonb not null default '[]',          -- normalized INCI array
  image_url          text,
  source             text not null default 'open_beauty_facts',  -- 'open_beauty_facts' | 'llm_resolved' | 'user_paste'
  popularity         int not null default 0,               -- for the common-products picker
  last_fetched_at    timestamptz,
  created_at         timestamptz not null default now()
);

create extension if not exists pg_trgm;
create index products_name_trgm   on products using gin (name gin_trgm_ops);
create index products_brand_trgm  on products using gin (brand gin_trgm_ops);
create index products_category    on products (category_slug);
create index products_popularity  on products (category_slug, popularity desc);
```

## 7.4 `ingredients` — master ingredient database

```sql
create table ingredients (
  id              uuid primary key default gen_random_uuid(),
  inci_name       text not null unique,                    -- 'Sodium Lauryl Sulfate'
  common_name     text,                                    -- 'SLS'
  cas_number      text,                                    -- '151-21-3'
  category        text,                                    -- 'surfactant','preservative','emollient',...
  function_short  text,                                    -- 'cleanses','preserves'
  plain_english   text not null,                           -- short factual description
  hazard_tags     jsonb not null default '[]',             -- ['irritant','drying']
  goals_against   jsonb not null default '[]',             -- ['reduce_sensitivity','more_hydration']
  bad_for_skin_types jsonb not null default '[]',          -- ['sensitive','dry']
  dose_notes      text,                                    -- 'Fine ≤1%; concerning daily ≥1%'
  created_at      timestamptz not null default now()
);

create index ingredients_inci_trgm  on ingredients using gin (inci_name gin_trgm_ops);
create index ingredients_tags       on ingredients using gin (hazard_tags);
create index ingredients_goals      on ingredients using gin (goals_against);
```

## 7.5 `product_ingredients` — link table

```sql
create table product_ingredients (
  product_id    uuid references products(id) on delete cascade,
  ingredient_id uuid references ingredients(id) on delete cascade,
  position      int,                                       -- order in INCI list (~ concentration)
  primary key (product_id, ingredient_id)
);

create index product_ingredients_ingredient on product_ingredients (ingredient_id);
```

## 7.6 `bans` — regulatory bans by region

```sql
create table bans (
  id              uuid primary key default gen_random_uuid(),
  ingredient_id   uuid not null references ingredients(id) on delete cascade,
  region          text not null,                           -- 'EU','US','California','Canada','Japan'
  status          text not null check (status in ('banned','restricted','requires_warning')),
  regulation_ref  text,                                    -- 'Reg. EC 1223/2009 Annex II entry 1372'
  source_url      text,
  reason          text,
  effective_date  date,
  created_at      timestamptz not null default now()
);

create index bans_ingredient on bans (ingredient_id);
create index bans_region     on bans (region);
```

## 7.7 `analogies` — curated analogy templates

```sql
create table analogies (
  id               uuid primary key default gen_random_uuid(),
  ingredient_id    uuid not null references ingredients(id) on delete cascade,
  goal_slug        text,                                   -- nullable: null = generic analogy
  analogy_one_liner text not null,                         -- 'Sulfates are like sugar.'
  full_explanation text not null,                          -- 2–4 sentences with dose + goal + outcome
  source           text not null default 'curated' check (source in ('curated','llm_generated')),
  fact_check_passed boolean not null default true,
  created_at       timestamptz not null default now(),
  unique (ingredient_id, goal_slug)
);

create index analogies_ingredient on analogies (ingredient_id);
```

## 7.8 `alternatives` — cleaner alternative products

```sql
create table alternatives (
  id                  uuid primary key default gen_random_uuid(),
  category_slug       text not null references categories(slug),
  product_name        text not null,
  brand               text not null,
  free_of_tags        jsonb not null default '[]',         -- ['sulfate_free','paraben_free','fragrance_free']
  good_for_skin_types jsonb not null default '[]',         -- ['sensitive','dry']
  good_for_goals      jsonb not null default '[]',
  avg_price_usd       numeric(10,2),
  url                 text,
  image_url           text,
  reason              text,                                -- one-liner shown in SwapCard
  created_at          timestamptz not null default now()
);

create index alternatives_category on alternatives (category_slug);
create index alternatives_free_tags on alternatives using gin (free_of_tags);
```

## 7.9 `user_products` — which products a user owns

```sql
create table user_products (
  id                 uuid primary key default gen_random_uuid(),
  user_id            uuid not null references auth.users(id) on delete cascade,
  product_id         uuid references products(id) on delete cascade,    -- nullable: paste path
  category_slug      text references categories(slug),
  custom_name        text,                                 -- when user pasted their own product
  custom_ingredients text,                                 -- raw paste, parsed by backend
  added_at           timestamptz not null default now()
);

create index user_products_user on user_products (user_id);
alter table user_products enable row level security;
create policy "users see own products" on user_products for select using (auth.uid() = user_id);
create policy "users insert own products" on user_products for insert with check (auth.uid() = user_id);
create policy "users delete own products" on user_products for delete using (auth.uid() = user_id);
```

## 7.10 `analyses` — cached orchestrator output per user

```sql
create table analyses (
  id                uuid primary key default gen_random_uuid(),
  user_id           uuid not null references auth.users(id) on delete cascade,
  status            text not null default 'pending' check (status in ('pending','running','completed','failed')),
  profile_snapshot  jsonb not null,                        -- snapshot of profile at analysis time
  user_product_ids  jsonb not null default '[]',           -- snapshot of products analyzed
  output            jsonb,                                 -- full composed orchestrator output
  llm_model         text,                                  -- 'claude-sonnet-4-5' etc.
  total_tokens      int,
  duration_ms       int,
  error             text,
  created_at        timestamptz not null default now(),
  completed_at      timestamptz
);

create index analyses_user on analyses (user_id, created_at desc);
alter table analyses enable row level security;
create policy "users read own analyses" on analyses for select using (auth.uid() = user_id);
-- Inserts and updates go through backend (service role).
```

## 7.11 `analysis_runs` — per-agent invocation log

```sql
create table analysis_runs (
  id           uuid primary key default gen_random_uuid(),
  analysis_id  uuid not null references analyses(id) on delete cascade,
  agent_name   text not null,                              -- 'orchestrator','scanner','profile_reasoner',...
  input        jsonb,
  output       jsonb,
  duration_ms  int,
  tokens_used  int,
  error        text,
  created_at   timestamptz not null default now()
);

create index analysis_runs_analysis on analysis_runs (analysis_id);
```

---

# 8. API Endpoints

Base URL: `https://api.dermadecode.app/api` (prod) or `http://localhost:8000/api` (dev). All endpoints return JSON. Auth via `Authorization: Bearer <supabase_jwt>` unless marked Public.

## 8.1 Health

### `GET /api/health`

**Auth:** Public.

**Response 200:**

```json
{ "status": "ok", "version": "0.1.0", "timestamp": "2026-04-24T18:00:00Z" }
```

## 8.2 Profile

### `GET /api/profile`

**Auth:** Required.

**Response 200:**

```json
{
  "id": "d2e1...",
  "display_name": "Maya",
  "age_range": "25_34",
  "gender": "female",
  "skin_type": "sensitive",
  "skin_goals": ["reduce_acne", "reduce_sensitivity"],
  "allergies": ["fragrance"],
  "life_stage": "none",
  "onboarding_complete": true,
  "created_at": "2026-04-24T17:30:00Z",
  "updated_at": "2026-04-24T17:30:00Z"
}
```

### `PATCH /api/profile`

**Auth:** Required.

**Request body** (partial):

```json
{ "skin_goals": ["anti_aging", "hydration"] }
```

**Response 200:** updated profile (same shape as GET).

## 8.3 Onboarding

### `POST /api/onboarding/profile`

Saves steps 1–3 of the wizard.

**Auth:** Required.

**Request body:**

```json
{
  "display_name": "Maya",
  "age_range": "25_34",
  "gender": "female",
  "skin_type": "sensitive",
  "skin_goals": ["reduce_acne", "reduce_sensitivity"],
  "allergies": ["fragrance"]
}
```

**Response 201:** profile object.

### `POST /api/onboarding/products`

Saves step 4 of the wizard. Accepts a batch.

**Auth:** Required.

**Request body:**

```json
{
  "products": [
    { "category_slug": "shampoo",     "product_id": "5b7c..." },
    { "category_slug": "conditioner", "product_id": "7e34..." },
    { "category_slug": "face_cleanser", "custom_name": "My homemade cleanser",
      "custom_ingredients": "Aqua, Glycerin, Sodium Lauryl Sulfate, ..." }
  ]
}
```

**Response 201:**

```json
{ "user_products": [ { "id": "...", "category_slug": "shampoo", "product_id": "5b7c..." }, ... ] }
```

### `POST /api/onboarding/complete`

Marks onboarding complete and triggers the first analysis.

**Auth:** Required.

**Response 202:**

```json
{ "analysis_id": "a91d...", "status": "pending" }
```

Frontend should immediately open the SSE stream at `/api/analyze/{analysis_id}/stream`.

## 8.4 Products

### `GET /api/products/search?q=&category=`

Autocomplete via Open Beauty Facts + local cache.

**Auth:** Required.

**Query params:** `q` (string, min 2 chars), `category` (optional category_slug)

**Response 200:**

```json
{
  "results": [
    {
      "id": "5b7c...",
      "name": "Hydro Boost Water Gel",
      "brand": "Neutrogena",
      "category_slug": "moisturizer",
      "image_url": "https://images.openbeautyfacts.org/..."
    }
  ]
}
```

### `GET /api/products/common?category=moisturizer`

Returns top-50 common products for that category, used in the dropdown picker.

**Auth:** Required.

**Response 200:** same shape as search.

### `POST /api/products/resolve`

LLM-resolves a brand+name when OBF has no match. Used as fallback.

**Auth:** Required.

**Request body:**

```json
{ "brand": "Native", "name": "Coconut Vanilla Deodorant", "category_slug": "deodorant" }
```

**Response 200:**

```json
{
  "product": {
    "id": "3c81...",
    "name": "Coconut Vanilla Deodorant",
    "brand": "Native",
    "category_slug": "deodorant",
    "ingredients_parsed": ["Caprylic/Capric Triglyceride", "Stearyl Alcohol", "Tapioca Starch", "..."],
    "source": "llm_resolved"
  },
  "confidence": 0.78,
  "warning": "Ingredient list LLM-generated; please verify against the actual label."
}
```

## 8.5 Scan — camera input

Client-side capture, server-side resolution. Three flavors. All return a normalized `Product` shape so the dashboard can render the result the same way regardless of which method was used.

### `POST /api/scan/barcode`

Barcode is decoded client-side (ZXing WASM); we only hit the backend for the OBF lookup.

**Auth:** Required.

**Request body:**

```json
{ "barcode": "3600523417865", "category_hint": "shampoo" }
```

**Response 200 (found):**

```json
{
  "matched": true,
  "product": {
    "id": "5b7c...",
    "name": "Elseve Total Repair 5",
    "brand": "L'Oréal",
    "category_slug": "shampoo",
    "ingredients_parsed": ["Aqua", "Sodium Laureth Sulfate", "..."],
    "image_url": "https://images.openbeautyfacts.org/...",
    "source": "open_beauty_facts"
  }
}
```

**Response 200 (not found):**

```json
{
  "matched": false,
  "barcode": "3600523417865",
  "hint": "Barcode not in Open Beauty Facts. Try scanning the back of the product (Mode C) or paste the ingredient list."
}
```

### `POST /api/scan/label`

Front-of-product (extract brand+name then OBF lookup) **or** back-of-product (extract raw ingredient list) via Claude vision.

**Auth:** Required.

**Request body:**

```json
{
  "image_base64": "iVBORw0KGgoAAAANSUhEUgAA...",
  "mode": "back",
  "category_hint": "shampoo"
}
```

`mode` is `"front"` or `"back"`. `category_hint` is optional but improves OBF match quality on `front` mode.

**Response 200 (mode = front):**

```json
{
  "mode": "front",
  "extracted": { "brand": "Head & Shoulders", "product_name": "Classic Clean" },
  "confidence": 0.91,
  "matches": [
    {
      "id": "5b7c...",
      "name": "Head & Shoulders Classic Clean Shampoo",
      "brand": "Head & Shoulders",
      "category_slug": "shampoo",
      "image_url": "https://images.openbeautyfacts.org/...",
      "match_score": 0.94
    }
  ]
}
```

Frontend behavior on `mode=front`: if exactly 1 match with `match_score >= 0.85` → auto-select. Else show a picker.

**Response 200 (mode = back):**

```json
{
  "mode": "back",
  "extracted_text": "Aqua, Sodium Laureth Sulfate, Cocamidopropyl Betaine, Sodium Chloride, Zinc Pyrithione, Dimethicone, Parfum, Methylchloroisothiazolinone, Methylisothiazolinone",
  "ingredients_parsed": [
    "Aqua", "Sodium Laureth Sulfate", "Cocamidopropyl Betaine",
    "Sodium Chloride", "Zinc Pyrithione", "Dimethicone", "Parfum",
    "Methylchloroisothiazolinone", "Methylisothiazolinone"
  ],
  "confidence": 0.87,
  "product": {
    "id": "7e34...",
    "name": "Scanned product (back label)",
    "category_slug": "shampoo",
    "ingredients_parsed": [ "Aqua", "..." ],
    "source": "user_paste"
  }
}
```

Frontend behavior on `mode=back`: if `confidence >= 0.7` auto-add the product; else open the paste textarea pre-filled with `extracted_text` so the user can fix any OCR slips before confirming.

**Error responses:**

- `422 VALIDATION_ERROR` — image too large (> 10MB), unsupported format, or empty
- `502 LLM_FAILURE` — Claude vision call failed; client should let user retake the photo

### Notes on the camera flow

- Images are passed to Claude vision but **not stored** by default in MVP. P1 adds opt-in image storage in Supabase Storage so the user can re-OCR if a formula changes.
- Ingredient list normalization (handling line breaks, trailing periods, mid-word OCR errors) lives in `services/ocr.py`. The Scanner Agent receives the cleaned `ingredients_parsed` array, not the raw text.
- Barcode lookups are cached in `products.off_id`; a second user scanning the same product is a single DB hit.

## 8.6 User Products

### `GET /api/user-products`

**Auth:** Required.

**Response 200:**

```json
{
  "user_products": [
    {
      "id": "u1...",
      "category_slug": "shampoo",
      "product": {
        "id": "5b7c...",
        "name": "Head & Shoulders Classic Clean",
        "brand": "Head & Shoulders",
        "image_url": "..."
      },
      "added_at": "2026-04-24T17:35:00Z"
    }
  ]
}
```

### `POST /api/user-products`

Add a single product.

**Auth:** Required.

**Request body:**

```json
{ "category_slug": "face_cleanser", "product_id": "5b7c..." }
```

**Response 201:** user_product object.

### `DELETE /api/user-products/{id}`

**Auth:** Required.

**Response 204.**

## 8.7 Analyze — the centerpiece

### `POST /api/analyze`

Kicks off a fresh orchestrator run for the current user with their current profile + products.

**Auth:** Required.

**Request body** (optional):

```json
{ "force_refresh": false }
```

**Response 202:**

```json
{ "analysis_id": "a91d...", "status": "pending" }
```

### `GET /api/analyze/{id}`

Get full analysis result (whether pending, running, or completed).

**Auth:** Required (must own the analysis).

**Response 200 (completed):** see §8.7.1 below.

**Response 200 (running):** `{ "id": "...", "status": "running", "progress": { "agents_completed": 3, "total": 5 } }`

### `GET /api/analyze/{id}/stream`

Server-Sent Events stream of agent progress. Events:

```
event: agent.started
data: { "agent": "scanner", "timestamp": "..." }

event: agent.progress
data: { "agent": "scanner", "product": "Head & Shoulders", "flagged_count": 2 }

event: agent.done
data: { "agent": "scanner", "duration_ms": 1240 }

event: analysis.completed
data: { "analysis_id": "a91d..." }
```

### 8.7.1 Sample completed `analyses.output` (and the `GET /api/analyze/{id}` response body)

```json
{
  "id": "a91d4a91-...",
  "status": "completed",
  "created_at": "2026-04-24T17:40:00Z",
  "completed_at": "2026-04-24T17:40:18Z",
  "profile_snapshot": {
    "skin_type": "sensitive",
    "skin_goals": ["reduce_acne", "reduce_sensitivity"]
  },
  "summary": {
    "total_products": 5,
    "products_with_concerns": 3,
    "total_flagged_ingredients": 7,
    "total_banned_elsewhere": 2
  },
  "products": [
    {
      "user_product_id": "u1...",
      "product": {
        "name": "Head & Shoulders Classic Clean",
        "brand": "Head & Shoulders",
        "category_slug": "shampoo",
        "image_url": "..."
      },
      "flagged_ingredients": [
        {
          "inci_name": "Sodium Lauryl Sulfate",
          "position": 3,
          "hazard_tags": ["irritant", "drying"],
          "relevance_to_user": "high",
          "relevance_reason": "Targets your stated goal: reduce_sensitivity. Sensitive skin type compounds the effect.",
          "analogy": {
            "one_liner": "Sulfates are like sugar.",
            "full_explanation": "In moderation, sulfates clean effectively. But you're using a sulfate shampoo daily — like eating sugar at every meal. Your scalp's natural oils get stripped, the barrier weakens, and the dryness and sensitivity you flagged in your goals get worse, not better.",
            "source": "curated"
          },
          "banned_in": [
            {
              "region": "EU",
              "status": "restricted",
              "regulation_ref": "Reg. EC 1223/2009 Annex III",
              "source_url": "https://ec.europa.eu/...",
              "reason": "Restricted to <1% in leave-on products"
            }
          ]
        },
        {
          "inci_name": "Methylchloroisothiazolinone",
          "position": 18,
          "hazard_tags": ["sensitizer"],
          "relevance_to_user": "high",
          "relevance_reason": "Known sensitizer. You stated sensitive skin and a goal of reduce_sensitivity.",
          "analogy": {
            "one_liner": "MCI is like a smoke alarm in a paint factory.",
            "full_explanation": "It does its job (preserves the bottle from bacteria) but it's so reactive it can trigger your skin's alarm system. The EU caps it at 0.0015% for a reason. If you have sensitive skin, even a trace can read as 'attack' to your immune system, undoing the calm you're chasing.",
            "source": "curated"
          },
          "banned_in": [
            { "region": "EU", "status": "restricted", "regulation_ref": "Annex V/57", "source_url": "...", "reason": "Max 0.0015% in rinse-off only" }
          ]
        }
      ],
      "alternative": {
        "name": "Vanicream Free & Clear Shampoo",
        "brand": "Vanicream",
        "avg_price_usd": 9.99,
        "url": "https://...",
        "image_url": "...",
        "reason": "Sulfate-free and fragrance-free; matches your sensitive-skin profile and supports both stated goals."
      }
    }
  ]
}
```

## 8.8 Alternatives (standalone)

### `GET /api/alternatives?category=&avoid_tags=`

Used when user clicks "see more options" on a swap card.

**Auth:** Required.

**Query params:** `category` (slug), `avoid_tags` (comma-separated, e.g. `sulfate,fragrance`)

**Response 200:**

```json
{
  "alternatives": [
    {
      "id": "a1...",
      "name": "Vanicream Free & Clear Shampoo",
      "brand": "Vanicream",
      "category_slug": "shampoo",
      "free_of_tags": ["sulfate_free", "fragrance_free"],
      "good_for_skin_types": ["sensitive", "dry"],
      "avg_price_usd": 9.99,
      "url": "...",
      "image_url": "...",
      "reason": "Sulfate-free, fragrance-free, formulated for sensitive scalps."
    }
  ]
}
```

## 8.9 Ingredient deep dive (P2 Learn Mode)

### `GET /api/ingredient/{inci_name}`

**Auth:** Required.

**Response 200:**

```json
{
  "inci_name": "Sodium Lauryl Sulfate",
  "common_name": "SLS",
  "cas_number": "151-21-3",
  "category": "surfactant",
  "function_short": "cleanses",
  "plain_english": "A common detergent used to create lather...",
  "hazard_tags": ["irritant", "drying"],
  "goals_against": ["reduce_sensitivity", "more_hydration"],
  "dose_notes": "Concentrations above 1% in leave-on products are restricted in the EU.",
  "bans": [
    { "region": "EU", "status": "restricted", "regulation_ref": "Annex III", "source_url": "..." }
  ],
  "analogies": [
    { "goal_slug": "reduce_sensitivity", "one_liner": "Sulfates are like sugar.", "full_explanation": "..." },
    { "goal_slug": null, "one_liner": "Sulfates are like sugar.", "full_explanation": "..." }
  ],
  "products_containing": 142
}
```

## 8.10 Error response shape (all endpoints)

```json
{
  "error": {
    "code": "PRODUCT_NOT_FOUND",
    "message": "No product matched the supplied brand and name.",
    "details": { "brand": "Native", "name": "Lavender Mist" }
  }
}
```

**Error codes:** `UNAUTHORIZED` (401), `FORBIDDEN` (403), `NOT_FOUND` (404), `VALIDATION_ERROR` (422), `LLM_FAILURE` (502), `OBF_UNAVAILABLE` (503), `RATE_LIMITED` (429), `INTERNAL_ERROR` (500).

---

# 9. Environment Variables

## 9.1 Frontend (Vercel)

```
NEXT_PUBLIC_SUPABASE_URL=...
NEXT_PUBLIC_SUPABASE_ANON_KEY=...
NEXT_PUBLIC_API_BASE_URL=https://api.dermadecode.app
```

## 9.2 Backend (Railway)

```
SUPABASE_URL=...
SUPABASE_SERVICE_ROLE_KEY=...        # never exposed; bypasses RLS
SUPABASE_JWT_SECRET=...               # for verifying user tokens
ANTHROPIC_API_KEY=...
CLAUDE_MODEL=claude-sonnet-4-5        # configurable
OBF_BASE_URL=https://world.openbeautyfacts.org
ALLOWED_ORIGINS=https://dermadecode.app,http://localhost:3000
LOG_LEVEL=INFO
```

---

# 10. Deployment

| Service | Platform | Notes |
| --- | --- | --- |
| Frontend | **Vercel** | One-click via GitHub. Preview deploys on every PR. |
| Backend | **Railway** | Python 3.12 buildpack. `gunicorn -k uvicorn.workers.UvicornWorker`. |
| Database | **Supabase** (managed) | Free tier; SQL migrations applied via `supabase db push`. |
| LLM | **Anthropic API (Claude)** | API key in Railway env. |
| Domain | **Cloudflare** → Vercel + Railway | `dermadecode.app` → Vercel; `api.dermadecode.app` → Railway. |

## 10.1 First-deploy checklist

1. Create Supabase project. Apply schemas (§7) via `supabase db push`. Run seed scripts (`api/db/seed/*`).
2. Deploy backend to Railway with env vars from §9.2. Verify `/api/health` returns 200.
3. Deploy frontend to Vercel with env vars from §9.1. Verify landing page loads + magic-link signup works.
4. End-to-end smoke: sign up → onboard with one demo persona → confirm orchestrator runs → dashboard renders.

---

# 11. Related Docs

- **PMD** — sibling page in hub (the *why*)
- **Feature List** — sibling page in hub (the *what*)