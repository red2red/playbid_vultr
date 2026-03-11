---
children_hash: 19ba68381a652b45890b81b40d1a917107afac70fc717032e91f6031ddd5d5cb
compression_ratio: 0.8661800486618005
condensation_order: 1
covers: [paid_feature_execution.md]
covers_token_total: 411
summary_level: d1
token_count: 356
type: summary
---
# Paid Feature Execution Overview

The paid feature execution system manages billing and feature access through an atomic, transactional flow, documented in `paid_feature_execution.md`.

## Architectural Flow
The execution process enforces consistency through a strictly ordered pipeline:
1. **Idempotency & Reaccess Check**: Validates requests using idempotency keys and cache windows to prevent duplicate charges.
2. **Pricing Resolution**: Determines billing requirements based on subscription or point-based models.
3. **Transaction Model**: Executes a Reserve-Execute-Commit sequence.
4. **Failure Handling**: Manages post-commit errors to ensure state integrity.

## Key Mechanisms
* **Billing Models**: Supports both subscription-based allowances and point-based deductions (using `paid_feature_executions` and `paid_feature_point_policies` tables).
* **Race Condition Prevention**: Employs a 30-second pending request window and a 24-hour reaccess cache window.
* **Wallet Integration**: Requires point reservation in `point_wallets` prior to execution for point-based features.

## Operational Rules
* Idempotency keys are mandatory for all execution requests.
* Subscription allowances must be verified against remaining units before proceeds.
* Point-based transactions require explicit wallet reservation.

For comprehensive details on API response schemas and table structures, see `paid_feature_execution.md`.