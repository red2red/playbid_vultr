import type { NoticeAttachment } from '@/lib/bid/notice-detail-types';

interface NoticeAttachmentsCardProps {
    attachments: NoticeAttachment[];
}

export function NoticeAttachmentsCard({ attachments }: NoticeAttachmentsCardProps) {
    return (
        <section className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-700 dark:bg-[#151E32]">
            <h2 className="mb-4 text-xl font-semibold text-slate-900 dark:text-slate-100">첨부파일</h2>
            {attachments.length === 0 ? (
                <div className="rounded-lg border border-dashed border-slate-300 bg-slate-50 p-4 text-sm text-slate-500 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-400">
                    첨부파일이 없습니다. 원문 링크에서 최신 서류를 확인해 주세요.
                </div>
            ) : (
                <div className="space-y-2">
                    {attachments.map((attachment) => (
                        <div
                            key={attachment.id}
                            className="flex items-center justify-between rounded-lg border border-slate-200 bg-slate-50 p-3 dark:border-slate-700 dark:bg-slate-800"
                        >
                            <div>
                                <p className="text-sm font-semibold text-slate-800 dark:text-slate-200">{attachment.name}</p>
                                <p className="text-xs text-slate-500 dark:text-slate-400">{attachment.sizeLabel}</p>
                            </div>
                            <a
                                href={attachment.url}
                                aria-label={`${attachment.name} 다운로드`}
                                className="rounded-md border border-slate-300 bg-white px-3 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-600 focus-visible:ring-offset-2 focus-visible:ring-offset-white dark:border-slate-600 dark:bg-slate-700 dark:text-slate-100 dark:hover:bg-slate-600 dark:focus-visible:ring-blue-400 dark:focus-visible:ring-offset-[#151E32]"
                            >
                                다운로드
                            </a>
                        </div>
                    ))}
                </div>
            )}
        </section>
    );
}
