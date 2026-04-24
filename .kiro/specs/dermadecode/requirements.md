# DermaDecode — Full Project Spec & TODO

## Status Legend
- [ ] TODO — not started
- [~] IN PROGRESS
- [x] DONE

---

## 0. TECH STACK — TODO (team to fill in)

- [ ] **Frontend**: ???
- [ ] **Backend**: ???
- [ ] **Database**: ???
- [ ] **AI / LLM**: ???
- [ ] **Hosting / Deployment**: ???
- [ ] **Package manager**: ???

> ⚠️ Assign these before starting. All other todos depend on this.

---

## 1. GITHUB WORKFLOW — MCP Integration

DermaDecode uses the GitHub MCP server (`gh mcp` extension) so Kiro agents can create, update, and track issues directly from chat.

### 1.1 Repo Setup
- [ ] Repo created: `dhamuASU/Kiro-Hackathon` ✅
- [ ] Repo is public (required for submission)
- [ ] Branch protection on `main` — no direct pushes
- [ ] Create labels in GitHub:
  - `frontend` (blue)
  - `backend` (green)
  - `infra` (orange)
  - `data` (purple) — for ingredient database work
  - `ai` (yellow) — for Bedrock/LLM prompt work
  - `bug` (red)
  - `blocked` (grey)
  - `P0` / `P1` / `P2` — priority labels

### 1.2 GitHub Issues — Create from This Spec
Use the PM agent to auto-create issues from this spec:
```
kiro-cli chat --agent pm
@new-feature "EU banned ingredients data layer"
@new-feature "Ethics Logic Gates implementation"
@new-feature "Product search and ingredient analysis API"
@new-feature "React frontend — search and analysis dashboard"
@new-feature "Image OCR ingredient extraction"
@new-feature "Routine builder and combined analysis"
```

Each issue should have:
- Clear title (action-oriented)
- Acceptance criteria as checkboxes (copy from this spec)
- Label: which role owns it (`frontend`, `backend`, `data`, `ai`)
- Priority: P0 / P1 / P2

### 1.3 GitHub MCP — How Agents Use It
The MCP server is configured in `.kiro/settings/mcp.json`:
```json
{
  "mcpServers": {
    "github": {
      "command": "gh",
      "args": ["mcp"]
    }
  }
}
```

**PM agent** (`kiro-cli chat --agent pm`) can:
- Create issues: "Create a GitHub issue for the Disclosure Gate implementation"
- Check status: "What issues are still open?"
- Assign issues: "Assign the frontend issues to Person 2"
- Close issues: "Close issue #5 — it's done"
- Get status report: `@status-report`

**All agents** can:
- Comment on their issue when starting: "Starting work on issue #3"
- Update issue when done: "Mark issue #3 as complete"
- Create a PR linked to their issue

### 1.4 Branch → Issue → PR Workflow
```
1. PM creates issue via GitHub MCP
2. Dev picks up issue: "Check GitHub for my tasks"
3. Dev creates branch: feat/backend-analyze-endpoint
4. Dev works, commits with message: "feat: add analyze endpoint (closes #3)"
5. Dev pushes + creates PR
6. PM reviews: @status-report
7. Merge to main
```

### 1.5 Reusable Prompts
```bash
@new-feature "feature description"   # PM creates GitHub issues
@status-report                        # PM checks all open issues
@code-review                          # Reviewer audits git diff
@deploy-checklist                     # Pre-deploy safety check
```

---

## 2. DATA LAYER — Ingredient & Product Databases

### 2.1 EU Banned Ingredients List
Source: EU Cosmetics Regulation EC 1223/2009 (Annex II — prohibited substances)
- [ ] Download/scrape EU Annex II banned list (1,600+ ingredients)
- [ ] Normalize to INCI names (standard cosmetic ingredient naming)
- [ ] Store in database with field `bannedIn: ["EU"]`
- [ ] Include: ingredient INCI name, CAS number, reason for ban, regulation reference
- Data source: https://ec.europa.eu/growth/tools-databases/cosing/

