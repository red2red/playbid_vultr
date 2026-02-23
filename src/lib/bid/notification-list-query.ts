import { createClient } from '@/lib/supabase/server';
import type {
    NotificationListData,
    NotificationListError,
    NotificationListFilters,
    NotificationListItem,
    NotificationReadFilter,
    NotificationSortOption,
    NotificationSummary,
    NotificationType,
    NotificationTypeCounts,
    NotificationTypeFilter,
} from './notification-list-types';

const NOTIFICATION_SELECT = `
  id,
  type,
  title,
  body,
  read,
  deleted,
  bid_history_id,
  data,
  created_at
`;

const dateTimeFormatter = new Intl.DateTimeFormat('ko-KR', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
});

type SupabaseServerClient = Awaited<ReturnType<typeof createClient>>;

function parseParamValue(value: string | string[] | undefined): string | undefined {
    if (typeof value === 'string') {
        return value;
    }
    if (Array.isArray(value)) {
        return value[0];
    }
    return undefined;
}

function toInteger(value: string | undefined, fallback: number): number {
    const parsed = Number(value);
    if (!Number.isFinite(parsed) || parsed <= 0) {
        return fallback;
    }
    return Math.floor(parsed);
}

function asRecord(value: unknown): Record<string, unknown> | null {
    if (!value || typeof value !== 'object' || Array.isArray(value)) {
        return null;
    }
    return value as Record<string, unknown>;
}

function asString(value: unknown): string | null {
    if (typeof value === 'string') {
        const trimmed = value.trim();
        return trimmed.length > 0 ? trimmed : null;
    }
    if (typeof value === 'number' && Number.isFinite(value)) {
        return String(value);
    }
    return null;
}

function asBoolean(value: unknown): boolean {
    if (typeof value === 'boolean') {
        return value;
    }
    if (typeof value === 'number') {
        return value !== 0;
    }
    if (typeof value === 'string') {
        const normalized = value.toLowerCase().trim();
        if (normalized === 'true' || normalized === '1' || normalized === 'yes') {
            return true;
        }
        if (normalized === 'false' || normalized === '0' || normalized === 'no') {
            return false;
        }
    }
    return false;
}

function makeRequestId(): string {
    return `req_${Date.now()}_${Math.random().toString(36).slice(2, 10)}`;
}

function createErrorPayload(code: string, message: string, suggestion: string): NotificationListError {
    return {
        requestId: makeRequestId(),
        code,
        message,
        suggestion,
    };
}

function normalizeTypeFilter(value: string | undefined): NotificationTypeFilter {
    if (value === 'deadline' || value === 'result' || value === 'system' || value === 'premium') {
        return value;
    }
    return 'all';
}

function normalizeReadFilter(value: string | undefined): NotificationReadFilter {
    if (value === 'unread') {
        return 'unread';
    }
    return 'all';
}

function normalizeSortOption(value: string | undefined): NotificationSortOption {
    if (value === 'oldest') {
        return 'oldest';
    }
    return 'latest';
}

function normalizeFilters(
    params: Record<string, string | string[] | undefined>
): NotificationListFilters {
    const type = normalizeTypeFilter(parseParamValue(params.type));
    const read = normalizeReadFilter(parseParamValue(params.read));
    const query = (parseParamValue(params.query) ?? '').trim();
    const sort = normalizeSortOption(parseParamValue(params.sort));
    const page = toInteger(parseParamValue(params.page), 1);
    const pageSize = Math.min(100, Math.max(10, toInteger(parseParamValue(params.pageSize), 20)));

    return {
        type,
        read,
        query,
        sort,
        page,
        pageSize,
    };
}

function formatDateTime(value: string | null): string {
    if (!value) {
        return '-';
    }

    const parsed = new Date(value);
    if (Number.isNaN(parsed.getTime())) {
        return value;
    }

    return dateTimeFormatter.format(parsed).replace(/\./g, '.').replace(/\s/g, ' ').trim();
}

export function formatRelativeTime(createdAtIso: string | null | undefined, now = new Date()): string {
    if (!createdAtIso) {
        return '-';
    }

    const createdAt = new Date(createdAtIso);
    if (Number.isNaN(createdAt.getTime())) {
        return '-';
    }

    const diffMs = now.getTime() - createdAt.getTime();
    if (diffMs < 60 * 1000) {
        return '방금 전';
    }

    if (diffMs < 60 * 60 * 1000) {
        return `${Math.max(1, Math.floor(diffMs / (60 * 1000)))}분 전`;
    }

    if (diffMs < 24 * 60 * 60 * 1000) {
        return `${Math.floor(diffMs / (60 * 60 * 1000))}시간 전`;
    }

    if (diffMs < 7 * 24 * 60 * 60 * 1000) {
        return `${Math.floor(diffMs / (24 * 60 * 60 * 1000))}일 전`;
    }

    return formatDateTime(createdAtIso);
}

