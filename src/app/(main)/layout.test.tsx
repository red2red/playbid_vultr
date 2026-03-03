import { render, screen } from '@testing-library/react';
import type { ReactNode } from 'react';

const { getCurrentUserSummaryMock, DashboardShellPropsMock } = vi.hoisted(() => ({
    getCurrentUserSummaryMock: vi.fn(),
    DashboardShellPropsMock: vi.fn(),
}));

vi.mock('@/lib/bid/current-user-summary-query', () => ({
    getCurrentUserSummary: getCurrentUserSummaryMock,
}));

vi.mock('@/components/dashboard/dashboard-shell', () => ({
    DashboardShell: (props: {
        children: ReactNode;
        userDisplayName?: string;
        userLevelLabel?: string | null;
    }) => {
        DashboardShellPropsMock(props);

        return (
            <div
                data-testid="dashboard-shell-mock"
                data-user-display-name={props.userDisplayName ?? ''}
                data-user-level-label={props.userLevelLabel ?? ''}
            >
                {props.children}
            </div>
        );
    },
}));

import MainLayout from './layout';

describe('MainLayout', () => {
    beforeEach(() => {
        getCurrentUserSummaryMock.mockReset();
        DashboardShellPropsMock.mockReset();
    });

    it('현재 사용자 요약 정보를 DashboardShell에 전달한다', async () => {
        getCurrentUserSummaryMock.mockResolvedValue({
            userId: 'user-1',
            email: 'user@example.com',
            displayName: '실사용자',
            avatarUrl: null,
            levelLabel: 'Lv.9',
        });

        const view = await MainLayout({
            children: <div data-testid="layout-child">child</div>,
        });

        render(view);

        expect(getCurrentUserSummaryMock).toHaveBeenCalledTimes(1);
        expect(screen.getByTestId('dashboard-shell-mock')).toHaveAttribute(
            'data-user-display-name',
            '실사용자'
        );
        expect(screen.getByTestId('dashboard-shell-mock')).toHaveAttribute(
            'data-user-level-label',
            'Lv.9'
        );
        expect(screen.getByTestId('layout-child')).toBeInTheDocument();
    });
});
