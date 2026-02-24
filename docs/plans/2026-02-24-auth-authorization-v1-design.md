# PlayBid Web Auth/Authorization V1 Design

- Date: 2026-02-24
- Scope: PlayBid Web (`/Users/a1/FlutterWorkspace/PlayBid/playbid_web`)
- Status: Approved
- Login Providers (V1): Kakao, Naver
- Out of Scope: Apple/Google login re-activation, large auth architecture rewrite (BFF-only migration)

## 1. Goal

PlayBid Web 인증/권한 체계를 운영 가능한 수준으로 일원화한다.

- 비로그인 사용자는 공개 경로만 접근 가능
- 보호 경로/보호 액션은 로그인 강제
- 세션 만료 시 401 복구 경로를 일관화
- 탭 간 인증 상태를 즉시 동기화
- RLS와 서버 권한 검증을 동시에 강화

## 2. Final Decisions

1. 보호 페이지 접근 정책: 비로그인 시 즉시 `/login?returnTo=...` 리다이렉트
2. API 401 처리: `refreshSession` 1회 재시도 후 실패 시 로그인 이동
3. 탭 간 동기화: 상태 변경 즉시 강제 동기화
4. 보호 액션 처리: 즉시 로그인 이동
5. `returnTo` fallback: `/dashboard`
6. RLS 적용: 코드 + SQL 마이그레이션까지 즉시 반영
7. 학습/챌린지 경로: 전부 로그인 필수

## 3. Route Security Model

### 3.1 Public Routes (Guest Allowed)

- `/`
- `/login`
- `/auth-callback`
- `/bid_notice`
- `/bid_notice/detail/*`
- `/bid_opening`
- `/bid_opening/detail/*`
- `/terms`
- `/privacy`

### 3.2 Protected Routes (Login Required)

- `/dashboard`
- `/bid_history`
- `/bid_history/analysis`
- `/profile/*`
- `/point-history`
- `/mock_bid/*`
- `/qualification-calculator`
- `/challenge`
- `/challenge/missions`
- `/challenge/ranking`
- `/challenge/ranking?tab=weekly`
- `/challenge/ranking?tab=monthly`
- `/challenge/ranking?tab=all`
- `/challenge/badges`
- `/learning`
- `/learning/quiz`
- `/learning/flashcard`

### 3.3 Protected API Groups

- `/api/paid/*`
- `/api/bookmarks/*`
- `/api/bid-history/*`
- `/api/notification-preferences/*`
- `/api/notifications/*` (user-specific endpoints)

## 4. Architecture Changes

### 4.1 Middleware Expansion

`src/middleware.ts`를 관리자 전용 보호에서 전역 보호 게이트로 확장한다.

- 요청 경로를 Public/Protected/API Protected로 분류
- Protected + 비로그인: `/login?returnTo=<path+query>` 즉시 리다이렉트
- 기존 admin 보호 로직은 유지하되 공통 분기 체계로 통합
- `returnTo`는 기존 `sanitizeReturnTo` 규칙을 재사용

### 4.2 Auth Session Layer

클라이언트 공통 인증 레이어(`AuthSessionProvider` 또는 동등 구조)를 도입한다.

- `onAuthStateChange` 수신 시 전역 auth state 즉시 갱신
- `BroadcastChannel('playbid-auth')`로 탭 간 이벤트 전파
- 로그아웃/만료 이벤트는 보호 경로에서 즉시 로그인 리다이렉트
- 공개 경로에서는 리다이렉트 없이 UI만 비로그인 상태 반영

### 4.3 Unified Authorized Fetch

`authorizedFetch` 래퍼를 도입해 인증 실패 정책을 공통화한다.

Flow:
1. API 호출
2. `401` 수신 시 `refreshSession` 1회 시도
3. 동일 요청 1회 재시도
4. 재시도도 `401`이면 `AUTH_SESSION_EXPIRED` 처리 + 로그인 이동

