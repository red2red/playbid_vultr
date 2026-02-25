import { createServerClient } from '@supabase/ssr';
import { NextResponse, type NextRequest } from 'next/server';
import { buildLoginHref } from '@/lib/auth/oauth-flow';
import {
    buildReturnToFromPath,
    isProtectedApiPath,
    isProtectedPagePath,
} from '@/lib/auth/route-access';

const ADMIN_PATH = '/playbid-admin-19740813';

// 비밀번호 보호에서 제외할 경로 (Removed)

function createRequestId(): string {
    if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
        return crypto.randomUUID();
    }
    return `req_${Date.now()}_${Math.random().toString(36).slice(2, 10)}`;
}

function createAuthRequiredApiResponse() {
    const requestId = createRequestId();
    return NextResponse.json(
        {
            ok: false,
            code: 'AUTH_REQUIRED',
            message: '로그인이 필요합니다.',
            error: {
                code: 'AUTH_REQUIRED',
                message: '로그인이 필요합니다.',
                requestId,
                timestamp: new Date().toISOString(),
                suggestion: '로그인 후 다시 시도해 주세요.',
            },
        },
        {
            status: 401,
            headers: {
                'x-request-id': requestId,
            },
        }
    );
}

export async function middleware(request: NextRequest) {
    const { pathname } = request.nextUrl;

    // ===== 사이트 비밀번호 보호 (Removed per user request) =====

    // ===== 관리자 경로 보호 (기존 로직) =====

    // ===== 관리자 경로 보호 (기존 로직) =====
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

    // 환경 변수가 없으면 모든 요청 허용 (개발 모드)
    if (!supabaseUrl || !supabaseAnonKey) {
        console.warn('Supabase 환경 변수가 설정되지 않았습니다. 인증 없이 접근을 허용합니다.');
        return NextResponse.next();
    }

    let supabaseResponse = NextResponse.next({
        request,
    });

    const supabase = createServerClient(supabaseUrl, supabaseAnonKey, {
        cookies: {
            getAll() {
                return request.cookies.getAll();
            },
            setAll(cookiesToSet) {
                cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value));
                supabaseResponse = NextResponse.next({
                    request,
                });
                cookiesToSet.forEach(({ name, value, options }) =>
                    supabaseResponse.cookies.set(name, value, options)
                );
            },
        },
    });

    // 세션 새로고침
    const {
        data: { user },
    } = await supabase.auth.getUser();

    if (!user && isProtectedApiPath(pathname)) {
        return createAuthRequiredApiResponse();
    }

    if (!user && isProtectedPagePath(pathname)) {
        const returnTo = buildReturnToFromPath(pathname, request.nextUrl.search);
        const loginHref = buildLoginHref({ returnTo });
        return NextResponse.redirect(new URL(loginHref, request.url));
    }

    // 관리자 경로 보호
    if (request.nextUrl.pathname.startsWith(ADMIN_PATH)) {
        // 로그인 페이지와 unauthorized 페이지는 제외
        if (request.nextUrl.pathname === `${ADMIN_PATH}/login` ||
            request.nextUrl.pathname === `${ADMIN_PATH}/unauthorized`) {
            // 이미 로그인된 경우 대시보드로 리다이렉트
            if (user && request.nextUrl.pathname === `${ADMIN_PATH}/login`) {
                return NextResponse.redirect(new URL(ADMIN_PATH, request.url));
            }
            return supabaseResponse;
        }

        // auth callback은 제외
        if (request.nextUrl.pathname.startsWith(`${ADMIN_PATH}/auth`)) {
            return supabaseResponse;
        }

        // 로그인되지 않은 경우 로그인 페이지로 리다이렉트
        if (!user) {
            return NextResponse.redirect(new URL(`${ADMIN_PATH}/login`, request.url));
        }

        // 허용된 관리자 이메일 체크 (환경 변수에 설정된 경우)
        const allowedEmails = process.env.ADMIN_ALLOWED_EMAILS?.split(',') || [];
        if (allowedEmails.length > 0 && user.email) {
            if (!allowedEmails.includes(user.email)) {
                // 허용되지 않은 이메일인 경우 권한 없음 페이지로
                return NextResponse.redirect(new URL(`${ADMIN_PATH}/unauthorized`, request.url));
            }
        }
    }

    return supabaseResponse;
}

export const config = {
    matcher: [
        /*
         * 다음을 제외한 모든 요청 경로에 매칭:
         * - _next/static (정적 파일)
         * - _next/image (이미지 최적화)
         * - favicon.ico (파비콘)
         * - public 폴더의 이미지 등
         */
        '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
    ],
};
