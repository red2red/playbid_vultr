# Basic Amount Range Collection Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** 공식 나라장터 기초금액 API가 제공하는 예가범위가 확인된 공고만 모의입찰에 사용되도록 수집 경로와 웹 진입 정책을 정리한다.

**Architecture:** root collector에서 `bid_basic_amounts`를 공식 기초금액 API 기반으로 지속 적재하고, 웹은 `lowerLimitRate + basicAmount + rangeBeginPercent + rangeEndPercent`가 모두 있을 때만 모의입찰을 연다. 공식 API 미응답 공고는 `source_unavailable`로 기록하고, 운영 fallback `±2%` 및 추정 기초금액 사용은 제거한다.

**Tech Stack:** Python collectors, Postgres/Supabase, GitHub Actions, Next.js App Router, TypeScript, Vitest, Testing Library

---

## 구현 원칙

1. 공식 API 응답만 운영 예가범위로 인정한다.
2. 수집기 보강과 웹 차단은 같은 릴리스 범위로 묶는다.
3. 수집 누락과 공식 API 미응답을 분리 기록한다.
4. TDD 순서로 진행하고, unrelated baseline failure는 건드리지 않는다.

## 범위

1. 기초금액 API 수집기 구현 또는 복구
2. `bid_basic_amounts` 적재 경로 검증
3. 모의입찰 활성 조건을 예가범위 존재 기준으로 강화
4. 운영 fallback 제거
5. 수집/웹 회귀 테스트와 운영 검증 절차 추가

## 비범위

1. 상세 HTML 스크래핑으로 예가범위 복원
2. 공식 API 미응답 공고에 대한 추정 예가범위 생성
3. 모의입찰 결과 계산 로직 전면 수정

### Task 1: 현재 `bid_basic_amounts` 적재 경로와 상태 저장 방식을 고정

**Files:**
- Inspect: `/Users/a1/FlutterWorkspace/PlayBid/g2b_data/collect_notices.py`
- Inspect: `/Users/a1/FlutterWorkspace/PlayBid/koneps_collector/src/collect_notices.py`
- Modify: `/Users/a1/FlutterWorkspace/PlayBid/playbid_web/docs/plans/2026-03-07-basic-amount-range-collection-design.md`
- Create or Modify: `/Users/a1/FlutterWorkspace/PlayBid/supabase/migrations/<timestamp>_basic_amount_collection_status.sql`

**Step 1: 적재 경로 부재를 테스트/문서로 고정**

문서에 아래 사실을 명시한다.

```text
- ENDPOINTS에는 amount endpoint가 선언돼 있음
- 실제 collect loop는 notice endpoint만 호출함
- bid_basic_amounts upsert 경로가 별도로 필요함
```

**Step 2: 상태 저장 방식에 대한 failing test 또는 SQL expectation 추가**

최소 요구 상태:

```sql
status in ('collected', 'source_unavailable', 'collection_failed')
```

**Step 3: 상태 저장 스키마 작성**

선택지 중 하나를 구현한다.

```sql
create table if not exists basic_amount_collection_status (
  id uuid primary key default gen_random_uuid(),
  bid_ntce_no text not null,
  bid_ntce_ord text not null default '000',
  api_category text not null,
  status text not null,
  error_message text,
  collected_at timestamptz not null default now()
);
```

**Step 4: SQL 검토**

Run: `sed -n '1,220p' /Users/a1/FlutterWorkspace/PlayBid/supabase/migrations/<timestamp>_basic_amount_collection_status.sql`
Expected: 상태 enum 수준 값과 lookup 인덱스가 보임

**Step 5: Commit**

```bash
git add /Users/a1/FlutterWorkspace/PlayBid/supabase/migrations/<timestamp>_basic_amount_collection_status.sql /Users/a1/FlutterWorkspace/PlayBid/playbid_web/docs/plans/2026-03-07-basic-amount-range-collection-design.md
git commit -m "docs: define basic amount range collection status model"
```

### Task 2: 기초금액 API mapper 테스트 작성

**Files:**
- Create: `/Users/a1/FlutterWorkspace/PlayBid/g2b_data/tests/test_collect_basic_amounts.py`
- Create: `/Users/a1/FlutterWorkspace/PlayBid/g2b_data/collect_basic_amounts.py`

**Step 1: failing test 작성**

```python
def test_transform_basic_amount_row_maps_range_fields():
    api_row = {
        "bidNtceNo": "R26BK0001",
        "bidNtceOrd": "000",
        "bssamt": "27600000",
        "rsrvtnPrceRngBgnRate": "-3",
        "rsrvtnPrceRngEndRate": "+3",
    }

    row = transform_basic_amount_row(api_row, "construction")

    assert row["bid_ntce_no"] == "R26BK0001"
    assert row["bid_ntce_ord"] == "000"
    assert row["bssamt"] == 27600000
    assert row["rsrvtn_prce_rng_bgn_rate"] == -3
    assert row["rsrvtn_prce_rng_end_rate"] == 3
```

