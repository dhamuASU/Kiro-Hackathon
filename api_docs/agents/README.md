# Agents Implementation Guide

> **Your lane:** `api/services/agents/**`, `api/services/llm/**`, and `api/services/ocr.py`. **Nothing else.** The endpoints, the schemas, the DB, and the frontend are read-only reference for you. If you need a contract change, file a `request-master` changelog entry — see [`../README.md` §5](../README.md).

## 1. The mental model

You own the *what-the-engine-does*; Master owns the *how-it-talks-to-the-world*. Routers call your agents with Pydantic-validated inputs and expect Pydantic-validated outputs. Don't change the shapes — fill in the `NotImplementedError` stubs and make them obey the contracts already written above each one.

## 2. The lane (writable paths)

```
api/services/
├── agents/
│   ├── base.py                  # AbstractAgent — DON'T change shape
│   ├── orchestrator.py          # implement run_from_rows()
│   ├── scanner.py               # implement run()
│   ├── profile_reasoner.py      # implement run()
│   ├── analogy_writer.py        # implement run() + curated-first lookup
│   ├── alternative_finder.py    # implement run() + curated-first lookup
│   └── regulatory_xref.py       # implement run() — pure SQL, NO LLM
├── llm/
│   ├── client.py                # implement every NotImplementedError
│   └── prompts.py               # tune prompts, add new ones if needed
└── ocr.py                       # vision OCR wrappers used by /api/scan/label
```

Tests you may also write (Master will accept these without a request):
- `api/tests/test_agents_*.py` — one file per agent, mocked LLM client.

## 3. Read-only reference (do not edit, but read constantly)

| Path | Why you read it |
|---|---|
| `api/schemas/agent.py` | Input/output Pydantic models for every agent. **The contract.** |
| `api/schemas/analysis.py` | The `ProductAnalysis` and `FlaggedIngredient` shapes the orchestrator must compose into `analyses.output`. |
| `api/schemas/{ingredient,product,profile}.py` | Field types for `IngredientOut`, `ProductOut`, `ProfileOut`, `BanOut`, `AlternativeOut`. |
| `api/routers/analyze.py` | How `OrchestratorAgent.run_from_rows()` is invoked, and what the router writes back to `analyses` afterwards. |
| `api/routers/scan.py` | How vision OCR is called from `/api/scan/label`. |
| `api/services/events.py` | The `EventBus` used for SSE; you call `self.bus.emit(event, data)`. |
| `api/db/seed/*` | The seeded `ingredients`, `analogies`, `bans`, `alternatives` tables — your DB-first lookups go against these. |

## 4. The orchestrator pattern (the centerpiece)

`OrchestratorAgent.run_from_rows(analysis_id, profile_row, product_rows)` must:

1. Convert `profile_row` (raw Supabase dict) → `ProfileOut`.
2. Convert each `product_row` (with the joined `product:products(*)`) → `ProductOut`.
3. Run sub-agents **in this order, parallelizing per-product work where possible:**

```
asyncio.gather(*[ScannerAgent.run(ScannerInput(product=p)) for p in products])
        ↓ emit("scanner.done", {"product_count": len(products)})
ProfileReasonerAgent.run(ProfileReasonerInput(profile, scans))
        ↓ emit("profile_reasoner.done", {"flagged_count": len(ranked.flagged)})
asyncio.gather(*[AnalogyWriterAgent.run(AnalogyWriterInput(ingredient, profile, goal_slug))
                 for each ranked flagged item × user's primary goal])
        ↓ emit("analogy_writer.done", {"count": N})
asyncio.gather(*[AlternativeFinderAgent.run(AlternativeFinderInput(category_slug, avoid_tags, profile))
                 for each flagged product])
        ↓ emit("alternative_finder.done", {"count": N})
RegulatoryXrefAgent.run(RegulatoryXrefInput(ingredient_ids=unique_flagged_ids))
        ↓ emit("regulatory_xref.done", {"banned_count": N})
```

4. Compose the final list of `ProductAnalysis` dicts:
```python
[{
  "product": ProductOut.model_dump(),
  "flagged": [FlaggedIngredient(...).model_dump(), ...],   # see schemas/analysis.py
  "alternatives": [AlternativeOut.model_dump(), ...],
}, ...]
```

5. **Return** the list. The router (`routers/analyze.py:_run`) writes it to `analyses.output` and emits `done`. **Do not** write to `analyses` yourself — that's Master's job.

### Optional — but recommended — additional events

You may add `*.started` and `*.progress` events. Frontend tolerates unknown events. If you add them, write a changelog entry tagged `request-frontend` so they can render them nicely. Examples:

- `scanner.started` `{ product_id, name }` (per product)
- `analogy_writer.progress` `{ ingredient: "Sodium Lauryl Sulfate", source: "curated" }`

**Don't rename the `*.done` events** — those are the contract Frontend builds against today.

## 5. Per-agent contracts

