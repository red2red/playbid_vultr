import { createClient } from '@/lib/supabase/server';

export type RankingTab = 'weekly' | 'monthly' | 'all';
export type LeaderboardPeriodType = 'weekly' | 'monthly' | 'all_time';

export interface ChallengeLevelSummary {
    currentLevel: number;
    totalXp: number;
    levelProgress: number;
    nextLevelXp: number;
}

export interface ChallengeMissionItem {
    id: string;
    missionId: string;
    title: string;
    description: string;
    type: string;
    difficulty: string;
    targetCount: number;
    currentProgress: number;
    rewardXp: number;
    isCompleted: boolean;
    rewardClaimed: boolean;
    assignedDate: string | null;
}

export interface ChallengeBadgeItem {
    id: string;
    name: string;
    description: string;
    icon: string;
    unlockType: string;
    unlockValue: number | null;
    unlockCondition: string | null;
    tier: string | null;
    category: string | null;
    isUnlocked: boolean;
    earnedAt: string | null;
}

export interface ChallengeLeaderboardEntry {
    id: string;
    userId: string;
    rank: number;
    totalXp: number;
    username: string;
}

export interface ChallengeLearningPreviewItem {
    id: string;
    title: string;
    type: string;
    difficulty: string;
    categoryName: string;
}

export interface ChallengeOverviewData {
    authRequired: boolean;
    levelSummary: ChallengeLevelSummary;
    todayMissionDate: string | null;
    todayMissions: ChallengeMissionItem[];
    badges: ChallengeBadgeItem[];
    leaderboardPreview: ChallengeLeaderboardEntry[];
    learningPreview: ChallengeLearningPreviewItem[];
}

export interface ChallengeMissionsData {
    authRequired: boolean;
    todayMissionDate: string | null;
    missions: ChallengeMissionItem[];
}

export interface ChallengeBadgesData {
    authRequired: boolean;
    levelSummary: ChallengeLevelSummary;
    completedMissionCount: number;
    badges: ChallengeBadgeItem[];
}

export interface ChallengeRankingData {
    authRequired: boolean;
    selectedTab: RankingTab;
    leaderboard: ChallengeLeaderboardEntry[];
}

interface BadgeUnlockInput {
    id: string;
    unlock_type?: string | null;
    unlock_value?: number | null;
}

interface BadgeUnlockStats {
    currentLevel: number;
    totalXp: number;
    completedMissionCount: number;
    earnedBadgeIds: Set<string>;
}

type AnyRecord = Record<string, unknown>;
type SupabaseServerClient = Awaited<ReturnType<typeof createClient>>;

const DEFAULT_LEVEL_SUMMARY: ChallengeLevelSummary = {
    currentLevel: 1,
    totalXp: 0,
    levelProgress: 0,
    nextLevelXp: 100,
};

const RANKING_TAB_ALIASES: Record<string, RankingTab> = {
    weekly: 'weekly',
    month: 'monthly',
    monthly: 'monthly',
    all: 'all',
    all_time: 'all',
    alltime: 'all',
    overall: 'all',
    total: 'all',
};

const KST_DATE_FORMATTER = new Intl.DateTimeFormat('sv-SE', {
    timeZone: 'Asia/Seoul',
});

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
        const normalized = value.trim().toLowerCase();
        if (normalized === 'true' || normalized === '1' || normalized === 'yes') {
            return true;
        }
        if (normalized === 'false' || normalized === '0' || normalized === 'no') {
            return false;
        }
    }
    return null;
}

function resolveUserName(candidate: AnyRecord | null): string {
    if (!candidate) {
        return '익명 사용자';
    }
    return (
        asString(candidate.username)
        ?? asString(candidate.name)
        ?? asString(candidate.full_name)
        ?? '익명 사용자'
    );
}

function getCurrentKstDate(): string {
    return KST_DATE_FORMATTER.format(new Date());
}

