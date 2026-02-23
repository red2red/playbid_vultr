import { createClient } from '@/lib/supabase/server';
import type {
    QualificationCalculatorNoticePrefill,
    QualificationCalculatorPageData,
    QualificationCategory,
    QualificationPerfMultiplierRule,
    QualificationReviewMaster,
    QualificationRuleConfig,
    QualificationSignalBonusConfig,
} from './qualification-calculator-types';

type AnyRecord = Record<string, unknown>;

const DEFAULT_NOTICE_TITLE = '적격심사 계산기';

const A_VALUE_FIELDS = [
    'sfty_mngcst',
    'sfty_chck_mngcst',
    'rtrfund_non',
    'mrfn_health_insrprm',
    'npn_insrprm',
    'odsn_lngtrmrcpr_insrprm',
    'qlty_mngcst',
    'smkp_amt',
] as const;

function asRecord(value: unknown): AnyRecord | null {
    if (!value || typeof value !== 'object' || Array.isArray(value)) {
        return null;
    }
    return value as AnyRecord;
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
        if (Number.isFinite(parsed)) {
            return parsed;
        }
    }

    return null;
}

function asBoolean(value: unknown): boolean | null {
    if (typeof value === 'boolean') {
        return value;
    }

    if (typeof value === 'number') {
        return value !== 0;
    }

    if (typeof value === 'string') {
        const normalized = value.toLowerCase().trim();
        if (normalized === 'true' || normalized === '1' || normalized === 'yes' || normalized === 'on') {
            return true;
        }
        if (normalized === 'false' || normalized === '0' || normalized === 'no' || normalized === 'off') {
            return false;
        }
    }

    return null;
}

function normalizeCategory(value: string | null | undefined): QualificationCategory {
    const normalized = value?.toLowerCase().trim();

    if (normalized === 'construction' || normalized === '공사') {
        return 'construction';
    }

    if (normalized === 'service' || normalized === '용역') {
        return 'service';
    }

    if (
        normalized === 'goods' ||
        normalized === 'product' ||
        normalized === 'purchase' ||
        normalized === '물품'
    ) {
        return 'goods';
    }

    return 'goods';
}

function getCategoryFilter(category: QualificationCategory): string[] {
    if (category === 'goods') {
        return ['goods', 'purchase'];
    }
    return [category];
}

function getQueryParam(
    params: Record<string, string | string[] | undefined>,
    key: string
): string {
    const value = params[key];
    if (typeof value === 'string') {
        return value;
    }
    if (Array.isArray(value)) {
        return value[0] ?? '';
    }
    return '';
}

function makeFallbackPrefill(params: Record<string, string | string[] | undefined>) {
    const category = normalizeCategory(getQueryParam(params, 'category') || getQueryParam(params, 'initialCategory'));
    const lowerLimit = asNumber(getQueryParam(params, 'lowerLimit'));
    const baseAmount = asNumber(getQueryParam(params, 'baseAmount'));
    const aValue = asNumber(getQueryParam(params, 'aValue'));
    const noticeName =
        getQueryParam(params, 'noticeName') ||
        getQueryParam(params, 'title') ||
        DEFAULT_NOTICE_TITLE;

    return {
        noticeId: getQueryParam(params, 'noticeId') || null,
        noticeNumber: getQueryParam(params, 'noticeNumber') || null,
        noticeOrder: getQueryParam(params, 'noticeOrder') || null,
        noticeName,
        category,
        lowerLimit,
        baseAmount,
        aValue,
        bidMethodName: getQueryParam(params, 'bidMethod') || getQueryParam(params, 'sucsfbidMthdNm') || null,
        agencyName: getQueryParam(params, 'agencyName') || null,
    } satisfies QualificationCalculatorNoticePrefill;
}

function isUuid(value: string): boolean {
    return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(
        value
    );
}

function parsePerfMultiplierRules(value: unknown): QualificationPerfMultiplierRule[] {
    if (!Array.isArray(value)) {
        return [];
    }

    const rules: QualificationPerfMultiplierRule[] = [];
    for (const item of value) {
        const record = asRecord(item);
        if (!record) {
            continue;
        }

        const minAmount = asNumber(record.min_amount);
        const multiplier = asNumber(record.multiplier);
        if (minAmount === null || multiplier === null) {
            continue;
        }

        rules.push({
            minAmount: Math.max(0, Math.trunc(minAmount)),
            maxAmount: asNumber(record.max_amount) === null ? null : Math.trunc(asNumber(record.max_amount) ?? 0),
            multiplier,
            description: asString(record.description),
        });
    }

    return rules.sort((a, b) => a.minAmount - b.minAmount);
}

function parseSignalBonusConfig(value: unknown): QualificationSignalBonusConfig | null {
    const record = asRecord(value);
    if (!record) {
        return null;
    }

    return {
        womanEnterprise: asNumber(record.woman_enterprise) ?? 1.0,
        disabledEnterprise: asNumber(record.disabled_enterprise) ?? 1.0,
        socialEnterprise: asNumber(record.social_enterprise) ?? 0.5,
        jobCreation: asNumber(record.job_creation) ?? 0.5,
        smallEnterprise: asNumber(record.small_enterprise) ?? 0.5,
        maxBonus: asNumber(record.max_bonus) ?? 3.0,
    };
}

