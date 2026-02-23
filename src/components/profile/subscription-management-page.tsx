import Link from 'next/link';
import type { ProfileOverviewData, SubscriptionStatus } from '@/lib/bid/profile-types';

interface SubscriptionManagementPageProps {
    data: ProfileOverviewData;
}

function getStatusClassName(status: SubscriptionStatus): string {
    if (status === 'active') {
        return 'border-emerald-300 bg-emerald-100 text-emerald-700 dark:border-emerald-800 dark:bg-emerald-950/40 dark:text-emerald-300';
    }
    if (status === 'trial') {
        return 'border-blue-300 bg-blue-100 text-blue-700 dark:border-blue-800 dark:bg-blue-950/40 dark:text-blue-300';
    }
    if (status === 'expired') {
        return 'border-slate-300 bg-slate-200 text-slate-700 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300';
    }
    return 'border-amber-300 bg-amber-100 text-amber-700 dark:border-amber-800 dark:bg-amber-950/40 dark:text-amber-300';
}

function getFeatureItems(planKey: string): string[] {
    if (planKey === 'premium') {
        return [
            'AI 분석 보고서 무제한',
            '참가업체 통계 무제한',
            '유사 사정율 분석',
            '적격심사 계산기',
            '우선 고객 지원',
            '데이터 내보내기',
        ];
    }

    if (planKey === 'basic') {
        return ['AI 분석 보고서 월간 제공', '참가업체 통계 조회', '북마크/이력 관리', '기본 고객 지원'];
    }

    if (planKey === 'trial') {
        return ['프리미엄 기능 체험', '기간 내 주요 기능 접근', '체험 종료 전 알림'];
    }

    return ['입찰공고/개찰결과 열람', '북마크 및 이력 기본 기능'];
}

export function SubscriptionManagementPage({ data }: SubscriptionManagementPageProps) {
    const { subscription, error } = data;
    const featureItems = getFeatureItems(subscription.planKey);

    return (
        <main className="min-h-screen bg-slate-50 px-4 py-6 text-slate-900 md:px-6 lg:px-8 dark:bg-[#0B1121] dark:text-slate-100">
            <div className="mx-auto max-w-4xl space-y-4">
                <header className="rounded-xl border border-slate-200 bg-white px-6 py-5 shadow-sm dark:border-slate-700 dark:bg-[#151E32]">
                    <div className="mb-1 text-sm text-slate-500 dark:text-slate-400">홈 &gt; 프로필 &gt; 구독 관리</div>
                    <h1 className="text-2xl font-bold">구독 관리</h1>
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
                    <div className="flex flex-wrap items-center justify-between gap-2">
                        <h2 className="text-xl font-semibold">현재 플랜</h2>
                        <span
                            className={`inline-flex items-center rounded-full border px-2.5 py-1 text-xs font-semibold ${getStatusClassName(subscription.status)}`}
                        >
                            {subscription.statusLabel}
                        </span>
                    </div>

                    <p className="mt-4 text-3xl font-bold text-blue-700 dark:text-blue-300">
                        {subscription.planLabel}
                    </p>

                    <div className="mt-4 grid grid-cols-1 gap-2 text-sm md:grid-cols-3">
                        <div className="rounded-md border border-slate-200 bg-slate-50 px-3 py-2 dark:border-slate-700 dark:bg-slate-900">
                            <p className="text-xs text-slate-500 dark:text-slate-400">결제 방식</p>
                            <p className="font-semibold">{subscription.paymentMethodLabel}</p>
                        </div>
                        <div className="rounded-md border border-slate-200 bg-slate-50 px-3 py-2 dark:border-slate-700 dark:bg-slate-900">
                            <p className="text-xs text-slate-500 dark:text-slate-400">만료일</p>
                            <p className="font-semibold">{subscription.expiresAtLabel ?? '-'}</p>
                        </div>
                        <div className="rounded-md border border-slate-200 bg-slate-50 px-3 py-2 dark:border-slate-700 dark:bg-slate-900">
                            <p className="text-xs text-slate-500 dark:text-slate-400">남은 기간</p>
                            <p className="font-semibold">
                                {subscription.daysRemaining === null
                                    ? '-'
                                    : `${subscription.daysRemaining.toLocaleString('ko-KR')}일`}
                            </p>
                        </div>
                    </div>

                    <h3 className="mt-6 text-base font-semibold">플랜 포함 기능</h3>
                    <ul className="mt-2 grid grid-cols-1 gap-2 md:grid-cols-2">
                        {featureItems.map((item) => (
                            <li
                                key={item}
                                className="rounded-md border border-slate-200 bg-slate-50 px-3 py-2 text-sm dark:border-slate-700 dark:bg-slate-900"
                            >
                                ✓ {item}
                            </li>
                        ))}
                    </ul>

                    <div className="mt-6 flex flex-wrap gap-2">
                        <Link
                            href="/profile/payment"
                            className="inline-flex h-10 items-center rounded-md bg-blue-600 px-4 text-sm font-semibold text-white hover:bg-blue-700"
                        >
                            결제 관리
                        </Link>
                        <Link
                            href="/profile"
                            className="inline-flex h-10 items-center rounded-md border border-slate-300 bg-white px-4 text-sm font-semibold text-slate-700 hover:bg-slate-50 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-100 dark:hover:bg-slate-700"
                        >
                            프로필로 돌아가기
                        </Link>
                    </div>
                </section>
            </div>
        </main>
    );
}
