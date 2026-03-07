# KONEPS Basic Amount Range Collection Design

- Date: 2026-03-07
- Scope: PlayBid collector (`/Users/a1/FlutterWorkspace/PlayBid/g2b_data`) + PlayBid Web (`/Users/a1/FlutterWorkspace/PlayBid/playbid_web`)
- Status: Approved
- Decision Owner: PlayBid Web
- Out of Scope: 공식 API 미응답 공고를 추정값으로 보정하는 fallback 도입, 상세 HTML 스크래핑으로 예가범위 강제 복원, 모의입찰 UX 전면 개편

## 1. Goal

낙찰하한율이 존재하는 공고 중, 공식 나라장터 기초금액 API가 제공하는 예가범위(`rsrvtnPrceRngBgnRate`, `rsrvtnPrceRngEndRate`)가 확인된 공고만 모의입찰에 사용되도록 수집과 웹 진입 정책을 정리한다.

핵심 원칙은 다음과 같다.

1. 공식 API 응답만 운영 데이터로 인정한다.
2. 예가범위가 없으면 모의입찰을 차단한다.
3. `±2%` 같은 운영 fallback은 제거한다.
4. 수집 불가와 수집 누락은 구분해서 기록한다.

## 2. Problem Statement

현재 확인된 상태는 다음과 같다.

1. 공식 문서에는 낙찰하한율과 예가범위 필드가 명시돼 있다.
   - `sucsfbidLwltRate`
   - `rsrvtnPrceRngBgnRate`
   - `rsrvtnPrceRngEndRate`
2. DB에 이미 적재된 `bid_basic_amounts` row의 예가범위 값 자체는 표본상 공식 API와 일치한다.
3. 하지만 낙찰하한율이 있는 공고 전체 기준으로는 `bid_basic_amounts` 커버리지가 부족하다.
4. 현재 collector 코드에서는 기초금액 API endpoint 상수만 선언돼 있고, 실제 `bid_basic_amounts` 적재 루틴은 확인되지 않았다.
5. 웹 모의입찰 라우트는 `bid_basic_amounts`가 없을 때 `estimatedPrice` 또는 `budget`을 fallback으로 사용하고, `buildMockBidStep1Data()`는 기본 예가범위 `±2%`를 사용한다.

이 구조의 문제는 다음과 같다.

1. 사용자에게 실제 예가범위인 것처럼 보이지만, 일부는 추정값일 수 있다.
2. 낙찰하한율만 있으면 모의입찰이 열려 데이터 신뢰성이 깨진다.
3. 수집 누락과 공식 API 미응답을 구분하지 않아 운영 이슈 분석이 어렵다.

## 3. Inputs and Constraints

### 3.1 Official Inputs

- 공식 문서: [조달청_OpenAPI참고자료_나라장터_입찰공고정보서비스_1.1.docx](/Users/a1/FlutterWorkspace/PlayBid/조달청_OpenAPI참고자료_나라장터_입찰공고정보서비스_1.1.docx)
- 기초금액 API
  - `getBidPblancListInfoCnstwkBsisAmount`
  - `getBidPblancListInfoServcBsisAmount`
  - `getBidPblancListInfoThngBsisAmount`

### 3.2 Current Runtime Inputs

- 공고 상세: `bid_notices`
- 예가범위/기초금액: `bid_basic_amounts`
- 모의입찰 라우트: [`/Users/a1/FlutterWorkspace/PlayBid/playbid_web/src/app/(main)/mock_bid/[id]/page.tsx`](/Users/a1/FlutterWorkspace/PlayBid/playbid_web/src/app/(main)/mock_bid/[id]/page.tsx)
- 모의입찰 데이터 빌더: [`/Users/a1/FlutterWorkspace/PlayBid/playbid_web/src/lib/bid/mock-bid-service.ts`](/Users/a1/FlutterWorkspace/PlayBid/playbid_web/src/lib/bid/mock-bid-service.ts)
- 공고 상세 빠른 액션: [`/Users/a1/FlutterWorkspace/PlayBid/playbid_web/src/components/notice-detail/notice-quick-actions-card.tsx`](/Users/a1/FlutterWorkspace/PlayBid/playbid_web/src/components/notice-detail/notice-quick-actions-card.tsx)

