import { describe, expect, it } from 'vitest';
import {
    AUTH_CHANNEL,
    shouldForceLoginRedirect,
    type AuthSyncEvent,
} from './auth-session-sync';

describe('auth session sync', () => {
    it('보호 경로에서는 signout 이벤트 시 리다이렉트 필요', () => {
        const event: AuthSyncEvent = { type: 'SIGNED_OUT' };
        expect(shouldForceLoginRedirect('/challenge/ranking', event)).toBe(true);
        expect(shouldForceLoginRedirect('/learning/quiz', event)).toBe(true);
    });

    it('공개 경로에서는 강제 리다이렉트하지 않는다', () => {
        const event: AuthSyncEvent = { type: 'SIGNED_OUT' };
        expect(shouldForceLoginRedirect('/bid_notice', event)).toBe(false);
        expect(shouldForceLoginRedirect('/bid_opening', event)).toBe(false);
    });

    it('SIGNED_IN 이벤트에서는 리다이렉트를 강제하지 않는다', () => {
        const event: AuthSyncEvent = { type: 'SIGNED_IN' };
        expect(shouldForceLoginRedirect('/challenge', event)).toBe(false);
    });

    it('채널명은 고정된다', () => {
        expect(AUTH_CHANNEL).toBe('playbid-auth');
    });
});
