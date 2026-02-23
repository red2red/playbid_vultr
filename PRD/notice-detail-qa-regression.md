# Notice Detail QA/Regression Sheet (NTD-010)

## 목적
- `T-023`의 상세페이지 구현 결과를 반응형/테마/인쇄/핵심 액션 기준으로 회귀 검증한다.
- 범위: `/bid_notice/detail/[id]`

## 검증 범위
- 브레이크포인트: Desktop (>=1280), Tablet (768~1279), Mobile (<768)
- 테마: Light, Dark
- 인쇄: `?print=1#print-preview`
- 핵심 시나리오:
  - 북마크 토글
  - 로그인 게이팅 + `returnTo`
  - 상세 탭 전환
  - 마감 카운트다운 상태 분기
  - 로딩/에러/빈 상태 표시

## 사전 조건
- `.env.local`에 Supabase 키가 유효하게 설정되어 있어야 한다.
- 테스트 계정 2종 준비:
  - `USER-A`: 로그인 사용자
  - `GUEST`: 미로그인 상태
- 샘플 공고:
  - 일반 공고 1건
  - 마감 24시간 이내 공고 1건
  - 첨부파일 없는 공고 1건

## 수동 테스트 케이스

| ID | 시나리오 | 절차 | 기대 결과 |
|---|---|---|---|
| M-01 | 기본 렌더링 | 상세 진입 | 헤더/좌측5카드/우측카드가 깨짐 없이 렌더링 |
| M-02 | 반응형 전환 | Desktop→Tablet→Mobile 리사이즈 | 레이아웃이 2컬럼→단일 컬럼으로 자연스럽게 전환 |
| M-03 | 다크 모드 | Dark 전환 후 상세 확인 | 텍스트 대비/경계선/버튼 상태가 식별 가능 |
| M-04 | 인쇄 미리보기 | `?print=1#print-preview` 진입 후 인쇄 미리보기 | CTA/사이드바 숨김, 본문 중심 인쇄 레이아웃 노출 |
| M-05 | 북마크 토글(로그인) | USER-A 상태에서 북마크 2회 클릭 | ON/OFF 즉시 반영, 실패 시 오류 문구 노출 |
| M-06 | 북마크 토글(미로그인) | GUEST 상태에서 북마크 클릭 | `/login?returnTo=/bid_notice/detail/<id>` 이동 |
| M-07 | 보호 액션 게이팅 | GUEST 상태에서 모의입찰/적격심사 클릭 | 로그인 화면 이동 후 원경로 복귀 가능 |
| M-08 | 탭 전환 | 사업개요/참가자격/제출서류/기타 클릭 | active state 변경 + 탭 내용 동기화 |
| M-09 | 카운트다운(24h 이내) | 마감 임박 공고 진입 | `HH:MM:SS` 형식 + `마감 24시간 이내` 표시 |
| M-10 | 카운트다운(마감 후) | 마감 지난 공고 진입 | `마감` + `마감 시간이 지났습니다.` 표시 |
| M-11 | 첨부파일 빈 상태 | 첨부파일 없는 공고 진입 | 빈 상태 문구와 안내 텍스트 표시 |
| M-12 | 오류/재시도 | 네트워크 차단 후 상세 진입 | 표준 에러 블록 + 재시도 링크 노출 |

## 자동 테스트 범위
- 실행 명령: `npm test`
- 포함 케이스:
  - `src/components/notice-detail/__tests__/notice-tabs-content-card.test.tsx`
  - `src/components/notice-detail/__tests__/notice-deadline-card.test.tsx`
  - `src/components/notice-detail/__tests__/notice-quick-actions-card.test.tsx`
  - `src/app/api/bookmarks/toggle/route.test.ts`

## 실행 결과 기록
- 실행 일시: 2026-02-23
- 작성자: Codex
- 결과:
  - 자동 테스트: PASS
  - 빌드(`npm run build`): PASS
  - 수동 테스트: 진행 필요 (체크박스 기반 운영 검증)

## 릴리즈 판정 기준
- P0 시나리오(M-01~M-10) 전부 PASS
- 자동 테스트 및 빌드 PASS
- 심각도 High 이슈 0건
