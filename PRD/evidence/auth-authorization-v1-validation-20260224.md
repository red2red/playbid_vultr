# Auth/Authorization V1 Validation Evidence (2026-02-24)

- Executed at: 2026-02-25 09:10:59 KST
- Scope: `playbid_web` auth/authorization v1 hardening
- Branch: `codex/auth-authorization-v1`

## 1) Automated Verification

### Targeted tests (Task 10)

```bash
npm run test -- src/lib/auth/route-access.test.ts src/lib/api/authorized-fetch.test.ts
```

- Result: PASS (`2 files`, `7 tests`)
- Coverage intent:
  - Protected page classification (`/challenge/*`, `/learning/*`)
  - `401 -> refresh -> retry` and refresh/session-expired auth error flows

### Full test suite

```bash
npm test
```

- Result: PASS (`30 files`, `108 tests`)

## 2) Lint Verification

```bash
npm run lint
```

- Result: PASS with warnings (`0 errors`, `5 warnings`)
- Warning summary:
  - `react-hooks/exhaustive-deps` warnings only (admin/event-popups/users pages)
  - No blocking lint errors remain

## 3) RLS Migration Artifacts (Task 9)

Created SQL files:

1. `../supabase/migrations/20260224120000_auth_authorization_v1_hardening.sql`
2. `../supabase/migrations/20260224121000_auth_authorization_v1_validation.sql`

Committed in parent repo:

- Branch: `codex/auth-authorization-v1-sql`
- Commit: `98a93be` (`feat(db): harden auth/authorization rls policies`)

Intended runbook:

```bash
psql "$SUPABASE_DB_URL" -f ../supabase/migrations/20260224120000_auth_authorization_v1_hardening.sql
psql "$SUPABASE_DB_URL" -f ../supabase/migrations/20260224121000_auth_authorization_v1_validation.sql
```

- Status in this session: Not executed (no DB connection string provided in this workspace session).

## 4) Manual Scenario Notes

- Manual browser capture for protected route redirect and auth refresh flow was not executed in this session.
- Route-protection behavior is currently covered by automated middleware/unit tests.

## 5) Residual Risks

1. Production/staging DB에서 Task 9 SQL 적용 및 validation SQL 실행 결과를 아직 확보하지 못함.
2. Lint는 통과했지만 `react-hooks/exhaustive-deps` 경고 5건이 남아 있음.
