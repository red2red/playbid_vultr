import { NextRequest } from 'next/server';
import { beforeEach, describe, expect, it, vi } from 'vitest';

const exchangeCodeForSessionMock = vi.fn();
const refreshSessionMock = vi.fn();

vi.mock('@/lib/supabase/server', () => ({
    createClient: async () => ({
        auth: {
            exchangeCodeForSession: exchangeCodeForSessionMock,
            refreshSession: refreshSessionMock,
        },
    }),
}));

import { GET } from './route';

describe('GET /auth-callback', () => {
    beforeEach(() => {
        exchangeCodeForSessionMock.mockReset();
        refreshSessionMock.mockReset();

        exchangeCodeForSessionMock.mockResolvedValue({ error: null });
        refreshSessionMock.mockResolvedValue({ error: null });
    });

    it('invalid returnTo는 /dashboard로 복귀한다', async () => {
        const request = new NextRequest(
            'https://playbid.kr/auth-callback?code=test-code&provider=kakao&returnTo=https://evil.com'
        );

        const response = await GET(request);

        expect(response.headers.get('location')).toBe('https://playbid.kr/dashboard');
    });
});