> **Always read the docstrings on each stub file.** They contain the exact behavior the spec demands. The summaries below are reminders, not replacements.

### 5.1 ScannerAgent (`scanner.py`)
- **DB-first.** SELECT from `ingredients` by `inci_name` (case-insensitive trigram).
- If found and `hazard_tags` non-empty → flag with `known_in_db=True`.
- If not found → call `llm_client.classify_ingredient(inci_name, SCANNER_PROMPT)`. Flag iff `is_concerning=True`. Set `known_in_db=False`.
- **Preserve `position`** (index in INCI list) — Profile Reasoner and Analogy Writer both depend on it as a concentration proxy.
- LLM cost rule: don't call the LLM for known ingredients, ever.

### 5.2 ProfileReasonerAgent (`profile_reasoner.py`)
- Takes `(profile, scans)` and returns ranked flagged items.
- Cross-reference each flagged ingredient's `goals_against` (jsonb on `ingredients`) with the user's `skin_goals`. Intersect → bump to `high`.
- Bump again if the ingredient's `bad_for_skin_types` includes the user's `skin_type`.
- This is judgmental — call `llm_client.rank_ingredients(profile, flagged, PROFILE_REASONER_PROMPT)` and let the LLM produce the relevance + reason. The DB cross-reference can be your sanity-check filter.
- Output **must** also include the deduped `flagged_products: list[ProductOut]` (Master uses these to drive the alternative-finder fan-out).

