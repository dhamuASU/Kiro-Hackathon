# DermaDecode — Full Project Spec & TODO

## Status Legend
- [ ] TODO — not started
- [~] IN PROGRESS
- [x] DONE

---

## 1. DATA LAYER — Ingredient & Product Databases

### 1.1 EU Banned Ingredients List
Source: EU Cosmetics Regulation EC 1223/2009 (Annex II — prohibited substances)
- [ ] Download/scrape EU Annex II banned list (1,600+ ingredients)
- [ ] Normalize to INCI names (standard cosmetic ingredient naming)
- [ ] Store in DynamoDB `Ingredients` table with field `bannedIn: ["EU"]`
- [ ] Include: ingredient INCI name, CAS number, reason for ban, regulation reference
- Data source: https://ec.europa.eu/growth/tools-databases/cosing/

### 1.2 US Banned Ingredients List
Source: FDA Prohibited & Restricted Ingredients
- [ ] Download FDA prohibited list (only ~11 ingredients)
- [ ] Store with field `bannedIn: ["US"]`
- Data source: https://www.fda.gov/cosmetics/cosmetics-laws-regulations/prohibited-restricted-ingredients-cosmetics

### 1.3 California Banned List
Source: California Toxic-Free Cosmetics Act (AB 2762, 2020)
- [ ] Download California banned list (24 ingredients)
- [ ] Store with field `bannedIn: ["California"]`
- Data source: https://oehha.ca.gov/

### 1.4 PFAS ("Forever Chemicals") List
Source: EPA PFAS Master List
- [ ] Download EPA PFAS registry
- [ ] Tag all PFAS ingredients with flag `"pfas": true`
- [ ] Add environmental persistence data (half-life, aquatic toxicity)
- Data source: https://www.epa.gov/pfas/pfas-master-list-pfas-substances

### 1.5 EWG Hazard Scores
Source: EWG Skin Deep Database
- [ ] Map EWG hazard scores (1-10) to our ingredient table
- [ ] EWG scores: 1-2 (low), 3-6 (moderate), 7-10 (high hazard)
- [ ] Note: no public API — use published data / manual mapping for key ingredients
- Data source: https://www.ewg.org/skindeep/

### 1.6 Known Endocrine Disruptors
Source: NIH National Toxicology Program + EU Endocrine Disruptor list
- [ ] Tag ingredients with `"endocrineDisruptor": true`
- [ ] Key ones: parabens (methylparaben, propylparaben, butylparaben), phthalates, triclosan, oxybenzone, BHA, BHT
- [ ] Include health effect description for each

### 1.7 Formaldehyde-Releasing Preservatives
- [ ] List all formaldehyde-releasers: DMDM Hydantoin, Quaternium-15, Imidazolidinyl Urea, Diazolidinyl Urea, Bronopol
- [ ] Tag with `"formaldehydeReleaser": true`
- [ ] Note: these are in baby shampoos, conditioners — critical for Vulnerable Population Gate

### 1.8 Microplastics / Microbeads
- [ ] List plastic polymer ingredients: Polyethylene, Polypropylene, Nylon-12, Acrylates Copolymer
- [ ] Tag with `"microplastic": true`
- [ ] Add environmental data: non-biodegradable, found in ocean/fish/drinking water

### 1.9 Vulnerable Population Ingredient Lists
- [ ] Pregnancy unsafe: retinol, retinoids, salicylic acid (high %), phthalates, formaldehyde-releasers, oxybenzone, hydroquinone, thioglycolic acid
- [ ] Baby/infant unsafe: methylisothiazolinone, MIT, CMIT, certain preservatives, fragrances, alcohol (high %)
- [ ] Store as separate lookup: `VulnerableIngredients` table with `population` field

