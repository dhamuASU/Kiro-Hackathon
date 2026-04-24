# 🚀 Kiro Hackathon Setup

Pre-configured Kiro AI agents for a 3-person hackathon team on AWS.

## Quick Start

```bash
git clone <repo-url> && cd <project>
bun install
aws configure sso   # SSO URL + region from PM
kiro-cli chat --agent <your-role>
```

## Agents

| Shortcut | Agent | Who | Purpose |
|----------|-------|-----|---------|
| Ctrl+1 | `pm` | Person 1 | GitHub issues, status, coordination |
| Ctrl+2 | `frontend` | Person 2 | React, UI, styling |
| Ctrl+3 | `backend` | Person 3 | Lambda, API Gateway, DynamoDB |
| Ctrl+4 | `infra` | Person 1 | CDK stacks, AWS, deploys |
| Ctrl+5 | `reviewer` | Anyone | Code quality + security audit |
| Ctrl+6 | `debug` | Anyone | Errors + incident response (auto-logged) |
| Ctrl+7 | `docs` | Anyone | README, API docs, demo scripts |

## Reusable Prompts

```
@new-feature "add user auth"     → creates GitHub issues
@code-review                     → reviews git diff
@deploy-checklist                → pre-deploy safety checks
@status-report                   → team progress summary
```

## Deploy

```bash
cdk deploy SharedStack      # Person 1 — DB, shared resources
cdk deploy BackendStack     # Person 3 — API
cdk deploy FrontendStack    # Person 2 — UI
```

Cleanup: `cdk destroy --all`

## Git

```
main                    ← protected
feat/frontend-<desc>    ← Person 2
feat/backend-<desc>     ← Person 3
feat/infra-<desc>       ← Person 1
```

## Cost & Permissions

All serverless = **$0** (free tier). Budget alarm at $10.

Teammates can use Lambda, DynamoDB, S3, API Gateway, CloudFront. Cannot use EC2, RDS, EKS, IAM admin, or billing.

## First Steps

1. PM fills in `.kiro/steering/product.md` with what you're building
2. PM updates `.kiro/steering/api-contract.md` with agreed endpoints
3. PM runs `@new-feature "<idea>"` to create GitHub issues
4. Frontend + Backend pick up labeled issues and start building
