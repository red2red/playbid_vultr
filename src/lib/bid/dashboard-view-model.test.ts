import { buildDashboardOverviewViewModel } from './dashboard-view-model';
import type { DashboardData } from './dashboard-query';

function createDashboardData(): DashboardData {
    return {
        counts: {
            closingTodayCount: 2,
            openingTodayCount: 1,
            bookmarkCount: 0,
            mockBidCount: 3,
            unreadNotificationCount: 4,
        },
        recentNotices: [],
        importantNotifications: [],
        refreshedAt: '2026-03-04T00:00:00.000Z',
        refreshedAtLabel: '2026.03.04 09:00',
        fromCache: false,
        cacheTtlMinutes: 15,
    };
}

describe('buildDashboardOverviewViewModel', () => {
    it('사용자명이 주어지지 않으면 범용 기본값을 사용한다', () => {
        const viewModel = buildDashboardOverviewViewModel(createDashboardData());

        expect(viewModel.userDisplayName).toBe('사용자');
    });

    it('실데이터 옵션이 주어지면 기본 목업값 대신 사용한다', () => {
        const viewModel = buildDashboardOverviewViewModel(createDashboardData(), {
            levelProgressPercent: 64,
            todayMissionItems: [
                { id: 'm-1', label: '실미션 1', completed: true },
                { id: 'm-2', label: '실미션 2', completed: false },
            ],
            winRateChangeLabel: '+3.2%p',
            recentBidRows: [
                {
                    id: 'h-1',
                    status: 'success',
                    detailHref: '/bid_history/analysis/h-1',
                    noticeTitle: '실공고',
                    bidAmountLabel: '120,000,000원',
                    rankLabel: '1위',
                    participantLabel: '12명',
                    dateLabel: '2026.03.04',
                },
            ],
        });

        expect(viewModel.levelProgressPercent).toBe(64);
        expect(viewModel.todayMission.completedCount).toBe(1);
        expect(viewModel.todayMission.totalCount).toBe(2);
        expect(viewModel.todayMission.items).toEqual([
            { id: 'm-1', label: '실미션 1', completed: true },
            { id: 'm-2', label: '실미션 2', completed: false },
        ]);
        expect(viewModel.winRateTrend.changeLabel).toBe('+3.2%p');
        expect(viewModel.recentBidRows).toHaveLength(1);
        expect(viewModel.recentBidRows[0]?.id).toBe('h-1');
    });
});
