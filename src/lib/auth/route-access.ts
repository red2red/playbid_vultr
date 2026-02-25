const PUBLIC_EXACT_PATHS = new Set(['/','/login','/auth-callback','/terms','/privacy']);

const PUBLIC_PREFIX_PATHS = ['/bid_notice', '/bid_opening'];

const PROTECTED_PAGE_PREFIX_PATHS = [
    '/dashboard',
    '/bid_history',
    '/profile',
    '/point-history',
    '/mock_bid',
    '/qualification-calculator',
    '/challenge',
    '/learning',
];

const PROTECTED_API_PREFIX_PATHS = [
    '/api/paid',
    '/api/bookmarks',
    '/api/bid-history',
    '/api/notification-preferences',
    '/api/notifications',
];

function matchesPrefixPath(pathname: string, prefixes: string[]): boolean {
    return prefixes.some((prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`));
}

export function isPublicPath(pathname: string): boolean {
    return PUBLIC_EXACT_PATHS.has(pathname) || matchesPrefixPath(pathname, PUBLIC_PREFIX_PATHS);
}

export function isProtectedPagePath(pathname: string): boolean {
    return matchesPrefixPath(pathname, PROTECTED_PAGE_PREFIX_PATHS);
}

export function isProtectedApiPath(pathname: string): boolean {
    return matchesPrefixPath(pathname, PROTECTED_API_PREFIX_PATHS);
}

export function buildReturnToFromPath(pathname: string, search: string): string {
    return search ? `${pathname}${search}` : pathname;
}
