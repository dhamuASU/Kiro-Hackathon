# Changelog Convention

> One file per change. One file per request. Filenames are time-stamped and agent-stamped so two parallel writers can never produce a merge conflict.

## 1. Why per-file (and not a single CHANGELOG.md)

Three agents (Master, Frontend, Agents) ship in parallel. A shared `CHANGELOG.md` would be a guaranteed conflict zone — every PR appends to the top, every PR collides. Per-file changelog entries side-step the problem entirely: each agent writes their own files, into their own filename namespace, and `git merge` never has to think.

## 2. Filename pattern

```
YYYY-MM-DD-HHMMSS-{agent}-{kebab-slug}.md
```

| Field | Rules |
|---|---|
| `YYYY-MM-DD` | UTC date, zero-padded |
| `HHMMSS` | UTC 24h time, zero-padded (e.g. `095300` for 09:53:00) |
| `{agent}` | one of `master`, `frontend`, `agents` |
| `{kebab-slug}` | short, lowercase, hyphen-separated description (≤ 6 words) |

**Examples:**

```
2026-04-24-153000-frontend-camera-capture-component.md
2026-04-24-154212-agents-orchestrator-impl.md
2026-04-24-160500-frontend-request-add-progress-percent-to-sse.md
2026-04-24-161800-master-add-life-stage-field-to-profile.md
2026-04-24-170045-agents-scanner-db-first-impl.md
```

If you accidentally collide on a second-precision timestamp, append `-1`, `-2`, etc.

## 3. Required sections in every entry

Every changelog file is a markdown doc with this exact header block, then free-form notes:

```markdown
---
date: 2026-04-24T15:30:00Z
agent: frontend                                  # master | frontend | agents
type: change                                     # change | request | breaking | rollback
status: shipped                                  # planned | in-progress | shipped | abandoned
tags: [onboarding, sse]                          # optional, free-form
references:                                      # optional cross-links
  - 2026-04-24-141000-master-add-onboarding-routes.md
---

# <One-line title — what changed, in user-facing terms>

## Why
<2–4 sentences. Link to the PMD / Feature List / Notion section if relevant.>

## What changed
<Bullets. Concrete. "I implemented X" not "I worked on X".>

## Files touched
<Plain list. `path:lineRange` if narrow, just the path if broad.>

## Cross-agent requests
<None / list any "I need agent X to do Y by Z" with rationale.>

## Risks / rollback
<What breaks if this is wrong. How to undo.>
```

> The frontmatter is parseable. Don't decorate it with comments or alternate keys.

## 4. The four `type` values — and when to use each

| `type` | When |
|---|---|
| `change` | You shipped (or are shipping) something inside your lane. |
| `request` | You need another agent to do something outside your lane. Set `tags: [request-{master\|frontend\|agents}]`. |
| `breaking` | You're shipping a change that alters a contract other agents depend on (e.g. SSE event renamed). Master must approve before this hits `main`. |
| `rollback` | You're undoing a previous change. Reference the original entry in `references`. |

## 5. The cross-agent request flow (the only way to ask for changes outside your lane)

You must **never** edit a path outside your lane. Instead:

1. Write a changelog entry, `type: request`, with `tags: [request-master]` (or `request-frontend` / `request-agents`).
2. State the *minimum* change that unblocks you — not the maximal redesign.
3. Stub against the *current* contract while you wait. Don't block.
4. The owner ships the change, writes their own `change` entry, and adds your filename to `references`.
5. You consume the new contract; if you tracked a temporary stub, write a follow-up `change` entry removing the stub.

Example flow (Frontend needs a new SSE event from Agents):

```
2026-04-24-153000-frontend-request-progress-percent-event.md   (type: request)
        ↓ (Agents triages)
2026-04-24-160000-agents-add-progress-percent-event.md         (type: change, references the above)
        ↓ (Frontend consumes)
2026-04-24-162200-frontend-render-progress-percent-in-theater.md  (type: change, references both)
```

## 6. When you must write an entry

- ✅ Every PR you open. (At least one entry — usually one. Big PRs may have multiple `change` entries grouped by sub-feature.)
- ✅ Every cross-agent request. Even tiny ones ("please bump the timeout").
- ✅ Every breaking change to a shared contract (SSE events, schema fields, env vars, routes).
- ✅ Every rollback.

## 7. When you should NOT write an entry

- ❌ Local trial-and-error, draft commits, or work-in-progress that you'll squash before opening a PR.
- ❌ Changelog entries about changelog entries. Don't recurse.
- ❌ Pure formatting / comment fixes that don't change behavior.

## 8. The template

A copyable scaffold lives at [`./_template.md`](./_template.md). Copy, rename per the §2 pattern, fill in.

## 9. Validation (optional but recommended)

Before opening a PR, run a quick sanity check:

```bash
# in the repo root
ls api_docs/changelog/ | grep -E '^[0-9]{4}-[0-9]{2}-[0-9]{2}-[0-9]{6}-(master|frontend|agents)-[a-z0-9-]+\.md$' | wc -l
# should equal:
ls api_docs/changelog/*.md | grep -v -E 'README\.md|_template\.md' | wc -l
```

If the numbers differ, a filename is malformed.

## 10. Frequently asked questions

**"What if I'm Master and I'm fixing a typo in your README?"** Lane rules apply to code, not docs. But still write a one-line `change` entry — agents should be able to scan the changelog and spot doc updates fast.

**"Two agents shipped at the same second; both files exist after merge."** That's fine — different filenames mean no conflict. Order in the directory follows the filename sort, which is correct chronologically.

**"I need to amend an entry I already wrote."** Edit it in-place if it's still in the same PR. Once merged, write a follow-up entry referencing the original — don't rewrite history.
