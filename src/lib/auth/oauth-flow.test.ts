import {
    asSingleParamValue,
    buildLoginHref,
    buildOAuthCallbackUrl,
    getLoginErrorMessage,
    getOAuthProviderLabel,
    sanitizeReturnTo,
} from './oauth-flow';

describe('oauth-flow helpers', () => {
    it('search param 값을 단일 문자열로 변환한다', () => {
        expect(asSingleParamValue('abc')).toBe('abc');
        expect(asSingleParamValue(['first', 'second'])).toBe('first');
        expect(asSingleParamValue(undefined)).toBeNull();
    });

    it('returnTo를 내부 경로로 정규화한다', () => {
        expect(sanitizeReturnTo('/bid_notice/detail/1')).toBe('/bid_notice/detail/1');
        expect(sanitizeReturnTo('/bid_history?status=success')).toBe('/bid_history?status=success');
        expect(sanitizeReturnTo('https://malicious.example')).toBe('/dashboard');
        expect(sanitizeReturnTo('//evil.com')).toBe('/dashboard');
        expect(sanitizeReturnTo('')).toBe('/dashboard');
    });

    it('login URL에 returnTo와 에러 정보를 포함한다', () => {
        const href = buildLoginHref({
            returnTo: '/profile',
            errorCode: 'oauth_failed',
            provider: 'google',
        });
        expect(href).toBe('/login?returnTo=%2Fprofile&error=oauth_failed&provider=google');
    });

    it('OAuth callback URL을 생성한다', () => {
        const callbackUrl = buildOAuthCallbackUrl(
            'https://playbid.kr',
            '/bid_history?status=success',
            'kakao'
        );

        expect(callbackUrl).toBe(
            'https://playbid.kr/auth-callback?returnTo=%2Fbid_history%3Fstatus%3Dsuccess&provider=kakao'
        );
    });

    it('provider label과 에러 메시지를 반환한다', () => {
        expect(getOAuthProviderLabel('naver')).toBe('네이버');
        expect(getOAuthProviderLabel('unknown')).toBe('소셜');
        expect(getLoginErrorMessage('oauth_failed', 'apple')).toContain('Apple');
        expect(getLoginErrorMessage('missing_code', 'google')).toContain('인증 코드');
        expect(getLoginErrorMessage('broker_failed', 'naver')).toContain('브로커');
        expect(getLoginErrorMessage('broker_unavailable', 'naver')).toContain('설정');
    });
});
