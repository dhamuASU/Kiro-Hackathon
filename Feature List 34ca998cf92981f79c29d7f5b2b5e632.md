# Feature List

> **How to read this:** MVP = ship by submission Friday. P1 = week 1–2 post-hackathon. P2 = vision / 1–3 month roadmap.
> 

> **Checkbox discipline:** Tick as we ship. If it's not checked, it's not done, no matter what your branch name says.
> 

---

# 1. Feature Overview

DermaDecode is built around six clusters. Everything below ladders up to one of these:

| # | Cluster | Why it exists |
| --- | --- | --- |
| 1 | **Auth + Onboarding** | Get the user into the app and capture the personalization fuel (profile + goals + products) in under 3 minutes. |
| 2 | **Product input** | Four ways to tell us what they use: search, common-products picker, paste, and 📷 camera scan (barcode / front / back). |
| 3 | **AI orchestration** | The wow moment. Orchestrator + 4–5 sub-agents, visible in the UI as they run. |
| 4 | **Analogy-first analysis** | The output. No "TOXIC" — sugar-and-marathon analogies, calibrated to the user's goals. |
| 5 | **Banned-elsewhere + alternatives** | The receipts (regulatory citations) and the actionable next step (cleaner swap). |
| 6 | **Goal coach (P1)** | The retention loop. Skin goals tracked over time as the routine evolves. |

---

# 2. MVP — Ship by Friday

## 2.1 Auth (Supabase)

- [ ]  Sign up (email magic link, Supabase Auth)
- [ ]  Log in / log out
- [ ]  Auth-gate everything except landing page
- [ ]  Session persistence across reloads
- [ ]  Delete account flow (data export not required for MVP)

## 2.2 Onboarding wizard

A single linear flow, ~3 minutes end to end. Saves progress per step so the user can resume.

### Step 1 — About you

- [ ]  Age range select: `under_18`, `18_24`, `25_34`, `35_44`, `45_54`, `55_plus`
- [ ]  Gender select: `female`, `male`, `non_binary`, `prefer_not_to_say`
- [ ]  Skin type select: `sensitive`, `dry`, `oily`, `combination`, `normal`

### Step 2 — Your skin goals (multi-select, 1–3)

- [ ]  Reduce acne / breakouts
- [ ]  Anti-aging / wrinkles
- [ ]  Even skin tone / dark spots
- [ ]  More hydration / less dryness
- [ ]  Less sensitivity / redness
- [ ]  Less oil / shine control
- [ ]  General maintenance / preventive

### Step 3 — Allergies (free-text, optional)

- [ ]  Single textarea, parsed lightly (split on commas)

### Step 4 — Your products

- [ ]  ~10 categories, in order: shampoo, conditioner, body wash, face cleanser, moisturizer, sunscreen, deodorant, toothpaste, lip balm, makeup foundation
- [ ]  For each: search field + "common products" dropdown + "paste ingredients" expandable + skip button
- [ ]  User can add multiple products per category (e.g. AM + PM moisturizer)
- [ ]  "I'm done" button to finish before all categories are filled

### Step 5 — AI magic loading screen

- [ ]  Live progress UI showing each sub-agent firing in sequence
- [ ]  Realistic copy: *"Scanning your moisturizer for flagged ingredients…"*, *"Reading your skin profile…"*, etc.
- [ ]  Estimated 10–20s total wait

## 2.3 Product input methods

Four ways to get a product into the user's bathroom — pick whichever is fastest for them.

- [ ]  **Search by brand + name** — Open Beauty Facts API, returns top 8 matches with thumbnails
- [ ]  **Common products dropdown** — pre-seeded top 50 most popular products per category, no API call needed (instant)
- [ ]  **Paste ingredient list** — textarea, accepts comma-separated INCI names; LLM parses and normalizes
- [ ]  **📷 Camera scan** — three modes (see §2.4 below)
- [ ]  **Resolve fallback** — if user types a brand+name not in OBF, call LLM to resolve to canonical product + ingredient list, with a confidence flag
- [ ]  **Skip** — user doesn't have to fill every category

## 2.4 Camera scan (the wow input)

The "open the camera and you're done" path. One button, three modes — the user picks whichever is easiest depending on what they're holding.

### Mode A — Barcode scan

