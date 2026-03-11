---
children_hash: f654b7032ae640ee3fa3b9474e64a4a8dfcb414dba48a10cecad97b0f990c33f
compression_ratio: 0.75
condensation_order: 1
covers: [learning_center_architecture.md]
covers_token_total: 368
summary_level: d1
token_count: 276
type: summary
---
# Learning Center Architecture Summary

The Learning Center architecture centralizes educational content delivery, progress tracking, and mission-related side effects. 

### Key Components
- **Core Service**: `src/lib/bid/learning-service.ts` manages data operations and state.
- **UI Layer**: React components located in `src/components/learning/` (e.g., `learning-dashboard.tsx`, `learning-content-detail.tsx`).
- **Data Persistence**: Relational schema includes `learning_categories`, `quizzes`, `learning_contents`, `user_learning_progress`, and `user_quiz_progress`.

### Integration and Workflow
- **API Endpoints**: 
    - `POST /api/learning/content/complete`: Finalizes content completion.
    - `POST /api/learning/quiz/submit`: Persists quiz results.
- **Dependencies**: Integrates with `challenge-service` to propagate mission progress updates.
- **Architectural Rule**: Every progress-updating action must trigger a corresponding progress check within the `challenge-service`.

For granular details on implementation patterns and state management, refer to `learning_center_architecture.md`.