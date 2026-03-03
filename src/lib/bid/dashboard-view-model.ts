import type { DashboardData, DashboardQueryError } from './dashboard-query';

export type DashboardBidStatus = 'success' | 'failed' | 'pending';

export interface DashboardRecentBidRow {
    id: string;
    status: DashboardBidStatus;
    detailHref: string;
    noticeTitle: string;
    bidAmountLabel: string;
    rankLabel: string;
    participantLabel: string;
    dateLabel: string;
}

interface DashboardMissionItem {
    id: string;
    label: string;
    completed: boolean;
}

interface DashboardWeeklySummary {
    participationCount: number;
    closingTodayCount: number;
    unreadNotificationCount: number;
}

interface DashboardTodayMission {
    completedCount: number;
    totalCount: number;
    items: DashboardMissionItem[];
}

interface DashboardWinRateTrend {
    changeLabel: string;
}

export interface DashboardOverviewViewModel {
    userDisplayName: string;
    levelProgressPercent: number;
    weeklySummary: DashboardWeeklySummary;
    todayMission: DashboardTodayMission;
    winRateTrend: DashboardWinRateTrend;
    recentBidRows: DashboardRecentBidRow[];
    authError?: DashboardQueryError;
}

interface BuildDashboardOverviewOptions {
    userDisplayName?: string;
    levelProgressPercent?: number;
}

const FALLBACK_RECENT_BID_ROWS: DashboardRecentBidRow[] = [
    {
        id: 'recent-1',
        status: 'success',
        detailHref: '/bid_history?recent=recent-1',
        noticeTitle: '2024년 도로보수공사 (서울)',
        bidAmountLabel: '1억 2,045만원',
        rankLabel: '1위',
        participantLabel: '23명',
        dateLabel: '2024.02.15',
    },
    {
        id: 'recent-2',
        status: 'failed',
        detailHref: '/bid_history?recent=recent-2',
        noticeTitle: '강남구 청사 청소용역',
        bidAmountLabel: '3,420만원',
        rankLabel: '8위',
        participantLabel: '15명',
        dateLabel: '2024.02.14',
    },
    {
        id: 'recent-3',
        status: 'pending',
        detailHref: '/bid_history?recent=recent-3',
        noticeTitle: '학교 전기공사',
        bidAmountLabel: '8,900만원',
        rankLabel: '-',
        participantLabel: '45명',
        dateLabel: '2024.02.20',
    },
];

function clampPercent(value: number): number {
    if (value < 0) {
        return 0;
    }
    if (value > 100) {
        return 100;
    }
    return Math.round(value);
}

export function buildDashboardOverviewViewModel(
    data: DashboardData,
    options: BuildDashboardOverviewOptions = {}
): DashboardOverviewViewModel {
    const userDisplayName = options.userDisplayName ?? '사용자';
    const levelProgressPercent = clampPercent(options.levelProgressPercent ?? 78);
    const completedCount = data.counts.mockBidCount > 0 ? 1 : 0;

    return {
        userDisplayName,
        levelProgressPercent,
        weeklySummary: {
            participationCount: data.counts.mockBidCount,
            closingTodayCount: data.counts.closingTodayCount,
            unreadNotificationCount: data.counts.unreadNotificationCount,
        },
        todayMission: {
            completedCount,
            totalCount: 3,
            items: [
                {
                    id: 'mission-mock-bid',
                    label: '모의입찰 3회 실시',
                    completed: completedCount >= 1,
                },
                {
                    id: 'mission-quiz',
                    label: '입찰 퀴즈 1회 참여',
                    completed: false,
                },
                {
                    id: 'mission-learning',
                    label: '오늘의 학습 1건 열람',
                    completed: false,
                },
            ],
        },
        winRateTrend: {
            changeLabel: '+12.4%',
        },
        recentBidRows: FALLBACK_RECENT_BID_ROWS,
        authError: data.error,
    };
}
