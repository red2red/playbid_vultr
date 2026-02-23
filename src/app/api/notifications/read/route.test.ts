import { NextRequest } from 'next/server';

vi.mock('@/lib/bid/notification-service', () => {
    class MockNotificationAuthError extends Error {
        constructor(message = '로그인이 필요합니다.') {
            super(message);
            this.name = 'NotificationAuthError';
        }
    }

    return {
        NotificationAuthError: MockNotificationAuthError,
        markNotificationsReadForCurrentUser: vi.fn(),
    };
});

import { POST } from './route';
import {
    markNotificationsReadForCurrentUser,
    NotificationAuthError,
} from '@/lib/bid/notification-service';

const markNotificationsReadMock = vi.mocked(markNotificationsReadForCurrentUser);

function makeRequest(payload: unknown): NextRequest {
    return new NextRequest('http://localhost/api/notifications/read', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
    });
}

describe('POST /api/notifications/read', () => {
    beforeEach(() => {
        markNotificationsReadMock.mockReset();
    });

    it('notificationId 누락 시 400을 반환한다', async () => {
        const response = await POST(makeRequest({}));
        const payload = (await response.json()) as { error: { code: string; requestId: string } };

        expect(response.status).toBe(400);
        expect(payload.error.code).toBe('INVALID_REQUEST');
        expect(payload.error.requestId.length).toBeGreaterThan(0);
    });

    it('인증 오류 시 401을 반환한다', async () => {
        markNotificationsReadMock.mockRejectedValueOnce(new NotificationAuthError());

        const response = await POST(makeRequest({ notificationId: 'noti-1' }));
        const payload = (await response.json()) as { error: { code: string } };

        expect(response.status).toBe(401);
        expect(payload.error.code).toBe('AUTH_REQUIRED');
    });

    it('성공 시 갱신 건수와 미읽음 수를 반환한다', async () => {
        markNotificationsReadMock.mockResolvedValueOnce({
            updatedCount: 2,
            unreadCount: 7,
        });

        const response = await POST(
            makeRequest({
                notificationIds: ['noti-1', 'noti-2'],
            })
        );
        const payload = (await response.json()) as {
            ok: boolean;
            updatedCount: number;
            unreadCount: number;
        };

        expect(response.status).toBe(200);
        expect(payload).toEqual({ ok: true, updatedCount: 2, unreadCount: 7 });
        expect(markNotificationsReadMock).toHaveBeenCalledWith(['noti-1', 'noti-2']);
    });
});