추가 케이스:

1. `bidNtceOrd` 누락 시 `000`
2. `+2` 형태 문자열 파싱
3. 공백/쉼표 제거

**Step 2: 실패 확인**

Run: `cd /Users/a1/FlutterWorkspace/PlayBid/g2b_data && pytest tests/test_collect_basic_amounts.py -q`
Expected: 파일/함수 미구현으로 FAIL

**Step 3: 최소 구현**

```python
def transform_basic_amount_row(api_row: dict, category: str) -> dict:
    return {
        "bid_ntce_no": api_row.get("bidNtceNo"),
        "bid_ntce_ord": api_row.get("bidNtceOrd") or "000",
        "api_category": category,
        "bssamt": parse_int(api_row.get("bssamt")),
        "rsrvtn_prce_rng_bgn_rate": parse_float(api_row.get("rsrvtnPrceRngBgnRate")),
        "rsrvtn_prce_rng_end_rate": parse_float(api_row.get("rsrvtnPrceRngEndRate")),
    }
```

**Step 4: 테스트 재실행**

Run: `cd /Users/a1/FlutterWorkspace/PlayBid/g2b_data && pytest tests/test_collect_basic_amounts.py -q`
Expected: PASS

**Step 5: Commit**

```bash
git add /Users/a1/FlutterWorkspace/PlayBid/g2b_data/tests/test_collect_basic_amounts.py /Users/a1/FlutterWorkspace/PlayBid/g2b_data/collect_basic_amounts.py
git commit -m "test: cover basic amount range api mapping"
```

### Task 3: 기초금액 API collector 구현

**Files:**
- Modify: `/Users/a1/FlutterWorkspace/PlayBid/g2b_data/collect_basic_amounts.py`
- Modify: `/Users/a1/FlutterWorkspace/PlayBid/g2b_data/tests/test_collect_basic_amounts.py`
- Modify: `/Users/a1/FlutterWorkspace/PlayBid/.github/workflows/collect-bid-notices.yml`

**Step 1: 대상 공고 선택 failing test 작성**

```python
def test_select_target_notices_filters_to_lower_limit_notices_without_ranges():
    rows = select_target_notices(...)
    assert rows == [("R26BK0001", "000", "construction")]
```

조건:

1. `bid_notices.sucsfbid_lwlt_rate is not null`
2. `bid_basic_amounts`가 없거나 range 값이 비어 있음
3. category별 endpoint를 결정할 수 있음

**Step 2: 실패 확인**

Run: `cd /Users/a1/FlutterWorkspace/PlayBid/g2b_data && pytest tests/test_collect_basic_amounts.py -q`
Expected: selection helper 미구현으로 FAIL

**Step 3: 최소 구현**

구현 내용:

1. `bid_notices`에서 대상 공고 조회
2. category별 endpoint 매핑
3. `inqryDiv=2`, `bidNtceNo`, `pageNo=1`, `numOfRows=10` 호출
4. `bidNtceOrd` 일치 row 선택
5. 응답 row가 있으면 `bid_basic_amounts` upsert
6. 응답 row가 없으면 `source_unavailable` 상태 저장
7. 예외는 `collection_failed` 상태 저장

**Step 4: workflow 연결**

Run: `sed -n '1,220p' /Users/a1/FlutterWorkspace/PlayBid/.github/workflows/collect-bid-notices.yml`
Expected: 기존 notice collection step 확인

구현 내용:

1. `collect notices` 다음에 `collect basic amounts` step 추가
2. 입력 파라미터:
   - `--days`
   - `--limit`
3. 실패 시 로그는 남기되 전체 workflow exit 정책은 명시

**Step 5: 테스트 재실행**

Run: `cd /Users/a1/FlutterWorkspace/PlayBid/g2b_data && pytest tests/test_collect_basic_amounts.py -q`
Expected: PASS

**Step 6: Commit**

```bash
git add /Users/a1/FlutterWorkspace/PlayBid/g2b_data/collect_basic_amounts.py /Users/a1/FlutterWorkspace/PlayBid/g2b_data/tests/test_collect_basic_amounts.py /Users/a1/FlutterWorkspace/PlayBid/.github/workflows/collect-bid-notices.yml
git commit -m "feat: collect official basic amount ranges for mock bid"
```

### Task 4: 웹 모의입찰 접근 조건 강화

