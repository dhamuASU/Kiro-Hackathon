# Project Structure

```
cleanlabel/
├── api/                         # FastAPI backend
│   ├── main.py                  # App, CORS, error-envelope handlers, routers
│   ├── config.py                # pydantic-settings (.env driven)
│   ├── deps.py                  # JWT verifier + Supabase client singleton
│   ├── pyproject.toml
│   ├── .env.example
│   ├── routers/                 # One module per endpoint cluster
│   │   ├── health.py
│   │   ├── profile.py
│   │   ├── onboarding.py
│   │   ├── products.py          # search, common, resolve (LLM fallback)
│   │   ├── scan.py              # barcode + label (front/back)
│   │   ├── user_products.py
│   │   ├── analyze.py           # POST + SSE stream
│   │   ├── ingredients.py       # deep-dive (P2)
│   │   └── alternatives.py      # standalone catalog query
│   ├── schemas/                 # Pydantic v2 contracts — source of truth
│   │   ├── profile.py
│   │   ├── product.py
│   │   ├── ingredient.py
│   │   ├── analysis.py
│   │   ├── agent.py             # Per-agent I/O schemas
│   │   ├── scan.py              # Scan request/response models
│   │   └── errors.py            # ErrorBody / ErrorResponse envelope
│   ├── services/
│   │   ├── agents/              # OWNED BY AGENTS TEAMMATE
│   │   │   ├── base.py          # AbstractAgent + emit helper
│   │   │   ├── orchestrator.py
│   │   │   ├── scanner.py
│   │   │   ├── profile_reasoner.py
│   │   │   ├── analogy_writer.py
│   │   │   ├── alternative_finder.py
│   │   │   └── regulatory_xref.py  (pure SQL — no LLM)
│   │   ├── llm/                 # OWNED BY AGENTS TEAMMATE
│   │   │   ├── client.py        # Anthropic AsyncAnthropic wrapper
│   │   │   └── prompts.py       # Analogy / scanner / reasoner prompts
│   │   ├── ocr.py               # OWNED BY AGENTS TEAMMATE — Claude vision dispatch
│   │   ├── events.py            # In-process SSE pub/sub (EventBus)
│   │   └── open_beauty_facts.py # OBF async client + product cache upsert
│   ├── db/
│   │   └── migrations/
│   │       ├── 001_initial_schema.sql     # tables, RLS, indexes, categories
│   │       └── 002_seed_reference_data.sql # ingredients/analogies/bans/alts/products
│   └── tests/
└── .kiro/
    ├── steering/                # product.md, api-contract.md, tech.md, structure.md, hackathon.md
    ├── specs/                   # Per-agent specs for the agents teammate
    ├── agents/                  # Role configs
    └── hooks/                   # Pre-commit / post-edit hooks
```

## Naming

- **Python modules:** snake_case.
- **Pydantic classes:** PascalCase; Create / Update / Out suffix for CRUD shapes.
- **Pydantic enums:** `Literal[...]` type aliases (see schemas/profile.py).
- **SQL tables:** snake_case, plural.
- **API routes:** kebab-case under `/api/` (e.g. `/user-products`).
- **Env vars:** UPPER_SNAKE (loaded via pydantic-settings into snake_case fields).
