---
children_hash: 7a0837debdadde4eee097d56756c4376a05721f7bbacaf31a22ce849e6caacc9
compression_ratio: 0.9990167158308751
condensation_order: 3
covers: [architecture/_index.md, project_management/_index.md]
covers_token_total: 1017
summary_level: d3
token_count: 1016
type: summary
---
## architecture/_index.md
---
children_hash: 1911f3d73cce797fd6d5ae5fc557a46902e40ea8c08be4145ef285d886390e83
compression_ratio: 0.2759472817133443
condensation_order: 2
covers: [api_error_handling/_index.md, auth_proxy/_index.md, bid_history/_index.md, learning_center/_index.md, missions/_index.md, mock_bid_submission/_index.md, paid_features/_index.md, supabase_integration/_index.md]
covers_token_total: 2428
summary_level: d2
token_count: 670
type: summary
---
# Architecture and System Overview

This summary synthesizes the core operational domains and structural patterns of the system. For granular implementation details, refer to the respective `_index.md` files.

### API and Error Management
* **API Error Handling**: Centralizes responses via `src/lib/api/error-response.ts`. Standardizes schema with status, trace IDs, and timestamps. Errors ≥ 500 trigger automated logging; tracing is mandatory.
* **Supabase Integration**: Uses `@supabase/ssr` for cookie-based session persistence (`src/lib/supabase/server.ts`). Includes fail-safe handling for missing environment variables.

### Authentication and Security
* **Authentication Proxy**: Manages access control via `src/proxy.ts` and `src/lib/auth/route-access.ts`. Enforces path validation and redirects unauthorized requests to login; administrative routes are restricted to verified emails.

### Bid and Feature Execution
* **Mock Bid Submission**: Orchestrates bid simulations (`src/lib/bid/mock-bid-service.ts`) with mandatory idempotency checks via Redis. Enforces strict adjustment rates (87.745–100) and returns `409 ALREADY_SUBMITTED` for duplicates.
* **Paid Feature Execution**: Manages billing via an atomic Reserve-Execute-Commit model. Integrates with `point_wallets` and `paid_feature_point_policies`. Employs a 30-second pending request window and 24-hour reaccess cache to prevent race conditions.
* **Bid History Module**: Handles retrieval and normalization of historical bid data. Resolves `23503` (FK violation) and `42P01` (undefined table) errors by nullifying references and performing chunked metadata lookups.

### Learning and Missions
* **Challenge Mission System**: Tracks XP, tiers, and user progress (`src/lib/bid/challenge-service.ts`). Tiers are defined by XP thresholds from Bronze (<500) to Diamond (≥5000). Daily missions auto-assign via RPC if the active count drops below 5.
* **Learning Center**: Delivers educational content and tracks completion/quiz status. Integrates with `challenge-service` to ensure every progress update triggers a corresponding mission progress check.

### Key Architectural Relationships
* **System Integration**: The `challenge-service` acts as a central dependency for mission-related side effects across learning and bidding modules.
* **Idempotency Standards**: Mandatory use of idempotency keys across both Mock Bid and Paid Feature systems ensures state integrity during high-concurrency operations.
* **Constraint Management**: Database-level FK violations are handled application-side in the Bid History module, while race conditions are mitigated via caching windows in the Paid Feature execution pipeline.

## project_management/_index.md
---
children_hash: ca38c611b4f0dddd327d1b54928be1cdd7d65393035634b913293721fa9fcb6a
compression_ratio: 0.7824074074074074
condensation_order: 2
covers: [qualification_calculator/_index.md]
covers_token_total: 216
summary_level: d2
token_count: 169
type: summary
---
### Qualification Calculator
Ensures strict calculation accuracy through mandatory reference fixtures and synchronized migration workflows.

**Core Architecture**
- **Fixtures**: Defined in `src/lib/bid/__fixtures__/qualification-calculator/reference-rule-specs.ts`.
- **Sync Workflow**: Fixture definitions drive test execution and auto-export to migration SQL via `scripts/qualification/export-reference-rules.mjs`.

**Critical Constraints**
- No silent fallbacks permitted.
- UI must explicitly highlight verified criteria.
- Rule definitions and database migration
[summary compaction; truncated from 1017 tokens]