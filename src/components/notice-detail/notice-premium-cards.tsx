import Link from 'next/link';
import type { PremiumPreviewStats } from '@/lib/bid/notice-detail-types';

interface NoticePremiumCardsProps {
    stats: PremiumPreviewStats;
}

function renderTrend(values: number[]) {
    return values.map((value, idx) => (
        <div key={`${value}-${idx}`} className="flex flex-col items-center gap-1">
            <div className="w-6 rounded-sm bg-blue-500/30" style={{ height: `${Math.max(18, value)}px` }} />
            <span className="text-[10px] text-slate-500 dark:text-slate-300">{value.toFixed(1)}</span>
        </div>
    ));
}

export function NoticePremiumCards({ stats }: NoticePremiumCardsProps) {
    return (
        <>
            <section className="rounded-xl border border-amber-600 bg-amber-500 p-5 text-white shadow-sm">
                <h2 className="mb-2 text-lg font-bold">AI 분석 보고서</h2>
                <p className="mb-4 text-sm text-amber-100">과거 데이터 기반 낙찰 예측 및 전략 제안</p>
                <ul className="mb-4 space-y-1 text-xs text-amber-100">
                    <li>✓ 낙찰가 예측</li>
                    <li>✓ 경쟁 강도 분석</li>
                    <li>✓ 맞춤 전략 제안</li>
                </ul>
                <p className="mb-3 text-sm font-bold">5,000 포인트</p>
                <Link
                    href="/profile/subscription"
                    className="inline-flex h-10 w-full items-center justify-center rounded-lg bg-white text-sm font-semibold text-slate-900 hover:bg-slate-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white focus-visible:ring-offset-2 focus-visible:ring-offset-amber-500"
                >
                    분석 시작하기
                </Link>
            </section>

            <section className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-700 dark:bg-[#151E32]">
                <div className="mb-2 flex items-center justify-between">
                    <h3 className="text-lg font-semibold text-slate-900 dark:text-slate-100">참가업체 통계</h3>
                    {stats.isLocked && (
                        <span className="rounded-full bg-slate-100 px-2 py-1 text-[10px] font-semibold text-slate-600 dark:bg-slate-700 dark:text-slate-200">
                            LOCK
                        </span>
                    )}
                </div>
                <p className="text-sm text-slate-700 dark:text-slate-300">평균 참가업체: {stats.averageParticipants.toFixed(1)}개사</p>
                <p className="mb-2 text-sm text-slate-700 dark:text-slate-300">평균 낙찰률: {stats.averageSuccessRate.toFixed(1)}%</p>
                <Link
                    href="/profile/subscription"
                    className="text-sm font-semibold text-blue-600 hover:text-blue-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-600 dark:text-blue-300 dark:hover:text-blue-200 dark:focus-visible:ring-blue-400"
                >
                    전체 통계 보기
                </Link>
            </section>

            <section className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-700 dark:bg-[#151E32]">
                <h3 className="mb-3 text-lg font-semibold text-slate-900 dark:text-slate-100">유사 사정율 분석</h3>
                <div className="mb-3 flex h-24 items-end justify-between rounded-lg bg-slate-50 p-3 dark:bg-slate-800">{renderTrend(stats.similarRateTrend)}</div>
                <Link
                    href="/profile/subscription"
                    className="text-sm font-semibold text-blue-600 hover:text-blue-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-600 dark:text-blue-300 dark:hover:text-blue-200 dark:focus-visible:ring-blue-400"
                >
                    상세 분석 보기
                </Link>
            </section>
        </>
    );
}
