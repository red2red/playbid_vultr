---
title: Mock Bid Submission System
tags: []
related: [architecture/paid_features/paid_feature_execution.md]
keywords: []
importance: 50
recency: 1
maturity: draft
createdAt: '2026-03-11T01:35:44.553Z'
updatedAt: '2026-03-11T01:35:44.553Z'
---
## Raw Concept
**Task:**
Document mock bid submission flow and API logic

**Changes:**
- Initial documentation of mock bid submission flow
- Documented API payload and response structures
- Documented core services and logic

**Files:**
- src/lib/bid/mock-bid-service.ts
- src/lib/bid/mock-bid-submit-service.ts

**Flow:**
User input -> Client validation -> API submission -> Duplicate Check -> Evaluation -> Result

**Timestamp:** 2026-03-11

## Narrative
### Structure
The mock bid submission flow allows users to simulate bid outcomes based on adjustment rates. Core logic resides in bid/ services which handle calculations and persistence.

### Dependencies
Uses Redis for idempotency keys, Supabase for persistence

### Highlights
Supports dynamic schema evolution, duplicate submission prevention, and XP/Score calculation based on bid outcome.

### Rules
Adjustment Rate must be between 87.745 and 100.
409 ALREADY_SUBMITTED returned for duplicate submissions.

### Examples
API Endpoint: POST /api/mock-bid/submit

## Facts
- **adjustment_rate_range**: Adjustment rate must be between 87.745 and 100 [project]
- **error_handling**: Duplicate submission returns 409 ALREADY_SUBMITTED [project]
- **evaluation_metrics**: Mock bid evaluation calculates rank, score, confidence, and XP [project]
