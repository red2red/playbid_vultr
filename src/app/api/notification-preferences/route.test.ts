import { NextRequest } from 'next/server';

vi.mock('@/lib/bid/notification-preference-service', () => {
    class MockNotificationPreferenceAuthError extends Error {
        constructor(message = '로그인이 필요합니다.') {
            super(message);
            this.name = 'NotificationPreferenceAuthError';
        }
    }

    class MockNotificationPreferenceUnavailableError extends Error {
        constructor(message = '알림 설정 기능을 사용할 수 없습니다.') {
            super(message);
            this.name = 'NotificationPreferenceUnavailableError';
        }
    }

    return {
        NotificationPreferenceAuthError: MockNotificationPreferenceAuthError,
        NotificationPreferenceUnavailableError: MockNotificationPreferenceUnavailableError,
        getNotificationPreferencesForCurrentUser: vi.fn(),
        updateNotificationPreferencesForCurrentUser: vi.fn(),
    };
});

import { GET, POST } from './route';
import {
    getNotificationPreferencesForCurrentUser,
    NotificationPreferenceAuthError,
    NotificationPreferenceUnavailableError,
    updateNotificationPreferencesForCurrentUser,
} from '@/lib/bid/notification-preference-service';

const getPreferencesMock = vi.mocked(getNotificationPreferencesForCurrentUser);
const updatePreferencesMock = vi.mocked(updateNotificationPreferencesForCurrentUser);

const samplePreferences = {
    pushEnabled: true,
    bidNew: true,
    bidDeadline: true,
    bidDeadlineOption: 'oneDay',
    bidResult: true,
    aiAnalysis: true,
    levelUp: true,
    badge: true,
    dailyMission: true,
    rankingChange: true,
    promotion: false,
    appUpdate: true,
    quietHoursEnabled: true,
    quietHoursStart: '22:00',
    quietHoursEnd: '08:00',
    weekendEnabled: true,
    hasPreferenceTable: true,
};

function makeRequest(payload: unknown): NextRequest {
    return new NextRequest('http://localhost/api/notification-preferences', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
    });
}

describe('GET /api/notification-preferences', () => {
    beforeEach(() => {
        getPreferencesMock.mockReset();
    });

    it('인증 오류 시 401을 반환한다', async () => {
        getPreferencesMock.mockRejectedValueOnce(new NotificationPreferenceAuthError());

        const response = await GET();
        const payload = (await response.json()) as { error: { code: string; requestId: string } };

        expect(response.status).toBe(401);
        expect(payload.error.code).toBe('AUTH_REQUIRED');
        expect(payload.error.requestId.length).toBeGreaterThan(0);
    });

    it('기능 미지원 시 503을 반환한다', async () => {
        getPreferencesMock.mockRejectedValueOnce(new NotificationPreferenceUnavailableError());

        const response = await GET();
        const payload = (await response.json()) as { error: { code: string } };

        expect(response.status).toBe(503);
        expect(payload.error.code).toBe('FEATURE_UNAVAILABLE');
    });

    it('성공 시 알림 설정을 반환한다', async () => {
        getPreferencesMock.mockResolvedValueOnce(samplePreferences);

        const response = await GET();
        const payload = (await response.json()) as {
            ok: boolean;
            preferences: typeof samplePreferences;
        };

        expect(response.status).toBe(200);
        expect(payload.ok).toBe(true);
        expect(payload.preferences).toEqual(samplePreferences);
    });
});

describe('POST /api/notification-preferences', () => {
    beforeEach(() => {
        updatePreferencesMock.mockReset();
    });

    it('잘못된 요청 본문이면 400을 반환한다', async () => {
        const response = await POST(makeRequest('invalid'));
        const payload = (await response.json()) as { error: { code: string } };

        expect(response.status).toBe(400);
        expect(payload.error.code).toBe('INVALID_REQUEST');
    });

    it('인증 오류 시 401을 반환한다', async () => {
        updatePreferencesMock.mockRejectedValueOnce(new NotificationPreferenceAuthError());

        const response = await POST(makeRequest({ promotion: true }));
        const payload = (await response.json()) as { error: { code: string } };

        expect(response.status).toBe(401);
        expect(payload.error.code).toBe('AUTH_REQUIRED');
    });

    it('성공 시 저장된 설정을 반환한다', async () => {
        updatePreferencesMock.mockResolvedValueOnce({
            ...samplePreferences,
            promotion: true,
        });

        const response = await POST(
            makeRequest({
                preferences: {
                    promotion: true,
                },
            })
        );

        const payload = (await response.json()) as {
            ok: boolean;
            preferences: typeof samplePreferences;
        };

        expect(response.status).toBe(200);
        expect(payload.ok).toBe(true);
        expect(payload.preferences.promotion).toBe(true);
        expect(updatePreferencesMock).toHaveBeenCalledWith({ promotion: true });
    });
});
