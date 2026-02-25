export type AuthorizedFetchAuthFailureCode = 'AUTH_REFRESH_FAILED' | 'AUTH_SESSION_EXPIRED';

export class AuthorizedFetchAuthError extends Error {
    readonly code: AuthorizedFetchAuthFailureCode;

    constructor(code: AuthorizedFetchAuthFailureCode, message: string) {
        super(message);
        this.code = code;
        this.name = 'AuthorizedFetchAuthError';
    }
}

interface AuthorizedFetchOptions {
    fetchImpl?: typeof fetch;
    refreshSession: () => Promise<{ data: { session: unknown | null }; error: unknown }>;
    onAuthFailure: (code: AuthorizedFetchAuthFailureCode) => void;
}

export async function authorizedFetch(
    input: RequestInfo | URL,
    init: RequestInit = {},
    options: AuthorizedFetchOptions
): Promise<Response> {
    const fetchImpl = options.fetchImpl ?? fetch;

    const firstResponse = await fetchImpl(input, init);
    if (firstResponse.status !== 401) {
        return firstResponse;
    }

    const refreshResult = await options.refreshSession();
    if (refreshResult.error || !refreshResult.data.session) {
        options.onAuthFailure('AUTH_REFRESH_FAILED');
        throw new AuthorizedFetchAuthError(
            'AUTH_REFRESH_FAILED',
            '세션 갱신에 실패했습니다. 다시 로그인해 주세요.'
        );
    }

    const secondResponse = await fetchImpl(input, init);
    if (secondResponse.status === 401) {
        options.onAuthFailure('AUTH_SESSION_EXPIRED');
        throw new AuthorizedFetchAuthError(
            'AUTH_SESSION_EXPIRED',
            '세션이 만료되었습니다. 다시 로그인해 주세요.'
        );
    }

    return secondResponse;
}
