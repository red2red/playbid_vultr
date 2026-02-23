import Link from 'next/link';
import { getCategoryLabel } from '@/lib/bid/category-normalize';
import type { SimilarNotice } from '@/lib/bid/notice-detail-types';

interface NoticeSimilarListCardProps {
    notices: SimilarNotice[];
}

function getStatusClass(status: SimilarNotice['status']): string {
    if (status === 'open') {
        return 'bg-emerald-100 text-emerald-700';
    }
    if (status === 'closing_soon') {
        return 'bg-amber-100 text-amber-700';
    }
    return 'bg-slate-200 text-slate-600';
}

export function NoticeSimilarListCard({ notices }: NoticeSimilarListCardProps) {
    return (
        <section className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-700 dark:bg-[#151E32]">
            <h2 className="mb-4 text-xl font-semibold text-slate-900 dark:text-slate-100">유사 공고</h2>
            {notices.length === 0 ? (
                <div className="rounded-lg border border-dashed border-slate-300 bg-slate-50 p-4 text-sm text-slate-500 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-400">
                    조건에 맞는 유사 공고가 없습니다. 필터를 조정하거나 목록으로 이동해 새 공고를 확인해 주세요.
                </div>
            ) : (
                <div className="flex gap-3 overflow-x-auto pb-2">
                    {notices.map((notice) => (
                        <Link
                            key={notice.id}
                            href={`/bid_notice/detail/${notice.id}`}
                            aria-label={`유사 공고 상세 보기: ${notice.title}`}
                            className="min-w-64 rounded-lg border border-slate-200 bg-slate-50 p-3 hover:border-blue-300 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-600 focus-visible:ring-offset-2 focus-visible:ring-offset-white dark:border-slate-700 dark:bg-slate-800 dark:focus-visible:ring-blue-400 dark:focus-visible:ring-offset-[#151E32]"
                        >
                            <div className="mb-2 flex items-center justify-between gap-2">
                                <span className="text-xs font-semibold text-blue-700">{notice.organization}</span>
                                <span className={`rounded-full px-2 py-1 text-[11px] font-semibold ${getStatusClass(notice.status)}`}>
                                    {notice.status === 'open'
                                        ? '진행중'
                                        : notice.status === 'closing_soon'
                                          ? '마감임박'
                                          : '마감'}
                                </span>
                            </div>
                            <p className="mb-2 line-clamp-2 text-sm font-semibold text-slate-800 dark:text-slate-200">{notice.title}</p>
                            <p className="text-xs text-slate-500 dark:text-slate-400">{notice.budgetLabel}</p>
                            <p className="text-xs text-slate-500 dark:text-slate-400">마감: {notice.deadlineAt}</p>
                            <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">유형: {getCategoryLabel(notice.category)}</p>
                        </Link>
                    ))}
                </div>
            )}
        </section>
    );
}
