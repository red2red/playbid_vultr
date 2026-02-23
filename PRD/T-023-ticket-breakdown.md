# T-023 Ticket Breakdown (Notice Detail)

## 목적
- `Task.md`의 `T-023 (입찰공고 상세)`를 바로 개발 가능한 작업 단위로 분해
- 기준 문서:
  - `prototype-review-result-v3.md`
  - `shadcn-implementation-map-notice-detail.md`

## Sprint Scope (권장)
- 범위: `/bid_notice/detail/[id]` 페이지 + 연관 컴포넌트
- 제외: 실제 과금 실행(`T-040`), 고급 통계 계산 상세 로직

## 티켓 목록

### NTD-001 페이지 골격 + 데이터 타입
- 상태: ✅ 완료 (2026-02-23)
- 산출물:
  - `src/app/(main)/bid_notice/detail/[id]/page.tsx`
  - `src/lib/bid/notice-detail-types.ts`
- 완료 기준:
  - 라우트 파라미터로 notice id 수신
  - 타입 오류 없이 기본 레이아웃 렌더링

### NTD-002 헤더/타이틀 섹션
- 상태: ✅ 완료 (2026-02-23)
- 산출물:
  - `src/components/notice-detail/notice-header.tsx`
  - `src/components/notice-detail/notice-title-section.tsx`
- 완료 기준:
  - breadcrumb/back/bookmark/share/print UI
  - 카테고리 배지 + `product ↔ goods` 매핑 표시

### NTD-003 좌측 카드 묶음
- 상태: ✅ 완료 (2026-02-23)
- 산출물:
  - `notice-main-info-card.tsx`
  - `notice-timeline-card.tsx`
  - `notice-tabs-content-card.tsx`
  - `notice-attachments-card.tsx`
  - `notice-similar-list-card.tsx`
- 완료 기준:
  - 5개 카드 모두 표시
  - 탭 전환 active state + 200ms transition

### NTD-004 우측 카드 묶음
- 상태: ✅ 완료 (2026-02-23)
- 산출물:
  - `notice-quick-actions-card.tsx`
  - `notice-deadline-card.tsx`
  - `notice-premium-cards.tsx`
- 완료 기준:
  - 빠른 액션 3종 + 로그인 게이팅 메시지
  - <24h 카운트다운 상태 분기
  - 프리미엄 preview + lock 상태

### NTD-005 상태 UI
- 상태: ✅ 완료 (2026-02-23)
- 산출물:
  - `notice-state-preview-dev.tsx` (개발 전용)
  - 페이지 내 loading/empty/error 블록
- 완료 기준:
  - Skeleton/Empty/Error/Retry 작동
  - 다운로드 실패→재시도 안내 표시

### NTD-006 데이터 조회 레이어
- 상태: ✅ 완료 (2026-02-23)
- 산출물:
  - `src/lib/bid/notice-detail-query.ts`
- 완료 기준:
  - `getNoticeDetailById`, `getNoticeAttachments`, `getSimilarNotices`, `getPremiumPreviewStats`
  - 쿼리 실패 시 에러 모델 표준화(`requestId`, `code`, `message`, `suggestion`)

### NTD-007 북마크 토글
- 상태: ✅ 완료 (2026-02-23)
- 산출물:
  - `toggleBookmark` mutation + React Query optimistic update
- 완료 기준:
  - 상세/목록 상태 일관성 유지
  - 실패 시 rollback + 토스트

### NTD-008 로그인 게이팅 및 returnPath
- 상태: ✅ 완료 (2026-02-23)
- 산출물:
  - 보호 액션 wrapper (`withAuthAction` 또는 hook)
- 완료 기준:
  - 미로그인 클릭 시 `/login?returnTo=<current-path>`
  - 로그인 후 원경로 복귀

### NTD-009 접근성/다크/인쇄
- 상태: ✅ 완료 (2026-02-23)
- 산출물:
  - ARIA 라벨 적용
  - dark 모드 스타일
  - print stylesheet (`@media print`)
- 완료 기준:
  - icon button ARIA 적용
  - dark contrast WCAG AA
  - print 시 불필요 CTA 숨김 + 본문 중심 인쇄

### NTD-010 QA/회귀 테스트
- 상태: ✅ 완료 (2026-02-23)
- 산출물:
  - `PRD/notice-detail-qa-regression.md`
  - `src/components/notice-detail/__tests__/notice-tabs-content-card.test.tsx`
  - `src/components/notice-detail/__tests__/notice-deadline-card.test.tsx`
  - `src/components/notice-detail/__tests__/notice-quick-actions-card.test.tsx`
  - `src/app/api/bookmarks/toggle/route.test.ts`
- 완료 기준:
  - Desktop/Tablet/Mobile, Light/Dark, print 검증 통과
  - 북마크/게이팅/탭/카운트다운 시나리오 통과

## 의존성
1. NTD-001 -> NTD-002/003/004
2. NTD-003/004 -> NTD-005
3. NTD-006 -> NTD-007/008
4. NTD-002~008 -> NTD-009
5. 전부 완료 후 NTD-010

## 완료 정의
- `T-023` 완료 기준 충족
- `prototype-review-result-v3.md`의 Go 상태와 시각/기능 불일치 없음