function parseRuleConfig(value: unknown): QualificationRuleConfig | null {
    const record = asRecord(value);
    if (!record) {
        return null;
    }

    return {
        perfScore: asNumber(record.perf_score) ?? 0,
        mgmtScore: asNumber(record.mgmt_score) ?? 0,
        priceScore: asNumber(record.price_score) ?? 70,
        priceCoef: asNumber(record.price_coef) ?? 88,
        lowerLimit: asNumber(record.lower_limit) ?? 87.745,
        passingScore: asNumber(record.passing_score) ?? 85,
        useAValue: asBoolean(record.use_a_value) ?? false,
        techScore: asNumber(record.tech_score) ?? 0,
        maxStartScore: asNumber(record.max_start_score) ?? 0,
        priceParams: asRecord(record.price_params),
        perfMultiplier: asNumber(record.perf_multiplier) ?? 1.0,
        perfMultiplierRules: parsePerfMultiplierRules(record.perf_multiplier_rules),
        signalBonus: parseSignalBonusConfig(record.signal_bonus),
    };
}

function parseReviewMaster(row: AnyRecord): QualificationReviewMaster {
    const ruleParams = Array.isArray(row.review_rule_params) ? row.review_rule_params : [];
    const firstRule = asRecord(ruleParams[0]);
    const ruleConfig = parseRuleConfig(firstRule?.rule_config);

    return {
        id: asString(row.id) ?? '',
        agencyName: asString(row.agency_name) ?? '기관 미분류',
        reviewName: asString(row.review_name) ?? '심사기준',
        category: asString(row.category) ?? 'unknown',
        minAmount: Math.max(0, Math.trunc(asNumber(row.min_amount) ?? 0)),
        maxAmount: asNumber(row.max_amount) === null ? null : Math.trunc(asNumber(row.max_amount) ?? 0),
        parentType: asString(row.parent_type) ?? 'UNKNOWN',
        priority: Math.trunc(asNumber(row.priority) ?? 0),
        ruleConfig,
    };
}

function filterByEstimatedPrice(
    masters: QualificationReviewMaster[],
    estimatedPrice: number | null
): QualificationReviewMaster[] {
    if (estimatedPrice === null) {
        return masters;
    }

    return masters.filter((master) => {
        const minOk = estimatedPrice >= master.minAmount;
        const maxOk = master.maxAmount === null || estimatedPrice < master.maxAmount;
        return minOk && maxOk;
    });
}

function extractAgencyKeyword(agencyName: string | null | undefined): string | null {
    if (!agencyName) {
        return null;
    }

    const keywords: Record<string, string[]> = {
        조달청: ['조달청', '조달', 'PPS', 'g2b'],
        지자체: ['시청', '구청', '군청', '도청', '교육청', '교육지원청'],
        국방부: ['국방부', '국방', '육군', '해군', '공군', '합참'],
        한전: ['한전', '한국전력', 'KEPCO'],
        LH: ['LH', '토지주택', '주택공사'],
        가스공사: ['가스공사', '한국가스', 'KOGAS'],
        중소기업청: ['중소기업', '중기청', '중소벤처'],
    };

    const lowerName = agencyName.toLowerCase();
    for (const [target, patterns] of Object.entries(keywords)) {
        if (patterns.some((pattern) => lowerName.includes(pattern.toLowerCase()))) {
            return target;
        }
    }

    return null;
}

function pickBestMatchByMethod(
    masters: QualificationReviewMaster[],
    bidMethod: string | null
): QualificationReviewMaster | null {
    if (!bidMethod || masters.length === 0) {
        return masters[0] ?? null;
    }

    const byuljiMatch = /별지\s*#?([0-9]+)/.exec(bidMethod);
    if (byuljiMatch) {
        const number = byuljiMatch[1];
        const matched = masters.find((master) => master.reviewName.includes(`별지${number}`));
        if (matched) {
            return matched;
        }
    }

    const normalizedMethod = bidMethod.toLowerCase();
    const exact = masters.find((master) => master.reviewName.toLowerCase() === normalizedMethod);
    if (exact) {
        return exact;
    }

    const fuzzy = masters.find(
        (master) =>
            master.reviewName.toLowerCase().includes(normalizedMethod) ||
            normalizedMethod.includes(master.reviewName.toLowerCase())
    );

    return fuzzy ?? masters[0] ?? null;
}

async function readReviewMasters(
    category: QualificationCategory,
    agencyKeyword: string | null
): Promise<QualificationReviewMaster[]> {
    const supabase = await createClient();
    let query = supabase
        .from('review_masters')
        .select(
            `
            id,
            agency_name,
            review_name,
            category,
            min_amount,
            max_amount,
            parent_type,
            priority,
            review_rule_params (rule_config)
        `
        )
        .in('category', getCategoryFilter(category))
        .eq('is_active', true)
        .order('priority', { ascending: false })
        .order('agency_name', { ascending: true });

    if (agencyKeyword) {
        query = query.eq('agency_name', agencyKeyword);
    }

    const { data, error } = await query;
    if (error || !data) {
        return [];
    }

    return (data as AnyRecord[]).map(parseReviewMaster).filter((row) => row.id.length > 0);
}

