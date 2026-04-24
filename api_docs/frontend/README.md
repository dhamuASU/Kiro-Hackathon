# Frontend Implementation Guide

> **Your lane:** `web/**` only. The backend (`api/**`) is read-only reference for you. If you need a backend change, file a `request-master` changelog entry — see [`../README.md` §5](../README.md).

## 1. Stack (already decided — don't relitigate)

- **Next.js 14**, App Router, TypeScript strict
- **Tailwind CSS** + **shadcn/ui** primitives
- **Zustand** (local UI / wizard state) + **TanStack Query** (server state)
- **react-hook-form** + **zod** for forms (validate against generated types)
- **Supabase JS** for auth only (magic-link signup, session, JWT for outgoing requests)
- **`@zxing/browser`** for in-browser barcode decode (the `mode=barcode` scan path)
- **Vercel** deploy

## 2. Directory layout (mirrors the spec)

```
web/
├── app/
│   ├── layout.tsx
│   ├── page.tsx                          # Landing
│   ├── (auth)/
│   │   ├── login/page.tsx
│   │   └── callback/page.tsx
│   ├── (app)/
│   │   ├── layout.tsx                    # session-gated; redirect to /login
│   │   ├── onboarding/
│   │   │   ├── page.tsx                  # Wizard shell, steps 1–4
│   │   │   └── analyzing/page.tsx        # Step 5: agent theater + SSE
│   │   ├── dashboard/page.tsx            # Final analysis view
│   │   ├── product/[id]/page.tsx         # Per-product deep dive
│   │   └── settings/page.tsx
├── components/
│   ├── onboarding/
│   │   ├── StepProfile.tsx
│   │   ├── StepGoals.tsx
│   │   ├── StepAllergies.tsx
│   │   ├── StepProducts.tsx
│   │   ├── ProductPicker.tsx             # search + common-50 + paste + camera
│   │   ├── CameraCapture.tsx             # mode tabs: barcode | front | back
│   │   └── AgentTheater.tsx              # SSE listener + animated row per agent
│   ├── dashboard/
│   │   ├── ProfileHeader.tsx
│   │   ├── ProductCard.tsx
│   │   ├── IngredientRow.tsx             # analogy-first, banned chip, expand
│   │   ├── BannedChip.tsx
│   │   └── SwapCard.tsx
│   └── ui/                               # shadcn primitives
├── lib/
│   ├── api.ts                            # typed fetch wrappers
│   ├── supabase.ts                       # browser client (anon key)
│   ├── types.ts                          # GENERATED — never edit by hand
│   └── sse.ts                            # EventSource helper
└── store/
    ├── onboarding.ts
    └── session.ts
```

**Server components by default.** Mark `"use client"` only on forms, modals, the SSE listener, and the camera component.

## 3. Auth flow (Supabase magic link)

1. `/login` → `supabase.auth.signInWithOtp({ email, options: { emailRedirectTo: "/auth/callback" } })`
2. User clicks link → lands on `/auth/callback` → `supabase.auth.exchangeCodeForSession()` → redirect to `/onboarding` if `onboarding_complete=false` else `/dashboard`.
3. Every fetch to the backend includes `Authorization: Bearer ${session.access_token}`. Wrap this in `lib/api.ts` so no component sets headers by hand.
4. The `(app)` layout reads the session server-side via Supabase SSR helpers and 302s to `/login` if absent. Don't rely on a client-only check.
5. **The LLM API key never reaches the browser.** All LLM calls go through `api/`.

## 4. Endpoint catalog (call only these — do not invent endpoints)

Base URL: `process.env.NEXT_PUBLIC_API_BASE_URL` (e.g. `http://localhost:8000/api`).

> Every shape below is defined in `api/schemas/`. **Read those files for the exact field types.** When the OpenAPI codegen lands (§7), prefer the generated types over re-typing.

### Health
- `GET /api/health` — public; use for the `/status` page or smoke checks.

### Profile
- `GET /api/profile` → `ProfileOut`
- `PATCH /api/profile` (partial) → `ProfileOut`

### Onboarding wizard
- `POST /api/onboarding/profile` (steps 1–3) → `ProfileOut`
- `POST /api/onboarding/products` (step 4, batch) → `{ user_products: [...] }`
- `POST /api/onboarding/complete` → `{ analysis_id, status: "pending" }` (202)
  - **Immediately** open the SSE stream below — see §5.

