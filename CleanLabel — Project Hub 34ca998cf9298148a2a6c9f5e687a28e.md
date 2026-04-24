# CleanLabel — Project Hub

> **What it is:** A personal skin coach. The user signs up, walks through a one-time onboarding (age, gender, skin type, skin goals, current products), and our multi-agent AI breaks down the chemistry in their bathroom — using analogies, not scare tactics — and recommends safer alternatives calibrated to their goals.
> 

> **What it isn't:** A fearmongering ingredient scanner. We don't shout "TOXIC." We say *"sulfates are like sugar — fine in moderation, brutal at scale,"* and we tailor it to your skin and your goals.
> 

> **Repo:** `dhamuASU/Kiro-Hackathon`
> 

---

# 📚 Team Documents

Read in order. Come back here for anything cross-cutting.

1. **PMD — Product Management Document** — what we're building, why it matters, who it's for, where it goes in 12 months.
2. **Feature List** — everything the app does, scoped MVP vs. P1 vs. P2.
3. **Tech Architecture, Schemas & API** — Next.js + FastAPI + Supabase. Multi-agent architecture, every table, every endpoint, every sample response.

# 👥 Team & Roles

| Role | Responsible for | Primary docs |
| --- | --- | --- |
| **Frontend** | Next.js 14 app, auth flow, onboarding wizard, dashboard, product picker | Tech Doc §Frontend, Feature List §Onboarding + §Dashboard |
| **Backend / AI** | FastAPI service, **agent orchestration**, LLM prompts, OBF integration, Supabase queries | Tech Doc §Backend + §Agents + §API, Feature List §AI |
| **Data** | Supabase schemas, ingredient DB seeding, analogy templates, banned-elsewhere data, alternatives catalog | Tech Doc §Schemas, Feature List §Data |

---

# 🧭 The four moves that win this

1. **Analogy-first writing.** No "TOXIC" — every flagged ingredient gets a "this is like X" line that respects dose and the user's goal. This is the share-with-a-friend moment.
2. **Multi-agent orchestration.** One orchestrator + four-to-five specialized sub-agents (scanner, profile reasoner, analogy writer, alternative finder, regulatory cross-ref). This is the Kiro-native demo moment.
3. **Personalization.** The analogy and the alternatives change based on the user's skin type and goals. Not generic.
4. **Banned-elsewhere as receipts.** EU / California / Canada bans appear as a small chip backing up the analogy — never as the headline.

---

# 🧱 Working agreement

- **PMD** is the *why*. Don't change without team sync.
- **Feature List** is the live punch-list — tick boxes as we ship.
- **Tech Doc** is the contract. Frontend builds against the exact endpoints and schemas defined there. Any change = Slack message + doc update + type regen.

[PMD — Product Management Document](PMD%20%E2%80%94%20Product%20Management%20Document%2034ca998cf9298183b4c5f938a22b0c4e.md)

[Feature List](Feature%20List%2034ca998cf92981f79c29d7f5b2b5e632.md)

[Tech Architecture, Schemas & API](Tech%20Architecture,%20Schemas%20&%20API%2034ca998cf92981748bf3d747b0a20bdc.md)