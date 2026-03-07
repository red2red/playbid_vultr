'use client';

import Link from 'next/link';
import { useEffect, useMemo, useState } from 'react';
import { buildLoginRedirectHref, useAuthAction } from '@/hooks/use-auth-action';
import { publishBookmarkChange, subscribeBookmarkChange } from '@/lib/bid/bookmark-client-sync';
import { AuthorizedFetchAuthError, authorizedFetch } from '@/lib/api/authorized-fetch';
import type { BookmarkListData, BookmarkListFilters, BookmarkListItem } from '@/lib/bid/bookmark-list-types';
import { createClient } from '@/lib/supabase/client';

interface BookmarkListPageProps {
    data: BookmarkListData;
}

interface RemoveResult {
    removed: BookmarkListItem | null;
    nextItems: BookmarkListItem[];
}

function buildCommonParams(filters: BookmarkListFilters): URLSearchParams {
    const params = new URLSearchParams();
    params.set('category', filters.category);
    params.set('deadline', filters.deadline);
    params.set('query', filters.query);
    params.set('sort', filters.sort);
    params.set('pageSize', String(filters.pageSize));
    return params;
}

function buildListHref(filters: BookmarkListFilters, page: number): string {
    const params = buildCommonParams(filters);
    params.set('page', String(page));
    return `/profile/bookmarks?${params.toString()}`;
}

function removeItemByNoticeId(items: BookmarkListItem[], noticeId: string): RemoveResult {
    const index = items.findIndex((item) => item.noticeId === noticeId);
    if (index < 0) {
        return {
            removed: null,
            nextItems: items,
        };
    }

    return {
        removed: items[index],
        nextItems: [...items.slice(0, index), ...items.slice(index + 1)],
    };
}

function updateSummaryAfterRemoval(
    summary: BookmarkListData['summary'],
    removed: BookmarkListItem | null
): BookmarkListData['summary'] {
    if (!removed) {
        return summary;
    }

    return {
        totalCount: Math.max(0, summary.totalCount - 1),
        urgentCount: Math.max(0, summary.urgentCount - (removed.isDeadlineSoon ? 1 : 0)),
        closedCount: Math.max(0, summary.closedCount - (removed.isClosed ? 1 : 0)),
    };
}

function getDeadlineClassName(item: BookmarkListItem): string {
    if (item.isDeadlineSoon) {
        return 'text-rose-600 dark:text-rose-400';
    }

    if (item.isClosed) {
        return 'text-slate-500 dark:text-slate-400';
    }

    return 'text-slate-700 dark:text-slate-300';
}