### 5.3 AnalogyWriterAgent (`analogy_writer.py`) — the money agent
- **Curated first.** SELECT from `analogies` where `(ingredient_id, goal_slug)` matches. Fall back to `goal_slug IS NULL` (generic) if no goal-specific row exists.
- If curated → return with `source="curated"`, `fact_check_passed=True`. Done.
- If miss → `llm_client.write_analogy(ingredient, profile, goal_slug, ANALOGY_WRITER_PROMPT)` then **immediately** `llm_client.fact_check_analogy(analogy_one_liner, ingredient, ANALOGY_FACTCHECK_PROMPT)`. Set `source="llm"`, `fact_check_passed=<result>`.
- **The three rules are non-negotiable** and they belong to the product, not the prompt:
  1. Respect dose.
  2. Respect the user's goal.
  3. Be true. (That's what the fact-check pass exists for.)
- **Banned words** in any output, curated or generated: `TOXIC`, `POISON`, `AVOID AT ALL COSTS`, the "2 kg of chemicals" line. If you ever see these in your output, fail the fact-check and refuse to ship.

### 5.4 AlternativeFinderAgent (`alternative_finder.py`)
- Curated first. SELECT from `alternatives` WHERE `category_slug = :cat` AND `free_of_tags` covers `avoid_tags` AND `good_for_skin_types` includes the user's `skin_type`. Sort by `good_for_goals` overlap with `profile.skin_goals`.
- LLM fallback only when zero curated rows: `llm_client.find_alternatives(category_slug, avoid_tags, profile, ALTERNATIVE_FINDER_PROMPT)`.
- Return 1–3 items.

### 5.5 RegulatoryXrefAgent (`regulatory_xref.py`)
- **Pure SQL. No LLM.** SELECT from `bans` WHERE `ingredient_id = ANY(:ids)`. Return `BanOut[]`.
- Citations must be exact. Don't paraphrase regulation refs.

### 5.6 LLMClient (`api/services/llm/client.py`)
- The `_get_client()` lazy-init is fine — leave it.
- Implement every `NotImplementedError`. Inputs and outputs are spelled out in each docstring.
- **JSON-returning methods MUST return parsed dict/list.** No markdown code fences in the returned strings. If the model wraps in ` ```json ... ``` `, strip it.
- All methods are `async`; use `httpx.Timeout` discipline (set a reasonable timeout — e.g. 30 s — and re-raise on overrun).
- The model id and API key live in `settings` (Master's config). Don't hard-code either.

### 5.7 OCR (`api/services/ocr.py`)
- Two functions to implement, both wrappers over `llm_client.extract_label_front` / `extract_label_back`.
- Normalize the parsed ingredients: split on `,` and `;`, strip parentheses for percentages, drop empty tokens, title-case INCI names.
- Return shapes mirror the router's response shape — see `api/routers/scan.py` and `api/schemas/scan.py`.

## 6. Prompt-engineering rules (`api/services/llm/prompts.py`)

The existing prompts in `prompts.py` were written by Master. **Tighten them, don't loosen them.** Each must:

1. End with a strict instruction: *"Return JSON only, no prose, no code fences."*
2. Encode the analogy-first product rules (dose, goal, truth; no fearmonger words).
3. Use few-shot examples sparingly — they cost tokens, but one good example beats five paragraphs of instruction. Add them to the most error-prone prompts (analogy writer, label OCR).

If you add a new prompt:
- Define it as a module-level `UPPERCASE_NAME = """..."""` string.
- Document its caller in a comment immediately above.
- Update `client.py` to accept and pass it.
- Write a changelog entry.

## 7. SSE event names — the frontend contract

Frontend listens for these literal strings in `EventBus.emit(event, data)`:

| Event | Payload |
|---|---|
| `scanner.done` | `{ product_count: int }` |
| `profile_reasoner.done` | `{ flagged_count: int }` |
| `analogy_writer.done` | `{ count: int }` |
| `alternative_finder.done` | `{ count: int }` |
| `regulatory_xref.done` | `{ banned_count: int }` |
| `done` (emitted by the router, not you) | `{ analysis_id: str }` |
| `error` (emitted by the router on exception) | `{ detail: str }` |

You are free to emit additional events (`*.started`, `*.progress`) **but do not rename or remove the `*.done` set** without a `request-frontend` changelog entry that the frontend has acknowledged.

## 8. Output composition rules (matter for the dashboard rendering)

When you build the final `ProductAnalysis[]`:

- **Order `flagged` by relevance**: `high` → `medium` → `low`, then by `position` ascending.
- **Carry the analogy onto each FlaggedIngredient**: the dashboard renders the analogy line as the hero of every flagged row. If `fact_check_passed=False`, leave `analogy_one_liner=None` so the frontend hides it instead of showing a bad analogy.
- **Carry bans onto each FlaggedIngredient**: do the join in the orchestrator (don't make the frontend re-fetch).
- **Alternatives are per-product**, not per-ingredient.

## 9. Testing — what counts as done

For each agent you ship:

1. Write `api/tests/test_agents_<name>.py`.
2. Patch `llm_client` (use `unittest.mock.AsyncMock`). Don't make real LLM calls in tests.
3. Cover at least:
   - The DB-hit branch (curated / known ingredient).
   - The LLM-fallback branch (unknown ingredient / missing analogy).
   - The fact-check-fails branch where applicable.
4. Run `pytest api/tests/ -q` — must be green.
5. Run `ruff check api/services/` — must be clean.

## 10. DOs

- ✅ Implement the `NotImplementedError` stubs **without** changing input/output schemas.
- ✅ DB-first wherever possible. LLM is the fallback, not the default.
- ✅ Use `asyncio.gather` for per-item fan-out (scanner, analogy writer, alternative finder).
- ✅ Emit the `*.done` SSE events at the documented points.
- ✅ Read `api/schemas/agent.py` and `api/schemas/analysis.py` until they're memorized.
- ✅ Mock the LLM client in tests.
- ✅ File a `request-master` changelog entry the moment you need a new schema field, env var, or DB column.
- ✅ File a `request-frontend` changelog entry if you want to add new SSE events that the UI should render.
- ✅ Keep prompts strict-JSON-only. Strip code fences in the parser.

## 11. DON'Ts

- ❌ **Do not** edit anything under `api/routers/`, `api/schemas/`, `api/db/`, `api/main.py`, `api/config.py`, `api/deps.py`, or `web/`
- ❌ **Do not** rename or remove the `*.done` SSE events
- ❌ **Do not** call the LLM for ingredients already in the DB
- ❌ **Do not** ship an analogy that uses `TOXIC`, `POISON`, `AVOID AT ALL COSTS`, or any "2 kg of chemicals/year" framing
- ❌ **Do not** name a model brand in any prompt, docstring, or output string the user might see. Generic "the analysis", "our agents", "the engine" only.
- ❌ **Do not** write to the `analyses` or `analysis_runs` tables — the router does that
- ❌ **Do not** add Python dependencies without filing a request to Master
- ❌ **Do not** silence errors. Raise them; the router wraps them as `LLM_FAILURE` (502).
- ❌ **Do not** hard-code the model id or API key — read `config.settings`.
- ❌ **Do not** persist generated analogies to the `analogies` table without Master's approval (curated rows are hand-vetted; we'll add an `auto_generated=True` column before allowing that — file a request).

## 12. Local dev

```bash
cd api && uvicorn main:app --reload --port 8000
# in another terminal:
pytest api/tests/ -q
```

Tail the server while you implement — the router logs the orchestrator's exception when an agent raises, which is the fastest way to find a contract mismatch.

## 13. When you ship a change

1. Branch: `agents/<short-slug>` (e.g. `agents/orchestrator-impl`, `agents/scanner-db-first`).
2. `pytest api/tests/ -q` and `ruff check api/services/` both green.
3. End-to-end smoke: `POST /api/analyze` against a seeded test user and watch the SSE stream emit all five `*.done` events. Then `GET /api/analyze/{id}` and verify `output` is non-empty and shaped like `ProductAnalysis[]`.
4. Write a changelog entry in `api_docs/changelog/` — see [`../changelog/README.md`](../changelog/README.md) for the filename pattern and required sections.
5. Open a PR. Tag any `request-master` or `request-frontend` slugs you depend on.

When in doubt: **the schema is the contract**. Read `api/schemas/agent.py` and `api/schemas/analysis.py` first, then write code that satisfies them.
