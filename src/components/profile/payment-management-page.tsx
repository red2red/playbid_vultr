import Link from 'next/link';
import type { PointTransactionItem, ProfileOverviewData } from '@/lib/bid/profile-types';

interface PaymentManagementPageProps {
    data: ProfileOverviewData;
}

function getAmountClassName(item: PointTransactionItem): string {
    if (item.amount > 0) {
        return 'text-emerald-600 dark:text-emerald-400';
    }

    if (item.amount < 0) {
        return 'text-rose-600 dark:text-rose-400';
    }

    return 'text-slate-600 dark:text-slate-300';
}

export function PaymentManagementPage({ data }: PaymentManagementPageProps) {
    const { subscription, points, error } = data;

    return (
        <main className="min-h-screen bg-slate-50 px-4 py-6 text-slate-900 md:px-6 lg:px-8 dark:bg-[#0B1121] dark:text-slate-100">
            <div className="mx-auto max-w-4xl space-y-4">
                <header className="rounded-xl border border-slate-200 bg-white px-6 py-5 shadow-sm dark:border-slate-700 dark:bg-[#151E32]">
                    <div className="mb-1 text-sm text-slate-500 dark:text-slate-400">홈 &gt; 프로필 &gt; 결제 관리</div>
                    <h1 className="text-2xl font-bold">결제 관리</h1>
                </header>

                {error ? (
                    <section
                        role="alert"
                        className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800 dark:border-amber-900 dark:bg-amber-950/40 dark:text-amber-200"
                    >
                        <p className="font-semibold">{error.message}</p>
                        <p className="mt-1 text-xs">요청 ID: {error.requestId}</p>
                        <p className="mt-1 text-xs">{error.suggestion}</p>
                    </section>
                ) : null}

                <section className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-700 dark:bg-[#151E32]">
                    <h2 className="text-lg font-semibold">현재 결제 수단</h2>
                    <div className="mt-3 rounded-lg border border-slate-200 bg-slate-50 px-4 py-3 dark:border-slate-700 dark:bg-slate-900">
                        <p className="text-sm text-slate-500 dark:text-slate-400">결제 방식</p>
                        <p className="mt-1 text-lg font-semibold">{subscription.paymentMethodLabel}</p>
                    </div>

                    <div className="mt-4 rounded-lg border border-slate-200 bg-slate-50 px-4 py-3 dark:border-slate-700 dark:bg-slate-900">
                        <p className="text-sm text-slate-500 dark:text-slate-400">현재 포인트 잔액</p>
                        <p className="mt-1 text-2xl font-bold text-amber-600 dark:text-amber-400">{points.balanceLabel}</p>
                    </div>

                    <div className="mt-4 flex flex-wrap gap-2">
                        <Link
                            href="/point-history"
                            className="inline-flex h-10 items-center rounded-md border border-slate-300 bg-white px-4 text-sm font-semibold text-slate-700 hover:bg-slate-50 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-100 dark:hover:bg-slate-700"
                        >
                            포인트 내역 확인
                        </Link>
                        <Link
                            href="/profile/subscription"
                            className="inline-flex h-10 items-center rounded-md bg-blue-600 px-4 text-sm font-semibold text-white hover:bg-blue-700"
                        >
                            구독 플랜 관리
                        </Link>
                    </div>
                </section>

                <section className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-700 dark:bg-[#151E32]">
                    <h2 className="text-lg font-semibold">최근 결제/포인트 거래</h2>

                    {points.recentTransactions.length === 0 ? (
                        <p className="mt-3 text-sm text-slate-500 dark:text-slate-400">
                            최근 결제/포인트 거래 내역이 없습니다.
                        </p>
                    ) : (
                        <div className="mt-3 divide-y divide-slate-200 rounded-lg border border-slate-200 dark:divide-slate-700 dark:border-slate-700">
                            {points.recentTransactions.map((item) => (
                                <div key={item.id} className="grid grid-cols-[1fr_auto] gap-2 px-4 py-3 text-sm">
                                    <div>
                                        <p className="font-medium">{item.description}</p>
                                        <p className="text-xs text-slate-500 dark:text-slate-400">
                                            {item.typeLabel} · {item.createdAtLabel}
                                        </p>
                                    </div>
                                    <p className={`self-center font-semibold ${getAmountClassName(item)}`}>
                                        {item.amountLabel}
                                    </p>
                                </div>
                            ))}
                        </div>
                    )}
                </section>
            </div>
        </main>
    );
}
