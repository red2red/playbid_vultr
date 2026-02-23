import type { NoticeTimelineItem } from '@/lib/bid/notice-detail-types';

interface NoticeTimelineCardProps {
    timeline: NoticeTimelineItem[];
}

function getTimelineDotClass(status: NoticeTimelineItem['status']): string {
    if (status === 'completed') {
        return 'bg-emerald-500';
    }
    if (status === 'current') {
        return 'bg-blue-600 ring-4 ring-blue-100';
    }
    return 'bg-slate-300';
}

export function NoticeTimelineCard({ timeline }: NoticeTimelineCardProps) {
    return (
        <section className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-700 dark:bg-[#151E32]">
            <h2 className="mb-4 text-xl font-semibold text-slate-900 dark:text-slate-100">일정</h2>
            <ol className="space-y-3">
                {timeline.map((item) => (
                    <li key={item.key} className="flex items-start gap-3">
                        <span className={`mt-1 inline-flex h-3 w-3 rounded-full ${getTimelineDotClass(item.status)}`} />
                        <div>
                            <p className="text-sm font-semibold text-slate-800 dark:text-slate-200">{item.label}</p>
                            <p className="text-xs text-slate-500 dark:text-slate-400">{item.dateTime}</p>
                        </div>
                    </li>
                ))}
            </ol>
        </section>
    );
}
