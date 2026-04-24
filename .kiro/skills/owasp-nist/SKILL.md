---
name: owasp-nist-security
description: OWASP Top 10 and NIST security checklist. Use when auditing code for vulnerabilities.
---

# Security Quick Reference

## OWASP Top 10 Checks
- A01 Broken Access Control: validate permissions server-side
- A02 Crypto Failures: no secrets in code, HTTPS only
- A03 Injection: parameterized queries, validate input
- A04 Insecure Design: validate business logic server-side
- A05 Misconfiguration: no wildcard CORS in prod, remove defaults
- A06 Vulnerable Components: audit dependencies
- A07 Auth Failures: rate limit, secure sessions
- A08 Data Integrity: validate all untrusted data
- A09 Logging: log security events, never log secrets
- A10 SSRF: validate URLs, use allowlists

## AWS-Specific
- Lambda: no secrets in env vars (use Secrets Manager), least-privilege IAM
- DynamoDB: enable encryption at rest
- API Gateway: enable auth, throttling
- S3: block public access unless intentional
- IAM: no `*` actions, scope to specific resources
