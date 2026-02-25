'use client';

import Link from 'next/link';
import { useEffect, useMemo, useState } from 'react';
import { buildLoginRedirectHref, useAuthAction } from '@/hooks/use-auth-action';
import { AuthorizedFetchAuthError, authorizedFetch } from '@/lib/api/authorized-fetch';
import {
    publishNotificationChange,
    subscribeNotificationChange,
} from '@/lib/bid/notification-client-sync';
import { createClient } from '@/lib/supabase/client';
import type {
    NotificationListData,
    NotificationListFilters,
    NotificationListItem,
    NotificationSummary,
    NotificationType,
    NotificationTypeFilter,
} from '@/lib/bid/notification-list-types';

interface NotificationCenterPageProps {
    data: NotificationListData;
}

interface NotificationActionResponse {
    ok?: boolean;
    unreadCount?: number;
    updatedCount?: number;
    message?: string;
}

interface LocalNotificationState {
    items: NotificationListItem[];
    summary: NotificationSummary;
    totalCount: number;
}

const TAB_ITEMS: {
    value: NotificationTypeFilter;
    label: string;
    countKey: keyof NotificationSummary['typeCounts'];
}[] = [
    { value: 'all', label: '전체', countKey: 'all' },
    { value: 'deadline', label: '마감 임박', countKey: 'deadline' },
    { value: 'result', label: '개찰 결과', countKey: 'result' },
    { value: 'system', label: '시스템', countKey: 'system' },
    { value: 'premium', label: '프리미엄', countKey: 'premium' },
];

function createInitialState(data: NotificationListData): LocalNotificationState {
    return {
        items: data.items,
        summary: data.summary,
        totalCount: data.totalCount,
    };
}

function buildCommonParams(filters: NotificationListFilters): URLSearchParams {
    const params = new URLSearchParams();
    params.set('type', filters.type);
    params.set('read', filters.read);
    params.set('query', filters.query);
    params.set('sort', filters.sort);
    params.set('pageSize', String(filters.pageSize));
    return params;
}

function buildListHref(
    filters: NotificationListFilters,
    overrides: Partial<NotificationListFilters>
): string {
    const nextFilters: NotificationListFilters = {
        ...filters,
        ...overrides,
    };
    const params = buildCommonParams(nextFilters);
    params.set('page', String(nextFilters.page));
    return `/profile/notifications?${params.toString()}`;
}

function getTypeLabel(type: NotificationType): string {
    if (type === 'deadline') {
        return '마감 임박';
    }
    if (type === 'result') {
        return '개찰 결과';
    }
    if (type === 'premium') {
        return '프리미엄';
    }
    return '시스템';
}

function getTypeBadgeClass(type: NotificationType): string {
    if (type === 'deadline') {
        return 'border-amber-300 bg-amber-100 text-amber-700 dark:border-amber-800 dark:bg-amber-950/40 dark:text-amber-300';
    }
    if (type === 'result') {
        return 'border-blue-300 bg-blue-100 text-blue-700 dark:border-blue-800 dark:bg-blue-950/40 dark:text-blue-300';
    }
    if (type === 'premium') {
        return 'border-violet-300 bg-violet-100 text-violet-700 dark:border-violet-800 dark:bg-violet-950/40 dark:text-violet-300';
    }
    return 'border-slate-300 bg-slate-100 text-slate-700 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300';
}

function getTypeDotClass(type: NotificationType): string {
    if (type === 'deadline') {
        return 'bg-amber-500';
    }
    if (type === 'result') {
        return 'bg-blue-500';
    }
    if (type === 'premium') {
        return 'bg-violet-500';
    }
    return 'bg-slate-500';
}

function applyUnreadCount(state: LocalNotificationState, unreadCount: number): LocalNotificationState {
    return {
        ...state,
        summary: {
            ...state.summary,
            unreadCount: Math.max(0, unreadCount),
        },
    };
}

