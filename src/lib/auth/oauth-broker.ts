import { sanitizeReturnTo } from './oauth-flow';

export const OAUTH_BROKER_PROVIDERS = ['kakao', 'naver'] as const;
export type OAuthBrokerProvider = (typeof OAUTH_BROKER_PROVIDERS)[number];

interface BuildOAuthBrokerStartUrlParams {
    supabaseUrl: string;
    provider: OAuthBrokerProvider;
    webOrigin: string;
    returnTo: string;
}

interface ExchangeOAuthBrokerCodeParams {
    supabaseUrl: string;
    anonKey: string;
    provider: OAuthBrokerProvider;
    exchangeCode: string;
}

interface OAuthBrokerCompleteResponse {
    success?: boolean;
    error?: string;
    refresh_token?: string;
}

type FetchLike = typeof fetch;

function trimTrailingSlash(value: string): string {
    return value.endsWith('/') ? value.slice(0, -1) : value;
}

function normalizeWebOrigin(rawOrigin: string): string {
    const parsed = new URL(rawOrigin);
    if (parsed.protocol !== 'https:' && parsed.protocol !== 'http:') {
        throw new Error('invalid_web_origin_protocol');
    }
    return parsed.origin;
}

export function buildOAuthBrokerStartUrl({
    supabaseUrl,
    provider,
    webOrigin,
    returnTo,
}: BuildOAuthBrokerStartUrlParams): string {
    const normalizedSupabaseUrl = trimTrailingSlash(supabaseUrl);
    const normalizedOrigin = normalizeWebOrigin(webOrigin);
    const sanitizedReturnTo = sanitizeReturnTo(returnTo);

    const url = new URL(`${normalizedSupabaseUrl}/functions/v1/${provider}-oauth`);
    url.searchParams.set('login_type', 'web');
    url.searchParams.set('web_origin', normalizedOrigin);
    url.searchParams.set('return_to', sanitizedReturnTo);
    return url.toString();
}

export async function exchangeOAuthBrokerCodeForRefreshToken(
    params: ExchangeOAuthBrokerCodeParams,
    fetcher: FetchLike = fetch
): Promise<string> {
    const endpoint = `${trimTrailingSlash(params.supabaseUrl)}/functions/v1/${params.provider}-oauth-complete`;

    const response = await fetcher(endpoint, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            apikey: params.anonKey,
            Authorization: `Bearer ${params.anonKey}`,
        },
        body: JSON.stringify({
            exchange_code: params.exchangeCode,
        }),
    });

    const payload = (await response.json().catch(() => null)) as OAuthBrokerCompleteResponse | null;

    if (!response.ok) {
        const message = payload?.error ?? `http_${response.status}`;
        throw new Error(`broker_complete_failed:${params.provider}:${message}`);
    }

    if (payload?.success !== true || !payload.refresh_token) {
        throw new Error(`broker_complete_invalid_response:${params.provider}`);
    }

    return payload.refresh_token;
}
