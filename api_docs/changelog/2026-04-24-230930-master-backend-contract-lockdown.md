---
date: 2026-04-24T23:09:30Z
agent: master
type: change
status: shipped
tags: [backend, routers, schemas, error-envelope]
references: []
---

# Backend contract lockdown — routers, scan/resolve wire-up, error envelope

## Why

Audited Kiro's backend output against the Notion Tech Doc §8 and Feature
List §2.3–2.12. Found real logic bugs that would break or silently corrupt
the demo, plus two spec'd endpoints that were schema-defined but never wired
up. Fixed every issue in the "Master" lane so the contract the Agents and
Frontend teammates build against is actually what the doc promises.

## What changed

- **`routers/analyze.py`**: `completed_at` was storing the literal string
  `"now()"` against a `timestamptz` column — replaced with
  `datetime.now(timezone.utc).isoformat()`. Also now writes
  `llm_model = settings.claude_model` when an analysis completes, so the
  `analyses` row matches the schema.
- **`routers/alternatives.py`**: accepted `avoid_tags` and `skin_type` query
  params but completely ignored them, just returned the first 10 rows by
  category. Rewrote with a proper filter:
  `free_of_tags ⊇ avoid_tags` AND (`skin_type ∈ good_for_skin_types` or
  `good_for_skin_types` is empty).
- **`routers/scan.py`**: full rewrite. Response shapes now match §8.5 of
  the Tech Doc: `BarcodeMatched | BarcodeUnmatched` union for the barcode
  endpoint; `LabelFrontResponse | LabelBackResponse` union for label OCR.
  Added the spec's `category_hint` field, 10 MB base64 size cap,
  `VALIDATION_ERROR` on bad input, `LLM_FAILURE` envelope on OCR errors,
  and fuzzy front-label match scoring against the local products cache.
- **`routers/products.py`**: added the spec'd `POST /api/products/resolve`
  endpoint (schemas already existed, router did not). Persists resolved
  products with `source="llm_resolved"` and surfaces a warning when
  confidence < 0.7.
- **`schemas/scan.py`**: new Pydantic models for the scan request/response
  pairs so OpenAPI reflects the real contract.
- **`schemas/errors.py`**: new `ErrorBody` / `ErrorResponse` envelope
  matching Tech Doc §8.10; `code_for_status()` maps HTTP codes to the
  spec's `VALIDATION_ERROR`, `UNAUTHORIZED`, etc.
- **`main.py`**: three global exception handlers — Starlette `HTTPException`
  (covers FastAPI's subclass and 404 routing errors), `RequestValidationError`
  (422 body failures), and a catch-all `Exception` handler. Every non-2xx
  response is now `{ error: { code, message, details } }` exactly as §8.10
  requires. No more bare `{ "detail": "..." }` leaks.
- **`config.py`** + **`.env.example`**: promoted `CLAUDE_MODEL` and
  `OBF_BASE_URL` (and a reserved `DEMO_MODE`) out of hardcoded constants
  and into env-driven settings. `services/llm/client.py` and
  `services/open_beauty_facts.py` now read from `settings`.

## Files touched

- `api/main.py`
- `api/config.py`
- `api/.env.example`
- `api/routers/analyze.py`
- `api/routers/alternatives.py`
- `api/routers/scan.py`
- `api/routers/products.py`
- `api/schemas/scan.py` (new)
- `api/schemas/errors.py` (new)
- `api/services/open_beauty_facts.py`
- `api/tests/test_analyze.py` (rewritten to real smoke tests)

## Cross-agent requests

None. Everything here is in Master's lane.

## Risks / rollback

- The envelope handler is registered on the Starlette base `HTTPException`,
  not FastAPI's. This catches the 404-from-routing case that FastAPI's own
  subclass misses. If you need to revert, swap the import back to
  `from fastapi import HTTPException` on the handler decorator.
- The scan router's `_MAX_IMAGE_B64_BYTES = 14 MB` accounts for base64's
  33% inflation — tune up if users complain about false rejects on larger
  images.
- `datetime.now(timezone.utc).isoformat()` → PG will coerce to `timestamptz`.
  If your Supabase client serializes datetimes differently, switch to the
  dict-level `default now()` by omitting the field entirely.
- `POST /api/products/resolve` currently has no rate-limit. Low demo risk;
  add a Redis token bucket if production usage picks up.

## Smoke test

7/7 pytest pass. Curl verified 200 on `/api/health`, 401 on bad JWT with
envelope, 403 on missing auth with envelope, 404 on unknown route with
envelope. All 20 spec'd endpoints register + appear in `openapi.json`.