**Files:**
- Modify: `/Users/a1/FlutterWorkspace/PlayBid/playbid_web/src/app/(main)/mock_bid/[id]/page.tsx`
- Modify: `/Users/a1/FlutterWorkspace/PlayBid/playbid_web/src/components/notice-detail/notice-quick-actions-card.tsx`
- Modify: `/Users/a1/FlutterWorkspace/PlayBid/playbid_web/src/components/notice-detail/notice-detail-page.tsx`
- Test: `/Users/a1/FlutterWorkspace/PlayBid/playbid_web/src/components/notice-detail/__tests__/notice-quick-actions-card.test.tsx`
- Test: `/Users/a1/FlutterWorkspace/PlayBid/playbid_web/src/app/(main)/mock_bid/[id]/page.test.tsx`

**Step 1: failing UI test 작성**

```tsx
it('예가범위가 없으면 모의입찰 버튼을 비활성화한다', () => {
  render(
    <NoticeQuickActionsCard
      noticeId="R26BK0001"
      sourceUrl="https://example.com"
      qualificationRequired={false}
      lowerLimitRate={89.745}
      mockBidReady={false}
    />
  );

  expect(screen.getByRole('button', { name: '모의입찰 시작하기' })).toBeDisabled();
  expect(screen.getByText('공식 예가범위 정보가 없어 모의입찰을 제공하지 않습니다.')).toBeInTheDocument();
});
```

**Step 2: failing route test 작성**

```tsx
it('예가범위가 없으면 unavailable 상태를 렌더링한다', async () => {
  mockedGetNoticeDetailById.mockResolvedValue(noticeWithLowerLimitOnly);
  mockedCreateClientResponse.mockResolvedValue(null);
  const ui = await MockBidRoutePage({ params: { id: 'R26BK0001' } });
  expect(renderToStaticMarkup(ui)).toContain('공식 예가범위 정보가 없어');
});
```

**Step 3: 최소 구현**

구현 내용:

1. `hasMockBidAccess`를 `hasMockBidReadyData`로 확장
2. `getMockBidBasicAmountRange()`가 `basicAmount + begin + end`를 모두 가져야 true
3. 버튼 활성 조건을 `lowerLimitRate`만이 아니라 `mockBidReady` prop으로 변경
4. unavailable 문구를 예가범위 기준으로 수정

**Step 4: 테스트 재실행**

Run: `cd /Users/a1/FlutterWorkspace/PlayBid/playbid_web && npm run test -- src/components/notice-detail/__tests__/notice-quick-actions-card.test.tsx src/app/(main)/mock_bid/[id]/page.test.tsx`
Expected: PASS

**Step 5: Commit**

```bash
git add /Users/a1/FlutterWorkspace/PlayBid/playbid_web/src/app/(main)/mock_bid/[id]/page.tsx /Users/a1/FlutterWorkspace/PlayBid/playbid_web/src/components/notice-detail/notice-quick-actions-card.tsx /Users/a1/FlutterWorkspace/PlayBid/playbid_web/src/components/notice-detail/notice-detail-page.tsx /Users/a1/FlutterWorkspace/PlayBid/playbid_web/src/components/notice-detail/__tests__/notice-quick-actions-card.test.tsx /Users/a1/FlutterWorkspace/PlayBid/playbid_web/src/app/(main)/mock_bid/[id]/page.test.tsx
git commit -m "feat: block mock bid when official range data is unavailable"
```

### Task 5: 운영 fallback 제거

**Files:**
- Modify: `/Users/a1/FlutterWorkspace/PlayBid/playbid_web/src/app/(main)/mock_bid/[id]/page.tsx`
- Modify: `/Users/a1/FlutterWorkspace/PlayBid/playbid_web/src/lib/bid/mock-bid-service.ts`
- Test: `/Users/a1/FlutterWorkspace/PlayBid/playbid_web/src/lib/bid/mock-bid-service.test.ts`

**Step 1: failing test 작성**

```ts
it('운영 경로에서 range 값이 없으면 기본 ±2%를 사용하지 않는다', () => {
  expect(() =>
    buildMockBidStep1Data(notice, {
      rangeBeginPercent: undefined,
      rangeEndPercent: undefined,
      requireOfficialRange: true,
    })
  ).toThrow(/official range/i);
});
```

**Step 2: 실패 확인**

Run: `cd /Users/a1/FlutterWorkspace/PlayBid/playbid_web && npm run test -- src/lib/bid/mock-bid-service.test.ts`
Expected: fallback 동작으로 FAIL

**Step 3: 최소 구현**

구현 선택지:

1. `buildMockBidStep1Data()`에 `requireOfficialRange` 옵션 추가
2. 또는 운영용 wrapper 함수 `buildOfficialMockBidStep1Data()`를 분리

