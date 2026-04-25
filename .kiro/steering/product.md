# Product — CleanLabel (DermaDecode)

## What we're building

A personal skincare coach that breaks down the chemistry in the user's
bathroom using everyday analogies. The user signs up, completes a 3-minute
onboarding (age, gender, skin type, 1–3 skin goals, current products), and
a multi-agent AI produces a personalized chemical report with:

1. **Plain-English ingredient breakdowns** calibrated to the user's profile.
2. **Analogy-first explanations** (e.g. *"sulfates are like sugar"*).
3. **Banned-elsewhere chips** — EU / California / Canada / Hawaii citations
   as receipts backing up the analogy, never as the headline.
4. **Actionable swaps** — cleaner alternatives that match skin type + goals.

## The four winning moves

1. **Analogy-first writing** — never "TOXIC," never scare tactics.
2. **Multi-agent orchestration** — orchestrator + 5 narrow sub-agents.
3. **Personalization** — profile + goals flow into every agent prompt.
4. **Regulatory receipts** — exact citations, not paraphrases.

## The analogy-first rule (apply to every user-facing string)

Every flagged ingredient gets an analogy that maps the unfamiliar
(chemistry) to the familiar (everyday wear-and-tear). Three rules:

1. **Respect dose.** Note when the concern is cumulative or frequency-based.
2. **Respect the user's goal.** Explain how the chemical sabotages *this*
   user's specific stated goal, not generic harm.
3. **Be true.** If the chemistry doesn't actually behave like the analogy,
   don't ship it. The Analogy Writer runs a fact-check pass for a reason.

**Never** use the word "TOXIC", "POISON", or "AVOID AT ALL COSTS." Never
cite the debunked "2kg of chemicals absorbed per year" statistic.

## Target user

Aged 22–45, has a skin concern (acne / aging / sensitivity / dryness),
reads ingredient labels reluctantly, doesn't trust marketing, doesn't have
time to learn organic chemistry. Wants someone to translate.

## Non-goals

- Not a medical app. No diagnosis, no treatment claims. Disclaimer on every
  analysis.
- Not a fearmonger. Analogies over alarms.
- Not a binary safe/unsafe verdict machine.
- Not training our own models.
- Not "will this give me cancer in 10 years" predictions.

## Demo-moment priorities

Every MVP feature must serve one of these:

| Demo moment | Features |
|-------------|----------|
| **Onboarding magic** — zero to personalized in 3 min | Auth + wizard + common-products picker |
| **Agent theater** — user watches 5 sub-agents work | Orchestrator SSE + `/api/analyze/{id}/stream` |
| **Camera moment** — phone at a bottle, ingredients appear | POST /api/scan/label mode=back |
| **Analogy moment** — *"sulfates are like sugar"* | Curated `analogies` + Analogy Writer |
| **The receipt** — *"banned in EU"* chip | `bans` table + Regulatory Xref |
| **The swap** — *"here's a $10 alternative for your sensitive skin"* | `alternatives` + Alternative Finder |
