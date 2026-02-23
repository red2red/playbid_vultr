import { NextRequest, NextResponse } from 'next/server';
import {
    getNotificationPreferencesForCurrentUser,
    NotificationPreferenceAuthError,
    NotificationPreferenceUnavailableError,
    updateNotificationPreferencesForCurrentUser,
} from '@/lib/bid/notification-preference-service';
import type { NotificationPreferencesUpdateInput } from '@/lib/bid/profile-types';
import { createApiErrorResponse } from '@/lib/api/error-response';

function asRecord(value: unknown): Record<string, unknown> | null {
    if (!value || typeof value !== 'object' || Array.isArray(value)) {
        return null;
    }
    return value as Record<string, unknown>;
}

function normalizePayload(body: unknown): NotificationPreferencesUpdateInput | null {
    const record = asRecord(body);
    if (!record) {
        return null;
    }

    const nested = asRecord(record.preferences);
    const source = nested ?? record;

    const payload: NotificationPreferencesUpdateInput = {};

    if (typeof source.pushEnabled === 'boolean') payload.pushEnabled = source.pushEnabled;
    if (typeof source.bidNew === 'boolean') payload.bidNew = source.bidNew;
    if (typeof source.bidDeadline === 'boolean') payload.bidDeadline = source.bidDeadline;
    if (typeof source.bidDeadlineOption === 'string') payload.bidDeadlineOption = source.bidDeadlineOption;
    if (typeof source.bidResult === 'boolean') payload.bidResult = source.bidResult;
    if (typeof source.aiAnalysis === 'boolean') payload.aiAnalysis = source.aiAnalysis;
    if (typeof source.levelUp === 'boolean') payload.levelUp = source.levelUp;
    if (typeof source.badge === 'boolean') payload.badge = source.badge;
    if (typeof source.dailyMission === 'boolean') payload.dailyMission = source.dailyMission;
    if (typeof source.rankingChange === 'boolean') payload.rankingChange = source.rankingChange;
    if (typeof source.promotion === 'boolean') payload.promotion = source.promotion;
    if (typeof source.appUpdate === 'boolean') payload.appUpdate = source.appUpdate;
    if (typeof source.quietHoursEnabled === 'boolean') payload.quietHoursEnabled = source.quietHoursEnabled;
    if (typeof source.quietHoursStart === 'string') payload.quietHoursStart = source.quietHoursStart;
    if (typeof source.quietHoursEnd === 'string') payload.quietHoursEnd = source.quietHoursEnd;
    if (typeof source.weekendEnabled === 'boolean') payload.weekendEnabled = source.weekendEnabled;

    return payload;
}

function handleServiceError(error: unknown): NextResponse {
    if (error instanceof NotificationPreferenceAuthError) {
        return createApiErrorResponse({
            status: 401,
            code: 'AUTH_REQUIRED',
            message: error.message,
        });
    }

    if (error instanceof NotificationPreferenceUnavailableError) {
        return createApiErrorResponse({
            status: 503,
            code: 'FEATURE_UNAVAILABLE',
            message: error.message,
        });
    }

    return createApiErrorResponse({
        status: 500,
        code: 'NOTIFICATION_PREFERENCES_FAILED',
        message: '알림 설정 처리 중 오류가 발생했습니다.',
        cause: error,
    });
}

export async function GET() {
    try {
        const preferences = await getNotificationPreferencesForCurrentUser();

        return NextResponse.json({
            ok: true,
            preferences,
        });
    } catch (error) {
        return handleServiceError(error);
    }
}

export async function POST(request: NextRequest) {
    try {
        const body = await request.json();
        const payload = normalizePayload(body);

        if (!payload) {
            return createApiErrorResponse({
                status: 400,
                code: 'INVALID_REQUEST',
                message: '유효한 요청 본문이 필요합니다.',
            });
        }

        const preferences = await updateNotificationPreferencesForCurrentUser(payload);

        return NextResponse.json({
            ok: true,
            preferences,
        });
    } catch (error) {
        return handleServiceError(error);
    }
}