### Products (the picker)
- `GET /api/products/search?q=&category=` → `{ results: ProductOut[] }`
- `GET /api/products/common?category=` → `{ results: ProductOut[] }` (top 50)
- `POST /api/products/resolve` `{ brand, name, category_slug }` → `{ product, confidence, warning }`
  - Show the `warning` to the user when confidence < 0.9. Don't hide it.

### Camera scan (the wow input)
- `POST /api/scan/barcode` `{ barcode, category_hint }` → `{ matched, product?, hint? }`
  - Decode the barcode **client-side** with ZXing first; only the string goes to the server.
- `POST /api/scan/label` `{ image_base64, mode: "front" | "back", category_hint }`
  - **mode=front**: returns `{ extracted: { brand, product_name }, confidence, matches: [...] }`. If exactly one match with `match_score >= 0.85`, auto-select. Else open a picker.
  - **mode=back**: returns `{ extracted_text, ingredients_parsed, confidence, product }`. If `confidence >= 0.7`, auto-add the product. Else prefill the paste textarea with `extracted_text` for the user to fix.
  - **Privacy note for the UI:** images are not stored long-term in MVP. Surface this near the shutter button.

### User products
- `GET /api/user-products` → `{ user_products: [...] }`
- `POST /api/user-products` `{ category_slug, product_id }` → user_product
- `DELETE /api/user-products/{id}` → 204

### Analyze (the centerpiece)
- `POST /api/analyze` (optional `{ force_refresh }`) → `{ analysis_id, status }` (202)
- `GET /api/analyze/{id}` → `AnalysisOut` (poll fallback if SSE disconnects)
- `GET /api/analyze/{id}/stream` → SSE — see §5

### Alternatives
- `GET /api/alternatives?category=&avoid_tags=` → `{ alternatives: [...] }`

### Errors
Every endpoint may return:
```json
{ "error": { "code": "...", "message": "...", "details": {...} } }
```
Codes: `UNAUTHORIZED` (401), `FORBIDDEN` (403), `NOT_FOUND` (404), `VALIDATION_ERROR` (422), `LLM_FAILURE` (502), `OBF_UNAVAILABLE` (503), `RATE_LIMITED` (429), `INTERNAL_ERROR` (500).
Map each to user-readable copy in `lib/api.ts`. Never show raw codes.

## 5. SSE consumption — the agent theater

`GET /api/analyze/{id}/stream` emits `text/event-stream`. The browser's native `EventSource` works:

```ts
// lib/sse.ts
export function streamAnalysis(id: string, token: string, onEvent: (e: { event: string; data: any }) => void) {
  const url = `${API}/analyze/${id}/stream`;
  // EventSource doesn't support custom headers in browsers; use a one-time
  // signed URL OR use fetch() + ReadableStream. Today: use fetch + reader.
  const ctrl = new AbortController();
  fetch(url, { headers: { Authorization: `Bearer ${token}` }, signal: ctrl.signal }).then(async (res) => {
    const reader = res.body!.getReader();
    const decoder = new TextDecoder();
    let buf = "";
    while (true) {
      const { value, done } = await reader.read();
      if (done) break;
      buf += decoder.decode(value, { stream: true });
      // parse SSE frames separated by \n\n
      let idx;
      while ((idx = buf.indexOf("\n\n")) !== -1) {
        const frame = buf.slice(0, idx); buf = buf.slice(idx + 2);
        const event = /event:\s*(.+)/.exec(frame)?.[1] ?? "message";
        const data = /data:\s*([\s\S]+)/.exec(frame)?.[1] ?? "{}";
        onEvent({ event, data: JSON.parse(data) });
      }
    }
  });
  return () => ctrl.abort();
}
```

**Events you must handle (these are the contract — see `api/schemas/agent.py:AgentEvent` and `api/services/events.py`):**

| Event | Data | When |
|---|---|---|
| `scanner.done` | `{ product_count }` | Scanner finished all products |
| `profile_reasoner.done` | `{ flagged_count }` | Ranking complete |
| `analogy_writer.done` | `{ count }` | Analogies written |
| `alternative_finder.done` | `{ count }` | Alternatives found |
| `regulatory_xref.done` | `{ banned_count }` | Bans cross-referenced |
| `done` | `{ analysis_id }` | Orchestrator finished — fetch `GET /api/analyze/{id}` and route to dashboard |
| `error` | `{ detail }` | Pipeline failed — show retry UI |

The Agents agent may add `*.started` / `*.progress` events later. Tolerate unknown events — render them generically rather than crashing.