- [ ]  In-browser barcode reader via **ZXing WebAssembly** (no backend round-trip for the decode)
- [ ]  Camera permission → user points at barcode → barcode string captured client-side
- [ ]  Frontend calls `POST /api/scan/barcode` with the barcode string
- [ ]  Backend looks up in Open Beauty Facts; if found, returns the canonical product
- [ ]  Fallback if not in OBF: prompt user to flip the bottle and try Mode C (back label)

### Mode B — Front of product

- [ ]  Camera capture → snapshot saved to local state, base64-encoded
- [ ]  User confirms the photo (retake button + use photo button)
- [ ]  Frontend calls `POST /api/scan/label` with `{ image_base64, mode: "front" }`
- [ ]  Backend uses **Claude vision** to extract `{ brand, product_name }` from the label
- [ ]  Backend then searches Open Beauty Facts for that brand+name combination
- [ ]  Returns canonical product OR a list of likely matches for the user to pick

### Mode C — Back of product (ingredient list)

- [ ]  Camera capture → snapshot, base64
- [ ]  Frontend calls `POST /api/scan/label` with `{ image_base64, mode: "back" }`
- [ ]  Backend uses Claude vision to extract the raw ingredient list, returns parsed INCI array + a confidence score
- [ ]  If confidence ≥ 70%: auto-create a `user_paste`-source product and proceed
- [ ]  If confidence < 70%: show extracted text in the paste textarea for the user to confirm/edit before saving

### Camera UX shared across all modes

- [ ]  Single `<CameraCapture mode="barcode|front|back" />` component, mode tab-switcher inside
- [ ]  Mobile-first — full-screen viewfinder, big shutter button, mode tabs at the top
- [ ]  Graceful fallback: if user denies camera permission, fall back to file-picker upload of the same image
- [ ]  Loading state while OCR runs (~3–8s for Claude vision)
- [ ]  Privacy: images are sent to backend only, never stored long-term unless the user explicitly saves them

## 2.5 AI orchestration (the centerpiece)

### Orchestrator agent

- [ ]  Input: user profile + array of user products + ingredient lists
- [ ]  Decomposes the task into sub-agent calls
- [ ]  Composes their outputs into one final response
- [ ]  Streams progress events to frontend via SSE

### Sub-agent 1 — Scanner Agent

- [ ]  Input: a single product's ingredient list
- [ ]  Output: array of `{ inci_name, hazard_tags[], position_in_list, is_concerning }`
- [ ]  Cross-references local ingredient DB; LLM only for unknowns
- [ ]  Independently testable

### Sub-agent 2 — Profile Reasoner

- [ ]  Input: user profile (skin type, goals, allergies) + Scanner output
- [ ]  Output: which flagged ingredients matter *for this user* and why, ranked by relevance
- [ ]  E.g. "Sulfates flagged for all users; ranked HIGH for this user because skin_type=sensitive and goal=less_dryness"

### Sub-agent 3 — Analogy Writer

- [ ]  Input: ingredient + user goal + dose context
- [ ]  Output: `{ analogy_one_liner, full_explanation }`
- [ ]  Prefers curated analogy from `analogies` table; falls back to LLM with strict prompt
- [ ]  Strict rule: must respect dose, must respect goal, must be true (fact-check pass)

### Sub-agent 4 — Alternative Finder

- [ ]  Input: product category + flagged ingredient tags + user profile
- [ ]  Output: 1–3 alternative products from `alternatives` table that match category + skin type + are free of flagged tags
- [ ]  LLM fallback if no curated alternative exists

### Sub-agent 5 — Regulatory Cross-ref

- [ ]  Input: list of flagged ingredients
- [ ]  Output: `{ inci_name, banned_in: [{ region, regulation_ref, source_url, reason }] }`
- [ ]  Pure DB query (no LLM) for speed and citation accuracy

## 2.6 Ingredient database (data layer)

- [ ]  **200+ INCI ingredients seeded** with category, plain-English, hazard tags, dose notes
- [ ]  **Top 50 most-likely-to-fire ingredients** have hand-curated analogy entries (sulfates-as-sugar, retinol-as-marathon, parabens, formaldehyde-releasers, oxybenzone, fragrance, alcohol-denat, MIT, etc.)
- [ ]  **Hazard tag taxonomy:** `endocrine_disruptor`, `irritant`, `sensitizer`, `drying`, `comedogenic`, `photoreactive`, `formaldehyde_releaser`
- [ ]  **Goal-against mapping:** each ingredient tagged with which goals it sabotages (e.g. SLS → `[reduce_sensitivity, more_hydration]`)
- [ ]  Indexes for fast lookup by inci_name (trigram) and hazard tag (GIN on jsonb)