function normalizedTypeToken(rawType: string): string {
    return rawType
        .toLowerCase()
        .trim()
        .replace(/[\s-]+/g, '_');
}

export function normalizeNotificationType(rawType: string | null | undefined): NotificationType {
    const type = normalizedTypeToken(rawType ?? '');

    if (!type) {
        return 'system';
    }

    if (
        type.includes('deadline') ||
        type.includes('due') ||
        type.includes('closing') ||
        type.includes('bid_deadline') ||
        type.includes('마감')
    ) {
        return 'deadline';
    }

    if (
        type.includes('opening') ||
        type.includes('result') ||
        type.includes('openg') ||
        type.includes('bid_result') ||
        type.includes('개찰')
    ) {
        return 'result';
    }

    if (
        type.includes('premium') ||
        type.includes('ai') ||
        type.includes('paid') ||
        type.includes('analysis') ||
        type.includes('point') ||
        type.includes('subscription')
    ) {
        return 'premium';
    }

    return 'system';
}

function readPathFromData(data: Record<string, unknown>): string | null {
    const directPath = asString(data.path) ?? asString(data.href) ?? asString(data.url);
    if (!directPath || !directPath.startsWith('/')) {
        return null;
    }
    return directPath;
}

function pickFirstString(data: Record<string, unknown>, keys: string[]): string | null {
    for (const key of keys) {
        const value = asString(data[key]);
        if (value) {
            return value;
        }
    }
    return null;
}

function resolveAction(type: NotificationType, data: Record<string, unknown>): {
    href?: string;
    label?: string;
} {
    const directPath = readPathFromData(data);
    if (directPath) {
        return {
            href: directPath,
            label: '상세보기',
        };
    }

    if (type === 'deadline') {
        const noticeId = pickFirstString(data, [
            'notice_id',
            'noticeId',
            'bid_notice_id',
            'bidNoticeId',
            'target_id',
            'targetId',
        ]);
        if (noticeId) {
            return {
                href: `/bid_notice/detail/${noticeId}`,
                label: '공고 보기',
            };
        }
    }

    if (type === 'result') {
        const resultId = pickFirstString(data, [
            'result_id',
            'resultId',
            'bid_result_id',
            'bidResultId',
        ]);
        if (resultId) {
            return {
                href: `/bid_opening/detail/${resultId}`,
                label: '결과 보기',
            };
        }

        const bidHistoryId = pickFirstString(data, ['bid_history_id', 'bidHistoryId']);
        if (bidHistoryId) {
            return {
                href: `/bid_history?query=${encodeURIComponent(bidHistoryId)}`,
                label: '이력 보기',
            };
        }
    }

    if (type === 'premium') {
        return {
            href: '/profile/subscription',
            label: '확인하기',
        };
    }

    return {};
}

function parseTime(value: string): number {
    const time = new Date(value).getTime();
    return Number.isNaN(time) ? 0 : time;
}

function buildTypeCounts(items: NotificationListItem[]): NotificationTypeCounts {
    const counts: NotificationTypeCounts = {
        all: items.length,
        deadline: 0,
        result: 0,
        system: 0,
        premium: 0,
    };

    for (const item of items) {
        counts[item.type] += 1;
    }

    return counts;
}

function buildSummary(items: NotificationListItem[]): NotificationSummary {
    const unreadCount = items.reduce((count, item) => count + (item.isRead ? 0 : 1), 0);

    return {
        totalCount: items.length,
        unreadCount,
        typeCounts: buildTypeCounts(items),
    };
}

function filterItems(items: NotificationListItem[], filters: NotificationListFilters): NotificationListItem[] {
    const query = filters.query.toLowerCase();

    return items.filter((item) => {
        if (filters.type !== 'all' && item.type !== filters.type) {
            return false;
        }

        if (filters.read === 'unread' && item.isRead) {
            return false;
        }

        if (query) {
            const target = `${item.title} ${item.body}`.toLowerCase();
            if (!target.includes(query)) {
                return false;
            }
        }

        return true;
    });
}