**UX rule:** the theater is theater. If an event hasn't fired yet, show a soft pending state, not a spinner. The point of this screen is to *see* the architecture work.

## 6. State management rules

- **Onboarding wizard state lives in Zustand**, persisted to `sessionStorage`, so a refresh during step 4 doesn't wipe the user's product picks.
- **Server state lives in TanStack Query.** `queryKey` per resource: `["profile"]`, `["userProducts"]`, `["analysis", id]`, `["productsSearch", q, category]`.
- After `POST /api/analyze` returns 202, immediately open the SSE stream **and** set up a fallback poll every 3 s on `GET /api/analyze/{id}` in case the EventSource drops.
- After the `done` event, invalidate `["analysis", id]` and route to `/dashboard`.

## 7. Type generation (do not hand-write API types)

Master keeps `api/` shipping a fresh OpenAPI doc at `/openapi.json`. Generate TS types with:

```bash
# in web/
npm run codegen
# which runs:
# openapi-typescript http://localhost:8000/openapi.json -o lib/types.ts
```

Re-run codegen any time Master ships a schema change (you'll see a `master` changelog entry). **Never hand-edit `lib/types.ts`** — the next codegen will erase your changes.

## 8. The analogy-first writing rule (applies to every user-facing string)

Even where you write copy yourself (empty states, error toasts, onboarding hints):

- **Never** the words: `TOXIC`, `POISON`, `AVOID AT ALL COSTS`.
- **Never** cite the "2 kg of chemicals absorbed per year" line.
- **Banned-elsewhere chips are receipts, not headlines.** The analogy is the hero, the chip is small and below.
- The dashboard ingredient row order is fixed: **(1) one-liner analogy → (2) collapsible full explanation → (3) banned-elsewhere chip if applicable → (4) "see swap" CTA.**
- A medical disclaimer must appear once on every analysis screen. Wording lives in `components/dashboard/Disclaimer.tsx` once Master provides it; until then, use *"Informational only — not medical advice."*

## 9. DOs

- ✅ Build pages and components inside `web/**`
- ✅ Read `api/schemas/**` to understand the shape of any payload
- ✅ Generate types from OpenAPI
- ✅ Use `Authorization: Bearer <jwt>` on every request via `lib/api.ts`
- ✅ Stream SSE for the agent theater; fall back to polling on disconnect
- ✅ Validate forms with zod schemas mirroring the backend Pydantic ones
- ✅ Mobile-first layouts — the demo runs on a phone
- ✅ File a `request-master` changelog entry the moment you need a new field, endpoint, or env var

## 10. DON'Ts

- ❌ **Do not** modify any file under `api/`, `.kiro/`, `supabase/`, or `api_docs/agents/**`
- ❌ **Do not** call any LLM provider from the browser — the key is server-only
- ❌ **Do not** write directly to Supabase tables that aren't public-read (no client-side mutations to `profiles`, `user_products`, `analyses` — those go through `api/`)
- ❌ **Do not** invent endpoints not in §4 — request them
- ❌ **Do not** hand-edit `lib/types.ts`
- ❌ **Do not** add new npm dependencies without filing a request
- ❌ **Do not** ship copy that names a model brand. Use *"the analysis"*, *"our agents"*, *"the engine"*.
- ❌ **Do not** ship copy that uses fearmonger words (see §8)

## 11. Local dev quickstart

```bash
# Terminal 1 — backend (Master is running this; you'll usually point at deployed staging)
cd api && uvicorn main:app --reload --port 8000

# Terminal 2 — frontend
cd web && npm install && npm run dev
# open http://localhost:3000
```

Env vars (`web/.env.local`):
```
NEXT_PUBLIC_SUPABASE_URL=...
NEXT_PUBLIC_SUPABASE_ANON_KEY=...
NEXT_PUBLIC_API_BASE_URL=http://localhost:8000/api
```

## 12. When you ship a change

1. Branch: `frontend/<short-slug>` (e.g. `frontend/agent-theater`).
2. Run `tsc --noEmit` and `next lint`. Both must pass.
3. Verify in the browser — golden path *and* one error path. Type-checks ≠ feature-correct.
4. Write a changelog entry in `api_docs/changelog/` using the template. Filename pattern in [`../README.md` §4](../README.md).
5. Open a PR. Tag any `request-master` slugs you depend on.

That's it. When in doubt: **read `api/schemas/`**, then check the spec, then file a request. Don't guess.
