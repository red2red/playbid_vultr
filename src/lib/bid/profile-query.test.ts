import {
    formatPointAmount,
    normalizePlanKey,
    resolveSubscriptionStatus,
} from './profile-query';

describe('profile-query helpers', () => {
    describe('normalizePlanKey', () => {
        it('플랜 문자열을 표준 키로 정규화한다', () => {
            expect(normalizePlanKey('premium')).toBe('premium');
            expect(normalizePlanKey('Pro')).toBe('premium');
            expect(normalizePlanKey('basic')).toBe('basic');
            expect(normalizePlanKey('trial-plan')).toBe('trial');
            expect(normalizePlanKey('free')).toBe('free');
            expect(normalizePlanKey(undefined)).toBe('free');
        });
    });

    describe('resolveSubscriptionStatus', () => {
        const now = new Date('2026-02-23T00:00:00.000Z');

        it('premium/basic은 만료일 기준으로 active/expired를 결정한다', () => {
            expect(resolveSubscriptionStatus('premium', '2026-03-01T00:00:00.000Z', now)).toBe('active');
            expect(resolveSubscriptionStatus('premium', '2026-02-20T00:00:00.000Z', now)).toBe('expired');
            expect(resolveSubscriptionStatus('basic', undefined, now)).toBe('active');
        });

        it('trial은 만료일 없으면 trial, 지나면 expired다', () => {
            expect(resolveSubscriptionStatus('trial', undefined, now)).toBe('trial');
            expect(resolveSubscriptionStatus('trial', '2026-02-24T00:00:00.000Z', now)).toBe('trial');
            expect(resolveSubscriptionStatus('trial', '2026-02-22T23:59:59.000Z', now)).toBe('expired');
        });

        it('free/expired 키를 안정적으로 처리한다', () => {
            expect(resolveSubscriptionStatus('free', undefined, now)).toBe('free');
            expect(resolveSubscriptionStatus('expired', undefined, now)).toBe('expired');
        });
    });

    describe('formatPointAmount', () => {
        it('포인트 증감 포맷을 생성한다', () => {
            expect(formatPointAmount(10000)).toBe('+10,000 P');
            expect(formatPointAmount(-5000)).toBe('-5,000 P');
            expect(formatPointAmount(0)).toBe('0 P');
        });
    });
});
