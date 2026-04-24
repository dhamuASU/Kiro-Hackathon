---
name: aws-lambda-patterns
description: AWS Lambda handler patterns — event parsing, responses, error handling, cold starts. Use when writing Lambda functions.
---

# AWS Lambda Patterns

## Handler Structure
```typescript
import { APIGatewayProxyEvent, APIGatewayProxyResult } from "aws-lambda";

export const handler = async (event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> => {
  try {
    const body = JSON.parse(event.body || "{}");
    // logic here
    return { statusCode: 200, headers: corsHeaders, body: JSON.stringify({ data: result }) };
  } catch (err) {
    console.error(err);
    return { statusCode: 500, headers: corsHeaders, body: JSON.stringify({ error: "Internal error" }) };
  }
};

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "Content-Type",
  "Access-Control-Allow-Methods": "GET,POST,PUT,DELETE,OPTIONS",
};
```

## Path Parameters
```typescript
const id = event.pathParameters?.id;
if (!id) return { statusCode: 400, body: JSON.stringify({ error: "Missing id" }) };
```

## Environment Variables
```typescript
const TABLE_NAME = process.env.TABLE_NAME!;
```
