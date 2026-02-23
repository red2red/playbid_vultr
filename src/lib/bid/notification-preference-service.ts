import { createClient } from '@/lib/supabase/server';
import type {
    NotificationPreferencesInfo,
    NotificationPreferencesUpdateInput,
} from './profile-types';

export class NotificationPreferenceAuthError extends Error {
    constructor(message = '로그인이 필요합니다.') {
        super(message);
        this.name = 'NotificationPreferenceAuthError';
    }
}

export class NotificationPreferenceUnavailableError extends Error {
    constructor(message = '알림 설정 기능을 사용할 수 없습니다.') {
        super(message);
        this.name = 'NotificationPreferenceUnavailableError';
    }
}

const DEFAULT_PREFERENCES: Omit<NotificationPreferencesInfo, 'hasPreferenceTable'> = {
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
};

type AnyRecord = Record<string, unknown>;

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

function isMissingTableError(error: unknown): boolean {
    const record = asRecord(error);
    if (!record) {
        return false;
    }

    const code = asString(record.code);
    if (code === '42P01') {
        return true;
    }

    const message = asString(record.message)?.toLowerCase();
    return Boolean(message?.includes('does not exist') || message?.includes('relation'));
}

function mapRowToPreferences(row: AnyRecord | null, hasPreferenceTable: boolean): NotificationPreferencesInfo {
    return {
        pushEnabled: asBoolean(row?.push_enabled) ?? DEFAULT_PREFERENCES.pushEnabled,
        bidNew: asBoolean(row?.bid_new) ?? DEFAULT_PREFERENCES.bidNew,
        bidDeadline: asBoolean(row?.bid_deadline) ?? DEFAULT_PREFERENCES.bidDeadline,
        bidDeadlineOption: asString(row?.bid_deadline_option) ?? DEFAULT_PREFERENCES.bidDeadlineOption,
        bidResult: asBoolean(row?.bid_result) ?? DEFAULT_PREFERENCES.bidResult,
        aiAnalysis: asBoolean(row?.ai_analysis) ?? DEFAULT_PREFERENCES.aiAnalysis,
        levelUp: asBoolean(row?.level_up) ?? DEFAULT_PREFERENCES.levelUp,
        badge: asBoolean(row?.badge) ?? DEFAULT_PREFERENCES.badge,
        dailyMission: asBoolean(row?.daily_mission) ?? DEFAULT_PREFERENCES.dailyMission,
        rankingChange: asBoolean(row?.ranking_change) ?? DEFAULT_PREFERENCES.rankingChange,
        promotion: asBoolean(row?.promotion) ?? DEFAULT_PREFERENCES.promotion,
        appUpdate: asBoolean(row?.app_update) ?? DEFAULT_PREFERENCES.appUpdate,
        quietHoursEnabled:
            asBoolean(row?.quiet_hours_enabled) ?? DEFAULT_PREFERENCES.quietHoursEnabled,
        quietHoursStart: normalizeTimeText(
            asString(row?.quiet_hours_start),
            DEFAULT_PREFERENCES.quietHoursStart
        ),
        quietHoursEnd: normalizeTimeText(
            asString(row?.quiet_hours_end),
            DEFAULT_PREFERENCES.quietHoursEnd
        ),
        weekendEnabled: asBoolean(row?.weekend_enabled) ?? DEFAULT_PREFERENCES.weekendEnabled,
        hasPreferenceTable,
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

async function fetchPreferenceRow(userId: string): Promise<{ row: AnyRecord | null; hasTable: boolean }> {
    const supabase = await createClient();

    const byUserId = await supabase
        .from('notification_preferences')
        .select('*')
        .eq('user_id', userId)
        .limit(1);

    if (byUserId.error) {
        if (isMissingTableError(byUserId.error)) {
            return {
                row: null,
                hasTable: false,
            };
        }

        throw new Error('알림 설정 조회에 실패했습니다.');
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
        if (isMissingTableError(byId.error)) {
            return {
                row: null,
                hasTable: false,
            };
        }

        throw new Error('알림 설정 조회에 실패했습니다.');
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

function toUpsertPayload(input: NotificationPreferencesUpdateInput): Record<string, unknown> {
    const payload: Record<string, unknown> = {};

    if (typeof input.pushEnabled === 'boolean') {
        payload.push_enabled = input.pushEnabled;
    }
    if (typeof input.bidNew === 'boolean') {
        payload.bid_new = input.bidNew;
    }
    if (typeof input.bidDeadline === 'boolean') {
        payload.bid_deadline = input.bidDeadline;
    }
    if (typeof input.bidDeadlineOption === 'string' && input.bidDeadlineOption.trim()) {
        payload.bid_deadline_option = input.bidDeadlineOption.trim();
    }
    if (typeof input.bidResult === 'boolean') {
        payload.bid_result = input.bidResult;
    }
    if (typeof input.aiAnalysis === 'boolean') {
        payload.ai_analysis = input.aiAnalysis;
    }
    if (typeof input.levelUp === 'boolean') {
        payload.level_up = input.levelUp;
    }
    if (typeof input.badge === 'boolean') {
        payload.badge = input.badge;
    }
    if (typeof input.dailyMission === 'boolean') {
        payload.daily_mission = input.dailyMission;
    }
    if (typeof input.rankingChange === 'boolean') {
        payload.ranking_change = input.rankingChange;
    }
    if (typeof input.promotion === 'boolean') {
        payload.promotion = input.promotion;
    }
    if (typeof input.appUpdate === 'boolean') {
        payload.app_update = input.appUpdate;
    }
    if (typeof input.quietHoursEnabled === 'boolean') {
        payload.quiet_hours_enabled = input.quietHoursEnabled;
    }
    if (typeof input.quietHoursStart === 'string') {
        payload.quiet_hours_start = normalizeTimeText(
            input.quietHoursStart,
            DEFAULT_PREFERENCES.quietHoursStart
        );
    }
    if (typeof input.quietHoursEnd === 'string') {
        payload.quiet_hours_end = normalizeTimeText(
            input.quietHoursEnd,
            DEFAULT_PREFERENCES.quietHoursEnd
        );
    }
    if (typeof input.weekendEnabled === 'boolean') {
        payload.weekend_enabled = input.weekendEnabled;
    }

    return payload;
}

export async function getNotificationPreferencesForCurrentUser(): Promise<NotificationPreferencesInfo> {
    const userId = await getCurrentUserId();
    if (!userId) {
        throw new NotificationPreferenceAuthError();
    }

    const { row, hasTable } = await fetchPreferenceRow(userId);
    return mapRowToPreferences(row, hasTable);
}

export async function updateNotificationPreferencesForCurrentUser(
    input: NotificationPreferencesUpdateInput
): Promise<NotificationPreferencesInfo> {
    const userId = await getCurrentUserId();
    if (!userId) {
        throw new NotificationPreferenceAuthError();
    }

    const payload = toUpsertPayload(input);
    if (Object.keys(payload).length === 0) {
        return getNotificationPreferencesForCurrentUser();
    }

    const supabase = await createClient();
    const { data, error } = await supabase
        .from('notification_preferences')
        .upsert(
            {
                id: userId,
                user_id: userId,
                ...payload,
            },
            {
                onConflict: 'user_id',
            }
        )
        .select('*')
        .limit(1);

    if (error) {
        if (isMissingTableError(error)) {
            throw new NotificationPreferenceUnavailableError();
        }
        throw new Error('알림 설정 저장에 실패했습니다.');
    }

    const row = data && data.length > 0 ? asRecord(data[0]) : null;
    return mapRowToPreferences(row, true);
}
