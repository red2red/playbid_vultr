import { isProtectedPagePath } from './route-access';

export const AUTH_CHANNEL = 'playbid-auth';

export type AuthSyncEvent =
    | { type: 'SIGNED_IN' }
    | { type: 'SIGNED_OUT' }
    | { type: 'SESSION_EXPIRED' }
    | { type: 'AUTH_REFRESH_FAILED' };

export function shouldForceLoginRedirect(pathname: string, event: AuthSyncEvent): boolean {
    if (event.type === 'SIGNED_IN') {
        return false;
    }

    return isProtectedPagePath(pathname);
}

export function createAuthChannel(): BroadcastChannel | null {
    if (typeof window === 'undefined' || typeof BroadcastChannel === 'undefined') {
        return null;
    }

    return new BroadcastChannel(AUTH_CHANNEL);
}

export function publishAuthSyncEvent(channel: BroadcastChannel | null, event: AuthSyncEvent): void {
    channel?.postMessage(event);
}

export function normalizeAuthSyncEvent(value: unknown): AuthSyncEvent | null {
    if (!value || typeof value !== 'object') {
        return null;
    }

    const type = (value as { type?: unknown }).type;
    if (type === 'SIGNED_IN' || type === 'SIGNED_OUT' || type === 'SESSION_EXPIRED' || type === 'AUTH_REFRESH_FAILED') {
        return { type };
    }

    return null;
}