### 2.2 US Banned Ingredients List
Source: FDA Prohibited & Restricted Ingredients
- [ ] Download FDA prohibited list (~11 ingredients)
- [ ] Store with field `bannedIn: ["US"]`
- Data source: https://www.fda.gov/cosmetics/cosmetics-laws-regulations/prohibited-restricted-ingredients-cosmetics

### 2.3 California Banned List
Source: California Toxic-Free Cosmetics Act (AB 2762, 2020)
- [ ] Download California banned list (24 ingredients)
- [ ] Store with field `bannedIn: ["California"]`
- Data source: https://oehha.ca.gov/

### 2.4 PFAS ("Forever Chemicals") List
Source: EPA PFAS Master List
- [ ] Download EPA PFAS registry
- [ ] Tag all PFAS ingredients with flag `pfas: true`
- [ ] Add environmental persistence data (half-life, aquatic toxicity)
- Data source: https://www.epa.gov/pfas/pfas-master-list-pfas-substances

### 2.5 EWG Hazard Scores
Source: EWG Skin Deep Database
- [ ] Map EWG hazard scores (1-10) to our ingredient table
- [ ] EWG scores: 1-2 (low), 3-6 (moderate), 7-10 (high hazard)
- [ ] Note: no public API — use published data / manual mapping for key ingredients
- Data source: https://www.ewg.org/skindeep/

### 2.6 Known Endocrine Disruptors
Source: NIH National Toxicology Program + EU Endocrine Disruptor list
- [ ] Tag ingredients with `endocrineDisruptor: true`
- [ ] Key ones: parabens (methylparaben, propylparaben, butylparaben), phthalates, triclosan, oxybenzone, BHA, BHT
- [ ] Include health effect description for each

### 2.7 Formaldehyde-Releasing Preservatives
- [ ] List all formaldehyde-releasers: DMDM Hydantoin, Quaternium-15, Imidazolidinyl Urea, Diazolidinyl Urea, Bronopol
- [ ] Tag with `formaldehydeReleaser: true`
- [ ] Note: found in baby shampoos — critical for Vulnerable Population Gate

### 2.8 Microplastics / Microbeads
- [ ] List plastic polymer ingredients: Polyethylene, Polypropylene, Nylon-12, Acrylates Copolymer
- [ ] Tag with `microplastic: true`
- [ ] Add environmental data: non-biodegradable, found in ocean/fish/drinking water

### 2.9 Vulnerable Population Ingredient Lists
- [ ] Pregnancy unsafe: retinol, retinoids, salicylic acid (high %), phthalates, formaldehyde-releasers, oxybenzone, hydroquinone
- [ ] Baby/infant unsafe: methylisothiazolinone (MIT), CMIT, certain preservatives, high-% alcohol
- [ ] Store as lookup with `population` field

### 2.10 Greenwash Trigger Words
- [ ] Unregulated marketing claims: "natural," "clean," "organic," "pure," "gentle," "hypoallergenic," "dermatologist tested," "clinically proven," "eco-friendly," "non-toxic"
- [ ] Store as config constant — used by Greenwash Gate
- [ ] Include explanation of why each term is unregulated in the US

### 2.11 Open Beauty Facts Integration
- [ ] Product lookup by name: `https://world.openbeautyfacts.org/api/v2/search?search_terms=...`
- [ ] Product lookup by barcode: `https://world.openbeautyfacts.org/api/v2/product/{barcode}`
- [ ] Extract: product_name, brands, categories, ingredients_text, image_url
- [ ] Cache results in database (TTL: 7 days)
- [ ] Fallback: product not found → prompt user to paste ingredients manually

### 2.12 Cleaner Swaps Reference Data
- [ ] Seed cleaner alternatives by category:
  - Moisturizer: CeraVe, Vanicream, La Roche-Posay
  - Sunscreen: EltaMD, Badger, Thinksport
  - Shampoo: Free & Clear, Vanicream, Acure
  - Body wash: Dr. Bronner's, Vanicream
  - Deodorant: Native, Schmidt's, Crystal
- [ ] Each swap: name, brand, score, avg price, category

---

## 3. BACKEND — API Endpoints

