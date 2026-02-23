import { NextRequest } from 'next/server';

vi.mock('@/lib/bid/qualification-calculation-service', () => {
    class MockQualificationCalculationAuthError extends Error {
        constructor(message = '로그인이 필요합니다.') {
            super(message);
            this.name = 'QualificationCalculationAuthError';
        }
    }

    class MockQualificationCalculationUnavailableError extends Error {
        constructor(message = '적격심사 계산 저장 기능을 사용할 수 없습니다.') {
            super(message);
            this.name = 'QualificationCalculationUnavailableError';
        }
    }

    return {
        QualificationCalculationAuthError: MockQualificationCalculationAuthError,
        QualificationCalculationUnavailableError: MockQualificationCalculationUnavailableError,
        listQualificationCalculationsForCurrentUser: vi.fn(),
        saveQualificationCalculationForCurrentUser: vi.fn(),
    };
});

import { GET, POST } from './route';
import {
    listQualificationCalculationsForCurrentUser,
    QualificationCalculationAuthError,
    QualificationCalculationUnavailableError,
    saveQualificationCalculationForCurrentUser,
} from '@/lib/bid/qualification-calculation-service';

const listMock = vi.mocked(listQualificationCalculationsForCurrentUser);
const saveMock = vi.mocked(saveQualificationCalculationForCurrentUser);

const samplePayload = {
    noticeId: 'n-1',
    noticeNumber: '2026-001',
    category: 'construction' as const,
    reviewMasterId: 'rule-1',
    input: {
        category: 'construction',
        customLowerLimit: 87.745,
        baseAmount: 100000000,
        aValue: 1000000,
        performanceAmount: 150000000,
        creditRatingScore: 19,
        techScore: 0,
        disqualificationScore: 0,
        signalFlags: {
            womanEnterprise: false,
            disabledEnterprise: false,
            socialEnterprise: false,
            jobCreation: false,
            smallEnterprise: false,
        },
        selectedRuleConfig: null,
    },
    result: {
        status: 'success' as const,
        message: 'ok',
        capabilityScore: 25,
        signalScore: 0,
        requiredPriceScore: 60,
        effectiveLowerLimit: 87.745,
        priceMaxScore: 70,
        passingScore: 85,
        finalBidRate: 87.745,
        rawOptimalBidRate: 87.1,
        targetAmount: 87500000,
        totalScoreAtLowerLimit: 86,
        priceScoreAtLowerLimit: 61,
        priceCoefFactor: 4,
    },
};

function makeRequest(payload: unknown): NextRequest {
    return new NextRequest('http://localhost/api/qualification-calculations', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
    });
}

describe('GET /api/qualification-calculations', () => {
    beforeEach(() => {
        listMock.mockReset();
    });

    it('인증 오류 시 401을 반환한다', async () => {
        listMock.mockRejectedValueOnce(new QualificationCalculationAuthError());

        const response = await GET();
        const payload = (await response.json()) as { error: { code: string; requestId: string } };

        expect(response.status).toBe(401);
        expect(payload.error.code).toBe('AUTH_REQUIRED');
        expect(payload.error.requestId.length).toBeGreaterThan(0);
    });

    it('기능 미지원 시 503을 반환한다', async () => {
        listMock.mockRejectedValueOnce(new QualificationCalculationUnavailableError());

        const response = await GET();
        const payload = (await response.json()) as { error: { code: string } };

        expect(response.status).toBe(503);
        expect(payload.error.code).toBe('FEATURE_UNAVAILABLE');
    });

    it('성공 시 저장 이력을 반환한다', async () => {
        listMock.mockResolvedValueOnce([
            {
                id: 'h-1',
                createdAt: '2026-02-23T10:00:00.000Z',
                noticeName: '공사 입찰',
                noticeNumber: '2026-001',
                finalBidRate: 87.745,
                targetAmount: 87500000,
                status: 'success',
                message: 'ok',
            },
        ]);

        const response = await GET();
        const payload = (await response.json()) as { ok: boolean; history: unknown[] };

        expect(response.status).toBe(200);
        expect(payload.ok).toBe(true);
        expect(payload.history).toHaveLength(1);
    });
});

describe('POST /api/qualification-calculations', () => {
    beforeEach(() => {
        saveMock.mockReset();
    });

    it('잘못된 요청 본문이면 400을 반환한다', async () => {
        const response = await POST(makeRequest({ category: 'construction' }));
        const payload = (await response.json()) as { error: { code: string } };

        expect(response.status).toBe(400);
        expect(payload.error.code).toBe('INVALID_REQUEST');
    });

    it('인증 오류 시 401을 반환한다', async () => {
        saveMock.mockRejectedValueOnce(new QualificationCalculationAuthError());

        const response = await POST(makeRequest(samplePayload));
        const payload = (await response.json()) as { error: { code: string } };

        expect(response.status).toBe(401);
        expect(payload.error.code).toBe('AUTH_REQUIRED');
    });

    it('성공 시 저장 정보를 반환한다', async () => {
        saveMock.mockResolvedValueOnce({
            id: 'saved-1',
            createdAt: '2026-02-23T10:05:00.000Z',
        });

        const response = await POST(makeRequest(samplePayload));
        const payload = (await response.json()) as {
            ok: boolean;
            saved: { id: string; createdAt: string };
        };

        expect(response.status).toBe(200);
        expect(payload.ok).toBe(true);
        expect(payload.saved.id).toBe('saved-1');
        expect(saveMock).toHaveBeenCalledWith(samplePayload);
    });
});
