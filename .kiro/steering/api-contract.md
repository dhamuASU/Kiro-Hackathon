# API Contract

## Endpoints
Define agreed endpoints here so frontend and backend stay in sync.

### Example
```
GET    /api/items          → list all items
POST   /api/items          → create item { title, description }
GET    /api/items/:id      → get single item
PUT    /api/items/:id      → update item
DELETE /api/items/:id      → delete item
```

## Response Format
```json
// Success
{ "data": { ... } }

// Error
{ "error": "message" }
```

## Status Codes
- 200: OK
- 201: Created
- 400: Bad request
- 404: Not found
- 500: Server error