function sortItems(items: NotificationListItem[], sort: NotificationSortOption): NotificationListItem[] {
    const sorted = [...items];

    sorted.sort((a, b) => {
        const diff = parseTime(b.createdAtIso) - parseTime(a.createdAtIso);
        return sort === 'latest' ? diff : -diff;
    });

    return sorted;
}

function paginateItems(items: NotificationListItem[], page: number, pageSize: number): NotificationListItem[] {
    const startIndex = (page - 1) * pageSize;
    return items.slice(startIndex, startIndex + pageSize);
}

function mapRowToItem(row: Record<string, unknown>, now: Date): NotificationListItem {
    const typeRaw = asString(row.type) ?? 'system';
    const type = normalizeNotificationType(typeRaw);
    const data = asRecord(row.data) ?? {};
    const createdAtIso = asString(row.created_at) ?? new Date().toISOString();
    const action = resolveAction(type, data);

    return {
        id: asString(row.id) ?? '',
        type,
        typeRaw,
        title: asString(row.title) ?? '알림',
        body: asString(row.body) ?? '',
        isRead: asBoolean(row.read),
        createdAtIso,
        createdAtLabel: formatDateTime(createdAtIso),
        relativeTimeLabel: formatRelativeTime(createdAtIso, now),
        bidHistoryId: asString(row.bid_history_id) ?? undefined,
        actionHref: action.href,
        actionLabel: action.label,
        data,
    };
}

async function collectRows(
    supabase: SupabaseServerClient,
    userId: string
): Promise<{ rows: Record<string, unknown>[]; error?: NotificationListError }> {
    const { data, error } = await supabase
        .from('notifications')
        .select(NOTIFICATION_SELECT)
        .eq('user_id', userId)
        .eq('deleted', false)
        .order('created_at', { ascending: false })
        .limit(3000);

    if (error) {
        return {
            rows: [],
            error: createErrorPayload(
                'NOTIFICATION_LIST_QUERY_FAILED',
                '알림 목록을 불러오지 못했습니다.',
                '잠시 후 다시 시도해 주세요.'
            ),
        };
    }

    return {
        rows: (data ?? []) as Record<string, unknown>[],
    };
}

function makeEmptyResult(filters: NotificationListFilters): NotificationListData {
    return {
        filters,
        summary: {
            totalCount: 0,
            unreadCount: 0,
            typeCounts: {
                all: 0,
                deadline: 0,
                result: 0,
                system: 0,
                premium: 0,
            },
        },
        items: [],
        totalCount: 0,
        totalPages: 1,
        page: 1,
        pageSize: filters.pageSize,
    };
}

export async function getNotificationListData(
    params: Record<string, string | string[] | undefined>
): Promise<NotificationListData> {
    const filters = normalizeFilters(params);

    try {
        const supabase = await createClient();
        const {
            data: { user },
            error: userError,
        } = await supabase.auth.getUser();

        if (userError || !user) {
            return {
                ...makeEmptyResult(filters),
                error: createErrorPayload(
                    'NOTIFICATION_AUTH_REQUIRED',
                    '알림을 보려면 로그인이 필요합니다.',
                    '로그인 후 다시 시도해 주세요.'
                ),
            };
        }

        const collection = await collectRows(supabase, user.id);
        if (collection.error) {
            return {
                ...makeEmptyResult(filters),
                error: collection.error,
            };
        }

        const now = new Date();
        const rawItems = collection.rows.map((row) => mapRowToItem(row, now));
        const summary = buildSummary(rawItems);

        const filteredItems = filterItems(rawItems, filters);
        const sortedItems = sortItems(filteredItems, filters.sort);

        const totalCount = sortedItems.length;
        const totalPages = Math.max(1, Math.ceil(totalCount / filters.pageSize));
        const page = Math.min(filters.page, totalPages);
        const items = paginateItems(sortedItems, page, filters.pageSize);

        return {
            filters,
            summary,
            items,
            totalCount,
            totalPages,
            page,
            pageSize: filters.pageSize,
        };
    } catch {
        return {
            ...makeEmptyResult(filters),
            error: createErrorPayload(
                'NOTIFICATION_LIST_UNKNOWN_ERROR',
                '알림 화면을 준비하지 못했습니다.',
                '페이지를 새로고침하거나 잠시 후 다시 시도해 주세요.'
            ),
        };
    }
}
