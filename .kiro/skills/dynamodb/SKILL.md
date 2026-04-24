---
name: dynamodb-patterns
description: DynamoDB patterns — table design, CRUD with SDK v3, single-table design. Use when working with DynamoDB.
---

# DynamoDB Patterns (SDK v3)

## Client Setup
```typescript
import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import { DynamoDBDocumentClient, GetCommand, PutCommand, QueryCommand, DeleteCommand, UpdateCommand } from "@aws-sdk/lib-dynamodb";

const client = DynamoDBDocumentClient.from(new DynamoDBClient({}));
const TABLE = process.env.TABLE_NAME!;
```

## CRUD
```typescript
// Get
const { Item } = await client.send(new GetCommand({ TableName: TABLE, Key: { pk: id } }));

// Put
await client.send(new PutCommand({ TableName: TABLE, Item: { pk: id, ...data } }));

// Query (GSI)
const { Items } = await client.send(new QueryCommand({
  TableName: TABLE,
  IndexName: "gsi1",
  KeyConditionExpression: "gsi1pk = :pk",
  ExpressionAttributeValues: { ":pk": status },
}));

// Update
await client.send(new UpdateCommand({
  TableName: TABLE, Key: { pk: id },
  UpdateExpression: "SET #s = :s, updatedAt = :u",
  ExpressionAttributeNames: { "#s": "status" },
  ExpressionAttributeValues: { ":s": newStatus, ":u": new Date().toISOString() },
}));

// Delete
await client.send(new DeleteCommand({ TableName: TABLE, Key: { pk: id } }));
```
