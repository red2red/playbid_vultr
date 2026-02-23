import Link from 'next/link';
import { OpeningStatusBadge } from './opening-status-badge';
import type { OpeningResultDetailData } from '@/lib/bid/opening-types';

interface OpeningResultDetailPageProps {
    data: OpeningResultDetailData;
}

export function OpeningResultDetailPage({ data }: OpeningResultDetailPageProps) {
    const detail = data.detail;

    if (!detail) {
        return (
            <main className="min-h-screen bg-slate-50 px-4 py-8 text-slate-900 dark:bg-[#0B1121] dark:text-slate-100">
                <div className="mx-auto max-w-4xl rounded-xl border border-rose-200 bg-rose-50 p-6 text-sm text-rose-700 dark:border-rose-900 dark:bg-rose-950/40 dark:text-rose-300">
                    개찰결과 상세 데이터를 찾지 못했습니다.
                </div>
            </main>
        );
    }

    const noticeDetailHref = detail.bidNoticeId
        ? `/bid_notice/detail/${detail.bidNoticeId}`
        : `/bid_notice/detail/${detail.bidNoticeNo}`;

    return (
        <main className="min-h-screen bg-slate-50 px-4 py-6 text-slate-900 md:px-6 lg:px-8 dark:bg-[#0B1121] dark:text-slate-100">
            <div className="mx-auto max-w-6xl space-y-4">
                <header className="rounded-xl border border-slate-200 bg-white px-6 py-5 shadow-sm dark:border-slate-700 dark:bg-[#151E32]">
                    <div className="mb-1 text-sm text-slate-500 dark:text-slate-400">
                        <Link href="/bid_opening" className="hover:text-slate-700 dark:hover:text-slate-200">
                            개찰결과
                        </Link>{' '}
                        &gt; 상세
                    </div>
                    <div className="mb-3 flex flex-wrap items-center gap-2">
                        <OpeningStatusBadge status={detail.status} />
                        <span className="text-xs text-slate-500 dark:text-slate-400">{detail.openingAtLabel}</span>
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
                        <p className="text-xs text-slate-500 dark:text-slate-400">낙찰금액</p>
                        <p className="mt-1 text-xl font-bold">{detail.winningAmountLabel}</p>
                    </article>
                    <article className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-700 dark:bg-[#151E32]">
                        <p className="text-xs text-slate-500 dark:text-slate-400">낙찰률</p>
                        <p className="mt-1 text-xl font-bold">{detail.winningRateLabel}</p>
                    </article>
                    <article className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-700 dark:bg-[#151E32]">
                        <p className="text-xs text-slate-500 dark:text-slate-400">참가업체</p>
                        <p className="mt-1 text-xl font-bold">{detail.participantCountLabel}</p>
                    </article>
                    <article className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-700 dark:bg-[#151E32]">
                        <p className="text-xs text-slate-500 dark:text-slate-400">사정율 대비 편차</p>
                        <p className="mt-1 text-xl font-bold">{detail.deviationLabel}</p>
                    </article>
                </section>

                {detail.resultNotice ? (
                    <section className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-700 dark:bg-[#151E32]">
                        <h2 className="mb-2 text-lg font-semibold">개찰 공지</h2>
                        <p className="text-sm leading-relaxed text-slate-700 dark:text-slate-300">
                            {detail.resultNotice}
                        </p>
                    </section>
                ) : null}

                <section className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-700 dark:bg-[#151E32]">
                    <h2 className="mb-3 text-lg font-semibold">참가업체 목록</h2>
                    {detail.participants.length === 0 ? (
                        <p className="text-sm text-slate-500 dark:text-slate-400">
                            참가업체 상세 데이터가 없습니다.
                        </p>
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
                                            <td className="px-3 py-2 text-center font-semibold">
                                                {participant.rank}
                                            </td>
                                            <td className="px-3 py-2">{participant.companyName}</td>
                                            <td className="px-3 py-2 text-right font-semibold">
                                                {participant.bidAmountLabel}
                                            </td>
                                            <td className="px-3 py-2 text-right">
                                                {participant.bidRateLabel}
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )}
                </section>

                {detail.myComparison ? (
                    <section className="rounded-xl border border-blue-200 bg-blue-50 p-4 shadow-sm dark:border-blue-900 dark:bg-blue-950/30">
                        <h2 className="mb-3 text-lg font-semibold text-blue-900 dark:text-blue-200">
                            내 입찰 비교 분석
                        </h2>
                        <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
                            <article className="rounded-lg border border-blue-200 bg-white p-3 dark:border-blue-800 dark:bg-slate-900">
                                <p className="text-xs text-slate-500 dark:text-slate-400">내 입찰금액</p>
                                <p className="mt-1 text-lg font-bold">{detail.myComparison.myBidAmountLabel}</p>
                                <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
                                    낙찰가 대비 {detail.myComparison.amountGapLabel}
                                </p>
                            </article>
                            <article className="rounded-lg border border-blue-200 bg-white p-3 dark:border-blue-800 dark:bg-slate-900">
                                <p className="text-xs text-slate-500 dark:text-slate-400">내 입찰률</p>
                                <p className="mt-1 text-lg font-bold">{detail.myComparison.myBidRateLabel}</p>
                                <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
                                    낙찰률 대비 {detail.myComparison.rateGapLabel}
                                </p>
                            </article>
                        </div>
                        <p className="mt-3 text-sm text-blue-800 dark:text-blue-200">
                            {detail.myComparison.suggestedMessage}
                        </p>
                    </section>
                ) : null}

                <footer className="flex flex-wrap items-center justify-between gap-2 rounded-xl border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-700 dark:bg-[#151E32]">
                    <Link
                        href="/bid_opening"
                        className="inline-flex h-10 items-center rounded-lg border border-slate-300 bg-white px-4 text-sm font-semibold text-slate-700 hover:bg-slate-50 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-100 dark:hover:bg-slate-700"
                    >
                        목록으로
                    </Link>
                    <div className="flex items-center gap-2">
                        <Link
                            href={noticeDetailHref}
                            className="inline-flex h-10 items-center rounded-lg border border-slate-300 bg-white px-4 text-sm font-semibold text-slate-700 hover:bg-slate-50 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-100 dark:hover:bg-slate-700"
                        >
                            원 공고 보기
                        </Link>
                        <Link
                            href="/profile/subscription"
                            className="inline-flex h-10 items-center rounded-lg bg-blue-600 px-4 text-sm font-semibold text-white hover:bg-blue-700"
                        >
                            AI 분석 보기
                        </Link>
                    </div>
                </footer>
            </div>
        </main>
    );
}
