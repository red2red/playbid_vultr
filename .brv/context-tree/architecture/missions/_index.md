---
children_hash: a6054482129ebfac5152bb4f6595404f1a430387f4659a4f1b865660d8710b5e
compression_ratio: 0.4918032786885246
condensation_order: 1
covers: [challenge_mission_system.md]
covers_token_total: 366
summary_level: d1
token_count: 180
type: summary
---
### Challenge Mission System
The Challenge Mission System (src/lib/bid/challenge-service.ts, src/components/challenge/missions-page.tsx) manages user XP, tiering, and mission tracking.

**Core Workflow**
Mission completion triggers progress updates, reward validation, tier recalculation, and XP synchronization. Daily missions are auto-assigned via the `assign_daily_missions` RPC if the active count is below 5.

**Technical Specifications**
- **Dependency**: Requires Supabase authentication.
- **Tiering Logic**: Based on `LEVEL_XP_BASE` (500).
- **XP Thresholds**: Bronze (<500), Silver (>=500), Gold (>=1000), Platinum (>=2000), Diamond (>=5000).
- **Progress Tracking**: Defined as `progressCount / targetCount`.