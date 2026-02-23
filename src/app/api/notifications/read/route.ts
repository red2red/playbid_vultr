import { NextRequest, NextResponse } from 'next/server';
import {
    markNotificationsReadForCurrentUser,
    NotificationAuthError,
} from '@/lib/bid/notification-service';
import { createApiErrorResponse } from '@/lib/api/error-response';

interface MarkReadBody {
    notificationId?: string;
    notificationIds?: string[];
}

function normalizeIds(body: MarkReadBody): string[] {
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
        const body = (await request.json()) as MarkReadBody;
        const notificationIds = normalizeIds(body);

        if (notificationIds.length === 0) {
            return createApiErrorResponse({
                status: 400,
                code: 'INVALID_REQUEST',
                message: 'notificationId 또는 notificationIds가 필요합니다.',
            });
        }

        const result = await markNotificationsReadForCurrentUser(notificationIds);

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
            code: 'NOTIFICATION_READ_FAILED',
            message: '알림 읽음 처리 중 오류가 발생했습니다.',
            cause: error,
        });
    }
}
