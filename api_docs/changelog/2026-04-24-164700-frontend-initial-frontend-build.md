# Changelog Entry

date: 2026-04-24-164700
agent: frontend
slug: initial-frontend-build
status: done

## What shipped

Full Next.js 14 frontend in `frontend/` (note: should be renamed to `web/` per working agreement — pending).

### Pages built
- `/` — Landing page (glassmorphism design, serif headline, floating search bar, pulsing badge, feature cards)
- `/login` — Magic link auth form (Supabase signInWithOtp)
- `/auth/callback` — Auth redirect handler
- `/onboarding` — 4-step wizard: profile (age/gender/skin type) → goals → allergies → products
- `/onboarding/analyzing` — Agent theater: animated 5-agent progress screen (currently mock timers, ready for real SSE)
- `/dashboard` — Analogy-first analysis dashboard with ingredient rows, banned-elsewhere chips, swap cards (currently demo data)
- `/product/[id]` — Product deep-dive with MetricCard score gauges, ingredient cards, gate alerts, swap suggestion
- `/routine` — Multi-category routine builder (7 slots: Cleanser/Toner/Serum/Moisturizer/SPF/Shampoo/Conditioner) with inline search, filled/empty states, sticky sidebar summary

### Shared components
- `components/layout/AppShell.tsx` — shared nav + footer wrapper used by all pages
- `components/ui/MetricCard.tsx` — reusable animated score gauge (Safety/Environmental/Transparency/Honesty) + skeleton loader
- `components/cleanlabel/AlertBanner.tsx` — fragrance warning + greenwash detection banners
- `components/cleanlabel/IngredientCard.tsx` — expandable ingredient row with safety badge + flag chips
- `components/cleanlabel/SafetyAlertModal.tsx` — full-screen red hard-stop for vulnerable population gate

### Design system
- CSS design tokens in `globals.css` (--navy, --sage, --mint, --cream, --shadow-*, --radius-*)
- Glassmorphism cards, soft colored shadows, 24-32px border radius throughout
- Skeleton shimmer animation for loading states

### State
- `store/onboarding.ts` — Zustand store for wizard state (age, gender, skin type, goals, allergies)
- `hooks/use-routine.ts` — localStorage-backed routine product list

### Lib
- `lib/api.ts` — base fetch wrapper (TODO: add JWT Bearer token once Supabase is configured)
- `lib/supabase.ts` — Supabase browser client stub

## What's NOT done yet (pending backend/infra)

- `(app)/layout.tsx` auth gate — waiting for Supabase project to be provisioned
- Real API calls — dashboard and product pages use demo data from `data/cleanlabel.ts`
- SSE agent theater — using mock timers, needs `lib/sse.ts` wired to `GET /api/analyze/{id}/stream`
- `lib/types.ts` — waiting for `npm run codegen` against live OpenAPI endpoint
- Camera scan UI — placeholder only

## Requests to Master

None at this time. All frontend work uses existing schema contracts.

## Notes

- Frontend is in `frontend/` not `web/` — rename pending team agreement
- Demo data in `data/cleanlabel.ts` matches the shape of `AnalysisOut` from `api/schemas/analysis.py`
