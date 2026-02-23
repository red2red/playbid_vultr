import { NextResponse } from 'next/server';
import {
    markAllNotificationsReadForCurrentUser,
    NotificationAuthError,
} from '@/lib/bid/notification-service';
import { createApiErrorResponse } from '@/lib/api/error-response';

export async function POST() {
    try {
        const result = await markAllNotificationsReadForCurrentUser();

        return NextResponse.json({
            ok: true,
            updatedCount: result.updatedCount,
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
            code: 'NOTIFICATION_READ_ALL_FAILED',
            message: '전체 읽음 처리 중 오류가 발생했습니다.',
            cause: error,
        });
    }
}
