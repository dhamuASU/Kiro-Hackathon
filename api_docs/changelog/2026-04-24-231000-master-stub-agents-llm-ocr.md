---
date: 2026-04-24T23:10:00Z
agent: master
type: change
status: shipped
tags: [agents-lane, stubs, contract]
references: []
---

# Clean-slate stubs for agents/LLM/OCR with contract docstrings

## Why

The Kiro scaffold shipped working-but-rough implementations for all five
sub-agents, the LLM client, and the OCR dispatch. Agents teammate wants a
clean slate so they can own the implementations end-to-end. We replaced
the rough drafts with stubs whose signatures + docstrings are the contract
— nothing else in the repo has to change when the teammate fills them in.

## What changed

**All stubs share the same pattern:** signature preserved, body replaced
with `raise NotImplementedError(...)`, module and method docstrings now
carry the full contract (inputs, outputs, logic hints, rules from the
spec).

- `api/services/agents/scanner.py` — DB-first + LLM-for-unknowns rule
  documented; schemas unchanged.
- `api/services/agents/profile_reasoner.py` — flattening + LLM-rank +
  ingredient_id resolution rule documented; schemas unchanged.
- `api/services/agents/analogy_writer.py` — curated-first + LLM fallback
  + fact-check pass documented; the four analogy rules
  (dose/goal/true/never-"TOXIC") called out inline.
- `api/services/agents/alternative_finder.py` — DB query + filter rule
  documented. **Explicit warning:** Kiro's draft inverted the filter
  (matched alts whose `free_of_tags` shared NONE of the avoid_tags, plus
  `or` where it should have been `and`). Docstring flags this so the
  teammate gets it right first time.
- `api/services/agents/regulatory_xref.py` — pure SQL, NO LLM rule
  re-emphasized (Tech Doc is explicit).
- `api/services/agents/orchestrator.py` — six-step decomposition + the
  SSE event names (`scanner.done`, `profile_reasoner.done`, etc.)
  documented. Keeps the sub-agent wiring in `__init__` so the teammate
  can focus on `run_from_rows` body.
- `api/services/llm/client.py` — 8 methods stubbed with exact JSON shapes:
  `classify_ingredient`, `rank_ingredients`, `write_analogy`,
  `fact_check_analogy`, `find_alternatives`, `resolve_product`,
  `extract_label_front`, `extract_label_back`. The `_get_client()`
  lazy-init helper is real (not stubbed) so the teammate doesn't need
  to rewrite it.
- `api/services/llm/prompts.py` — kept as-is. Product-level content
  (analogy rules, fact-check rules) belongs in here; tune freely.
- `api/services/ocr.py` — kept the dispatch logic but clearly documented
  that vision work lives downstream in the LLM client.

**Marker:** all stubs now carry the docstring header
`OWNED BY AGENTS TEAMMATE` at the top. `api_docs/README.md` §6 currently
still references the old phrasing for the grep target — one-line update
there will bring it in sync, or the teammate can grep either literal.

**Deleted:** `api/tests/test_agents.py` — tested Kiro's specific draft
logic (asserted `source="curated"`, etc.); it fails against any `raise
NotImplementedError` stub. Teammate will write their own tests alongside
their implementation.

## Files touched

- `api/services/agents/{base,orchestrator,scanner,profile_reasoner,analogy_writer,alternative_finder,regulatory_xref}.py`
- `api/services/llm/client.py`
- `api/services/ocr.py`
- `api/tests/test_agents.py` (deleted)

## Cross-agent requests

- **Agents teammate:** every stub method has a filled-in docstring with
  the contract. Read the docstring before you write code. Do NOT change
  the method signatures or the return shapes — those are the contract
  between you and the routers. If a return field is missing that you
  need, file a `request-master` changelog entry with the specific
  additive change.

## Risks / rollback

- Until the stubs are implemented, any endpoint that hits the LLM
  (`POST /api/analyze`, `POST /api/products/resolve`, `POST /api/scan/label`)
  will return `500 INTERNAL_ERROR` (enveloped correctly by the new
  exception handlers). That's intentional — the demo flow needs the
  agents to be live.
- Pure-infra endpoints (`GET /api/health`, profile CRUD, product search
  against seeded data, `GET /api/alternatives`, `GET /api/user-products`)
  work today without any Agents implementation.
- Rollback: `git log api/services/agents/` and check out the previous
  versions if you need Kiro's draft behaviour for an emergency demo.
  Don't ship the draft logic — the AlternativeFinder filter bug is real.
