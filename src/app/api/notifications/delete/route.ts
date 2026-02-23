import { NextRequest, NextResponse } from 'next/server';
import {
    NotificationAuthError,
    softDeleteNotificationsForCurrentUser,
} from '@/lib/bid/notification-service';
import { createApiErrorResponse } from '@/lib/api/error-response';

interface DeleteBody {
    notificationId?: string;
    notificationIds?: string[];
}

function normalizeIds(body: DeleteBody): string[] {
    const ids: string[] = [];

    if (typeof body.notificationId === 'string') {
        ids.push(body.notificationId);
    }

    if (Array.isArray(body.notificationIds)) {
        ids.push(...body.notificationIds);
    }

    return [...new Set(ids.map((id) => id.trim()).filter(Boolean))];
}

export async function POST(request: NextRequest) {
    try {
        const body = (await request.json()) as DeleteBody;
        const notificationIds = normalizeIds(body);

        if (notificationIds.length === 0) {
            return createApiErrorResponse({
                status: 400,
                code: 'INVALID_REQUEST',
                message: 'notificationId 또는 notificationIds가 필요합니다.',
            });
        }

        const result = await softDeleteNotificationsForCurrentUser(notificationIds);

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
            code: 'NOTIFICATION_DELETE_FAILED',
            message: '알림 삭제 중 오류가 발생했습니다.',
            cause: error,
        });
    }
}