### 1.10 Greenwash Trigger Words
- [ ] List of unregulated marketing claims: "natural," "clean," "organic," "pure," "gentle," "hypoallergenic," "dermatologist tested," "dermatologist recommended," "clinically proven," "eco-friendly," "green," "non-toxic"
- [ ] Store as config/constant — used by Greenwash Gate
- [ ] Include explanation of why each term is unregulated

### 1.11 Open Beauty Facts Integration
- [ ] Set up API calls to https://world.openbeautyfacts.org/api/v2/search
- [ ] Product lookup by name: `?search_terms=neutrogena+hydro+boost`
- [ ] Product lookup by barcode: `https://world.openbeautyfacts.org/api/v2/product/{barcode}`
- [ ] Extract: product_name, brands, categories, ingredients_text, image_url
- [ ] Cache results in DynamoDB `Products` table (TTL: 7 days)
- [ ] Handle: product not found → prompt user to paste ingredients manually

---

## 2. BACKEND — Lambda Functions

### 2.1 `POST /api/analyze` — Single Product Analysis
- [ ] Accept: `{ query: string }` OR `{ ingredients: string }`
- [ ] If query: call Open Beauty Facts API to get ingredient list
- [ ] If ingredients: use raw text directly
- [ ] Run all 3 Ethics Logic Gates (see section 4)
- [ ] Call Bedrock Claude with ingredient list for analysis
- [ ] Cross-reference each ingredient against our DynamoDB ingredient tables
- [ ] Calculate scores: safety, environmental, transparency, honesty
- [ ] Find cleaner swap from `Swaps` table
- [ ] Return full analysis JSON

### 2.2 `POST /api/analyze/image` — Photo/OCR Analysis
- [ ] Accept: multipart form with image file
- [ ] Call Bedrock Claude Vision to extract ingredient list from image
- [ ] Return extracted ingredient text + confidence score
- [ ] If confidence > 70%: auto-run analysis
- [ ] If confidence < 70%: return extracted text for user to confirm/edit
- [ ] Handle: blurry images, angled shots, partial labels

### 2.3 `GET /api/search` — Product Autocomplete
- [ ] Accept: `?q=neutrogena`
- [ ] Search DynamoDB cache first
- [ ] If not in cache: call Open Beauty Facts search API
- [ ] Return: array of `{ id, name, brand, category }`
- [ ] Limit: 8 results max for autocomplete dropdown

### 2.4 `POST /api/routine` — Full Routine Analysis
- [ ] Accept: `{ products: [{ query: string }, ...] }`
- [ ] Run individual analysis for each product
- [ ] Detect ingredient interactions across products
- [ ] Calculate combined routine score
- [ ] Calculate cumulative daily/yearly exposure estimate
- [ ] Calculate environmental drain score (total non-biodegradable chemicals per use)
- [ ] Return: individual analyses + combined metrics + interaction warnings

### 2.5 `GET /api/ingredient/:name` — Ingredient Deep Dive
- [ ] Accept: INCI ingredient name
- [ ] Return full ingredient profile: description, safety, environmental, flags, bans, studies
- [ ] Used by Learn Mode (P2)

---

## 3. AI LAYER — Amazon Bedrock (Claude)

### 3.1 Ingredient Analysis Prompt
- [ ] System prompt: include scoring rubric, banned ingredient context, output JSON schema
- [ ] User prompt: ingredient list + product category + user profile (if set)
- [ ] Output schema: per-ingredient `{ name, plainEnglish, safetyScore, environmentalScore, flags, category }`
- [ ] AI explains, our DB verifies — AI is NOT the source of truth for ban data
- [ ] Temperature: 0.2 (factual, consistent)
- [ ] Model: Claude 3 Sonnet (balance of speed + quality)

### 3.2 OCR / Image Extraction Prompt
- [ ] System prompt: "Extract the ingredient list from this cosmetic product label image. Return only the ingredient list as comma-separated text. If you cannot read it clearly, return what you can with a confidence score."
- [ ] Use Claude 3 Sonnet vision capability
- [ ] Post-process: clean up OCR artifacts, normalize INCI formatting

