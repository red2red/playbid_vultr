import { createClient } from '@/lib/supabase/server';
import { getCategoryLabel, normalizeCategory } from './category-normalize';
import type {
    BookmarkListData,
    BookmarkListError,
    BookmarkListFilters,
    BookmarkListItem,
    BookmarkSortOption,
} from './bookmark-list-types';

const BOOKMARK_SELECT = `
  id,
  bid_notice_id,
  scrapped_at,
  created_at,
  bid_notices (
    id,
    bid_ntce_no,
    bid_ntce_ord,
    bid_ntce_nm,
    ntce_instt_nm,
    dminstt_nm,
    api_category,
    bid_clse_dt,
    presmpt_prce
  )
`;

const dateTimeFormatter = new Intl.DateTimeFormat('ko-KR', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
});

const moneyFormatter = new Intl.NumberFormat('ko-KR');

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

function asNumber(value: unknown): number | null {
    if (typeof value === 'number' && Number.isFinite(value)) {
        return value;
    }
    if (typeof value === 'string') {
        const normalized = value.replace(/,/g, '').trim();
        if (!normalized) {
            return null;
        }
        const parsed = Number(normalized);
        return Number.isFinite(parsed) ? parsed : null;
    }
    return null;
}

function formatDateTime(value: string | null | undefined): string {
    if (!value) {
        return '-';
    }

    const parsed = new Date(value);
    if (Number.isNaN(parsed.getTime())) {
        return value;
    }

    return dateTimeFormatter.format(parsed).replace(/\./g, '.').replace(/\s/g, ' ').trim();
}

function formatMoney(value: number | null): string {
    if (value === null) {
        return '정보없음';
    }
    return `${moneyFormatter.format(Math.round(value))}원`;
}

function makeRequestId(): string {
    return `req_${Date.now()}_${Math.random().toString(36).slice(2, 10)}`;
}

function createErrorPayload(code: string, message: string, suggestion: string): BookmarkListError {
    return {
        requestId: makeRequestId(),
        code,
        message,
        suggestion,
    };
}

function normalizeDeadlineFilter(value: string | undefined): BookmarkListFilters['deadline'] {
    if (value === 'urgent' || value === 'week') {
        return value;
    }
    return 'all';
}

function normalizeSortOption(value: string | undefined): BookmarkSortOption {
    if (
        value === 'saved_oldest' ||
        value === 'deadline_soon' ||
        value === 'price_desc' ||
        value === 'title_asc'
    ) {
        return value;
    }
    return 'saved_latest';
}

function normalizeFilters(
    params: Record<string, string | string[] | undefined>
): BookmarkListFilters {
    const category = parseParamValue(params.category) ?? 'all';
    const deadline = normalizeDeadlineFilter(parseParamValue(params.deadline));
    const query = parseParamValue(params.query) ?? '';
    const sort = normalizeSortOption(parseParamValue(params.sort));
    const page = toInteger(parseParamValue(params.page), 1);
    const pageSize = Math.min(100, Math.max(10, toInteger(parseParamValue(params.pageSize), 20)));

    return {
        category,
        deadline,
        query: query.trim(),
        sort,
        page,
        pageSize,
    };
}

function extractNoticeRow(value: unknown): Record<string, unknown> | null {
    if (Array.isArray(value)) {
        if (value.length === 0) {
            return null;
        }
        return asRecord(value[0]);
    }
    return asRecord(value);
}

export function isUrgentDeadline(deadlineAtIso: string | null | undefined, now = new Date()): boolean {
    if (!deadlineAtIso) {
        return false;
    }

    const deadline = new Date(deadlineAtIso);
    if (Number.isNaN(deadline.getTime())) {
        return false;
    }

    const diff = deadline.getTime() - now.getTime();
    return diff > 0 && diff <= 24 * 60 * 60 * 1000;
}

