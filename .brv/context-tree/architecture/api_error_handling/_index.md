---
children_hash: 70925d2ffa1f60a486f19c3820bf7f4fc872cfd6fbc05e1a7d5d7234b3330812
compression_ratio: 0.6932773109243697
condensation_order: 1
covers: [api_error_handling.md]
covers_token_total: 238
summary_level: d1
token_count: 165
type: summary
---
# API Error Handling Summary

**Core Architecture**
Centralized error management via `src/lib/api/error-response.ts` utilizes `createApiErrorResponse`. This system enforces a standardized response schema containing status, error codes, messages, trace IDs, and timestamps.

**Key Mechanisms**
* **Tracing**: Every error automatically generates a unique `requestId` for observability.
* **Logging**: Errors with status ≥ 500 are logged via `console.error`.
* **Standardization**: Responses include context-aware error suggestions mapping to specific codes.

**Drill-down**
Refer to `api_error_handling.md` for full implementation details and response structure.