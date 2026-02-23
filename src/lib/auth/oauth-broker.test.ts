import {
    buildOAuthBrokerStartUrl,
    exchangeOAuthBrokerCodeForRefreshToken,
} from './oauth-broker';

describe('oauth-broker helpers', () => {
    it('브로커 시작 URL을 생성한다', () => {
        const result = buildOAuthBrokerStartUrl({
            supabaseUrl: 'https://api.playbid.kr/',
            provider: 'naver',
            webOrigin: 'https://playbid.kr/login',
            returnTo: '/bid_notice/detail/123',
        });

        expect(result).toBe(
            'https://api.playbid.kr/functions/v1/naver-oauth?login_type=web&web_origin=https%3A%2F%2Fplaybid.kr&return_to=%2Fbid_notice%2Fdetail%2F123'
        );
    });

    it('브로커 시작 URL은 returnTo를 내부 경로로 강제한다', () => {
        const result = buildOAuthBrokerStartUrl({
            supabaseUrl: 'https://api.playbid.kr',
            provider: 'naver',
            webOrigin: 'https://playbid.kr',
            returnTo: 'https://malicious.example',
        });

        expect(result).toContain('return_to=%2Fdashboard');
    });

    it('지원되지 않는 webOrigin 프로토콜은 거부한다', () => {
        expect(() =>
            buildOAuthBrokerStartUrl({
                supabaseUrl: 'https://api.playbid.kr',
                provider: 'naver',
                webOrigin: 'ftp://playbid.kr',
                returnTo: '/dashboard',
            })
        ).toThrow('invalid_web_origin_protocol');
    });

    it('exchange code를 refresh token으로 교환한다', async () => {
        const fetcher = vi.fn(async () => {
            return new Response(
                JSON.stringify({
                    success: true,
                    refresh_token: 'refresh-token-value',
                }),
                { status: 200 }
            );
        });

        const token = await exchangeOAuthBrokerCodeForRefreshToken(
            {
                supabaseUrl: 'https://api.playbid.kr',
                anonKey: 'anon-key',
                provider: 'naver',
                exchangeCode: 'exchange-code',
            },
            fetcher as typeof fetch
        );

        expect(token).toBe('refresh-token-value');
        expect(fetcher).toHaveBeenCalledWith(
            'https://api.playbid.kr/functions/v1/naver-oauth-complete',
            expect.objectContaining({
                method: 'POST',
            })
        );
    });

    it('exchange complete 호출 실패를 오류로 처리한다', async () => {
        const fetcher = vi.fn(async () => {
            return new Response(
                JSON.stringify({
                    success: false,
                    error: 'invalid_or_expired_exchange_code',
                }),
                { status: 401 }
            );
        });

        await expect(
            exchangeOAuthBrokerCodeForRefreshToken(
                {
                    supabaseUrl: 'https://api.playbid.kr',
                    anonKey: 'anon-key',
                    provider: 'naver',
                    exchangeCode: 'invalid-code',
                },
                fetcher as typeof fetch
            )
        ).rejects.toThrow('broker_complete_failed:naver:invalid_or_expired_exchange_code');
    });

    it('성공 응답이어도 refresh token 누락 시 오류를 반환한다', async () => {
        const fetcher = vi.fn(async () => {
            return new Response(
                JSON.stringify({
                    success: true,
                }),
                { status: 200 }
            );
        });

        await expect(
            exchangeOAuthBrokerCodeForRefreshToken(
                {
                    supabaseUrl: 'https://api.playbid.kr',
                    anonKey: 'anon-key',
                    provider: 'naver',
                    exchangeCode: 'exchange-code',
                },
                fetcher as typeof fetch
            )
        ).rejects.toThrow('broker_complete_invalid_response:naver');
    });
});
