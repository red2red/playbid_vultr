import { NextResponse, type NextRequest } from 'next/server';
import {
    buildLoginHref,
    sanitizeReturnTo,
} from '@/lib/auth/oauth-flow';
import {
    OAUTH_BROKER_PROVIDERS,
    exchangeOAuthBrokerCodeForRefreshToken,
    type OAuthBrokerProvider,
} from '@/lib/auth/oauth-broker';
import { createClient } from '@/lib/supabase/server';

function getPublicOrigin(request: NextRequest): string {
    const forwardedProto = request.headers.get('x-forwarded-proto');
    const forwardedHost = request.headers.get('x-forwarded-host');

    if (forwardedProto && forwardedHost) {
        return `${forwardedProto}://${forwardedHost}`;
    }

    const configuredSiteUrl = process.env.NEXT_PUBLIC_SITE_URL;
    if (configuredSiteUrl) {
        try {
            return new URL(configuredSiteUrl).origin;
        } catch {
            // NEXT_PUBLIC_SITE_URL이 잘못된 경우 request origin으로 fallback
        }
    }

    return request.nextUrl.origin;
}

function isOAuthBrokerProvider(value: string | null): value is OAuthBrokerProvider {
    if (!value) {
        return false;
    }

    return (OAUTH_BROKER_PROVIDERS as readonly string[]).includes(value);
}

function redirectToLogin(
    request: NextRequest,
    params: {
        returnTo: string;
        errorCode: string;
        provider: string | null;
    }
): NextResponse {
    const origin = getPublicOrigin(request);

    return NextResponse.redirect(
        new URL(
            buildLoginHref({
                returnTo: params.returnTo,
                errorCode: params.errorCode,
                provider: params.provider,
            }),
            origin
        )
    );
}

export async function GET(request: NextRequest) {
    const origin = getPublicOrigin(request);
    const provider = request.nextUrl.searchParams.get('provider');
    const returnTo = sanitizeReturnTo(request.nextUrl.searchParams.get('returnTo'));
    const code = request.nextUrl.searchParams.get('code');
    const exchangeCode = request.nextUrl.searchParams.get('exchange_code');
    const oauthError = request.nextUrl.searchParams.get('error');

    if (oauthError) {
        return redirectToLogin(request, {
            returnTo,
            errorCode: 'oauth_failed',
            provider,
        });
    }

    const supabase = await createClient();

    if (code) {
        const { error } = await supabase.auth.exchangeCodeForSession(code);
        if (error) {
            return redirectToLogin(request, {
                returnTo,
                errorCode: 'oauth_failed',
                provider,
            });
        }

        return NextResponse.redirect(new URL(returnTo, origin));
    }

    if (exchangeCode && isOAuthBrokerProvider(provider)) {
        const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
        const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

        if (!supabaseUrl || !anonKey) {
            return redirectToLogin(request, {
                returnTo,
                errorCode: 'broker_unavailable',
                provider,
            });
        }

        try {
            const refreshToken = await exchangeOAuthBrokerCodeForRefreshToken({
                supabaseUrl,
                anonKey,
                provider,
                exchangeCode,
            });

            const { error } = await supabase.auth.refreshSession({
                refresh_token: refreshToken,
            });

            if (error) {
                throw new Error(`refresh_session_failed:${error.message}`);
            }
        } catch {
            return redirectToLogin(request, {
                returnTo,
                errorCode: 'broker_failed',
                provider,
            });
        }

        return NextResponse.redirect(new URL(returnTo, origin));
    }

    return redirectToLogin(request, {
        returnTo,
        errorCode: 'missing_code',
        provider,
    });
}
