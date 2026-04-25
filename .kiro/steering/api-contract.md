# API Contract

Base URL (dev): `http://localhost:8000/api`
Base URL (prod): `https://api.cleanlabel.app/api`

All endpoints return JSON. Authentication is a Supabase JWT passed as
`Authorization: Bearer <token>` except where marked `Public`. The JWT is
HS256-signed with `SUPABASE_JWT_SECRET`; backend verifies `aud=authenticated`.

The single source of truth for request/response shapes is
`api/schemas/*.py`; OpenAPI is generated from it at `GET /docs`.

## Endpoints

### Health
```
GET  /api/health                                    # Public
```

### Profile
```
GET   /api/profile                                  → ProfileOut
POST  /api/profile                                  → ProfileOut   (upsert)
PATCH /api/profile                                  → ProfileOut
```

### Onboarding (steps 1–5 of the wizard)
```
POST /api/onboarding/profile        → ProfileOut
POST /api/onboarding/products       → { user_products: [...] }
POST /api/onboarding/complete       → 202 AnalysisCreateResponse
                                      (kicks off first analysis)
```

### Products
```
GET  /api/products/search?q=&category_slug=         → ProductSearchResult
GET  /api/products/common?category_slug=            → ProductSearchResult
POST /api/products/resolve                          → ProductResolveResponse
     body: { brand, name, category_slug }          # LLM fallback when OBF misses
```

### Scan (camera input — owned by agents teammate for OCR)
```
POST /api/scan/barcode                              → BarcodeMatched | BarcodeUnmatched
     body: { barcode, category_hint? }
POST /api/scan/label                                → LabelFrontResponse | LabelBackResponse
     body: { image_base64, mode: "front"|"back", category_hint? }
```

### User products
```
GET    /api/user-products                           → { user_products: [...] }
POST   /api/user-products                           → UserProductOut
DELETE /api/user-products/{id}                      → 204
```

### Analyze (the centerpiece)
```
POST /api/analyze                                   → 202 { analysis_id, status }
GET  /api/analyze/{id}                              → AnalysisOut
GET  /api/analyze/{id}/stream                       → SSE stream
```

**SSE events:**
```
event: agent.started / agent.progress / agent.done
data:  {"agent": "scanner", ...}

event: analysis.completed
data:  {"analysis_id": "..."}
```

### Alternatives (standalone catalog query)
```
GET /api/alternatives?category_slug=&avoid_tags=&skin_type=
                                                    → [AlternativeOut]
```

### Ingredient deep-dive (P2)
```
GET /api/ingredient/{inci_name}                     → IngredientOut
```

## Error envelope (all non-2xx)

```json
{
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Human-readable summary",
    "details": { "errors": [...] }
  }
}
```

**Codes:**
`UNAUTHORIZED` (401) · `FORBIDDEN` (403) · `NOT_FOUND` (404) ·
`VALIDATION_ERROR` (400, 422) · `LLM_FAILURE` (502) · `OBF_UNAVAILABLE` (503) ·
`RATE_LIMITED` (429) · `INTERNAL_ERROR` (500)

Handlers in `api/main.py` wrap every error into this envelope — do not leak
framework-default `{"detail": ...}` responses past the wrapper.

## Response conventions

- **IDs** are UUIDs (strings in JSON).
- **Timestamps** are ISO 8601 UTC strings.
- **JSONB columns** round-trip as JSON (no stringified payloads).
- **202** is used when an analysis is kicked off; the client polls
  `GET /api/analyze/{id}` or opens the SSE stream with the returned
  `analysis_id`.
