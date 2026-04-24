# PMD — Product Management Document

> **Track:** Environment / Inclusion crossover (Kiro Spark Challenge @ ASU, 2026). Personal-care framing, regulatory data as receipts, multi-agent AI as the Kiro-native moment.
> 

> **One-line pitch:** Yuka shouts "TOXIC." We say *"sulfates are like sugar — fine in moderation, brutal at scale, and they're working against the acne goal you told us about."* Personalized chemical coach, multi-agent AI, no fearmongering.
> 

---

# 1. What We're Building

DermaDecode is a personal skincare assistant. The user signs up, walks through a one-time onboarding (age, gender, skin type, skin goals, current products), and our multi-agent AI runs in the background to produce four things:

1. **A chemical breakdown of every product they use** — what's in it, what it does to *their* skin given *their* profile.
2. **Analogy-first explanations** — instead of "sulfates are harmful," we say *"sulfates are like sugar — your skin tolerates them in moderation, but a sulfate-heavy shampoo daily for years strips your natural oils and triggers the dryness you're trying to fix."* Calibrated to the user's stated goals.
3. **Banned-elsewhere context** — when an ingredient is banned in EU / California / Canada / etc., we surface that as a sanity-check chip ("unregulated in the US, EU banned it in 2009 — here's why").
4. **Alternative product recommendations** — products without the flagged chemicals, matched to the user's skin type and goals.

**The user flow:**

```
[Sign up] \u2192 [Onboard once: age \u00b7 gender \u00b7 skin type \u00b7 goals \u00b7 current products]
        \u2192 [AI magic runs] \u2192 [Personalized chemical report \u00b7 analogies \u00b7 alternatives]
        \u2192 [Ongoing: add products / update goals \u2192 re-coach]
```

The "AI magic" is **not one big LLM call**. It's an **orchestrator agent** delegating to specialized **sub-agents** — one scans products for harmful ingredients, one reasons about the user's skin type and goals, one writes the analogies, one finds alternatives, one cross-references regulatory bans. The orchestrator composes their outputs into a single coherent response. **This multi-agent design is the centerpiece of our Kiro implementation and the demo's wow moment.**

---

# 2. The Problem

## 2.1 Existing apps fail in three specific ways

1. **Binary scare scoring.** Yuka, Think Dirty, EWG Skin Deep slap a 1–10 score on each ingredient and call it a day. A daily-use sulfate shampoo and a once-a-month sulfate clarifier get the same warning. That's wrong, and users feel it — there's a chorus of "I don't trust this app's vibes" reviews on every existing scanner.
2. **No personalization.** A retinol product flagged for a 22-year-old with oily acne-prone skin and the same product flagged for a pregnant woman should produce *different* warnings. Existing apps treat both users identically.
3. **No analogy bridge.** "This product contains parabens, an endocrine disruptor" means nothing to someone who hasn't taken endocrinology. People understand sugar and stress and overuse. They don't understand "endocrine disruption."

## 2.2 The micro problem (why a user cares)

| User | Pain | What current apps do | What they actually need |
| --- | --- | --- | --- |
| **The 25-year-old with hormonal acne** | Tries 4 different cleansers, condition keeps flaring | Generic 1–10 score, no read on hormones | "Your cleanser has a sulfate — like sugar, fine occasionally, but you're using it 2× daily, which strips protective oils and triggers compensatory oil production. Here's a gentler one." |
| **The 40-year-old worried about wrinkles** | Bought 3 retinol products, doesn't know which to layer | "Caution: retinol" | "Retinol works — the question is dose. You're using 3 products with retinoids, that's like running a marathon every day; your skin barrier needs recovery time. Pick one, use it 3×/week." |
| **The pregnant user** | Doctor said "avoid this list," can't decode labels | Generic warnings | Profile + life stage → custom warning per product, with the EU regulation cited as backup |
| **The man who never thought about skin** | Bought what looked good at Target | Confusing ingredient-list app | "Here's why your $4 deodorant was banned in Germany. Here's a $5 one that wasn't." |

