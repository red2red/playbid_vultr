import { render, screen } from '@testing-library/react';

const {
    getDashboardDataMock,
    getCurrentUserSummaryMock,
    buildDashboardOverviewViewModelMock,
} = vi.hoisted(() => ({
    getDashboardDataMock: vi.fn(),
    getCurrentUserSummaryMock: vi.fn(),
    buildDashboardOverviewViewModelMock: vi.fn(),
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
        buildDashboardOverviewViewModelMock.mockReturnValue({
            userDisplayName: '실사용자',
        });

        const page = await DashboardPage();
        render(page);

        expect(getCurrentUserSummaryMock).toHaveBeenCalledTimes(1);
        expect(buildDashboardOverviewViewModelMock).toHaveBeenCalledWith(dashboardData, {
            userDisplayName: '실사용자',
        });
        expect(buildDashboardOverviewViewModelMock).not.toHaveBeenCalledWith(dashboardData, {
            userDisplayName: '홍길동',
        });
        expect(screen.getByTestId('dashboard-overview-content')).toHaveAttribute(
            'data-user-display-name',
            '실사용자'
        );
    });
});
