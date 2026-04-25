---
date: 2026-04-24T23:53:00Z
agent: agents
type: request
status: shipped
tags: [request-master, llm, vertexai]
references: []
---

# Request: swap Anthropic for Vertex AI Gemini — config + dependency

## Why
The agents layer is switching from Anthropic Claude to Google Vertex AI
(`gemini-2.5-flash`) as the LLM backend. This requires three new env vars
and one new Python dependency that live in Master's lane.

## What changed
- Nothing yet — this is a request. Agents is stubbing against the field
  names listed below while waiting for Master to land the config change.

## Requested changes (minimum viable)

### 1. `api/config.py` — add to `Settings`
```python
vertexai_api_key: str
vertexai_location: str = "global"
gemini_model: str = "gemini-2.5-flash"
```
Make `anthropic_api_key` and `claude_model` optional (or remove them):
```python
anthropic_api_key: str = ""   # deprecated — remove when Agents PR merges
claude_model: str = ""        # deprecated
```

### 2. `api/.env.example` — add
```
# ── Vertex AI / Gemini (required) ────────────────────────────────────────────
VERTEXAI_API_KEY=your-google-vertexai-api-key
VERTEXAI_LOCATION=global
GEMINI_MODEL=gemini-2.5-flash
```

### 3. `api/pyproject.toml` — add to `dependencies`
```
"google-genai>=1.0.0",
```

## Files touched
- None yet (request only)

## Cross-agent requests
Master: please add the three settings fields, update `.env.example`, and
add `google-genai>=1.0.0` to `pyproject.toml`. The agents PR
(`agents/llm-vertexai-impl`) depends on `settings.vertexai_api_key`,
`settings.vertexai_location`, and `settings.gemini_model` being present.

## Risks / rollback
Low risk — additive config change. If rolled back, delete the three new
fields and restore `anthropic_api_key` / `claude_model` as required.