## 2.3 Why our wedge works

We're not the seventh ingredient scanner. We're **the first product that explains chemicals like a friend with a chemistry degree, not a label that screams TOXIC**, and we do it in a coach format that follows the user over time.

The analogy-first approach is the moat. Once a user reads "sulfates are sugar — fine in moderation, brutal at scale" and the metaphor lands, they can't look at a label the same way again. That's the share-with-a-friend moment.

---

# 3. Target Users

**Primary persona:** "The reluctant researcher." Aged 22–45, has a skin concern (acne / aging / sensitivity / dryness), reads ingredient labels reluctantly, doesn't trust marketing, doesn't have time to learn organic chemistry. Wants someone to translate. ~30M US adults.

**Secondary personas:**

- Pregnant / nursing / TTC users (high-motivation researcher mode)
- New parents researching baby products
- Chronic skin conditions (eczema, rosacea, psoriasis) — 31M Americans per NEA
- Men starting a routine (totally underserved by existing apps)

---

# 4. The Differentiators

## 4.1 Analogy-first explanations

Every flagged ingredient gets an analogy that maps the unfamiliar (chemistry) to the familiar (everyday wear-and-tear). Three rules every analogy must follow:

1. **Respect dose.** *"Sugar in moderation is fine; in excess it does X"* → *"This ingredient in moderation is fine; if you use it 2× daily for years, it does X."*
2. **Respect the user's goal.** If the user's goal is *less acne*, the analogy explains how the chemical sabotages *that specific goal* — not generic harm.
3. **Be true.** If the chemistry doesn't actually behave like the analogy, we don't ship it. The Analogy sub-agent has a fact-check pass.

**Example outputs (what the user actually sees):**

> **Sodium Lauryl Sulfate · in your Head & Shoulders shampoo**
> 

> *Sulfates are like sugar.* Once a week is fine. Twice a day for years strips the natural oils your scalp uses to stay healthy — which is the exact mechanism behind the dry, itchy scalp you flagged in your goals. **Banned in the EU at concentrations above 1% in leave-on products.** Try: Vanicream Free & Clear Shampoo (sulfate-free, ~$10, matches your sensitive skin profile).
> 

> **Retinol · in your night cream + your serum + your eye cream**
> 

> *Three retinol products is like training for a marathon every day.* Retinol works — you don't need three of them. Pick the night cream, use it 3×/week, give your barrier 24h recovery between applications. (Bonus: if you're TTC, retinol crosses the placenta in pregnancy — the EU restricts it; we'll surface a pregnancy-safe alternative the moment you flag that life stage.)
> 

## 4.2 Multi-agent AI orchestration

Most "AI apps" are a single LLM call wrapped in UI. We're not. Our backend runs an **orchestrator pattern**:

```
                  \u250c\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2510
                  \u2502   Orchestrator Agent       \u2502
                  \u2502   (decomposes the task,    \u2502
                  \u2502    composes the answer)    \u2502
                  \u2514\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u252c\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2518
                                \u2502
     \u250c\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u252c\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u253c\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u252c\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2510
     \u25bc              \u25bc           \u25bc           \u25bc              \u25bc
\u250c\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2510   \u250c\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2510 \u250c\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2510 \u250c\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2510 \u250c\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2510
\u2502 Scanner \u2502   \u2502 Profile  \u2502 \u2502 Analogy \u2502 \u2502Alternate \u2502 \u2502 Regulatory   \u2502
\u2502 Agent   \u2502   \u2502 Reasoner \u2502 \u2502 Writer  \u2502 \u2502 Finder   \u2502 \u2502 Cross-ref    \u2502
\u2514\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2518   \u2514\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2518 \u2514\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2518 \u2514\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2518 \u2514\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2518
 For each      What does    Map chem   Find swaps    Banned in
 product:      THIS user's  to plain-  matching      EU? CA? CA?
 what's in it, profile +    English    skin type +   Cite the
 what's flagged goals need? analogies  goals         regulation
```