## 5. OAuth and Return Path

- 로그인 페이지/콜백은 기존 `sanitizeReturnTo`를 단일 소스로 유지
- `returnTo`가 누락/비정상이면 `/dashboard`로 fallback
- Kakao/Naver 모두 동일한 post-login routing contract를 사용
- Naver broker 경로도 callback 처리 후 동일 정책 적용

## 6. Authorization and Billing Guard

### 6.1 Server-side Guard

유료 기능은 Next.js 서버 코드에서 1차 권한 검증을 수행한다.

- 인증 사용자 여부
- 구독 상태/포인트 잔액
- 요청 파라미터 유효성

### 6.2 DB Truth Source (RPC)

최종 권한 판단과 차감/환불은 DB RPC 트랜잭션으로 원자 처리한다.

- idempotency key 중복 방지
- 승인/차감/실행/저장 단계 일관성 보장
- 오류 시 보상(환불) 자동 처리

## 7. RLS Plan (Code + SQL)

### 7.1 User-owned Tables

아래 테이블은 `auth.uid() = user_id` 정책으로 통일:

- bookmarks
- user_bid_history
- notifications
- notification_preferences
- point_transactions
- subscription/plan usage 관련 user-owned 테이블

### 7.2 Public Read Tables

- `bid_notices`, `bid_results`: `SELECT` only for `anon/authenticated`
- 쓰기 권한은 service role 또는 제한된 RPC만 허용

### 7.3 Migration Deliverables

- RLS 정책 생성/정비 SQL 마이그레이션
- 누락 정책 탐지 체크 SQL(회귀 방지)
- 정책 적용 후 smoke validation SQL 스크립트

## 8. Error Model and UX Contract

표준 오류 코드:

- `AUTH_REQUIRED`
- `AUTH_SESSION_EXPIRED`
- `AUTH_FORBIDDEN`
- `AUTH_REFRESH_FAILED`

UI 동작:

- `AUTH_REQUIRED|AUTH_SESSION_EXPIRED`: 로그인 이동 (`returnTo` 보존)
- `AUTH_FORBIDDEN`: 권한 안내 + 문의 CTA
- transient/server error: retry + requestId 노출

## 9. Testing Strategy

1. Unit
- `sanitizeReturnTo`, redirect URL builder
- 401 재시도 상태 머신

2. Integration
- middleware route classification
- callback return path 복원
- protected API 401 recovery

3. E2E
- 비로그인 → 보호경로 진입 → 로그인 → 원경로 복귀
- 탭 A 로그아웃 시 탭 B 보호 화면 즉시 이탈
- 챌린지/리더보드/학습 경로 보호 검증

4. RLS Regression
- anon/authenticated/service role 접근 케이스 검증
- 유료 기능 RPC 멱등/차감/환불 검증

## 10. Acceptance Criteria

1. 보호 경로 우회 접근 불가
2. 401 recovery 루프 없음 (최대 refresh 1회 + 재시도 1회)
3. `returnTo` 복귀가 안전하게 동작하고 오픈 리다이렉트 없음
4. 챌린지/학습/리더보드 경로 포함 전체 보호 정책 일관 동작
5. RLS 정책과 서버 가드 결과가 충돌하지 않음

## 11. Risks and Mitigations

- Risk: middleware 보호 확장 시 기존 공개 페이지 오탐
  - Mitigation: route allowlist 명시 + 통합 테스트
- Risk: 탭 동기화로 UX 급격한 전환
  - Mitigation: 공개 페이지는 soft update, 보호 페이지만 hard redirect
- Risk: RLS 적용으로 숨은 쿼리 실패
  - Mitigation: staging smoke query set + rollout checklist

## 12. Recommended Next Step

`writing-plans` 단계로 전환해 구현 계획을 `docs/plans/2026-02-24-auth-authorization-v1.md`에 작성한다.
