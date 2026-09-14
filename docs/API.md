# API Contract

**Status:** Phase 0 proposed baseline
**Base path:** `/api/v1`
**Format:** JSON over HTTPS

## 1. Contract Rules

- URL-path versioning is canonical. Breaking changes use `/api/v2`.
- The browser uses same-origin `/api/v1` through the web reverse proxy. Server-only
  API origin configuration is never placed in a public bundle.
- The authenticated session or integration credential identifies the user. An
  optional `X-Organization-ID` selects a tenant only after membership validation.
- Warehouse-scoped commands require `X-Warehouse-ID` or a body field where the
  command contract names the warehouse. The API verifies scope; headers are not
  authorization claims.
- User warehouse scope is managed with `GET /api/v1/users/:id/warehouses` and
  `PUT /api/v1/users/:id/warehouses`. Only a higher-authority organization member
  may replace another member's assignments.
- All request bodies, path IDs, query parameters, and headers are validated and
  bounded. Unknown mutation fields are rejected.
- ORM/database entities are never serialized directly. Responses use allowlisted
  DTOs.

## 2. Error Shape

Every error has the following shape and includes the request correlation ID:

```json
{
  "error": {
    "code": "INSUFFICIENT_STOCK",
    "message": "The requested quantity is not available.",
    "requestId": "req_01J...",
    "details": {
      "sku": "SKU-001",
      "available": "2"
    }
  }
}
```

`details` is optional and must not contain secrets or data outside the caller's
tenant and warehouse scope. Stable codes include `UNAUTHENTICATED`, `FORBIDDEN`,
`VALIDATION_FAILED`, `NOT_FOUND`, `CONFLICT`, `IDEMPOTENCY_KEY_REUSED`,
`INSUFFICIENT_STOCK`, `INVALID_STATE_TRANSITION`, `CONCURRENCY_RETRY_EXHAUSTED`,
`RATE_LIMITED`, and `INTERNAL_ERROR`.

## 3. Success and Pagination

Single resources return `{ "data": { ... } }`. Collections return:

```json
{
  "data": [],
  "meta": {
    "nextCursor": "eyJjcmVhdGVkQXQiOiIyMDI2...",
    "hasMore": true
  }
}
```

Collections use keyset pagination. `limit` is bounded to 100 and defaults to 25.
The cursor includes no tenant authority and is invalid outside its original query
scope. Exports are asynchronous for large result sets.

## 4. Authentication Surface

| Method   | Path                        | Purpose                                          |
| -------- | --------------------------- | ------------------------------------------------ |
| POST     | `/auth/register`            | Create unverified user and organization          |
| POST     | `/auth/login`               | Authenticate with generic failure response       |
| POST     | `/auth/refresh`             | Rotate refresh session cookie                    |
| POST     | `/auth/logout`              | Revoke current session                           |
| GET      | `/auth/me`                  | Return safe current identity and memberships     |
| POST     | `/auth/verify-email`        | Consume verification token                       |
| POST     | `/auth/resend-verification` | Rate-limited verification email                  |
| POST     | `/auth/forgot-password`     | Generic response; never reveal account existence |
| POST     | `/auth/reset-password`      | Consume reset token and revoke sessions          |
| GET/POST | `/auth/google/*`            | State and PKCE-protected OAuth flow              |

## 5. Resource Surface

| Area            | Read endpoints                                                       | Named command endpoints                                                                                                              |
| --------------- | -------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------ |
| Products        | `GET /products`, `GET /products/:id`                                 | `POST /products`, `PATCH /products/:id`, `POST /products/:id/archive`                                                                |
| Warehouses      | `GET /warehouses`, `GET /warehouses/:id`, `GET /warehouses/:id/bins` | `POST /warehouses`, `POST /warehouses/:id/zones`, `POST /bins`                                                                       |
| Inventory       | `GET /inventory/balances`, `GET /inventory/ledger`                   | `POST /inventory/adjustments`, `POST /inventory/movements/:id/reverse`, `POST /inventory/reconcile`                                  |
| Purchase orders | `GET /purchase-orders`, `GET /purchase-orders/:id`                   | `POST /purchase-orders`, `POST /purchase-orders/:id/submit`, `POST /purchase-orders/:id/approve`, `POST /purchase-orders/:id/cancel` |
| Receipts        | `GET /receipts`, `GET /receipts/:id`                                 | `POST /receipts`, `POST /receipts/:id/post`, `POST /receipts/:id/reverse`                                                            |
| Putaway         | `GET /putaway/tasks`                                                 | `POST /putaway/tasks/:id/claim`, `POST /putaway/tasks/:id/complete`, `POST /putaway/tasks/:id/exception`                             |
| Sales orders    | `GET /sales-orders`, `GET /sales-orders/:id`                         | `POST /sales-orders`, `POST /sales-orders/:id/confirm`, `POST /sales-orders/:id/cancel`                                              |
| Picking         | `GET /picking/waves`, `GET /picking/tasks`                           | `POST /picking/waves`, `POST /picking/tasks/:id/claim`, `POST /picking/tasks/:id/confirm`, `POST /picking/tasks/:id/short`           |
| Packing         | `GET /packing/queue`, `GET /packing/sessions/:id`                    | `POST /packing/sessions`, `POST /packing/sessions/:id/scan`, `POST /packing/sessions/:id/complete`                                   |
| Shipments       | `GET /shipments`, `GET /shipments/:id`                               | `POST /shipments/:id/confirm`, `POST /shipments/:id/reverse`                                                                         |
| Reconciliation  | `GET /reconciliation/runs`, `GET /reconciliation/runs/:id`           | `POST /reconciliation/runs`                                                                                                          |
| Audit           | `GET /audit/events`                                                  | `POST /audit/exports` for authorized asynchronous export                                                                             |

## 6. Mutation Rules

`Idempotency-Key` is required for receipt posting, adjustments, reversals,
allocation, shipment confirmation, and any external integration mutation. The key
is scoped to organization and command. Reuse with an identical request returns the
original result. Reuse with a different request returns `IDEMPOTENCY_KEY_REUSED`.

Commands return a domain result and an `X-Request-ID` response header. A command
must not return success until its database transaction commits. Email, export, and
webhook delivery are represented as outbox work and may complete later.

## 7. Documentation and Compatibility

The implementation will generate OpenAPI 3.1 from the contracts. Contract tests
must verify status codes, error codes, pagination, authorization, and sensitive
field exclusion. Deprecations use `Deprecation` and `Sunset` headers and a migration
note. GraphQL is not part of the pilot API.
