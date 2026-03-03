import { NextRequest, NextResponse } from 'next/server';
import { createApiErrorResponse } from '@/lib/api/error-response';
import {
    LearningAuthError,
    LearningUnavailableError,
    saveLearningQuizProgressForCurrentUser,
} from '@/lib/bid/learning-service';
import type { SaveLearningQuizProgressInput } from '@/lib/bid/learning-types';
import {
    completeChallengeMissionForCurrentUser,
    getDailyMissionsForCurrentUser,
} from '@/lib/bid/challenge-service';

function asRecord(value: unknown): Record<string, unknown> | null {
    if (!value || typeof value !== 'object' || Array.isArray(value)) {
        return null;
    }
    return value as Record<string, unknown>;
}

function asString(value: unknown): string | null {
    if (typeof value !== 'string') {
        return null;
    }
    const trimmed = value.trim();
    return trimmed.length > 0 ? trimmed : null;
}

function asBoolean(value: unknown): boolean | null {
    if (typeof value === 'boolean') {
        return value;
    }
    if (typeof value === 'number') {
        return value !== 0;
    }
    if (typeof value === 'string') {
        const normalized = value.toLowerCase().trim();
        if (normalized === 'true' || normalized === '1' || normalized === 'yes' || normalized === 'on') {
            return true;
        }
        if (normalized === 'false' || normalized === '0' || normalized === 'no' || normalized === 'off') {
            return false;
        }
    }
    return null;
}

function asNumber(value: unknown): number | null {
    if (typeof value === 'number' && Number.isFinite(value)) {
        return value;
    }
    if (typeof value === 'string') {
        const parsed = Number(value);
        if (Number.isFinite(parsed)) {
            return parsed;
        }
    }
    return null;
}

function normalizePayload(body: unknown): SaveLearningQuizProgressInput | null {
    const record = asRecord(body);
    if (!record) {
        return null;
    }

    const source = asRecord(record.payload) ?? record;
    const quizId = asString(source.quizId);
    const isCorrect = asBoolean(source.isCorrect);
    const earnedXpRaw = asNumber(source.earnedXp);

    if (!quizId || isCorrect === null || earnedXpRaw === null) {
        return null;
    }

    return {
        quizId,
        selectedAnswer: asString(source.selectedAnswer),
        isCorrect,
        earnedXp: Math.max(0, Math.floor(earnedXpRaw)),
    };
}

async function tryUpdateLearningMissionProgress(): Promise<boolean> {
    try {
        const missions = await getDailyMissionsForCurrentUser(100);
        const targetMission = missions.find(
            (mission) => mission.category === 'learning' && !mission.isCompleted
        );

        if (!targetMission) {
            return false;
        }

        await completeChallengeMissionForCurrentUser({
            missionId: targetMission.id,
            increment: 1,
        });

        return true;
    } catch {
        return false;
    }
}

function handleServiceError(error: unknown) {
    if (error instanceof LearningAuthError) {
        return createApiErrorResponse({
            status: 401,
            code: 'AUTH_REQUIRED',
            message: error.message,
        });
    }

    if (error instanceof LearningUnavailableError) {
        return createApiErrorResponse({
            status: 503,
            code: 'FEATURE_UNAVAILABLE',
            message: error.message,
        });
    }

    return createApiErrorResponse({
        status: 500,
        code: 'LEARNING_QUIZ_SUBMIT_FAILED',
        message: '퀴즈 제출 처리 중 오류가 발생했습니다.',
        cause: error,
    });
}

export async function POST(request: NextRequest) {
    try {
        const body = await request.json();
        const payload = normalizePayload(body);

        if (!payload) {
            return createApiErrorResponse({
                status: 400,
                code: 'INVALID_REQUEST',
                message: '퀴즈 제출에 필요한 요청 본문이 올바르지 않습니다.',
            });
        }

        const progress = await saveLearningQuizProgressForCurrentUser(payload);
        const missionUpdated = await tryUpdateLearningMissionProgress();

        return NextResponse.json({
            ok: true,
            progress,
            missionUpdated,
        });
    } catch (error) {
        return handleServiceError(error);
    }
}
