---
date: YYYY-MM-DDTHH:MM:SSZ
agent: master            # master | frontend | agents
type: change             # change | request | breaking | rollback
status: shipped          # planned | in-progress | shipped | abandoned
tags: []                 # optional, free-form (e.g. [onboarding, sse, request-master])
references: []           # optional, list other changelog filenames this builds on
---

# <One-line title — what changed, in user-facing terms>

## Why
<2–4 sentences. Link to the PMD section, the Feature List item, or the Notion page if relevant.>

## What changed
- <bullet 1 — concrete: "Implemented X" not "Worked on X">
- <bullet 2>
- <bullet 3>

## Files touched
- `path/to/file.py`
- `path/to/other.tsx:120-180`

## Cross-agent requests
<"None" if there are none. Otherwise list them: "Need Master to add `progress_percent` to AgentEvent — see request-foo.md">

## Risks / rollback
<What breaks if this is wrong. How another agent can revert it.>
