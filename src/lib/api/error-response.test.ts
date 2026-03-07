import { createApiErrorResponse } from './error-response';

describe('createApiErrorResponse', () => {
    it('표준 에러 포맷과 x-request-id 헤더를 반환한다', async () => {
        const response = createApiErrorResponse({
            status: 400,
            code: 'INVALID_REQUEST',
            message: '요청이 올바르지 않습니다.',
            requestId: 'req-fixed',
        });

        const payload = (await response.json()) as {
            ok: boolean;
            code: string;
            message: string;
            error: {
                code: string;
                message: string;
                suggestion?: string;
                requestId: string;
                timestamp: string;
            };
        };

        expect(response.status).toBe(400);
        expect(response.headers.get('x-request-id')).toBe('req-fixed');
        expect(payload.ok).toBe(false);
        expect(payload.code).toBe('INVALID_REQUEST');
        expect(payload.error.code).toBe('INVALID_REQUEST');
        expect(payload.error.requestId).toBe('req-fixed');
        expect(payload.error.suggestion).toBe('입력값을 확인한 뒤 다시 시도해 주세요.');
        expect(Number.isNaN(Date.parse(payload.error.timestamp))).toBe(false);
    });

    it('인증 관련 코드 기본 suggestion을 반환한다', async () => {
        const response = createApiErrorResponse({
            status: 401,
            code: 'AUTH_REFRESH_FAILED',
            message: '세션 갱신 실패',
            requestId: 'req-auth-refresh',
        });

        const payload = (await response.json()) as {
            error: {
                code: string;
                suggestion?: string;
            };
        };

        expect(response.status).toBe(401);
        expect(payload.error.code).toBe('AUTH_REFRESH_FAILED');
        expect(payload.error.suggestion).toBe('세션 갱신에 실패했습니다. 다시 로그인해 주세요.');
    });
});