function normalizeLevelSummary(row: AnyRecord | null): ChallengeLevelSummary {
    if (!row) {
        return DEFAULT_LEVEL_SUMMARY;
    }

    const currentLevel = Math.max(1, Math.round(asNumber(row.current_level) ?? DEFAULT_LEVEL_SUMMARY.currentLevel));
    const totalXp = Math.max(0, Math.round(asNumber(row.total_xp) ?? DEFAULT_LEVEL_SUMMARY.totalXp));
    const nextLevelXp = Math.max(1, Math.round(asNumber(row.next_level_xp) ?? DEFAULT_LEVEL_SUMMARY.nextLevelXp));
    const levelProgressRaw = asNumber(row.level_progress);

    let levelProgress = levelProgressRaw ?? 0;
    if (levelProgressRaw === null) {
        const currentLevelFloorXp = Math.max(0, (currentLevel - 1) * 100);
        const levelWindow = Math.max(1, nextLevelXp - currentLevelFloorXp);
        levelProgress = ((totalXp - currentLevelFloorXp) / levelWindow) * 100;
    }

    return {
        currentLevel,
        totalXp,
        nextLevelXp,
        levelProgress: Math.max(0, Math.min(100, Number(levelProgress.toFixed(2)))),
    };
}

function normalizeMissionRow(row: AnyRecord): ChallengeMissionItem {
    const mission = asRecord(row.mission) ?? asRecord(row.missions);
    const fallbackId = asString(row.id) ?? crypto.randomUUID();

    const missionId = asString(row.mission_id)
        ?? asString(mission?.id)
        ?? fallbackId;

    return {
        id: fallbackId,
        missionId,
        title: asString(mission?.title) ?? asString(row.title) ?? '미션',
        description: asString(mission?.description) ?? asString(row.description) ?? '설명이 없습니다.',
        type: asString(mission?.type) ?? asString(row.type) ?? 'daily',
        difficulty: asString(mission?.difficulty) ?? asString(row.difficulty) ?? 'easy',
        targetCount: Math.max(1, Math.round(asNumber(row.target_count) ?? asNumber(mission?.target_count) ?? 1)),
        currentProgress: Math.max(0, Math.round(asNumber(row.current_progress) ?? 0)),
        rewardXp: Math.max(0, Math.round(asNumber(mission?.reward_xp) ?? asNumber(row.reward_xp) ?? 0)),
        isCompleted: asBoolean(row.is_completed) ?? false,
        rewardClaimed: asBoolean(row.reward_claimed) ?? false,
        assignedDate: asString(row.assigned_date),
    };
}

function normalizeLeaderboardRows(rows: AnyRecord[]): ChallengeLeaderboardEntry[] {
    return rows.map((row, index) => {
        const profileRaw = row.profiles;
        const profile = Array.isArray(profileRaw) ? asRecord(profileRaw[0]) : asRecord(profileRaw);
        const rank = Math.max(1, Math.round(asNumber(row.rank) ?? index + 1));

        return {
            id: asString(row.id) ?? `${asString(row.user_id) ?? index}-${rank}`,
            userId: asString(row.user_id) ?? '',
            rank,
            totalXp: Math.max(0, Math.round(asNumber(row.total_xp) ?? 0)),
            username: asString(row.username) ?? resolveUserName(profile),
        };
    });
}

async function getCurrentUserId(supabase: SupabaseServerClient): Promise<string | null> {
    const {
        data: { user },
    } = await supabase.auth.getUser();

    return user?.id ?? null;
}

async function readLevelSummary(
    supabase: SupabaseServerClient,
    userId: string
): Promise<ChallengeLevelSummary> {
    const { data } = await supabase
        .from('user_levels')
        .select('current_level, total_xp, level_progress, next_level_xp')
        .eq('user_id', userId)
        .limit(1)
        .maybeSingle();

    return normalizeLevelSummary(asRecord(data));
}

