import {
    buildReturnToFromPath,
    isProtectedApiPath,
    isProtectedPagePath,
    isPublicPath,
} from './route-access';

describe('route access matrix', () => {
    it('challenge/learning/ranking 경로를 보호 페이지로 분류한다', () => {
        expect(isProtectedPagePath('/challenge')).toBe(true);
        expect(isProtectedPagePath('/challenge/ranking')).toBe(true);
        expect(isProtectedPagePath('/challenge/ranking?tab=weekly')).toBe(true);
        expect(isProtectedPagePath('/learning/quiz')).toBe(true);
        expect(isProtectedPagePath('/learning/flashcard')).toBe(true);
    });

    it('bid_notice/bid_opening은 공개 경로로 유지한다', () => {
        expect(isPublicPath('/bid_notice')).toBe(true);
        expect(isPublicPath('/bid_opening/detail/abc')).toBe(true);
        expect(isProtectedPagePath('/bid_notice')).toBe(false);
    });

    it('보호 API 경로를 정확히 분류한다', () => {
        expect(isProtectedApiPath('/api/bookmarks/toggle')).toBe(true);
        expect(isProtectedApiPath('/api/paid/execute')).toBe(true);
        expect(isProtectedApiPath('/api/notification-preferences')).toBe(true);
        expect(isProtectedApiPath('/api/auth/verify-password')).toBe(false);
    });

    it('returnTo는 path+query를 그대로 유지한다', () => {
        expect(buildReturnToFromPath('/challenge/ranking', '?tab=weekly')).toBe(
            '/challenge/ranking?tab=weekly'
        );
    });
});