### 3.1 `POST /api/analyze` — Single Product Analysis
- [ ] Accept: `{ query: string }` OR `{ ingredients: string }`
- [ ] If query: call Open Beauty Facts API to get ingredient list
- [ ] If ingredients: use raw text directly
- [ ] Run all 3 Ethics Logic Gates (see section 5)
- [ ] Call AI with ingredient list for analysis
- [ ] Cross-reference each ingredient against ingredient database
- [ ] Calculate scores: safety, environmental, transparency, honesty
- [ ] Find cleaner swap
- [ ] Return full analysis JSON

### 3.2 `POST /api/analyze/image` — Photo/OCR Analysis
- [ ] Accept: image file (multipart or base64)
- [ ] Call AI vision to extract ingredient list from image
- [ ] Return extracted ingredient text + confidence score
- [ ] If confidence > 70%: auto-run analysis
- [ ] If confidence < 70%: return extracted text for user to confirm/edit

### 3.3 `GET /api/search` — Product Autocomplete
- [ ] Accept: `?q=neutrogena`
- [ ] Search database cache first, then Open Beauty Facts
- [ ] Return: array of `{ id, name, brand, category }` (max 8 results)

### 3.4 `POST /api/routine` — Full Routine Analysis
- [ ] Accept: `{ products: [{ query: string }, ...] }`
- [ ] Run individual analysis for each product
- [ ] Detect ingredient interactions across products
- [ ] Calculate combined routine score
- [ ] Calculate cumulative daily/yearly exposure estimate
- [ ] Calculate environmental drain score
- [ ] Return: individual analyses + combined metrics + interaction warnings

### 3.5 `GET /api/ingredient/:name` — Ingredient Deep Dive
- [ ] Return full ingredient profile for Learn Mode (P2)

---

## 4. AI LAYER — LLM Integration

### 4.1 Ingredient Analysis Prompt
- [ ] System prompt: scoring rubric + banned ingredient context + output JSON schema
- [ ] Input: ingredient list + product category + user profile (if set)
- [ ] Output: per-ingredient `{ name, plainEnglish, safetyScore, environmentalScore, flags, category }`
- [ ] AI explains and contextualizes — database is source of truth for ban data
- [ ] Low temperature (0.1-0.2) for factual consistency

### 4.2 OCR / Image Extraction Prompt
- [ ] System prompt: "Extract the ingredient list from this cosmetic product label. Return comma-separated INCI ingredient names only. Include a confidence score 0-100."
- [ ] Post-process: clean OCR artifacts, normalize INCI formatting

### 4.3 Greenwash Detection Prompt
- [ ] Input: product name + marketing claims + ingredient list
- [ ] Output: `{ greenwashDetected: boolean, contradictions: [{ claim, reality }], honestyScore }`

### 4.4 Cleaner Swap Suggestion Prompt
- [ ] Input: product category + flagged ingredients + user profile
- [ ] Output: suggested alternative with reasoning
- [ ] Fallback: use swaps reference data if AI unavailable

---

## 5. ETHICS LOGIC GATES — Code Implementation

### 5.1 Disclosure Gate
Detects the "fragrance" loophole — refuses to fully rate products hiding ingredients.
```
IF ingredients contain "fragrance" / "parfum" / "aroma"
  → BLOCK overall safety score
  → Show: "We can't rate what we can't see"
  → Transparency: FAIL
```
- [ ] Implement `disclosureGate(ingredients)` function
- [ ] Unit test: product with "fragrance" → triggers
- [ ] Unit test: product without "fragrance" → passes
- [ ] Frontend: warning banner, score blocked

### 5.2 Vulnerable Population Gate
Hard stop when baby/pregnancy products contain flagged chemicals.
```
IF product category is baby/pregnancy/children
   AND contains population-flagged ingredients
  → FULL SCREEN RED ALERT
  → User must acknowledge before seeing anything else
```
- [ ] Implement `vulnerablePopulationGate(ingredients, category, userProfile)` function
- [ ] Build `VULNERABLE_POPULATION_INGREDIENTS` list (retinol, MIT, phthalates, etc.)
- [ ] Unit test: baby shampoo + MIT → hard stop
- [ ] Unit test: pregnant user + retinol product → hard stop
- [ ] Frontend: full-screen red modal, require acknowledgment

