vi.mock('@/lib/bid/notification-service', () => {
    class MockNotificationAuthError extends Error {
        constructor(message = '로그인이 필요합니다.') {
            super(message);
            this.name = 'NotificationAuthError';
        }
    }

    return {
        NotificationAuthError: MockNotificationAuthError,
        getUnreadNotificationCountForCurrentUser: vi.fn(),
    };
});

import { GET } from './route';
import {
    getUnreadNotificationCountForCurrentUser,
    NotificationAuthError,
} from '@/lib/bid/notification-service';

const getUnreadCountMock = vi.mocked(getUnreadNotificationCountForCurrentUser);

describe('GET /api/notifications/unread-count', () => {
    beforeEach(() => {
        getUnreadCountMock.mockReset();
    });

    it('인증 오류 시 401을 반환한다', async () => {
        getUnreadCountMock.mockRejectedValueOnce(new NotificationAuthError());

        const response = await GET();
        const payload = (await response.json()) as { error: { code: string; requestId: string } };

        expect(response.status).toBe(401);
        expect(payload.error.code).toBe('AUTH_REQUIRED');
        expect(payload.error.requestId.length).toBeGreaterThan(0);
    });

    it('성공 시 미읽음 수를 반환한다', async () => {
        getUnreadCountMock.mockResolvedValueOnce({ unreadCount: 5 });

        const response = await GET();
        const payload = (await response.json()) as {
            ok: boolean;
            unreadCount: number;
        };

        expect(response.status).toBe(200);
        expect(payload).toEqual({ ok: true, unreadCount: 5 });
    });
});
