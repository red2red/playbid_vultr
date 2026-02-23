# Task Plan: Flutter to Next.js Web Expansion

## 문서 목적
- 본 문서는 `requirements.md`와 `design.md`를 구현 가능한 작업 단위로 분해한 실행 계획서입니다.
- 기준 문서:
  - `requirements.md`
  - `design.md`
  - `prototype-review-checklist.md`
  - `prototype-review-result-v2.md`
  - `prototype-review-result-v3.md`
  - `shadcn-implementation-map-notice-detail.md`
  - `T-023-ticket-breakdown.md`

## 작업 원칙
- Flutter 앱 데이터 계약과 100% 호환을 우선합니다.
- 운영 기준 DDL/컬럼명을 단일 소스 오브 트루스로 사용합니다.
- 범위는 "동작하는 웹 V1" 우선, 고급 분석/확장은 후속으로 분리합니다.

## 공통 Definition of Done
- 기능이 문서 요구사항을 충족하고 수동 시나리오 테스트를 통과한다.
- 데이터 조회/수정이 Flutter 계약 테이블/컬럼 기준으로 동작한다.
- 인증/권한/오류 메시지/로딩 상태가 구현되어 있다.
- 주요 경로에서 타입 에러/런타임 에러가 없다.

## 우선순위
- `P0`: 서비스 동작에 필수
- `P1`: 실사용 품질에 필수
- `P2`: 개선/확장

## Phase 0: 프로젝트 준비

### T-001 (P0) Next.js 프로젝트 골격 생성
- 내용: App Router 기반 기본 구조 생성, TypeScript/ESLint/format 세팅.
- 산출물: `app/`, `src/`, 기본 레이아웃, 공통 설정 파일.
- 완료 기준: 로컬에서 개발 서버 실행 가능.

### T-002 (P0) 환경변수 및 Supabase 연결 세팅
- 내용: `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY` 및 서버 전용 키 분리.
- 산출물: `.env.example`(웹용), Supabase client/server 헬퍼.
- 완료 기준: 서버/클라이언트 양쪽에서 세션 조회 가능.

### T-003 (P0) 데이터 계약 검증 체크리스트 작성
- 내용: 운영 기준 테이블/컬럼 계약 점검표 작성.
- 대상: `bid_notices`, `bid_results`, `user_bid_history`, `user_scraps`, `notifications`, `notification_preferences`, `user_profiles`, `profiles`.
- 완료 기준: 모든 계약 항목에 대해 확인 상태 기록.

## Phase 1: 공통 인프라/디자인 시스템

### T-010 (P0) 라우트 스캐폴딩
- 내용: 다음 경로 기본 뼈대 생성.
- 경로:
  - `/login`
  - `/auth-callback`
  - `/dashboard`
  - `/bid_notice`, `/bid_notice/detail`
  - `/bid_opening`, `/bid_opening/detail`
  - `/bid_history`, `/bid_history/analysis`
  - `/challenge`, `/challenge/missions`, `/challenge/ranking`, `/challenge/badges`
  - `/learning`, `/learning/quiz`, `/learning/flashcard`
  - `/profile`, `/profile/bookmarks`, `/profile/notifications`, `/profile/payment`, `/profile/subscription`
  - `/point-history`
  - `/qualification-calculator`
- 완료 기준: 모든 경로 진입 시 404 없이 기본 화면 렌더링.
- 상태: **완료** (`/auth-callback`, `/challenge/*`, `/learning/*` 포함 전체 스캐폴딩 반영).

### T-011 (P0) 인증/권한 가드
- 내용: Guest 허용 경로/보호 경로 분리, 보호 액션 시 로그인 플로우(modal/redirect) 연결.
- 요구사항: 원래 이동 경로(return path) 보존.
- 완료 기준: 비로그인 상태에서 보호 기능 클릭 시 로그인 후 원래 화면 복귀.

### T-012 (P1) 디자인 토큰/테마 시스템
- 내용: Flutter 기준 토큰 반영.
- 토큰:
  - Primary `#0F172A`
  - Secondary `#3B82F6`
  - Accent `#F59E0B`
  - Dark background `#0B1121`
  - Font `Noto Sans KR`
- 테마: `light | dark | system`, 저장 키 `theme_mode`.
- 완료 기준: 모든 공통 컴포넌트에서 토큰 기반 스타일 동작.

### T-013 (P0) 카테고리 매핑 유틸
- 내용: `product ↔ goods` 매핑 유틸 구현.
- 적용 위치: 공고/개찰 조회, 필터, 통계 집계.
- 완료 기준: 동일 의미 카테고리가 플랫폼별 값 차이 없이 조회됨.

### T-014 (P0) 상세페이지 프로토타입 게이트 통과
- 내용: `prototype-review-result-v2.md`의 v3 보완 항목 5개를 반영하고 재평가 수행.
- 필수 보완: 로그인 게이팅, 카테고리 매핑 표현, 인쇄 레이아웃, 접근성/다크모드, 인터랙션 정의 강화.
- 완료 기준: A/B/C 필수 100% PASS + 전체 PASS 90% 이상으로 Go 판정.
- 상태: `prototype-review-result-v3.md` 기준 **Go (통과)**.

## Phase 2: 핵심 화면 V1

### T-020 (P0) 로그인/콜백 화면
- 내용: OAuth 버튼(Apple/Google/Kakao/Naver), 콜백 처리, 세션 반영.
- 완료 기준: 로그인 성공 후 return path 복귀.
- 상태: **완료(코드+배포, 실계정 E2E 일부 대기)** (Apple은 보류 처리. Google/Kakao는 Supabase provider 방식, Naver는 broker 방식(`GET /functions/v1/naver-oauth` → `POST /functions/v1/naver-oauth-complete`)으로 구현. `2026-02-24` 기준 self-host(`https://api.playbid.kr`) 함수 반영 + 웹 운영 도메인(`https://playbid.kr/login`) 정상 서빙 + synthetic exchange_code로 `/auth-callback` 세션 생성 확인. 실제 사용자 계정 승인 기반 최종 E2E만 잔여).

