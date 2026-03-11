---
title: Learning Center Architecture
tags: []
keywords: []
importance: 50
recency: 1
maturity: draft
createdAt: '2026-03-11T01:36:50.210Z'
updatedAt: '2026-03-11T01:36:50.210Z'
---
## Raw Concept
**Task:**
Document Learning Center architecture and API integration

**Files:**
- src/lib/bid/learning-service.ts
- src/components/learning/learning-dashboard.tsx
- src/components/learning/learning-content-detail.tsx

**Flow:**
Dashboard/Detail -> API -> LearningService -> DB -> ChallengeService side-effects

**Timestamp:** 2026-03-11

**Author:** ByteRover Context Engineer

## Narrative
### Structure
Consists of a central LearningService for data handling, React-based dashboard/detail components, and API routes for progress tracking.

### Dependencies
Depends on `challenge-service` for mission progress updates. Database tables: `learning_categories`, `quizzes`, `learning_contents`, `user_learning_progress`, `user_quiz_progress`.

### Highlights
Centralizes progress tracking and side-effects. Supports quizzes, content completion, and flashcards.

### Rules
All progress updates trigger mission progress checks in `challenge-service`.

## Facts
- **service_path**: LearningService is located at src/lib/bid/learning-service.ts [project]
- **api_route**: POST /api/learning/content/complete updates progress and triggers mission side-effects [project]
- **api_route**: POST /api/learning/quiz/submit saves quiz progress and triggers mission side-effects [project]
