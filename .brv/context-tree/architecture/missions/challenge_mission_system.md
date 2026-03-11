---
title: Challenge Mission System
tags: []
keywords: []
importance: 50
recency: 1
maturity: draft
createdAt: '2026-03-11T01:33:31.838Z'
updatedAt: '2026-03-11T01:33:31.838Z'
---
## Raw Concept
**Task:**
Document Challenge Mission System architecture

**Changes:**
- Initial documentation

**Files:**
- src/lib/bid/challenge-service.ts
- src/components/challenge/missions-page.tsx

**Flow:**
complete mission -> update progress -> validate reward -> update levels -> sync XP/tier

**Timestamp:** 2026-03-11

## Narrative
### Structure
Mission system handles XP, levels, and mission tracking for various categories (mock_bid, learning, etc.). Core service handles business logic; UI components manage state and user feedback.

### Dependencies
Supabase for database operations, requires user session for authentication.

### Highlights
Schema-resilient updates, XP-based tier system (bronze to diamond), daily mission auto-assignment.

### Rules
Rule 1: Progress is tracked as progressCount / targetCount.
Rule 2: XP-based tiering uses LEVEL_XP_BASE = 500.

### Examples
Tier inference: bronze < 500, silver >= 500, gold >= 1000, platinum >= 2000, diamond >= 5000.

## Facts
- **tier_xp**: Tier XP requirements: bronze (<500), silver (>=500), gold (>=1000), platinum (>=2000), diamond (>=5000). [project]
- **base_xp**: Base XP constant LEVEL_XP_BASE is 500. [project]
- **daily_missions**: Daily missions sync via assign_daily_missions RPC if count < 5. [project]