async function readReferenceMissionDate(
    supabase: SupabaseServerClient,
    userId: string
): Promise<string> {
    const { data } = await supabase
        .from('user_missions')
        .select('assigned_date')
        .eq('user_id', userId)
        .order('assigned_date', { ascending: false })
        .limit(1)
        .maybeSingle();

    return asString(asRecord(data)?.assigned_date) ?? getCurrentKstDate();
}

async function readTodayMissions(
    supabase: SupabaseServerClient,
    userId: string,
    referenceDate: string
): Promise<ChallengeMissionItem[]> {
    const { data } = await supabase
        .from('user_missions')
        .select(
            'id, mission_id, assigned_date, target_count, current_progress, is_completed, reward_claimed, missions(id, title, description, type, difficulty, target_count, reward_xp)'
        )
        .eq('user_id', userId)
        .eq('assigned_date', referenceDate)
        .order('created_at', { ascending: true });

    const rows = Array.isArray(data)
        ? data
            .map((item) => asRecord(item))
            .filter((item): item is AnyRecord => item !== null)
        : [];

    if (rows.length > 0) {
        return rows.map(normalizeMissionRow);
    }

    const { data: fallbackDefinitions } = await supabase
        .from('missions')
        .select('id, title, description, type, difficulty, target_count, reward_xp')
        .eq('is_active', true)
        .eq('type', 'daily')
        .order('difficulty', { ascending: true })
        .limit(5);

    const fallbackRows = Array.isArray(fallbackDefinitions)
        ? fallbackDefinitions
            .map((item) => asRecord(item))
            .filter((item): item is AnyRecord => item !== null)
        : [];

    return fallbackRows.map((row, index) =>
        normalizeMissionRow({
            ...row,
            id: asString(row.id) ?? `fallback-${index}`,
            mission_id: asString(row.id) ?? `fallback-mission-${index}`,
            assigned_date: referenceDate,
            current_progress: 0,
            is_completed: false,
            reward_claimed: false,
            mission: row,
        })
    );
}

async function readCompletedMissionCount(
    supabase: SupabaseServerClient,
    userId: string
): Promise<number> {
    const { count } = await supabase
        .from('user_missions')
        .select('id', { count: 'exact', head: true })
        .eq('user_id', userId)
        .eq('is_completed', true);

    return Math.max(0, count ?? 0);
}

export function normalizeRankingTab(raw: string | string[] | undefined): RankingTab {
    const value = Array.isArray(raw) ? raw[0] : raw;
    const normalized = (value ?? '').toLowerCase().trim();
    return RANKING_TAB_ALIASES[normalized] ?? 'weekly';
}

export function toLeaderboardPeriodType(tab: RankingTab): LeaderboardPeriodType {
    if (tab === 'monthly') {
        return 'monthly';
    }
    if (tab === 'all') {
        return 'all_time';
    }
    return 'weekly';
}

export function isBadgeUnlocked(badge: BadgeUnlockInput, stats: BadgeUnlockStats): boolean {
    if (stats.earnedBadgeIds.has(badge.id)) {
        return true;
    }

    const unlockType = (badge.unlock_type ?? '').toLowerCase().trim();
    const unlockValue = Math.max(0, Math.round(badge.unlock_value ?? 0));

    if (unlockType === 'level') {
        return stats.currentLevel >= unlockValue;
    }
    if (unlockType === 'xp_total') {
        return stats.totalXp >= unlockValue;
    }
    if (unlockType === 'mission_count') {
        return stats.completedMissionCount >= unlockValue;
    }
    return false;
}