function renderPagination(filters: BookmarkListFilters, page: number, totalPages: number) {
    if (totalPages <= 1) {
        return null;
    }

    const pages = [];
    const start = Math.max(1, page - 2);
    const end = Math.min(totalPages, page + 2);
    for (let value = start; value <= end; value += 1) {
        pages.push(value);
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
            {pages.map((value) => (
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

export function BookmarkListPage({ data }: BookmarkListPageProps) {
    const { runWithAuth } = useAuthAction();
    const supabase = useMemo(() => createClient(), []);
    const [items, setItems] = useState<BookmarkListItem[]>(data.items);
    const [summary, setSummary] = useState(data.summary);
    const [totalCount, setTotalCount] = useState(data.totalCount);
    const [pendingNoticeId, setPendingNoticeId] = useState<string | null>(null);
    const [actionError, setActionError] = useState<string | null>(null);
    const [hasExternalAddition, setHasExternalAddition] = useState(false);

    useEffect(() => {
        setItems(data.items);
        setSummary(data.summary);
        setTotalCount(data.totalCount);
        setPendingNoticeId(null);
        setActionError(null);
        setHasExternalAddition(false);
    }, [data.items, data.summary, data.totalCount]);

    useEffect(() => {
        return subscribeBookmarkChange((payload) => {
            if (payload.isBookmarked) {
                setItems((prevItems) => {
                    const exists = prevItems.some((item) => item.noticeId === payload.noticeId);
                    if (!exists) {
                        setHasExternalAddition(true);
                    }
                    return prevItems;
                });
                return;
            }

            setItems((prevItems) => {
                const { removed, nextItems } = removeItemByNoticeId(prevItems, payload.noticeId);
                if (removed) {
                    setSummary((prevSummary) => updateSummaryAfterRemoval(prevSummary, removed));
                    setTotalCount((prevTotalCount) => Math.max(0, prevTotalCount - 1));
                }
                return nextItems;
            });
        });
    }, []);

    const currentTotalPages = useMemo(() => {
        return Math.max(1, Math.ceil(totalCount / data.pageSize));
    }, [data.pageSize, totalCount]);

    const currentPage = Math.min(data.page, currentTotalPages);

    const handleRemoveBookmark = async (item: BookmarkListItem) => {
        if (pendingNoticeId) {
            return;
        }

        const confirmed = window.confirm('북마크를 삭제하시겠습니까?');
        if (!confirmed) {
            return;
        }

        setActionError(null);

        await runWithAuth(async () => {
            const previousItems = items;
            const previousSummary = summary;
            const previousTotalCount = totalCount;

            const optimisticResult = removeItemByNoticeId(previousItems, item.noticeId);
            setItems(optimisticResult.nextItems);
            setSummary(updateSummaryAfterRemoval(previousSummary, optimisticResult.removed));
            setTotalCount(Math.max(0, previousTotalCount - (optimisticResult.removed ? 1 : 0)));

            setPendingNoticeId(item.noticeId);
            try {
                const response = await authorizedFetch('/api/bookmarks/toggle', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({
                        noticeId: item.noticeId,
                        noticeNumber: item.noticeNumber,
                    }),
                }, {
                    refreshSession: async () => supabase.auth.refreshSession(),
                    onAuthFailure: () => {
                        const search = window.location.search.replace(/^\?/, '');
                        window.location.assign(buildLoginRedirectHref(window.location.pathname, search));
                    },
                });

                const payload = (await response.json()) as {
                    ok?: boolean;
                    isBookmarked?: boolean;
                    message?: string;
                };

                if (!response.ok || !payload.ok) {
                    setItems(previousItems);
                    setSummary(previousSummary);
                    setTotalCount(previousTotalCount);
                    setActionError(payload.message ?? '북마크 삭제에 실패했습니다.');
                    return;
                }

                if (payload.isBookmarked) {
                    setItems(previousItems);
                    setSummary(previousSummary);
                    setTotalCount(previousTotalCount);
                    setActionError('북마크 상태를 동기화하지 못했습니다. 새로고침 후 다시 시도해 주세요.');
                    return;
                }

                publishBookmarkChange(item.noticeId, false);
            } catch (error) {
                if (error instanceof AuthorizedFetchAuthError) {
                    return;
                }
                setItems(previousItems);
                setSummary(previousSummary);
                setTotalCount(previousTotalCount);
                setActionError('네트워크 오류로 북마크를 삭제하지 못했습니다.');
            } finally {
                setPendingNoticeId(null);
            }
        });
    };

    return (
        <main className="min-h-screen bg-slate-50 px-4 py-6 text-slate-900 md:px-6 lg:px-8 dark:bg-[#0B1121] dark:text-slate-100">
            <div className="mx-auto max-w-[1440px] space-y-4">
                <header className="rounded-xl border border-slate-200 bg-white px-6 py-5 shadow-sm dark:border-slate-700 dark:bg-[#151E32]">
                    <div className="mb-1 text-sm text-slate-500 dark:text-slate-400">홈 &gt; 북마크</div>
                    <div className="flex flex-wrap items-center justify-between gap-2">
                        <h1 className="text-2xl font-bold">내 북마크</h1>
                        <Link
                            href="/bid_notice"
                            className="inline-flex h-10 items-center rounded-lg border border-slate-300 bg-white px-4 text-sm font-semibold text-slate-700 hover:bg-slate-50 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-100 dark:hover:bg-slate-700"
                        >
                            공고 보러가기
                        </Link>
                    </div>
                </header>

                <form
                    action="/profile/bookmarks"
                    method="get"
                    aria-label="북마크 필터"
                    className="rounded-xl border border-slate-200 bg-white px-4 py-4 shadow-sm dark:border-slate-700 dark:bg-[#151E32]"
                >
                    <input type="hidden" name="page" value="1" />
                    <input type="hidden" name="pageSize" value={String(data.filters.pageSize)} />
                    <div className="grid grid-cols-1 gap-2 md:grid-cols-2 xl:grid-cols-5">
                        <select
                            name="category"
                            defaultValue={data.filters.category}
                            aria-label="카테고리 필터"
                            className="h-10 rounded-md border border-slate-300 bg-white px-3 text-sm dark:border-slate-600 dark:bg-slate-800"
                        >
                            <option value="all">전체 카테고리</option>
                            <option value="construction">공사</option>
                            <option value="service">용역</option>
                            <option value="goods">물품</option>
                        </select>

                        <select
                            name="deadline"
                            defaultValue={data.filters.deadline}
                            aria-label="마감 필터"
                            className="h-10 rounded-md border border-slate-300 bg-white px-3 text-sm dark:border-slate-600 dark:bg-slate-800"
                        >
                            <option value="all">전체 마감</option>
                            <option value="urgent">24시간 이내</option>
                            <option value="week">7일 이내</option>
                        </select>

                        <select
                            name="sort"
                            defaultValue={data.filters.sort}
                            aria-label="정렬 기준"
                            className="h-10 rounded-md border border-slate-300 bg-white px-3 text-sm dark:border-slate-600 dark:bg-slate-800"
                        >
                            <option value="saved_latest">저장 최신순</option>
                            <option value="saved_oldest">저장 오래된순</option>
                            <option value="deadline_soon">마감 임박순</option>
                            <option value="price_desc">금액 높은순</option>
                            <option value="title_asc">공고명 오름차순</option>
                        </select>

                        <input
                            type="search"
                            name="query"
                            defaultValue={data.filters.query}
                            placeholder="공고명/기관명/공고번호 검색"
                            aria-label="검색어"
                            className="h-10 rounded-md border border-slate-300 bg-white px-3 text-sm dark:border-slate-600 dark:bg-slate-800"
                        />

                        <button
                            type="submit"
                            className="inline-flex h-10 items-center justify-center rounded-md bg-blue-600 px-4 text-sm font-semibold text-white hover:bg-blue-700"
                        >
                            적용
                        </button>
                    </div>
                </form>

                <section className="grid grid-cols-1 gap-3 md:grid-cols-3">
                    <article className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-700 dark:bg-[#151E32]">
                        <p className="text-xs text-slate-500 dark:text-slate-400">총 북마크</p>
                        <p className="mt-1 text-2xl font-bold">{summary.totalCount.toLocaleString('ko-KR')}건</p>
                    </article>
                    <article className="rounded-xl border border-rose-200 bg-rose-50 p-4 shadow-sm dark:border-rose-900 dark:bg-rose-950/30">
                        <p className="text-xs text-rose-700 dark:text-rose-300">24시간 이내 마감</p>
                        <p className="mt-1 text-2xl font-bold text-rose-700 dark:text-rose-300">
                            {summary.urgentCount.toLocaleString('ko-KR')}건
                        </p>
                    </article>
                    <article className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-700 dark:bg-[#151E32]">
                        <p className="text-xs text-slate-500 dark:text-slate-400">마감 완료</p>
                        <p className="mt-1 text-2xl font-bold">{summary.closedCount.toLocaleString('ko-KR')}건</p>
                    </article>
                </section>

                {hasExternalAddition ? (
                    <section className="rounded-xl border border-blue-200 bg-blue-50 px-4 py-3 text-sm text-blue-800 dark:border-blue-900 dark:bg-blue-950/30 dark:text-blue-200">
                        다른 화면에서 새 북마크가 추가되었습니다.{' '}
                        <Link href={buildListHref(data.filters, 1)} className="font-semibold underline">
                            최신 목록 새로고침
                        </Link>
                    </section>
                ) : null}

                {data.error ? (
                    <section
                        role="alert"
                        className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800 dark:border-amber-900 dark:bg-amber-950/40 dark:text-amber-200"
                    >
                        <p className="font-semibold">{data.error.message}</p>
                        <p className="mt-1 text-xs">요청 ID: {data.error.requestId}</p>
                        <p className="mt-1 text-xs">{data.error.suggestion}</p>
                        {data.error.code === 'BOOKMARK_AUTH_REQUIRED' ? (
                            <Link
                                href="/login?returnTo=%2Fprofile%2Fbookmarks"
                                className="mt-2 inline-flex h-8 items-center rounded-md bg-blue-600 px-3 text-xs font-semibold text-white hover:bg-blue-700"
                            >
                                로그인 이동
                            </Link>
                        ) : null}
                    </section>
                ) : null}

                {actionError ? (
                    <section className="rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700 dark:border-rose-900 dark:bg-rose-950/40 dark:text-rose-300">
                        {actionError}
                    </section>
                ) : null}

                <section className="rounded-xl border border-slate-200 bg-white shadow-sm dark:border-slate-700 dark:bg-[#151E32]">
                    {items.length === 0 ? (
                        <div className="px-6 py-20 text-center">
                            <p className="text-lg font-semibold">저장된 북마크가 없습니다</p>
                            <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">
                                관심있는 공고를 북마크하여 빠르게 확인하세요.
                            </p>
                            <Link
                                href="/bid_notice"
                                className="mt-4 inline-flex h-10 items-center rounded-lg bg-blue-600 px-4 text-sm font-semibold text-white hover:bg-blue-700"
                            >
                                입찰공고 둘러보기
                            </Link>
                        </div>
                    ) : (
                        <div className="space-y-3 p-4">
                            {items.map((item) => (
                                <article
                                    key={item.scrapId}
                                    className={`rounded-lg border p-4 ${
                                        item.isDeadlineSoon
                                            ? 'border-rose-300 bg-rose-50/70 dark:border-rose-800 dark:bg-rose-950/20'
                                            : 'border-slate-200 bg-slate-50 dark:border-slate-700 dark:bg-slate-800'
                                    }`}
                                >
                                    <div className="flex flex-wrap items-start justify-between gap-2">
                                        <div className="min-w-0 flex-1">
                                            <div className="mb-1 flex flex-wrap items-center gap-2">
                                                <span className="inline-flex items-center rounded-full border border-slate-300 bg-white px-2 py-1 text-[11px] font-semibold text-slate-700 dark:border-slate-600 dark:bg-slate-900 dark:text-slate-300">
                                                    {item.categoryLabel}
                                                </span>
                                                {item.isDeadlineSoon ? (
                                                    <span className="inline-flex items-center rounded-full border border-rose-300 bg-rose-100 px-2 py-1 text-[11px] font-semibold text-rose-700 dark:border-rose-700 dark:bg-rose-900/40 dark:text-rose-300">
                                                        마감임박 24h
                                                    </span>
                                                ) : null}
                                                {item.isClosed ? (
                                                    <span className="inline-flex items-center rounded-full border border-slate-300 bg-slate-200 px-2 py-1 text-[11px] font-semibold text-slate-700 dark:border-slate-600 dark:bg-slate-700 dark:text-slate-300">
                                                        마감
                                                    </span>
                                                ) : null}
                                            </div>
                                            <Link
                                                href={`/bid_notice/detail/${item.noticeId || item.noticeNumber}`}
                                                className="line-clamp-1 text-base font-semibold text-slate-900 hover:text-blue-700 dark:text-slate-100 dark:hover:text-blue-300"
                                            >
                                                {item.title}
                                            </Link>
                                            <p className="mt-1 text-sm text-slate-600 dark:text-slate-300">
                                                {item.organization}
                                                {item.demandOrganization ? ` · ${item.demandOrganization}` : ''}
                                            </p>
                                            <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
                                                공고번호 {item.noticeNumber}
                                                {item.noticeOrder ? `-${item.noticeOrder}` : ''}
                                            </p>
                                        </div>

                                        <div className="flex items-center gap-2">
                                            <button
                                                type="button"
                                                onClick={() => handleRemoveBookmark(item)}
                                                disabled={pendingNoticeId === item.noticeId}
                                                className="inline-flex h-8 items-center rounded-md border border-rose-300 bg-white px-3 text-xs font-semibold text-rose-700 hover:bg-rose-50 disabled:cursor-not-allowed disabled:opacity-70 dark:border-rose-700 dark:bg-slate-900 dark:text-rose-300 dark:hover:bg-rose-900/30"
                                            >
                                                {pendingNoticeId === item.noticeId ? '삭제중...' : '삭제'}
                                            </button>
                                            <Link
                                                href={`/bid_notice/detail/${item.noticeId || item.noticeNumber}`}
                                                className="inline-flex h-8 items-center rounded-md border border-slate-300 bg-white px-3 text-xs font-semibold text-slate-700 hover:bg-slate-100 dark:border-slate-600 dark:bg-slate-900 dark:text-slate-200 dark:hover:bg-slate-700"
                                            >
                                                상세보기
                                            </Link>
                                        </div>
                                    </div>

                                    <div className="mt-3 grid grid-cols-1 gap-2 text-xs text-slate-600 md:grid-cols-3 dark:text-slate-300">
                                        <p>
                                            <span className="text-slate-500 dark:text-slate-400">추정가격:</span>{' '}
                                            <span className="font-semibold">{item.estimatedPriceLabel}</span>
                                        </p>
                                        <p>
                                            <span className="text-slate-500 dark:text-slate-400">입찰마감:</span>{' '}
                                            <span className={`font-semibold ${getDeadlineClassName(item)}`}>
                                                {item.deadlineAtLabel}
                                            </span>
                                        </p>
                                        <p>
                                            <span className="text-slate-500 dark:text-slate-400">저장일:</span>{' '}
                                            <span className="font-semibold">{item.savedAtLabel}</span>
                                        </p>
                                    </div>
                                </article>
                            ))}
                        </div>
                    )}
                </section>

                {renderPagination(data.filters, currentPage, currentTotalPages)}
            </div>
        </main>
    );
}
