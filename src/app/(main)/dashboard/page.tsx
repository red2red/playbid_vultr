import { getDashboardData } from '@/lib/bid/dashboard-query';
import { DashboardOverviewContent } from '@/components/dashboard/dashboard-overview-content';
import {
    buildDashboardOverviewViewModel,
    type DashboardRecentBidRow,
} from '@/lib/bid/dashboard-view-model';
import { getCurrentUserSummary } from '@/lib/bid/current-user-summary-query';
import {
    getChallengeUserLevelForCurrentUser,
    getDailyMissionsForCurrentUser,
} from '@/lib/bid/challenge-service';
import { getBidHistoryListData } from '@/lib/bid/bid-history-query';
import type { Mission } from '@/lib/bid/challenge-types';
import type {
    BidHistoryListItem,
    BidHistoryMonthlyTrend,
    BidHistoryStatus,
} from '@/lib/bid/bid-history-types';

function mapBidHistoryStatusToDashboardStatus(status: BidHistoryStatus): DashboardRecentBidRow['status'] {
    if (status === 'success') {
        return 'success';
    }
    if (status === 'pending') {
        return 'pending';
    }
    return 'failed';
}

function mapMissionItems(missions: Mission[]): Array<{ id: string; label: string; completed: boolean }> {
    return missions.slice(0, 5).map((mission) => ({
        id: mission.id,
        label: mission.title || mission.description || '오늘의 미션',
        completed: mission.isCompleted,
    }));
}

function mapRecentBidRows(items: BidHistoryListItem[]): DashboardRecentBidRow[] {
    return items.slice(0, 10).map((item) => ({
        id: item.id,
        status: mapBidHistoryStatusToDashboardStatus(item.status),
        detailHref: `/bid_history/analysis/${encodeURIComponent(item.id)}`,
        noticeTitle: item.title,
        bidAmountLabel: item.predictedPriceLabel,
        rankLabel: item.virtualRank !== null ? `${item.virtualRank}위` : '-',
        participantLabel: item.totalParticipants !== null ? `${item.totalParticipants}명` : '정보없음',
        dateLabel: item.predictionMadeAtLabel,
    }));
}

function buildWinRateChangeLabel(monthlyTrends: BidHistoryMonthlyTrend[]): string | undefined {
    if (monthlyTrends.length < 2) {
        return undefined;
    }

    const latest = monthlyTrends[0];
    const previous = monthlyTrends[1];

    if (!latest || !previous) {
        return undefined;
    }
    if (latest.successRate === null || previous.successRate === null) {
        return undefined;
    }

    const delta = latest.successRate - previous.successRate;
    return `${delta > 0 ? '+' : ''}${delta.toFixed(1)}%p`;
}

export default async function DashboardPage() {
    const [data, userSummary, level, missions, bidHistory] = await Promise.all([
        getDashboardData(),
        getCurrentUserSummary(),
        getChallengeUserLevelForCurrentUser().catch(() => null),
        getDailyMissionsForCurrentUser(5).catch(() => []),
        getBidHistoryListData({
            page: '1',
            pageSize: '10',
            sort: 'latest',
        }).catch(() => null),
    ]);

    const todayMissionItems = mapMissionItems(missions);
    const recentBidRows = bidHistory && !bidHistory.error ? mapRecentBidRows(bidHistory.items) : [];
    const winRateChangeLabel =
        bidHistory && !bidHistory.error ? buildWinRateChangeLabel(bidHistory.monthlyTrends) : undefined;

    const viewModel = buildDashboardOverviewViewModel(data, {
        userDisplayName: userSummary.displayName,
        levelProgressPercent: level?.progressPercent,
        todayMissionItems: todayMissionItems.length > 0 ? todayMissionItems : undefined,
        recentBidRows: recentBidRows.length > 0 ? recentBidRows : undefined,
        winRateChangeLabel,
    });

    return (
        <div className="px-4 py-5 md:px-6 md:py-6 lg:px-8 lg:py-8">
            <DashboardOverviewContent viewModel={viewModel} />
        </div>
    );
}