### T-021 (P0) 대시보드
- 내용: 오늘 마감 공고, 오늘 개찰, 북마크 수, 입찰 이력 수, 미읽음 알림 집계.
- 완료 기준: 집계값이 실제 DB 값과 일치.

### T-022 (P0) 입찰공고 목록/필터
- 내용: 검색, 카테고리/기관/금액/마감 필터, 정렬, 페이지네이션.
- 완료 기준: 필터/정렬 결과 정확성 및 상태 유지.

### T-023 (P0) 입찰공고 상세
- 내용: 핵심 필드, 북마크 토글, 모의입찰 진입, 원문 링크, 적격심사 계산기 링크.
- 완료 기준: 필수 필드 누락 없이 표시.

### T-024 (P0) 개찰결과 목록/상세
- 내용: 상태/기간 필터, 상세 지표(낙찰가/참가업체/편차), 공고 링크.
- 완료 기준: 상세 지표 계산 및 표시 정확.

### T-025 (P0) 입찰참가이력
- 내용: `user_bid_history` 기반 목록/필터/정렬/상세/비교.
- 완료 기준: 사용자별 이력 정확히 조회, 상세 비교 동작.

### T-026 (P1) 북마크 관리
- 내용: `user_scraps` 기반 토글/목록/삭제/마감 임박 강조.
- 완료 기준: 상세/목록 양쪽에서 동일 상태 동기화.

### T-027 (P1) 알림 센터
- 내용: `notifications`(`read`, `deleted`) 목록/읽음 처리/전체 읽음/삭제.
- 완료 기준: 미읽음 카운트 실시간 일관성.

### T-028 (P1) 프로필/구독/포인트
- 내용: `user_profiles` + `profiles` 조회, 구독/포인트/결제 링크.
- 완료 기준: 프로필 정보, 구독 상태, 포인트 정보 표시.

### T-029 (P1) 알림 설정
- 내용: `notification_preferences` 조회/업데이트.
- 완료 기준: 저장 후 재접속 시 설정 유지.

### T-030 (P1) 적격심사 계산기 화면 연결
- 내용: 계산 파라미터 입력, 결과 표시, 저장 정책 연결.
- 완료 기준: 동일 입력 재실행 시 동일 결과.

## Phase 3: 유료 기능 트랜잭션

### T-040 (P0) 유료 기능 실행 API
- 내용: `execute_paid_feature` 트랜잭션 흐름 구현.
- 순서: 권한 확인 → 가격 확인 → 차감 예약 → 실행 → 결과 저장 → 커밋.
- 완료 기준: 중간 실패 시 롤백, 사후 실패 시 보상 트랜잭션 동작.

### T-041 (P0) Idempotency 처리
- 내용: `idempotency_key` 기준 중복 실행 방지.
- 완료 기준: 동일 키 재요청 시 중복 과금 없음.

### T-042 (P1) 24시간 재접근 캐시 정책
- 내용: 동일 파라미터 24시간 내 재접근 시 재과금 방지.
- 완료 기준: 캐시 히트 시 과금 이력 추가되지 않음.

## Phase 4: 품질/운영

### T-050 (P0) 에러 처리/로깅
- 내용: 표준 에러 포맷(`requestId`, `code`, `message`, `suggestion`) 적용.
- 완료 기준: 주요 API 에러가 사용자 메시지와 추적 ID를 함께 제공.
- 상태: **완료** (`error-response` 유틸/주요 API 적용 + 테스트 통과).

### T-051 (P1) 성능 최적화
- 내용: 대시보드 집계 캐시(15분), 로딩 스켈레톤, 낙관적 UI.
- 완료 기준: 주요 목록 체감 응답 개선.
- 상태: **완료** (대시보드 15분 캐시, 주요 화면 스켈레톤, 북마크 낙관적 UI 반영).

### T-052 (P1) 접근성 점검
- 내용: 키보드 탐색, 포커스 링, WCAG AA 대비 점검.
- 완료 기준: 핵심 페이지 수동 접근성 체크 통과.
- 상태: **완료** (스킵 링크/포커스링/폼 라벨링/상태 라이브리전/비활성 내비게이션 보강).

### T-053 (P1) 테스트 패키지
- 내용: 단위/통합/속성 기반 테스트 구성.
- 대상: 인증 복귀, 필터 정확성, 과금 idempotency, 카테고리 매핑.
- 완료 기준: 핵심 시나리오 자동화 테스트 통과.
- 상태: **완료** (인증 복귀 URL, 필터 파라미터 유지, 카테고리 매핑, idempotency 테스트 통과).

## 의존성 순서
- `T-001 ~ T-003` 완료 후 `T-010 ~ T-013`
- `T-010 ~ T-013` 완료 후 `T-020 ~ T-030`
- `T-020 ~ T-030` 완료 후 `T-040 ~ T-042`
- 마지막으로 `T-050 ~ T-053`

## V1 출고 기준 (Release Gate)
- 인증/권한/복귀 경로 정상 동작.
- 핵심 5개 화면(대시보드, 공고, 개찰, 이력, 프로필) 운영 데이터로 검증 완료.
- 과금 트랜잭션 원자성 + idempotency 검증 완료.
- P0 항목 100% 완료, P1 항목 70% 이상 완료.