function applyReadByIds(state: LocalNotificationState, ids: string[]): LocalNotificationState {
    const idSet = new Set(ids);
    let unreadChanged = 0;

    const nextItems = state.items.map((item) => {
        if (item.isRead || !idSet.has(item.id)) {
            return item;
        }

        unreadChanged += 1;
        return {
            ...item,
            isRead: true,
        };
    });

    if (unreadChanged === 0) {
        return state;
    }

    return {
        ...state,
        items: nextItems,
        summary: {
            ...state.summary,
            unreadCount: Math.max(0, state.summary.unreadCount - unreadChanged),
        },
    };
}

function applyReadAll(state: LocalNotificationState): LocalNotificationState {
    return {
        ...state,
        items: state.items.map((item) =>
            item.isRead
                ? item
                : {
                      ...item,
                      isRead: true,
                  }
        ),
        summary: {
            ...state.summary,
            unreadCount: 0,
        },
    };
}

function applyDeleteByIds(state: LocalNotificationState, ids: string[]): LocalNotificationState {
    const idSet = new Set(ids);
    const nextTypeCounts = {
        ...state.summary.typeCounts,
    };

    let unreadRemoved = 0;
    let removedCount = 0;

    const nextItems: NotificationListItem[] = [];
    for (const item of state.items) {
        if (!idSet.has(item.id)) {
            nextItems.push(item);
            continue;
        }

        removedCount += 1;
        if (!item.isRead) {
            unreadRemoved += 1;
        }

        nextTypeCounts.all = Math.max(0, nextTypeCounts.all - 1);
        nextTypeCounts[item.type] = Math.max(0, nextTypeCounts[item.type] - 1);
    }

    if (removedCount === 0) {
        return state;
    }

    return {
        items: nextItems,
        totalCount: Math.max(0, state.totalCount - removedCount),
        summary: {
            totalCount: Math.max(0, state.summary.totalCount - removedCount),
            unreadCount: Math.max(0, state.summary.unreadCount - unreadRemoved),
            typeCounts: nextTypeCounts,
        },
    };
}

