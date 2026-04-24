# CleanLabel — Cross-Agent Working Agreement

> **Read this first.** This directory tells the two non-master agents (Frontend, Agents) how to navigate the backend they cannot freely modify, and how to coordinate without merge conflicts.

## 1. Roles

| Role | Owner | Lane (writable paths) |
|---|---|---|
| **Master / Backend** | This agent | Everything in the repo. Defines the contract. |
| **Frontend** | Frontend agent | `web/**` only. (Will be created at `/web` when scaffolded.) |
| **Agents** | Agents agent | `api/services/agents/**`, `api/services/llm/**`, `api/services/ocr.py` |

The Master is the only role that may change Pydantic schemas, routers, DB migrations, seed scripts, or env config. Frontend and Agents read the contract; they do not redefine it.

## 2. Hard rules — the don't-touch list

### Frontend MUST NOT touch
- `api/**` (anywhere — including agents, schemas, routers, db, tests)
- `.kiro/specs/**`, `.kiro/steering/**`
- `supabase/**` if/when added
- Any file that talks to the LLM directly. The browser never sees the LLM key.

### Agents MUST NOT touch
- `api/routers/**` — endpoint signatures are frozen by Master
- `api/schemas/**` — request/response contracts are frozen by Master (the `agent.py` schema file is read-only reference; if you need a new field, file a request — see §4)
- `api/db/**`, `api/main.py`, `api/config.py`, `api/deps.py`
- `web/**`
- `.kiro/**`

### Both MUST NOT
- Add new dependencies to `pyproject.toml` or `package.json` without filing a request to Master
- Push to `main` directly — branch + PR
- Disable or skip pre-commit hooks
- Commit env files, API keys, or seed dumps with PII
- Cite "TOXIC", "POISON", "AVOID AT ALL COSTS", or the debunked "2 kg of chemicals/year" line. The product rule: analogies, not alarms.

## 3. Where the spec lives (read these before you write anything)

1. **Notion Project Hub** — the source of truth for product, features, and the API contract.
2. `.kiro/steering/product.md` — the analogy-first writing rule.
3. `.kiro/steering/api-contract.md` — endpoint catalog (mirrors the Notion Tech Doc §8).
4. `.kiro/steering/tech.md` — stack and conventions.
5. `.kiro/steering/structure.md` — directory layout.
6. `api/schemas/**` — Pydantic models. **The contract.** When in doubt, the schema wins.

If Notion and code disagree, **the code is the contract** for the duration of the build; Master reconciles back to Notion before submission.

## 4. How to coordinate without merge conflicts — the changelog protocol

Every shipped change and every cross-agent request gets its own file in `api_docs/changelog/`. Filenames are time- and agent-stamped so two agents writing in parallel can never collide.

**Filename pattern:** `YYYY-MM-DD-HHMMSS-{agent}-{kebab-slug}.md`

- `agent` ∈ `frontend` | `agents` | `master`
- `slug` is a short kebab-case description (e.g. `onboarding-step-products`, `analogy-writer-impl`, `request-add-life-stage-field`)
- Use UTC. Use 24h time. Pad with zeros.

**Examples:**
- `2026-04-24-153000-frontend-camera-capture-component.md`
- `2026-04-24-154212-agents-orchestrator-impl.md`
- `2026-04-24-160500-frontend-request-add-progress-percent-to-sse.md`

This means **no agent ever edits another agent's changelog file**. New entry = new file. Merge conflicts are mathematically impossible on this directory.

See `changelog/README.md` for the required entry shape and `changelog/_template.md` to copy.

## 5. The cross-agent request flow

Either non-master agent can request a change to something outside their lane. **Do not edit other lanes — file a request instead.**

1. Write a changelog entry with `tags: [request-master]` (or `request-frontend` / `request-agents`).
2. State **what** you need, **why**, and **the smallest possible change** that unblocks you.
3. In the meantime, stub against the *current* contract. Don't block.
4. Master triages, makes the change, writes a `master` changelog entry referencing your file's slug, and pings.

Examples:

- Agents need a new SSE event name → request to Master (Master owns `api/services/events.py`).
- Frontend needs a new endpoint field → request to Master (Master owns `api/schemas/`).
- Frontend wants the orchestrator to emit progress percent → request to Agents.

## 6. Reading the existing scaffold

Master has already stubbed:

- `api/services/agents/{base,orchestrator,scanner,profile_reasoner,analogy_writer,alternative_finder,regulatory_xref}.py` — Agents fills these in.
- `api/services/llm/{client,prompts}.py` — Agents fills these in.
- `api/services/ocr.py` — Agents fills this in (vision OCR for scan endpoints).
- `api/routers/**` — finished. Don't change without a request.
- `api/schemas/**` — finished. Don't change without a request.
- `api/db/**` — schemas + seed scripts. Owned by Master / Data.

Look for the marker `OWNED BY AI TEAMMATE` in module docstrings — that's the Agents lane. Everything else is Master's.

## 7. Definition of done — for any change

Before you write a changelog entry marking something `status: done`:

- [ ] Code typechecks (`mypy` / `tsc --noEmit`).
- [ ] Unit tests for the new behavior pass.
- [ ] You did not touch a path outside your lane (run `git diff --name-only`).
- [ ] If you needed something outside your lane, you filed a `request-*` changelog entry.
- [ ] No mentions of model brand names in user-facing strings or in committed docs. Use "the LLM" / "vision model" generically.
- [ ] No "TOXIC" / "POISON" / fearmonger language in any user-visible string.

## 8. Quick links

- **Frontend agent — start here:** [`./frontend/README.md`](./frontend/README.md)
- **Agents agent — start here:** [`./agents/README.md`](./agents/README.md)
- **Changelog convention:** [`./changelog/README.md`](./changelog/README.md)
- **Changelog template:** [`./changelog/_template.md`](./changelog/_template.md)
