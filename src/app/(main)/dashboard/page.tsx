import Link from 'next/link';
import { getDashboardData } from '@/lib/bid/dashboard-query';

const CARD_ITEMS = [
    {
        key: 'closingTodayCount',
        title: '오늘 마감 공고',
        description: '오늘 마감 예정인 입찰공고',
        href: '/bid_notice',
        accentClassName: 'text-indigo-700 dark:text-indigo-300',
    },
    {
        key: 'openingTodayCount',
        title: '오늘 개찰',
        description: '오늘 예정/완료된 개찰 결과',
        href: '/bid_opening?datePreset=today',
        accentClassName: 'text-cyan-700 dark:text-cyan-300',
    },
    {
        key: 'bookmarkCount',
        title: '내 북마크',
        description: '추적 중인 공고 수',
        href: '/profile/bookmarks',
        accentClassName: 'text-amber-700 dark:text-amber-300',
    },
    {
        key: 'mockBidCount',
        title: '입찰 이력',
        description: '저장된 모의입찰 이력',
        href: '/bid_history',
        accentClassName: 'text-emerald-700 dark:text-emerald-300',
    },
    {
        key: 'unreadNotificationCount',
        title: '미읽음 알림',
        description: '확인하지 않은 알림',
        href: '/profile/notifications',
        accentClassName: 'text-rose-700 dark:text-rose-300',
    },
] as const;

export default async function DashboardPage() {
    const data = await getDashboardData();

    return (
        <main className="min-h-screen bg-slate-50 px-4 py-6 text-slate-900 md:px-6 lg:px-8 dark:bg-[#0B1121] dark:text-slate-100">
            <div className="mx-auto max-w-[1440px] space-y-4">
                <header className="rounded-xl border border-slate-200 bg-white px-6 py-5 shadow-sm dark:border-slate-700 dark:bg-[#151E32]">
                    <div className="mb-1 text-sm text-slate-500 dark:text-slate-400">홈 &gt; 대시보드</div>
                    <div className="flex flex-wrap items-center justify-between gap-2">
                        <h1 className="text-2xl font-bold">대시보드</h1>
                        <p className="text-xs text-slate-500 dark:text-slate-400">
                            최근 갱신 {data.refreshedAtLabel} · 집계 캐시 {data.cacheTtlMinutes}분
                        </p>
                    </div>
                </header>

                {data.error ? (
                    <section
                        role="alert"
                        className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800 dark:border-amber-900 dark:bg-amber-950/40 dark:text-amber-200"
                    >
                        <p className="font-semibold">{data.error.message}</p>
                        <p className="mt-1 text-xs">요청 ID: {data.error.requestId}</p>
                        <p className="mt-1 text-xs">{data.error.suggestion}</p>
                        {data.error.code === 'DASHBOARD_AUTH_REQUIRED' ? (
                            <Link
                                href="/login?returnTo=%2Fdashboard"
                                className="mt-2 inline-flex h-8 items-center rounded-md bg-blue-600 px-3 text-xs font-semibold text-white hover:bg-blue-700"
                            >
                                로그인 이동
                            </Link>
                        ) : null}
                    </section>
                ) : null}

                <section className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
                    {CARD_ITEMS.map((item) => (
                        <Link
                            key={item.key}
                            href={item.href}
                            className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm transition hover:-translate-y-0.5 hover:border-blue-300 hover:shadow dark:border-slate-700 dark:bg-[#151E32] dark:hover:border-blue-500"
                        >
                            <p className="text-sm font-semibold text-slate-600 dark:text-slate-300">
                                {item.title}
                            </p>
                            <p className={`mt-2 text-3xl font-bold ${item.accentClassName}`}>
                                {data.counts[item.key].toLocaleString('ko-KR')}
                            </p>
                            <p className="mt-2 text-xs text-slate-500 dark:text-slate-400">
                                {item.description}
                            </p>
                        </Link>
                    ))}
                </section>

                <section className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-700 dark:bg-[#151E32]">
                    <h2 className="text-base font-semibold">바로가기</h2>
                    <div className="mt-3 flex flex-wrap gap-2">
                        <Link
                            href="/bid_notice"
                            className="inline-flex h-9 items-center rounded-md border border-slate-300 bg-white px-3 text-sm font-medium text-slate-700 hover:bg-slate-50 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-100 dark:hover:bg-slate-700"
                        >
                            입찰공고 보기
                        </Link>
                        <Link
                            href="/bid_opening"
                            className="inline-flex h-9 items-center rounded-md border border-slate-300 bg-white px-3 text-sm font-medium text-slate-700 hover:bg-slate-50 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-100 dark:hover:bg-slate-700"
                        >
                            개찰결과 보기
                        </Link>
                        <Link
                            href="/profile"
                            className="inline-flex h-9 items-center rounded-md border border-slate-300 bg-white px-3 text-sm font-medium text-slate-700 hover:bg-slate-50 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-100 dark:hover:bg-slate-700"
                        >
                            프로필 이동
                        </Link>
                    </div>
                </section>
            </div>
        </main>
    );
}