### 3.3 Greenwash Detection Prompt
- [ ] Input: product name + marketing claims + ingredient list
- [ ] AI identifies specific contradictions between claims and ingredients
- [ ] Returns: `{ greenwashDetected: boolean, contradictions: [{ claim, reality }], honestyScore }`

### 3.4 Cleaner Swap Suggestion Prompt
- [ ] Input: product category + flagged ingredients + user profile
- [ ] AI suggests a cleaner alternative with reasoning
- [ ] Fallback: use our `Swaps` DynamoDB table if AI suggestion unavailable

### 3.5 Bedrock Setup
- [ ] Enable Claude 3 Sonnet in AWS Bedrock console (us-east-1)
- [ ] Lambda IAM role needs: `bedrock:InvokeModel` permission
- [ ] Use `@aws-sdk/client-bedrock-runtime` in Lambda handlers
- [ ] Handle: rate limits, timeouts (set Lambda timeout to 30s for AI calls)

---

## 4. ETHICS LOGIC GATES — Code Implementation

### 4.1 Disclosure Gate
```typescript
// TODO: implement in backend/src/lib/gates.ts
function disclosureGate(ingredients: string[]): GateResult {
  const hiddenChemicals = ["fragrance", "parfum", "aroma", "flavor"];
  const triggered = ingredients.some(i =>
    hiddenChemicals.includes(i.toLowerCase().trim())
  );
  if (triggered) {
    return {
      passed: false,
      gate: "disclosure",
      message: "This product hides ingredients behind 'fragrance' — a legal loophole concealing up to 3,000 chemicals. We cannot fully assess this product.",
      blockScore: true
    };
  }
  return { passed: true, gate: "disclosure" };
}
```
- [ ] Implement `disclosureGate()` function
- [ ] Unit test: product with "fragrance" → gate triggers
- [ ] Unit test: product without "fragrance" → gate passes
- [ ] Frontend: show warning banner, block overall score display

### 4.2 Vulnerable Population Gate
```typescript
// TODO: implement in backend/src/lib/gates.ts
function vulnerablePopulationGate(
  ingredients: string[],
  category: string,
  userProfile?: UserProfile
): GateResult {
  const vulnerableCategories = ["baby", "infant", "children", "pregnancy", "maternal", "prenatal"];
  const isVulnerableProduct = vulnerableCategories.some(c => category.toLowerCase().includes(c));
  const isVulnerableUser = userProfile?.lifeStage === "pregnant" || userProfile?.lifeStage === "nursing";

  if (isVulnerableProduct || isVulnerableUser) {
    const flaggedIngredients = ingredients.filter(i =>
      VULNERABLE_POPULATION_INGREDIENTS.includes(i.toLowerCase())
    );
    if (flaggedIngredients.length > 0) {
      return {
        passed: false,
        gate: "vulnerablePopulation",
        severity: "critical",
        flaggedIngredients,
        message: `SAFETY ALERT — This product contains ${flaggedIngredients.join(", ")}, flagged as unsafe for this population.`,
        requiresAcknowledgment: true,
        blockAll: true
      };
    }
  }
  return { passed: true, gate: "vulnerablePopulation" };
}
```
- [ ] Implement `vulnerablePopulationGate()` function
- [ ] Build `VULNERABLE_POPULATION_INGREDIENTS` constant list (see section 1.9)
- [ ] Unit test: baby shampoo with MIT → hard stop
- [ ] Unit test: regular moisturizer → passes
- [ ] Unit test: pregnant user profile + retinol product → hard stop
- [ ] Frontend: full-screen red alert, require acknowledgment tap

