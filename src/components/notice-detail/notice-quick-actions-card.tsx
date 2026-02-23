'use client';

import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { useAuthAction } from '@/hooks/use-auth-action';

interface NoticeQuickActionsCardProps {
    noticeId: string;
    sourceUrl: string;
    qualificationRequired: boolean;
}

export function NoticeQuickActionsCard({
    noticeId,
    sourceUrl,
    qualificationRequired,
}: NoticeQuickActionsCardProps) {
    const returnPath = `/bid_notice/detail/${noticeId}`;
    const { runWithAuth } = useAuthAction();
    const router = useRouter();
    const [pendingAction, setPendingAction] = useState<'mockBid' | 'qualification' | null>(null);
    const isPending = pendingAction !== null;

    const handleMockBid = async () => {
        await runWithAuth(async () => {
            setPendingAction('mockBid');
            router.push(`/bid_history?from=mock-bid&noticeId=${encodeURIComponent(noticeId)}`);
        });
    };

    const handleQualification = async () => {
        await runWithAuth(async () => {
            setPendingAction('qualification');
            router.push(`/qualification-calculator?noticeId=${encodeURIComponent(noticeId)}`);
        });
    };

    return (
        <section className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-700 dark:bg-[#151E32]">
            <h2 className="mb-4 text-xl font-semibold text-slate-900 dark:text-slate-100">빠른 액션</h2>
            <div className="space-y-2">
                <button
                    type="button"
                    onClick={handleMockBid}
                    disabled={isPending}
                    aria-busy={pendingAction === 'mockBid'}
                    className="inline-flex h-12 w-full items-center justify-center rounded-lg bg-blue-600 text-sm font-semibold text-white hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-70 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-600 focus-visible:ring-offset-2 focus-visible:ring-offset-white dark:focus-visible:ring-blue-400 dark:focus-visible:ring-offset-[#151E32]"
                >
                    {pendingAction === 'mockBid' ? '이동중...' : '모의입찰 시작하기'}
                </button>
                <a
                    href={sourceUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex h-10 w-full items-center justify-center rounded-lg border border-slate-300 bg-white text-sm font-semibold text-slate-700 hover:bg-slate-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-600 focus-visible:ring-offset-2 focus-visible:ring-offset-white dark:border-slate-600 dark:bg-slate-700 dark:text-slate-100 dark:hover:bg-slate-600 dark:focus-visible:ring-blue-400 dark:focus-visible:ring-offset-[#151E32]"
                >
                    원문 보기
                </a>
                {qualificationRequired && (
                    <button
                        type="button"
                        onClick={handleQualification}
                        disabled={isPending}
                        aria-busy={pendingAction === 'qualification'}
                        className="inline-flex h-10 w-full items-center justify-center rounded-lg border border-slate-300 bg-white text-sm font-semibold text-slate-700 hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-70 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-600 focus-visible:ring-offset-2 focus-visible:ring-offset-white dark:border-slate-600 dark:bg-slate-700 dark:text-slate-100 dark:hover:bg-slate-600 dark:focus-visible:ring-blue-400 dark:focus-visible:ring-offset-[#151E32]"
                    >
                        {pendingAction === 'qualification' ? '이동중...' : '적격심사 계산'}
                    </button>
                )}
            </div>
            <p className="mt-3 text-xs text-slate-500 dark:text-slate-400">
                로그인 후 이용 가능 · 미로그인 클릭 시 <span className="font-semibold">/login?returnTo={returnPath}</span>
            </p>
        </section>
    );
}
