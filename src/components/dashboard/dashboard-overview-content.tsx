import Link from 'next/link';
import type { DashboardOverviewViewModel } from '@/lib/bid/dashboard-view-model';

interface DashboardOverviewContentProps {
    viewModel: DashboardOverviewViewModel;
}

export function DashboardOverviewContent({ viewModel }: DashboardOverviewContentProps) {
    return (
        <div className="space-y-6">
            <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-950">
                <p className="text-sm text-slate-500 dark:text-slate-400">대시보드</p>
                <h1 className="mt-1 text-2xl font-bold text-slate-900 dark:text-slate-50">
                    {viewModel.userDisplayName}님, 오늘도 실전처럼 준비하세요.
                </h1>
                <p className="mt-3 text-sm text-slate-600 dark:text-slate-300">
                    레벨 진행률 {viewModel.levelProgressPercent}% · 오늘 미션 {viewModel.todayMission.completedCount}/
                    {viewModel.todayMission.totalCount} 완료
                </p>
            </section>

            <section className="grid gap-4 md:grid-cols-3">
                <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-950">
                    <p className="text-sm text-slate-500 dark:text-slate-400">주간 참여</p>
                    <p className="mt-2 text-2xl font-bold text-slate-900 dark:text-slate-50">
                        {viewModel.weeklySummary.participationCount}건
                    </p>
                </div>
                <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-950">
                    <p className="text-sm text-slate-500 dark:text-slate-400">오늘 마감</p>
                    <p className="mt-2 text-2xl font-bold text-slate-900 dark:text-slate-50">
                        {viewModel.weeklySummary.closingTodayCount}건
                    </p>
                </div>
                <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-950">
                    <p className="text-sm text-slate-500 dark:text-slate-400">알림</p>
                    <p className="mt-2 text-2xl font-bold text-slate-900 dark:text-slate-50">
                        {viewModel.weeklySummary.unreadNotificationCount}건
                    </p>
                </div>
            </section>

            <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-950">
                <div className="flex items-center justify-between gap-3">
                    <div>
                        <p className="text-sm font-semibold text-slate-900 dark:text-slate-50">최근 입찰 이력</p>
                        <p className="text-sm text-slate-500 dark:text-slate-400">
                            승률 추이 {viewModel.winRateTrend.changeLabel}
                        </p>
                    </div>
                    <Link
                        href="/bid_history"
                        className="text-sm font-semibold text-blue-600 hover:text-blue-700 dark:text-blue-300 dark:hover:text-blue-200"
                    >
                        전체 보기
                    </Link>
                </div>
                <div className="mt-4 space-y-3">
                    {viewModel.recentBidRows.map((row) => (
                        <Link
                            key={row.id}
                            href={row.detailHref}
                            className="flex items-center justify-between rounded-xl border border-slate-200 px-4 py-3 text-sm hover:bg-slate-50 dark:border-slate-800 dark:hover:bg-slate-900"
                        >
                            <div>
                                <p className="font-semibold text-slate-900 dark:text-slate-50">{row.noticeTitle}</p>
                                <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
                                    {row.bidAmountLabel} · {row.rankLabel} · {row.participantLabel}
                                </p>
                            </div>
                            <span className="text-xs font-medium text-slate-500 dark:text-slate-400">
                                {row.dateLabel}
                            </span>
                        </Link>
                    ))}
                </div>
            </section>
        </div>
    );
}
