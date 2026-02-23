import Link from 'next/link';
import type { PointHistoryData, PointHistoryFilters, PointTransactionItem } from '@/lib/bid/profile-types';

interface PointHistoryPageProps {
    data: PointHistoryData;
}

function buildCommonParams(filters: PointHistoryFilters): URLSearchParams {
    const params = new URLSearchParams();
    params.set('type', filters.type);
    params.set('pageSize', String(filters.pageSize));
    return params;
}

function buildListHref(filters: PointHistoryFilters, page: number): string {
    const params = buildCommonParams(filters);
    params.set('page', String(page));
    return `/point-history?${params.toString()}`;
}

function getAmountClassName(item: PointTransactionItem): string {
    if (item.amount > 0) {
        return 'text-emerald-600 dark:text-emerald-400';
    }

    if (item.amount < 0) {
        return 'text-rose-600 dark:text-rose-400';
    }

    return 'text-slate-600 dark:text-slate-300';
}

function renderPagination(filters: PointHistoryFilters, page: number, totalPages: number) {
    if (totalPages <= 1) {
        return null;
    }

    const pages = [];
    const start = Math.max(1, page - 2);
    const end = Math.min(totalPages, page + 2);
    for (let value = start; value <= end; value += 1) {
        pages.push(value);
    }

    return (
        <div className="mt-4 flex flex-wrap items-center justify-center gap-2">
            <Link
                aria-disabled={page <= 1}
                href={page > 1 ? buildListHref(filters, page - 1) : '#'}
                className={`inline-flex h-8 items-center rounded-md border px-3 text-sm ${
                    page > 1
                        ? 'border-slate-300 bg-white text-slate-700 hover:bg-slate-50 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-100'
                        : 'cursor-not-allowed border-slate-200 bg-slate-100 text-slate-400 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-500'
                }`}
            >
                이전
            </Link>
            {pages.map((value) => (
                <Link
                    key={value}
                    href={buildListHref(filters, value)}
                    aria-current={page === value ? 'page' : undefined}
                    className={`inline-flex h-8 min-w-8 items-center justify-center rounded-md px-2 text-sm font-semibold ${
                        page === value
                            ? 'bg-blue-600 text-white'
                            : 'border border-slate-300 bg-white text-slate-700 hover:bg-slate-50 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-200'
                    }`}
                >
                    {value}
                </Link>
            ))}
            <Link
                aria-disabled={page >= totalPages}
                href={page < totalPages ? buildListHref(filters, page + 1) : '#'}
                className={`inline-flex h-8 items-center rounded-md border px-3 text-sm ${
                    page < totalPages
                        ? 'border-slate-300 bg-white text-slate-700 hover:bg-slate-50 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-100'
                        : 'cursor-not-allowed border-slate-200 bg-slate-100 text-slate-400 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-500'
                }`}
            >
                다음
            </Link>
        </div>
    );
}

export function PointHistoryPage({ data }: PointHistoryPageProps) {
    const currentPage = Math.min(data.page, data.totalPages);

    return (
        <main className="min-h-screen bg-slate-50 px-4 py-6 text-slate-900 md:px-6 lg:px-8 dark:bg-[#0B1121] dark:text-slate-100">
            <div className="mx-auto max-w-[1280px] space-y-4">
                <header className="rounded-xl border border-slate-200 bg-white px-6 py-5 shadow-sm dark:border-slate-700 dark:bg-[#151E32]">
                    <div className="mb-1 text-sm text-slate-500 dark:text-slate-400">홈 &gt; 포인트 내역</div>
                    <div className="flex flex-wrap items-center justify-between gap-2">
                        <h1 className="text-2xl font-bold">포인트 거래 내역</h1>
                        <Link
                            href="/profile"
                            className="inline-flex h-10 items-center rounded-md border border-slate-300 bg-white px-4 text-sm font-semibold text-slate-700 hover:bg-slate-50 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-100 dark:hover:bg-slate-700"
                        >
                            프로필로 이동
                        </Link>
                    </div>
                </header>

                <section className="grid grid-cols-1 gap-3 md:grid-cols-2">
                    <article className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-700 dark:bg-[#151E32]">
                        <p className="text-xs text-slate-500 dark:text-slate-400">현재 잔액</p>
                        <p className="mt-1 text-2xl font-bold text-amber-600 dark:text-amber-400">{data.balanceLabel}</p>
                    </article>
                    <article className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-700 dark:bg-[#151E32]">
                        <p className="text-xs text-slate-500 dark:text-slate-400">거래 건수</p>
                        <p className="mt-1 text-2xl font-bold">{data.totalCount.toLocaleString('ko-KR')}건</p>
                    </article>
                </section>

                <form
                    action="/point-history"
                    method="get"
                    className="rounded-xl border border-slate-200 bg-white px-4 py-4 shadow-sm dark:border-slate-700 dark:bg-[#151E32]"
                >
                    <input type="hidden" name="page" value="1" />
                    <input type="hidden" name="pageSize" value={String(data.filters.pageSize)} />
                    <div className="grid grid-cols-1 gap-2 md:grid-cols-[240px_auto]">
                        <select
                            name="type"
                            defaultValue={data.filters.type}
                            className="h-10 rounded-md border border-slate-300 bg-white px-3 text-sm dark:border-slate-600 dark:bg-slate-800"
                        >
                            <option value="all">전체 거래</option>
                            <option value="purchase">충전</option>
                            <option value="deduction">사용</option>
                            <option value="refund">환불</option>
                        </select>

                        <button
                            type="submit"
                            className="inline-flex h-10 items-center justify-center rounded-md bg-blue-600 px-4 text-sm font-semibold text-white hover:bg-blue-700"
                        >
                            적용
                        </button>
                    </div>
                </form>

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

                <section className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm dark:border-slate-700 dark:bg-[#151E32]">
                    {data.items.length === 0 ? (
                        <div className="px-6 py-16 text-center">
                            <p className="text-lg font-semibold">거래 내역이 없습니다</p>
                            <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">
                                포인트 충전 또는 사용 시 내역이 표시됩니다.
                            </p>
                        </div>
                    ) : (
                        <div className="overflow-x-auto">
                            <table className="min-w-full divide-y divide-slate-200 text-sm dark:divide-slate-700">
                                <thead className="bg-slate-50 text-left text-xs font-semibold uppercase tracking-wide text-slate-500 dark:bg-slate-900 dark:text-slate-300">
                                    <tr>
                                        <th className="px-4 py-3">일시</th>
                                        <th className="px-4 py-3">유형</th>
                                        <th className="px-4 py-3">설명</th>
                                        <th className="px-4 py-3 text-right">변동</th>
                                        <th className="px-4 py-3 text-right">잔액</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-200 dark:divide-slate-700">
                                    {data.items.map((item) => (
                                        <tr key={item.id}>
                                            <td className="px-4 py-3 text-slate-600 dark:text-slate-300">
                                                {item.createdAtLabel}
                                            </td>
                                            <td className="px-4 py-3">{item.typeLabel}</td>
                                            <td className="px-4 py-3">{item.description}</td>
                                            <td className={`px-4 py-3 text-right font-semibold ${getAmountClassName(item)}`}>
                                                {item.amountLabel}
                                            </td>
                                            <td className="px-4 py-3 text-right">{item.balanceAfterLabel}</td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )}
                </section>

                {renderPagination(data.filters, currentPage, data.totalPages)}
            </div>
        </main>
    );
}
