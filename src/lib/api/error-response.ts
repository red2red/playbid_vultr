import { NextResponse } from 'next/server';

export interface ApiErrorPayload {
    code: string;
    message: string;
    details?: string;
    suggestion?: string;
    requestId: string;
    timestamp: string;
}

export interface ApiErrorResponseBody {
    ok: false;
    code: string;
    message: string;
    error: ApiErrorPayload;
}

interface ApiErrorResponseOptions {
    status: number;
    code: string;
    message: string;
    details?: string;
    suggestion?: string;
    requestId?: string;
    cause?: unknown;
    context?: Record<string, unknown>;
}

const DEFAULT_SUGGESTION = '잠시 후 다시 시도해 주세요.';

const SUGGESTION_BY_CODE: Record<string, string> = {
    AUTH_REQUIRED: '로그인 후 다시 시도해 주세요.',
    AUTH_SESSION_EXPIRED: '세션이 만료되었습니다. 다시 로그인해 주세요.',
    AUTH_REFRESH_FAILED: '세션 갱신에 실패했습니다. 다시 로그인해 주세요.',
    AUTH_FORBIDDEN: '접근 권한이 없습니다. 관리자에게 문의해 주세요.',
    INVALID_REQUEST: '입력값을 확인한 뒤 다시 시도해 주세요.',
    FEATURE_UNAVAILABLE: '기능이 준비된 뒤 다시 시도해 주세요.',
    INTERNAL_ERROR: '일시적인 오류일 수 있습니다. 잠시 후 다시 시도해 주세요.',
};

function createRequestId(): string {
    if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
        return crypto.randomUUID();
    }
    return `req_${Date.now()}_${Math.random().toString(36).slice(2, 10)}`;
}

function resolveSuggestion(code: string, suggestion?: string): string {
    return suggestion ?? SUGGESTION_BY_CODE[code] ?? DEFAULT_SUGGESTION;
}

function summarizeCause(cause: unknown): Record<string, string> | undefined {
    if (cause instanceof Error) {
        return {
            type: cause.name || 'Error',
        };
    }
    if (typeof cause === 'string' && cause.length > 0) {
        return {
            type: 'ErrorString',
        };
    }
    if (cause && typeof cause === 'object') {
        return {
            type: 'ErrorObject',
        };
    }
    return undefined;
}

export function createApiErrorResponse(options: ApiErrorResponseOptions): NextResponse<ApiErrorResponseBody> {
    const requestId = options.requestId ?? createRequestId();
    const timestamp = new Date().toISOString();

    const payload: ApiErrorPayload = {
        code: options.code,
        message: options.message,
        requestId,
        timestamp,
        suggestion: resolveSuggestion(options.code, options.suggestion),
    };

    if (options.details) {
        payload.details = options.details;
    }

    const body: ApiErrorResponseBody = {
        ok: false,
        code: options.code,
        message: options.message,
        error: payload,
    };

    const logBase = {
        requestId,
        status: options.status,
        code: options.code,
        message: options.message,
        suggestion: payload.suggestion,
        ...(options.details ? { details: options.details } : {}),
        ...(options.context ? { context: options.context } : {}),
        ...(options.cause ? { cause: summarizeCause(options.cause) } : {}),
    };

    if (options.status >= 500) {
        console.error('[API_ERROR]', logBase);
    } else {
        console.warn('[API_ERROR]', logBase);
    }

    return NextResponse.json(body, {
        status: options.status,
        headers: {
            'x-request-id': requestId,
        },
    });
}
