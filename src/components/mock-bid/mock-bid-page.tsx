import type { MockBidStep1Data } from '@/lib/bid/mock-bid-types';

interface MockBidPageProps {
    data: MockBidStep1Data;
}

export function MockBidPage({ data }: MockBidPageProps) {
    return (
        <main className="min-h-[calc(100vh-64px)] bg-slate-50 px-4 py-8 text-slate-900 dark:bg-[#0B1121] dark:text-slate-100">
            <div className="mx-auto max-w-4xl space-y-6">
                <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-700 dark:bg-[#151E32]">
                    <p className="text-sm text-slate-500 dark:text-slate-400">{data.notice.noticeNumber}</p>
                    <h1 className="mt-2 text-2xl font-semibold">{data.notice.title}</h1>
                    <p className="mt-3 text-sm text-slate-600 dark:text-slate-300">
                        기초금액 {data.notice.basicAmountLabel} · 예가범위 {data.notice.priceRangeLabel}
                    </p>
                </section>
            </div>
        </main>
    );
}