### 3.3 Constraints

1. 공식 기초금액 API가 `NO_ITEM`을 반환하는 공고가 존재한다.
2. 운영에서는 추정 예가범위를 사용하면 안 된다.
3. 사용자에게는 “지원 불가 사유”가 분명히 보여야 한다.
4. 수집기 변경은 root repo(`PlayBid`)에서 일어나고, 웹 차단은 nested repo(`playbid_web`)에서 일어난다.

## 4. Option Comparison

### Option A: 현재 구조 유지 + 기본 예가범위 fallback 허용

- 설명: `bid_basic_amounts`가 없을 때 `estimatedPrice/budget`와 `±2%`를 사용한다.
- 장점: 모의입찰 가능한 공고 수가 많다.
- 단점:
  - 실제 데이터처럼 보이는 추정값이 섞인다.
  - 사용자 신뢰를 해친다.
  - QA 시 진실값 판단이 어렵다.

### Option B: 공식 기초금액 API 수집 강화 + 웹 차단만 추가

- 설명: `bid_basic_amounts`를 보강 수집하고, 웹은 예가범위가 없으면 차단한다.
- 장점:
  - 구현 범위가 비교적 작다.
  - 데이터 신뢰성을 확보한다.
- 단점:
  - 공식 API 미응답 공고가 왜 막히는지 운영 가시성이 부족하다.

### Option C (권장): 공식 기초금액 API 수집 강화 + 상태 구분 + 웹 차단

- 설명: Option B에 더해 `source_unavailable` 상태를 기록하고, 상세/모의입찰 진입 정책을 명시적으로 연결한다.
- 장점:
  - 데이터 신뢰성과 운영 가시성을 같이 확보한다.
  - 수집 누락과 공식 API 미응답을 구분할 수 있다.
  - 사용자 안내 문구와 수집 모니터링 지표를 일치시킬 수 있다.
- 단점:
  - 스키마/수집기/웹/모니터링까지 범위가 넓어진다.

권장 결론: **Option C**

## 5. Final Design

### 5.1 Data Policy

운영 모의입찰에 필요한 필수 데이터는 아래 4개다.

1. `lowerLimitRate`
2. `basicAmount`
3. `rangeBeginPercent`
4. `rangeEndPercent`

이 중 하나라도 없으면 모의입찰을 열지 않는다.

### 5.2 Collection Policy

1. `bid_notices` 수집은 기존대로 유지한다.
2. 별도 기초금액 수집기에서 공고번호/차수 기준으로 공식 기초금액 API를 호출한다.
3. 응답이 있으면 `bid_basic_amounts`를 upsert 한다.
4. 공식 API가 `NO_ITEM`이면 상태 테이블 또는 로그 메타에 `source_unavailable`로 남긴다.
5. HTTP 오류, 타임아웃, 파싱 오류는 `collection_failed`로 구분한다.

### 5.3 Web Access Policy

모의입찰 활성 조건은 아래를 모두 만족해야 한다.

1. `notice.lowerLimitRate > 0`
2. `bid_basic_amounts.bssamt > 0`
3. `bid_basic_amounts.rsrvtn_prce_rng_bgn_rate is not null`
4. `bid_basic_amounts.rsrvtn_prce_rng_end_rate is not null`

빠른 액션 버튼과 `/mock_bid/[id]` 서버 라우트는 같은 기준을 공유해야 한다.

### 5.4 Fallback Policy

운영 경로에서는 아래 fallback을 제거한다.

1. `estimatedPrice` / `budget`를 기초금액으로 사용하는 fallback
2. `DEFAULT_RANGE_PERCENT = 2`를 운영 모의입찰에서 사용하는 fallback

