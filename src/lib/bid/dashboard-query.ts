import { createClient } from '@/lib/supabase/server';

const DASHBOARD_CACHE_TTL_MS = 15 * 60 * 1000;
const DATE_LABEL_FORMATTER = new Intl.DateTimeFormat('ko-KR', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
});

type SupabaseServerClient = Awaited<ReturnType<typeof createClient>>;

interface CacheEntry<T> {
    value: T;
    expiresAt: number;
}

interface DashboardPublicCounts {
    closingTodayCount: number;
    openingTodayCount: number;
}

interface DashboardUserCounts {
    bookmarkCount: number;
    mockBidCount: number;
    unreadNotificationCount: number;
}

export interface DashboardQueryError {
    requestId: string;
    code: string;
    message: string;
    suggestion: string;
}

export interface DashboardData {
    counts: DashboardPublicCounts & DashboardUserCounts;
    refreshedAt: string;
    refreshedAtLabel: string;
    fromCache: boolean;
    cacheTtlMinutes: number;
    error?: DashboardQueryError;
}

const dashboardCache = new Map<string, CacheEntry<DashboardPublicCounts | DashboardUserCounts>>();
const dashboardInFlight = new Map<string, Promise<DashboardPublicCounts | DashboardUserCounts>>();

function createRequestId(): string {
    return `req_${Date.now()}_${Math.random().toString(36).slice(2, 10)}`;
}

function createErrorPayload(code: string, message: string, suggestion: string): DashboardQueryError {
    return {
        requestId: createRequestId(),
        code,
        message,
        suggestion,
    };
}

function formatDateLabel(iso: string): string {
    const parsed = new Date(iso);
    if (Number.isNaN(parsed.getTime())) {
        return iso;
    }
    return DATE_LABEL_FORMATTER.format(parsed).replace(/\./g, '.').replace(/\s/g, ' ').trim();
}

function getTodayRangeIso(now = new Date()): { fromIso: string; toIso: string; dayKey: string } {
    const from = new Date(now);
    from.setHours(0, 0, 0, 0);

    const to = new Date(now);
    to.setHours(23, 59, 59, 999);

    const dayKey = `${from.getFullYear()}-${String(from.getMonth() + 1).padStart(2, '0')}-${String(from.getDate()).padStart(2, '0')}`;

    return {
        fromIso: from.toISOString(),
        toIso: to.toISOString(),
        dayKey,
    };
}

async function getCachedValue<T extends DashboardPublicCounts | DashboardUserCounts>(
    key: string,
    producer: () => Promise<T>
): Promise<{ value: T; fromCache: boolean }> {
    const now = Date.now();
    const cached = dashboardCache.get(key) as CacheEntry<T> | undefined;
    if (cached && cached.expiresAt > now) {
        return {
            value: cached.value,
            fromCache: true,
        };
    }

    const inFlight = dashboardInFlight.get(key) as Promise<T> | undefined;
    if (inFlight) {
        return {
            value: await inFlight,
            fromCache: true,
        };
    }

    const promise = producer()
        .then((value) => {
            dashboardCache.set(key, {
                value,
                expiresAt: Date.now() + DASHBOARD_CACHE_TTL_MS,
            });
            return value;
        })
        .finally(() => {
            dashboardInFlight.delete(key);
        });

    dashboardInFlight.set(key, promise);

    return {
        value: await promise,
        fromCache: false,
    };
}

async function readCount(
    supabase: SupabaseServerClient,
    table: string,
    userId: string
): Promise<number> {
    const { count, error } = await supabase
        .from(table)
        .select('id', { count: 'exact', head: true })
        .eq('user_id', userId);

    if (error) {
        return 0;
    }

    return count ?? 0;
}

async function readUnreadNotificationCount(
    supabase: SupabaseServerClient,
    userId: string
): Promise<number> {
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

async function readPublicCountsForDay(dayKey: string, fromIso: string, toIso: string): Promise<DashboardPublicCounts> {
    const cacheKey = `dashboard:public:${dayKey}`;
    const cached = await getCachedValue(cacheKey, async () => {
        const supabase = await createClient();
        const [closingRes, openingRes] = await Promise.all([
            supabase
                .from('bid_notices')
                .select('id', { count: 'exact', head: true })
                .gte('bid_clse_dt', fromIso)
                .lte('bid_clse_dt', toIso),
            supabase
                .from('bid_results')
                .select('id', { count: 'exact', head: true })
                .gte('openg_dt', fromIso)
                .lte('openg_dt', toIso),
        ]);

        return {
            closingTodayCount: closingRes.error ? 0 : closingRes.count ?? 0,
            openingTodayCount: openingRes.error ? 0 : openingRes.count ?? 0,
        };
    });

    return cached.value;
}

async function readUserCounts(userId: string): Promise<{ counts: DashboardUserCounts; fromCache: boolean }> {
    const cacheKey = `dashboard:user:${userId}`;
    const cached = await getCachedValue(cacheKey, async () => {
        const supabase = await createClient();
        const [bookmarkCount, mockBidCount, unreadNotificationCount] = await Promise.all([
            readCount(supabase, 'user_scraps', userId),
            readCount(supabase, 'user_bid_history', userId),
            readUnreadNotificationCount(supabase, userId),
        ]);

        return {
            bookmarkCount,
            mockBidCount,
            unreadNotificationCount,
        };
    });

    return {
        counts: cached.value,
        fromCache: cached.fromCache,
    };
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

export function invalidateDashboardUserCache(userId: string): void {
    dashboardCache.delete(`dashboard:user:${userId}`);
    dashboardInFlight.delete(`dashboard:user:${userId}`);
}

export async function getDashboardData(now = new Date()): Promise<DashboardData> {
    const refreshedAt = now.toISOString();
    const refreshedAtLabel = formatDateLabel(refreshedAt);
    const baseResult: DashboardData = {
        counts: {
            closingTodayCount: 0,
            openingTodayCount: 0,
            bookmarkCount: 0,
            mockBidCount: 0,
            unreadNotificationCount: 0,
        },
        refreshedAt,
        refreshedAtLabel,
        fromCache: false,
        cacheTtlMinutes: DASHBOARD_CACHE_TTL_MS / (60 * 1000),
    };

    try {
        const userId = await getCurrentUserId();
        if (!userId) {
            return {
                ...baseResult,
                error: createErrorPayload(
                    'DASHBOARD_AUTH_REQUIRED',
                    '대시보드를 보려면 로그인이 필요합니다.',
                    '로그인 후 다시 시도해 주세요.'
                ),
            };
        }

        const { fromIso, toIso, dayKey } = getTodayRangeIso(now);
        const [publicCounts, userCountsResult] = await Promise.all([
            readPublicCountsForDay(dayKey, fromIso, toIso),
            readUserCounts(userId),
        ]);

        return {
            ...baseResult,
            counts: {
                ...publicCounts,
                ...userCountsResult.counts,
            },
            fromCache: userCountsResult.fromCache,
        };
    } catch {
        return {
            ...baseResult,
            error: createErrorPayload(
                'DASHBOARD_DATA_FAILED',
                '대시보드 데이터를 불러오지 못했습니다.',
                '잠시 후 다시 시도해 주세요.'
            ),
        };
    }
}
