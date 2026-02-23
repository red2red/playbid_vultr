# Release Gate Readiness (2026-02-24)

## 기준 문서
- `PRD/Task.md` (V1 출고 기준)
- `PRD/requirements.md`
- `PRD/design.md`

## 실행 근거
- `npm test` 통과: 24 files, 90 tests
- `npm run build` 통과: App Router route map 생성
- 라우트 스캐폴딩 확인: `T-010` 명시 경로 23개 전부 파일 존재 확인
- `2026-02-24` self-host 함수 반영: `naver-oauth` 최신 코드 동기화 + edge-runtime 컨테이너 재시작
- `2026-02-24` OAuth 스모크:
  - `https://playbid.kr/login` 접근 `200` 확인
  - `https://playbid.kr/login`에서 네이버/카카오 버튼 클릭 시 각 공급자 로그인 페이지 진입 확인
  - `/auth-callback?error=...` 호출 시 `https://playbid.kr/login?...`으로 복귀(프록시 환경 localhost 리다이렉트 문제 수정)
  - synthetic `exchange_code` 기반 `/auth-callback` 검증에서 `/dashboard` 복귀 및 세션 생성 확인
- `2026-02-24` Coolify Git 배포 경로 점검:
  - `queue_application_deployment(...)` 기반 배포 `finished` 확인
  - `servers.id=0.user=root`, `applications.id=1 limits_* = 0` 보정 후 배포 큐 정상 동작
  - 단, 원격 Git 소스(`red2red/playbid_vultr/main`)가 운영 최신과 불일치하여 `/login 404` 회귀 발생
  - 즉시 hot-sync(`scripts/deploy_playbid_web_vps.sh`)로 `/login 200` 복구 완료
- `2026-02-24` Git 소스 동기화 + 재배포 리허설 완료:
  - `playbid_web` `main` → `2d09757`를 `origin/main`에 push 완료
  - Coolify Git 배포(`deployment_uuid=y440808kko0g4s88kkoosc0k`) `finished`
  - 실행 컨테이너 이미지가 `ok80g44cwg08s44c8csckogk:2d09757...`로 전환된 상태에서 `/login 200`, `/auth-callback(error) 307` 재확인

## V1 출고 기준 점검

| 항목 | 결과 | 근거 |
|---|---|---|
| 인증/권한/복귀 경로 정상 동작 | 부분통과 | OAuth 로그인 UI, `/auth-callback` code/exchange_code 처리 반영 완료. Apple은 보류(릴리즈 스코프 제외). Naver는 Supabase provider가 아닌 broker 경로(`https://api.playbid.kr/functions/v1/naver-oauth`)를 사용하며 `2026-02-24`에 self-host 함수 배포/재시작 및 웹 컨텍스트 state 검증(302 redirect + `context.loginType=web`) 완료. 운영 도메인 `https://playbid.kr/login` 서빙, 공급자 로그인 페이지 진입, synthetic exchange_code 기반 세션 생성까지 검증했으나 실제 사용자 계정 E2E(승인→복귀) 확인은 아직 미검증 |
| 핵심 5개 화면 운영 데이터 검증 | 보류 | 화면 라우트/빌드는 확인됨(`/dashboard`, `/bid_notice`, `/bid_opening`, `/bid_history`, `/profile`). 검증 템플릿은 `PRD/production-data-validation-checklist.md`에 작성했으나, 운영 DB 실제 대조 결과는 아직 미입력 |
| 과금 트랜잭션 원자성 + idempotency 검증 | 통과 | `src/lib/bid/paid-feature-service.test.ts`에서 롤백/보상/중복키/24시간 캐시 시나리오 통과, `src/app/api/paid/execute/route.test.ts` 통과 |
| P0 100% 완료, P1 70% 이상 완료 | 미충족 | `PRD/Task.md`에 다수 항목의 상태가 아직 미기록/미검증이라 완료율 산정 근거가 부족 |

## 판정
- 현재 판정: **No-Go (출고 보류)**
- 사유:
  - 운영 데이터 기반 수동 검증 문서 부재 (핵심 5개 화면)
  - 전체 P0/P1 완료율이 출고 기준에 도달했다는 객관 근거 부족

## 출고 전 필수 보완
1. 운영 데이터 대조 문서 추가: 핵심 5개 화면의 실제 DB 샘플과 UI 값 비교 캡처/표 작성
2. `PRD/Task.md` 전체 항목 상태 갱신: P0/P1 완료율 계산 가능하도록 `완료/진행중/보류` 명시
3. OAuth E2E 수동 검증: Google/Kakao provider 방식 + Naver broker 방식에 대해 운영 도메인에서 로그인→복귀→세션 유지 확인 (Apple은 보류)
4. Naver 콘솔 허용 도메인 점검: localhost 테스트가 필요하면 로컬 테스트 도메인/터널 URL을 네이버 개발자센터 서비스 URL에 추가
5. 운영 배포 체계 정리: 완료. `red2red/playbid_vultr` 소스 동기화 + Coolify Git 재배포 리허설(로그인/콜백 스모크)까지 완료. 운영 기본 배포 경로를 Git 트리거로 전환하고 hot-sync는 비상 복구 경로로 유지

## 참고
- 현재 빌드 경고(비차단): workspace root lockfile 경고, middleware deprecation 경고, baseline-browser-mapping 업데이트 권고
