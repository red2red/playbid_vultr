import { buildLoginRedirectHref, buildReturnPath } from './use-auth-action';

describe('use-auth-action helpers', () => {
    it('pathname과 query를 return path로 합친다', () => {
        expect(buildReturnPath('/bid_notice/detail/abc', 'tab=analysis&status=open')).toBe(
            '/bid_notice/detail/abc?tab=analysis&status=open'
        );
    });

    it('query가 없으면 pathname만 사용한다', () => {
        expect(buildReturnPath('/dashboard', '')).toBe('/dashboard');
    });

    it('로그인 리다이렉트 URL에 인코딩된 returnTo를 생성한다', () => {
        const href = buildLoginRedirectHref('/bid_history', 'status=success&category=goods');
        expect(href).toBe('/login?returnTo=%2Fbid_history%3Fstatus%3Dsuccess%26category%3Dgoods');
    });

    it('pathname이 비어 있으면 루트 경로를 returnTo로 사용한다', () => {
        const href = buildLoginRedirectHref(undefined, '');
        expect(href).toBe('/login?returnTo=%2F');
    });
});
