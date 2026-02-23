# shadcn Implementation Map (Notice Detail)

## 목적
- `pencil-new.pen` 프로토타입을 Next.js + shadcn 컴포넌트 구조로 이관하기 위한 구현 맵
- 대상 태스크: `T-012`, `T-023`, `T-026`, `T-030`, `T-052`

## 권장 디렉토리 구조
```text
src/
  app/
    (main)/bid_notice/detail/[id]/page.tsx
  components/
    ui/                     # shadcn generated primitives
    notice-detail/
      notice-detail-page.tsx
      notice-header.tsx
      notice-title-section.tsx
      notice-main-info-card.tsx
      notice-timeline-card.tsx
      notice-tabs-content-card.tsx
      notice-attachments-card.tsx
      notice-similar-list-card.tsx
      notice-quick-actions-card.tsx
      notice-deadline-card.tsx
      notice-premium-cards.tsx
      notice-state-preview-dev.tsx
  lib/
    supabase/
    bid/
      category-normalize.ts
      notice-detail-query.ts
      notice-detail-types.ts
```

## 토큰/테마 선행 조건
- CSS 변수로 토큰 고정 (`#0F172A`, `#3B82F6`, `#F59E0B`, `#0B1121`, `Noto Sans KR`)
- `next-themes` + `ThemeProvider` + `theme_mode` 저장
- shadcn 기본 팔레트 직접 사용 금지, 토큰 alias로 래핑

## 컴포넌트 매핑

### 1) 페이지 골격
- Prototype: 사이드바 + 메인 2컬럼
- shadcn:
  - `Sidebar`(또는 `Sheet` + custom nav)
  - `Separator`
  - `ScrollArea`
- Custom:
  - `NoticeDetailPageLayout`

### 2) Header/Breadcrumb/Action
- Prototype: breadcrumb, back, bookmark/share/print
- shadcn:
  - `Breadcrumb`
  - `Button` (outline/secondary)
  - `DropdownMenu` (share)
  - `Tooltip`
- Custom:
  - `NoticeHeaderActions`
- 주의:
  - 북마크는 optimistic update + rollback 필요 (`T-026`)

### 3) Title Section
- Prototype: 카테고리/상태 배지, 공고명, 기관, 메타
- shadcn:
  - `Badge`
  - `Card`
- Custom:
  - `NoticeTitleSection`
- 데이터:
  - `bid_ntce_no`, `bid_ntce_nm`, `ntce_instt_nm`, `bid_clse_dt`

### 4) Left Column Cards
- 주요 정보
  - shadcn: `Card`, `Separator`
  - custom: `NoticeMainInfoCard`
- 일정 타임라인
  - shadcn: `Card`, `Badge`
  - custom: `NoticeTimelineCard`
- 상세 내용 탭
  - shadcn: `Tabs`, `TabsList`, `TabsTrigger`, `TabsContent`
  - custom: `NoticeTabsContentCard`
- 첨부파일
  - shadcn: `Card`, `Button`
  - custom: `NoticeAttachmentsCard`
- 유사 공고
  - shadcn: `Card`, `ScrollArea`, `Badge`
  - custom: `NoticeSimilarListCard`

### 5) Right Column Cards
- 빠른 액션
  - shadcn: `Card`, `Button`
  - custom: `NoticeQuickActionsCard`
- 마감 정보
  - shadcn: `Card`, `Progress`
  - custom: `NoticeDeadlineCard`
- 프리미엄 분석
  - shadcn: `Card`, `Button`, `Badge`
  - custom: `NoticePremiumCards`
- 참가업체 통계/유사 사정율
  - shadcn: `Card`, `Button`, `Badge`
  - custom: `NoticePremiumPreviewCards`

### 6) 상태 UI
- 로딩: `Skeleton`
- 에러: `Alert` + `Button(재시도)`
- 빈 상태: `Card` + 보조 CTA
- 권한 잠금: `Badge` + 잠금 아이콘

## 데이터/동작 계약

### 필수 Query
- `getNoticeDetailById(id)`
- `getNoticeAttachments(id)`
- `getSimilarNotices(id, normalizedCategory)`
- `getPremiumPreviewStats(id)`

### Mutation
- `toggleBookmark(noticeId)`
- `executePaidFeature(...)` (후속, `T-040`)

### 카테고리 정규화
- `normalizeCategory(product) => goods`
- 화면 표시는 비즈니스 표기 우선, 내부 쿼리는 normalize 후 사용

## 접근성 매핑
- 아이콘 버튼: `aria-label` 필수 (`북마크`, `공유`, `인쇄`)
- 탭: shadcn 기본 roving tab index 유지
- 포커스: 토큰 기반 focus ring (`ring-2 ring-blue-600`)
- 키보드 플로우: Header actions -> Tabs -> 좌측 카드 CTA -> 우측 카드 CTA

## 구현 순서 (권장)
1. `notice-detail-page.tsx` 골격 + 더미 데이터
2. 좌측 5카드/우측 5카드 정적 컴포넌트 분할
3. React Query 연결 및 로딩/에러/빈 상태
4. 북마크 optimistic update
5. 모바일 sticky CTA + 반응형 조정
6. 접근성/다크모드 검증

## 완료 기준
- 프로토타입 섹션이 컴포넌트 1:1로 매핑됨
- `T-023` 구현 착수 시 추가 구조 변경 없이 API만 연결하면 동작 가능
- `prototype-review-result-v2.md`의 v3 보완 항목을 코드 레벨에서 수용 가능
