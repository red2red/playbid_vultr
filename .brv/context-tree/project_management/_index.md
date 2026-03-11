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
- Rule definitions and database migrations must remain strictly synchronized.

For implementation details, see: `qualification_calculator_accuracy.md`