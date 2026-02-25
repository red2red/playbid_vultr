import { describe, expect, it } from 'vitest';
import { resolveLoginReturnTo } from './login-return';

describe('resolveLoginReturnTo', () => {
    it('유효한 내부 경로를 유지한다', () => {
        expect(resolveLoginReturnTo('/profile')).toBe('/profile');
    });

    it('유효하지 않은 returnTo는 /dashboard로 대체한다', () => {
        expect(resolveLoginReturnTo('https://malicious.example')).toBe('/dashboard');
        expect(resolveLoginReturnTo(undefined)).toBe('/dashboard');
        expect(resolveLoginReturnTo('')).toBe('/dashboard');
    });
});
