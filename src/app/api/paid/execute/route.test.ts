import { NextRequest } from 'next/server';

vi.mock('@/lib/bid/paid-feature-service', () => {
    class MockPaidFeatureError extends Error {
        readonly code: string;
        readonly status: number;

        constructor(code: string, status: number, message: string) {
            super(message);
            this.code = code;
            this.status = status;
            this.name = 'PaidFeatureError';
        }
    }

    class MockPaidFeatureAuthError extends MockPaidFeatureError {
        constructor(message = '로그인이 필요합니다.') {
            super('AUTH_REQUIRED', 401, message);
            this.name = 'PaidFeatureAuthError';
        }
    }

    return {
        executePaidFeatureForCurrentUser: vi.fn(),
        PaidFeatureError: MockPaidFeatureError,
        PaidFeatureAuthError: MockPaidFeatureAuthError,
    };
});

import { POST } from './route';
import { executePaidFeatureForCurrentUser, PaidFeatureError } from '@/lib/bid/paid-feature-service';

const executeMock = vi.mocked(executePaidFeatureForCurrentUser);

function makeRequest(payload: unknown): NextRequest {
    return new NextRequest('http://localhost/api/paid/execute', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
    });
}

describe('POST /api/paid/execute', () => {
    beforeEach(() => {
        executeMock.mockReset();
    });

    it('필수 필드 누락 시 400을 반환한다', async () => {
        const response = await POST(
            makeRequest({
                feature_type: 'ai_report',
            })
        );

        const payload = (await response.json()) as { error: { code: string; requestId: string } };

        expect(response.status).toBe(400);
        expect(payload.error.code).toBe('INVALID_REQUEST');
        expect(payload.error.requestId.length).toBeGreaterThan(0);
    });

    it('서비스 에러 코드를 그대로 반환한다', async () => {
        executeMock.mockRejectedValueOnce(
            new PaidFeatureError('INSUFFICIENT_POINTS', 402, '포인트가 부족합니다.')
        );

        const response = await POST(
            makeRequest({
                feature_type: 'ai_report',
                target_id: 'notice-1',
                pricing_mode: 'points',
                idempotency_key: 'idem-1',
                request_meta: {},
                input_params: {},
            })
        );

        const payload = (await response.json()) as { error: { code: string } };

        expect(response.status).toBe(402);
        expect(payload.error.code).toBe('INSUFFICIENT_POINTS');
    });

    it('성공 시 계약 형태로 응답한다', async () => {
        executeMock.mockResolvedValueOnce({
            executionId: 'exec-1',
            billingResult: {
                mode: 'subscription',
                consumedUnits: 1,
                consumedPoints: 0,
            },
            remainingBalance: {
                subscriptionUnits: 7,
                points: 1500,
            },
            resultRef: 'ai_reports:abc',
            errorCode: null,
        });

        const response = await POST(
            makeRequest({
                feature_type: 'ai_report',
                target_id: 'notice-1',
                pricing_mode: 'subscription',
                idempotency_key: 'idem-2',
                request_meta: {
                    bid_ntce_no: '2026001',
                },
                input_params: {
                    locale: 'ko',
                },
            })
        );

        const payload = (await response.json()) as {
            ok: boolean;
            execution_id: string;
            billing_result: {
                mode: string;
                consumed_units: number;
                consumed_points: number;
            };
            remaining_balance: {
                subscription_units: number;
                points: number;
            };
            result_ref: string;
            error_code: null;
        };

        expect(response.status).toBe(200);
        expect(payload.ok).toBe(true);
        expect(payload.execution_id).toBe('exec-1');
        expect(payload.billing_result.mode).toBe('subscription');
        expect(payload.remaining_balance.subscription_units).toBe(7);
        expect(payload.result_ref).toBe('ai_reports:abc');
        expect(executeMock).toHaveBeenCalledWith({
            featureType: 'ai_report',
            targetId: 'notice-1',
            pricingMode: 'subscription',
            idempotencyKey: 'idem-2',
            requestMeta: {
                bid_ntce_no: '2026001',
            },
            inputParams: {
                locale: 'ko',
            },
        });
    });
});
