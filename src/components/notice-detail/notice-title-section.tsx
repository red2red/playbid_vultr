import { getCategoryLabel } from '@/lib/bid/category-normalize';
import type { NoticeDetail } from '@/lib/bid/notice-detail-types';

interface NoticeTitleSectionProps {
    notice: NoticeDetail;
}

function getStatusView(status: NoticeDetail['status']) {
    if (status === 'open') {
        return { label: '진행중', className: 'bg-emerald-500 text-white' };
    }
    if (status === 'closing_soon') {
        return { label: '마감임박', className: 'bg-amber-500 text-white' };
    }
    return { label: '마감', className: 'bg-slate-400 text-white' };
}

export function NoticeTitleSection({ notice }: NoticeTitleSectionProps) {
    const statusView = getStatusView(notice.status);
    const categoryLabel = getCategoryLabel(notice.displayCategory);

    return (
        <section className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-700 dark:bg-[#151E32]">
            <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
                <div className="inline-flex items-center gap-2">
                    <span className="rounded-full bg-blue-600 px-3 py-1 text-xs font-semibold text-white">
                        {categoryLabel}
                    </span>
                    <span className={`rounded-full px-3 py-1 text-xs font-semibold ${statusView.className}`}>
                        {statusView.label}
                    </span>
                </div>

                <div className="rounded-full border border-slate-200 bg-slate-50 px-3 py-1 text-xs font-semibold text-slate-600 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-300">
                    표시 카테고리: {notice.displayCategory} · 쿼리 정규화: {notice.queryCategory}
                </div>
            </div>

            <h1 className="mb-2 break-words text-3xl font-bold tracking-tight text-slate-900 dark:text-slate-100">
                {notice.title}
            </h1>
            <p className="mb-3 text-lg font-semibold text-blue-700 dark:text-blue-300">{notice.organization}</p>

            <div className="text-sm text-slate-500 dark:text-slate-400">
                공고번호 {notice.noticeNumber}
                {notice.noticeOrder ? `-${notice.noticeOrder}` : ''} | 게시일 {notice.publishedAt} | 조회{' '}
                {notice.views.toLocaleString('ko-KR')}
            </div>
        </section>
    );
}
