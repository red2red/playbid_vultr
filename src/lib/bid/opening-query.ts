import { createClient } from '@/lib/supabase/server';
import { normalizeCategory } from './category-normalize';
import type {
    OpeningListError,
    OpeningMyComparison,
    OpeningParticipantItem,
    OpeningResultDetail,
    OpeningResultDetailData,
    OpeningResultFilters,
    OpeningResultListItem,
    OpeningResultsListData,
    OpeningStatus,
    OpeningStatusFilter,
    OpeningSummary,
} from './opening-types';

const OPENING_LIST_SELECT = `
  id,
  bid_ntce_no,
  bid_ntce_ord,
  bid_ntce_nm,
  openg_dt,
  prtcpt_cnum,
  openg_corp_info,
  progrs_div_cd_nm,
  ntce_instt_nm,
  dminstt_nm,
  bid_category,
  metadata
`;

const OPENING_DETAIL_SELECT = `
  id,
  bid_ntce_no,
  bid_ntce_ord,
  bid_ntce_nm,
  openg_dt,
  prtcpt_cnum,
  openg_corp_info,
  progrs_div_cd_nm,
  ntce_instt_nm,
  dminstt_nm,
  bid_category,
  openg_rslt_ntc_cntnts,
  metadata
`;

const dateTimeFormatter = new Intl.DateTimeFormat('ko-KR', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
});

const shortDateFormatter = new Intl.DateTimeFormat('ko-KR', {
    month: '2-digit',
    day: '2-digit',
});

const currencyFormatter = new Intl.NumberFormat('ko-KR');

interface QueryFilters {
    status: OpeningStatusFilter;
    category: string;
    query: string;
    dateFromIso?: string;
    dateToIso?: string;
}

interface ParsedCorpInfo {
    name: string | null;
    amount: number | null;
    rate: number | null;
}

interface WinningMetrics {
    winningCompany: string | null;
    winningAmount: number | null;
    winningRate: number | null;
    adjustmentRate: number | null;
    deviation: number | null;
    basePrice: number | null;
}

interface FilterableQuery<TSelf> {
    eq(column: string, value: unknown): TSelf;
    in(column: string, values: unknown[]): TSelf;
    ilike(column: string, pattern: string): TSelf;
    gte(column: string, value: string): TSelf;
    lte(column: string, value: string): TSelf;
}

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

function makeRequestId(): string {
    return `req_${Date.now()}_${Math.random().toString(36).slice(2, 10)}`;
}

function createErrorPayload(code: string, message: string, suggestion: string): OpeningListError {
    return {
        requestId: makeRequestId(),
        code,
        message,
        suggestion,
    };
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

function formatShortDate(value: string | null): string {
    if (!value) {
        return '-';
    }

    const parsed = new Date(value);
    if (Number.isNaN(parsed.getTime())) {
        return '-';
    }

    return shortDateFormatter.format(parsed).replace(/\./g, '.').replace(/\s/g, '').trim();
}

function formatMoney(value: number | null): string {
    if (value === null) {
        return '정보없음';
    }
    return `${currencyFormatter.format(Math.round(value))}원`;
}

function formatRate(value: number | null): string {
    if (value === null) {
        return '정보없음';
    }
    return `${value.toFixed(3)}%`;
}

function formatSignedRateGap(value: number | null): string {
    if (value === null) {
        return '-';
    }
    return `${value > 0 ? '+' : ''}${value.toFixed(3)}%p`;
}

function formatSignedMoneyGap(value: number | null): string {
    if (value === null) {
        return '-';
    }
    return `${value > 0 ? '+' : ''}${currencyFormatter.format(Math.round(value))}원`;
}

function normalizeDatePreset(value: string | undefined): OpeningResultFilters['datePreset'] {
    if (value === 'today' || value === 'week' || value === 'month') {
        return value;
    }
    return 'all';
}

function normalizeStatus(value: string | undefined): OpeningStatusFilter {
    if (value === 'awarded' || value === 'failed' || value === 'rebid') {
        return value;
    }
    return 'all';
}

function normalizeFilters(
    params: Record<string, string | string[] | undefined>
): OpeningResultFilters {
    const status = normalizeStatus(parseParamValue(params.status));
    const datePreset = normalizeDatePreset(parseParamValue(params.datePreset));
    const dateFrom = parseParamValue(params.dateFrom) ?? '';
    const dateTo = parseParamValue(params.dateTo) ?? '';
    const category = parseParamValue(params.category) ?? 'all';
    const query = parseParamValue(params.query) ?? '';
    const page = toInteger(parseParamValue(params.page), 1);
    const pageSize = Math.min(100, Math.max(10, toInteger(parseParamValue(params.pageSize), 20)));

    return {
        status,
        datePreset,
        dateFrom: dateFrom || undefined,
        dateTo: dateTo || undefined,
        category,
        query,
        page,
        pageSize,
    };
}

function getPresetRange(datePreset: OpeningResultFilters['datePreset']): {
    fromIso?: string;
    toIso?: string;
} {
    if (datePreset === 'all') {
        return {};
    }

    const now = new Date();
    if (datePreset === 'today') {
        const from = new Date(now);
        from.setHours(0, 0, 0, 0);
        const to = new Date(now);
        to.setHours(23, 59, 59, 999);
        return {
            fromIso: from.toISOString(),
            toIso: to.toISOString(),
        };
    }

    if (datePreset === 'week') {
        const from = new Date(now);
        const day = from.getDay();
        const diff = day === 0 ? -6 : 1 - day;
        from.setDate(from.getDate() + diff);
        from.setHours(0, 0, 0, 0);

        const to = new Date(from);
        to.setDate(from.getDate() + 6);
        to.setHours(23, 59, 59, 999);

        return {
            fromIso: from.toISOString(),
            toIso: to.toISOString(),
        };
    }

    const from = new Date(now.getFullYear(), now.getMonth(), 1, 0, 0, 0, 0);
    const to = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59, 999);
    return {
        fromIso: from.toISOString(),
        toIso: to.toISOString(),
    };
}