function isWithinWeek(deadlineAtIso: string | null | undefined, now = new Date()): boolean {
    if (!deadlineAtIso) {
        return false;
    }

    const deadline = new Date(deadlineAtIso);
    if (Number.isNaN(deadline.getTime())) {
        return false;
    }

    const diff = deadline.getTime() - now.getTime();
    return diff > 0 && diff <= 7 * 24 * 60 * 60 * 1000;
}

function isClosed(deadlineAtIso: string | null | undefined, now = new Date()): boolean {
    if (!deadlineAtIso) {
        return false;
    }

    const deadline = new Date(deadlineAtIso);
    if (Number.isNaN(deadline.getTime())) {
        return false;
    }

    return deadline.getTime() <= now.getTime();
}

function mapRowToItem(row: Record<string, unknown>, now: Date): BookmarkListItem {
    const notice = extractNoticeRow(row.bid_notices);
    const deadlineAtIso = asString(notice?.bid_clse_dt);

    const category = normalizeCategory(asString(notice?.api_category));

    return {
        scrapId: String(row.id ?? ''),
        noticeId: asString(row.bid_notice_id) ?? asString(notice?.id) ?? '',
        noticeNumber: asString(notice?.bid_ntce_no) ?? '-',
        noticeOrder: asString(notice?.bid_ntce_ord) ?? undefined,
        title: asString(notice?.bid_ntce_nm) ?? '삭제되었거나 비공개된 공고',
        organization: asString(notice?.ntce_instt_nm) ?? '기관 정보 없음',
        demandOrganization: asString(notice?.dminstt_nm) ?? undefined,
        category,
        categoryLabel: getCategoryLabel(category),
        estimatedPrice: asNumber(notice?.presmpt_prce),
        estimatedPriceLabel: formatMoney(asNumber(notice?.presmpt_prce)),
        deadlineAtIso,
        deadlineAtLabel: formatDateTime(deadlineAtIso),
        isDeadlineSoon: isUrgentDeadline(deadlineAtIso, now),
        isClosed: isClosed(deadlineAtIso, now),
        savedAtIso: asString(row.scrapped_at) ?? asString(row.created_at) ?? new Date().toISOString(),
        savedAtLabel: formatDateTime(asString(row.scrapped_at) ?? asString(row.created_at)),
    };
}

function filterItems(items: BookmarkListItem[], filters: BookmarkListFilters, now: Date): BookmarkListItem[] {
    const query = filters.query.toLowerCase();

    return items.filter((item) => {
        if (filters.category !== 'all') {
            const normalizedFilter = normalizeCategory(filters.category);
            if (normalizedFilter !== 'unknown' && normalizeCategory(item.category) !== normalizedFilter) {
                return false;
            }
        }

        if (filters.deadline === 'urgent' && !item.isDeadlineSoon) {
            return false;
        }

        if (filters.deadline === 'week' && !isWithinWeek(item.deadlineAtIso, now)) {
            return false;
        }

        if (query) {
            const target = `${item.title} ${item.noticeNumber} ${item.organization}`.toLowerCase();
            if (!target.includes(query)) {
                return false;
            }
        }

        return true;
    });
}

function parseTime(value: string | null): number {
    if (!value) {
        return Number.POSITIVE_INFINITY;
    }
    const parsed = new Date(value).getTime();
    return Number.isNaN(parsed) ? Number.POSITIVE_INFINITY : parsed;
}

function sortItems(items: BookmarkListItem[], sort: BookmarkSortOption): BookmarkListItem[] {
    return [...items].sort((a, b) => {
        if (sort === 'saved_oldest') {
            return parseTime(a.savedAtIso) - parseTime(b.savedAtIso);
        }

        if (sort === 'deadline_soon') {
            const compared = parseTime(a.deadlineAtIso) - parseTime(b.deadlineAtIso);
            if (compared !== 0) {
                return compared;
            }
            return parseTime(b.savedAtIso) - parseTime(a.savedAtIso);
        }

        if (sort === 'price_desc') {
            const av = a.estimatedPrice ?? Number.NEGATIVE_INFINITY;
            const bv = b.estimatedPrice ?? Number.NEGATIVE_INFINITY;
            if (av !== bv) {
                return bv - av;
            }
            return parseTime(b.savedAtIso) - parseTime(a.savedAtIso);
        }

        if (sort === 'title_asc') {
            const compared = a.title.localeCompare(b.title, 'ko-KR');
            if (compared !== 0) {
                return compared;
            }
            return parseTime(b.savedAtIso) - parseTime(a.savedAtIso);
        }

        return parseTime(b.savedAtIso) - parseTime(a.savedAtIso);
    });
}

