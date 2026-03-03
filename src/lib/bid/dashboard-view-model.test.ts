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
});
