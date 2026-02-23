import Link from 'next/link';
import { NoticeAttachmentsCard } from './notice-attachments-card';
import { NoticeDeadlineCard } from './notice-deadline-card';
import { NoticeHeader } from './notice-header';
import { NoticeMainInfoCard } from './notice-main-info-card';
import { NoticePremiumCards } from './notice-premium-cards';
import { NoticeQuickActionsCard } from './notice-quick-actions-card';
import { NoticeSimilarListCard } from './notice-similar-list-card';
import { NoticeStatePreviewDev } from './notice-state-preview-dev';
import { NoticeTabsContentCard } from './notice-tabs-content-card';
import { NoticeTimelineCard } from './notice-timeline-card';
import { NoticeTitleSection } from './notice-title-section';
import type { NoticeDetailPageData } from '@/lib/bid/notice-detail-types';

interface NoticeDetailPageProps {
    noticeId: string;
    data: NoticeDetailPageData;
    showPrintPreview?: boolean;
}

export function NoticeDetailPage({ noticeId, data, showPrintPreview = false }: NoticeDetailPageProps) {
    const { notice, attachments, similarNotices, premiumPreview, error, isBookmarked } = data;

    return (
        <main className="notice-print-root min-h-screen bg-slate-50 px-4 py-6 text-slate-900 md:px-6 lg:px-8 dark:bg-[#0B1121] dark:text-slate-100">
            <div className="mx-auto w-full max-w-[1440px]">
                <div className="grid grid-cols-1 gap-6 xl:grid-cols-[240px_1fr]">
                    <aside
                        aria-label="주요 메뉴"
                        className="print-hidden hidden rounded-xl border border-slate-200 bg-white p-4 shadow-sm xl:block dark:border-slate-700 dark:bg-[#151E32]"
                    >
                        <p className="mb-4 text-xl font-bold text-slate-900 dark:text-slate-100">PlayBid</p>
                        <nav className="space-y-1 text-sm">
                            <Link
                                className="block rounded-md px-3 py-2 text-slate-600 hover:bg-slate-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-600 dark:text-slate-300 dark:hover:bg-slate-700 dark:focus-visible:ring-blue-400"
                                href="/dashboard"
                            >
                                대시보드
                            </Link>
                            <Link
                                className="block rounded-md bg-blue-50 px-3 py-2 font-semibold text-blue-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-600 dark:bg-blue-900/40 dark:text-blue-300 dark:focus-visible:ring-blue-400"
                                href="/bid_notice"
                            >
                                입찰공고
                            </Link>
                            <Link
                                className="block rounded-md px-3 py-2 text-slate-600 hover:bg-slate-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-600 dark:text-slate-300 dark:hover:bg-slate-700 dark:focus-visible:ring-blue-400"
                                href="/bid_opening"
                            >
                                개찰결과
                            </Link>
                            <Link
                                className="block rounded-md px-3 py-2 text-slate-600 hover:bg-slate-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-600 dark:text-slate-300 dark:hover:bg-slate-700 dark:focus-visible:ring-blue-400"
                                href="/bid_history"
                            >
                                입찰이력
                            </Link>
                        </nav>
                    </aside>

                    <div className="space-y-6">
                        {error && (
                            <div
                                role="alert"
                                className="rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700 dark:border-rose-800 dark:bg-rose-900/20 dark:text-rose-300"
                            >
                                <p className="font-semibold">{error.message}</p>
                                <p className="mt-1">요청 ID: {error.requestId}</p>
                                <p className="mt-1 text-rose-600 dark:text-rose-400">{error.suggestion}</p>
                                <Link
                                    href={`/bid_notice/detail/${noticeId}`}
                                    className="mt-2 inline-flex h-8 items-center rounded-md border border-rose-300 bg-white px-3 text-xs font-semibold text-rose-700 hover:bg-rose-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-rose-500 dark:border-rose-700 dark:bg-transparent dark:text-rose-300 dark:hover:bg-rose-900/20 dark:focus-visible:ring-rose-400"
                                >
                                    다시 시도
                                </Link>
                            </div>
                        )}

                        <NoticeHeader
                            noticeId={noticeId}
                            noticeNumber={notice.noticeNumber}
                            title={notice.title}
                            initialBookmarked={isBookmarked}
                        />

                        <NoticeTitleSection notice={notice} />

                        <div className="grid grid-cols-1 gap-4 lg:grid-cols-[minmax(0,2fr)_minmax(300px,1fr)]">
                            <div className="space-y-4">
                                <NoticeMainInfoCard notice={notice} />
                                <NoticeTimelineCard timeline={notice.timeline} />
                                <NoticeTabsContentCard sections={notice.detailSections} />
                                <NoticeAttachmentsCard attachments={attachments} />
                                <NoticeSimilarListCard notices={similarNotices} />
                            </div>

                            <div className="print-hidden space-y-4">
                                <NoticeQuickActionsCard
                                    noticeId={noticeId}
                                    sourceUrl={notice.sourceUrl}
                                    qualificationRequired={notice.qualificationRequired}
                                />
                                <NoticeDeadlineCard
                                    bidDeadlineAtIso={notice.bidDeadlineAtIso}
                                    bidDeadlineAtLabel={notice.bidDeadlineAt}
                                />
                                <NoticePremiumCards stats={premiumPreview} />
                                {process.env.NODE_ENV !== 'production' ? <NoticeStatePreviewDev /> : null}
                            </div>
                        </div>

                        <section
                            id="print-preview"
                            className={`${showPrintPreview ? 'block' : 'hidden'} print-only rounded-xl border border-slate-200 bg-white p-6 shadow-sm`}
                        >
                            <h2 className="mb-2 text-2xl font-bold text-slate-900">인쇄 미리보기 (A4)</h2>
                            <p className="mb-6 text-sm text-slate-600">
                                인쇄 모드에서는 북마크/공유/CTA를 숨기고 본문 중심으로 재배치합니다.
                            </p>
                            <div className="space-y-4">
                                <div className="rounded-lg border border-slate-200 p-4">
                                    <h3 className="mb-2 text-lg font-semibold">주요 정보 / 일정</h3>
                                    <p className="text-sm text-slate-700">
                                        공고번호 {notice.noticeNumber} · 게시일 {notice.publishedAt} · 입찰마감 {notice.bidDeadlineAt}
                                    </p>
                                </div>
                                <div className="rounded-lg border border-slate-200 p-4">
                                    <h3 className="mb-2 text-lg font-semibold">상세 내용</h3>
                                    <p className="text-sm leading-relaxed text-slate-700">{notice.detailSections.overview}</p>
                                </div>
                                <div className="rounded-lg border border-slate-200 p-4">
                                    <h3 className="mb-2 text-lg font-semibold">첨부파일</h3>
                                    <ul className="list-inside list-disc text-sm text-slate-700">
                                        {attachments.map((attachment) => (
                                            <li key={attachment.id}>
                                                {attachment.name} ({attachment.sizeLabel})
                                            </li>
                                        ))}
                                    </ul>
                                </div>
                            </div>
                        </section>
                    </div>
                </div>
            </div>
        </main>
    );
}
