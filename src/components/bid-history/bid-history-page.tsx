import Link from 'next/link';
import { BidHistoryStatusBadge } from './bid-history-status-badge';
import type { BidHistoryFilters, BidHistoryListData, BidHistoryListItem } from '@/lib/bid/bid-history-types';

interface BidHistoryPageProps {
    data: BidHistoryListData;
}

export function buildCommonParams(filters: BidHistoryFilters): URLSearchParams {
    const params = new URLSearchParams();
    params.set('status', filters.status);
    params.set('datePreset', filters.datePreset);
    params.set('organization', filters.organization);
    params.set('category', filters.category);
    params.set('query', filters.query);
    params.set('sort', filters.sort);
    params.set('pageSize', String(filters.pageSize));
    if (filters.onlyWithResult) {
        params.set('onlyWithResult', '1');
    }
    if (filters.dateFrom) {
        params.set('dateFrom', filters.dateFrom);
    }
    if (filters.dateTo) {
        params.set('dateTo', filters.dateTo);
    }
    return params;
}

export function buildListHref(filters: BidHistoryFilters, page: number): string {
    const params = buildCommonParams(filters);
    params.set('page', String(page));
    return `/bid_history?${params.toString()}`;
}

export function buildExportHref(filters: BidHistoryFilters): string {
    const params = buildCommonParams(filters);
    return `/api/bid-history/export?${params.toString()}`;
}

function formatStatRate(value: number | null): string {
    if (value === null) {
        return '-';
    }
    return `${value.toFixed(1)}%`;
}

function getRateClass(item: BidHistoryListItem): string {
    if (item.predictedRate === null) {
        return 'text-slate-500 dark:text-slate-400';
    }

    if (item.predictedRate < 85) {
        return 'text-rose-600 dark:text-rose-400';
    }

    if (item.predictedRate <= 90) {
        return 'text-amber-600 dark:text-amber-400';
    }

    return 'text-emerald-600 dark:text-emerald-400';
}

