import type { NoticeDetail } from '@/lib/bid/notice-detail-types';

interface NoticeMainInfoCardProps {
    notice: NoticeDetail;
}

function formatMoney(value: number): string {
    return `${new Intl.NumberFormat('ko-KR').format(value)}원`;
}

export function NoticeMainInfoCard({ notice }: NoticeMainInfoCardProps) {
    const items = [
        ['예산금액', formatMoney(notice.budget)],
        ['추정가격', formatMoney(notice.estimatedPrice)],
        ['입찰방식', notice.bidMethod],
        ['계약방법', notice.contractMethod],
        ['입찰시작', notice.bidStartAt],
        ['입찰마감', notice.bidDeadlineAt],
        ['개찰일시', notice.openingAt],
        ['참가자격', notice.qualificationSummary],
    ] as const;

    return (
        <section className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-700 dark:bg-[#151E32]">
            <h2 className="mb-4 text-xl font-semibold text-slate-900 dark:text-slate-100">주요 정보</h2>
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                {items.map(([label, value]) => (
                    <div key={label}>
                        <p className="mb-1 text-sm text-slate-500 dark:text-slate-400">{label}</p>
                        <p className="text-sm font-semibold text-slate-800 dark:text-slate-200">{value}</p>
                    </div>
                ))}
            </div>
        </section>
    );
}
