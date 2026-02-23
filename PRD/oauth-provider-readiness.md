# OAuth Provider Readiness (2026-02-24)

> 참고: 이 리포트는 Supabase provider + broker 방식을 함께 점검합니다.  
> Naver는 GoTrue provider가 아닌 broker flow(`GET /functions/v1/naver-oauth`, `POST /functions/v1/naver-oauth-complete`)가 정상 경로입니다.

- Checked at: 2026-02-23T21:15:12.573Z
- Rechecked at: 2026-02-23T22:36:01Z (2026-02-24 KST)
- Supabase host: api.playbid.kr
- Site URL env: https://playbid.kr
- Provider callback URL: https://api.playbid.kr/auth/v1/callback
- Deferred providers: apple
- Broker providers: naver
- Enabled supabase-required providers: 2/2
- Authorize-ready required providers: 3/3

## Provider Matrix

| Provider | Scope | Auth Mode | Enabled In Supabase | localhost authorize | site authorize | Notes |
|---|---|---|---|---|---|---|
| apple | Deferred | Supabase | NO | 400 (FAIL) | 400 (FAIL) | Deferred by team decision |
| google | Required | Supabase | YES | 302 (OK) | 302 (OK) | Ready |
| kakao | Required | Supabase | YES | 302 (OK) | 302 (OK) | Ready |
| naver | Required | Broker | BROKER | 302 (OK) | N/A | Broker flow ready |

## Broker Smoke Check (2026-02-24)

- `https://api.playbid.kr/functions/v1/naver-oauth?login_type=web&web_origin=https://playbid.kr&return_to=/dashboard`
  - 결과: `302` (Naver authorize URL redirect)
  - state payload에 `context.loginType=web`, `context.webOrigin=https://playbid.kr`, `context.returnTo=/dashboard` 확인
- `https://api.playbid.kr/functions/v1/naver-oauth?error=access_denied&...&state=...`
  - 결과: `302` → `https://playbid.kr/auth-callback?...` 복귀 확인
- `POST https://api.playbid.kr/functions/v1/naver-oauth-complete` (invalid code)
  - 결과: `401 invalid_or_expired_exchange_code` (에러 처리 정상)

## Web Callback E2E (2026-02-24)

- Synthetic exchange_code를 DB에 삽입한 뒤 검증:
  - `https://playbid.kr/auth-callback?provider=naver&exchange_code=<synthetic>&returnTo=/dashboard`
  - 결과: `/dashboard` 복귀 + 세션 생성 확인
- 로그인 페이지 재진입 검증:
  - `https://playbid.kr/login?returnTo=/dashboard`
  - 결과: 로그인 세션 유지 상태에서 `/dashboard` 리다이렉트 확인
- cleanup:
  - 테스트용 user / oauth_exchange_codes 레코드 삭제 완료

## Web UI Redirect Smoke After Git Deploy (2026-02-24)

- `https://playbid.kr/login`에서 카카오 버튼 클릭
  - 결과: `https://accounts.kakao.com/...` 로그인 페이지 진입 확인
- `https://playbid.kr/login`에서 네이버 버튼 클릭
  - 결과: `https://nid.naver.com/oauth2.0/authorize?...redirect_uri=https://api.playbid.kr/functions/v1/naver-oauth...` 진입 확인

## Automated OAuth E2E Re-Run (2026-02-24 KST)

- 테스트 기준 URL:
  - `https://playbid.kr/login?returnTo=/dashboard`
- 공급자 진입 검증:
  - Google 버튼 클릭 → `https://accounts.google.com/...` 진입 확인
  - Kakao 버튼 클릭 → `https://accounts.kakao.com/...` 진입 확인
  - Naver 버튼 클릭 → `https://nid.naver.com/oauth2.0/authorize?...redirect_uri=https://api.playbid.kr/functions/v1/naver-oauth...` 진입 확인
- Naver synthetic 성공 콜백 검증:
  - 임시 사용자 생성 + `oauth_exchange_codes` 1회 코드 삽입
  - `https://playbid.kr/auth-callback?provider=naver&exchange_code=<synthetic>&returnTo=/dashboard`
  - 결과: `/dashboard` 복귀 및 대시보드 렌더 확인
  - `https://playbid.kr/login?returnTo=/dashboard` 재진입 시 `/dashboard` 리다이렉트 확인
- cleanup:
  - 임시 user 삭제 완료
  - `oauth_exchange_codes` 잔여 레코드 `0` 확인

## Next Actions
1. Apple은 보류 상태 유지(릴리즈 스코프 제외) 및 PRD 추적 지속.
2. 실계정 최종 E2E 마무리:
   - Google/Kakao: 승인 → `/auth-callback` 복귀 → 세션 유지 확인
   - Naver(Broker): 승인 → broker complete → `/auth-callback` 복귀 → 세션 유지 확인
3. 릴리즈마다 broker redirect smoke(`GET /functions/v1/naver-oauth`)와 `/auth-callback` 오류 복귀(`307`)를 회귀 체크.
