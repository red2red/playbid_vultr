const DEFAULT_RETURN_TO = '/dashboard';

export const OAUTH_PROVIDER_IDS = ['apple', 'google', 'kakao', 'naver'] as const;
export type OAuthProviderId = (typeof OAUTH_PROVIDER_IDS)[number];

type SearchParamValue = string | string[] | undefined;

export function asSingleParamValue(value: SearchParamValue): string | null {
    if (typeof value === 'string') {
        return value;
    }
    if (Array.isArray(value)) {
        return value[0] ?? null;
    }
    return null;
}

export function sanitizeReturnTo(
    rawReturnTo: string | null | undefined,
    fallback: string = DEFAULT_RETURN_TO
): string {
    if (!rawReturnTo) {
        return fallback;
    }

    const trimmed = rawReturnTo.trim();
    if (!trimmed) {
        return fallback;
    }

    if (!trimmed.startsWith('/')) {
        return fallback;
    }

    if (trimmed.startsWith('//')) {
        return fallback;
    }

    return trimmed;
}

export function buildLoginHref(params: {
    returnTo: string;
    errorCode?: string;
    provider?: string | null;
}): string {
    const query = new URLSearchParams();
    query.set('returnTo', sanitizeReturnTo(params.returnTo));

    if (params.errorCode) {
        query.set('error', params.errorCode);
    }

    if (params.provider) {
        query.set('provider', params.provider);
    }

    return `/login?${query.toString()}`;
}

export function buildOAuthCallbackUrl(
    origin: string,
    returnTo: string,
    provider: OAuthProviderId
): string {
    const url = new URL('/auth-callback', origin);
    url.searchParams.set('returnTo', sanitizeReturnTo(returnTo));
    url.searchParams.set('provider', provider);
    return url.toString();
}

export function getOAuthProviderLabel(provider: string | null | undefined): string {
    switch (provider) {
        case 'apple':
            return 'Apple';
        case 'google':
            return 'Google';
        case 'kakao':
            return '카카오';
        case 'naver':
            return '네이버';
        default:
            return '소셜';
    }
}

export function getLoginErrorMessage(
    errorCode: string | null | undefined,
    provider: string | null | undefined
): string | null {
    if (!errorCode) {
        return null;
    }

    const providerLabel = getOAuthProviderLabel(provider);

    if (errorCode === 'oauth_failed') {
        return `${providerLabel} 로그인 처리 중 오류가 발생했습니다. 다시 시도해 주세요.`;
    }

    if (errorCode === 'missing_code') {
        return '인증 코드가 전달되지 않았습니다. 다시 로그인해 주세요.';
    }

    if (errorCode === 'broker_failed') {
        return `${providerLabel} 로그인 브로커 처리 중 오류가 발생했습니다. 다시 시도해 주세요.`;
    }

    if (errorCode === 'broker_unavailable') {
        return `${providerLabel} 로그인 설정이 올바르지 않습니다. 관리자에게 문의해 주세요.`;
    }

    return '로그인 과정에서 알 수 없는 오류가 발생했습니다. 잠시 후 다시 시도해 주세요.';
}