function renderPagination(filters: NotificationListFilters, page: number, totalPages: number) {
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
                    href={buildListHref(filters, { page: page - 1 })}
                    className="inline-flex h-8 items-center rounded-md border border-slate-300 bg-white px-3 text-sm text-slate-700 hover:bg-slate-50 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-100"
                >
                    이전
                </Link>
            )}
            {pages.map((value) => (
                <Link
                    key={value}
                    href={buildListHref(filters, { page: value })}
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
            {nextDisabled ? (
                <span
                    aria-disabled="true"
                    className="inline-flex h-8 cursor-not-allowed items-center rounded-md border border-slate-200 bg-slate-100 px-3 text-sm text-slate-400 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-500"
                >
                    다음
                </span>
            ) : (
                <Link
                    href={buildListHref(filters, { page: page + 1 })}
                    className="inline-flex h-8 items-center rounded-md border border-slate-300 bg-white px-3 text-sm text-slate-700 hover:bg-slate-50 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-100"
                >
                    다음
                </Link>
            )}
        </div>
    );
}

export function NotificationCenterPage({ data }: NotificationCenterPageProps) {
    const { runWithAuth } = useAuthAction();
    const supabase = useMemo(() => createClient(), []);
    const [viewState, setViewState] = useState<LocalNotificationState>(() => createInitialState(data));
    const [selectedIds, setSelectedIds] = useState<string[]>([]);
    const [activeItem, setActiveItem] = useState<NotificationListItem | null>(null);
    const [pendingIds, setPendingIds] = useState<string[]>([]);
    const [pendingAllRead, setPendingAllRead] = useState(false);
    const [actionError, setActionError] = useState<string | null>(null);
    const [hasExternalAddition, setHasExternalAddition] = useState(false);

    useEffect(() => {
        setViewState(createInitialState(data));
        setSelectedIds([]);
        setActiveItem(null);
        setPendingIds([]);
        setPendingAllRead(false);
        setActionError(null);
        setHasExternalAddition(false);
    }, [data]);

    useEffect(() => {
        return subscribeNotificationChange((payload) => {
            setViewState((prev) => {
                let next = prev;

                if (payload.action === 'read' && payload.notificationIds) {
                    next = applyReadByIds(next, payload.notificationIds);
                }

                if (payload.action === 'read_all') {
                    next = applyReadAll(next);
                }

                if (payload.action === 'delete' && payload.notificationIds) {
                    next = applyDeleteByIds(next, payload.notificationIds);
                }

                if (typeof payload.unreadCount === 'number') {
                    next = applyUnreadCount(next, payload.unreadCount);
                }

                return next;
            });

            if (payload.action === 'delete' && payload.notificationIds) {
                setSelectedIds((prev) => prev.filter((id) => !payload.notificationIds?.includes(id)));
                setActiveItem((prev) =>
                    prev && payload.notificationIds?.includes(prev.id) ? null : prev
                );
            }

            if (payload.action === 'create') {
                setHasExternalAddition(true);
            }
        });
    }, []);

    const currentTotalPages = useMemo(() => {
        return Math.max(1, Math.ceil(viewState.totalCount / data.pageSize));
    }, [data.pageSize, viewState.totalCount]);

    const currentPage = Math.min(data.page, currentTotalPages);

    const isPending = (id: string) => pendingIds.includes(id);

    const handleMarkRead = async (notificationIds: string[]) => {
        const ids = [...new Set(notificationIds.map((id) => id.trim()).filter(Boolean))];
        if (ids.length === 0 || pendingAllRead || pendingIds.length > 0) {
            return;
        }

        setActionError(null);

        await runWithAuth(async () => {
            setPendingIds(ids);
            setViewState((prev) => applyReadByIds(prev, ids));

            try {
                const response = await authorizedFetch('/api/notifications/read', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({ notificationIds: ids }),
                }, {
                    refreshSession: async () => supabase.auth.refreshSession(),
                    onAuthFailure: () => {
                        const search = window.location.search.replace(/^\?/, '');
                        window.location.assign(buildLoginRedirectHref(window.location.pathname, search));
                    },
                });

                const payload = (await response.json()) as NotificationActionResponse;
                if (!response.ok || !payload.ok) {
                    setActionError(payload.message ?? '읽음 처리에 실패했습니다. 새로고침 후 다시 시도해 주세요.');
                    return;
                }

                if (typeof payload.unreadCount === 'number') {
                    setViewState((prev) => applyUnreadCount(prev, payload.unreadCount ?? prev.summary.unreadCount));
                }

                publishNotificationChange({
                    action: 'read',
                    notificationIds: ids,
                    unreadCount: payload.unreadCount,
                });
            } catch (error) {
                if (error instanceof AuthorizedFetchAuthError) {
                    return;
                }
                setActionError('네트워크 오류로 읽음 처리에 실패했습니다.');
            } finally {
                setPendingIds([]);
            }
        });
    };

    const handleMarkAllRead = async () => {
        if (pendingAllRead || pendingIds.length > 0 || viewState.summary.unreadCount <= 0) {
            return;
        }

        setActionError(null);

        await runWithAuth(async () => {
            setPendingAllRead(true);

            try {
                const response = await authorizedFetch('/api/notifications/read-all', {
                    method: 'POST',
                }, {
                    refreshSession: async () => supabase.auth.refreshSession(),
                    onAuthFailure: () => {
                        const search = window.location.search.replace(/^\?/, '');
                        window.location.assign(buildLoginRedirectHref(window.location.pathname, search));
                    },
                });
                const payload = (await response.json()) as NotificationActionResponse;

                if (!response.ok || !payload.ok) {
                    setActionError(payload.message ?? '전체 읽음 처리에 실패했습니다.');
                    return;
                }

                setViewState((prev) => {
                    const readAllState = applyReadAll(prev);
                    if (typeof payload.unreadCount === 'number') {
                        return applyUnreadCount(readAllState, payload.unreadCount);
                    }
                    return readAllState;
                });

                publishNotificationChange({
                    action: 'read_all',
                    unreadCount: payload.unreadCount,
                });
            } catch (error) {
                if (error instanceof AuthorizedFetchAuthError) {
                    return;
                }
                setActionError('네트워크 오류로 전체 읽음 처리에 실패했습니다.');
            } finally {
                setPendingAllRead(false);
            }
        });
    };

    const handleDelete = async (notificationIds: string[]) => {
        const ids = [...new Set(notificationIds.map((id) => id.trim()).filter(Boolean))];
        if (ids.length === 0 || pendingAllRead || pendingIds.length > 0) {
            return;
        }

        const confirmed = window.confirm(
            ids.length === 1 ? '이 알림을 삭제하시겠습니까?' : `${ids.length}개 알림을 삭제하시겠습니까?`
        );
        if (!confirmed) {
            return;
        }

        setActionError(null);

        await runWithAuth(async () => {
            setPendingIds(ids);

            try {
                const response = await authorizedFetch('/api/notifications/delete', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({ notificationIds: ids }),
                }, {
                    refreshSession: async () => supabase.auth.refreshSession(),
                    onAuthFailure: () => {
                        const search = window.location.search.replace(/^\?/, '');
                        window.location.assign(buildLoginRedirectHref(window.location.pathname, search));
                    },
                });
                const payload = (await response.json()) as NotificationActionResponse;

                if (!response.ok || !payload.ok) {
                    setActionError(payload.message ?? '알림 삭제에 실패했습니다.');
                    return;
                }

                setViewState((prev) => {
                    const deletedState = applyDeleteByIds(prev, ids);
                    if (typeof payload.unreadCount === 'number') {
                        return applyUnreadCount(deletedState, payload.unreadCount);
                    }
                    return deletedState;
                });

                setSelectedIds((prev) => prev.filter((id) => !ids.includes(id)));
                setActiveItem((prev) => (prev && ids.includes(prev.id) ? null : prev));

                publishNotificationChange({
                    action: 'delete',
                    notificationIds: ids,
                    unreadCount: payload.unreadCount,
                });
            } catch (error) {
                if (error instanceof AuthorizedFetchAuthError) {
                    return;
                }
                setActionError('네트워크 오류로 알림을 삭제하지 못했습니다.');
            } finally {
                setPendingIds([]);
            }
        });
    };

    const handleToggleSelectAllCurrentPage = () => {
        const currentIds = viewState.items.map((item) => item.id);
        const allSelected = currentIds.length > 0 && currentIds.every((id) => selectedIds.includes(id));

        if (allSelected) {
            setSelectedIds((prev) => prev.filter((id) => !currentIds.includes(id)));
            return;
        }

        setSelectedIds((prev) => [...new Set([...prev, ...currentIds])]);
    };

    const handleOpenDetail = (item: NotificationListItem) => {
        setActiveItem(item);
        if (!item.isRead) {
            void handleMarkRead([item.id]);
        }
    };

    return (
        <main className="min-h-screen bg-slate-50 px-4 py-6 text-slate-900 md:px-6 lg:px-8 dark:bg-[#0B1121] dark:text-slate-100">
            <div className="mx-auto max-w-[1440px] space-y-4">
                <header className="rounded-xl border border-slate-200 bg-white px-6 py-5 shadow-sm dark:border-slate-700 dark:bg-[#151E32]">
                    <div className="mb-1 text-sm text-slate-500 dark:text-slate-400">홈 &gt; 알림</div>
                    <div className="flex flex-wrap items-center justify-between gap-2">
                        <div className="flex flex-wrap items-center gap-2">
                            <h1 className="text-2xl font-bold">알림</h1>
                            <span className="inline-flex h-7 items-center rounded-full bg-rose-100 px-3 text-xs font-semibold text-rose-700 dark:bg-rose-950/40 dark:text-rose-300">
                                <span className="sr-only">미읽음 알림</span>
                                {viewState.summary.unreadCount.toLocaleString('ko-KR')}개 읽지 않음
                            </span>
                        </div>
                        <button
                            type="button"
                            disabled={viewState.summary.unreadCount <= 0 || pendingAllRead || pendingIds.length > 0}
                            onClick={handleMarkAllRead}
                            className="inline-flex h-10 items-center rounded-lg border border-slate-300 bg-white px-4 text-sm font-semibold text-slate-700 hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-60 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-100 dark:hover:bg-slate-700"
                        >
                            {pendingAllRead ? '처리중...' : '모두 읽음 처리'}
                        </button>
                    </div>
                </header>

                <nav className="overflow-x-auto rounded-xl border border-slate-200 bg-white px-3 py-2 shadow-sm dark:border-slate-700 dark:bg-[#151E32]">
                    <ul className="flex min-w-max items-center gap-2">
                        {TAB_ITEMS.map((tab) => {
                            const active = data.filters.type === tab.value;
                            const count = viewState.summary.typeCounts[tab.countKey];
                            return (
                                <li key={tab.value}>
                                    <Link
                                        href={buildListHref(data.filters, { type: tab.value, page: 1 })}
                                        className={`inline-flex h-10 items-center gap-2 rounded-md px-3 text-sm font-semibold ${
                                            active
                                                ? 'border border-blue-200 bg-blue-50 text-blue-700 dark:border-blue-800 dark:bg-blue-950/30 dark:text-blue-200'
                                                : 'border border-transparent text-slate-600 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-800'
                                        }`}
                                    >
                                        <span>{tab.label}</span>
                                        <span className="inline-flex min-w-6 items-center justify-center rounded-full bg-slate-200 px-1.5 py-0.5 text-[11px] text-slate-700 dark:bg-slate-700 dark:text-slate-200">
                                            {count.toLocaleString('ko-KR')}
                                        </span>
                                    </Link>
                                </li>
                            );
                        })}
                    </ul>
                </nav>

                <form
                    action="/profile/notifications"
                    method="get"
                    aria-label="알림 필터"
                    className="rounded-xl border border-slate-200 bg-white px-4 py-4 shadow-sm dark:border-slate-700 dark:bg-[#151E32]"
                >
                    <input type="hidden" name="type" value={data.filters.type} />
                    <input type="hidden" name="page" value="1" />
                    <input type="hidden" name="pageSize" value={String(data.filters.pageSize)} />
                    <div className="grid grid-cols-1 gap-2 md:grid-cols-4">
                        <select
                            name="read"
                            defaultValue={data.filters.read}
                            aria-label="읽음 상태 필터"
                            className="h-10 rounded-md border border-slate-300 bg-white px-3 text-sm dark:border-slate-600 dark:bg-slate-800"
                        >
                            <option value="all">전체 상태</option>
                            <option value="unread">읽지 않음만</option>
                        </select>

                        <select
                            name="sort"
                            defaultValue={data.filters.sort}
                            aria-label="정렬 기준"
                            className="h-10 rounded-md border border-slate-300 bg-white px-3 text-sm dark:border-slate-600 dark:bg-slate-800"
                        >
                            <option value="latest">최신순</option>
                            <option value="oldest">오래된순</option>
                        </select>

                        <input
                            type="search"
                            name="query"
                            defaultValue={data.filters.query}
                            placeholder="제목/내용 검색"
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
                        <p className="text-xs text-slate-500 dark:text-slate-400">전체 알림</p>
                        <p className="mt-1 text-2xl font-bold">
                            {viewState.summary.totalCount.toLocaleString('ko-KR')}건
                        </p>
                    </article>
                    <article className="rounded-xl border border-blue-200 bg-blue-50 p-4 shadow-sm dark:border-blue-900 dark:bg-blue-950/30">
                        <p className="text-xs text-blue-700 dark:text-blue-300">읽지 않음</p>
                        <p className="mt-1 text-2xl font-bold text-blue-700 dark:text-blue-300">
                            {viewState.summary.unreadCount.toLocaleString('ko-KR')}건
                        </p>
                    </article>
                    <article className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-700 dark:bg-[#151E32]">
                        <p className="text-xs text-slate-500 dark:text-slate-400">현재 필터 결과</p>
                        <p className="mt-1 text-2xl font-bold">{viewState.totalCount.toLocaleString('ko-KR')}건</p>
                    </article>
                </section>

                {hasExternalAddition ? (
                    <section
                        role="status"
                        aria-live="polite"
                        className="rounded-xl border border-blue-200 bg-blue-50 px-4 py-3 text-sm text-blue-800 dark:border-blue-900 dark:bg-blue-950/30 dark:text-blue-200"
                    >
                        다른 화면에서 새 알림이 도착했습니다.{' '}
                        <Link
                            href={buildListHref(data.filters, { page: 1 })}
                            className="font-semibold underline"
                        >
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
                        {data.error.code === 'NOTIFICATION_AUTH_REQUIRED' ? (
                            <Link
                                href="/login?returnTo=%2Fprofile%2Fnotifications"
                                className="mt-2 inline-flex h-8 items-center rounded-md bg-blue-600 px-3 text-xs font-semibold text-white hover:bg-blue-700"
                            >
                                로그인 이동
                            </Link>
                        ) : null}
                    </section>
                ) : null}

                {actionError ? (
                    <section
                        role="alert"
                        className="rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700 dark:border-rose-900 dark:bg-rose-950/40 dark:text-rose-300"
                    >
                        {actionError}
                    </section>
                ) : null}

                {selectedIds.length > 0 ? (
                    <section className="sticky bottom-4 z-20 rounded-xl border border-slate-300 bg-white px-4 py-3 shadow-lg dark:border-slate-600 dark:bg-slate-900">
                        <div className="flex flex-wrap items-center justify-between gap-2">
                            <p className="text-sm font-medium">{selectedIds.length}개 선택됨</p>
                            <div className="flex items-center gap-2">
                                <button
                                    type="button"
                                    disabled={pendingIds.length > 0 || pendingAllRead}
                                    onClick={() => void handleMarkRead(selectedIds)}
                                    className="inline-flex h-9 items-center rounded-md border border-slate-300 bg-white px-3 text-xs font-semibold text-slate-700 hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-60 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-100"
                                >
                                    읽음 처리
                                </button>
                                <button
                                    type="button"
                                    disabled={pendingIds.length > 0 || pendingAllRead}
                                    onClick={() => void handleDelete(selectedIds)}
                                    className="inline-flex h-9 items-center rounded-md bg-rose-600 px-3 text-xs font-semibold text-white hover:bg-rose-700 disabled:cursor-not-allowed disabled:opacity-60"
                                >
                                    삭제
                                </button>
                            </div>
                        </div>
                    </section>
                ) : null}

                <section className="rounded-xl border border-slate-200 bg-white shadow-sm dark:border-slate-700 dark:bg-[#151E32]">
                    {viewState.items.length === 0 ? (
                        <div className="px-6 py-20 text-center">
                            <p className="text-lg font-semibold">알림이 없습니다</p>
                            <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">
                                새로운 알림이 도착하면 여기에 표시됩니다.
                            </p>
                        </div>
                    ) : (
                        <>
                            <div className="border-b border-slate-200 px-4 py-3 dark:border-slate-700">
                                <label className="inline-flex items-center gap-2 text-sm text-slate-600 dark:text-slate-300">
                                    <input
                                        type="checkbox"
                                        checked={
                                            viewState.items.length > 0 &&
                                            viewState.items.every((item) => selectedIds.includes(item.id))
                                        }
                                        onChange={handleToggleSelectAllCurrentPage}
                                        className="h-4 w-4 rounded border-slate-300"
                                    />
                                    현재 페이지 전체 선택
                                </label>
                            </div>
                            <div className="space-y-3 p-4">
                                {viewState.items.map((item) => {
                                    const selected = selectedIds.includes(item.id);
                                    return (
                                        <article
                                            key={item.id}
                                            className={`rounded-lg border p-4 ${
                                                item.isRead
                                                    ? 'border-slate-200 bg-white dark:border-slate-700 dark:bg-slate-900'
                                                    : 'border-blue-200 bg-blue-50/60 dark:border-blue-900 dark:bg-blue-950/20'
                                            }`}
                                        >
                                            <div className="flex items-start gap-3">
                                                <input
                                                    type="checkbox"
                                                    checked={selected}
                                                    onChange={(event) => {
                                                        if (event.target.checked) {
                                                            setSelectedIds((prev) => [...new Set([...prev, item.id])]);
                                                        } else {
                                                            setSelectedIds((prev) =>
                                                                prev.filter((id) => id !== item.id)
                                                            );
                                                        }
                                                    }}
                                                    className="mt-1 h-4 w-4 rounded border-slate-300"
                                                    aria-label="알림 선택"
                                                />

                                                <button
                                                    type="button"
                                                    onClick={() => handleOpenDetail(item)}
                                                    className="min-w-0 flex-1 text-left"
                                                >
                                                    <div className="flex flex-wrap items-center gap-2">
                                                        {!item.isRead ? (
                                                            <span
                                                                aria-label="읽지 않음"
                                                                className="inline-flex h-2 w-2 rounded-full bg-blue-600"
                                                            />
                                                        ) : null}
                                                        <span
                                                            className={`inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-[11px] font-semibold ${getTypeBadgeClass(item.type)}`}
                                                        >
                                                            <span
                                                                className={`h-1.5 w-1.5 rounded-full ${getTypeDotClass(item.type)}`}
                                                            />
                                                            {getTypeLabel(item.type)}
                                                        </span>
                                                        {item.type === 'deadline' && !item.isRead ? (
                                                            <span className="inline-flex items-center rounded-full border border-rose-300 bg-rose-100 px-2 py-0.5 text-[11px] font-semibold text-rose-700 dark:border-rose-800 dark:bg-rose-950/40 dark:text-rose-300">
                                                                긴급
                                                            </span>
                                                        ) : null}
                                                        <span className="ml-auto text-xs text-slate-500 dark:text-slate-400">
                                                            {item.relativeTimeLabel}
                                                        </span>
                                                    </div>
                                                    <p className="mt-1 line-clamp-1 text-base font-semibold text-slate-900 dark:text-slate-100">
                                                        {item.title}
                                                    </p>
                                                    <p className="mt-1 line-clamp-2 text-sm text-slate-600 dark:text-slate-300">
                                                        {item.body}
                                                    </p>
                                                </button>

                                                <div className="flex items-center gap-2">
                                                    {!item.isRead ? (
                                                        <button
                                                            type="button"
                                                            onClick={() => void handleMarkRead([item.id])}
                                                            disabled={isPending(item.id) || pendingAllRead}
                                                            className="inline-flex h-8 items-center rounded-md border border-slate-300 bg-white px-3 text-xs font-semibold text-slate-700 hover:bg-slate-100 disabled:cursor-not-allowed disabled:opacity-60 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-100"
                                                        >
                                                            읽음
                                                        </button>
                                                    ) : null}
                                                    <button
                                                        type="button"
                                                        onClick={() => void handleDelete([item.id])}
                                                        disabled={isPending(item.id) || pendingAllRead}
                                                        className="inline-flex h-8 items-center rounded-md border border-rose-300 bg-white px-3 text-xs font-semibold text-rose-700 hover:bg-rose-50 disabled:cursor-not-allowed disabled:opacity-60 dark:border-rose-700 dark:bg-slate-900 dark:text-rose-300"
                                                    >
                                                        {isPending(item.id) ? '처리중...' : '삭제'}
                                                    </button>
                                                </div>
                                            </div>

                                            <div className="mt-2 flex flex-wrap items-center gap-2 text-xs">
                                                <span className="text-slate-500 dark:text-slate-400">
                                                    수신 시각 {item.createdAtLabel}
                                                </span>
                                                {item.actionHref ? (
                                                    <Link
                                                        href={item.actionHref}
                                                        className="font-semibold text-blue-700 hover:underline dark:text-blue-300"
                                                    >
                                                        {item.actionLabel ?? '상세보기'}
                                                    </Link>
                                                ) : null}
                                            </div>
                                        </article>
                                    );
                                })}
                            </div>
                        </>
                    )}
                </section>

                {renderPagination(data.filters, currentPage, currentTotalPages)}
            </div>

            {activeItem ? (
                <div className="fixed inset-0 z-30 flex items-center justify-center bg-black/45 p-4">
                    <div
                        role="dialog"
                        aria-modal="true"
                        aria-label="알림 상세"
                        className="max-h-[85vh] w-full max-w-2xl overflow-hidden rounded-xl border border-slate-200 bg-white shadow-xl dark:border-slate-700 dark:bg-slate-900"
                    >
                        <header className="flex items-start justify-between border-b border-slate-200 px-5 py-4 dark:border-slate-700">
                            <div className="pr-4">
                                <p className="text-xs text-slate-500 dark:text-slate-400">{getTypeLabel(activeItem.type)}</p>
                                <h2 className="mt-1 text-lg font-semibold text-slate-900 dark:text-slate-100">
                                    {activeItem.title}
                                </h2>
                                <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
                                    {activeItem.createdAtLabel}
                                </p>
                            </div>
                            <button
                                type="button"
                                onClick={() => setActiveItem(null)}
                                className="inline-flex h-8 w-8 items-center justify-center rounded-md border border-slate-300 text-sm text-slate-700 hover:bg-slate-100 dark:border-slate-600 dark:text-slate-100 dark:hover:bg-slate-800"
                                aria-label="닫기"
                            >
                                ×
                            </button>
                        </header>
                        <div className="max-h-[55vh] overflow-y-auto px-5 py-4 text-sm leading-7 text-slate-700 dark:text-slate-200">
                            {activeItem.body}
                        </div>
                        <footer className="flex flex-wrap items-center justify-between gap-2 border-t border-slate-200 px-5 py-4 dark:border-slate-700">
                            <button
                                type="button"
                                onClick={() => void handleDelete([activeItem.id])}
                                disabled={isPending(activeItem.id) || pendingAllRead}
                                className="inline-flex h-9 items-center rounded-md border border-rose-300 bg-white px-3 text-xs font-semibold text-rose-700 hover:bg-rose-50 disabled:cursor-not-allowed disabled:opacity-60 dark:border-rose-700 dark:bg-slate-900 dark:text-rose-300"
                            >
                                삭제
                            </button>
                            <div className="flex items-center gap-2">
                                {activeItem.actionHref ? (
                                    <Link
                                        href={activeItem.actionHref}
                                        onClick={() => setActiveItem(null)}
                                        className="inline-flex h-9 items-center rounded-md bg-blue-600 px-3 text-xs font-semibold text-white hover:bg-blue-700"
                                    >
                                        {activeItem.actionLabel ?? '상세보기'}
                                    </Link>
                                ) : null}
                                <button
                                    type="button"
                                    onClick={() => setActiveItem(null)}
                                    className="inline-flex h-9 items-center rounded-md border border-slate-300 bg-white px-3 text-xs font-semibold text-slate-700 hover:bg-slate-100 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-100 dark:hover:bg-slate-700"
                                >
                                    닫기
                                </button>
                            </div>
                        </footer>
                    </div>
                </div>
            ) : null}
        </main>
    );
}
