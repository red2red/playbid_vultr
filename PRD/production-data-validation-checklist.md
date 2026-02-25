# Production Data Validation Checklist (V1)

## 목적
- V1 Release Gate의 "핵심 5개 화면 운영 데이터 검증 완료" 항목을 증빙하기 위한 점검표입니다.
- 기준 일자: 2026-02-23

## 실행 전 준비
- Supabase 운영 프로젝트 SQL Editor 접속
- 검증 계정 `user_id` 확보
- 웹앱 로그인 후 동일 계정으로 각 화면 진입
- 검증 시간대 고정(권장: KST) 후 동일 시점에 SQL/화면 값을 비교

## 공통 기록 규칙
- 각 항목마다 SQL 결과 스크린샷 + UI 스크린샷 1세트 첨부
- 허용 오차:
  - 건수/count: 정확히 일치
  - 금액/사정율: 포맷 차이 허용, 원시 값 기준 일치
  - 시간: 포맷 차이 허용, 실시간 기준 ±1분 이내

## 1) 대시보드 (`/dashboard`)

### 검증 SQL (예시)
```sql
-- 오늘 마감 공고 수
select count(*) as closing_today_count
from bid_notices
where bid_clse_dt >= date_trunc('day', now())
  and bid_clse_dt <= date_trunc('day', now()) + interval '1 day' - interval '1 millisecond';

-- 오늘 개찰 수
select count(*) as opening_today_count
from bid_results
where openg_dt >= date_trunc('day', now())
  and openg_dt <= date_trunc('day', now()) + interval '1 day' - interval '1 millisecond';

-- 사용자 북마크/이력/미읽음
select
  (select count(*) from user_scraps where user_id = :user_id) as bookmark_count,
  (select count(*) from user_bid_history where user_id = :user_id) as mock_bid_count,
  (select count(*) from notifications where user_id = :user_id and deleted = false and read = false) as unread_notification_count;
```

| 점검 항목 | SQL 값 | UI 값 | 결과(PASS/FAIL) | 증빙 링크 |
|---|---:|---:|---|---|
| 오늘 마감 공고 |  |  |  |  |
| 오늘 개찰 |  |  |  |  |
| 내 북마크 |  |  |  |  |
| 입찰 이력 |  |  |  |  |
| 미읽음 알림 |  |  |  |  |

## 2) 입찰공고 (`/bid_notice`, `/bid_notice/detail/[id]`)

### 검증 SQL (예시)
```sql
-- 목록 필터 검증용 샘플
select id, bid_ntce_no, bid_ntce_nm, ntce_instt_nm, api_category, bid_clse_dt, presmpt_prce
from bid_notices
where bid_clse_dt >= now() - interval '30 day'
order by bid_clse_dt desc
limit 20;

-- 상세 검증용 단건
select id, bid_ntce_no, bid_ntce_ord, bid_ntce_nm, ntce_instt_nm, dminstt_nm, api_category,
       bid_ntce_dt, bid_clse_dt, openg_dt, presmpt_prce, cntrct_cncls_mthd_nm, bid_methd_nm
from bid_notices
where id = :notice_id;
```

| 점검 항목 | SQL 값 | UI 값 | 결과(PASS/FAIL) | 증빙 링크 |
|---|---|---|---|---|
| 목록 정렬/페이지네이션 |  |  |  |  |
| 카테고리 매핑(`goods/product`) |  |  |  |  |
| 상세 필수 필드 표시 |  |  |  |  |
| 원문 링크/부가 액션 |  |  |  |  |

## 3) 개찰결과 (`/bid_opening`, `/bid_opening/detail/[id]`)

### 검증 SQL (예시)
```sql
-- 목록
select id, bid_ntce_no, bid_ntce_ord, bid_ntce_nm, openg_dt, ntce_instt_nm, dminstt_nm,
       prtcpt_cnum, openg_corp_info, progrs_div_cd_nm, bid_category
from bid_results
order by openg_dt desc
limit 20;

-- 상세
select id, bid_ntce_no, bid_ntce_ord, bid_ntce_nm, openg_dt, prtcpt_cnum, openg_corp_info,
       progrs_div_cd_nm, ntce_instt_nm, dminstt_nm, bid_category, openg_rslt_ntc_cntnts
from bid_results
where id = :opening_id;
```

