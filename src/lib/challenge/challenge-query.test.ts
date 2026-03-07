import {
    isBadgeUnlocked,
    normalizeRankingTab,
    toLeaderboardPeriodType,
} from './challenge-query';

describe('challenge-query helpers', () => {
    describe('normalizeRankingTab', () => {
        it('지원 탭 값을 정규화한다', () => {
            expect(normalizeRankingTab(undefined)).toBe('weekly');
            expect(normalizeRankingTab('weekly')).toBe('weekly');
            expect(normalizeRankingTab('MONTHLY')).toBe('monthly');
            expect(normalizeRankingTab('all')).toBe('all');
            expect(normalizeRankingTab('all_time')).toBe('all');
            expect(normalizeRankingTab('overall')).toBe('all');
            expect(normalizeRankingTab('something-else')).toBe('weekly');
        });
    });

    describe('toLeaderboardPeriodType', () => {
        it('랭킹 탭을 DB period_type으로 매핑한다', () => {
            expect(toLeaderboardPeriodType('weekly')).toBe('weekly');
            expect(toLeaderboardPeriodType('monthly')).toBe('monthly');
            expect(toLeaderboardPeriodType('all')).toBe('all_time');
        });
    });

    describe('isBadgeUnlocked', () => {
        const baseStats = {
            currentLevel: 5,
            totalXp: 240,
            completedMissionCount: 12,
            earnedBadgeIds: new Set<string>(),
        };

        it('이미 획득한 배지는 조건과 무관하게 해금 처리한다', () => {
            const stats = {
                ...baseStats,
                earnedBadgeIds: new Set(['b1']),
            };

            expect(
                isBadgeUnlocked(
                    {
                        id: 'b1',
                        unlock_type: 'special',
                        unlock_value: 999,
                    },
                    stats
                )
            ).toBe(true);
        });

        it('level/xp_total/mission_count 조건을 평가한다', () => {
            expect(
                isBadgeUnlocked(
                    {
                        id: 'level-badge',
                        unlock_type: 'level',
                        unlock_value: 5,
                    },
                    baseStats
                )
            ).toBe(true);

            expect(
                isBadgeUnlocked(
                    {
                        id: 'xp-badge',
                        unlock_type: 'xp_total',
                        unlock_value: 300,
                    },
                    baseStats
                )
            ).toBe(false);

            expect(
                isBadgeUnlocked(
                    {
                        id: 'mission-badge',
                        unlock_type: 'mission_count',
                        unlock_value: 10,
                    },
                    baseStats
                )
            ).toBe(true);
        });
    });
});
