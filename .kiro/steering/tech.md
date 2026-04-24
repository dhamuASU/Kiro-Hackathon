# Technology Stack

## Frontend
- React 19 + TypeScript + Vite
- Plain CSS or Tailwind (team decides)
- Deployed to S3 + CloudFront

## Backend
- TypeScript (Bun or Node)
- AWS Lambda + API Gateway
- REST API with JSON

## Database
- DynamoDB (serverless, zero config)

## Infrastructure
- AWS CDK (TypeScript)
- All resources tagged `project: hackathon`

## Conventions
- Use `fetch` for API calls
- Prefer `const` over `let`
- Use async/await
- All API routes prefixed with `/api/`
- Parameterized queries only
