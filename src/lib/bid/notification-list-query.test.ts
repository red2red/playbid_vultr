import { formatRelativeTime, normalizeNotificationType } from './notification-list-query';

describe('notification-list-query helpers', () => {
    it('알림 타입 문자열을 표준 타입으로 정규화한다', () => {
        expect(normalizeNotificationType('bid_deadline')).toBe('deadline');
        expect(normalizeNotificationType('opening_result')).toBe('result');
        expect(normalizeNotificationType('premium_report')).toBe('premium');
        expect(normalizeNotificationType('system_notice')).toBe('system');
        expect(normalizeNotificationType(undefined)).toBe('system');
    });

    it('상대 시각 문자열을 올바르게 생성한다', () => {
        const now = new Date('2026-02-23T12:00:00.000Z');

        expect(formatRelativeTime('2026-02-23T11:59:40.000Z', now)).toBe('방금 전');
        expect(formatRelativeTime('2026-02-23T11:20:00.000Z', now)).toBe('40분 전');
        expect(formatRelativeTime('2026-02-23T08:00:00.000Z', now)).toBe('4시간 전');
        expect(formatRelativeTime('2026-02-20T12:00:00.000Z', now)).toBe('3일 전');
    });

    it('유효하지 않은 시간 입력은 대시 문자열을 반환한다', () => {
        const now = new Date('2026-02-23T12:00:00.000Z');

        expect(formatRelativeTime(undefined, now)).toBe('-');
        expect(formatRelativeTime('invalid-date', now)).toBe('-');
    });
});