function parseDateBoundary(value: string | undefined, endOfDay: boolean): string | undefined {
    if (!value) {
        return undefined;
    }

    const parsed = new Date(`${value}${endOfDay ? 'T23:59:59.999Z' : 'T00:00:00.000Z'}`);
    if (Number.isNaN(parsed.getTime())) {
        return undefined;
    }

    return parsed.toISOString();
}

function toQueryFilters(filters: OpeningResultFilters): QueryFilters {
    const customFrom = parseDateBoundary(filters.dateFrom, false);
    const customTo = parseDateBoundary(filters.dateTo, true);

    if (customFrom || customTo) {
        return {
            status: filters.status,
            category: filters.category,
            query: filters.query.trim(),
            dateFromIso: customFrom,
            dateToIso: customTo,
        };
    }

    const preset = getPresetRange(filters.datePreset);
    return {
        status: filters.status,
        category: filters.category,
        query: filters.query.trim(),
        dateFromIso: preset.fromIso,
        dateToIso: preset.toIso,
    };
}

function statusToProgressValues(status: OpeningStatusFilter): string[] {
    if (status === 'awarded') {
        return ['개찰완료', '낙찰'];
    }
    if (status === 'failed') {
        return ['유찰'];
    }
    if (status === 'rebid') {
        return ['재입찰', '재공고'];
    }
    return [];
}

function normalizeOpeningCategory(category: string): string | null {
    if (!category || category === 'all') {
        return null;
    }

    const normalized = normalizeCategory(category);
    if (normalized === 'unknown') {
        return null;
    }
    return normalized;
}

function applyFilters<TQuery extends FilterableQuery<TQuery>>(
    query: TQuery,
    filters: QueryFilters
): TQuery {
    const progressValues = statusToProgressValues(filters.status);
    if (progressValues.length === 1) {
        query = query.eq('progrs_div_cd_nm', progressValues[0]);
    } else if (progressValues.length > 1) {
        query = query.in('progrs_div_cd_nm', progressValues);
    }

    const category = normalizeOpeningCategory(filters.category);
    if (category) {
        query = query.eq('bid_category', category);
    }

    if (filters.query) {
        query = query.ilike('bid_ntce_nm', `%${filters.query}%`);
    }

    if (filters.dateFromIso) {
        query = query.gte('openg_dt', filters.dateFromIso);
    }

    if (filters.dateToIso) {
        query = query.lte('openg_dt', filters.dateToIso);
    }

    return query;
}

