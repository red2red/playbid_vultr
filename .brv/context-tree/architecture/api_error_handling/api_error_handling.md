---
title: API Error Handling
tags: []
keywords: []
importance: 50
recency: 1
maturity: draft
createdAt: '2026-03-11T01:32:23.834Z'
updatedAt: '2026-03-11T01:32:23.834Z'
---
## Raw Concept
**Task:**
Document standardized API error handling

**Files:**
- src/lib/api/error-response.ts

**Flow:**
detect error -> createRequestId -> createApiErrorResponse -> log -> return NextResponse

## Narrative
### Structure
Centralized error handling using createApiErrorResponse. Responses include status, code, message, and a payload with requestId/timestamp.

### Highlights
Automatic requestId generation, standardized error suggestions based on error code, and context-aware logging.

## Facts
- **error_handling**: API errors use createApiErrorResponse for consistent responses [project]
- **error_tracking**: Every API error includes a unique requestId for tracing [project]
- **error_logging**: Errors are logged to console.error if status >= 500 [project]
