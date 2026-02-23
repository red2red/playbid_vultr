import { NextRequest, NextResponse } from 'next/server';
import {
    executePaidFeatureForCurrentUser,
    type ExecutePaidFeatureInput,
    type PaidFeatureType,
    type PaidPricingMode,
    PaidFeatureError,
} from '@/lib/bid/paid-feature-service';
import { createApiErrorResponse } from '@/lib/api/error-response';

interface ExecutePaidFeatureRequestBody {
    feature_type?: unknown;
    target_id?: unknown;
    pricing_mode?: unknown;
    idempotency_key?: unknown;
    request_meta?: unknown;
    input_params?: unknown;
}

function asRecord(value: unknown): Record<string, unknown> | null {
    if (!value || typeof value !== 'object' || Array.isArray(value)) {
        return null;
    }
    return value as Record<string, unknown>;
}

function asString(value: unknown): string | null {
    if (typeof value === 'string') {
        const trimmed = value.trim();
        return trimmed.length > 0 ? trimmed : null;
    }
    return null;
}

function normalizeFeatureType(value: unknown): PaidFeatureType | null {
    if (
        value === 'ai_report' ||
        value === 'participant_stats' ||
        value === 'similar_rate_stats' ||
        value === 'qualification_calc'
    ) {
        return value;
    }
    return null;
}

function normalizePricingMode(value: unknown): PaidPricingMode | null {
    if (value === 'subscription' || value === 'points') {
        return value;
    }
    return null;
}

function normalizeInput(body: ExecutePaidFeatureRequestBody): ExecutePaidFeatureInput | null {
    const featureType = normalizeFeatureType(body.feature_type);
    const targetId = asString(body.target_id);
    const pricingMode = normalizePricingMode(body.pricing_mode);
    const idempotencyKey = asString(body.idempotency_key);
    const requestMeta = asRecord(body.request_meta) ?? {};
    const inputParams = asRecord(body.input_params) ?? {};

    if (!featureType || !targetId || !pricingMode || !idempotencyKey) {
        return null;
    }

    return {
        featureType,
        targetId,
        pricingMode,
        idempotencyKey,
        requestMeta,
        inputParams,
    };
}

function handleError(error: unknown) {
    if (error instanceof PaidFeatureError) {
        return createApiErrorResponse({
            status: error.status,
            code: error.code,
            message: error.message,
        });
    }

    return createApiErrorResponse({
        status: 500,
        code: 'INTERNAL_ERROR',
        message: '유료 기능 실행 중 알 수 없는 오류가 발생했습니다.',
        cause: error,
    });
}

export async function POST(request: NextRequest) {
    try {
        const body = (await request.json()) as ExecutePaidFeatureRequestBody;
        const input = normalizeInput(body);

        if (!input) {
            return createApiErrorResponse({
                status: 400,
                code: 'INVALID_REQUEST',
                message: 'feature_type, target_id, pricing_mode, idempotency_key는 필수입니다.',
            });
        }

        const result = await executePaidFeatureForCurrentUser(input);

        return NextResponse.json({
            ok: true,
            execution_id: result.executionId,
            billing_result: {
                mode: result.billingResult.mode,
                consumed_units: result.billingResult.consumedUnits,
                consumed_points: result.billingResult.consumedPoints,
            },
            remaining_balance: {
                subscription_units: result.remainingBalance.subscriptionUnits,
                points: result.remainingBalance.points,
            },
            result_ref: result.resultRef,
            error_code: result.errorCode,
        });
    } catch (error) {
        return handleError(error);
    }
}