### 5.3 Greenwash Gate
Catches when marketing claims contradict actual ingredients.
```
IF product claims "natural/clean/organic/gentle"
   AND actual ingredients include synthetic/flagged chemicals
  → Side-by-side: CLAIMS vs REALITY
  → Honesty Score: 1-10
```
- [ ] Implement `greenwashGate(claims, ingredients, analysis)` function
- [ ] Implement `calculateHonestyScore()` helper
- [ ] Unit test: "natural" product with synthetics → triggers
- [ ] Frontend: orange banner with claims vs reality comparison

---

## 6. FRONTEND — React Components

### 6.1 Search Screen
- [ ] `SearchBar` — text input with autocomplete dropdown
- [ ] `IngredientPaste` — expandable textarea for raw ingredient list
- [ ] `ImageUpload` — drag/drop or file picker with preview
- [ ] Loading + error states

### 6.2 Gate Alert Components
- [ ] `DisclosureWarning` — yellow banner, blocks score, explains fragrance loophole
- [ ] `VulnerablePopulationAlert` — full-screen red modal, requires acknowledgment
- [ ] `GreenwashAlert` — orange banner with claims vs reality side-by-side

### 6.3 Analysis Dashboard
- [ ] `ScoreCard` — circular gauge, color-coded (🔴🟠🟡🟢)
- [ ] `ScoreRow` — 4 scores: Safety | Environmental | Transparency | Honesty
- [ ] `BannedElsewhereBanner` — "⚠️ X ingredients banned in EU" — tappable
- [ ] `IngredientList` — scrollable, color-coded by safety score
- [ ] `IngredientItem` — expandable: plain English + scores + flags + bans
- [ ] `SwapCard` — cleaner alternative with score + price comparison

### 6.4 Routine Builder (P1)
- [ ] `RoutineBuilder` — add/remove products
- [ ] `RoutineSummary` — combined score + interactions + cumulative exposure
- [ ] `EnvironmentalDrainScore` — "Your routine sends Xg of chemicals into waterways daily"

### 6.5 User Profile / Personalization (P1)
- [ ] `ProfileSetup` — skin type, concerns, life stage, allergies (localStorage only)
- [ ] Profile affects: which gates fire, which flags highlight, swap suggestions

---

## 7. SHARED TYPES

- [ ] `Ingredient` — inci_name, plainEnglish, safetyScore, environmentalScore, flags, bannedIn, category
- [ ] `ProductAnalysis` — product, gates, ingredients, scores, bannedElsewhere, swap
- [ ] `GateResult` — gate, passed, message, severity, blockScore, blockAll, requiresAcknowledgment
- [ ] `RoutineAnalysis` — products, combinedScore, interactions, cumulativeExposure, environmentalDrain
- [ ] `UserProfile` — skinType, concerns, lifeStage, allergies, ageRange
- [ ] `Score` — safety, environmental, transparency, honesty (all 1-10)

---

## 8. DEMO SCRIPT (2-min video)

- [ ] **0:00-0:20** — Problem: "The US bans 11 cosmetic ingredients. The EU bans 1,600. Same companies, different formulas."
- [ ] **0:20-0:45** — Search "Neutrogena Hydro Boost" → ingredient breakdown + Banned Elsewhere banner
- [ ] **0:45-1:05** — Scan baby product → Vulnerable Population hard stop (red screen)
- [ ] **1:05-1:25** — Greenwash Gate: "natural" product with synthetic chemicals
- [ ] **1:25-1:45** — Routine builder: 3 products → combined score + interaction warning
- [ ] **1:45-2:00** — Cleaner swap + closing pitch

---

## 9. SUBMISSION CHECKLIST

- [ ] GitHub repo public and accessible
- [ ] README with setup instructions
- [ ] App deployed and accessible via URL
- [ ] 2-3 min YouTube video (unlisted)
- [ ] Airtable submission form filled
- [ ] Write-up: how Kiro was used (SDD, agents, hooks, steering docs, MCP)
- [ ] Social media post (bonus)
