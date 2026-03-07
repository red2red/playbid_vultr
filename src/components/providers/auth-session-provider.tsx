'use client';

import { useEffect } from 'react';
import type { AuthChangeEvent, Session } from '@supabase/supabase-js';
import { buildLoginRedirectHref } from '@/hooks/use-auth-action';
import {
    createAuthChannel,
    normalizeAuthSyncEvent,
    publishAuthSyncEvent,
    shouldForceLoginRedirect,
    type AuthSyncEvent,
} from '@/lib/auth/auth-session-sync';
import { createClient } from '@/lib/supabase/client';

interface AuthSessionProviderProps {
    children: React.ReactNode;
}

function redirectToLogin(event: AuthSyncEvent): void {
    const pathname = window.location.pathname;
    if (!shouldForceLoginRedirect(pathname, event)) {
        return;
    }

    const search = window.location.search.replace(/^\?/, '');
    const href = buildLoginRedirectHref(pathname, search);
    window.location.assign(href);
}

export function AuthSessionProvider({ children }: AuthSessionProviderProps) {
    useEffect(() => {
        const supabase = createClient();
        const channel = createAuthChannel();

        const emitAndHandle = (event: AuthSyncEvent): void => {
            publishAuthSyncEvent(channel, event);
            redirectToLogin(event);
        };

        const {
            data: { subscription },
        } = supabase.auth.onAuthStateChange((event: AuthChangeEvent, session: Session | null) => {
            if (event === 'SIGNED_OUT') {
                emitAndHandle({ type: 'SIGNED_OUT' });
                return;
            }

            if (!session && event === 'TOKEN_REFRESHED') {
                emitAndHandle({ type: 'SESSION_EXPIRED' });
            }
        });

        const onMessage = (messageEvent: MessageEvent<unknown>) => {
            const event = normalizeAuthSyncEvent(messageEvent.data);
            if (!event) {
                return;
            }

            redirectToLogin(event);
        };

        channel?.addEventListener('message', onMessage);

        return () => {
            subscription.unsubscribe();
            channel?.removeEventListener('message', onMessage);
            channel?.close();
        };
    }, []);

    return <>{children}</>;
}