function paginate(items: BookmarkListItem[], page: number, pageSize: number): {
    page: number;
    totalPages: number;
    pagedItems: BookmarkListItem[];
} {
    const totalPages = Math.max(1, Math.ceil(items.length / pageSize));
    const normalizedPage = Math.min(Math.max(1, page), totalPages);
    const start = (normalizedPage - 1) * pageSize;

    return {
        page: normalizedPage,
        totalPages,
        pagedItems: items.slice(start, start + pageSize),
    };
}

async function getCurrentUserId(supabase: SupabaseServerClient): Promise<string | null> {
    try {
        const {
            data: { user },
        } = await supabase.auth.getUser();
        return user?.id ?? null;
    } catch {
        return null;
    }
}

export async function getBookmarkListData(
    params: Record<string, string | string[] | undefined>
): Promise<BookmarkListData> {
    const filters = normalizeFilters(params);
    const now = new Date();

    try {
        const supabase = await createClient();
        const userId = await getCurrentUserId(supabase);

        if (!userId) {
            return {
                filters,
                summary: {
                    totalCount: 0,
                    urgentCount: 0,
                    closedCount: 0,
                },
                items: [],
                totalCount: 0,
                totalPages: 1,
                page: 1,
                pageSize: filters.pageSize,
                error: createErrorPayload(
                    'BOOKMARK_AUTH_REQUIRED',
                    '북마크 목록은 로그인 후 확인할 수 있습니다.',
                    '로그인 후 다시 시도해 주세요.'
                ),
            };
        }

        const { data, error } = await supabase
            .from('user_scraps')
            .select(BOOKMARK_SELECT)
            .eq('user_id', userId)
            .order('scrapped_at', { ascending: false })
            .limit(3000);

        if (error || !data) {
            return {
                filters,
                summary: {
                    totalCount: 0,
                    urgentCount: 0,
                    closedCount: 0,
                },
                items: [],
                totalCount: 0,
                totalPages: 1,
                page: 1,
                pageSize: filters.pageSize,
                error: createErrorPayload(
                    'BOOKMARK_QUERY_FAILED',
                    '북마크 목록을 불러오지 못했습니다.',
                    '잠시 후 다시 시도해 주세요.'
                ),
            };
        }

        const mapped = (data as Record<string, unknown>[]).map((row) => mapRowToItem(row, now));
        const filtered = filterItems(mapped, filters, now);
        const sorted = sortItems(filtered, filters.sort);
        const paged = paginate(sorted, filters.page, filters.pageSize);

        return {
            filters: {
                ...filters,
                page: paged.page,
            },
            summary: {
                totalCount: sorted.length,
                urgentCount: sorted.filter((item) => item.isDeadlineSoon).length,
                closedCount: sorted.filter((item) => item.isClosed).length,
            },
            items: paged.pagedItems,
            totalCount: sorted.length,
            totalPages: paged.totalPages,
            page: paged.page,
            pageSize: filters.pageSize,
        };
    } catch {
        return {
            filters,
            summary: {
                totalCount: 0,
                urgentCount: 0,
                closedCount: 0,
            },
            items: [],
            totalCount: 0,
            totalPages: 1,
            page: 1,
            pageSize: filters.pageSize,
            error: createErrorPayload(
                'BOOKMARK_UNEXPECTED_ERROR',
                '북마크 목록 조회 중 오류가 발생했습니다.',
                '잠시 후 다시 시도해 주세요.'
            ),
        };
    }
}
