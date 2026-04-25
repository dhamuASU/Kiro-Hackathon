---
date: 2026-04-24T23:58:00Z
agent: agents
type: change
status: shipped
tags: [llm, vertexai, agents, orchestrator, ocr, tests]
references:
  - 2026-04-24-235300-agents-request-vertexai-config.md
---

# Implement full agent layer — Vertex AI Gemini, 5 sub-agents, orchestrator, tests

## Why
The agent layer stubs needed full implementation to power the CleanLabel
ingredient analysis pipeline. Switched LLM backend from Anthropic Claude to
Google Vertex AI (`gemini-2.5-flash`) per product decision. All five sub-agents,
the orchestrator, OCR wrappers, prompts, and tests are now complete.

## What changed
- Replaced `anthropic` SDK with `google-genai` in `services/llm/client.py`;
  lazy-init `genai.Client(vertexai=True, location=settings.vertexai_location)`
- Implemented all 8 `LLMClient` methods; JSON methods use
  `response_mime_type="application/json"` for native enforcement
- `extract_label_back` normalizes ingredients: splits on `,`/`;`, strips
  parentheticals, title-cases INCI names, drops empty tokens
- `ScannerAgent`: DB-first via `ilike` on `ingredients`; LLM fallback only
  for unknown ingredients; preserves `position`
- `RegulatoryXrefAgent`: pure SQL against `bans` table; no LLM; empty-list
  short-circuit
- `ProfileReasonerAgent`: flattens flagged items across scans, calls LLM to
  rank, resolves `ingredient_id` via DB, deduplicates `flagged_products`
- `AnalogyWriterAgent`: curated-first (goal-specific → generic fallback);
  LLM path runs immediate fact-check; banned-word gate rejects TOXIC/POISON
- `AlternativeFinderAgent`: `avoid_tags ⊆ free_of_tags` superset filter;
  skin-type filter; goal-overlap ranking; LLM fallback when zero qualify
- `OrchestratorAgent.run_from_rows()`: full pipeline with `asyncio.gather`
  fan-outs; emits all 5 `*.done` SSE events in order; composes
  `ProductAnalysis[]` sorted by relevance then position; suppresses analogies
  where `fact_check_passed=False`
- Hardened all prompts with few-shot examples, banned-word rules, and
  `"Return JSON only, no prose, no code fences."` guardrail
- 7 test files covering DB-hit, LLM-fallback, fact-check-fail, banned-word,
  superset-filter, and SSE event ordering branches

## Files touched
- `api/services/llm/client.py`
- `api/services/llm/prompts.py`
- `api/services/agents/scanner.py`
- `api/services/agents/regulatory_xref.py`
- `api/services/agents/profile_reasoner.py`
- `api/services/agents/analogy_writer.py`
- `api/services/agents/alternative_finder.py`
- `api/services/agents/orchestrator.py`
- `api/tests/test_llm_client.py`
- `api/tests/test_agents_scanner.py`
- `api/tests/test_agents_regulatory_xref.py`
- `api/tests/test_agents_analogy_writer.py`
- `api/tests/test_agents_alternative_finder.py`
- `api/tests/test_agents_profile_reasoner.py`
- `api/tests/test_agents_orchestrator.py`

## Cross-agent requests
Master: see `2026-04-24-235300-agents-request-vertexai-config.md` — needs
`vertexai_api_key`, `vertexai_location`, `gemini_model` in `config.py` +
`.env.example`, and `google-genai>=1.0.0` in `pyproject.toml`. The agent
layer will not start without these three settings fields.

## Risks / rollback
- If Master has not yet landed the config change, the server will fail at
  import time with `AttributeError: Settings has no field vertexai_api_key`.
  Rollback: revert `services/llm/client.py` to the Anthropic stub.
- `RegulatoryXrefAgent` is pure SQL — zero LLM risk there.
- Analogies with `fact_check_passed=False` are suppressed (one_liner=None);
  the frontend must handle `null` analogy_one_liner gracefully.
