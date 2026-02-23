import { NextRequest } from 'next/server';

vi.mock('@/lib/bid/bookmark-service', () => {
    class MockBookmarkAuthError extends Error {
        constructor(message = '로그인이 필요합니다.') {
            super(message);
            this.name = 'BookmarkAuthError';
        }
    }

    return {
        BookmarkAuthError: MockBookmarkAuthError,
        toggleBookmarkForCurrentUser: vi.fn(),
    };
});

import { POST } from './route';
import {
    BookmarkAuthError,
    toggleBookmarkForCurrentUser,
} from '@/lib/bid/bookmark-service';

const toggleBookmarkMock = vi.mocked(toggleBookmarkForCurrentUser);

function makeRequest(payload: unknown): NextRequest {
    return new NextRequest('http://localhost/api/bookmarks/toggle', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
    });
}

describe('POST /api/bookmarks/toggle', () => {
    beforeEach(() => {
        toggleBookmarkMock.mockReset();
    });

    it('noticeId 누락 시 400을 반환한다', async () => {
        const response = await POST(makeRequest({ noticeNumber: '2026-01' }));
        const payload = (await response.json()) as { error: { code: string; requestId: string } };

        expect(response.status).toBe(400);
        expect(payload.error.code).toBe('INVALID_REQUEST');
        expect(payload.error.requestId.length).toBeGreaterThan(0);
    });

    it('인증 오류 시 401을 반환한다', async () => {
        toggleBookmarkMock.mockRejectedValueOnce(new BookmarkAuthError());

        const response = await POST(makeRequest({ noticeId: 'notice-1' }));
        const payload = (await response.json()) as { error: { code: string } };

        expect(response.status).toBe(401);
        expect(payload.error.code).toBe('AUTH_REQUIRED');
    });

    it('성공 시 북마크 상태를 반환한다', async () => {
        toggleBookmarkMock.mockResolvedValueOnce({ isBookmarked: true });

        const response = await POST(
            makeRequest({ noticeId: 'notice-1', noticeNumber: '2026-0001' })
        );
        const payload = (await response.json()) as {
            ok: boolean;
            isBookmarked: boolean;
        };

        expect(response.status).toBe(200);
        expect(payload).toEqual({ ok: true, isBookmarked: true });
        expect(toggleBookmarkMock).toHaveBeenCalledWith({
            noticeId: 'notice-1',
            noticeNumber: '2026-0001',
        });
    });
});
