---
name: cdk-patterns
description: CDK patterns — Lambda, DynamoDB, API Gateway, S3, CloudFront, tagging, cross-stack refs. Use when writing CDK stacks.
---

# CDK Patterns

## Tag Everything
```typescript
cdk.Tags.of(this).add("project", "hackathon");
```

## Lambda
```typescript
const fn = new lambda.Function(this, "Handler", {
  runtime: lambda.Runtime.NODEJS_20_X,
  handler: "index.handler",
  code: lambda.Code.fromAsset("backend/dist"),
  environment: { TABLE_NAME: table.tableName },
  timeout: cdk.Duration.seconds(10),
});
table.grantReadWriteData(fn);
```

## DynamoDB
```typescript
const table = new dynamodb.Table(this, "Table", {
  partitionKey: { name: "pk", type: dynamodb.AttributeType.STRING },
  sortKey: { name: "sk", type: dynamodb.AttributeType.STRING },
  billingMode: dynamodb.BillingMode.PAY_PER_REQUEST,
  removalPolicy: cdk.RemovalPolicy.DESTROY,
});
```

## API Gateway
```typescript
const api = new apigateway.RestApi(this, "Api", {
  defaultCorsPreflightOptions: {
    allowOrigins: apigateway.Cors.ALL_ORIGINS,
    allowMethods: apigateway.Cors.ALL_METHODS,
    allowHeaders: ["Content-Type", "Authorization"],
  },
});
const items = api.root.addResource("api").addResource("items");
items.addMethod("GET", new apigateway.LambdaIntegration(listFn));
items.addMethod("POST", new apigateway.LambdaIntegration(createFn));
const item = items.addResource("{id}");
item.addMethod("GET", new apigateway.LambdaIntegration(getFn));
item.addMethod("PUT", new apigateway.LambdaIntegration(updateFn));
item.addMethod("DELETE", new apigateway.LambdaIntegration(deleteFn));
```

## S3 + CloudFront
```typescript
const bucket = new s3.Bucket(this, "Frontend", {
  removalPolicy: cdk.RemovalPolicy.DESTROY,
  autoDeleteObjects: true,
});
const dist = new cloudfront.Distribution(this, "CDN", {
  defaultBehavior: { origin: new origins.S3BucketOrigin(bucket) },
  defaultRootObject: "index.html",
  errorResponses: [{ httpStatus: 404, responsePagePath: "/index.html", responseHttpStatus: 200 }],
});
new s3deploy.BucketDeployment(this, "Deploy", {
  sources: [s3deploy.Source.asset("frontend/dist")],
  destinationBucket: bucket,
  distribution: dist,
});
```

## Cross-Stack Refs
```typescript
// Export
new cdk.CfnOutput(this, "TableName", { value: table.tableName, exportName: "TableName" });
// Import
const tableName = cdk.Fn.importValue("TableName");
```
