---
title: Bid History Module
tags: []
keywords: []
importance: 50
recency: 1
maturity: draft
createdAt: '2026-03-11T01:36:19.275Z'
updatedAt: '2026-03-11T01:36:19.275Z'
---
## Raw Concept
**Task:**
Document Bid History module architecture, services, and data normalization

**Files:**
- src/lib/bid/bid-history-query.ts
- src/lib/bid/bid-history-service.ts
- src/components/bid-history/bid-history-page.tsx

**Flow:**
Fetch history -> Enrich with notices/results -> Normalize status -> Display in page

**Timestamp:** 2026-03-11

**Patterns:**
- `23503` - Foreign Key Violation code
- `42P01` - Undefined table error code

## Narrative
### Structure
The module consists of a query service for data retrieval, a dedicated deletion service with error handling for FK constraints, and a React page component for UI display.

### Dependencies
Relies on supabase for data and foreign key constraint management.

### Highlights
Supports batch retrieval (500 rows), range-based pagination, and automatic FK cleanup during deletion. Implements robust status normalization for diverse bid outcomes.

### Rules
Rule 1: Always use chunked lookups for metadata to avoid request limits.
Rule 2: Handle FK violation 23503 by nullifying references before deletion.

### Examples
Status normalization: success => ["success", "exact", "close", "win", "낙찰"].

## Facts
- **batch_size**: Bid history batch size is 500 rows [project]
- **status_normalization**: Status normalization handles success, fail, void, and pending [project]
