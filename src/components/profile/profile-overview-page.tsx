import Link from 'next/link';
import { NotificationPreferencesCard } from './notification-preferences-card';
import type { PointTransactionItem, ProfileOverviewData, SubscriptionStatus } from '@/lib/bid/profile-types';

interface ProfileOverviewPageProps {
    data: ProfileOverviewData;
}

function getInitials(name: string): string {
    const cleaned = name.trim();
    if (!cleaned) {
        return 'U';
    }

    const words = cleaned.split(/\s+/).filter(Boolean);
    if (words.length === 1) {
        return words[0].slice(0, 2).toUpperCase();
    }

    return `${words[0][0] ?? ''}${words[1][0] ?? ''}`.toUpperCase();
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

function getAmountClassName(item: PointTransactionItem): string {
    if (item.amount > 0) {
        return 'text-emerald-600 dark:text-emerald-400';
    }

    if (item.amount < 0) {
        return 'text-rose-600 dark:text-rose-400';
    }

    return 'text-slate-600 dark:text-slate-300';
}

export function ProfileOverviewPage({ data }: ProfileOverviewPageProps) {
    const { profile, subscription, points, usageStats, error } = data;

    return (
        <main className="min-h-screen bg-slate-50 px-4 py-6 text-slate-900 md:px-6 lg:px-8 dark:bg-[#0B1121] dark:text-slate-100">
            <div className="mx-auto max-w-[1440px] space-y-4">
                <header className="rounded-xl border border-slate-200 bg-white px-6 py-5 shadow-sm dark:border-slate-700 dark:bg-[#151E32]">
                    <div className="mb-1 text-sm text-slate-500 dark:text-slate-400">홈 &gt; 프로필</div>
                    <h1 className="text-2xl font-bold">내 프로필</h1>
                </header>

                {error ? (
                    <section
                        role="alert"
                        className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800 dark:border-amber-900 dark:bg-amber-950/40 dark:text-amber-200"
                    >
                        <p className="font-semibold">{error.message}</p>
                        <p className="mt-1 text-xs">요청 ID: {error.requestId}</p>
                        <p className="mt-1 text-xs">{error.suggestion}</p>
                        {error.code === 'PROFILE_AUTH_REQUIRED' ? (
                            <Link
                                href="/login?returnTo=%2Fprofile"
                                className="mt-2 inline-flex h-8 items-center rounded-md bg-blue-600 px-3 text-xs font-semibold text-white hover:bg-blue-700"
                            >
                                로그인 이동
                            </Link>
                        ) : null}
                    </section>
                ) : null}

                <div className="grid grid-cols-1 gap-4 xl:grid-cols-[1.8fr_1fr]">
                    <div className="space-y-4">
                        <section className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-700 dark:bg-[#151E32]">
                            <div className="flex flex-col items-center text-center">
                                <div className="flex h-24 w-24 items-center justify-center rounded-full bg-blue-600 text-3xl font-bold text-white">
                                    {getInitials(profile.name)}
                                </div>
                                <h2 className="mt-4 text-2xl font-bold">{profile.name}</h2>
                                <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">{profile.email || '-'}</p>
                                <p className="mt-1 text-xs text-slate-400 dark:text-slate-500">
                                    가입일 {profile.joinedAtLabel}
                                </p>
                            </div>

                            <div className="mt-4 grid grid-cols-1 gap-2 text-sm md:grid-cols-2">
                                <div className="rounded-md border border-slate-200 bg-slate-50 px-3 py-2 dark:border-slate-700 dark:bg-slate-900">
                                    <p className="text-xs text-slate-500 dark:text-slate-400">닉네임</p>
                                    <p className="font-semibold">{profile.nickname ?? '-'}</p>
                                </div>
                                <div className="rounded-md border border-slate-200 bg-slate-50 px-3 py-2 dark:border-slate-700 dark:bg-slate-900">
                                    <p className="text-xs text-slate-500 dark:text-slate-400">회사</p>
                                    <p className="font-semibold">{profile.company ?? '-'}</p>
                                </div>
                                <div className="rounded-md border border-slate-200 bg-slate-50 px-3 py-2 dark:border-slate-700 dark:bg-slate-900">
                                    <p className="text-xs text-slate-500 dark:text-slate-400">직책</p>
                                    <p className="font-semibold">{profile.position ?? '-'}</p>
                                </div>
                                <div className="rounded-md border border-slate-200 bg-slate-50 px-3 py-2 dark:border-slate-700 dark:bg-slate-900">
                                    <p className="text-xs text-slate-500 dark:text-slate-400">전화번호</p>
                                    <p className="font-semibold">{profile.phone ?? '-'}</p>
                                </div>
                            </div>
                        </section>

                        <section className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-700 dark:bg-[#151E32]">
                            <div className="flex items-center justify-between">
                                <h2 className="text-lg font-semibold">구독 정보</h2>
                                <span
                                    className={`inline-flex items-center rounded-full border px-2.5 py-1 text-xs font-semibold ${getStatusClassName(subscription.status)}`}
                                >
                                    {subscription.statusLabel}
                                </span>
                            </div>

                            <p className="mt-3 text-2xl font-bold text-blue-700 dark:text-blue-300">
                                {subscription.planLabel}
                            </p>
                            <div className="mt-3 rounded-lg border border-slate-200 bg-slate-50 px-4 py-3 text-sm dark:border-slate-700 dark:bg-slate-900">
                                <p>
                                    <span className="text-slate-500 dark:text-slate-400">결제 방식:</span>{' '}
                                    <span className="font-semibold">{subscription.paymentMethodLabel}</span>
                                </p>
                                <p className="mt-1">
                                    <span className="text-slate-500 dark:text-slate-400">만료일:</span>{' '}
                                    <span className="font-semibold">{subscription.expiresAtLabel ?? '-'}</span>
                                </p>
                                <p className="mt-1">
                                    <span className="text-slate-500 dark:text-slate-400">남은 기간:</span>{' '}
                                    <span className="font-semibold">
                                        {subscription.daysRemaining === null
                                            ? '-'
                                            : `${subscription.daysRemaining.toLocaleString('ko-KR')}일`}
                                    </span>
                                </p>
                            </div>

                            <div className="mt-4 flex flex-wrap gap-2">
                                <Link
                                    href="/profile/subscription"
                                    className="inline-flex h-10 items-center rounded-md border border-slate-300 bg-white px-4 text-sm font-semibold text-slate-700 hover:bg-slate-50 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-100 dark:hover:bg-slate-700"
                                >
                                    구독 상세
                                </Link>
                                <Link
                                    href="/profile/payment"
                                    className="inline-flex h-10 items-center rounded-md bg-blue-600 px-4 text-sm font-semibold text-white hover:bg-blue-700"
                                >
                                    결제 관리
                                </Link>
                            </div>
                        </section>

                        <section className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-700 dark:bg-[#151E32]">
                            <div className="flex flex-wrap items-center justify-between gap-2">
                                <h2 className="text-lg font-semibold">포인트</h2>
                                <p className="text-2xl font-bold text-amber-600 dark:text-amber-400">{points.balanceLabel}</p>
                            </div>

                            {points.recentTransactions.length === 0 ? (
                                <p className="mt-4 text-sm text-slate-500 dark:text-slate-400">
                                    최근 포인트 거래 내역이 없습니다.
                                </p>
                            ) : (
                                <div className="mt-4 divide-y divide-slate-200 rounded-lg border border-slate-200 dark:divide-slate-700 dark:border-slate-700">
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

                            <div className="mt-4 flex flex-wrap gap-2">
                                <Link
                                    href="/profile/payment"
                                    className="inline-flex h-10 items-center rounded-md bg-amber-500 px-4 text-sm font-semibold text-white hover:bg-amber-600"
                                >
                                    포인트 충전
                                </Link>
                                <Link
                                    href="/point-history"
                                    className="inline-flex h-10 items-center rounded-md border border-slate-300 bg-white px-4 text-sm font-semibold text-slate-700 hover:bg-slate-50 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-100 dark:hover:bg-slate-700"
                                >
                                    전체 내역 보기
                                </Link>
                            </div>
                        </section>
                    </div>

                    <aside className="space-y-4">
                        <section className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-700 dark:bg-[#151E32]">
                            <h2 className="mb-3 text-base font-semibold">이용 통계</h2>
                            <div className="grid grid-cols-2 gap-2 text-sm">
                                <div className="rounded-md bg-slate-50 px-3 py-2 dark:bg-slate-900">
                                    <p className="text-xs text-slate-500 dark:text-slate-400">모의입찰</p>
                                    <p className="text-xl font-bold">{usageStats.mockBidCount.toLocaleString('ko-KR')}</p>
                                </div>
                                <div className="rounded-md bg-slate-50 px-3 py-2 dark:bg-slate-900">
                                    <p className="text-xs text-slate-500 dark:text-slate-400">북마크</p>
                                    <p className="text-xl font-bold">{usageStats.bookmarkCount.toLocaleString('ko-KR')}</p>
                                </div>
                                <div className="rounded-md bg-slate-50 px-3 py-2 dark:bg-slate-900">
                                    <p className="text-xs text-slate-500 dark:text-slate-400">미읽음 알림</p>
                                    <p className="text-xl font-bold text-blue-700 dark:text-blue-300">
                                        {usageStats.unreadNotificationCount.toLocaleString('ko-KR')}
                                    </p>
                                </div>
                                <div className="rounded-md bg-slate-50 px-3 py-2 dark:bg-slate-900">
                                    <p className="text-xs text-slate-500 dark:text-slate-400">프리미엄 사용</p>
                                    <p className="text-xl font-bold">
                                        {usageStats.premiumExecutionCount.toLocaleString('ko-KR')}
                                    </p>
                                </div>
                            </div>
                        </section>

                        <section className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-700 dark:bg-[#151E32]">
                            <h2 className="mb-3 text-base font-semibold">빠른 설정</h2>
                            <div className="space-y-2">
                                <Link
                                    href="/profile/notifications"
                                    className="flex h-10 items-center justify-between rounded-md bg-slate-100 px-3 text-sm font-medium text-slate-700 hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-100 dark:hover:bg-slate-700"
                                >
                                    <span>알림 센터</span>
                                    <span aria-hidden>›</span>
                                </Link>
                                <Link
                                    href="/profile/subscription"
                                    className="flex h-10 items-center justify-between rounded-md bg-slate-100 px-3 text-sm font-medium text-slate-700 hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-100 dark:hover:bg-slate-700"
                                >
                                    <span>구독 관리</span>
                                    <span aria-hidden>›</span>
                                </Link>
                                <Link
                                    href="/profile/payment"
                                    className="flex h-10 items-center justify-between rounded-md bg-slate-100 px-3 text-sm font-medium text-slate-700 hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-100 dark:hover:bg-slate-700"
                                >
                                    <span>결제 수단 관리</span>
                                    <span aria-hidden>›</span>
                                </Link>
                                <Link
                                    href="/point-history"
                                    className="flex h-10 items-center justify-between rounded-md bg-slate-100 px-3 text-sm font-medium text-slate-700 hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-100 dark:hover:bg-slate-700"
                                >
                                    <span>포인트 내역</span>
                                    <span aria-hidden>›</span>
                                </Link>
                            </div>
                        </section>

                        <NotificationPreferencesCard
                            initialPreferences={data.notificationPreferences}
                        />

                        <section className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-700 dark:bg-[#151E32]">
                            <h2 className="mb-3 text-base font-semibold">정책 문서</h2>
                            <div className="space-y-2 text-sm">
                                <Link href="/terms" className="block text-blue-700 hover:underline dark:text-blue-300">
                                    이용약관
                                </Link>
                                <Link href="/privacy" className="block text-blue-700 hover:underline dark:text-blue-300">
                                    개인정보처리방침
                                </Link>
                            </div>
                        </section>
                    </aside>
                </div>
            </div>
        </main>
    );
}