export function parseOpeningCorpInfo(rawValue: string | null | undefined): ParsedCorpInfo {
    if (!rawValue) {
        return {
            name: null,
            amount: null,
            rate: null,
        };
    }

    const values = rawValue.split('^').map((value) => value.trim());
    return {
        name: values[0] || null,
        amount: asNumber(values[3]),
        rate: asNumber(values[4]),
    };
}

export function mapOpeningProgressToStatus(rawStatus: string | null | undefined): OpeningStatus {
    if (!rawStatus) {
        return 'unknown';
    }
    if (rawStatus.includes('유찰')) {
        return 'failed';
    }
    if (rawStatus.includes('재입찰') || rawStatus.includes('재공고')) {
        return 'rebid';
    }
    if (rawStatus.includes('개찰완료') || rawStatus.includes('낙찰')) {
        return 'awarded';
    }
    return 'unknown';
}

export function getOpeningStatusLabel(status: OpeningStatus): string {
    if (status === 'awarded') {
        return '낙찰';
    }
    if (status === 'failed') {
        return '유찰';
    }
    if (status === 'rebid') {
        return '재공고';
    }
    return '미정';
}

function extractWinningMetrics(row: Record<string, unknown>): WinningMetrics {
    const metadata = asRecord(row.metadata);
    const competitors = asRecord(metadata?.competitors_stats);
    const topList =
        competitors && Array.isArray(competitors.top_10_list)
            ? competitors.top_10_list
            : competitors && Array.isArray(competitors.all_participants)
              ? competitors.all_participants
              : [];
    const topItem = asRecord(topList[0]);
    const yegaDetails = asRecord(metadata?.yega_details);
    const corpInfo = parseOpeningCorpInfo(asString(row.openg_corp_info));

    const winningCompany =
        asString(metadata?.winner_name) ??
        asString(competitors?.winner_name) ??
        asString(topItem?.name) ??
        corpInfo.name;

    const winningAmount =
        asNumber(metadata?.winner_amount) ??
        asNumber(topItem?.amount) ??
        asNumber(topItem?.bidprcAmt) ??
        corpInfo.amount;

    const winningRate =
        asNumber(metadata?.winner_rate) ??
        asNumber(competitors?.winner_rate) ??
        asNumber(topItem?.rate) ??
        asNumber(topItem?.bidprcrt) ??
        corpInfo.rate;

    const adjustmentRate = asNumber(yegaDetails?.pct);
    const basePrice = asNumber(yegaDetails?.bssamt) ?? asNumber(yegaDetails?.plnprc);
    const deviation =
        winningRate !== null && adjustmentRate !== null ? winningRate - adjustmentRate : null;

    return {
        winningCompany,
        winningAmount,
        winningRate,
        adjustmentRate,
        deviation,
        basePrice,
    };
}

function mapListItem(row: Record<string, unknown>): OpeningResultListItem {
    const openingAtIso = asString(row.openg_dt) ?? new Date().toISOString();
    const winning = extractWinningMetrics(row);

    return {
        id: String(row.id ?? ''),
        bidNoticeNo: asString(row.bid_ntce_no) ?? '-',
        bidNoticeOrd: asString(row.bid_ntce_ord) ?? undefined,
        title: asString(row.bid_ntce_nm) ?? '공고명 미확인',
        organization: asString(row.ntce_instt_nm) ?? '기관 정보 없음',
        demandOrganization: asString(row.dminstt_nm) ?? undefined,
        bidCategory: asString(row.bid_category) ?? 'unknown',
        openingAtIso,
        openingAtLabel: formatDateTime(openingAtIso),
        openingDateShort: formatShortDate(openingAtIso),
        status: mapOpeningProgressToStatus(asString(row.progrs_div_cd_nm)),
        statusRaw: asString(row.progrs_div_cd_nm) ?? undefined,
        participantCount: asNumber(row.prtcpt_cnum),
        winningCompany: winning.winningCompany,
        winningAmount: winning.winningAmount,
        winningAmountLabel: formatMoney(winning.winningAmount),
        winningRate: winning.winningRate,
        winningRateLabel: formatRate(winning.winningRate),
        adjustmentRate: winning.adjustmentRate,
        deviation: winning.deviation,
        deviationLabel: formatSignedRateGap(winning.deviation),
        hasMyBid: false,
    };
}

