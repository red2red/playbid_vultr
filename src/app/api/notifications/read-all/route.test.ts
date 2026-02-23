vi.mock('@/lib/bid/notification-service', () => {
    class MockNotificationAuthError extends Error {
        constructor(message = '로그인이 필요합니다.') {
            super(message);
            this.name = 'NotificationAuthError';
        }
    }

    return {
        NotificationAuthError: MockNotificationAuthError,
        markAllNotificationsReadForCurrentUser: vi.fn(),
    };
});

import { POST } from './route';
import {
    markAllNotificationsReadForCurrentUser,
    NotificationAuthError,
} from '@/lib/bid/notification-service';

const markAllReadMock = vi.mocked(markAllNotificationsReadForCurrentUser);

describe('POST /api/notifications/read-all', () => {
    beforeEach(() => {
        markAllReadMock.mockReset();
    });

    it('인증 오류 시 401을 반환한다', async () => {
        markAllReadMock.mockRejectedValueOnce(new NotificationAuthError());

        const response = await POST();
        const payload = (await response.json()) as { error: { code: string; requestId: string } };

        expect(response.status).toBe(401);
        expect(payload.error.code).toBe('AUTH_REQUIRED');
        expect(payload.error.requestId.length).toBeGreaterThan(0);
    });

    it('성공 시 갱신 건수와 미읽음 수를 반환한다', async () => {
        markAllReadMock.mockResolvedValueOnce({
            updatedCount: 9,
            unreadCount: 0,
        });

        const response = await POST();
        const payload = (await response.json()) as {
            ok: boolean;
            updatedCount: number;
            unreadCount: number;
        };

        expect(response.status).toBe(200);
        expect(payload).toEqual({ ok: true, updatedCount: 9, unreadCount: 0 });
    });
});