async function readBadges(
    supabase: SupabaseServerClient,
    userId: string,
    levelSummary: ChallengeLevelSummary
): Promise<ChallengeBadgeItem[]> {
    const [badgeRes, userBadgeRes, completedMissionCount] = await Promise.all([
        supabase
            .from('badges')
            .select('id, name, description, icon, unlock_type, unlock_value, unlock_condition, tier, category, sort_order')
            .eq('is_active', true)
            .order('sort_order', { ascending: true }),
        supabase
            .from('user_badges')
            .select('badge_id, earned_at')
            .eq('user_id', userId),
        readCompletedMissionCount(supabase, userId),
    ]);

    const earnedByBadgeId = new Map<string, string | null>();
    const earnedBadgeIds = new Set<string>();

    if (Array.isArray(userBadgeRes.data)) {
        userBadgeRes.data.forEach((raw) => {
            const row = asRecord(raw);
            const badgeId = asString(row?.badge_id);
            if (!badgeId) {
                return;
            }
            earnedBadgeIds.add(badgeId);
            earnedByBadgeId.set(badgeId, asString(row?.earned_at));
        });
    }

    const rows = Array.isArray(badgeRes.data)
        ? badgeRes.data
            .map((item) => asRecord(item))
            .filter((item): item is AnyRecord => item !== null)
        : [];

    return rows.map((row, index) => {
        const id = asString(row.id) ?? `badge-${index}`;
        return {
            id,
            name: asString(row.name) ?? '뱃지',
            description: asString(row.description) ?? '설명이 없습니다.',
            icon: asString(row.icon) ?? '🏅',
            unlockType: asString(row.unlock_type) ?? 'special',
            unlockValue: asNumber(row.unlock_value),
            unlockCondition: asString(row.unlock_condition),
            tier: asString(row.tier),
            category: asString(row.category),
            isUnlocked: isBadgeUnlocked(
                {
                    id,
                    unlock_type: asString(row.unlock_type),
                    unlock_value: asNumber(row.unlock_value),
                },
                {
                    currentLevel: levelSummary.currentLevel,
                    totalXp: levelSummary.totalXp,
                    completedMissionCount,
                    earnedBadgeIds,
                }
            ),
            earnedAt: earnedByBadgeId.get(id) ?? null,
        };
    });
}

async function readLeaderboardEntries(
    supabase: SupabaseServerClient,
    periodType: LeaderboardPeriodType,
    limit: number
): Promise<ChallengeLeaderboardEntry[]> {
    const { data: latestPeriodRow } = await supabase
        .from('leaderboards')
        .select('period_start')
        .eq('period_type', periodType)
        .order('period_start', { ascending: false })
        .limit(1)
        .maybeSingle();

    const latestPeriodStart = asString(asRecord(latestPeriodRow)?.period_start);

    let leaderboardRows: AnyRecord[] = [];
    if (latestPeriodStart) {
        const { data } = await supabase
            .from('leaderboards')
            .select('id, user_id, rank, total_xp, username')
            .eq('period_type', periodType)
            .eq('period_start', latestPeriodStart)
            .order('rank', { ascending: true })
            .limit(limit);

        leaderboardRows = Array.isArray(data)
            ? data
                .map((item) => asRecord(item))
                .filter((item): item is AnyRecord => item !== null)
            : [];
    }

    if (leaderboardRows.length > 0) {
        return normalizeLeaderboardRows(leaderboardRows);
    }

    const { data: fallback } = await supabase
        .from('user_levels')
        .select('user_id, total_xp, current_level, profiles(username, name, full_name)')
        .order('total_xp', { ascending: false })
        .limit(limit);

    const fallbackRows = Array.isArray(fallback)
        ? fallback
            .map((item) => asRecord(item))
            .filter((item): item is AnyRecord => item !== null)
            .map((row, index) => ({
                id: `fallback-${index}`,
                user_id: asString(row.user_id) ?? '',
                rank: index + 1,
                total_xp: asNumber(row.total_xp) ?? 0,
                username: null,
                profiles: row.profiles,
            }))
        : [];

    return normalizeLeaderboardRows(fallbackRows);
}

