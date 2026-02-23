import { createClient } from '@/lib/supabase/server';
import { getCategoryLabel, normalizeCategory } from './category-normalize';
import type {
    BidHistoryAnalysisData,
    BidHistoryAnalysisDetail,
    BidHistoryCategoryStat,
    BidHistoryComparison,
    BidHistoryCsvPayload,
    BidHistoryError,
    BidHistoryFilters,
    BidHistoryListData,
    BidHistoryListItem,
    BidHistoryMonthlyTrend,
    BidHistoryParticipant,
    BidHistorySortOption,
    BidHistoryStatus,
    BidHistoryStatusFilter,
    BidHistorySummary,
} from './bid-history-types';

const BID_HISTORY_SELECT = `
  id,
  user_id,
  bid_notice_id,
  bid_ntce_no,
  predicted_price,
  confidence_level,
  prediction_reason,
  actual_price,
  actual_winner,
  accuracy_rate,
  price_difference,
  price_difference_percent,
  result_type,
  is_success,
  prediction_made_at,
  created_at,
  updated_at,
  virtual_rank,
  total_participants,
  rank_percentile,
  metadata,
  notes,
  bid_notices (
    id,
    bid_ntce_no,
    bid_ntce_ord,
    bid_ntce_nm,
    ntce_instt_nm,
    dminstt_nm,
    api_category,
    presmpt_prce,
    bid_clse_dt,
    openg_dt
  )
`;

