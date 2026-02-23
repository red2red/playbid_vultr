import { createClient } from '@/lib/supabase/server';
import type {
    NotificationPreferencesInfo,
    PointHistoryData,
    PointHistoryFilters,
    PointTransactionItem,
    PointTransactionType,
    ProfileDataError,
    ProfileOverview,
    ProfileOverviewData,
    ProfileUsageStats,
    SubscriptionInfo,
    SubscriptionStatus,
} from './profile-types';

const dateTimeFormatter = new Intl.DateTimeFormat('ko-KR', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
});

const dateFormatter = new Intl.DateTimeFormat('ko-KR', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
});

const numberFormatter = new Intl.NumberFormat('ko-KR');

type SupabaseServerClient = Awaited<ReturnType<typeof createClient>>;

type AnyRecord = Record<string, unknown>;

interface PointTransactionRow extends AnyRecord {
    id?: unknown;
    amount?: unknown;
    transaction_type?: unknown;
    description?: unknown;
    balance_after?: unknown;
    created_at?: unknown;
}

interface CountResult {
    count: number;
}

interface PointRowsResult {
    items: PointTransactionItem[];
    hasTable: boolean;
    latestBalance: number;
}

interface NotificationPreferencesRowResult {
    row: AnyRecord | null;
    hasTable: boolean;
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

function makeRequestId(): string {
    return `req_${Date.now()}_${Math.random().toString(36).slice(2, 10)}`;
}

function createErrorPayload(code: string, message: string, suggestion: string): ProfileDataError {
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

function formatDate(value: string | null | undefined): string {
    if (!value) {
        return '-';
    }

    const parsed = new Date(value);
    if (Number.isNaN(parsed.getTime())) {
        return value;
    }

    return dateFormatter.format(parsed).replace(/\./g, '.').replace(/\s/g, '').trim();
}

function normalizeTimeText(value: string | null | undefined, fallback: string): string {
    if (!value) {
        return fallback;
    }

    const match = value.trim().match(/^(\d{1,2}):(\d{2})$/);
    if (!match) {
        return fallback;
    }

    const hour = Number(match[1]);
    const minute = Number(match[2]);
    if (!Number.isInteger(hour) || !Number.isInteger(minute)) {
        return fallback;
    }
    if (hour < 0 || hour > 23 || minute < 0 || minute > 59) {
        return fallback;
    }

    return `${hour.toString().padStart(2, '0')}:${minute.toString().padStart(2, '0')}`;
}

function createDefaultNotificationPreferences(hasPreferenceTable: boolean): NotificationPreferencesInfo {
    return {
        pushEnabled: true,
        bidNew: true,
        bidDeadline: true,
        bidDeadlineOption: 'oneDay',
        bidResult: true,
        aiAnalysis: true,
        levelUp: true,
        badge: true,
        dailyMission: true,
        rankingChange: true,
        promotion: false,
        appUpdate: true,
        quietHoursEnabled: true,
        quietHoursStart: '22:00',
        quietHoursEnd: '08:00',
        weekendEnabled: true,
        hasPreferenceTable,
    };
}

export function normalizePlanKey(rawPlan: string | null | undefined): string {
    const plan = (rawPlan ?? '').toLowerCase().trim();

    if (!plan) {
        return 'free';
    }

    if (plan.includes('premium') || plan.includes('pro') || plan.includes('paid')) {
        return 'premium';
    }

    if (plan.includes('basic') || plan.includes('starter') || plan.includes('standard')) {
        return 'basic';
    }

    if (plan.includes('trial') || plan.includes('체험')) {
        return 'trial';
    }

    if (plan.includes('expired') || plan.includes('만료')) {
        return 'expired';
    }

    if (plan.includes('free') || plan.includes('무료')) {
        return 'free';
    }

    return plan;
}

function getPlanLabel(planKey: string): string {
    if (planKey === 'premium') {
        return '프리미엄 플랜';
    }
    if (planKey === 'basic') {
        return '베이직 플랜';
    }
    if (planKey === 'trial') {
        return '체험 플랜';
    }
    if (planKey === 'expired') {
        return '만료됨';
    }
    if (planKey === 'free') {
        return '무료 플랜';
    }

    return planKey;
}

export function resolveSubscriptionStatus(
    planKey: string,
    expiresAtIso: string | null | undefined,
    now = new Date()
): SubscriptionStatus {
    const normalized = normalizePlanKey(planKey);

    if (normalized === 'expired') {
        return 'expired';
    }

    if (normalized === 'trial') {
        if (!expiresAtIso) {
            return 'trial';
        }

        const expiresAt = new Date(expiresAtIso);
        if (Number.isNaN(expiresAt.getTime())) {
            return 'trial';
        }

        return expiresAt.getTime() >= now.getTime() ? 'trial' : 'expired';
    }

    if (normalized === 'premium' || normalized === 'basic') {
        if (!expiresAtIso) {
            return 'active';
        }

        const expiresAt = new Date(expiresAtIso);
        if (Number.isNaN(expiresAt.getTime())) {
            return 'active';
        }

        return expiresAt.getTime() >= now.getTime() ? 'active' : 'expired';
    }

    if (normalized === 'free') {
        return 'free';
    }

    if (expiresAtIso) {
        const expiresAt = new Date(expiresAtIso);
        if (!Number.isNaN(expiresAt.getTime())) {
            return expiresAt.getTime() >= now.getTime() ? 'active' : 'expired';
        }
    }

    return 'unknown';
}

function getStatusLabel(status: SubscriptionStatus): string {
    if (status === 'active') {
        return '활성';
    }
    if (status === 'expired') {
        return '만료';
    }
    if (status === 'trial') {
        return '체험';
    }
    if (status === 'free') {
        return '무료';
    }
    return '확인 필요';
}

function getPaymentMethodLabel(method: string): string {
    const normalized = method.toLowerCase().trim();
    if (normalized === 'card' || normalized === 'credit_card') {
        return '신용카드';
    }
    if (normalized === 'bank_transfer' || normalized === 'bank') {
        return '계좌이체';
    }
    if (normalized === 'subscription') {
        return '구독 결제';
    }
    if (normalized === 'points') {
        return '포인트 차감';
    }
    return method;
}

function formatPoints(value: number): string {
    return `${numberFormatter.format(Math.round(value))} P`;
}

export function formatPointAmount(value: number): string {
    const rounded = Math.round(value);
    if (rounded > 0) {
        return `+${numberFormatter.format(rounded)} P`;
    }
    if (rounded < 0) {
        return `${numberFormatter.format(rounded)} P`;
    }
    return '0 P';
}

function getPointType(rawType: string | null | undefined): PointTransactionType {
    const type = (rawType ?? '').toLowerCase().trim();
    if (type === 'purchase' || type.includes('charge')) {
        return 'purchase';
    }
    if (type === 'deduction' || type.includes('use') || type.includes('consume')) {
        return 'deduction';
    }
    if (type === 'refund') {
        return 'refund';
    }
    return 'other';
}

function getPointTypeLabel(type: PointTransactionType): string {
    if (type === 'purchase') {
        return '충전';
    }
    if (type === 'deduction') {
        return '사용';
    }
    if (type === 'refund') {
        return '환불';
    }
    return '기타';
}

function pickString(source: AnyRecord | null, keys: string[]): string | null {
    if (!source) {
        return null;
    }

    for (const key of keys) {
        const value = asString(source[key]);
        if (value) {
            return value;
        }
    }

    return null;
}

function pickNumber(source: AnyRecord | null, keys: string[]): number | null {
    if (!source) {
        return null;
    }

    for (const key of keys) {
        const value = asNumber(source[key]);
        if (value !== null) {
            return value;
        }
    }

    return null;
}

function pickFromPreferences(
    preferences: AnyRecord | null,
    keys: string[]
): string | number | null {
    if (!preferences) {
        return null;
    }

    for (const key of keys) {
        const value = preferences[key];
        if (typeof value === 'string' || typeof value === 'number') {
            return value;
        }
    }

    const subscription = asRecord(preferences.subscription);
    if (subscription) {
        for (const key of keys) {
            const value = subscription[key];
            if (typeof value === 'string' || typeof value === 'number') {
                return value;
            }
        }
    }

    const billing = asRecord(preferences.billing);
    if (billing) {
        for (const key of keys) {
            const value = billing[key];
            if (typeof value === 'string' || typeof value === 'number') {
                return value;
            }
        }
    }

    return null;
}

function toDaysRemaining(expiresAtIso: string | null | undefined, now = new Date()): number | null {
    if (!expiresAtIso) {
        return null;
    }

    const expiresAt = new Date(expiresAtIso);
    if (Number.isNaN(expiresAt.getTime())) {
        return null;
    }

    const diffMs = expiresAt.getTime() - now.getTime();
    if (diffMs <= 0) {
        return 0;
    }

    return Math.ceil(diffMs / (24 * 60 * 60 * 1000));
}

function mapPointTransactionRow(row: PointTransactionRow): PointTransactionItem {
    const amount = asNumber(row.amount) ?? 0;
    const typeRaw = asString(row.transaction_type) ?? 'other';
    const type = getPointType(typeRaw);
    const balanceAfter = asNumber(row.balance_after);

    return {
        id: asString(row.id) ?? `${typeRaw}_${Date.now()}`,
        type,
        typeRaw,
        typeLabel: getPointTypeLabel(type),
        amount,
        amountLabel: formatPointAmount(amount),
        balanceAfter,
        balanceAfterLabel: balanceAfter === null ? '-' : formatPoints(balanceAfter),
        description: asString(row.description) ?? '포인트 거래',
        createdAtIso: asString(row.created_at) ?? new Date().toISOString(),
        createdAtLabel: formatDateTime(asString(row.created_at)),
    };
}

async function getCurrentUser(supabase: SupabaseServerClient): Promise<{
    userId: string;
    email: string;
} | null> {
    const {
        data: { user },
        error,
    } = await supabase.auth.getUser();

    if (error || !user) {
        return null;
    }

    return {
        userId: user.id,
        email: user.email ?? '',
    };
}

async function fetchProfileRow(
    supabase: SupabaseServerClient,
    userId: string
): Promise<AnyRecord | null> {
    const { data } = await supabase.from('profiles').select('*').eq('id', userId).limit(1);

    if (!data || data.length === 0) {
        return null;
    }

    return asRecord(data[0]);
}

async function fetchUserProfileRow(
    supabase: SupabaseServerClient,
    userId: string
): Promise<AnyRecord | null> {
    const byUserId = await supabase
        .from('user_profiles')
        .select('*')
        .eq('user_id', userId)
        .limit(1);

    if (byUserId.data && byUserId.data.length > 0) {
        return asRecord(byUserId.data[0]);
    }

    const byId = await supabase.from('user_profiles').select('*').eq('id', userId).limit(1);

    if (byId.data && byId.data.length > 0) {
        return asRecord(byId.data[0]);
    }

    return null;
}

async function fetchNotificationPreferencesRow(
    supabase: SupabaseServerClient,
    userId: string
): Promise<NotificationPreferencesRowResult> {
    const byUserId = await supabase
        .from('notification_preferences')
        .select('*')
        .eq('user_id', userId)
        .limit(1);

    if (byUserId.error) {
        return {
            row: null,
            hasTable: false,
        };
    }

    if (byUserId.data && byUserId.data.length > 0) {
        return {
            row: asRecord(byUserId.data[0]),
            hasTable: true,
        };
    }

    const byId = await supabase
        .from('notification_preferences')
        .select('*')
        .eq('id', userId)
        .limit(1);

    if (byId.error) {
        return {
            row: null,
            hasTable: false,
        };
    }

    if (byId.data && byId.data.length > 0) {
        return {
            row: asRecord(byId.data[0]),
            hasTable: true,
        };
    }

    return {
        row: null,
        hasTable: true,
    };
}

function buildNotificationPreferences(
    row: AnyRecord | null,
    hasPreferenceTable: boolean
): NotificationPreferencesInfo {
    const defaults = createDefaultNotificationPreferences(hasPreferenceTable);

    if (!row) {
        return defaults;
    }

    return {
        ...defaults,
        pushEnabled: asBoolean(row.push_enabled) ?? defaults.pushEnabled,
        bidNew: asBoolean(row.bid_new) ?? defaults.bidNew,
        bidDeadline: asBoolean(row.bid_deadline) ?? defaults.bidDeadline,
        bidDeadlineOption: asString(row.bid_deadline_option) ?? defaults.bidDeadlineOption,
        bidResult: asBoolean(row.bid_result) ?? defaults.bidResult,
        aiAnalysis: asBoolean(row.ai_analysis) ?? defaults.aiAnalysis,
        levelUp: asBoolean(row.level_up) ?? defaults.levelUp,
        badge: asBoolean(row.badge) ?? defaults.badge,
        dailyMission: asBoolean(row.daily_mission) ?? defaults.dailyMission,
        rankingChange: asBoolean(row.ranking_change) ?? defaults.rankingChange,
        promotion: asBoolean(row.promotion) ?? defaults.promotion,
        appUpdate: asBoolean(row.app_update) ?? defaults.appUpdate,
        quietHoursEnabled: asBoolean(row.quiet_hours_enabled) ?? defaults.quietHoursEnabled,
        quietHoursStart: normalizeTimeText(asString(row.quiet_hours_start), defaults.quietHoursStart),
        quietHoursEnd: normalizeTimeText(asString(row.quiet_hours_end), defaults.quietHoursEnd),
        weekendEnabled: asBoolean(row.weekend_enabled) ?? defaults.weekendEnabled,
        hasPreferenceTable,
    };
}

async function readCount(
    supabase: SupabaseServerClient,
    table: string,
    userId: string
): Promise<CountResult> {
    const query = supabase.from(table).select('id', { count: 'exact', head: true }).eq('user_id', userId);

    const { count, error } = await query;
    if (error) {
        return { count: 0 };
    }

    return { count: count ?? 0 };
}

async function readUnreadNotificationCount(
    supabase: SupabaseServerClient,
    userId: string
): Promise<CountResult> {
    const { count, error } = await supabase
        .from('notifications')
        .select('id', { count: 'exact', head: true })
        .eq('user_id', userId)
        .eq('read', false)
        .eq('deleted', false);

    if (error) {
        return { count: 0 };
    }

    return { count: count ?? 0 };
}

async function readPremiumExecutionCount(
    supabase: SupabaseServerClient,
    userId: string
): Promise<CountResult> {
    const { count, error } = await supabase
        .from('paid_feature_executions')
        .select('id', { count: 'exact', head: true })
        .eq('user_id', userId)
        .eq('status', 'completed');

    if (error) {
        return { count: 0 };
    }

    return { count: count ?? 0 };
}

async function fetchPointRows(
    supabase: SupabaseServerClient,
    userId: string,
    limit: number
): Promise<PointRowsResult> {
    const { data, error } = await supabase
        .from('point_transactions')
        .select('id, amount, transaction_type, description, balance_after, created_at')
        .eq('user_id', userId)
        .order('created_at', { ascending: false })
        .limit(limit);

    if (error) {
        return {
            items: [],
            hasTable: false,
            latestBalance: 0,
        };
    }

    const rows = (data ?? []) as PointTransactionRow[];
    const items = rows.map((row) => mapPointTransactionRow(row));

    const firstWithBalance = items.find((item) => item.balanceAfter !== null);
    const latestBalance = firstWithBalance?.balanceAfter ?? items.reduce((sum, item) => sum + item.amount, 0);

    return {
        items,
        hasTable: true,
        latestBalance,
    };
}

function buildProfileOverview(
    userId: string,
    authEmail: string,
    profileRow: AnyRecord | null,
    userProfileRow: AnyRecord | null
): ProfileOverview {
    const name =
        pickString(userProfileRow, ['nickname']) ??
        pickString(profileRow, ['full_name', 'username']) ??
        '사용자';

    const email = pickString(profileRow, ['email']) ?? authEmail;
    const avatarUrl =
        pickString(userProfileRow, ['avatar_url']) ?? pickString(profileRow, ['avatar_url']) ?? undefined;

    const joinedAtIso =
        pickString(profileRow, ['created_at']) ?? pickString(userProfileRow, ['created_at']) ?? undefined;

    return {
        userId,
        name,
        email,
        nickname: pickString(userProfileRow, ['nickname']) ?? undefined,
        company: pickString(userProfileRow, ['company']) ?? undefined,
        position: pickString(userProfileRow, ['position']) ?? undefined,
        phone: pickString(userProfileRow, ['phone']) ?? undefined,
        avatarUrl,
        joinedAtIso,
        joinedAtLabel: formatDate(joinedAtIso),
    };
}

function buildSubscriptionInfo(
    profileRow: AnyRecord | null,
    userProfileRow: AnyRecord | null,
    now: Date
): SubscriptionInfo {
    const preferences = asRecord(userProfileRow?.preferences);

    const rawPlan =
        pickString(userProfileRow, ['subscription_plan', 'subscription']) ??
        pickString(profileRow, ['subscription_plan', 'subscription']) ??
        asString(pickFromPreferences(preferences, ['subscription_plan', 'plan', 'subscription']));

    const planKey = normalizePlanKey(rawPlan);

    const expiresAtIso =
        pickString(userProfileRow, ['subscription_expires_at', 'subscription_end_at', 'subscription_expire_at']) ??
        pickString(profileRow, ['subscription_expires_at', 'subscription_end_at', 'subscription_expire_at']) ??
        asString(
            pickFromPreferences(preferences, [
                'subscription_expires_at',
                'expires_at',
                'subscription_end_at',
            ])
        ) ??
        undefined;

    const status = resolveSubscriptionStatus(planKey, expiresAtIso, now);
    const paymentMethod =
        pickString(userProfileRow, ['payment_method']) ??
        pickString(profileRow, ['payment_method']) ??
        asString(pickFromPreferences(preferences, ['payment_method', 'method'])) ??
        'none';

    return {
        planKey,
        planLabel: getPlanLabel(planKey),
        status,
        statusLabel: getStatusLabel(status),
        expiresAtIso,
        expiresAtLabel: expiresAtIso ? formatDate(expiresAtIso) : undefined,
        daysRemaining: toDaysRemaining(expiresAtIso, now),
        paymentMethod,
        paymentMethodLabel: getPaymentMethodLabel(paymentMethod),
    };
}

function buildUsageStats(values: {
    bookmarks: number;
    mockBids: number;
    unreadNotifications: number;
    premiumExecutions: number;
}): ProfileUsageStats {
    return {
        bookmarkCount: values.bookmarks,
        mockBidCount: values.mockBids,
        unreadNotificationCount: values.unreadNotifications,
        premiumExecutionCount: values.premiumExecutions,
    };
}

function normalizePointHistoryType(value: string | undefined): PointHistoryFilters['type'] {
    if (value === 'purchase' || value === 'deduction' || value === 'refund') {
        return value;
    }
    return 'all';
}

function normalizePointHistoryFilters(
    params: Record<string, string | string[] | undefined>
): PointHistoryFilters {
    const type = normalizePointHistoryType(parseParamValue(params.type));
    const page = toInteger(parseParamValue(params.page), 1);
    const pageSize = Math.min(100, Math.max(10, toInteger(parseParamValue(params.pageSize), 20)));

    return {
        type,
        page,
        pageSize,
    };
}

function makeEmptyProfileData(error?: ProfileDataError): ProfileOverviewData {
    return {
        profile: {
            userId: '',
            name: '사용자',
            email: '',
            joinedAtLabel: '-',
        },
        subscription: {
            planKey: 'free',
            planLabel: '무료 플랜',
            status: 'free',
            statusLabel: '무료',
            daysRemaining: null,
            paymentMethod: 'none',
            paymentMethodLabel: '미등록',
        },
        points: {
            balance: 0,
            balanceLabel: formatPoints(0),
            recentTransactions: [],
            hasTransactionTable: false,
        },
        notificationPreferences: createDefaultNotificationPreferences(false),
        usageStats: {
            bookmarkCount: 0,
            mockBidCount: 0,
            unreadNotificationCount: 0,
            premiumExecutionCount: 0,
        },
        error,
    };
}

function makeEmptyPointHistoryData(filters: PointHistoryFilters, error?: ProfileDataError): PointHistoryData {
    return {
        filters,
        items: [],
        totalCount: 0,
        totalPages: 1,
        page: 1,
        pageSize: filters.pageSize,
        balance: 0,
        balanceLabel: formatPoints(0),
        hasTransactionTable: false,
        error,
    };
}

export async function getProfileOverviewData(): Promise<ProfileOverviewData> {
    try {
        const supabase = await createClient();
        const user = await getCurrentUser(supabase);

        if (!user) {
            return makeEmptyProfileData(
                createErrorPayload(
                    'PROFILE_AUTH_REQUIRED',
                    '프로필 정보를 보려면 로그인이 필요합니다.',
                    '로그인 후 다시 시도해 주세요.'
                )
            );
        }

        const now = new Date();

        const [
            profileRow,
            userProfileRow,
            notificationPreferencesRow,
            pointRows,
            bookmarkCount,
            mockBidCount,
            unreadNotificationCount,
            premiumCount,
        ] = await Promise.all([
            fetchProfileRow(supabase, user.userId),
            fetchUserProfileRow(supabase, user.userId),
            fetchNotificationPreferencesRow(supabase, user.userId),
            fetchPointRows(supabase, user.userId, 5),
            readCount(supabase, 'user_scraps', user.userId),
            readCount(supabase, 'user_bid_history', user.userId),
            readUnreadNotificationCount(supabase, user.userId),
            readPremiumExecutionCount(supabase, user.userId),
        ]);

        const profile = buildProfileOverview(user.userId, user.email, profileRow, userProfileRow);
        const subscription = buildSubscriptionInfo(profileRow, userProfileRow, now);

        const preferences = asRecord(userProfileRow?.preferences);
        const pointBalanceFromProfile =
            pickNumber(userProfileRow, ['point_balance', 'points']) ??
            pickNumber(profileRow, ['point_balance', 'points']) ??
            asNumber(pickFromPreferences(preferences, ['point_balance', 'points']));

        const resolvedBalance = pointBalanceFromProfile ?? pointRows.latestBalance;

        const points = {
            balance: resolvedBalance,
            balanceLabel: formatPoints(resolvedBalance),
            recentTransactions: pointRows.items,
            hasTransactionTable: pointRows.hasTable,
        };

        const usageStats = buildUsageStats({
            bookmarks: bookmarkCount.count,
            mockBids: mockBidCount.count,
            unreadNotifications: unreadNotificationCount.count,
            premiumExecutions: premiumCount.count,
        });

        const notificationPreferences = buildNotificationPreferences(
            notificationPreferencesRow.row,
            notificationPreferencesRow.hasTable
        );

        return {
            profile,
            subscription,
            points,
            notificationPreferences,
            usageStats,
        };
    } catch {
        return makeEmptyProfileData(
            createErrorPayload(
                'PROFILE_OVERVIEW_FAILED',
                '프로필 정보를 불러오지 못했습니다.',
                '잠시 후 다시 시도해 주세요.'
            )
        );
    }
}

export async function getPointHistoryData(
    params: Record<string, string | string[] | undefined>
): Promise<PointHistoryData> {
    const filters = normalizePointHistoryFilters(params);

    try {
        const supabase = await createClient();
        const user = await getCurrentUser(supabase);

        if (!user) {
            return makeEmptyPointHistoryData(
                filters,
                createErrorPayload(
                    'POINT_HISTORY_AUTH_REQUIRED',
                    '포인트 내역을 보려면 로그인이 필요합니다.',
                    '로그인 후 다시 시도해 주세요.'
                )
            );
        }

        let countQuery = supabase
            .from('point_transactions')
            .select('id', { count: 'exact', head: true })
            .eq('user_id', user.userId);

        if (filters.type !== 'all') {
            countQuery = countQuery.eq('transaction_type', filters.type);
        }

        const pageStart = (filters.page - 1) * filters.pageSize;
        const pageEnd = pageStart + filters.pageSize - 1;

        let listQuery = supabase
            .from('point_transactions')
            .select('id, amount, transaction_type, description, balance_after, created_at')
            .eq('user_id', user.userId)
            .order('created_at', { ascending: false })
            .range(pageStart, pageEnd);

        if (filters.type !== 'all') {
            listQuery = listQuery.eq('transaction_type', filters.type);
        }

        const latestBalanceQuery = supabase
            .from('point_transactions')
            .select('balance_after, amount')
            .eq('user_id', user.userId)
            .order('created_at', { ascending: false })
            .limit(1);

        const [countRes, listRes, latestBalanceRes] = await Promise.all([
            countQuery,
            listQuery,
            latestBalanceQuery,
        ]);

        if (countRes.error || listRes.error || latestBalanceRes.error) {
            return makeEmptyPointHistoryData(
                filters,
                createErrorPayload(
                    'POINT_HISTORY_QUERY_FAILED',
                    '포인트 거래 내역을 불러오지 못했습니다.',
                    '아직 포인트 기능이 준비되지 않았거나 잠시 오류가 발생했습니다.'
                )
            );
        }

        const rows = (listRes.data ?? []) as PointTransactionRow[];
        const items = rows.map((row) => mapPointTransactionRow(row));

        const totalCount = countRes.count ?? 0;
        const totalPages = Math.max(1, Math.ceil(totalCount / filters.pageSize));
        const page = Math.min(filters.page, totalPages);

        const latestBalanceRecord = latestBalanceRes.data?.[0] as AnyRecord | undefined;
        const balanceFromLatest = asNumber(latestBalanceRecord?.balance_after);
        const balance = balanceFromLatest ?? asNumber(latestBalanceRecord?.amount) ?? 0;

        return {
            filters,
            items,
            totalCount,
            totalPages,
            page,
            pageSize: filters.pageSize,
            balance,
            balanceLabel: formatPoints(balance),
            hasTransactionTable: true,
        };
    } catch {
        return makeEmptyPointHistoryData(
            filters,
            createErrorPayload(
                'POINT_HISTORY_UNKNOWN_ERROR',
                '포인트 내역 화면을 준비하지 못했습니다.',
                '페이지를 새로고침하거나 잠시 후 다시 시도해 주세요.'
            )
        );
    }
}
