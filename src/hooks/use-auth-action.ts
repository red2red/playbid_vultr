'use client';

import { useMemo } from 'react';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';

export function buildReturnPath(pathname: string, search: string): string {
    if (!search) {
        return pathname;
    }
    return `${pathname}?${search}`;
}

export function buildLoginRedirectHref(pathname: string | null | undefined, search: string): string {
    const normalizedPathname = pathname && pathname.length > 0 ? pathname : '/dashboard';
    const returnPath = buildReturnPath(normalizedPathname, search);
    return `/login?returnTo=${encodeURIComponent(returnPath)}`;
}

export function useAuthAction() {
    const router = useRouter();
    const pathname = usePathname();
    const searchParams = useSearchParams();
    const supabase = useMemo(() => createClient(), []);

    const ensureAuthenticated = async (): Promise<boolean> => {
        try {
            const {
                data: { user },
            } = await supabase.auth.getUser();

            if (user) {
                return true;
            }
        } catch {
            // 인증 상태 조회 실패 시 로그인 플로우로 이동
        }

        const search = searchParams?.toString() ?? '';
        router.push(buildLoginRedirectHref(pathname, search));
        return false;
    };

    const runWithAuth = async (action: () => Promise<void> | void): Promise<boolean> => {
        const allowed = await ensureAuthenticated();
        if (!allowed) {
            return false;
        }

        await action();
        return true;
    };

    return {
        ensureAuthenticated,
        runWithAuth,
    };
}
