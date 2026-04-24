---
name: git-workflow
description: Git branching, commit conventions, PR templates for hackathon team. Use when managing git workflow.
---

# Git Workflow

## Branches
- `main` — protected, always deployable
- `feat/frontend-<desc>` — Person 2
- `feat/backend-<desc>` — Person 3
- `feat/infra-<desc>` — Person 1
- `fix/<desc>` — bug fixes (anyone)

## Commits
```
feat: add user list endpoint
fix: correct CORS headers on API
infra: add DynamoDB table to shared stack
docs: update API contract
```

## PR Template
```markdown
## What
Brief description of changes.

## Why
Link to GitHub issue: #123

## Testing
- [ ] Tested locally
- [ ] No console errors
- [ ] API contract matches
```