## 2.7 Banned-elsewhere data

- [ ]  **EU Annex II** (Reg. EC 1223/2009) — top 100 ingredients seeded with regulation reference + source URL
- [ ]  **FDA Prohibited & Restricted** (all 11)
- [ ]  **California AB 2762** (24 ingredients)
- [ ]  **Canada Cosmetic Ingredient Hotlist** — top entries
- [ ]  Each ban row: `{ region, status, regulation_ref, source_url, reason }`

## 2.8 Analogy templates (curated)

Hand-written for the top 50 most-likely-to-fire ingredients. Each entry: `{ ingredient_id, goal_slug (or null for generic), analogy_text, full_explanation }`. Examples:

- [ ]  **Sulfates (SLS / SLES)** × dryness goal — "like sugar"
- [ ]  **Retinol** × anti-aging goal — "like training for a marathon every day"
- [ ]  **Parabens** × hormonal acne goal — "like leaving a window cracked in winter"
- [ ]  **Fragrance/Parfum** × sensitivity goal — "like a black-box ingredient"
- [ ]  **Alcohol denat** × dryness goal — "like a hand sanitizer for your face"
- [ ]  **Oxybenzone** × anti-aging goal — "like a UV filter that clocks out at noon"
- [ ]  **Formaldehyde releasers (DMDM, Quaternium-15)** × sensitivity goal — "like a slow leak"
- [ ]  (Plus ~43 more curated by Data role)

## 2.9 Alternative product catalog

- [ ]  ~50 curated alternatives across the 10 main categories
- [ ]  Each: `{ category, brand, name, free_of_tags[], good_for_skin_types[], good_for_goals[], avg_price_usd, url, image_url, reason }`
- [ ]  Examples: CeraVe Hydrating Cleanser, Vanicream Free & Clear Shampoo, EltaMD UV Clear, Native Deodorant, Dr. Bronner's Pure-Castile, Schmidt's Deodorant, La Roche-Posay Toleriane, Avene Tolerance, Free & Clear shampoo

## 2.10 Analysis dashboard UI

- [ ]  **Profile summary header** — skin type + top 3 goals as chips
- [ ]  **Per-product cards** — product name, image, category, count of flagged ingredients
- [ ]  **Tap product → expanded view** — per-ingredient breakdown
- [ ]  **Per-ingredient row** — analogy line first (the hero), then collapsible technical detail, then banned-elsewhere chip if applicable, then "alternatives" CTA
- [ ]  **Goal-impact line per ingredient** — "Your goal *less dryness*: this ingredient is working against it because…"
- [ ]  **Alternative card** — swap suggestion with reason ("Free of sulfates, matches your sensitive skin profile")
- [ ]  **Mobile-first layout** — demo runs on a phone

## 2.11 Profile management

- [ ]  View profile
- [ ]  Edit profile (re-runs orchestrator on save)
- [ ]  Edit product list (add/remove)
- [ ]  Delete account

## 2.12 Infra & deploy

