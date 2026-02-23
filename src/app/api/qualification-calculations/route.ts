import { NextRequest, NextResponse } from 'next/server';
import {
    listQualificationCalculationsForCurrentUser,
    QualificationCalculationAuthError,
    QualificationCalculationUnavailableError,
    saveQualificationCalculationForCurrentUser,
} from '@/lib/bid/qualification-calculation-service';
import type {
    QualificationCalculationInput,
    QualificationCalculationResult,
    QualificationCalculationSavePayload,
    QualificationCategory,
} from '@/lib/bid/qualification-calculator-types';
import { createApiErrorResponse } from '@/lib/api/error-response';

function asRecord(value: unknown): Record<string, unknown> | null {
    if (!value || typeof value !== 'object' || Array.isArray(value)) {
        return null;
    }
    return value as Record<string, unknown>;
}

function normalizeCategory(value: unknown): QualificationCategory | null {
    if (value !== 'construction' && value !== 'service' && value !== 'goods') {
        return null;
    }
    return value;
}

function normalizePayload(body: unknown): QualificationCalculationSavePayload | null {
    const record = asRecord(body);
    if (!record) {
        return null;
    }

    const source = asRecord(record.payload) ?? record;
    const category = normalizeCategory(source.category);
    const input = asRecord(source.input);
    const result = asRecord(source.result);

    if (!category || !input || !result) {
        return null;
    }

    return {
        noticeId: typeof source.noticeId === 'string' ? source.noticeId : null,
        noticeNumber: typeof source.noticeNumber === 'string' ? source.noticeNumber : null,
        reviewMasterId: typeof source.reviewMasterId === 'string' ? source.reviewMasterId : null,
        category,
        input: input as unknown as QualificationCalculationInput,
        result: result as unknown as QualificationCalculationResult,
    };
}

function handleServiceError(error: unknown): NextResponse {
    if (error instanceof QualificationCalculationAuthError) {
        return createApiErrorResponse({
            status: 401,
            code: 'AUTH_REQUIRED',
            message: error.message,
        });
    }

    if (error instanceof QualificationCalculationUnavailableError) {
        return createApiErrorResponse({
            status: 503,
            code: 'FEATURE_UNAVAILABLE',
            message: error.message,
        });
    }

    return createApiErrorResponse({
        status: 500,
        code: 'QUALIFICATION_CALCULATION_FAILED',
        message: '적격심사 계산 데이터를 처리하지 못했습니다.',
        cause: error,
    });
}

export async function GET() {
    try {
        const history = await listQualificationCalculationsForCurrentUser();
        return NextResponse.json({
            ok: true,
            history,
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
                message: '유효한 계산 데이터가 필요합니다.',
            });
        }

        const saved = await saveQualificationCalculationForCurrentUser(payload);
        return NextResponse.json({
            ok: true,
            saved,
        });
    } catch (error) {
        return handleServiceError(error);
    }
}
