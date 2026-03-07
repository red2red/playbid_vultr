# Basic Amount Range Collection QA Checklist

- Date: 2026-03-07
- Scope: 공식 기초금액 API 기반 예가범위 수집 + 모의입찰 진입 차단

## 1. 데이터 커버리지 검증

다음 SQL로 낙찰하한율 공고 대비 예가범위 커버리지를 확인한다.

```sql
with lower_limit_notices as (
  select
    bid_ntce_no,
    coalesce(bid_ntce_ord, '000') as bid_ntce_ord
  from bid_notices
  where sucsfbid_lwlt_rate is not null
),
basic_amount_ready as (
  select
    bid_ntce_no,
    coalesce(bid_ntce_ord, '000') as bid_ntce_ord
  from bid_basic_amounts
  where bssamt is not null
    and rsrvtn_prce_rng_bgn_rate is not null
    and rsrvtn_prce_rng_end_rate is not null
)
select
  count(*) as lower_limit_only_count,
  count(*) filter (
    where exists (
      select 1
      from basic_amount_ready b
      where b.bid_ntce_no = n.bid_ntce_no
        and b.bid_ntce_ord = n.bid_ntce_ord
    )
  ) as lower_limit_with_full_range_count
from lower_limit_notices n;
```

확인 항목:

- `lower_limit_only_count`
- `lower_limit_with_full_range_count`
- 커버리지 비율

## 2. 상태 기록 검증

다음 SQL로 상태 테이블 적재를 확인한다.

```sql
select
  status,
  count(*) as row_count
from basic_amount_collection_status
group by status
order by status;
```

확인 항목:

- `collected`
- `source_unavailable`
- `collection_failed`

## 3. 표본 공고 값 대조

표본 공고 3건 이상에 대해 아래를 비교한다.

1. 공식 기초금액 API 응답
2. `bid_basic_amounts`
3. 웹 모의입찰 화면의 예가범위 라벨

확인 항목:

- `bssamt`
- `rsrvtn_prce_rng_bgn_rate`
- `rsrvtn_prce_rng_end_rate`
- `priceRangeLabel`

## 4. 웹 진입 차단 검증

### 4.1 상세 페이지

1. `lowerLimitRate`는 있지만 `mockBidReady=false`인 공고 상세 진입
2. `모의입찰 시작하기` 버튼 비활성 확인
3. 안내 문구 확인

예상 문구:

- `공식 예가범위 정보가 없어 모의입찰을 제공하지 않습니다.`

### 4.2 모의입찰 라우트 직접 접근

1. 예가범위 없는 공고를 `/mock_bid/[id]`로 직접 호출
2. unavailable 화면 노출 확인

예상 문구:

- `공식 예가범위 정보가 없어 이 공고는 모의입찰을 제공하지 않습니다.`

## 5. 운영 fallback 제거 검증

다음 항목을 확인한다.

1. 운영 경로에서 `estimatedPrice` 또는 `budget`을 기초금액 fallback으로 사용하지 않음
2. 운영 경로에서 기본 `±2%` 예가범위 노출이 없음
3. `buildOfficialMockBidStep1Data()`가 공식 예가범위 없으면 예외를 발생시킴

## 6. 실행 명령

### Root collector

```bash
cd /Users/a1/.config/superpowers/worktrees/PlayBid/codex-basic-amount-range-collection-20260307/g2b_data
pytest tests/test_collect_basic_amounts.py -q
python3 -m py_compile collect_basic_amounts.py
```

### Web

```bash
cd /Users/a1/FlutterWorkspace/PlayBid/playbid_web/.worktrees/codex/basic-amount-range-collection-plan-20260307
npm run test -- src/components/notice-detail/__tests__/notice-quick-actions-card.test.tsx 'src/app/(main)/mock_bid/[id]/page.test.tsx' src/lib/bid/mock-bid-service.test.ts
npx eslint 'src/app/(main)/mock_bid/[id]/page.tsx' 'src/app/(main)/mock_bid/[id]/page.test.tsx' 'src/components/mock-bid/mock-bid-page.tsx' 'src/components/notice-detail/notice-quick-actions-card.tsx' 'src/components/notice-detail/notice-detail-page.tsx' 'src/components/notice-detail/__tests__/notice-quick-actions-card.test.tsx' 'src/lib/bid/notice-detail-query.ts' 'src/lib/bid/notice-detail-types.ts' 'src/lib/bid/mock-bid-service.ts' 'src/lib/bid/mock-bid-service.test.ts'
```
