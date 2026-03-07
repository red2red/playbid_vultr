import { createClient } from '@/lib/supabase/server';
import type { Mission, MissionCompletionResult, UserLevel } from './challenge-types';

export class ChallengeAuthError extends Error {
    constructor(message = '로그인이 필요합니다.') {
        super(message);
        this.name = 'ChallengeAuthError';
    }
}

export class ChallengeUnavailableError extends Error {
    constructor(message = '챌린지 기능을 사용할 수 없습니다.') {
        super(message);
        this.name = 'ChallengeUnavailableError';
    }
}

interface CompleteChallengeMissionInput {
    missionId: string;
    increment?: number;
}

function buildEmptyLevel(userId: string): UserLevel {
    return {
        userId,
        level: 1,
        totalXp: 0,
        currentLevelXp: 0,
        nextLevelXp: 500,
        progressPercent: 0,
        tier: 'unknown',
        streakDays: 0,
        completedMissionCount: 0,
        updatedAtIso: null,
    };
}

export async function getChallengeUserLevelForCurrentUser(): Promise<UserLevel | null> {
    const supabase = await createClient();
    const {
        data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
        throw new ChallengeAuthError();
    }

    return buildEmptyLevel(user.id);
}

export async function getDailyMissionsForCurrentUser(limit = 10): Promise<Mission[]> {
    const supabase = await createClient();
    const {
        data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
        throw new ChallengeAuthError();
    }

    void limit;
    return [];
}

export async function completeChallengeMissionForCurrentUser(
    input: CompleteChallengeMissionInput
): Promise<MissionCompletionResult> {
    const supabase = await createClient();
    const {
        data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
        throw new ChallengeAuthError();
    }

    return {
        missionId: input.missionId,
        completed: true,
        xpGained: Math.max(0, input.increment ?? 0),
    };
}
