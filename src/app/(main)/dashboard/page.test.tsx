import { render, screen } from '@testing-library/react';

const {
    getDashboardDataMock,
    getCurrentUserSummaryMock,
    buildDashboardOverviewViewModelMock,
    getChallengeUserLevelForCurrentUserMock,
    getDailyMissionsForCurrentUserMock,
    getBidHistoryListDataMock,
} = vi.hoisted(() => ({
    getDashboardDataMock: vi.fn(),
    getCurrentUserSummaryMock: vi.fn(),
    buildDashboardOverviewViewModelMock: vi.fn(),
    getChallengeUserLevelForCurrentUserMock: vi.fn(),
    getDailyMissionsForCurrentUserMock: vi.fn(),
    getBidHistoryListDataMock: vi.fn(),
}));

vi.mock('@/lib/bid/dashboard-query', () => ({
    getDashboardData: getDashboardDataMock,
}));

vi.mock('@/lib/bid/current-user-summary-query', () => ({
    getCurrentUserSummary: getCurrentUserSummaryMock,
}));

vi.mock('@/lib/bid/dashboard-view-model', () => ({
    buildDashboardOverviewViewModel: buildDashboardOverviewViewModelMock,
}));

vi.mock('@/lib/bid/challenge-service', () => ({
    getChallengeUserLevelForCurrentUser: getChallengeUserLevelForCurrentUserMock,
    getDailyMissionsForCurrentUser: getDailyMissionsForCurrentUserMock,
}));

vi.mock('@/lib/bid/bid-history-query', () => ({
    getBidHistoryListData: getBidHistoryListDataMock,
}));

vi.mock('@/components/dashboard/dashboard-overview-content', () => ({
    DashboardOverviewContent: (props: { viewModel: { userDisplayName: string } }) => (
        <div data-testid="dashboard-overview-content" data-user-display-name={props.viewModel.userDisplayName} />
    ),
}));

import DashboardPage from './page';

describe('DashboardPage', () => {
    beforeEach(() => {
        getDashboardDataMock.mockReset();
        getCurrentUserSummaryMock.mockReset();
        buildDashboardOverviewViewModelMock.mockReset();
        getChallengeUserLevelForCurrentUserMock.mockReset();
        getDailyMissionsForCurrentUserMock.mockReset();
        getBidHistoryListDataMock.mockReset();
    });

    it('현재 사용자 이름을 view model 생성 옵션으로 전달한다', async () => {
        const dashboardData = {
            counts: {
                closingTodayCount: 0,
                openingTodayCount: 0,
                bookmarkCount: 0,
                mockBidCount: 0,
                unreadNotificationCount: 0,
            },
            recentNotices: [],
            importantNotifications: [],
            refreshedAt: '2026-03-04T00:00:00.000Z',
            refreshedAtLabel: '2026.03.04 09:00',
            fromCache: false,
            cacheTtlMinutes: 15,
        };

        getDashboardDataMock.mockResolvedValue(dashboardData);
        getCurrentUserSummaryMock.mockResolvedValue({
            userId: 'user-1',
            email: 'real-user@example.com',
            displayName: '실사용자',
            avatarUrl: null,
            levelLabel: 'Lv.8',
        });
        getChallengeUserLevelForCurrentUserMock.mockResolvedValue({
            userId: 'user-1',
            level: 8,
            totalXp: 8000,
            currentLevelXp: 320,
            nextLevelXp: 500,
            progressPercent: 64,
            tier: 'silver',
            streakDays: 3,
            completedMissionCount: 17,
            updatedAtIso: '2026-03-04T00:00:00.000Z',
        });
        getDailyMissionsForCurrentUserMock.mockResolvedValue([
            {
                id: 'mission-1',
                title: '입찰 공고 1건 확인',
                description: '오늘의 입찰 공고를 확인하세요.',
                category: 'learning',
                missionType: 'daily',
                targetCount: 1,
                progressCount: 1,
                rewardXp: 30,
                isCompleted: true,
                completedAtIso: '2026-03-04T00:10:00.000Z',
                startsAtIso: '2026-03-04T00:00:00.000Z',
                endsAtIso: '2026-03-04T23:59:59.000Z',
            },
        ]);
        getBidHistoryListDataMock.mockResolvedValue({
            filters: {
                status: 'all',
                datePreset: 'all',
                organization: '',
                category: '',
                query: '',
                onlyWithResult: false,
                sort: 'latest',
                page: 1,
                pageSize: 3,
            },
            summary: {
                totalCount: 2,
                successCount: 1,
                failCount: 1,
                pendingCount: 0,
                voidCount: 0,
                withResultCount: 2,
                successRate: 50,
                averageDeviationPercent: 0.3,
                averageBidRate: 88.1,
            },
            categoryStats: [],
            monthlyTrends: [
                { monthKey: '2026-03', monthLabel: '2026.03', totalCount: 2, successCount: 1, successRate: 50 },
                { monthKey: '2026-02', monthLabel: '2026.02', totalCount: 2, successCount: 0, successRate: 0 },
            ],
            organizationOptions: [],
            items: [
                {
                    id: 'history-1',
                    bidNoticeNo: 'notice-1',
                    title: '실데이터 공고',
                    organization: '조달청',
                    category: 'construction',
                    categoryLabel: '공사',
                    status: 'success',
                    predictionMadeAtIso: '2026-03-04T01:00:00.000Z',
                    predictionMadeAtLabel: '2026. 03. 04. 10:00',
                    predictedPrice: 120000000,
                    predictedPriceLabel: '120,000,000원',
                    predictedRate: 88.1,
                    predictedRateLabel: '88.100%',
                    confidenceLevel: 0.8,
                    confidenceLabel: '80%',
                    virtualRank: 2,
                    totalParticipants: 25,
                    predictedRankLabel: '예상 2위 / 25개사',
                    hasResult: true,
                    winningAmount: 121000000,
                    winningAmountLabel: '121,000,000원',
                    winningRate: 88.3,
                    winningRateLabel: '88.300%',
                    deviationPercent: 0.2,
                    deviationPercentLabel: '0.200%',
                    differenceAmount: -1000000,
                    differenceAmountLabel: '-1,000,000원',
                    actualWinner: '테스트건설',
                    accuracyRate: 97.2,
                    accuracyRateLabel: '97.200%',
                },
            ],
            totalCount: 1,
            totalPages: 1,
            page: 1,
            pageSize: 3,
        });
        buildDashboardOverviewViewModelMock.mockReturnValue({
            userDisplayName: '실사용자',
        });

        const page = await DashboardPage();
        render(page);

        expect(getCurrentUserSummaryMock).toHaveBeenCalledTimes(1);
        expect(buildDashboardOverviewViewModelMock).toHaveBeenCalledWith(
            dashboardData,
            expect.objectContaining({
                userDisplayName: '실사용자',
                levelProgressPercent: 64,
                todayMissionItems: [
                    {
                        id: 'mission-1',
                        label: '입찰 공고 1건 확인',
                        completed: true,
                    },
                ],
                winRateChangeLabel: '+50.0%p',
                recentBidRows: [
                    expect.objectContaining({
                        id: 'history-1',
                        status: 'success',
                        detailHref: '/bid_history/analysis/history-1',
                        noticeTitle: '실데이터 공고',
                    }),
                ],
            })
        );
        expect(buildDashboardOverviewViewModelMock).not.toHaveBeenCalledWith(dashboardData, {
            userDisplayName: '홍길동',
        });
        expect(screen.getByTestId('dashboard-overview-content')).toHaveAttribute(
            'data-user-display-name',
            '실사용자'
        );
    });
});
