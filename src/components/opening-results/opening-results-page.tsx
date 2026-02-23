import Link from 'next/link';
import { OpeningStatusBadge } from './opening-status-badge';
import type { OpeningResultFilters, OpeningResultListItem, OpeningResultsListData } from '@/lib/bid/opening-types';

interface OpeningResultsPageProps {
    data: OpeningResultsListData;
}

function buildListHref(filters: OpeningResultFilters, page: number): string {
    const params = new URLSearchParams();
    params.set('status', filters.status);
    params.set('datePreset', filters.datePreset);
    params.set('category', filters.category);
    params.set('query', filters.query);
    params.set('page', String(page));
    params.set('pageSize', String(filters.pageSize));
    if (filters.dateFrom) {
        params.set('dateFrom', filters.dateFrom);
    }
    if (filters.dateTo) {
        params.set('dateTo', filters.dateTo);
    }
    return `/bid_opening?${params.toString()}`;
}

function getWinningRateClass(item: OpeningResultListItem): string {
    if (item.winningRate === null) {
        return 'text-slate-500 dark:text-slate-400';
    }
    if (item.winningRate < 85) {
        return 'text-rose-600 dark:text-rose-400';
    }
    if (item.winningRate <= 90) {
        return 'text-amber-600 dark:text-amber-400';
    }
    return 'text-emerald-600 dark:text-emerald-400';
}

function renderPagination(data: OpeningResultsListData) {
    const { page, totalPages, filters } = data;
    if (totalPages <= 1) {
        return null;
    }

    const pageItems = [];
    const start = Math.max(1, page - 2);
    const end = Math.min(totalPages, page + 2);
    for (let value = start; value <= end; value += 1) {
        pageItems.push(value);
    }

    const prevDisabled = page <= 1;
    const nextDisabled = page >= totalPages;

    return (
        <div className="mt-4 flex flex-wrap items-center justify-center gap-2">
            {prevDisabled ? (
                <span
                    aria-disabled="true"
                    className="inline-flex h-8 cursor-not-allowed items-center rounded-md border border-slate-200 bg-slate-100 px-3 text-sm text-slate-400 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-500"
                >
                    이전
                </span>
            ) : (
                <Link
                    href={buildListHref(filters, page - 1)}
                    className="inline-flex h-8 items-center rounded-md border border-slate-300 bg-white px-3 text-sm text-slate-700 hover:bg-slate-50 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-100"
                >
                    이전
                </Link>
            )}
            {pageItems.map((value) => (
                <Link
                    key={value}
                    href={buildListHref(filters, value)}
                    aria-current={value === page ? 'page' : undefined}
                    className={`inline-flex h-8 min-w-8 items-center justify-center rounded-md px-2 text-sm font-semibold ${
                        value === page
                            ? 'bg-blue-600 text-white'
                            : 'border border-slate-300 bg-white text-slate-700 hover:bg-slate-50 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-200'
                    }`}
                >
                    {value}
                </Link>
            ))}
            {nextDisabled ? (
                <span
                    aria-disabled="true"
                    className="inline-flex h-8 cursor-not-allowed items-center rounded-md border border-slate-200 bg-slate-100 px-3 text-sm text-slate-400 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-500"
                >
                    다음
                </span>
            ) : (
                <Link
                    href={buildListHref(filters, page + 1)}
                    className="inline-flex h-8 items-center rounded-md border border-slate-300 bg-white px-3 text-sm text-slate-700 hover:bg-slate-50 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-100"
                >
                    다음
                </Link>
            )}
        </div>
    );
}