Each sub-agent has a narrow prompt, narrow output schema, and is independently testable. The orchestrator owns task decomposition and answer composition. **This pattern is exactly what Kiro's spec-driven multi-agent workflow is built for** — every sub-agent gets its own spec file, the orchestrator gets steering rules, and hooks enforce the contract between them.

## 4.3 Personalization that actually changes the output

The user's profile (age, gender, skin type, goals) is passed into every sub-agent's prompt. The Profile Reasoner agent's whole job is filtering generic chemical hazards down to *the ones that matter for this user*. Result: two users with the same products get different breakdowns.

## 4.4 Banned-elsewhere as receipts, not headlines

We don't lead with "BANNED IN EU" panic. We lead with the analogy. *Then* we surface "by the way, this is also banned in 27 EU countries — here's the regulation" as the receipt that backs up the analogy. It's the small chip in the corner, not the giant red banner.

---

# 5. User Journey

## 5.1 First session (~3 minutes)

1. **Sign up** — email magic link via Supabase Auth.
2. **Onboarding step 1: About you.** Age range. Gender. Skin type (sensitive / dry / oily / combination / normal).
3. **Onboarding step 2: Your skin goals.** Multi-select — reduce acne / anti-aging / even tone / hydration / less sensitivity / less oil / general maintenance. Pick 1–3.
4. **Onboarding step 3: Your products.** A guided picker for ~10 product categories (shampoo, conditioner, body wash, face cleanser, moisturizer, sunscreen, deodorant, toothpaste, lip balm, makeup foundation). For each: search by brand+name (Open Beauty Facts), pick from a top-50 common-products dropdown, paste ingredients manually, or skip.
5. **AI magic loading screen** — orchestrator runs (~10–20 seconds). The UI shows the sub-agents working live (*"Scanning your moisturizer…" → "Reading your skin profile…" → "Writing analogies for 4 flagged ingredients…" → "Cross-checking EU and California ban lists…" → "Finding alternatives that match your sensitive-skin profile…"*). This is theater — but it makes the multi-agent architecture visible and is the demo's wow moment.
6. **The dashboard appears** — personalized chemical report card with analogies, banned-elsewhere chips, and alternative suggestions per category.

## 5.2 Returning sessions

- **Add a new product** — same picker, single product, runs incremental orchestrator.
- **Update goals or skin profile** — re-runs the orchestrator with new context. Outputs change.
- **Goal coach** — "Since you swapped your shampoo two weeks ago, your hydration goal is on track."

---

# 6. Vision — Where this goes beyond cosmetics

The architecture (user profile + ingredient DB + analogy-first explanations + multi-agent orchestration + regulatory cross-reference) generalizes. Cosmetics is the wedge because the personal pain is loudest, but the same pattern works for:

## 6.1 Phase 2 — Household + intimate care (3 months)

Cleaning products, laundry detergent, menstrual care, oral care. New ingredient databases, **same analogy framework, same agent architecture, same user profile.**

## 6.2 Phase 3 — Clothing & textiles (6–12 months)

PFAS in waterproof gear, azo dyes (banned in EU), microplastic shedding from synthetics, flame retardants in pajamas. Data sources: OEKO-TEX, GOTS. The "this would be illegal in [country]" framing maps cleanly. Same agent orchestration: scanner reads materials, profile reasoner knows your sensitivity / asthma / allergies, analogy writer translates "PFAS" into something a human can understand.

## 6.3 Phase 4 — Food (12–18 months)

The biggest market. Same model: user goals (lose weight / build muscle / better sleep / less inflammation), foods they actually eat, analogy-first explanations of what each ingredient does to *their* goals. Red 40 and Yellow 5 banned in EU as a sanity-check chip. The analogy framework is exactly as powerful for food as for skincare.

## 6.4 The through-line

**One user profile + one analogy engine + one agent orchestration → many label categories.** The most important sentence in this PMD: *the app stays the same; the label categories widen.*

---

# 7. Success Metrics

## 7.1 Hackathon submission (Friday Apr 24, 11:59 PM)