const BID_RESULT_SELECT = `
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
  openg_rslt_ntc_cntnts,
  bid_category,
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

const moneyFormatter = new Intl.NumberFormat('ko-KR');

type SupabaseServerClient = Awaited<ReturnType<typeof createClient>>;

interface DateRange {
    fromIso?: string;
    toIso?: string;
}

interface WinningInfo {
    winningAmount: number | null;
    winningRate: number | null;
    winningCompany: string | null;
    basePrice: number | null;
    participantCount: number | null;
    resultNotice: string | null;
}

interface BidHistoryCollection {
    filters: BidHistoryFilters;
    items: BidHistoryListItem[];
    organizationOptions: string[];
    error?: BidHistoryError;
}

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

function toBoolean(value: string | undefined): boolean {
    if (!value) {
        return false;
    }
    const normalized = value.toLowerCase().trim();
    return normalized === '1' || normalized === 'true' || normalized === 'yes' || normalized === 'on';
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

function asBoolean(value: unknown): boolean | null {
    if (typeof value === 'boolean') {
        return value;
    }
    if (typeof value === 'string') {
        const normalized = value.toLowerCase().trim();
        if (normalized === 'true') {
            return true;
        }
        if (normalized === 'false') {
            return false;
        }
    }
    return null;
}

function makeRequestId(): string {
    return `req_${Date.now()}_${Math.random().toString(36).slice(2, 10)}`;
}

function createErrorPayload(code: string, message: string, suggestion: string): BidHistoryError {
    return {
        requestId: makeRequestId(),
        code,
        message,
        suggestion,
    };
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

function formatRate(value: number | null): string {
    if (value === null) {
        return '정보없음';
    }
    return `${value.toFixed(3)}%`;
}

function formatSignedRate(value: number | null): string {
    if (value === null) {
        return '-';
    }
    return `${value > 0 ? '+' : ''}${value.toFixed(3)}%p`;
}

function formatSignedMoney(value: number | null): string {
    if (value === null) {
        return '-';
    }
    return `${value > 0 ? '+' : ''}${moneyFormatter.format(Math.round(value))}원`;
}

function normalizeDatePreset(value: string | undefined): BidHistoryFilters['datePreset'] {
    if (value === '1m' || value === '3m' || value === '6m' || value === 'custom') {
        return value;
    }
    return 'all';
}

function normalizeStatusFilter(value: string | undefined): BidHistoryStatusFilter {
    if (value === 'success' || value === 'fail' || value === 'pending' || value === 'void') {
        return value;
    }
    return 'all';
}

function normalizeSortOption(value: string | undefined): BidHistorySortOption {
    if (
        value === 'oldest' ||
        value === 'bid_amount_desc' ||
        value === 'bid_amount_asc' ||
        value === 'confidence_desc' ||
        value === 'deviation_asc'
    ) {
        return value;
    }
    return 'latest';
}

function normalizeFilters(
    params: Record<string, string | string[] | undefined>
): BidHistoryFilters {
    const status = normalizeStatusFilter(parseParamValue(params.status));
    const datePreset = normalizeDatePreset(parseParamValue(params.datePreset));
    const dateFrom = parseParamValue(params.dateFrom) ?? '';
    const dateTo = parseParamValue(params.dateTo) ?? '';
    const organization = parseParamValue(params.organization) ?? '';
    const category = parseParamValue(params.category) ?? 'all';
    const query = parseParamValue(params.query) ?? '';
    const sort = normalizeSortOption(parseParamValue(params.sort));
    const onlyWithResult = toBoolean(parseParamValue(params.onlyWithResult));
    const page = toInteger(parseParamValue(params.page), 1);
    const pageSize = Math.min(100, Math.max(10, toInteger(parseParamValue(params.pageSize), 20)));

    return {
        status,
        datePreset,
        dateFrom: dateFrom || undefined,
        dateTo: dateTo || undefined,
        organization: organization.trim(),
        category,
        query: query.trim(),
        onlyWithResult,
        sort,
        page,
        pageSize,
    };
}

function resolveDateRange(filters: BidHistoryFilters): DateRange {
    const customFrom = filters.dateFrom ? new Date(filters.dateFrom) : null;
    const customTo = filters.dateTo ? new Date(filters.dateTo) : null;

    if (filters.datePreset === 'custom' || customFrom || customTo) {
        const range: DateRange = {};
        if (customFrom && !Number.isNaN(customFrom.getTime())) {
            customFrom.setHours(0, 0, 0, 0);
            range.fromIso = customFrom.toISOString();
        }
        if (customTo && !Number.isNaN(customTo.getTime())) {
            customTo.setHours(23, 59, 59, 999);
            range.toIso = customTo.toISOString();
        }
        return range;
    }

    if (filters.datePreset === 'all') {
        return {};
    }

    const now = new Date();
    const from = new Date(now);

    if (filters.datePreset === '1m') {
        from.setMonth(from.getMonth() - 1);
    } else if (filters.datePreset === '3m') {
        from.setMonth(from.getMonth() - 3);
    } else if (filters.datePreset === '6m') {
        from.setMonth(from.getMonth() - 6);
    }

    from.setHours(0, 0, 0, 0);
    return {
        fromIso: from.toISOString(),
        toIso: now.toISOString(),
    };
}

const SUCCESS_KEYWORDS = ['success', 'exact', 'close', 'win', '낙찰'];
const FAIL_KEYWORDS = ['fail', 'miss', 'far', 'lose', '패찰'];
const VOID_KEYWORDS = ['void', 'cancel', '유찰', '무효'];
const PENDING_KEYWORDS = ['pending', 'wait', '대기'];

function includesAny(text: string, keywords: string[]): boolean {
    return keywords.some((keyword) => text.includes(keyword));
}

export function mapBidHistoryResultToStatus(
    resultType: string | null | undefined,
    isSuccess?: boolean | null
): BidHistoryStatus {
    const normalized = (resultType ?? '').toLowerCase().trim();

    if (normalized && includesAny(normalized, SUCCESS_KEYWORDS)) {
        return 'success';
    }
    if (normalized && includesAny(normalized, FAIL_KEYWORDS)) {
        return 'fail';
    }
    if (normalized && includesAny(normalized, VOID_KEYWORDS)) {
        return 'void';
    }
    if (normalized && includesAny(normalized, PENDING_KEYWORDS)) {
        return 'pending';
    }

    if (isSuccess === true) {
        return 'success';
    }
    if (isSuccess === false) {
        return 'fail';
    }

    return 'unknown';
}

function mapOpeningProgressToHistoryStatus(progress: string | null | undefined): BidHistoryStatus {
    const normalized = (progress ?? '').toLowerCase().trim();

    if (!normalized) {
        return 'unknown';
    }

    if (normalized.includes('유찰') || normalized.includes('취소') || normalized.includes('무효')) {
        return 'void';
    }

    if (normalized.includes('개찰') || normalized.includes('낙찰')) {
        return 'success';
    }

    if (normalized.includes('재입찰') || normalized.includes('재공고')) {
        return 'pending';
    }

    return 'unknown';
}

export function getBidHistoryStatusLabel(status: BidHistoryStatus): string {
    switch (status) {
        case 'success':
            return '낙찰';
        case 'fail':
            return '패찰';
        case 'pending':
            return '대기';
        case 'void':
            return '유찰';
        default:
            return '미정';
    }
}

function normalizeHistoryCategory(category: string | null | undefined): string {
    const normalized = normalizeCategory(category);
    if (normalized === 'unknown') {
        return 'unknown';
    }
    return normalized;
}

function getHistoryCategoryLabel(category: string): string {
    const normalized = normalizeCategory(category);
    return getCategoryLabel(normalized);
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

function parseOpeningCorpInfo(rawValue: string | null | undefined): {
    company: string | null;
    amount: number | null;
    rate: number | null;
} {
    if (!rawValue) {
        return {
            company: null,
            amount: null,
            rate: null,
        };
    }

    const parts = rawValue.split('^');
    return {
        company: parts[0]?.trim() || null,
        amount: asNumber(parts[3]),
        rate: asNumber(parts[4]),
    };
}

function extractWinningInfo(resultRow: Record<string, unknown> | null): WinningInfo {
    if (!resultRow) {
        return {
            winningAmount: null,
            winningRate: null,
            winningCompany: null,
            basePrice: null,
            participantCount: null,
            resultNotice: null,
        };
    }

    const metadata = asRecord(resultRow.metadata);
    const competitors = asRecord(metadata?.competitors_stats);
    const yegaDetails = asRecord(metadata?.yega_details);
    const corpInfo = parseOpeningCorpInfo(asString(resultRow.openg_corp_info));

    const winningAmount =
        asNumber(competitors?.winner_amount) ??
        asNumber(competitors?.winner_bid_amount) ??
        asNumber(competitors?.winning_amount) ??
        corpInfo.amount;

    const winningRate =
        asNumber(competitors?.winner_rate) ??
        asNumber(competitors?.winning_rate) ??
        asNumber(competitors?.winner_bid_rate) ??
        corpInfo.rate;

    const winningCompany =
        asString(competitors?.winner_name) ?? asString(competitors?.winner_nm) ?? corpInfo.company;

    const basePrice = asNumber(yegaDetails?.plnprc) ?? asNumber(yegaDetails?.bssamt);

    return {
        winningAmount,
        winningRate,
        winningCompany,
        basePrice,
        participantCount: asNumber(resultRow.prtcpt_cnum),
        resultNotice: asString(resultRow.openg_rslt_ntc_cntnts),
    };
}

function buildPredictedRankLabel(virtualRank: number | null, totalParticipants: number | null): string {
    if (virtualRank === null || totalParticipants === null) {
        return '-';
    }
    return `${virtualRank}위 / ${totalParticipants}개사`;
}

function mapHistoryRow(
    row: Record<string, unknown>,
    resultRow: Record<string, unknown> | null
): BidHistoryListItem {
    const notice = extractNoticeRow(row.bid_notices);

    const bidNoticeNo =
        asString(row.bid_ntce_no) ?? asString(notice?.bid_ntce_no) ?? asString(resultRow?.bid_ntce_no) ?? '-';

    const bidNoticeOrd =
        asString(notice?.bid_ntce_ord) ?? asString(resultRow?.bid_ntce_ord) ?? undefined;

    const predictionMadeAtIso =
        asString(row.prediction_made_at) ?? asString(row.created_at) ?? new Date().toISOString();

    const predictedPrice = asNumber(row.predicted_price) ?? 0;

    const winningInfo = extractWinningInfo(resultRow);

    const winningAmount = asNumber(row.actual_price) ?? winningInfo.winningAmount;
    const basePrice =
        asNumber(notice?.presmpt_prce) ?? winningInfo.basePrice ?? (winningAmount !== null ? winningAmount : null);

    const predictedRate =
        basePrice !== null && basePrice > 0 ? (predictedPrice / basePrice) * 100 : null;

    const winningRate =
        winningAmount !== null && basePrice !== null && basePrice > 0
            ? (winningAmount / basePrice) * 100
            : winningInfo.winningRate;

    const differenceAmount =
        winningAmount !== null ? predictedPrice - winningAmount : asNumber(row.price_difference);

    const deviationPercent =
        asNumber(row.price_difference_percent) ??
        (winningAmount !== null && winningAmount !== 0
            ? ((predictedPrice - winningAmount) / winningAmount) * 100
            : null);

    let status = mapBidHistoryResultToStatus(asString(row.result_type), asBoolean(row.is_success));

    if (status === 'unknown') {
        if (winningAmount !== null) {
            status = asBoolean(row.is_success) === true ? 'success' : 'fail';
        } else {
            status = 'pending';
        }
    }

    const openingProgressStatus = mapOpeningProgressToHistoryStatus(asString(resultRow?.progrs_div_cd_nm));
    if (status === 'pending' && openingProgressStatus === 'void') {
        status = 'void';
    }

    const category = normalizeHistoryCategory(
        asString(notice?.api_category) ?? asString(resultRow?.bid_category)
    );

    const totalParticipants =
        asNumber(row.total_participants) ?? winningInfo.participantCount;

    const confidenceLevel = asNumber(row.confidence_level);

    return {
        id: String(row.id ?? ''),
        bidNoticeId: asString(row.bid_notice_id) ?? asString(notice?.id) ?? undefined,
        bidNoticeNo,
        bidNoticeOrd,
        title:
            asString(notice?.bid_ntce_nm) ??
            asString(resultRow?.bid_ntce_nm) ??
            '공고명 미확인',
        organization:
            asString(notice?.ntce_instt_nm) ??
            asString(resultRow?.ntce_instt_nm) ??
            '기관 정보 없음',
        demandOrganization:
            asString(notice?.dminstt_nm) ?? asString(resultRow?.dminstt_nm) ?? undefined,
        category,
        categoryLabel: getHistoryCategoryLabel(category),
        status,
        statusRaw: asString(row.result_type) ?? undefined,
        predictionMadeAtIso,
        predictionMadeAtLabel: formatDateTime(predictionMadeAtIso),
        predictedPrice,
        predictedPriceLabel: formatMoney(predictedPrice),
        predictedRate,
        predictedRateLabel: formatRate(predictedRate),
        confidenceLevel,
        confidenceLabel: confidenceLevel !== null ? `${Math.round(confidenceLevel)}%` : '-',
        virtualRank: asNumber(row.virtual_rank),
        totalParticipants,
        predictedRankLabel: buildPredictedRankLabel(asNumber(row.virtual_rank), totalParticipants),
        hasResult: winningAmount !== null,
        winningAmount,
        winningAmountLabel: formatMoney(winningAmount),
        winningRate,
        winningRateLabel: formatRate(winningRate),
        deviationPercent,
        deviationPercentLabel: formatSignedRate(deviationPercent),
        differenceAmount,
        differenceAmountLabel: formatSignedMoney(differenceAmount),
        actualWinner: asString(row.actual_winner) ?? winningInfo.winningCompany,
        accuracyRate: asNumber(row.accuracy_rate),
        accuracyRateLabel: formatRate(asNumber(row.accuracy_rate)),
        bidResultId: asString(resultRow?.id) ?? undefined,
    };
}

function parseParticipants(
    resultRow: Record<string, unknown> | null,
    fallbackCompany: string | null,
    fallbackAmount: number | null,
    fallbackRate: number | null
): BidHistoryParticipant[] {
    const metadata = asRecord(resultRow?.metadata);
    const competitors = asRecord(metadata?.competitors_stats);

    const candidateList =
        competitors && Array.isArray(competitors.all_participants)
            ? competitors.all_participants
            : competitors && Array.isArray(competitors.top_10_list)
              ? competitors.top_10_list
              : [];

    const participants = (candidateList as unknown[])
        .map((entry, index) => {
            const row = asRecord(entry) ?? {};
            const rank = asNumber(row.rank) ?? asNumber(row.opengRank) ?? index + 1;
            const companyName =
                asString(row.name) ?? asString(row.prcbdrNm) ?? `참가업체 ${index + 1}`;
            const bidAmount = asNumber(row.amount) ?? asNumber(row.bidprcAmt) ?? null;
            const bidRate = asNumber(row.rate) ?? asNumber(row.bidprcrt) ?? null;

            return {
                rank,
                companyName,
                bidAmount,
                bidAmountLabel: formatMoney(bidAmount),
                bidRate,
                bidRateLabel: formatRate(bidRate),
                isWinner:
                    rank === 1 ||
                    (fallbackCompany !== null && companyName.includes(fallbackCompany)),
            };
        })
        .sort((a, b) => a.rank - b.rank);

    if (participants.length > 0) {
        return participants;
    }

    if (fallbackCompany || fallbackAmount || fallbackRate) {
        return [
            {
                rank: 1,
                companyName: fallbackCompany ?? '낙찰업체',
                bidAmount: fallbackAmount,
                bidAmountLabel: formatMoney(fallbackAmount),
                bidRate: fallbackRate,
                bidRateLabel: formatRate(fallbackRate),
                isWinner: true,
            },
        ];
    }

    return [];
}

function matchesCategory(item: BidHistoryListItem, categoryFilter: string): boolean {
    if (!categoryFilter || categoryFilter === 'all') {
        return true;
    }

    const normalizedFilter = normalizeCategory(categoryFilter);
    if (normalizedFilter === 'unknown') {
        return true;
    }

    return normalizeCategory(item.category) === normalizedFilter;
}

function applyLocalFilters(items: BidHistoryListItem[], filters: BidHistoryFilters): BidHistoryListItem[] {
    const query = filters.query.toLowerCase();
    const organization = filters.organization.toLowerCase();

    return items.filter((item) => {
        if (filters.status !== 'all' && item.status !== filters.status) {
            return false;
        }

        if (!matchesCategory(item, filters.category)) {
            return false;
        }

        if (filters.onlyWithResult && !item.hasResult) {
            return false;
        }

        if (organization && !item.organization.toLowerCase().includes(organization)) {
            return false;
        }

        if (query) {
            const target = `${item.title} ${item.bidNoticeNo} ${item.organization}`.toLowerCase();
            if (!target.includes(query)) {
                return false;
            }
        }

        return true;
    });
}

function compareNumber(a: number | null, b: number | null, ascending: boolean): number {
    const nullScore = ascending ? Number.POSITIVE_INFINITY : Number.NEGATIVE_INFINITY;
    const av = a ?? nullScore;
    const bv = b ?? nullScore;
    return ascending ? av - bv : bv - av;
}

function sortItems(items: BidHistoryListItem[], sort: BidHistorySortOption): BidHistoryListItem[] {
    return [...items].sort((a, b) => {
        if (sort === 'oldest') {
            return a.predictionMadeAtIso.localeCompare(b.predictionMadeAtIso);
        }

        if (sort === 'bid_amount_desc') {
            return b.predictedPrice - a.predictedPrice;
        }

        if (sort === 'bid_amount_asc') {
            return a.predictedPrice - b.predictedPrice;
        }

        if (sort === 'confidence_desc') {
            const compared = compareNumber(a.confidenceLevel, b.confidenceLevel, false);
            if (compared !== 0) {
                return compared;
            }
            return b.predictionMadeAtIso.localeCompare(a.predictionMadeAtIso);
        }

        if (sort === 'deviation_asc') {
            const av = a.deviationPercent !== null ? Math.abs(a.deviationPercent) : null;
            const bv = b.deviationPercent !== null ? Math.abs(b.deviationPercent) : null;
            const compared = compareNumber(av, bv, true);
            if (compared !== 0) {
                return compared;
            }
            return b.predictionMadeAtIso.localeCompare(a.predictionMadeAtIso);
        }

        return b.predictionMadeAtIso.localeCompare(a.predictionMadeAtIso);
    });
}

function average(values: Array<number | null>): number | null {
    const filtered = values.filter((value): value is number => value !== null && Number.isFinite(value));
    if (filtered.length === 0) {
        return null;
    }
    return filtered.reduce((acc, value) => acc + value, 0) / filtered.length;
}

function buildSummary(items: BidHistoryListItem[]): BidHistorySummary {
    const totalCount = items.length;
    const successCount = items.filter((item) => item.status === 'success').length;
    const failCount = items.filter((item) => item.status === 'fail').length;
    const pendingCount = items.filter((item) => item.status === 'pending').length;
    const voidCount = items.filter((item) => item.status === 'void').length;

    return {
        totalCount,
        successCount,
        failCount,
        pendingCount,
        voidCount,
        withResultCount: items.filter((item) => item.hasResult).length,
        successRate: totalCount > 0 ? (successCount / totalCount) * 100 : null,
        averageDeviationPercent: average(
            items.map((item) =>
                item.deviationPercent !== null ? Math.abs(item.deviationPercent) : null
            )
        ),
        averageBidRate: average(items.map((item) => item.predictedRate)),
    };
}

function buildCategoryStats(items: BidHistoryListItem[]): BidHistoryCategoryStat[] {
    const grouped = new Map<
        string,
        {
            totalCount: number;
            successCount: number;
            rates: Array<number | null>;
        }
    >();

    items.forEach((item) => {
        const key = item.category;
        const current = grouped.get(key) ?? {
            totalCount: 0,
            successCount: 0,
            rates: [],
        };

        current.totalCount += 1;
        current.successCount += item.status === 'success' ? 1 : 0;
        current.rates.push(item.predictedRate);

        grouped.set(key, current);
    });

    return Array.from(grouped.entries())
        .map(([category, value]) => ({
            category,
            categoryLabel: getHistoryCategoryLabel(category),
            totalCount: value.totalCount,
            successCount: value.successCount,
            successRate: value.totalCount > 0 ? (value.successCount / value.totalCount) * 100 : null,
            averageBidRate: average(value.rates),
        }))
        .sort((a, b) => b.totalCount - a.totalCount);
}

function formatMonthLabel(monthKey: string): string {
    const [year, month] = monthKey.split('-');
    if (!year || !month) {
        return monthKey;
    }
    return `${year}.${month}`;
}

function buildMonthlyTrends(items: BidHistoryListItem[]): BidHistoryMonthlyTrend[] {
    const grouped = new Map<string, { totalCount: number; successCount: number }>();

    items.forEach((item) => {
        const date = new Date(item.predictionMadeAtIso);
        if (Number.isNaN(date.getTime())) {
            return;
        }

        const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
        const current = grouped.get(monthKey) ?? { totalCount: 0, successCount: 0 };
        current.totalCount += 1;
        current.successCount += item.status === 'success' ? 1 : 0;
        grouped.set(monthKey, current);
    });

    return Array.from(grouped.entries())
        .map(([monthKey, value]) => ({
            monthKey,
            monthLabel: formatMonthLabel(monthKey),
            totalCount: value.totalCount,
            successCount: value.successCount,
            successRate: value.totalCount > 0 ? (value.successCount / value.totalCount) * 100 : null,
        }))
        .sort((a, b) => b.monthKey.localeCompare(a.monthKey))
        .slice(0, 12);
}

function chunkArray<T>(items: T[], size: number): T[][] {
    const chunks: T[][] = [];
    for (let index = 0; index < items.length; index += size) {
        chunks.push(items.slice(index, index + size));
    }
    return chunks;
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

async function loadBidResultMap(
    supabase: SupabaseServerClient,
    bidNoticeNos: string[]
): Promise<Map<string, Record<string, unknown>>> {
    const rowsByNoticeNo = new Map<string, Record<string, unknown>>();

    if (bidNoticeNos.length === 0) {
        return rowsByNoticeNo;
    }

    const chunks = chunkArray(Array.from(new Set(bidNoticeNos)), 200);

    const chunkResults = await Promise.all(
        chunks.map(async (chunk) => {
            const { data, error } = await supabase
                .from('bid_results')
                .select(BID_RESULT_SELECT)
                .in('bid_ntce_no', chunk)
                .order('openg_dt', { ascending: false, nullsFirst: false });

            if (error || !data) {
                return [];
            }

            return data as Record<string, unknown>[];
        })
    );

    chunkResults.flat().forEach((row) => {
        const bidNoticeNo = asString(row.bid_ntce_no);
        if (!bidNoticeNo) {
            return;
        }
        if (!rowsByNoticeNo.has(bidNoticeNo)) {
            rowsByNoticeNo.set(bidNoticeNo, row);
        }
    });

    return rowsByNoticeNo;
}

async function fetchAllBidHistoryRows(
    supabase: SupabaseServerClient,
    userId: string,
    range: DateRange
): Promise<{
    rows: Record<string, unknown>[];
    error?: BidHistoryError;
}> {
    const batchSize = 500;
    const maxRows = 50000;
    let offset = 0;
    const rows: Record<string, unknown>[] = [];

    while (offset < maxRows) {
        let query = supabase
            .from('user_bid_history')
            .select(BID_HISTORY_SELECT)
            .eq('user_id', userId)
            .order('prediction_made_at', { ascending: false })
            .range(offset, offset + batchSize - 1);

        if (range.fromIso) {
            query = query.gte('prediction_made_at', range.fromIso);
        }

        if (range.toIso) {
            query = query.lte('prediction_made_at', range.toIso);
        }

        const { data, error } = await query;
        if (error || !data) {
            return {
                rows: [],
                error: createErrorPayload(
                    'BID_HISTORY_QUERY_FAILED',
                    '입찰참가이력 데이터를 불러오지 못했습니다.',
                    '잠시 후 다시 시도해 주세요.'
                ),
            };
        }

        const batch = data as Record<string, unknown>[];
        rows.push(...batch);

        if (batch.length < batchSize) {
            break;
        }

        offset += batchSize;
    }

    return {
        rows,
    };
}

function buildOrganizationOptions(items: BidHistoryListItem[]): string[] {
    const set = new Set<string>();
    items.forEach((item) => {
        const org = item.organization.trim();
        if (org) {
            set.add(org);
        }
    });

    return Array.from(set)
        .sort((a, b) => a.localeCompare(b, 'ko-KR'))
        .slice(0, 60);
}

async function collectBidHistory(
    params: Record<string, string | string[] | undefined>
): Promise<BidHistoryCollection> {
    const filters = normalizeFilters(params);
    const range = resolveDateRange(filters);

    try {
        const supabase = await createClient();
        const userId = await getCurrentUserId(supabase);

        if (!userId) {
            return {
                filters,
                items: [],
                organizationOptions: [],
                error: createErrorPayload(
                    'BID_HISTORY_AUTH_REQUIRED',
                    '입찰참가이력은 로그인 후 확인할 수 있습니다.',
                    '로그인 후 다시 시도해 주세요.'
                ),
            };
        }

        const historyResponse = await fetchAllBidHistoryRows(supabase, userId, range);
        if (historyResponse.error) {
            return {
                filters,
                items: [],
                organizationOptions: [],
                error: historyResponse.error,
            };
        }

        const historyRows = historyResponse.rows;

        const bidNoticeNos = historyRows
            .map((row) => asString(row.bid_ntce_no))
            .filter((value): value is string => Boolean(value));

        const resultMap = await loadBidResultMap(supabase, bidNoticeNos);

        const mapped = historyRows.map((row) => {
            const bidNoticeNo = asString(row.bid_ntce_no);
            const resultRow = bidNoticeNo ? resultMap.get(bidNoticeNo) ?? null : null;
            return mapHistoryRow(row, resultRow);
        });

        const filtered = applyLocalFilters(mapped, filters);
        const sorted = sortItems(filtered, filters.sort);

        return {
            filters,
            items: sorted,
            organizationOptions: buildOrganizationOptions(mapped),
        };
    } catch {
        return {
            filters,
            items: [],
            organizationOptions: [],
            error: createErrorPayload(
                'BID_HISTORY_UNEXPECTED_ERROR',
                '입찰참가이력 조회 중 예기치 못한 오류가 발생했습니다.',
                '잠시 후 다시 시도해 주세요.'
            ),
        };
    }
}

function toPagedItems(items: BidHistoryListItem[], page: number, pageSize: number): {
    page: number;
    totalPages: number;
    pagedItems: BidHistoryListItem[];
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

export async function getBidHistoryListData(
    params: Record<string, string | string[] | undefined>
): Promise<BidHistoryListData> {
    const collection = await collectBidHistory(params);
    const summary = buildSummary(collection.items);
    const categoryStats = buildCategoryStats(collection.items);
    const monthlyTrends = buildMonthlyTrends(collection.items);

    const pagination = toPagedItems(
        collection.items,
        collection.filters.page,
        collection.filters.pageSize
    );

    return {
        filters: {
            ...collection.filters,
            page: pagination.page,
        },
        summary,
        categoryStats,
        monthlyTrends,
        organizationOptions: collection.organizationOptions,
        items: pagination.pagedItems,
        totalCount: collection.items.length,
        totalPages: pagination.totalPages,
        page: pagination.page,
        pageSize: collection.filters.pageSize,
        ...(collection.error ? { error: collection.error } : {}),
    };
}

function buildInsight(amountGap: number | null, rateGap: number | null): string {
    if (amountGap === null) {
        return '실제 낙찰가가 없어 비교 인사이트를 제공하지 못했습니다.';
    }

    if (Math.abs(amountGap) <= 1000000) {
        return '낙찰가와 매우 근접한 금액입니다. 현재 전략을 유지해도 좋습니다.';
    }

    if (rateGap !== null && rateGap > 0) {
        return '내 투찰률이 낙찰률보다 높았습니다. 다음에는 소폭 하향을 검토해 보세요.';
    }

    return '내 투찰률이 낙찰률보다 낮았습니다. 다음에는 소폭 상향을 검토해 보세요.';
}

function buildComparison(item: BidHistoryListItem): BidHistoryComparison | null {
    if (!item.hasResult) {
        return null;
    }

    const amountGap = item.winningAmount !== null ? item.predictedPrice - item.winningAmount : null;
    const rateGap =
        item.predictedRate !== null && item.winningRate !== null
            ? item.predictedRate - item.winningRate
            : null;

    return {
        myBidAmount: item.predictedPrice,
        myBidAmountLabel: item.predictedPriceLabel,
        myBidRate: item.predictedRate,
        myBidRateLabel: item.predictedRateLabel,
        winningAmount: item.winningAmount,
        winningAmountLabel: item.winningAmountLabel,
        winningRate: item.winningRate,
        winningRateLabel: item.winningRateLabel,
        amountGap,
        amountGapLabel: formatSignedMoney(amountGap),
        rateGap,
        rateGapLabel: formatSignedRate(rateGap),
        insight: buildInsight(amountGap, rateGap),
    };
}

export async function getBidHistoryAnalysisData(id: string): Promise<BidHistoryAnalysisData> {
    if (!id) {
        return {
            detail: null,
            comparison: null,
            error: createErrorPayload(
                'BID_HISTORY_DETAIL_REQUIRED',
                '조회할 입찰참가이력 ID가 필요합니다.',
                '목록에서 다시 상세보기를 선택해 주세요.'
            ),
        };
    }

    try {
        const supabase = await createClient();
        const userId = await getCurrentUserId(supabase);

        if (!userId) {
            return {
                detail: null,
                comparison: null,
                error: createErrorPayload(
                    'BID_HISTORY_AUTH_REQUIRED',
                    '입찰참가이력은 로그인 후 확인할 수 있습니다.',
                    '로그인 후 다시 시도해 주세요.'
                ),
            };
        }

        const { data, error } = await supabase
            .from('user_bid_history')
            .select(BID_HISTORY_SELECT)
            .eq('user_id', userId)
            .eq('id', id)
            .limit(1);

        if (error || !data || data.length === 0) {
            return {
                detail: null,
                comparison: null,
                error: createErrorPayload(
                    'BID_HISTORY_DETAIL_NOT_FOUND',
                    '요청한 입찰참가이력을 찾지 못했습니다.',
                    '목록에서 다른 이력을 선택해 주세요.'
                ),
            };
        }

        const row = data[0] as Record<string, unknown>;
        const bidNoticeNo = asString(row.bid_ntce_no);

        const resultMap = await loadBidResultMap(supabase, bidNoticeNo ? [bidNoticeNo] : []);
        const resultRow = bidNoticeNo ? resultMap.get(bidNoticeNo) ?? null : null;

        const item = mapHistoryRow(row, resultRow);
        const winningInfo = extractWinningInfo(resultRow);

        const participants = parseParticipants(
            resultRow,
            item.actualWinner,
            item.winningAmount,
            item.winningRate
        );

        const participantCount =
            item.totalParticipants ??
            winningInfo.participantCount ??
            (participants.length > 0 ? participants.length : null);

        const detail: BidHistoryAnalysisDetail = {
            ...item,
            predictionReason: asString(row.prediction_reason),
            note: asString(row.notes),
            resultNotice: winningInfo.resultNotice,
            participantCount,
            participantCountLabel: participantCount !== null ? `${participantCount}개사` : '정보없음',
            participants,
            bidNoticeHref: item.bidNoticeId
                ? `/bid_notice/detail/${item.bidNoticeId}`
                : `/bid_notice/detail/${item.bidNoticeNo}`,
            ...(item.bidResultId ? { openingResultHref: `/bid_opening/detail/${item.bidResultId}` } : {}),
        };

        return {
            detail,
            comparison: buildComparison(item),
        };
    } catch {
        return {
            detail: null,
            comparison: null,
            error: createErrorPayload(
                'BID_HISTORY_DETAIL_UNEXPECTED_ERROR',
                '입찰참가이력 상세 조회 중 오류가 발생했습니다.',
                '잠시 후 다시 시도해 주세요.'
            ),
        };
    }
}

export function escapeCsvField(value: string): string {
    if (/[,"\n\r]/.test(value)) {
        return `"${value.replace(/"/g, '""')}"`;
    }
    return value;
}

