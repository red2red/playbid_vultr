import { NextResponse } from 'next/server';
import {
    getUnreadNotificationCountForCurrentUser,
    NotificationAuthError,
} from '@/lib/bid/notification-service';
import { createApiErrorResponse } from '@/lib/api/error-response';

export async function GET() {
    try {
        const result = await getUnreadNotificationCountForCurrentUser();

        return NextResponse.json({
            ok: true,
            unreadCount: result.unreadCount,
        });
    } catch (error) {
        if (error instanceof NotificationAuthError) {
            return createApiErrorResponse({
                status: 401,
                code: 'AUTH_REQUIRED',
                message: error.message,
            });
        }

        return createApiErrorResponse({
            status: 500,
            code: 'NOTIFICATION_UNREAD_COUNT_FAILED',
            message: '미읽음 알림 수 조회 중 오류가 발생했습니다.',
            cause: error,
        });
    }
}
