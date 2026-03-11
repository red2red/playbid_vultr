---
title: Paid Feature Execution
tags: []
keywords: []
importance: 50
recency: 1
maturity: draft
createdAt: '2026-03-11T01:33:07.034Z'
updatedAt: '2026-03-11T01:33:07.034Z'
---
## Raw Concept
**Task:**
Document paid feature execution and billing logic

**Changes:**
- Initial documentation of paid feature execution flow
- Defined pricing resolution policies
- Documented error codes and API response schema

**Files:**
- paid_feature_executions table
- paid_feature_point_policies table

**Flow:**
Idempotency/Reaccess Check -> Pricing Resolution -> Transaction (Reserve/Execute/Commit) -> Post-Commit Failure Handling

**Timestamp:** 2026-03-11

## Narrative
### Structure
The system uses an atomic deduction flow to manage paid feature executions. It involves idempotency checks, reaccess validation, and a transactional commit model.

### Dependencies
paid_feature_executions, paid_feature_point_policies, point_wallets

### Highlights
Supports both subscription-based and point-based pricing models. Includes robust race condition and duplicate request prevention.

### Rules
Rule 1: Idempotency keys must be validated before any execution.
Rule 2: Subscription allowances must be checked against remaining units.
Rule 3: Point-based executions require wallet reservation before feature execution.

### Examples
API response includes execution_id, billing_result, and remaining_balance.

## Facts
- **idempotency**: Paid feature execution uses idempotency keys to prevent duplicate charges [project]
- **reaccess_window**: Reaccess cache window is 24 hours [project]
- **pending_window**: Pending duplicate window is 30 seconds [project]
