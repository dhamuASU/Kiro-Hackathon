---
name: deploy-checklist
description: Pre-deploy checklist — run before any cdk deploy
---

Run through this checklist before deploying:

1. **Build passes**: Run `bun run build` in frontend and backend
2. **No TypeScript errors**: Check for type issues
3. **No secrets in code**: Grep for hardcoded keys, passwords, tokens
4. **CDK diff**: Run `cdk diff` and show what will change
5. **Tests pass**: Run any available tests
6. **API contract**: Verify frontend calls match backend endpoints
7. **Git clean**: No uncommitted changes

Report pass/fail for each item. Block deploy if any 🔴 items found.