권장 구현:

```ts
export function buildOfficialMockBidStep1Data(...) {
  if (options.rangeBeginPercent === undefined || options.rangeEndPercent === undefined) {
    throw new Error('Official range data is required');
  }
  return buildMockBidStep1Data(input, options);
}
```

그리고 route는 wrapper만 사용한다.

**Step 4: 테스트 재실행**

Run: `cd /Users/a1/FlutterWorkspace/PlayBid/playbid_web && npm run test -- src/lib/bid/mock-bid-service.test.ts`
Expected: PASS

**Step 5: Commit**

```bash
git add /Users/a1/FlutterWorkspace/PlayBid/playbid_web/src/app/(main)/mock_bid/[id]/page.tsx /Users/a1/FlutterWorkspace/PlayBid/playbid_web/src/lib/bid/mock-bid-service.ts /Users/a1/FlutterWorkspace/PlayBid/playbid_web/src/lib/bid/mock-bid-service.test.ts
git commit -m "refactor: remove operational fallback for mock bid range"
```

### Task 6: 운영 검증 쿼리와 QA 체크리스트 추가

**Files:**
- Create: `/Users/a1/FlutterWorkspace/PlayBid/playbid_web/docs/plans/2026-03-07-basic-amount-range-collection-qa-checklist.md`
- Modify: `/Users/a1/FlutterWorkspace/PlayBid/PRD/production-data-validation-checklist.md`

**Step 1: QA 체크리스트 작성**

필수 항목:

```text
- lower_limit_only_count
- lower_limit_with_basic_amount_count
- lower_limit_with_full_range_count
- source_unavailable_count
- collection_failed_count
- fallback ±2% 노출 여부
```

**Step 2: 운영 검증 SQL 추가**

예시:

```sql
with lower_limit_notices as (
  select bid_ntce_no, coalesce(bid_ntce_ord, '000') bid_ntce_ord
  from bid_notices
  where sucsfbid_lwlt_rate is not null
)
select count(*) ...
```

**Step 3: 검증 절차 문서화**

1. collector 수동 실행
2. 표본 공고 공식 API 대조
3. 상세 버튼 활성화 확인
4. `/mock_bid/[id]` 직접 진입 차단 확인

**Step 4: Commit**

```bash
git add /Users/a1/FlutterWorkspace/PlayBid/playbid_web/docs/plans/2026-03-07-basic-amount-range-collection-qa-checklist.md /Users/a1/FlutterWorkspace/PlayBid/PRD/production-data-validation-checklist.md
git commit -m "docs: add qa checklist for official basic amount range coverage"
```

### Task 7: 최종 검증과 머지 준비

**Files:**
- Verify: `/Users/a1/FlutterWorkspace/PlayBid/g2b_data/tests/test_collect_basic_amounts.py`
- Verify: `/Users/a1/FlutterWorkspace/PlayBid/playbid_web/src/app/(main)/mock_bid/[id]/page.test.tsx`
- Verify: `/Users/a1/FlutterWorkspace/PlayBid/playbid_web/src/components/notice-detail/__tests__/notice-quick-actions-card.test.tsx`
- Verify: `/Users/a1/FlutterWorkspace/PlayBid/playbid_web/src/lib/bid/mock-bid-service.test.ts`

**Step 1: collector 테스트 실행**

Run: `cd /Users/a1/FlutterWorkspace/PlayBid/g2b_data && pytest tests/test_collect_basic_amounts.py -q`
Expected: PASS

**Step 2: web 타겟 테스트 실행**

Run: `cd /Users/a1/FlutterWorkspace/PlayBid/playbid_web && npm run test -- src/app/(main)/mock_bid/[id]/page.test.tsx src/components/notice-detail/__tests__/notice-quick-actions-card.test.tsx src/lib/bid/mock-bid-service.test.ts`
Expected: PASS

**Step 3: lint 실행**

Run: `cd /Users/a1/FlutterWorkspace/PlayBid/playbid_web && npx eslint src/app/(main)/mock_bid/[id]/page.tsx src/components/notice-detail/notice-quick-actions-card.tsx src/lib/bid/mock-bid-service.ts`
Expected: PASS

**Step 4: 수동 검증**

1. 예가범위 있는 공고 상세에서 버튼 활성
2. 예가범위 없는 공고 상세에서 버튼 비활성
3. 예가범위 없는 공고를 `/mock_bid/[id]`로 직접 호출 시 차단
4. 예가범위 있는 공고의 범위 라벨이 공식 API와 일치

**Step 5: Commit**

```bash
git add -A
git commit -m "test: verify official basic amount range gating"
```
