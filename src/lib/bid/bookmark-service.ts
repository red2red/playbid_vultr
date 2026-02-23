import { createClient } from '@/lib/supabase/server';
import { invalidateDashboardUserCache } from './dashboard-query';

export class BookmarkAuthError extends Error {
    constructor(message = '로그인이 필요합니다.') {
        super(message);
        this.name = 'BookmarkAuthError';
    }
}

interface ToggleBookmarkParams {
    noticeId: string;
    noticeNumber?: string;
}

interface BookmarkRow {
    id: string;
}

async function findExistingBookmarkId(
    userId: string,
    noticeId: string,
    noticeNumber?: string
): Promise<string | null> {
    const supabase = await createClient();

    // 1) 기본 계약: bid_notice_id
    const byNoticeId = await supabase
        .from('user_scraps')
        .select('id')
        .eq('user_id', userId)
        .eq('bid_notice_id', noticeId)
        .limit(1);

    if (!byNoticeId.error && byNoticeId.data && byNoticeId.data.length > 0) {
        return (byNoticeId.data[0] as BookmarkRow).id;
    }

    // 2) 레거시/대체 계약: bid_ntce_no
    if (!noticeNumber) {
        return null;
    }

    const byNoticeNumber = await supabase
        .from('user_scraps')
        .select('id')
        .eq('user_id', userId)
        .eq('bid_ntce_no', noticeNumber)
        .limit(1);

    if (!byNoticeNumber.error && byNoticeNumber.data && byNoticeNumber.data.length > 0) {
        return (byNoticeNumber.data[0] as BookmarkRow).id;
    }

    return null;
}

async function insertBookmark(
    userId: string,
    noticeId: string,
    noticeNumber?: string
): Promise<void> {
    const supabase = await createClient();

    const candidates: Record<string, unknown>[] = [
        { user_id: userId, bid_notice_id: noticeId, scrap_reason: 'web_notice_detail' },
        { user_id: userId, bid_notice_id: noticeId },
    ];

    if (noticeNumber) {
        candidates.push(
            { user_id: userId, bid_ntce_no: noticeNumber, scrap_reason: 'web_notice_detail' },
            { user_id: userId, bid_ntce_no: noticeNumber }
        );
    }

    for (const payload of candidates) {
        const { error } = await supabase.from('user_scraps').insert(payload);
        if (!error) {
            return;
        }
    }

    throw new Error('북마크 저장에 실패했습니다.');
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

export async function getBookmarkStateForCurrentUser(
    noticeId: string,
    noticeNumber?: string
): Promise<boolean> {
    try {
        const userId = await getCurrentUserId();
        if (!userId) {
            return false;
        }

        const existingId = await findExistingBookmarkId(userId, noticeId, noticeNumber);
        return Boolean(existingId);
    } catch {
        return false;
    }
}

export async function toggleBookmarkForCurrentUser({
    noticeId,
    noticeNumber,
}: ToggleBookmarkParams): Promise<{ isBookmarked: boolean }> {
    const userId = await getCurrentUserId();
    if (!userId) {
        throw new BookmarkAuthError();
    }

    const existingId = await findExistingBookmarkId(userId, noticeId, noticeNumber);
    const supabase = await createClient();

    if (existingId) {
        const { error } = await supabase.from('user_scraps').delete().eq('id', existingId);
        if (error) {
            throw new Error('북마크 해제에 실패했습니다.');
        }
        invalidateDashboardUserCache(userId);
        return { isBookmarked: false };
    }

    await insertBookmark(userId, noticeId, noticeNumber);
    invalidateDashboardUserCache(userId);
    return { isBookmarked: true };
}