| 점검 항목 | SQL 값 | UI 값 | 결과(PASS/FAIL) | 증빙 링크 |
|---|---|---|---|---|
| 상태/기간 필터 |  |  |  |  |
| 낙찰가/참가업체/편차 지표 |  |  |  |  |
| 공고 링크 연결 |  |  |  |  |

## 4) 입찰참가이력 (`/bid_history`, `/bid_history/analysis`)

### 검증 SQL (예시)
```sql
-- 사용자 이력 목록
select h.id, h.user_id, h.bid_notice_id, h.bid_ntce_no, h.predicted_price, h.actual_price,
       h.result_type, h.is_success, h.prediction_made_at, h.virtual_rank, h.total_participants,
       n.bid_ntce_nm, n.ntce_instt_nm, n.api_category, n.presmpt_prce
from user_bid_history h
left join bid_notices n on n.id = h.bid_notice_id
where h.user_id = :user_id
order by h.prediction_made_at desc
limit 50;
```

| 점검 항목 | SQL 값 | UI 값 | 결과(PASS/FAIL) | 증빙 링크 |
|---|---|---|---|---|
| 사용자별 이력 조회 |  |  |  |  |
| 필터/정렬 정확성 |  |  |  |  |
| 상세 비교(예측 vs 실제) |  |  |  |  |

## 5) 프로필 (`/profile` + 하위 페이지)

### 검증 SQL (예시)
```sql
-- 프로필 기본 정보
select id, email, full_name, avatar_url, created_at
from profiles
where id = :user_id;

-- 서비스 프로필/구독
select user_id, subscription_tier, subscription_expires_at, total_points, updated_at
from user_profiles
where user_id = :user_id;

-- 포인트 이력(테이블 존재 시)
select id, user_id, transaction_type, amount, balance_after, description, created_at
from point_transactions
where user_id = :user_id
order by created_at desc
limit 30;

-- 알림 설정(테이블 존재 시)
select *
from notification_preferences
where user_id = :user_id;
```

| 점검 항목 | SQL 값 | UI 값 | 결과(PASS/FAIL) | 증빙 링크 |
|---|---|---|---|---|
| 프로필 정보 표시 |  |  |  |  |
| 구독 상태/만료일 |  |  |  |  |
| 포인트/포인트 이력 |  |  |  |  |
| 알림 설정 저장/재조회 |  |  |  |  |

## 6) 인증/권한 V1 (`/challenge/*`, `/learning/*`, 보호 API 401 복구)

### 자동 검증 명령
```bash
npm run test -- src/lib/auth/route-access.test.ts src/lib/api/authorized-fetch.test.ts
npm test
```

### 수동 검증 체크리스트
- [ ] 비로그인 사용자가 `/challenge/ranking?tab=weekly` 접근 시 `/login?returnTo=...`로 이동
- [ ] 비로그인 사용자가 `/learning/quiz` 접근 시 `/login?returnTo=...`로 이동
- [ ] 만료 세션으로 보호 API 호출 시 `refreshSession` 1회 후 재시도
- [ ] refresh 실패 시 로그인 이동 및 `returnTo` 보존

| 점검 항목 | SQL 값 | UI 값 | 결과(PASS/FAIL) | 증빙 링크 |
|---|---|---|---|---|
| 보호 경로 분류(`/challenge/*`, `/learning/*`) | N/A | Unit Test PASS (`route-access.test.ts`) | PASS | `PRD/evidence/auth-authorization-v1-validation-20260224.md` |
| 보호 API 401 재시도(`authorizedFetch`) | N/A | Unit Test PASS (`authorized-fetch.test.ts`) | PASS | `PRD/evidence/auth-authorization-v1-validation-20260224.md` |
| 전체 회귀 테스트 | N/A | `30 files / 108 tests` PASS | PASS | `PRD/evidence/auth-authorization-v1-validation-20260224.md` |
| 린트 게이트 | N/A | `0 errors / 5 warnings` | PASS | `PRD/evidence/auth-authorization-v1-validation-20260224.md` |

## 최종 판정
- 점검자:
- 점검 일시:
- PASS 개수 / 전체:
- Release Gate 판정: `Go` / `No-Go`
- 이슈 및 후속 조치:
