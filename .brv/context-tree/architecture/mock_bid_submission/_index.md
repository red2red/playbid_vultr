---
children_hash: 2505ebd6c81cf15084cc791ded8e0a544c60077d7d2e8420cceeafb2e84a7719
compression_ratio: 0.7777777777777778
condensation_order: 1
covers: [mock_bid_submission_system.md]
covers_token_total: 387
summary_level: d1
token_count: 301
type: summary
---
# Mock Bid Submission System Overview

The Mock Bid Submission System provides an infrastructure for simulating bid outcomes, primarily managed through `src/lib/bid/mock-bid-service.ts` and `src/lib/bid/mock-bid-submit-service.ts`. This system is tightly integrated with `architecture/paid_features/paid_feature_execution.md` to support feature-gated bid operations.

### Core Architecture
*   **Workflow**: User input flows from client-side validation to API submission, followed by a mandatory duplicate check, evaluation logic, and final result persistence.
*   **Persistence & Idempotency**: Leverages Redis for maintaining idempotency keys and Supabase for data persistence.
*   **Evaluation Metrics**: The engine calculates rank, score, confidence, and XP based on the submission outcome.

### Key Constraints & Rules
*   **Adjustment Rate**: Must remain strictly between 87.745 and 100.
*   **Duplicate Handling**: API returns a `409 ALREADY_SUBMITTED` status for duplicate submissions.
*   **Endpoint**: `POST /api/mock-bid/submit`

For detailed implementation logic, including schema evolution and specific API payload structures, refer to the full `mock_bid_submission_system.md` documentation.