- [ ]  Deployed at a public URL with working email auth
- [ ]  Onboarding completable in < 3 minutes
- [ ]  Orchestrator + at least 4 sub-agents running on Claude
- [ ]  At least 3 demo products produce a complete analogy-driven analysis end-to-end
- [ ]  Ingredient DB seeded with 200+ ingredients including ban data for top 50
- [ ]  At least 3 banned-elsewhere chips fire across the demo flow
- [ ]  At least 5 hand-curated analogies for the most-likely-to-fire ingredients (sulfates, parabens, retinol, formaldehyde-releasers, oxybenzone)
- [ ]  2–3 min YouTube demo (unlisted)
- [ ]  GitHub repo public with Kiro spec/steering/hooks visible

## 7.2 Devpost rubric targets (~24/30)

- **Potential Value (10):** ~30M-person US market, share-worthy analogy moment, men/baby/pregnancy expansion paths.
- **Implementation (10):** Multi-agent orchestration is unmistakably "Kiro-native." Each agent gets a spec file. Steering files enforce the analogy-first rule.
- **Quality & Design (10):** Analogy-first writing is unique in the category; polished onboarding flow; the live agent-progress UI is the visual hook.

## 7.3 Post-hackathon (weeks 1–4)

- 500 signups, 100 completed onboardings
- Average user has 5+ products tracked
- One viral analogy share on TikTok / Reddit / X

---

# 8. Why We Win

| Criterion | Our move |
| --- | --- |
| **Wedge** | Analogy-first explanation. Nobody else does this. |
| **AI architecture** | Multi-agent orchestration, not a single LLM call. |
| **Personalization** | Onboarding profile + skin goals → every analogy is calibrated. |
| **Receipts** | Banned-elsewhere with regulation citations as the sanity check. |
| **Demo story at 9 PM** | "It told me my shampoo's sulfate is like sugar — fine sometimes, brutal daily. I'd been using it daily for 8 years." That sentence is the pitch. |
| **Kiro fit** | Multi-agent design is exactly what Kiro's spec/steering/hooks pattern is built for. Each sub-agent gets its own spec; steering enforces the analogy-first writing rule. |

---

# 9. Non-goals

- **Not a medical app.** No diagnosis, no treatment claims. Disclaimer in UI on every analysis.
- **Not a fearmonger.** No "TOXIC," "POISON," or "AVOID AT ALL COSTS." Analogies, not alarms.
- **Not citing the debunked "2kg of chemicals absorbed/year" myth.** Calibrated, peer-reviewed sources only.
- **Not building our own ingredient database from scratch in 36 hours.** Seed the top 200 most-relevant ingredients; LLM contextualizes the long tail with clear uncertainty labels.
- **Not building barcode scanning in MVP.** Search by name + paste + common-product picker first. Barcode is P1.
- **Not training our own models.** All AI is Claude via Anthropic API.

---

# 10. Open Questions

- [ ]  **Product source strategy** — Open Beauty Facts (free, ~60% US coverage) + LLM-resolution fallback? Or pre-seed top 50 common products per category? **Leaning hybrid:** OBF for search, LLM-resolution when OBF misses, pre-seeded common-products picker for the fastest onboarding path.
- [ ]  **Analogy generation** — fully LLM-generated each time, or pre-written analogies for top 50 ingredients + LLM fallback? **Leaning pre-written for top 50** (quality control matters); LLM for the long tail with a fact-check pass.
- [ ]  **Goal-coach loop** — push notifications / weekly emails as goals progress? P1, not MVP.
- [ ]  **Life stage field** — do we add "pregnant / nursing / TTC" to onboarding for MVP, or P1? Adds risk to MVP scope but unlocks the most powerful personalization. **Leaning P1.**

---

# 11. Related Docs

- **Feature List** — what we ship (sibling page in hub)
- **Tech Architecture, Schemas & API** — how it's built (sibling page in hub)
- **GitHub repo** — `dhamuASU/Kiro-Hackathon`