### 4.3 Greenwash Gate
```typescript
// TODO: implement in backend/src/lib/gates.ts
function greenwashGate(
  claims: string[],
  ingredients: string[],
  aiAnalysis: IngredientAnalysis[]
): GateResult {
  const UNREGULATED_CLAIMS = ["natural", "clean", "organic", "pure", "gentle", "hypoallergenic"];
  const hasClaims = claims.some(c =>
    UNREGULATED_CLAIMS.some(u => c.toLowerCase().includes(u))
  );
  const hasFlaggedIngredients = aiAnalysis.some(i => i.safetyScore < 5 || i.flags.length > 0);

  if (hasClaims && hasFlaggedIngredients) {
    return {
      passed: false,
      gate: "greenwash",
      claims,
      contradictions: aiAnalysis.filter(i => i.flags.length > 0),
      honestyScore: calculateHonestyScore(claims, aiAnalysis),
      message: "This product's marketing claims do not match its actual ingredients."
    };
  }
  return { passed: true, gate: "greenwash" };
}
```
- [ ] Implement `greenwashGate()` function
- [ ] Implement `calculateHonestyScore()` helper
- [ ] Unit test: "natural" product with synthetic chemicals → triggers
- [ ] Unit test: honest product with matching claims → passes
- [ ] Frontend: side-by-side claims vs reality display

---

## 5. FRONTEND — React Components

### 5.1 Search Screen
- [ ] `SearchBar` component — text input with autocomplete dropdown
- [ ] `IngredientPaste` component — expandable textarea for raw ingredient list
- [ ] `ImageUpload` component — drag/drop or file picker, shows preview
- [ ] Loading state while analysis runs
- [ ] Error state if product not found

### 5.2 Gate Alert Components
- [ ] `DisclosureWarning` — yellow banner, blocks score, explains fragrance loophole
- [ ] `VulnerablePopulationAlert` — full-screen red modal, requires acknowledgment button
- [ ] `GreenwashAlert` — orange banner with claims vs reality side-by-side

### 5.3 Analysis Dashboard
- [ ] `ScoreCard` component — circular gauge, color-coded (red/orange/yellow/green)
- [ ] `ScoreRow` — 4 score cards in a row: Safety | Environmental | Transparency | Honesty
- [ ] `BannedElsewhereBanner` — "⚠️ X ingredients banned in EU" — tappable
- [ ] `IngredientList` — scrollable list, color-coded by safety score
- [ ] `IngredientItem` — expandable row: name → plain English + scores + flags + bans
- [ ] `SwapCard` — cleaner alternative with score comparison and price diff

### 5.4 Routine Builder (P1)
- [ ] `RoutineBuilder` — add/remove products, shows list of added products
- [ ] `RoutineSummary` — combined score, interaction warnings, cumulative exposure
- [ ] `InteractionWarning` — specific warning when two products interact badly
- [ ] `EnvironmentalDrainScore` — "Your routine sends Xg of chemicals into waterways daily"

### 5.5 User Profile / Personalization (P1)
- [ ] `ProfileSetup` — optional onboarding: skin type, concerns, life stage, allergies
- [ ] Stored in `localStorage` — no account, no server
- [ ] `ProfileBadge` — small indicator showing active profile (e.g., "Pregnant mode on")
- [ ] Profile affects: which gates fire, which flags are highlighted, swap suggestions

### 5.6 Design System
- [ ] Color coding: 🟢 8-10 safe, 🟡 5-7 moderate, 🟠 3-4 concerning, 🔴 1-2 dangerous
- [ ] Score gauge component (circular progress)
- [ ] Gate alert color system: red (critical/block), orange (warning), yellow (info)
- [ ] Mobile-first responsive layout
- [ ] Accessible: ARIA labels, keyboard navigation, sufficient color contrast

---

## 6. INFRASTRUCTURE — CDK Stacks

### 6.1 SharedStack (deploy first)
- [ ] DynamoDB `Products` table (PK: productId, TTL on cached items)
- [ ] DynamoDB `Ingredients` table (PK: inci_name)
- [ ] DynamoDB `Swaps` table (PK: category)
- [ ] Export table names as CDK outputs

