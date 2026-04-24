# Project Structure

```
hackathon-project/
├── .kiro/                  # Kiro agent configs (shared)
├── infra/                  # CDK stacks
│   ├── bin/app.ts
│   └── lib/
│       ├── shared-stack.ts     # DynamoDB, Cognito
│       ├── frontend-stack.ts   # S3, CloudFront
│       └── backend-stack.ts    # Lambda, API Gateway
├── frontend/               # React app
│   ├── src/
│   ├── index.html
│   └── package.json
├── backend/                # Lambda functions
│   ├── src/
│   │   ├── handlers/
│   │   └── lib/
│   └── package.json
├── shared/                 # Shared types between FE/BE
│   └── types.ts
└── package.json            # Root workspace
```

## Naming Conventions
- Components: PascalCase
- Functions/files: camelCase
- CSS classes: kebab-case
- DynamoDB tables: PascalCase
- API routes: kebab-case `/api/resource`
- CDK constructs: PascalCase
- Branches: `feat/<area>-<description>`
