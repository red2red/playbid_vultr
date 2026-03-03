import { cache } from 'react';
import { createClient } from '@/lib/supabase/server';

type AnyRecord = Record<string, unknown>;

const DEFAULT_DISPLAY_NAME = '사용자';

export interface CurrentUserSummary {
    userId: string | null;
    email: string | null;
    displayName: string;
    avatarUrl: string | null;
    levelLabel: string | null;
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
        const parsed = Number(value.trim());
        return Number.isFinite(parsed) ? parsed : null;
    }

    return null;
}

function toArray(value: unknown): AnyRecord[] {
    if (!Array.isArray(value)) {
        return [];
    }

    return value
        .map((item) => asRecord(item))
        .filter((item): item is AnyRecord => item !== null);
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

function isSchemaUnavailableError(error: unknown): boolean {
    const record = asRecord(error);
    if (!record) {
        return false;
    }

    const code = asString(record.code);
    if (code === '42P01' || code === '42703') {
        return true;
    }

    const message = asString(record.message)?.toLowerCase() ?? '';
    return (
        (message.includes('relation') && message.includes('does not exist')) ||
        (message.includes('column') && message.includes('does not exist'))
    );
}

function emailLocalPart(email: string | null): string | null {
    if (!email) {
        return null;
    }

    const [localPart] = email.split('@');
    const trimmed = localPart?.trim();
    return trimmed && trimmed.length > 0 ? trimmed : null;
}

async function fetchProfileRow(supabase: Awaited<ReturnType<typeof createClient>>, userId: string): Promise<AnyRecord | null> {
    const byId = await supabase.from('profiles').select('full_name, username, avatar_url').eq('id', userId).limit(1);

    const byIdRows = toArray(byId.data);
    if (byIdRows.length > 0) {
        return byIdRows[0];
    }

    const byUserId = await supabase
        .from('profiles')
        .select('full_name, username, avatar_url')
        .eq('user_id', userId)
        .limit(1);

    return toArray(byUserId.data)[0] ?? null;
}

async function fetchUserProfileRow(
    supabase: Awaited<ReturnType<typeof createClient>>,
    userId: string
): Promise<AnyRecord | null> {
    const byUserId = await supabase
        .from('user_profiles')
        .select('nickname, avatar_url')
        .eq('user_id', userId)
        .limit(1);

    const byUserIdRows = toArray(byUserId.data);
    if (byUserIdRows.length > 0) {
        return byUserIdRows[0];
    }

    const byId = await supabase.from('user_profiles').select('nickname, avatar_url').eq('id', userId).limit(1);

    return toArray(byId.data)[0] ?? null;
}

async function fetchCurrentLevelLabel(
    supabase: Awaited<ReturnType<typeof createClient>>,
    userId: string
): Promise<string | null> {
    const { data, error } = await supabase
        .from('user_levels')
        .select('current_level, updated_at')
        .eq('user_id', userId)
        .order('updated_at', { ascending: false, nullsFirst: false })
        .limit(1);

    if (error) {
        if (isSchemaUnavailableError(error)) {
            return null;
        }
        return null;
    }

    const row = toArray(data)[0] ?? null;
    if (!row) {
        return null;
    }

    const level = asNumber(row.current_level);
    if (level === null || level < 1) {
        return null;
    }

    return `Lv.${Math.floor(level)}`;
}

async function readCurrentUserSummary(): Promise<CurrentUserSummary> {
    try {
        const supabase = await createClient();
        const {
            data: { user },
            error,
        } = await supabase.auth.getUser();

        if (error || !user) {
            return {
                userId: null,
                email: null,
                displayName: DEFAULT_DISPLAY_NAME,
                avatarUrl: null,
                levelLabel: null,
            };
        }

        const userId = user.id;
        const email = asString(user.email) ?? null;
        const metadata = asRecord(user.user_metadata);

        const [profileRow, userProfileRow, levelLabel] = await Promise.all([
            fetchProfileRow(supabase, userId),
            fetchUserProfileRow(supabase, userId),
            fetchCurrentLevelLabel(supabase, userId),
        ]);

        const displayName =
            pickString(userProfileRow, ['nickname']) ??
            pickString(profileRow, ['full_name', 'username']) ??
            pickString(metadata, ['nickname', 'full_name', 'name', 'user_name']) ??
            emailLocalPart(email) ??
            DEFAULT_DISPLAY_NAME;

        const avatarUrl =
            pickString(userProfileRow, ['avatar_url']) ??
            pickString(profileRow, ['avatar_url']) ??
            pickString(metadata, ['avatar_url', 'picture']) ??
            null;

        return {
            userId,
            email,
            displayName,
            avatarUrl,
            levelLabel,
        };
    } catch {
        return {
            userId: null,
            email: null,
            displayName: DEFAULT_DISPLAY_NAME,
            avatarUrl: null,
            levelLabel: null,
        };
    }
}

let summaryCacheVersion = 0;

const getCurrentUserSummaryCached = cache(async (cacheVersion: number): Promise<CurrentUserSummary> => {
    void cacheVersion;
    return readCurrentUserSummary();
});

export async function getCurrentUserSummary(): Promise<CurrentUserSummary> {
    return getCurrentUserSummaryCached(summaryCacheVersion);
}

export function clearCurrentUserSummaryCacheForTest(): void {
    summaryCacheVersion += 1;
}