### 6.2 BackendStack (deploy second)
- [ ] Lambda: `analyzeProduct` (POST /api/analyze)
- [ ] Lambda: `analyzeImage` (POST /api/analyze/image)
- [ ] Lambda: `searchProducts` (GET /api/search)
- [ ] Lambda: `analyzeRoutine` (POST /api/routine)
- [ ] Lambda: `getIngredient` (GET /api/ingredient/:name)
- [ ] API Gateway REST API with CORS
- [ ] Lambda IAM roles: DynamoDB read/write + Bedrock InvokeModel
- [ ] Environment variables: TABLE_NAMES, BEDROCK_MODEL_ID

### 6.3 FrontendStack (deploy last)
- [ ] S3 bucket for React build output
- [ ] CloudFront distribution with SPA routing (404 → index.html)
- [ ] BucketDeployment to upload `frontend/dist`
- [ ] Output: CloudFront URL

---

## 7. DATA SEEDING — Pre-populate DynamoDB

### 7.1 Ingredients Seed Data
- [ ] Script: `scripts/seed-ingredients.ts`
- [ ] Seed top 200 most common cosmetic ingredients with full profiles
- [ ] Include all EU banned ingredients (Annex II)
- [ ] Include all PFAS-tagged ingredients
- [ ] Include all endocrine disruptors
- [ ] Include all formaldehyde-releasers
- [ ] Include all microplastics
- [ ] Run: `bun run scripts/seed-ingredients.ts`

### 7.2 Swaps Seed Data
- [ ] Script: `scripts/seed-swaps.ts`
- [ ] Seed cleaner alternatives by category:
  - Moisturizer: CeraVe, Vanicream, La Roche-Posay
  - Sunscreen: EltaMD, Badger, Thinksport
  - Shampoo: Free & Clear, Vanicream, Acure
  - Body wash: Dr. Bronner's, Vanicream
  - Deodorant: Native, Schmidt's, Crystal
- [ ] Each swap: name, brand, score, avg price, category

---

## 8. SHARED TYPES

### 8.1 `shared/types.ts`
- [ ] `Ingredient` — inci_name, plainEnglish, safetyScore, environmentalScore, flags, bannedIn, category
- [ ] `ProductAnalysis` — product, gates, ingredients, scores, bannedElsewhere, swap
- [ ] `GateResult` — gate name, passed, message, severity, blockScore, blockAll, requiresAcknowledgment
- [ ] `RoutineAnalysis` — products, combinedScore, interactions, cumulativeExposure, environmentalDrain
- [ ] `UserProfile` — skinType, concerns, lifeStage, allergies, ageRange
- [ ] `Score` — safety, environmental, transparency, honesty (all 1-10)
- [ ] `BannedElsewhere` — ingredient, bannedIn[], reason, regulation

---

## 9. DEMO SCRIPT (for 2-min video)

- [ ] **0:00-0:20** — Problem statement: "The US bans 11 cosmetic ingredients. The EU bans 1,600. Same companies, different formulas."
- [ ] **0:20-0:45** — Search "Neutrogena Hydro Boost" → show ingredient breakdown, flagged chemicals, Banned Elsewhere banner
- [ ] **0:45-1:05** — Scan a baby product → trigger Vulnerable Population hard stop (red screen)
- [ ] **1:05-1:25** — Show Greenwash Gate: "natural" product with synthetic chemicals
- [ ] **1:25-1:45** — Add 3 products to routine → show combined score + interaction warning
- [ ] **1:45-2:00** — Show cleaner swap suggestion + closing pitch

---

## 10. SUBMISSION CHECKLIST

- [ ] GitHub repo public and accessible
- [ ] README with setup instructions
- [ ] App deployed and accessible via CloudFront URL
- [ ] 2-3 min YouTube video (unlisted)
- [ ] Airtable submission form filled out
- [ ] Write-up: how Kiro was used (SDD, agents, hooks, steering docs, MCP)
- [ ] Social media post (bonus)
