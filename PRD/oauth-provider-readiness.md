# OAuth Provider Readiness (2026-02-23)

> 참고: 이 리포트는 `/auth/v1/settings` + `/auth/v1/authorize` 기준 provider만 점검합니다.  
> Naver는 현재 GoTrue provider 비활성 상태가 정상이며, 실제 로그인은 broker flow(`GET /functions/v1/naver-oauth`, `POST /functions/v1/naver-oauth-complete`)로 처리합니다.

- Checked at: 2026-02-23T20:27:11.328Z
- Supabase host: api.playbid.kr
- Site URL env: https://playbid.kr
- Provider callback URL: https://api.playbid.kr/auth/v1/callback
- Deferred providers: apple
- Enabled required providers: 2/3
- Authorize-ready required providers: 2/3

## Provider Matrix

| Provider | Scope | Enabled In Supabase | localhost authorize | site authorize | Notes |
|---|---|---|---|---|---|
| apple | Deferred | NO | 400 (FAIL) | 400 (FAIL) | Deferred by team decision |
| google | Required | YES | 302 (OK) | 302 (OK) | Ready |
| kakao | Required | YES | 302 (OK) | 302 (OK) | Ready |
| naver | Required | NO | 400 (FAIL) | 400 (FAIL) | Provider disabled in Supabase Auth settings |

## Broker Smoke Check (2026-02-24)

- `https://api.playbid.kr/functions/v1/naver-oauth?login_type=web&web_origin=https://playbid.kr&return_to=/dashboard`
  - 결과: `302` (Naver authorize URL redirect)
  - state payload에 `context.loginType=web`, `context.webOrigin=https://playbid.kr`, `context.returnTo=/dashboard` 확인
- `https://api.playbid.kr/functions/v1/naver-oauth?error=access_denied&...&state=...`
  - 결과: `302` → `https://playbid.kr/auth-callback?...` 복귀 확인
- `POST https://api.playbid.kr/functions/v1/naver-oauth-complete` (invalid code)
  - 결과: `401 invalid_or_expired_exchange_code` (에러 처리 정상)

## Web Callback E2E (2026-02-24)

- Synthetic exchange_code를 DB에 삽입한 뒤 다음 경로 검증:
  - `https://playbid.kr/auth-callback?provider=naver&exchange_code=<synthetic>&returnTo=/dashboard`
  - 결과: `/dashboard`로 복귀 + 세션 생성 확인
- 로그인 페이지 재진입 검증:
  - `https://playbid.kr/login?returnTo=/dashboard`
  - 결과: 이미 로그인된 세션으로 `/dashboard` 리다이렉트 확인
- cleanup:
  - 테스트용 user / oauth_exchange_codes 레코드 삭제 완료

## Next Actions
1. Keep deferred providers out of release scope and track them in PRD.
2. Register callback URL in each provider console:
   - https://api.playbid.kr/auth/v1/callback
3. Add allowed app redirect URLs in Supabase URL configuration:
   - http://localhost:3000/auth-callback
   - https://playbid.kr/auth-callback
4. 실제 계정 E2E 마무리:
   - Naver/Google/Kakao 실제 계정 승인 후 최종 복귀 및 세션 유지 확인
