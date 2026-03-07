import { createServerClient } from '@supabase/ssr';
import { NextResponse, type NextRequest } from 'next/server';
import { buildLoginHref } from '@/lib/auth/oauth-flow';
import {
    buildReturnToFromPath,
    isProtectedApiPath,
    isProtectedPagePath,
} from '@/lib/auth/route-access';

const ADMIN_PATH = '/playbid-admin-19740813';

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

export async function proxy(request: NextRequest) {
    const { pathname } = request.nextUrl;
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

    if (!supabaseUrl || !supabaseAnonKey) {
        console.error('CRITICAL: Supabase 환경 변수가 설정되지 않았습니다.');
        if (pathname.startsWith(ADMIN_PATH)) {
            return new NextResponse('Internal Server Error: Missing Database Configuration', {
                status: 500,
            });
        }
        return NextResponse.next();
    }

    let supabaseResponse = NextResponse.next({ request });

    const supabase = createServerClient(supabaseUrl, supabaseAnonKey, {
        cookies: {
            getAll() {
                return request.cookies.getAll();
            },
            setAll(cookiesToSet) {
                cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value));
                supabaseResponse = NextResponse.next({ request });
                cookiesToSet.forEach(({ name, value, options }) =>
                    supabaseResponse.cookies.set(name, value, options)
                );
            },
        },
    });

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

    if (pathname.startsWith(ADMIN_PATH)) {
        if (pathname === `${ADMIN_PATH}/login` || pathname === `${ADMIN_PATH}/unauthorized`) {
            if (user && pathname === `${ADMIN_PATH}/login`) {
                return NextResponse.redirect(new URL(ADMIN_PATH, request.url));
            }
            return supabaseResponse;
        }

        if (pathname.startsWith(`${ADMIN_PATH}/auth`)) {
            return supabaseResponse;
        }

        if (!user) {
            return NextResponse.redirect(new URL(`${ADMIN_PATH}/login`, request.url));
        }

        const allowedEmails = (process.env.ADMIN_ALLOWED_EMAILS || '')
            .split(',')
            .map((email) => email.trim())
            .filter(Boolean);

        if (allowedEmails.length === 0 || !user.email || !allowedEmails.includes(user.email)) {
            return NextResponse.redirect(new URL(`${ADMIN_PATH}/unauthorized`, request.url));
        }
    }

    return supabaseResponse;
}

export const config = {
    matcher: [
        '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
    ],
};