async function readLearningPreview(
    supabase: SupabaseServerClient,
    limit = 4
): Promise<ChallengeLearningPreviewItem[]> {
    const { data } = await supabase
        .from('learning_contents')
        .select('id, title, type, difficulty, learning_categories(name)')
        .order('created_at', { ascending: false })
        .limit(limit);

    if (!Array.isArray(data)) {
        return [];
    }

    return data
        .map((raw) => asRecord(raw))
        .filter((row): row is AnyRecord => row !== null)
        .map((row, index) => {
            const categoryRaw = row.learning_categories;
            const categoryRecord = Array.isArray(categoryRaw) ? asRecord(categoryRaw[0]) : asRecord(categoryRaw);
            return {
                id: asString(row.id) ?? `learning-${index}`,
                title: asString(row.title) ?? '학습 콘텐츠',
                type: asString(row.type) ?? 'term',
                difficulty: asString(row.difficulty) ?? 'easy',
                categoryName: asString(categoryRecord?.name) ?? '기타',
            };
        });
}

export async function getChallengeOverviewData(): Promise<ChallengeOverviewData> {
    const supabase = await createClient();
    const userId = await getCurrentUserId(supabase);

    if (!userId) {
        return {
            authRequired: true,
            levelSummary: DEFAULT_LEVEL_SUMMARY,
            todayMissionDate: null,
            todayMissions: [],
            badges: [],
            leaderboardPreview: [],
            learningPreview: [],
        };
    }

    const levelSummary = await readLevelSummary(supabase, userId);
    const referenceDate = await readReferenceMissionDate(supabase, userId);
    const [todayMissions, badges, leaderboardPreview, learningPreview] = await Promise.all([
        readTodayMissions(supabase, userId, referenceDate),
        readBadges(supabase, userId, levelSummary),
        readLeaderboardEntries(supabase, 'weekly', 5),
        readLearningPreview(supabase, 4),
    ]);

    return {
        authRequired: false,
        levelSummary,
        todayMissionDate: referenceDate,
        todayMissions,
        badges,
        leaderboardPreview,
        learningPreview,
    };
}

export async function getChallengeMissionsData(): Promise<ChallengeMissionsData> {
    const supabase = await createClient();
    const userId = await getCurrentUserId(supabase);

    if (!userId) {
        return {
            authRequired: true,
            todayMissionDate: null,
            missions: [],
        };
    }

    const referenceDate = await readReferenceMissionDate(supabase, userId);
    const missions = await readTodayMissions(supabase, userId, referenceDate);

    return {
        authRequired: false,
        todayMissionDate: referenceDate,
        missions,
    };
}

export async function getChallengeBadgesData(): Promise<ChallengeBadgesData> {
    const supabase = await createClient();
    const userId = await getCurrentUserId(supabase);

    if (!userId) {
        return {
            authRequired: true,
            levelSummary: DEFAULT_LEVEL_SUMMARY,
            completedMissionCount: 0,
            badges: [],
        };
    }

    const levelSummary = await readLevelSummary(supabase, userId);
    const [badges, completedMissionCount] = await Promise.all([
        readBadges(supabase, userId, levelSummary),
        readCompletedMissionCount(supabase, userId),
    ]);

    return {
        authRequired: false,
        levelSummary,
        completedMissionCount,
        badges,
    };
}

export async function getChallengeRankingData(rawTab: string | string[] | undefined): Promise<ChallengeRankingData> {
    const supabase = await createClient();
    const userId = await getCurrentUserId(supabase);
    const selectedTab = normalizeRankingTab(rawTab);

    if (!userId) {
        return {
            authRequired: true,
            selectedTab,
            leaderboard: [],
        };
    }

    const leaderboard = await readLeaderboardEntries(
        supabase,
        toLeaderboardPeriodType(selectedTab),
        30
    );

    return {
        authRequired: false,
        selectedTab,
        leaderboard,
    };
}
