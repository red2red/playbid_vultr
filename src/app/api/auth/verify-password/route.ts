import { NextRequest, NextResponse } from 'next/server';
import { createApiErrorResponse } from '@/lib/api/error-response';

export async function POST(request: NextRequest) {
    try {
        const { password } = await request.json();

        const sitePassword = process.env.SITE_PASSWORD;

        // 환경변수가 설정되지 않은 경우 (개발 모드)
        if (!sitePassword) {
            console.warn('SITE_PASSWORD 환경 변수가 설정되지 않았습니다. 개발 모드로 접근을 허용합니다.');
            const response = NextResponse.json({ success: true });
            response.cookies.set('site_access', 'granted', {
                httpOnly: true,
                secure: process.env.NODE_ENV === 'production',
                sameSite: 'strict',
                maxAge: 60 * 60 * 24 * 7, // 7일
                path: '/',
            });
            return response;
        }

        if (password === sitePassword) {
            const response = NextResponse.json({ success: true });

            // 인증 쿠키 설정 (7일간 유효)
            response.cookies.set('site_access', 'granted', {
                httpOnly: true,
                secure: process.env.NODE_ENV === 'production',
                sameSite: 'strict',
                maxAge: 60 * 60 * 24 * 7, // 7일
                path: '/',
            });

            return response;
        }

        return createApiErrorResponse({
            status: 401,
            code: 'AUTH_REQUIRED',
            message: '비밀번호가 올바르지 않습니다.',
            suggestion: '입력한 비밀번호를 확인한 뒤 다시 시도해 주세요.',
        });
    } catch {
        return createApiErrorResponse({
            status: 500,
            code: 'INTERNAL_ERROR',
            message: '요청 처리 중 오류가 발생했습니다.',
        });
    }
}
