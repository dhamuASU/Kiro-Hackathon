---
date: 2026-04-24T23:09:45Z
agent: master
type: change
status: shipped
tags: [db, seed, ingredients, analogies, bans, alternatives]
references: []
---

# Seed the reference data — ingredients, analogies, bans, alternatives, demo products

## Why

The schema migration (`001_initial_schema.sql`) only seeded the 12
categories — everything else downstream (`ingredients`, `analogies`,
`bans`, `alternatives`, `products`) was empty. Without data, ScannerAgent
finds nothing in the DB and falls through to LLM for every single INCI,
AlternativeFinder returns nothing, and the "banned in EU / California /
Hawaii" receipts never fire. Fatal for the demo.

The Feature List targets 200+ ingredients and top-50 curated analogies
long-term. For the hackathon we seed a focused ~20-ingredient subset
chosen to reliably trip across the three demo personas and the 10 demo
products — covering the big-name flagged families (sulfates, parabens,
retinoids, isothiazolinones, fragrance, benzophenones, formaldehyde
releaders, phthalates, triclosan, aluminum salts, talc).

## What changed

New migration `api/db/migrations/002_seed_reference_data.sql`. Idempotent
via `ON CONFLICT DO NOTHING` on every insert, so it's safe to re-run after
the teammate adds more data.

Seeded rows:

- **20 ingredients** with full metadata: hazard_tags (7-tag taxonomy from
  the spec), goals_against (which user goals the ingredient sabotages),
  bad_for_skin_types, dose_notes, plain_english.
  Examples: Sodium Lauryl Sulfate, Sodium Laureth Sulfate, Methylparaben,
  Propylparaben, Retinol, Methylchloroisothiazolinone (MCI),
  Methylisothiazolinone (MI), Parfum, Oxybenzone, Octinoxate, Formaldehyde,
  DMDM Hydantoin, Quaternium-15, Alcohol Denat, Triclosan, Aluminum
  Zirconium Tetrachlorohydrex GLY, Talc, Diethyl Phthalate, PEG-40
  Hydrogenated Castor Oil, Salicylic Acid.
- **15 hand-written curated analogies** keyed by `(ingredient_id,
  goal_slug)`. These are the "sulfates are like sugar" moment — every
  one follows the three rules in `steering/product.md` (respect dose,
  respect goal, be true). Several goals covered per ingredient where it
  mattered (SLS has entries for both `less_sensitivity` and `hydration`).
- **20 regulatory bans** with real regulation refs: EU Annex II/III/V/VI
  under Reg. EC 1223/2009, California AB 2762 + AB 496, Hawaii Act 104,
  FDA 21 CFR 310.545, Canada Cosmetic Hotlist, California Prop 65.
  Every `source_url` links to a real government / regulator page.
- **17 curated alternatives** across 10 categories: Vanicream Free &
  Clear (shampoo + conditioner + body wash + cleanser + moisturizer +
  lip balm), CeraVe Hydrating + Foaming + Moisturizing Cream, EltaMD UV
  Clear, Blue Lizard Mineral, Native Sensitive, Schmidt's, Dr. Bronner's,
  David's, Tom's of Maine, The Ordinary Retinol.
- **11 demo products** with real ingredient lists tuned to hit the
  seeded ingredients: Head & Shoulders Classic Clean, Pantene Pro-V,
  Nivea Body Wash, Neutrogena Oil-Free Acne Wash, CeraVe Foaming +
  Hydrating Cleansers, Olay Regenerist Retinol 24, Banana Boat Sport
  SPF 50, Old Spice High Endurance deodorant, Crest Cavity Protection,
  Aveeno Positively Ageless SPF 30.

## How to apply

```bash
psql "$DATABASE_URL" -f api/db/migrations/001_initial_schema.sql
psql "$DATABASE_URL" -f api/db/migrations/002_seed_reference_data.sql
```

Or via the Supabase CLI: `supabase db push`.

## Files touched

- `api/db/migrations/002_seed_reference_data.sql` (new)

## Cross-agent requests

- **Agents teammate:** this unblocks ScannerAgent's DB-first path and
  AnalogyWriterAgent's curated-first lookup — the two paths that were
  effectively no-ops before. After you implement those agents against
  this data, add your ingredient coverage gaps to the end of this
  migration (same `ON CONFLICT DO NOTHING` pattern) — do NOT edit the
  existing rows.
- **Frontend teammate:** the 11 demo products above are intentionally
  chosen for the demo flow. The "common products" picker (`GET
  /api/products/common?category_slug=...`) will return them in
  popularity order per category.

## Risks / rollback

- **Rollback:** truncate the seeded tables (leave `categories` alone —
  those are from `001`):
  `truncate alternatives, bans, analogies, products, product_ingredients, ingredients restart identity cascade;`
  Then re-run either `002` or the teammate's replacement migration.
- **Regulation accuracy:** the ban rows cite real laws but the exact
  Annex entry numbers should be verified against the latest consolidated
  text before we claim this is production-grade. Demo-grade today.
- **Asymmetric analogies:** some ingredients have goal-specific analogies
  (SLS × `less_sensitivity` + SLS × `hydration`), others have a single
  generic analogy with `goal_slug = null` (Formaldehyde). The curated-
  first lookup in AnalogyWriterAgent should prefer goal-specific and
  fall back to null.