function renderPagination(data: BidHistoryListData) {
    if (data.totalPages <= 1) {
        return null;
    }

    const pages = [];
    const start = Math.max(1, data.page - 2);
    const end = Math.min(data.totalPages, data.page + 2);
    for (let value = start; value <= end; value += 1) {
        pages.push(value);
    }

    const prevDisabled = data.page <= 1;
    const nextDisabled = data.page >= data.totalPages;

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
                    href={buildListHref(data.filters, data.page - 1)}
                    className="inline-flex h-8 items-center rounded-md border border-slate-300 bg-white px-3 text-sm text-slate-700 hover:bg-slate-50 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-100"
                >
                    이전
                </Link>
            )}
            {pages.map((value) => (
                <Link
                    key={value}
                    href={buildListHref(data.filters, value)}
                    aria-current={data.page === value ? 'page' : undefined}
                    className={`inline-flex h-8 min-w-8 items-center justify-center rounded-md px-2 text-sm font-semibold ${
                        data.page === value
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
                    href={buildListHref(data.filters, data.page + 1)}
                    className="inline-flex h-8 items-center rounded-md border border-slate-300 bg-white px-3 text-sm text-slate-700 hover:bg-slate-50 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-100"
                >
                    다음
                </Link>
            )}
        </div>
    );
}

export function BidHistoryPage({ data }: BidHistoryPageProps) {
    const { filters, summary, items } = data;

    return (
        <main className="min-h-screen bg-slate-50 px-4 py-6 text-slate-900 md:px-6 lg:px-8 dark:bg-[#0B1121] dark:text-slate-100">
            <div className="mx-auto max-w-[1440px] space-y-4">
                <header className="rounded-xl border border-slate-200 bg-white px-6 py-5 shadow-sm dark:border-slate-700 dark:bg-[#151E32]">
                    <div className="mb-1 text-sm text-slate-500 dark:text-slate-400">홈 &gt; 입찰참가이력</div>
                    <div className="flex flex-wrap items-center justify-between gap-2">
                        <h1 className="text-2xl font-bold">입찰참가이력</h1>
                        <a
                            href={buildExportHref(filters)}
                            className="inline-flex h-10 items-center rounded-lg bg-emerald-600 px-4 text-sm font-semibold text-white hover:bg-emerald-700"
                        >
                            CSV 내보내기
                        </a>
                    </div>
                </header>

                <form
                    action="/bid_history"
                    method="get"
                    aria-label="입찰참가이력 필터"
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
                            <option value="success">낙찰</option>
                            <option value="fail">패찰</option>
                            <option value="pending">대기</option>
                            <option value="void">유찰</option>
                        </select>

                        <select
                            name="datePreset"
                            defaultValue={filters.datePreset}
                            aria-label="기간 프리셋 필터"
                            className="h-10 rounded-md border border-slate-300 bg-white px-3 text-sm dark:border-slate-600 dark:bg-slate-800"
                        >
                            <option value="all">전체 기간</option>
                            <option value="1m">최근 1개월</option>
                            <option value="3m">최근 3개월</option>
                            <option value="6m">최근 6개월</option>
                            <option value="custom">직접 선택</option>
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

                        <input
                            list="bid-history-org-options"
                            name="organization"
                            defaultValue={filters.organization}
                            placeholder="기관명 검색"
                            aria-label="기관명 검색"
                            className="h-10 rounded-md border border-slate-300 bg-white px-3 text-sm dark:border-slate-600 dark:bg-slate-800"
                        />
                        <datalist id="bid-history-org-options">
                            {data.organizationOptions.map((option) => (
                                <option key={option} value={option} />
                            ))}
                        </datalist>

                        <select
                            name="sort"
                            defaultValue={filters.sort}
                            aria-label="정렬 기준"
                            className="h-10 rounded-md border border-slate-300 bg-white px-3 text-sm dark:border-slate-600 dark:bg-slate-800"
                        >
                            <option value="latest">최근 참가순</option>
                            <option value="oldest">오래된 참가순</option>
                            <option value="bid_amount_desc">입찰금액 높은순</option>
                            <option value="bid_amount_asc">입찰금액 낮은순</option>
                            <option value="confidence_desc">성공확률 높은순</option>
                            <option value="deviation_asc">편차 작은순</option>
                        </select>
                    </div>

                    <div className="mt-2 grid grid-cols-1 gap-2 md:grid-cols-[1fr_auto_auto_auto]">
                        <input
                            type="search"
                            name="query"
                            defaultValue={filters.query}
                            placeholder="공고명/공고번호/기관명 검색"
                            aria-label="검색어"
                            className="h-10 rounded-md border border-slate-300 bg-white px-3 text-sm dark:border-slate-600 dark:bg-slate-800"
                        />

                        <select
                            name="category"
                            defaultValue={filters.category}
                            aria-label="카테고리 필터"
                            className="h-10 rounded-md border border-slate-300 bg-white px-3 text-sm dark:border-slate-600 dark:bg-slate-800"
                        >
                            <option value="all">전체 카테고리</option>
                            <option value="construction">공사</option>
                            <option value="service">용역</option>
                            <option value="goods">물품</option>
                        </select>

                        <label className="inline-flex h-10 items-center gap-2 rounded-md border border-slate-300 bg-white px-3 text-sm dark:border-slate-600 dark:bg-slate-800">
                            <input
                                type="checkbox"
                                name="onlyWithResult"
                                value="1"
                                defaultChecked={filters.onlyWithResult}
                            />
                            실제 결과만
                        </label>

                        <button
                            type="submit"
                            className="inline-flex h-10 items-center justify-center rounded-md bg-blue-600 px-4 text-sm font-semibold text-white hover:bg-blue-700"
                        >
                            적용
                        </button>
                    </div>
                </form>

                <section className="grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-4">
                    <article className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-700 dark:bg-[#151E32]">
                        <p className="text-xs text-slate-500 dark:text-slate-400">총 참가 건수</p>
                        <p className="mt-1 text-2xl font-bold">{summary.totalCount.toLocaleString('ko-KR')}건</p>
                    </article>
                    <article className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-700 dark:bg-[#151E32]">
                        <p className="text-xs text-slate-500 dark:text-slate-400">낙찰 성공률</p>
                        <p className="mt-1 text-2xl font-bold text-emerald-600 dark:text-emerald-400">
                            {formatStatRate(summary.successRate)}
                        </p>
                    </article>
                    <article className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-700 dark:bg-[#151E32]">
                        <p className="text-xs text-slate-500 dark:text-slate-400">평균 입찰률</p>
                        <p className="mt-1 text-2xl font-bold">{formatStatRate(summary.averageBidRate)}</p>
                    </article>
                    <article className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-700 dark:bg-[#151E32]">
                        <p className="text-xs text-slate-500 dark:text-slate-400">평균 편차(절대값)</p>
                        <p className="mt-1 text-2xl font-bold">
                            {summary.averageDeviationPercent !== null
                                ? `${summary.averageDeviationPercent.toFixed(3)}%p`
                                : '-'}
                        </p>
                    </article>
                </section>

                <section className="grid grid-cols-1 gap-4 xl:grid-cols-2">
                    <article className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-700 dark:bg-[#151E32]">
                        <h2 className="mb-3 text-lg font-semibold">카테고리별 성공률</h2>
                        {data.categoryStats.length === 0 ? (
                            <p className="text-sm text-slate-500 dark:text-slate-400">집계할 데이터가 없습니다.</p>
                        ) : (
                            <div className="overflow-x-auto">
                                <table className="min-w-full text-sm">
                                    <thead className="bg-slate-50 text-xs text-slate-500 dark:bg-slate-800/80 dark:text-slate-300">
                                        <tr>
                                            <th className="px-3 py-2 text-left">카테고리</th>
                                            <th className="px-3 py-2 text-right">참가</th>
                                            <th className="px-3 py-2 text-right">낙찰</th>
                                            <th className="px-3 py-2 text-right">성공률</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {data.categoryStats.map((stat) => (
                                            <tr
                                                key={stat.category}
                                                className="border-t border-slate-200 dark:border-slate-700"
                                            >
                                                <td className="px-3 py-2">{stat.categoryLabel}</td>
                                                <td className="px-3 py-2 text-right">{stat.totalCount}</td>
                                                <td className="px-3 py-2 text-right">{stat.successCount}</td>
                                                <td className="px-3 py-2 text-right font-semibold">
                                                    {formatStatRate(stat.successRate)}
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        )}
                    </article>

                    <article className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-700 dark:bg-[#151E32]">
                        <h2 className="mb-3 text-lg font-semibold">월별 참가 추이</h2>
                        {data.monthlyTrends.length === 0 ? (
                            <p className="text-sm text-slate-500 dark:text-slate-400">집계할 데이터가 없습니다.</p>
                        ) : (
                            <div className="overflow-x-auto">
                                <table className="min-w-full text-sm">
                                    <thead className="bg-slate-50 text-xs text-slate-500 dark:bg-slate-800/80 dark:text-slate-300">
                                        <tr>
                                            <th className="px-3 py-2 text-left">월</th>
                                            <th className="px-3 py-2 text-right">참가</th>
                                            <th className="px-3 py-2 text-right">낙찰</th>
                                            <th className="px-3 py-2 text-right">성공률</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {data.monthlyTrends.map((trend) => (
                                            <tr
                                                key={trend.monthKey}
                                                className="border-t border-slate-200 dark:border-slate-700"
                                            >
                                                <td className="px-3 py-2">{trend.monthLabel}</td>
                                                <td className="px-3 py-2 text-right">{trend.totalCount}</td>
                                                <td className="px-3 py-2 text-right">{trend.successCount}</td>
                                                <td className="px-3 py-2 text-right font-semibold">
                                                    {formatStatRate(trend.successRate)}
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        )}
                    </article>
                </section>

                {data.error ? (
                    <section
                        role="alert"
                        className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800 dark:border-amber-900 dark:bg-amber-950/40 dark:text-amber-200"
                    >
                        <p className="font-semibold">{data.error.message}</p>
                        <p className="mt-1 text-xs">요청 ID: {data.error.requestId}</p>
                        <p className="mt-1 text-xs">{data.error.suggestion}</p>
                        {data.error.code === 'BID_HISTORY_AUTH_REQUIRED' ? (
                            <Link
                                href="/login?returnTo=%2Fbid_history"
                                className="mt-2 inline-flex h-8 items-center rounded-md bg-blue-600 px-3 text-xs font-semibold text-white hover:bg-blue-700"
                            >
                                로그인 이동
                            </Link>
                        ) : null}
                    </section>
                ) : null}

                <section className="rounded-xl border border-slate-200 bg-white shadow-sm dark:border-slate-700 dark:bg-[#151E32]">
                    {items.length === 0 ? (
                        <div className="px-6 py-20 text-center">
                            <p className="text-lg font-semibold">참가 이력이 없습니다</p>
                            <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">
                                모의입찰에 참여하면 이력과 비교 분석이 표시됩니다.
                            </p>
                            <Link
                                href="/bid_notice"
                                className="mt-4 inline-flex h-10 items-center rounded-lg bg-blue-600 px-4 text-sm font-semibold text-white hover:bg-blue-700"
                            >
                                입찰공고 둘러보기
                            </Link>
                        </div>
                    ) : (
                        <>
                            <div className="hidden overflow-x-auto lg:block">
                                <table className="min-w-full">
                                    <thead className="bg-slate-50 dark:bg-slate-800/80">
                                        <tr className="text-xs text-slate-500 dark:text-slate-300">
                                            <th className="px-3 py-3 text-center font-semibold">상태</th>
                                            <th className="px-3 py-3 text-left font-semibold">공고명</th>
                                            <th className="px-3 py-3 text-right font-semibold">내 입찰금액</th>
                                            <th className="px-3 py-3 text-center font-semibold">입찰률</th>
                                            <th className="px-3 py-3 text-right font-semibold">실제 낙찰가</th>
                                            <th className="px-3 py-3 text-center font-semibold">편차</th>
                                            <th className="px-3 py-3 text-center font-semibold">예측순위</th>
                                            <th className="px-3 py-3 text-center font-semibold">참여일</th>
                                            <th className="px-3 py-3 text-center font-semibold">액션</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {items.map((item) => (
                                            <tr
                                                key={item.id}
                                                className="border-t border-slate-200 text-sm hover:bg-slate-50 dark:border-slate-700 dark:hover:bg-slate-800/60"
                                            >
                                                <td className="px-3 py-3 text-center">
                                                    <BidHistoryStatusBadge status={item.status} />
                                                </td>
                                                <td className="px-3 py-3">
                                                    <div className="max-w-xl">
                                                        <p className="truncate font-semibold text-slate-900 dark:text-slate-100">
                                                            {item.title}
                                                        </p>
                                                        <p className="text-xs text-slate-500 dark:text-slate-400">
                                                            {item.organization} · {item.bidNoticeNo}
                                                            {item.bidNoticeOrd ? `-${item.bidNoticeOrd}` : ''}
                                                        </p>
                                                    </div>
                                                </td>
                                                <td className="px-3 py-3 text-right font-semibold">
                                                    {item.predictedPriceLabel}
                                                </td>
                                                <td className={`px-3 py-3 text-center font-semibold ${getRateClass(item)}`}>
                                                    {item.predictedRateLabel}
                                                </td>
                                                <td className="px-3 py-3 text-right font-semibold">
                                                    {item.winningAmountLabel}
                                                </td>
                                                <td className="px-3 py-3 text-center text-sm font-semibold">
                                                    {item.deviationPercentLabel}
                                                </td>
                                                <td className="px-3 py-3 text-center text-slate-700 dark:text-slate-300">
                                                    {item.predictedRankLabel}
                                                </td>
                                                <td className="px-3 py-3 text-center text-slate-600 dark:text-slate-400">
                                                    {item.predictionMadeAtLabel}
                                                </td>
                                                <td className="px-3 py-3 text-center">
                                                    <div className="inline-flex items-center gap-2">
                                                        <Link
                                                            href={`/bid_history/analysis?id=${encodeURIComponent(
                                                                item.id
                                                            )}`}
                                                            className="inline-flex h-8 items-center rounded-md border border-slate-300 px-2 text-xs font-semibold text-slate-700 hover:bg-slate-100 dark:border-slate-600 dark:text-slate-200 dark:hover:bg-slate-700"
                                                        >
                                                            상세
                                                        </Link>
                                                        <Link
                                                            href={
                                                                item.bidNoticeId
                                                                    ? `/bid_notice/detail/${item.bidNoticeId}`
                                                                    : `/bid_notice/detail/${item.bidNoticeNo}`
                                                            }
                                                            className="inline-flex h-8 items-center rounded-md border border-slate-300 px-2 text-xs font-semibold text-slate-700 hover:bg-slate-100 dark:border-slate-600 dark:text-slate-200 dark:hover:bg-slate-700"
                                                        >
                                                            공고
                                                        </Link>
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
                                        key={`mobile-${item.id}`}
                                        className="rounded-lg border border-slate-200 bg-slate-50 p-4 dark:border-slate-700 dark:bg-slate-800"
                                    >
                                        <div className="mb-2 flex items-center justify-between gap-2">
                                            <BidHistoryStatusBadge status={item.status} />
                                            <span className="text-xs text-slate-500 dark:text-slate-400">
                                                {item.predictionMadeAtLabel}
                                            </span>
                                        </div>
                                        <p className="line-clamp-2 text-sm font-semibold text-slate-900 dark:text-slate-100">
                                            {item.title}
                                        </p>
                                        <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
                                            {item.organization}
                                        </p>
                                        <div className="mt-3 grid grid-cols-2 gap-2 text-xs">
                                            <p>
                                                <span className="text-slate-500 dark:text-slate-400">내 입찰:</span>{' '}
                                                <span className="font-semibold">{item.predictedPriceLabel}</span>
                                            </p>
                                            <p>
                                                <span className="text-slate-500 dark:text-slate-400">낙찰가:</span>{' '}
                                                <span className="font-semibold">{item.winningAmountLabel}</span>
                                            </p>
                                            <p>
                                                <span className="text-slate-500 dark:text-slate-400">입찰률:</span>{' '}
                                                <span className={`font-semibold ${getRateClass(item)}`}>{item.predictedRateLabel}</span>
                                            </p>
                                            <p>
                                                <span className="text-slate-500 dark:text-slate-400">편차:</span>{' '}
                                                <span className="font-semibold">{item.deviationPercentLabel}</span>
                                            </p>
                                        </div>
                                        <div className="mt-3 flex items-center gap-2">
                                            <Link
                                                href={`/bid_history/analysis?id=${encodeURIComponent(item.id)}`}
                                                className="inline-flex h-8 items-center rounded-md border border-slate-300 px-3 text-xs font-semibold text-slate-700 hover:bg-slate-100 dark:border-slate-600 dark:text-slate-200 dark:hover:bg-slate-700"
                                            >
                                                상세보기
                                            </Link>
                                            <Link
                                                href={
                                                    item.bidNoticeId
                                                        ? `/bid_notice/detail/${item.bidNoticeId}`
                                                        : `/bid_notice/detail/${item.bidNoticeNo}`
                                                }
                                                className="inline-flex h-8 items-center rounded-md border border-slate-300 px-3 text-xs font-semibold text-slate-700 hover:bg-slate-100 dark:border-slate-600 dark:text-slate-200 dark:hover:bg-slate-700"
                                            >
                                                공고보기
                                            </Link>
                                        </div>
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