function sumAValue(row: AnyRecord | null): number | null {
    if (!row) {
        return null;
    }

    let total = 0;
    let hasAny = false;
    for (const field of A_VALUE_FIELDS) {
        const value = asNumber(row[field]);
        if (value !== null) {
            total += value;
            hasAny = true;
        }
    }

    return hasAny ? total : null;
}

async function readAValue(noticeNumber: string, noticeOrder: string | null): Promise<number | null> {
    const supabase = await createClient();
    const { data, error } = await supabase
        .from('bid_price_a_info')
        .select(
            'bid_ntce_no,bid_ntce_ord,sfty_mngcst,sfty_chck_mngcst,rtrfund_non,mrfn_health_insrprm,npn_insrprm,odsn_lngtrmrcpr_insrprm,qlty_mngcst,smkp_amt'
        )
        .eq('bid_ntce_no', noticeNumber)
        .limit(5);

    if (error || !data || data.length === 0) {
        return null;
    }

    if (noticeOrder) {
        const exact = (data as AnyRecord[]).find(
            (item) => (asString(item.bid_ntce_ord) ?? '000') === noticeOrder
        );
        if (exact) {
            return sumAValue(exact);
        }
    }

    return sumAValue(asRecord((data as AnyRecord[])[0]));
}

async function readNoticePrefill(
    noticeId: string
): Promise<QualificationCalculatorNoticePrefill | null> {
    const supabase = await createClient();
    const query = supabase
        .from('bid_notices')
        .select(
            'id,bid_ntce_no,bid_ntce_ord,bid_ntce_nm,api_category,presmpt_prce,sucsfbid_lwlt_rate,sucsfbid_lwlt_rate_db,sucsfbid_mthd_nm,ntce_instt_nm,dminstt_nm,raw_data'
        )
        .limit(1);

    const { data, error } = isUuid(noticeId)
        ? await query.eq('id', noticeId)
        : await query.eq('bid_ntce_no', noticeId);

    if (error || !data || data.length === 0) {
        return null;
    }

    const row = asRecord((data as AnyRecord[])[0]);
    if (!row) {
        return null;
    }

    const noticeNumber = asString(row.bid_ntce_no);
    const noticeOrder = asString(row.bid_ntce_ord) ?? '000';
    const raw = asRecord(row.raw_data);
    const aValueFromRaw =
        asNumber(raw?.aCost) ??
        asNumber(raw?.a_value) ??
        asNumber(raw?.aValue) ??
        asNumber(raw?.total_a_value);
    const aValueFromTable = noticeNumber ? await readAValue(noticeNumber, noticeOrder) : null;

    return {
        noticeId: asString(row.id) ?? noticeId,
        noticeNumber,
        noticeOrder,
        noticeName: asString(row.bid_ntce_nm) ?? DEFAULT_NOTICE_TITLE,
        category: normalizeCategory(asString(row.api_category)),
        lowerLimit: asNumber(row.sucsfbid_lwlt_rate) ?? asNumber(row.sucsfbid_lwlt_rate_db),
        baseAmount: asNumber(row.presmpt_prce),
        aValue: aValueFromRaw ?? aValueFromTable,
        bidMethodName: asString(row.sucsfbid_mthd_nm),
        agencyName: asString(row.ntce_instt_nm) ?? asString(row.dminstt_nm),
    };
}

export async function getQualificationCalculatorPageData(
    params: Record<string, string | string[] | undefined>
): Promise<QualificationCalculatorPageData> {
    const fallbackPrefill = makeFallbackPrefill(params);
    const noticeId = fallbackPrefill.noticeId;

    let prefill = fallbackPrefill;
    if (noticeId) {
        try {
            const fromNotice = await readNoticePrefill(noticeId);
            if (fromNotice) {
                prefill = {
                    ...fallbackPrefill,
                    ...fromNotice,
                    noticeName: fromNotice.noticeName || fallbackPrefill.noticeName,
                };
            }
        } catch {
            // 조회 실패 시 fallback prefill 유지
        }
    }

    try {
        const estimatedPrice =
            prefill.baseAmount !== null && Number.isFinite(prefill.baseAmount)
                ? Math.trunc(prefill.baseAmount)
                : null;
        const agencyKeyword = extractAgencyKeyword(prefill.agencyName);

        let rules = await readReviewMasters(prefill.category, agencyKeyword);
        if (rules.length === 0 && agencyKeyword) {
            rules = await readReviewMasters(prefill.category, null);
        }

        const filtered = filterByEstimatedPrice(rules, estimatedPrice);
        const availableRules = filtered.length > 0 ? filtered : rules;
        const selectedRule = pickBestMatchByMethod(availableRules, prefill.bidMethodName);

        return {
            prefill,
            availableRules,
            selectedRuleId: selectedRule?.id ?? null,
        };
    } catch {
        return {
            prefill,
            availableRules: [],
            selectedRuleId: null,
        };
    }
}