function buildCsvRows(items: BidHistoryListItem[]): string[] {
    const headers = [
        '참여일시',
        '상태',
        '기관명',
        '공고명',
        '공고번호',
        '입찰금액(원)',
        '입찰률(%)',
        '성공확률(%)',
        '실제낙찰가(원)',
        '낙찰률(%)',
        '편차(%p)',
        '예측순위',
        '참가업체수',
    ];

    const rows = items.map((item) => [
        item.predictionMadeAtLabel,
        getBidHistoryStatusLabel(item.status),
        item.organization,
        item.title,
        `${item.bidNoticeNo}${item.bidNoticeOrd ? `-${item.bidNoticeOrd}` : ''}`,
        String(Math.round(item.predictedPrice)),
        item.predictedRate !== null ? item.predictedRate.toFixed(3) : '',
        item.confidenceLevel !== null ? String(Math.round(item.confidenceLevel)) : '',
        item.winningAmount !== null ? String(Math.round(item.winningAmount)) : '',
        item.winningRate !== null ? item.winningRate.toFixed(3) : '',
        item.deviationPercent !== null ? item.deviationPercent.toFixed(3) : '',
        item.predictedRankLabel,
        item.totalParticipants !== null ? String(item.totalParticipants) : '',
    ]);

    return [
        headers.map((header) => escapeCsvField(header)).join(','),
        ...rows.map((row) => row.map((value) => escapeCsvField(value)).join(',')),
    ];
}

function makeExportFileName(): string {
    const now = new Date();
    const y = now.getFullYear();
    const m = String(now.getMonth() + 1).padStart(2, '0');
    const d = String(now.getDate()).padStart(2, '0');
    return `bid-history-${y}${m}${d}.csv`;
}

export async function getBidHistoryExportCsv(
    params: Record<string, string | string[] | undefined>
): Promise<BidHistoryCsvPayload> {
    const collection = await collectBidHistory(params);

    if (collection.error) {
        return {
            filename: makeExportFileName(),
            csv: '',
            error: collection.error,
        };
    }

    const csvRows = buildCsvRows(collection.items);
    return {
        filename: makeExportFileName(),
        csv: `\uFEFF${csvRows.join('\n')}`,
    };
}
