import Link from 'next/link';
import { BidHistoryStatusBadge } from './bid-history-status-badge';
import type { BidHistoryAnalysisData } from '@/lib/bid/bid-history-types';

interface BidHistoryAnalysisPageProps {
    data: BidHistoryAnalysisData;
}

export function BidHistoryAnalysisPage({ data }: BidHistoryAnalysisPageProps) {
    if (!data.detail) {
        return (
            <main className="min-h-screen bg-slate-50 px-4 py-8 text-slate-900 dark:bg-[#0B1121] dark:text-slate-100">
                <div className="mx-auto max-w-4xl space-y-3">
                    <section className="rounded-xl border border-rose-200 bg-rose-50 p-6 text-sm text-rose-700 dark:border-rose-900 dark:bg-rose-950/40 dark:text-rose-300">
                        {data.error?.message ?? '입찰참가이력 상세를 찾지 못했습니다.'}
                    </section>
                    <Link
                        href="/bid_history"
                        className="inline-flex h-10 items-center rounded-lg border border-slate-300 bg-white px-4 text-sm font-semibold text-slate-700 hover:bg-slate-50 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-100 dark:hover:bg-slate-700"
                    >
                        목록으로
                    </Link>
                </div>
            </main>
        );
    }

    const detail = data.detail;

    return (
        <main className="min-h-screen bg-slate-50 px-4 py-6 text-slate-900 md:px-6 lg:px-8 dark:bg-[#0B1121] dark:text-slate-100">
            <div className="mx-auto max-w-6xl space-y-4">
                <header className="rounded-xl border border-slate-200 bg-white px-6 py-5 shadow-sm dark:border-slate-700 dark:bg-[#151E32]">
                    <div className="mb-1 text-sm text-slate-500 dark:text-slate-400">
                        <Link href="/bid_history" className="hover:text-slate-700 dark:hover:text-slate-200">
                            입찰참가이력
                        </Link>{' '}
                        &gt; 상세분석
                    </div>
                    <div className="mb-3 flex flex-wrap items-center gap-2">
                        <BidHistoryStatusBadge status={detail.status} />
                        <span className="text-xs text-slate-500 dark:text-slate-400">
                            참여일 {detail.predictionMadeAtLabel}
                        </span>
                    </div>
                    <h1 className="text-2xl font-bold">{detail.title}</h1>
                    <p className="mt-1 text-sm text-slate-600 dark:text-slate-300">
                        {detail.organization}
                        {detail.demandOrganization ? ` · ${detail.demandOrganization}` : ''}
                    </p>
                    <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
                        공고번호 {detail.bidNoticeNo}
                        {detail.bidNoticeOrd ? `-${detail.bidNoticeOrd}` : ''}
                    </p>
                </header>

                {data.error ? (
                    <section
                        role="alert"
                        className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800 dark:border-amber-900 dark:bg-amber-950/40 dark:text-amber-200"
                    >
                        <p className="font-semibold">{data.error.message}</p>
                        <p className="mt-1 text-xs">요청 ID: {data.error.requestId}</p>
                        <p className="mt-1 text-xs">{data.error.suggestion}</p>
                    </section>
                ) : null}

                <section className="grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-4">
                    <article className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-700 dark:bg-[#151E32]">
                        <p className="text-xs text-slate-500 dark:text-slate-400">내 입찰금액</p>
                        <p className="mt-1 text-xl font-bold">{detail.predictedPriceLabel}</p>
                    </article>
                    <article className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-700 dark:bg-[#151E32]">
                        <p className="text-xs text-slate-500 dark:text-slate-400">실제 낙찰가</p>
                        <p className="mt-1 text-xl font-bold">{detail.winningAmountLabel}</p>
                    </article>
                    <article className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-700 dark:bg-[#151E32]">
                        <p className="text-xs text-slate-500 dark:text-slate-400">입찰 편차</p>
                        <p className="mt-1 text-xl font-bold">{detail.deviationPercentLabel}</p>
                    </article>
                    <article className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-700 dark:bg-[#151E32]">
                        <p className="text-xs text-slate-500 dark:text-slate-400">예측순위</p>
                        <p className="mt-1 text-xl font-bold">{detail.predictedRankLabel}</p>
                    </article>
                </section>

                <section className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-700 dark:bg-[#151E32]">
                    <h2 className="mb-3 text-lg font-semibold">입찰 정보</h2>
                    <div className="grid grid-cols-1 gap-3 text-sm md:grid-cols-2 xl:grid-cols-3">
                        <p>
                            <span className="text-slate-500 dark:text-slate-400">내 입찰률:</span>{' '}
                            <span className="font-semibold">{detail.predictedRateLabel}</span>
                        </p>
                        <p>
                            <span className="text-slate-500 dark:text-slate-400">성공 확률:</span>{' '}
                            <span className="font-semibold">{detail.confidenceLabel}</span>
                        </p>
                        <p>
                            <span className="text-slate-500 dark:text-slate-400">정확도:</span>{' '}
                            <span className="font-semibold">{detail.accuracyRateLabel}</span>
                        </p>
                        <p>
                            <span className="text-slate-500 dark:text-slate-400">카테고리:</span>{' '}
                            <span className="font-semibold">{detail.categoryLabel}</span>
                        </p>
                        <p>
                            <span className="text-slate-500 dark:text-slate-400">참가업체 수:</span>{' '}
                            <span className="font-semibold">{detail.participantCountLabel}</span>
                        </p>
                        <p>
                            <span className="text-slate-500 dark:text-slate-400">실제 낙찰자:</span>{' '}
                            <span className="font-semibold">{detail.actualWinner ?? '정보없음'}</span>
                        </p>
                    </div>
                    {detail.predictionReason ? (
                        <p className="mt-3 text-sm text-slate-600 dark:text-slate-300">
                            <span className="font-semibold">입찰 사유:</span> {detail.predictionReason}
                        </p>
                    ) : null}
                    {detail.note ? (
                        <p className="mt-2 text-sm text-slate-600 dark:text-slate-300">
                            <span className="font-semibold">메모:</span> {detail.note}
                        </p>
                    ) : null}
                </section>

                {data.comparison ? (
                    <section className="rounded-xl border border-blue-200 bg-blue-50 p-4 shadow-sm dark:border-blue-900 dark:bg-blue-950/30">
                        <h2 className="mb-3 text-lg font-semibold text-blue-900 dark:text-blue-200">
                            실제 결과 비교 분석
                        </h2>
                        <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
                            <article className="rounded-lg border border-blue-200 bg-white p-3 dark:border-blue-800 dark:bg-slate-900">
                                <p className="text-xs text-slate-500 dark:text-slate-400">금액 차이</p>
                                <p className="mt-1 text-lg font-bold">{data.comparison.amountGapLabel}</p>
                            </article>
                            <article className="rounded-lg border border-blue-200 bg-white p-3 dark:border-blue-800 dark:bg-slate-900">
                                <p className="text-xs text-slate-500 dark:text-slate-400">투찰률 차이</p>
                                <p className="mt-1 text-lg font-bold">{data.comparison.rateGapLabel}</p>
                            </article>
                        </div>
                        <p className="mt-3 text-sm text-blue-800 dark:text-blue-200">{data.comparison.insight}</p>
                    </section>
                ) : (
                    <section className="rounded-xl border border-slate-200 bg-white p-4 text-sm text-slate-600 shadow-sm dark:border-slate-700 dark:bg-[#151E32] dark:text-slate-300">
                        아직 실제 개찰 결과가 없어 비교 분석을 제공하지 못했습니다.
                    </section>
                )}

                {detail.resultNotice ? (
                    <section className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-700 dark:bg-[#151E32]">
                        <h2 className="mb-2 text-lg font-semibold">개찰 공지</h2>
                        <p className="text-sm leading-relaxed text-slate-700 dark:text-slate-300">
                            {detail.resultNotice}
                        </p>
                    </section>
                ) : null}

                <section className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-700 dark:bg-[#151E32]">
                    <h2 className="mb-3 text-lg font-semibold">참가업체 비교</h2>
                    {detail.participants.length === 0 ? (
                        <p className="text-sm text-slate-500 dark:text-slate-400">참가업체 데이터가 없습니다.</p>
                    ) : (
                        <div className="overflow-x-auto">
                            <table className="min-w-full text-sm">
                                <thead className="bg-slate-50 text-xs text-slate-500 dark:bg-slate-800/80 dark:text-slate-300">
                                    <tr>
                                        <th className="px-3 py-2 text-center">순위</th>
                                        <th className="px-3 py-2 text-left">업체명</th>
                                        <th className="px-3 py-2 text-right">입찰금액</th>
                                        <th className="px-3 py-2 text-right">입찰률</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {detail.participants.map((participant) => (
                                        <tr
                                            key={`${participant.rank}-${participant.companyName}`}
                                            className={`border-t border-slate-200 dark:border-slate-700 ${
                                                participant.isWinner
                                                    ? 'bg-emerald-50 dark:bg-emerald-900/20'
                                                    : ''
                                            }`}
                                        >
                                            <td className="px-3 py-2 text-center font-semibold">{participant.rank}</td>
                                            <td className="px-3 py-2">{participant.companyName}</td>
                                            <td className="px-3 py-2 text-right font-semibold">
                                                {participant.bidAmountLabel}
                                            </td>
                                            <td className="px-3 py-2 text-right">{participant.bidRateLabel}</td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )}
                </section>

                <footer className="flex flex-wrap items-center justify-between gap-2 rounded-xl border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-700 dark:bg-[#151E32]">
                    <Link
                        href="/bid_history"
                        className="inline-flex h-10 items-center rounded-lg border border-slate-300 bg-white px-4 text-sm font-semibold text-slate-700 hover:bg-slate-50 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-100 dark:hover:bg-slate-700"
                    >
                        목록으로
                    </Link>
                    <div className="flex items-center gap-2">
                        <Link
                            href={detail.bidNoticeHref}
                            className="inline-flex h-10 items-center rounded-lg border border-slate-300 bg-white px-4 text-sm font-semibold text-slate-700 hover:bg-slate-50 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-100 dark:hover:bg-slate-700"
                        >
                            원 공고 보기
                        </Link>
                        {detail.openingResultHref ? (
                            <Link
                                href={detail.openingResultHref}
                                className="inline-flex h-10 items-center rounded-lg bg-blue-600 px-4 text-sm font-semibold text-white hover:bg-blue-700"
                            >
                                개찰결과 보기
                            </Link>
                        ) : null}
                    </div>
                </footer>
            </div>
        </main>
    );
}