async function resolveBidNoticeIds(
    supabase: SupabaseServerClient,
    noticeNos: string[]
): Promise<Map<string, string>> {
    if (noticeNos.length === 0) {
        return new Map();
    }

    const { data, error } = await supabase
        .from('bid_notices')
        .select('id,bid_ntce_no')
        .in('bid_ntce_no', noticeNos);

    if (error || !data) {
        return new Map();
    }

    const map = new Map<string, string>();
    (data as Record<string, unknown>[]).forEach((row) => {
        const noticeNo = asString(row.bid_ntce_no);
        const id = asString(row.id);
        if (noticeNo && id) {
            map.set(noticeNo, id);
        }
    });
    return map;
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

async function resolveMyBidNoticeSet(
    supabase: SupabaseServerClient,
    userId: string | null,
    noticeNos: string[]
): Promise<Set<string>> {
    if (!userId || noticeNos.length === 0) {
        return new Set();
    }

    const { data, error } = await supabase
        .from('user_bid_history')
        .select('bid_ntce_no')
        .eq('user_id', userId)
        .in('bid_ntce_no', noticeNos);

    if (error || !data) {
        return new Set();
    }

    const set = new Set<string>();
    (data as Record<string, unknown>[]).forEach((row) => {
        const noticeNo = asString(row.bid_ntce_no);
        if (noticeNo) {
            set.add(noticeNo);
        }
    });
    return set;
}

async function getStatusCount(
    supabase: SupabaseServerClient,
    filters: QueryFilters,
    status: OpeningStatusFilter
): Promise<number> {
    let query = supabase.from('bid_results').select('id', { count: 'exact', head: true });
    query = applyFilters(query, { ...filters, status });
    const { count } = await query;
    return count ?? 0;
}

function average(values: Array<number | null>): number | null {
    const filtered = values.filter((value): value is number => value !== null);
    if (filtered.length === 0) {
        return null;
    }
    const sum = filtered.reduce((acc, value) => acc + value, 0);
    return sum / filtered.length;
}

async function buildSummary(
    supabase: SupabaseServerClient,
    filters: QueryFilters,
    items: OpeningResultListItem[],
    totalCount: number,
    myParticipatedCount: number
): Promise<OpeningSummary> {
    const [awardedCount, failedCount, rebidCount] = await Promise.all([
        getStatusCount(supabase, filters, 'awarded'),
        getStatusCount(supabase, filters, 'failed'),
        getStatusCount(supabase, filters, 'rebid'),
    ]);

    return {
        totalCount,
        awardedCount,
        failedCount,
        rebidCount,
        averageWinningRate: average(items.map((item) => item.winningRate)),
        averageParticipantCount: average(items.map((item) => item.participantCount)),
        myParticipatedCount,
    };
}

function createMockRows(): Record<string, unknown>[] {
    const now = Date.now();
    return [
        {
            id: 1,
            bid_ntce_no: '20260223-OPEN-001',
            bid_ntce_ord: '000',
            bid_ntce_nm: '시청사 냉난방 설비 유지보수 용역',
            openg_dt: new Date(now - 86400000).toISOString(),
            prtcpt_cnum: 12,
            progrs_div_cd_nm: '개찰완료',
            ntce_instt_nm: '서울특별시청',
            dminstt_nm: '서울특별시청',
            bid_category: 'service',
            openg_corp_info: '한빛엔지니어링^1234567890^홍길동^128500000^87.412',
            metadata: {
                yega_details: {
                    pct: 87.100,
                    bssamt: 147000000,
                },
                competitors_stats: {
                    total_count: 12,
                    winner_name: '한빛엔지니어링',
                    winner_rate: 87.412,
                    top_10_list: [
                        { rank: 1, name: '한빛엔지니어링', amount: 128500000, rate: 87.412 },
                        { rank: 2, name: '대성기술', amount: 128920000, rate: 87.698 },
                    ],
                },
            },
        },
        {
            id: 2,
            bid_ntce_no: '20260223-OPEN-002',
            bid_ntce_ord: '000',
            bid_ntce_nm: '도시공원 조성공사',
            openg_dt: new Date(now - 2 * 86400000).toISOString(),
            prtcpt_cnum: 8,
            progrs_div_cd_nm: '유찰',
            ntce_instt_nm: '부산광역시',
            dminstt_nm: '부산광역시',
            bid_category: 'construction',
            openg_corp_info: null,
            metadata: {
                yega_details: {
                    pct: 86.9,
                    bssamt: 220000000,
                },
            },
        },
        {
            id: 3,
            bid_ntce_no: '20260223-OPEN-003',
            bid_ntce_ord: '001',
            bid_ntce_nm: '정보보호 시스템 고도화 구축',
            openg_dt: new Date(now - 3 * 86400000).toISOString(),
            prtcpt_cnum: 5,
            progrs_div_cd_nm: '재입찰',
            ntce_instt_nm: '한국인터넷진흥원',
            dminstt_nm: '한국인터넷진흥원',
            bid_category: 'goods',
            openg_corp_info: null,
            metadata: null,
        },
    ];
}

function createFallbackListData(filters: OpeningResultFilters, error?: OpeningListError): OpeningResultsListData {
    const items = createMockRows().map(mapListItem);
    const summary: OpeningSummary = {
        totalCount: items.length,
        awardedCount: items.filter((item) => item.status === 'awarded').length,
        failedCount: items.filter((item) => item.status === 'failed').length,
        rebidCount: items.filter((item) => item.status === 'rebid').length,
        averageWinningRate: average(items.map((item) => item.winningRate)),
        averageParticipantCount: average(items.map((item) => item.participantCount)),
        myParticipatedCount: 0,
    };

    return {
        filters,
        summary,
        items,
        totalCount: items.length,
        totalPages: 1,
        page: 1,
        pageSize: filters.pageSize,
        ...(error ? { error } : {}),
    };
}

export async function getOpeningResultsListData(
    params: Record<string, string | string[] | undefined>
): Promise<OpeningResultsListData> {
    const filters = normalizeFilters(params);
    const queryFilters = toQueryFilters(filters);
    const fallback = createFallbackListData(filters);

    try {
        const supabase = await createClient();
        const from = (filters.page - 1) * filters.pageSize;
        const to = from + filters.pageSize - 1;

        let query = supabase.from('bid_results').select(OPENING_LIST_SELECT, { count: 'exact' });
        query = applyFilters(query, queryFilters);

        const { data, count, error } = await query
            .order('openg_dt', { ascending: false, nullsFirst: false })
            .range(from, to);

        if (error || !data) {
            return {
                ...fallback,
                error: createErrorPayload(
                    'OPENING_LIST_QUERY_FAILED',
                    '개찰결과 목록을 불러오지 못했습니다.',
                    '잠시 후 다시 시도하거나 필터를 완화해 주세요.'
                ),
            };
        }

        const mappedItems = (data as Record<string, unknown>[]).map(mapListItem);
        const noticeNos = Array.from(new Set(mappedItems.map((item) => item.bidNoticeNo)));
        const noticeIdMap = await resolveBidNoticeIds(supabase, noticeNos);
        const userId = await getCurrentUserId(supabase);
        const myBidNos = await resolveMyBidNoticeSet(supabase, userId, noticeNos);

        const items = mappedItems.map((item) => ({
            ...item,
            bidNoticeId: noticeIdMap.get(item.bidNoticeNo),
            hasMyBid: myBidNos.has(item.bidNoticeNo),
        }));

        const totalCount = count ?? 0;
        const summary = await buildSummary(supabase, queryFilters, items, totalCount, myBidNos.size);
        const totalPages = Math.max(1, Math.ceil(totalCount / filters.pageSize));
        const normalizedPage = Math.min(filters.page, totalPages);

        return {
            filters: {
                ...filters,
                page: normalizedPage,
            },
            summary,
            items,
            totalCount,
            totalPages,
            page: normalizedPage,
            pageSize: filters.pageSize,
        };
    } catch {
        return {
            ...fallback,
            error: createErrorPayload(
                'OPENING_LIST_UNEXPECTED_ERROR',
                '개찰결과 목록 조회 중 예기치 못한 오류가 발생했습니다.',
                '잠시 후 다시 시도해 주세요.'
            ),
        };
    }
}

function parseParticipants(
    metadata: Record<string, unknown> | null,
    winningCompany: string | null,
    fallbackCorpInfo: ParsedCorpInfo
): OpeningParticipantItem[] {
    const competitors = asRecord(metadata?.competitors_stats);
    const topList =
        competitors && Array.isArray(competitors.all_participants)
            ? competitors.all_participants
            : competitors && Array.isArray(competitors.top_10_list)
              ? competitors.top_10_list
              : [];

    const participants: OpeningParticipantItem[] = (topList as unknown[]).map((entry, index) => {
        const row = asRecord(entry) ?? {};
        const rank = asNumber(row.rank) ?? asNumber(row.opengRank) ?? index + 1;
        const companyName = asString(row.name) ?? asString(row.prcbdrNm) ?? `참가업체 ${index + 1}`;
        const bidAmount = asNumber(row.amount) ?? asNumber(row.bidprcAmt) ?? null;
        const bidRate = asNumber(row.rate) ?? asNumber(row.bidprcrt) ?? null;

        const isWinner =
            rank === 1 || (winningCompany !== null && companyName.includes(winningCompany));

        return {
            rank,
            companyName,
            bidAmount,
            bidAmountLabel: formatMoney(bidAmount),
            bidRate,
            bidRateLabel: formatRate(bidRate),
            isWinner,
        };
    });

    if (participants.length > 0) {
        return participants.sort((a, b) => a.rank - b.rank);
    }

    if (fallbackCorpInfo.name || fallbackCorpInfo.amount || fallbackCorpInfo.rate) {
        return [
            {
                rank: 1,
                companyName: fallbackCorpInfo.name ?? '낙찰업체',
                bidAmount: fallbackCorpInfo.amount,
                bidAmountLabel: formatMoney(fallbackCorpInfo.amount),
                bidRate: fallbackCorpInfo.rate,
                bidRateLabel: formatRate(fallbackCorpInfo.rate),
                isWinner: true,
            },
        ];
    }

    return [];
}

function buildSuggestedMessage(amountGap: number | null, rateGap: number | null): string {
    if (amountGap === null) {
        return '내 입찰 금액 정보가 없어 비교 분석을 제공하지 못했습니다.';
    }

    const absAmountGap = Math.abs(amountGap);
    if (absAmountGap <= 1000000) {
        return '낙찰가와 근접했습니다. 다음 입찰에서도 현재 전략을 유지해 보세요.';
    }

    if (rateGap !== null && rateGap > 0) {
        return '낙찰률 대비 투찰률이 높았습니다. 투찰률을 소폭 낮춰 재도전해 보세요.';
    }

    return '낙찰률 대비 투찰률이 낮았습니다. 입찰 금액을 소폭 상향하는 전략을 검토해 보세요.';
}

async function buildMyComparison(
    supabase: SupabaseServerClient,
    bidNoticeNo: string,
    basePrice: number | null,
    winningAmount: number | null,
    winningRate: number | null
): Promise<OpeningMyComparison | null> {
    const userId = await getCurrentUserId(supabase);
    if (!userId) {
        return null;
    }

    const { data, error } = await supabase
        .from('user_bid_history')
        .select('predicted_price')
        .eq('user_id', userId)
        .eq('bid_ntce_no', bidNoticeNo)
        .order('prediction_made_at', { ascending: false })
        .limit(1);

    if (error || !data || data.length === 0) {
        return null;
    }

    const myBidAmount = asNumber((data[0] as Record<string, unknown>).predicted_price);
    if (myBidAmount === null) {
        return null;
    }

    const myBidRate = basePrice && basePrice > 0 ? (myBidAmount / basePrice) * 100 : null;
    const amountGap = winningAmount !== null ? myBidAmount - winningAmount : null;
    const rateGap = myBidRate !== null && winningRate !== null ? myBidRate - winningRate : null;

    return {
        myBidAmount,
        myBidAmountLabel: formatMoney(myBidAmount),
        myBidRate,
        myBidRateLabel: formatRate(myBidRate),
        winningAmount,
        winningAmountLabel: formatMoney(winningAmount),
        winningRate,
        winningRateLabel: formatRate(winningRate),
        amountGap,
        amountGapLabel: formatSignedMoneyGap(amountGap),
        rateGap,
        rateGapLabel: formatSignedRateGap(rateGap),
        suggestedMessage: buildSuggestedMessage(amountGap, rateGap),
    };
}

function createMockDetail(id: string): OpeningResultDetail {
    const row = createMockRows()[0];
    const listItem = mapListItem(row);
    const metadata = asRecord(row.metadata);
    const fallbackCorpInfo = parseOpeningCorpInfo(asString(row.openg_corp_info));
    const participants = parseParticipants(metadata, listItem.winningCompany, fallbackCorpInfo);

    return {
        id,
        bidNoticeNo: listItem.bidNoticeNo,
        bidNoticeOrd: listItem.bidNoticeOrd,
        title: listItem.title,
        organization: listItem.organization,
        demandOrganization: listItem.demandOrganization,
        bidCategory: listItem.bidCategory,
        status: listItem.status,
        statusRaw: listItem.statusRaw,
        openingAtIso: listItem.openingAtIso,
        openingAtLabel: listItem.openingAtLabel,
        resultNotice: '개찰결과는 시뮬레이션 데이터입니다.',
        participantCount: listItem.participantCount,
        participantCountLabel:
            listItem.participantCount !== null ? `${listItem.participantCount}개사` : '정보없음',
        winningCompany: listItem.winningCompany,
        winningAmount: listItem.winningAmount,
        winningAmountLabel: listItem.winningAmountLabel,
        winningRate: listItem.winningRate,
        winningRateLabel: listItem.winningRateLabel,
        adjustmentRate: listItem.adjustmentRate,
        adjustmentRateLabel: formatRate(listItem.adjustmentRate),
        deviation: listItem.deviation,
        deviationLabel: listItem.deviationLabel,
        participants,
        myComparison: null,
    };
}

export async function getOpeningResultDetailData(id: string): Promise<OpeningResultDetailData> {
    const fallbackDetail = createMockDetail(id);

    try {
        const supabase = await createClient();
        const query = supabase.from('bid_results').select(OPENING_DETAIL_SELECT).limit(1);
        const { data, error } =
            /^\d+$/.test(id) && Number(id) > 0
                ? await query.eq('id', Number(id))
                : await query.eq('bid_ntce_no', id);

        if (error || !data || data.length === 0) {
            return {
                detail: fallbackDetail,
                error: createErrorPayload(
                    'OPENING_DETAIL_NOT_FOUND',
                    '요청한 개찰결과를 찾지 못했습니다.',
                    '목록에서 다른 개찰결과를 선택해 주세요.'
                ),
            };
        }

        const row = data[0] as Record<string, unknown>;
        const listItem = mapListItem(row);
        const metadata = asRecord(row.metadata);
        const fallbackCorpInfo = parseOpeningCorpInfo(asString(row.openg_corp_info));
        const winning = extractWinningMetrics(row);
        const participants = parseParticipants(metadata, listItem.winningCompany, fallbackCorpInfo);
        const myComparison = await buildMyComparison(
            supabase,
            listItem.bidNoticeNo,
            winning.basePrice,
            listItem.winningAmount,
            listItem.winningRate
        );

        const noticeMap = await resolveBidNoticeIds(supabase, [listItem.bidNoticeNo]);

        return {
            detail: {
                id: listItem.id,
                bidNoticeNo: listItem.bidNoticeNo,
                bidNoticeOrd: listItem.bidNoticeOrd,
                title: listItem.title,
                organization: listItem.organization,
                demandOrganization: listItem.demandOrganization,
                bidCategory: listItem.bidCategory,
                status: listItem.status,
                statusRaw: listItem.statusRaw,
                openingAtIso: listItem.openingAtIso,
                openingAtLabel: listItem.openingAtLabel,
                resultNotice: asString(row.openg_rslt_ntc_cntnts) ?? undefined,
                participantCount: listItem.participantCount,
                participantCountLabel:
                    listItem.participantCount !== null
                        ? `${listItem.participantCount}개사`
                        : '정보없음',
                winningCompany: listItem.winningCompany,
                winningAmount: listItem.winningAmount,
                winningAmountLabel: listItem.winningAmountLabel,
                winningRate: listItem.winningRate,
                winningRateLabel: listItem.winningRateLabel,
                adjustmentRate: listItem.adjustmentRate,
                adjustmentRateLabel: formatRate(listItem.adjustmentRate),
                deviation: listItem.deviation,
                deviationLabel: listItem.deviationLabel,
                participants,
                myComparison,
                bidNoticeId: noticeMap.get(listItem.bidNoticeNo),
            },
        };
    } catch {
        return {
            detail: fallbackDetail,
            error: createErrorPayload(
                'OPENING_DETAIL_UNEXPECTED_ERROR',
                '개찰결과 상세를 불러오는 중 오류가 발생했습니다.',
                '잠시 후 다시 시도해 주세요.'
            ),
        };
    }
}