export function OpeningResultsPage({ data }: OpeningResultsPageProps) {
    const { filters, summary, items } = data;

    return (
        <main className="min-h-screen bg-slate-50 px-4 py-6 text-slate-900 md:px-6 lg:px-8 dark:bg-[#0B1121] dark:text-slate-100">
            <div className="mx-auto max-w-[1440px] space-y-4">
                <header className="rounded-xl border border-slate-200 bg-white px-6 py-5 shadow-sm dark:border-slate-700 dark:bg-[#151E32]">
                    <div className="mb-1 text-sm text-slate-500 dark:text-slate-400">홈 &gt; 개찰결과</div>
                    <div className="flex flex-wrap items-center justify-between gap-2">
                        <h1 className="text-2xl font-bold">개찰결과 조회</h1>
                        <button
                            type="button"
                            disabled
                            aria-disabled="true"
                            className="inline-flex h-10 items-center rounded-lg border border-slate-300 bg-white px-4 text-sm font-semibold text-slate-700 hover:bg-slate-50 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-100 dark:hover:bg-slate-700"
                        >
                            엑셀 다운로드 (준비중)
                        </button>
                    </div>
                </header>

                <form
                    action="/bid_opening"
                    method="get"
                    aria-label="개찰결과 필터"
                    className="rounded-xl border border-slate-200 bg-white px-4 py-4 shadow-sm dark:border-slate-700 dark:bg-[#151E32]"
                >
                    <input type="hidden" name="page" value="1" />
                    <input type="hidden" name="pageSize" value={String(filters.pageSize)} />
                    <div className="grid grid-cols-1 gap-2 md:grid-cols-2 xl:grid-cols-6">
                        <select
                            name="status"
                            defaultValue={filters.status}
                            aria-label="상태 필터"
                            className="h-10 rounded-md border border-slate-300 bg-white px-3 text-sm dark:border-slate-600 dark:bg-slate-800"
                        >
                            <option value="all">전체 상태</option>
                            <option value="awarded">낙찰</option>
                            <option value="failed">유찰</option>
                            <option value="rebid">재공고</option>
                        </select>

                        <select
                            name="datePreset"
                            defaultValue={filters.datePreset}
                            aria-label="기간 프리셋 필터"
                            className="h-10 rounded-md border border-slate-300 bg-white px-3 text-sm dark:border-slate-600 dark:bg-slate-800"
                        >
                            <option value="all">전체 기간</option>
                            <option value="today">오늘</option>
                            <option value="week">이번주</option>
                            <option value="month">이번달</option>
                        </select>

                        <select
                            name="category"
                            defaultValue={filters.category}
                            aria-label="카테고리 필터"
                            className="h-10 rounded-md border border-slate-300 bg-white px-3 text-sm dark:border-slate-600 dark:bg-slate-800"
                        >
                            <option value="all">전체 카테고리</option>
                            <option value="goods">물품</option>
                            <option value="construction">공사</option>
                            <option value="service">용역</option>
                        </select>

                        <input
                            type="date"
                            name="dateFrom"
                            defaultValue={filters.dateFrom ?? ''}
                            aria-label="시작일"
                            className="h-10 rounded-md border border-slate-300 bg-white px-3 text-sm dark:border-slate-600 dark:bg-slate-800"
                        />

                        <input
                            type="date"
                            name="dateTo"
                            defaultValue={filters.dateTo ?? ''}
                            aria-label="종료일"
                            className="h-10 rounded-md border border-slate-300 bg-white px-3 text-sm dark:border-slate-600 dark:bg-slate-800"
                        />

                        <div className="flex gap-2">
                            <input
                                type="search"
                                name="query"
                                defaultValue={filters.query}
                                placeholder="공고명 검색"
                                aria-label="검색어"
                                className="h-10 w-full rounded-md border border-slate-300 bg-white px-3 text-sm dark:border-slate-600 dark:bg-slate-800"
                            />
                            <button
                                type="submit"
                                className="inline-flex h-10 items-center rounded-md bg-blue-600 px-4 text-sm font-semibold text-white hover:bg-blue-700"
                            >
                                적용
                            </button>
                        </div>
                    </div>
                </form>

                <section className="grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-4">
                    <article className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-700 dark:bg-[#151E32]">
                        <p className="text-xs text-slate-500 dark:text-slate-400">총 개찰 건수</p>
                        <p className="mt-1 text-2xl font-bold">{summary.totalCount.toLocaleString('ko-KR')}건</p>
                    </article>
                    <article className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-700 dark:bg-[#151E32]">
                        <p className="text-xs text-slate-500 dark:text-slate-400">평균 낙찰률</p>
                        <p className="mt-1 text-2xl font-bold">
                            {summary.averageWinningRate !== null
                                ? `${summary.averageWinningRate.toFixed(3)}%`
                                : '-'}
                        </p>
                    </article>
                    <article className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-700 dark:bg-[#151E32]">
                        <p className="text-xs text-slate-500 dark:text-slate-400">평균 참가업체</p>
                        <p className="mt-1 text-2xl font-bold">
                            {summary.averageParticipantCount !== null
                                ? `${summary.averageParticipantCount.toFixed(1)}개사`
                                : '-'}
                        </p>
                    </article>
                    <article className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-700 dark:bg-[#151E32]">
                        <p className="text-xs text-slate-500 dark:text-slate-400">내 참여 건수(현재 목록)</p>
                        <p className="mt-1 text-2xl font-bold">{summary.myParticipatedCount}건</p>
                    </article>
                </section>

                {data.error ? (
                    <div
                        role="alert"
                        className="rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700 dark:border-rose-900 dark:bg-rose-950/40 dark:text-rose-300"
                    >
                        <p className="font-semibold">{data.error.message}</p>
                        <p className="mt-1 text-xs">요청 ID: {data.error.requestId}</p>
                        <p className="mt-1 text-xs">{data.error.suggestion}</p>
                    </div>
                ) : null}

                <section className="rounded-xl border border-slate-200 bg-white shadow-sm dark:border-slate-700 dark:bg-[#151E32]">
                    {items.length === 0 ? (
                        <div className="px-6 py-20 text-center">
                            <p className="text-lg font-semibold">개찰결과가 없습니다</p>
                            <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">
                                다른 필터를 시도해보세요.
                            </p>
                        </div>
                    ) : (
                        <>
                            <div className="hidden overflow-x-auto lg:block">
                                <table className="min-w-full">
                                    <thead className="bg-slate-50 dark:bg-slate-800/80">
                                        <tr className="text-xs text-slate-500 dark:text-slate-300">
                                            <th className="px-3 py-3 text-center font-semibold">상태</th>
                                            <th className="px-3 py-3 text-left font-semibold">공고명</th>
                                            <th className="px-3 py-3 text-left font-semibold">기관명</th>
                                            <th className="px-3 py-3 text-right font-semibold">낙찰금액</th>
                                            <th className="px-3 py-3 text-center font-semibold">낙찰률</th>
                                            <th className="px-3 py-3 text-center font-semibold">참가업체</th>
                                            <th className="px-3 py-3 text-center font-semibold">개찰일</th>
                                            <th className="px-3 py-3 text-center font-semibold">액션</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {items.map((item) => (
                                            <tr
                                                key={`${item.id}-${item.bidNoticeNo}`}
                                                className="border-t border-slate-200 text-sm hover:bg-slate-50 dark:border-slate-700 dark:hover:bg-slate-800/60"
                                            >
                                                <td className="px-3 py-3 text-center">
                                                    <OpeningStatusBadge status={item.status} />
                                                </td>
                                                <td className="px-3 py-3">
                                                    <div className="max-w-xl">
                                                        <p className="truncate font-semibold text-slate-900 dark:text-slate-100">
                                                            {item.title}
                                                        </p>
                                                        <p className="text-xs text-slate-500 dark:text-slate-400">
                                                            공고번호 {item.bidNoticeNo}
                                                            {item.bidNoticeOrd ? `-${item.bidNoticeOrd}` : ''}
                                                        </p>
                                                    </div>
                                                </td>
                                                <td className="px-3 py-3 text-slate-700 dark:text-slate-300">
                                                    {item.organization}
                                                </td>
                                                <td className="px-3 py-3 text-right font-semibold">
                                                    {item.winningAmountLabel}
                                                </td>
                                                <td
                                                    className={`px-3 py-3 text-center font-semibold ${getWinningRateClass(
                                                        item
                                                    )}`}
                                                >
                                                    {item.winningRateLabel}
                                                </td>
                                                <td className="px-3 py-3 text-center text-slate-700 dark:text-slate-300">
                                                    {item.participantCount !== null ? `${item.participantCount}개사` : '-'}
                                                </td>
                                                <td className="px-3 py-3 text-center text-slate-600 dark:text-slate-400">
                                                    {item.openingDateShort}
                                                </td>
                                                <td className="px-3 py-3 text-center">
                                                    <div className="inline-flex items-center gap-2">
                                                        <Link
                                                            href={`/bid_opening/detail/${item.id}`}
                                                            className="inline-flex h-8 items-center rounded-md border border-slate-300 px-2 text-xs font-semibold text-slate-700 hover:bg-slate-100 dark:border-slate-600 dark:text-slate-200 dark:hover:bg-slate-700"
                                                        >
                                                            상세
                                                        </Link>
                                                        {item.hasMyBid ? (
                                                            <span className="rounded-full bg-blue-100 px-2 py-1 text-[10px] font-semibold text-blue-700 dark:bg-blue-900/40 dark:text-blue-300">
                                                                내참여
                                                            </span>
                                                        ) : null}
                                                    </div>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>

                            <div className="space-y-3 p-4 lg:hidden">
                                {items.map((item) => (
                                    <article
                                        key={`mobile-${item.id}-${item.bidNoticeNo}`}
                                        className="rounded-lg border border-slate-200 bg-slate-50 p-4 dark:border-slate-700 dark:bg-slate-800"
                                    >
                                        <div className="mb-2 flex items-center justify-between">
                                            <OpeningStatusBadge status={item.status} />
                                            <span className="text-xs text-slate-500 dark:text-slate-400">
                                                {item.openingDateShort}
                                            </span>
                                        </div>
                                        <p className="line-clamp-2 text-sm font-semibold text-slate-900 dark:text-slate-100">
                                            {item.title}
                                        </p>
                                        <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
                                            {item.organization}
                                        </p>
                                        <div className="mt-3 flex items-center justify-between text-xs text-slate-600 dark:text-slate-300">
                                            <span>낙찰률 {item.winningRateLabel}</span>
                                            <span>
                                                참가 {item.participantCount !== null ? `${item.participantCount}개사` : '-'}
                                            </span>
                                        </div>
                                        <Link
                                            href={`/bid_opening/detail/${item.id}`}
                                            className="mt-3 inline-flex h-9 w-full items-center justify-center rounded-md border border-slate-300 bg-white text-xs font-semibold text-slate-700 hover:bg-slate-100 dark:border-slate-600 dark:bg-slate-700 dark:text-slate-100 dark:hover:bg-slate-600"
                                        >
                                            상세보기
                                        </Link>
                                    </article>
                                ))}
                            </div>
                        </>
                    )}
                </section>

                {renderPagination(data)}
            </div>
        </main>
    );
}
