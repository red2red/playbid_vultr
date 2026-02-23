import { createClient } from '@/lib/supabase/server';
import { invalidateDashboardUserCache } from './dashboard-query';

export class NotificationAuthError extends Error {
    constructor(message = '로그인이 필요합니다.') {
        super(message);
        this.name = 'NotificationAuthError';
    }
}

interface NotificationMutationResult {
    updatedCount: number;
    unreadCount: number;
}

interface CountResponse {
    unreadCount: number;
}

function sanitizeIds(ids: string[]): string[] {
    return [...new Set(ids.map((id) => id.trim()).filter(Boolean))];
}

async function getCurrentUserId(): Promise<string | null> {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

    if (!supabaseUrl || !supabaseAnonKey) {
        return null;
    }

    try {
        const supabase = await createClient();
        const {
            data: { user },
        } = await supabase.auth.getUser();
        return user?.id ?? null;
    } catch {
        return null;
    }
}

async function readUnreadCount(userId: string): Promise<number> {
    const supabase = await createClient();
    const { count, error } = await supabase
        .from('notifications')
        .select('id', { count: 'exact', head: true })
        .eq('user_id', userId)
        .eq('deleted', false)
        .eq('read', false);

    if (error) {
        return 0;
    }

    return count ?? 0;
}

export async function getUnreadNotificationCountForCurrentUser(): Promise<CountResponse> {
    const userId = await getCurrentUserId();
    if (!userId) {
        throw new NotificationAuthError();
    }

    return {
        unreadCount: await readUnreadCount(userId),
    };
}

export async function markNotificationsReadForCurrentUser(
    notificationIds: string[]
): Promise<NotificationMutationResult> {
    const userId = await getCurrentUserId();
    if (!userId) {
        throw new NotificationAuthError();
    }

    const ids = sanitizeIds(notificationIds);
    if (ids.length === 0) {
        return {
            updatedCount: 0,
            unreadCount: await readUnreadCount(userId),
        };
    }

    const supabase = await createClient();
    const { data, error } = await supabase
        .from('notifications')
        .update({ read: true })
        .eq('user_id', userId)
        .eq('deleted', false)
        .in('id', ids)
        .eq('read', false)
        .select('id');

    if (error) {
        throw new Error('알림 읽음 처리에 실패했습니다.');
    }

    invalidateDashboardUserCache(userId);

    return {
        updatedCount: (data ?? []).length,
        unreadCount: await readUnreadCount(userId),
    };
}

export async function markAllNotificationsReadForCurrentUser(): Promise<NotificationMutationResult> {
    const userId = await getCurrentUserId();
    if (!userId) {
        throw new NotificationAuthError();
    }

    const supabase = await createClient();
    const { data, error } = await supabase
        .from('notifications')
        .update({ read: true })
        .eq('user_id', userId)
        .eq('deleted', false)
        .eq('read', false)
        .select('id');

    if (error) {
        throw new Error('전체 읽음 처리에 실패했습니다.');
    }

    invalidateDashboardUserCache(userId);

    return {
        updatedCount: (data ?? []).length,
        unreadCount: await readUnreadCount(userId),
    };
}

export async function softDeleteNotificationsForCurrentUser(
    notificationIds: string[]
): Promise<NotificationMutationResult> {
    const userId = await getCurrentUserId();
    if (!userId) {
        throw new NotificationAuthError();
    }

    const ids = sanitizeIds(notificationIds);
    if (ids.length === 0) {
        return {
            updatedCount: 0,
            unreadCount: await readUnreadCount(userId),
        };
    }

    const supabase = await createClient();
    const { data, error } = await supabase
        .from('notifications')
        .update({ deleted: true, read: true })
        .eq('user_id', userId)
        .in('id', ids)
        .eq('deleted', false)
        .select('id');

    if (error) {
        throw new Error('알림 삭제에 실패했습니다.');
    }

    invalidateDashboardUserCache(userId);

    return {
        updatedCount: (data ?? []).length,
        unreadCount: await readUnreadCount(userId),
    };
}