- [ ]  Next.js 14 deployed to **Vercel**
- [ ]  FastAPI deployed to **Railway** (or Render / [Fly.io](http://Fly.io))
- [ ]  Supabase project provisioned, schemas + RLS applied
- [ ]  Env vars: Anthropic API key, Supabase URL + service role key, OBF base URL
- [ ]  Public README with setup instructions
- [ ]  GitHub repo public, branch protection on `main`

## 2.13 Demo prep

- [ ]  3 demo personas pre-seeded (e.g. "Maya, 27, sensitive skin, reduce acne goal" / "James, 35, normal skin, anti-aging" / "Priya, 30, dry skin, hydration")
- [ ]  Each demo persona has products that fire at least one flagged ingredient and at least one banned-elsewhere chip
- [ ]  2–3 min YouTube video walking through one persona end-to-end
- [ ]  Airtable submission form filled
- [ ]  Write-up: how Kiro was used (specs per agent, steering for analogy rules, hooks, GitHub MCP)

---

# 3. P1 — Week 1–2 post-hackathon

## 3.1 Life stage field

- [ ]  Add `life_stage` to profile: `none`, `pregnant`, `nursing`, `ttc`, `parent_of_infant`
- [ ]  Profile Reasoner sub-agent factors life stage into ranking (pregnant + retinol → highest priority)

## 3.2 Goal coach loop

- [ ]  Weekly check-in email: *"Since you swapped your shampoo, your hydration goal is on track. Want to look at your face cleanser next?"*
- [ ]  Goal progress visualization (% improved per goal based on flagged-ingredient count delta over time)

## 3.3 Routine builder

- [ ]  AM / PM routine grouping
- [ ]  Cross-product interaction warnings (sulfate cleanser + retinol night = barrier damage)
- [ ]  Cumulative exposure framing ("Your AM routine has 4 flagged ingredients touching your face")

## 3.4 Camera scan polish (post-MVP)

The MVP camera ships rough; P1 makes it production-grade.

- [ ]  Multi-frame capture for low-light barcodes (auto-retry on bad decode)
- [ ]  Auto-rotation correction for tilted ingredient-list shots
- [ ]  Highlight the OCR'd text overlaid on the captured image so the user can spot mistakes
- [ ]  Save scanned label images to Supabase Storage so the user can re-OCR if they update the product
- [ ]  Bulk-scan mode: scan 5 products in a row without leaving the camera

## 3.5 Product change tracking

- [ ]  Notify user if a saved product's formula changes on OBF

## 3.6 LLM-generated analogies for the long tail

- [ ]  When a flagged ingredient has no curated analogy, Analogy Writer agent generates one with a fact-check pass and persists to DB for future users

---

# 4. P2 — 1–3 month roadmap

## 4.1 Learn Mode

- [ ]  `GET /api/ingredient/:name` deep-dive page — wiki-style per ingredient
- [ ]  What it is, what it does, where banned, products containing it, peer-reviewed studies linked
- [ ]  SEO play — ranks for long-tail "is X safe" queries

## 4.2 Community contributions

- [ ]  Users submit missing products (mirroring OBF model), feeds back upstream

## 4.3 Browser extension

- [ ]  Chrome/Firefox — lights up product pages on Amazon / Sephora / Ulta / Target with score + "see analogy"
- [ ]  One-click swap on the product page

## 4.4 Category expansion (per PMD vision)

- [ ]  **Phase 2:** Household cleaners, menstrual care, oral care
- [ ]  **Phase 3:** Clothing & textiles (PFAS, OEKO-TEX data)
- [ ]  **Phase 4:** Food (Open Food Facts + EU food-additive deltas)

## 4.5 Public API

- [ ]  Rate-limited endpoints for journalists / NGOs / researchers
- [ ]  Citation chain in every response

## 4.6 Brand-facing dashboard (SaaS)

- [ ]  Brands see their own DermaDecode score
- [ ]  Roadmap view: "replace these 3 ingredients and your EU score jumps 2 points"

---

# 5. Explicitly Out of Scope (so we don't get distracted)

- **Native mobile apps** — web-first (the camera works in mobile browsers via `getUserMedia`). React Native is a 12-month-later problem.
- **"Will this product give me cancer in 10 years" predictions** — scientifically indefensible.
- **The "2kg of chemicals absorbed/year" claim** — debunked; do not cite.
- **Full Annex II (all 1,600)** — we seed the 100 that fire most often.
- **Our own OCR / vision model** — use Claude vision; don't train.
- **Shopping / checkout** — we recommend, we don't sell. Affiliate is a P2 decision.
- **Telling users a product is "safe" or "unsafe"** — we always frame as analogies and dose, never binary verdicts.

---

# 6. Feature → Demo Mapping

Every MVP feature must serve one of the demo moments below. If it doesn't, cut it.

| Demo moment | Features it uses |
| --- | --- |
| **Onboarding magic** — user goes from zero to personalized in 3 minutes | Auth, onboarding wizard, common-products picker |
| **The agent theater** — user watches 5 sub-agents work in sequence | Orchestration UI, SSE progress streaming |
| **The camera moment** — user points phone at the back of a bottle and the ingredient list appears parsed | Camera capture, Claude vision, `POST /api/scan/label` mode=back |
| **The analogy moment** — *"sulfates are like sugar"* makes the user laugh / share | Analogy templates, Analogy Writer agent |
| **The receipt** — *"by the way, this is banned in 27 EU countries"* | Bans table, Regulatory Cross-ref agent, banned-elsewhere chip |
| **The actionable swap** — *"here's a $10 alternative that matches your sensitive-skin profile"* | Alternatives catalog, Alternative Finder agent, Swap Card |

---

# 7. Related Docs

- **PMD** — why we're building this (sibling page in hub)
- **Tech Architecture, Schemas & API** — how it's built (sibling page in hub)