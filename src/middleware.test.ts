import { NextRequest } from 'next/server';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { createServerClient } from '@supabase/ssr';
import { middleware } from './middleware';

vi.mock('@supabase/ssr', () => ({
    createServerClient: vi.fn(),
}));

const createServerClientMock = vi.mocked(createServerClient);

function createAuthClient(user: { email?: string } | null = null) {
    return {
        auth: {
            getUser: vi.fn().mockResolvedValue({
                data: {
                    user,
                },
            }),
        },
    };
}

describe('middleware auth enforcement', () => {
    beforeEach(() => {
        vi.clearAllMocks();

        process.env.NEXT_PUBLIC_SUPABASE_URL = 'https://playbid.supabase.co';
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY = 'anon-key';
        delete process.env.ADMIN_ALLOWED_EMAILS;

        createServerClientMock.mockReturnValue(createAuthClient(null) as never);
    });

    it('비로그인 사용자가 보호 페이지 접근 시 로그인으로 리다이렉트한다', async () => {
        const request = new NextRequest('https://playbid.kr/challenge/ranking?tab=weekly');

        const response = await middleware(request);

        expect(response.status).toBe(307);
        expect(response.headers.get('location')).toBe(
            'https://playbid.kr/login?returnTo=%2Fchallenge%2Franking%3Ftab%3Dweekly'
        );
    });

    it('비로그인 사용자가 보호 API 접근 시 401 JSON 응답을 반환한다', async () => {
        const request = new NextRequest('https://playbid.kr/api/bookmarks/toggle');

        const response = await middleware(request);
        const payload = (await response.json()) as {
            code: string;
            error: {
                code: string;
            };
        };

        expect(response.status).toBe(401);
        expect(payload.code).toBe('AUTH_REQUIRED');
        expect(payload.error.code).toBe('AUTH_REQUIRED');
    });

    it('공개 페이지는 비로그인 상태에서도 통과한다', async () => {
        const request = new NextRequest('https://playbid.kr/bid_notice');

        const response = await middleware(request);

        expect(response.status).toBe(200);
        expect(response.headers.get('location')).toBeNull();
    });
});
