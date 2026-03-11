---
children_hash: d83a0893781e5b6cdc421c5fd7187d8e352b72ef4fe43b137bb6f76cc2dca921
compression_ratio: 0.6711711711711712
condensation_order: 1
covers: [qualification_calculator_accuracy.md]
covers_token_total: 222
summary_level: d1
token_count: 149
type: summary
---
### Qualification Calculator Accuracy
Ensures accuracy for the qualification calculator via mandatory reference fixtures.

**Key Components & Flow**
- **Fixtures**: Defined in `src/lib/bid/__fixtures__/qualification-calculator/reference-rule-specs.ts`.
- **Process**: Fixture definition → test execution → automated export to migration SQL via `scripts/qualification/export-reference-rules.mjs`.

**Requirements**
- Prohibits silent fallbacks.
- UI must highlight verified criteria.
- Rules are strictly synchronized with database migrations.

*Reference: `qualification_calculator_accuracy.md`*