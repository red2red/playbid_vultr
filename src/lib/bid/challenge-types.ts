export type MissionCategory = 'mock_bid' | 'learning' | 'login' | 'attendance' | 'other';
export type UserTier = 'bronze' | 'silver' | 'gold' | 'platinum' | 'diamond' | 'unknown';

export interface UserLevel {
    userId: string;
    level: number;
    totalXp: number;
    currentLevelXp: number;
    nextLevelXp: number;
    progressPercent: number;
    tier: UserTier;
    streakDays: number;
    completedMissionCount: number;
    updatedAtIso: string | null;
}

export interface Mission {
    id: string;
    title: string;
    description: string;
    category: MissionCategory;
    missionType: string;
    targetCount: number;
    progressCount: number;
    rewardXp: number;
    isCompleted: boolean;
    completedAtIso: string | null;
    startsAtIso: string | null;
    endsAtIso: string | null;
}

export interface MissionCompletionResult {
    missionId: string;
    completed: boolean;
    xpGained: number;
}
