---
name: code-review
description: Review code changes for quality, security, and conventions before PR
---

Review the current git diff for:
1. Code quality and TypeScript best practices
2. Security issues (OWASP Top 10)
3. Adherence to project conventions (check steering files)
4. Missing error handling
5. Missing types or use of `any`

Output: list of findings with severity (✅ good, ⚠️ suggestion, 🔴 must fix).
