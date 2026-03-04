import { fireEvent, render, screen, waitFor } from '@testing-library/react';

const { signInWithOAuthMock, buildOAuthBrokerStartUrlMock } = vi.hoisted(() => ({
    signInWithOAuthMock: vi.fn(),
    buildOAuthBrokerStartUrlMock: vi.fn(),
}));

vi.mock('@/lib/supabase/client', () => ({
    createClient: () => ({
        auth: {
            signInWithOAuth: signInWithOAuthMock,
        },
    }),
}));

vi.mock('@/lib/auth/oauth-broker', () => ({
    buildOAuthBrokerStartUrl: buildOAuthBrokerStartUrlMock,
}));

import { OAuthLoginCard } from './oauth-login-card';

describe('OAuthLoginCard', () => {
    beforeEach(() => {
        signInWithOAuthMock.mockReset();
        buildOAuthBrokerStartUrlMock.mockReset();
        signInWithOAuthMock.mockResolvedValue({
            data: null,
            error: null,
        });
        buildOAuthBrokerStartUrlMock.mockReturnValue('https://api.playbid.kr/functions/v1/naver-oauth');
        process.env.NEXT_PUBLIC_SUPABASE_URL = 'https://api.playbid.kr';
    });

    it('Apple 로그인 버튼은 보류 상태로 비활성화되어 표시된다', () => {
        render(<OAuthLoginCard returnTo="/dashboard" />);

        const button = screen.getByRole('button', { name: 'Apple로 계속하기 (보류)' });
        expect(button).toBeDisabled();
    });

    it('Google 버튼 클릭 시 Supabase OAuth를 호출한다', async () => {
        render(<OAuthLoginCard returnTo="/dashboard" />);

        fireEvent.click(screen.getByRole('button', { name: 'Google로 계속하기' }));

        await waitFor(() => {
            expect(signInWithOAuthMock).toHaveBeenCalledTimes(1);
        });

        expect(signInWithOAuthMock).toHaveBeenCalledWith({
            provider: 'google',
            options: {
                redirectTo: 'http://localhost:3000/auth-callback?returnTo=%2Fdashboard&provider=google',
            },
        });
    });

    it('네이버 버튼 클릭 시 브로커 OAuth 시작 URL로 이동한다', async () => {
        render(<OAuthLoginCard returnTo="/dashboard" />);

        fireEvent.click(screen.getByRole('button', { name: '네이버로 계속하기' }));

        await waitFor(() => {
            expect(buildOAuthBrokerStartUrlMock).toHaveBeenCalledTimes(1);
        });

        expect(buildOAuthBrokerStartUrlMock).toHaveBeenCalledWith({
            supabaseUrl: 'https://api.playbid.kr',
            provider: 'naver',
            webOrigin: 'http://localhost:3000',
            returnTo: '/dashboard',
        });
        expect(signInWithOAuthMock).not.toHaveBeenCalled();
    });

    it('카카오 버튼 클릭 시 브로커 OAuth 시작 URL로 이동한다', async () => {
        render(<OAuthLoginCard returnTo="/dashboard" />);

        fireEvent.click(screen.getByRole('button', { name: '카카오로 계속하기' }));

        await waitFor(() => {
            expect(buildOAuthBrokerStartUrlMock).toHaveBeenCalledTimes(1);
        });

        expect(buildOAuthBrokerStartUrlMock).toHaveBeenCalledWith({
            supabaseUrl: 'https://api.playbid.kr',
            provider: 'kakao',
            webOrigin: 'http://localhost:3000',
            returnTo: '/dashboard',
        });
        expect(signInWithOAuthMock).not.toHaveBeenCalled();
    });
});
