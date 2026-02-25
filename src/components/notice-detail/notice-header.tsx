'use client';

import Link from 'next/link';
import { useEffect, useMemo, useState } from 'react';
import { buildLoginRedirectHref, useAuthAction } from '@/hooks/use-auth-action';
import { publishBookmarkChange, subscribeBookmarkChange } from '@/lib/bid/bookmark-client-sync';
import { AuthorizedFetchAuthError, authorizedFetch } from '@/lib/api/authorized-fetch';
import { createClient } from '@/lib/supabase/client';

interface NoticeHeaderProps {
    noticeId: string;
    noticeNumber: string;
    title: string;
    initialBookmarked: boolean;
}

export function NoticeHeader({
    noticeId,
    noticeNumber,
    title,
    initialBookmarked,
}: NoticeHeaderProps) {
    const shareLabel = encodeURIComponent(`[PlayBid] ${title}`);
    const returnPath = `/bid_notice/detail/${noticeId}`;
    const { runWithAuth } = useAuthAction();
    const supabase = useMemo(() => createClient(), []);
    const [isBookmarked, setIsBookmarked] = useState(initialBookmarked);
    const [bookmarkPending, setBookmarkPending] = useState(false);
    const [bookmarkError, setBookmarkError] = useState<string | null>(null);

    useEffect(() => {
        return subscribeBookmarkChange((payload) => {
            if (payload.noticeId !== noticeId) {
                return;
            }

            setIsBookmarked(payload.isBookmarked);
            setBookmarkError(null);
        });
    }, [noticeId]);

    const handleToggleBookmark = async () => {
        if (bookmarkPending) {
            return;
        }

        setBookmarkError(null);

        const authPassed = await runWithAuth(async () => {
            setBookmarkPending(true);
            const optimisticNext = !isBookmarked;
            setIsBookmarked(optimisticNext);

            try {
                const response = await authorizedFetch('/api/bookmarks/toggle', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({
                        noticeId,
                        noticeNumber,
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
                    setIsBookmarked(!optimisticNext);
                    setBookmarkError(payload.message ?? '북마크 처리에 실패했습니다.');
                    return;
                }

                const nextState = Boolean(payload.isBookmarked);
                setIsBookmarked(nextState);
                publishBookmarkChange(noticeId, nextState);
            } catch (error) {
                if (error instanceof AuthorizedFetchAuthError) {
                    return;
                }
                setIsBookmarked(!optimisticNext);
                setBookmarkError('네트워크 오류로 북마크를 저장하지 못했습니다.');
            } finally {
                setBookmarkPending(false);
            }
        });

        if (!authPassed) {
            setBookmarkPending(false);
        }
    };

    return (
        <header className="print-hidden rounded-xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-700 dark:bg-[#151E32]">
            <nav aria-label="페이지 경로" className="mb-4 text-sm text-slate-500 dark:text-slate-400">
                <Link
                    href="/"
                    className="rounded-sm hover:text-slate-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-600 dark:hover:text-slate-200 dark:focus-visible:ring-blue-400"
                >
                    홈
                </Link>{' '}
                {'>'}{' '}
                <Link
                    href="/bid_notice"
                    className="rounded-sm hover:text-slate-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-600 dark:hover:text-slate-200 dark:focus-visible:ring-blue-400"
                >
                    입찰공고
                </Link>{' '}
                {'>'} <span className="text-slate-700 dark:text-slate-200">{title}</span>
            </nav>

            <div className="flex flex-wrap items-center justify-between gap-3">
                <Link
                    href="/bid_notice"
                    className="inline-flex h-10 items-center rounded-lg bg-slate-100 px-4 text-sm font-semibold text-slate-700 hover:bg-slate-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-600 focus-visible:ring-offset-2 focus-visible:ring-offset-white dark:bg-slate-700 dark:text-slate-100 dark:hover:bg-slate-600 dark:focus-visible:ring-blue-400 dark:focus-visible:ring-offset-[#151E32]"
                >
                    목록으로
                </Link>

                <div className="flex items-center gap-2">
                    <button
                        type="button"
                        aria-label="북마크 토글"
                        onClick={handleToggleBookmark}
                        disabled={bookmarkPending}
                        className={`inline-flex h-10 items-center rounded-lg border px-4 text-sm font-semibold transition disabled:cursor-not-allowed disabled:opacity-70 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-600 focus-visible:ring-offset-2 focus-visible:ring-offset-white dark:focus-visible:ring-blue-400 dark:focus-visible:ring-offset-[#151E32] ${
                            isBookmarked
                                ? 'border-blue-300 bg-blue-50 text-blue-700 dark:border-blue-500 dark:bg-blue-900/40 dark:text-blue-300'
                                : 'border-slate-300 bg-white text-slate-700 hover:bg-slate-50 dark:border-slate-600 dark:bg-slate-700 dark:text-slate-100 dark:hover:bg-slate-600'
                        }`}
                    >
                        {bookmarkPending ? '처리중...' : isBookmarked ? '북마크됨' : '북마크'}
                    </button>
                    <a
                        aria-label="공유 메뉴 열기"
                        href={`mailto:?subject=${shareLabel}&body=${encodeURIComponent(returnPath)}`}
                        className="inline-flex h-10 items-center rounded-lg border border-slate-300 bg-white px-4 text-sm font-semibold text-slate-700 hover:bg-slate-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-600 focus-visible:ring-offset-2 focus-visible:ring-offset-white dark:border-slate-600 dark:bg-slate-700 dark:text-slate-100 dark:hover:bg-slate-600 dark:focus-visible:ring-blue-400 dark:focus-visible:ring-offset-[#151E32]"
                    >
                        공유
                    </a>
                    <Link
                        aria-label="인쇄 미리보기"
                        href={`/bid_notice/detail/${noticeId}?print=1#print-preview`}
                        className="inline-flex h-10 items-center rounded-lg border border-slate-300 bg-white px-4 text-sm font-semibold text-slate-700 hover:bg-slate-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-600 focus-visible:ring-offset-2 focus-visible:ring-offset-white dark:border-slate-600 dark:bg-slate-700 dark:text-slate-100 dark:hover:bg-slate-600 dark:focus-visible:ring-blue-400 dark:focus-visible:ring-offset-[#151E32]"
                    >
                        인쇄
                    </Link>
                </div>
            </div>
            {bookmarkError ? (
                <p
                    role="status"
                    aria-live="polite"
                    className="mt-3 text-xs font-semibold text-rose-600 dark:text-rose-400"
                >
                    {bookmarkError}
                </p>
            ) : null}
        </header>
    );
}