허용되는 fallback은 다음뿐이다.

1. 테스트 fixture
2. 목업 데이터
3. 개발용 샘플 페이지

## 6. Proposed Data Model Changes

### 6.1 `bid_basic_amounts` 활용 유지

새 테이블을 추가로 만들기보다, 실제 모의입찰 소비 데이터는 계속 `bid_basic_amounts`를 사용한다.

이유:

1. 이미 앱과 웹이 읽고 있다.
2. 필드 구조가 공식 기초금액 API와 정합적이다.
3. 필요한 것은 새 소비 테이블보다 안정적인 적재 경로다.

### 6.2 상태 추적 권장

다음 중 하나를 추가한다.

1. `basic_amount_collection_logs` 같은 전용 상태 테이블
2. 기존 `data_collection_logs.metadata` 확장

최소 저장 항목:

- `bid_ntce_no`
- `bid_ntce_ord`
- `api_category`
- `status` (`collected`, `source_unavailable`, `collection_failed`)
- `collected_at`
- `error_message`

## 7. Collection Flow

1. 공고 수집 완료
2. 낙찰하한율이 있는 공고 대상 추출
3. 카테고리별 기초금액 API endpoint 결정
4. `inqryDiv=2`, `bidNtceNo` 기준 호출
5. 동일 차수(`bidNtceOrd`) row 매칭
6. 값이 있으면 `bid_basic_amounts` upsert
7. 값이 없으면 `source_unavailable` 기록
8. 웹은 `bid_basic_amounts` 존재 여부로만 모의입찰 허용

## 8. UX Impact

### 8.1 Notice Detail

- `모의입찰 시작하기` 버튼은 “낙찰하한율 존재”가 아니라 “모의입찰 필수 데이터 존재” 기준으로 활성화한다.
- 비활성화 사유 문구 예시:
  - `공식 예가범위 정보가 없어 모의입찰을 제공하지 않습니다.`

### 8.2 Mock Bid Route

- 서버 라우트에서 동일 기준으로 차단한다.
- 차단 메시지는 “낙찰하한율 없음”이 아니라 “공식 예가범위 정보 없음”으로 수정한다.

## 9. Testing Strategy

### 9.1 Collector Tests

1. 공식 API row를 `bid_basic_amounts` row로 정확히 매핑
2. `NO_ITEM` 응답을 `source_unavailable`로 기록
3. 동일 공고번호/차수 upsert 회귀 방지
4. category별 endpoint 선택 검증

### 9.2 Web Tests

1. `lowerLimitRate`만 있고 예가범위가 없으면 버튼 비활성
2. 모의입찰 라우트에서 예가범위 없으면 차단
3. 운영 경로에서 `±2%` 기본값이 노출되지 않음
4. 예가범위가 있는 공고는 기존처럼 진입 가능

## 10. Verification Targets

운영 검증 지표는 다음과 같다.

1. `lower_limit_only_count`
2. `lower_limit_with_basic_amount_count`
3. `lower_limit_with_full_range_count`
4. `source_unavailable_count`
5. `collection_failed_count`

성공 기준:

1. 공식 API 응답이 있는 표본은 DB 값과 1:1 일치
2. 운영 fallback `±2%` 노출 0건
3. 모의입찰 허용 공고는 모두 공식 예가범위를 가짐

## 11. Risks

1. 공식 API가 값 자체를 제공하지 않는 공고는 영구적으로 모의입찰 비활성일 수 있다.
2. 기초금액 수집기를 잘못 설계하면 호출량이 과도해질 수 있다.
3. 웹 차단만 먼저 넣고 수집기를 나중에 넣으면 이용 가능 공고 수가 급감할 수 있다.

대응:

1. 수집기와 웹 차단을 같은 릴리스 범위로 묶는다.
2. `source_unavailable`와 `collection_failed`를 분리해서 운영 판단 오류를 줄인다.
3. 배포 전 샘플 공고 대조를 필수화한다.
