---
title: Qualification Calculator Accuracy
tags: []
keywords: []
importance: 50
recency: 1
maturity: draft
createdAt: '2026-03-11T01:32:23.840Z'
updatedAt: '2026-03-11T01:32:23.840Z'
---
## Raw Concept
**Task:**
Document qualification calculator accuracy requirements

**Files:**
- README.md
- scripts/qualification/export-reference-rules.mjs

**Flow:**
define fixture -> run tests -> export rules to SQL

## Narrative
### Structure
Accuracy relies on reference fixtures. Calculator UI highlights verified criteria.

### Highlights
No silent fallback allowed. Automated scripts export verified rules to migration SQL.

## Facts
- **qualification_calculator**: Qualification calculator requires reference fixtures for accuracy [project]
- **qualification_calculator**: Reference fixtures are defined in src/lib/bid/__fixtures__/qualification-calculator/reference-rule-specs.ts [project]
