import { NextRequest } from 'next/server';

const {
    exchangeCodeForSessionMock,
    refreshSessionMock,
    exchangeOAuthBrokerCodeForRefreshTokenMock,
} = vi.hoisted(() => ({
    exchangeCodeForSessionMock: vi.fn(),
    refreshSessionMock: vi.fn(),
    exchangeOAuthBrokerCodeForRefreshTokenMock: vi.fn(),
}));

vi.mock('@/lib/supabase/server', () => ({
    createClient: vi.fn(async () => ({
        auth: {
            exchangeCodeForSession: exchangeCodeForSessionMock,
            refreshSession: refreshSessionMock,
        },
    })),
}));

vi.mock('@/lib/auth/oauth-broker', () => ({
    OAUTH_BROKER_PROVIDERS: ['kakao', 'naver'],
    exchangeOAuthBrokerCodeForRefreshToken: exchangeOAuthBrokerCodeForRefreshTokenMock,
}));

import { GET } from './route';

function makeRequest(url: string): NextRequest {
    return new NextRequest(url);
}

describe('GET /auth-callback', () => {
    beforeEach(() => {
        exchangeCodeForSessionMock.mockReset();
        refreshSessionMock.mockReset();
        exchangeOAuthBrokerCodeForRefreshTokenMock.mockReset();

        exchangeCodeForSessionMock.mockResolvedValue({ error: null });
        refreshSessionMock.mockResolvedValue({ error: null });
        exchangeOAuthBrokerCodeForRefreshTokenMock.mockResolvedValue('refresh-token-value');

        process.env.NEXT_PUBLIC_SUPABASE_URL = 'https://api.playbid.kr';
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY = 'anon-key';
    });

    it('kakao exchange_code는 브로커 경유로 세션을 갱신한다', async () => {
        const response = await GET(
            makeRequest('http://localhost:3000/auth-callback?provider=kakao&exchange_code=exchange&returnTo=/dashboard')
        );

        expect(response.status).toBe(307);
        expect(response.headers.get('location')).toBe('http://localhost:3000/dashboard');
        expect(exchangeOAuthBrokerCodeForRefreshTokenMock).toHaveBeenCalledWith({
            supabaseUrl: 'https://api.playbid.kr',
            anonKey: 'anon-key',
            provider: 'kakao',
            exchangeCode: 'exchange',
        });
        expect(refreshSessionMock).toHaveBeenCalledWith({
            refresh_token: 'refresh-token-value',
        });
    });

    it('브로커 교환이 실패하면 로그인으로 오류 복귀한다', async () => {
        exchangeOAuthBrokerCodeForRefreshTokenMock.mockRejectedValueOnce(new Error('failed'));

        const response = await GET(
            makeRequest('http://localhost:3000/auth-callback?provider=kakao&exchange_code=exchange&returnTo=/dashboard')
        );

        expect(response.status).toBe(307);
        expect(response.headers.get('location')).toBe(
            'http://localhost:3000/login?returnTo=%2Fdashboard&error=broker_failed&provider=kakao'
        );
    });
});
