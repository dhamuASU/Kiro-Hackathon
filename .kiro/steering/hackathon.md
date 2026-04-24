# Hackathon Guide

## Team
| Person | Role | Agent | Branch prefix |
|--------|------|-------|---------------|
| Person 1 | PM / Infra | `pm` or `infra` | `feat/infra-*` |
| Person 2 | Frontend | `frontend` | `feat/frontend-*` |
| Person 3 | Backend | `backend` | `feat/backend-*` |

## Getting Started
```bash
git clone <repo-url> && cd <project>
bun install

# AWS login (everyone)
aws configure sso
# Start URL: <your-sso-url>
# Region: us-east-1

# Start Kiro with your agent
kiro-cli chat --agent pm          # Person 1
kiro-cli chat --agent frontend    # Person 2
kiro-cli chat --agent backend     # Person 3
```

## Deploy Order
1. Person 1: `cdk deploy SharedStack` (DB, auth)
2. Person 3: `cdk deploy BackendStack` (API)
3. Person 2: `cdk deploy FrontendStack` (UI)

## Workflow
1. PM creates GitHub issues with labels (`frontend`, `backend`, `infra`)
2. Devs check issues: "Check GitHub for my tasks"
3. Dev works on branch, pushes, creates PR
4. PM reviews status: "What's the status of all open issues?"

## Budget
- $10 hard limit set via AWS Budget
- All serverless = likely $0
- Alert at 80% ($8)

## Cleanup
```bash
cdk destroy --all
```
