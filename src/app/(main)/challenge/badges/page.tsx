import Link from 'next/link';
import { getChallengeBadgesData } from '@/lib/challenge/challenge-query';

const numberFormatter = new Intl.NumberFormat('ko-KR');

function getTierLabel(tier: string | null): string {
    if (!tier) {
        return '기본';
    }
    if (tier === 'bronze') {
        return '브론즈';
    }
    if (tier === 'silver') {
        return '실버';
    }
    if (tier === 'gold') {
        return '골드';
    }
    return tier;
}

export default async function ChallengeBadgesPage() {
    const data = await getChallengeBadgesData();

    if (data.authRequired) {
        return (
            <main className="min-h-screen bg-slate-50 px-4 py-6 text-slate-900 md:px-6 lg:px-8 dark:bg-[#0B1121] dark:text-slate-100">
                <div className="mx-auto max-w-[960px]">
                    <section className="rounded-xl border border-amber-200 bg-amber-50 px-5 py-4 text-sm text-amber-900 dark:border-amber-900 dark:bg-amber-950/40 dark:text-amber-100">
                        로그인 정보가 필요합니다.
                        <div className="mt-3">
                            <Link
                                href="/login?returnTo=%2Fchallenge%2Fbadges"
                                className="inline-flex h-11 items-center rounded-md bg-blue-600 px-4 text-sm font-semibold text-white hover:bg-blue-700"
                            >
                                로그인 이동
                            </Link>
                        </div>
                    </section>
                </div>
            </main>
        );
    }

    const unlockedCount = data.badges.filter((badge) => badge.isUnlocked).length;

    return (
        <main className="min-h-screen bg-slate-50 px-4 py-6 text-slate-900 md:px-6 lg:px-8 dark:bg-[#0B1121] dark:text-slate-100">
            <div className="mx-auto max-w-[960px] space-y-4">
                <header className="rounded-xl border border-slate-200 bg-white px-6 py-5 shadow-sm dark:border-slate-700 dark:bg-[#151E32]">
                    <div className="mb-1 text-sm text-slate-500 dark:text-slate-400">홈 &gt; 챌린지 &gt; 뱃지</div>
                    <h1 className="text-2xl font-bold">뱃지 컬렉션</h1>
                    <p className="mt-2 text-sm text-slate-600 dark:text-slate-300">
                        해금 {unlockedCount}/{data.badges.length} · 레벨 {data.levelSummary.currentLevel} · 완료 미션 {numberFormatter.format(data.completedMissionCount)}개
                    </p>
                </header>

                {data.badges.length === 0 ? (
                    <section className="rounded-xl border border-slate-200 bg-white p-5 text-sm text-slate-500 shadow-sm dark:border-slate-700 dark:bg-[#151E32] dark:text-slate-300">
                        표시할 뱃지가 없습니다.
                    </section>
                ) : (
                    <section className="grid gap-3 sm:grid-cols-2">
                        {data.badges.map((badge) => (
                            <article
                                key={badge.id}
                                className={`rounded-xl border p-5 shadow-sm ${badge.isUnlocked
                                    ? 'border-amber-300 bg-amber-50/60 dark:border-amber-700 dark:bg-amber-950/30'
                                    : 'border-slate-200 bg-white dark:border-slate-700 dark:bg-[#151E32]'
                                    }`}
                            >
                                <div className="flex items-start justify-between gap-3">
                                    <div className="flex items-center gap-3">
                                        <span className="text-4xl">{badge.icon}</span>
                                        <div>
                                            <h2 className="font-semibold">{badge.name}</h2>
                                            <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
                                                {getTierLabel(badge.tier)} · {badge.category ?? '기타'}
                                            </p>
                                        </div>
                                    </div>
                                    <span className={`rounded-full px-2 py-1 text-xs font-semibold ${badge.isUnlocked
                                        ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-200'
                                        : 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-300'
                                        }`}>
                                        {badge.isUnlocked ? '해금' : '잠금'}
                                    </span>
                                </div>
                                <p className="mt-3 text-sm text-slate-600 dark:text-slate-300">{badge.description}</p>
                                <p className="mt-2 text-xs text-slate-500 dark:text-slate-400">
                                    조건: {badge.unlockCondition ?? `${badge.unlockType} ${badge.unlockValue ?? '-'}`}
                                </p>
                                {badge.earnedAt ? (
                                    <p className="mt-1 text-xs text-emerald-700 dark:text-emerald-300">
                                        획득일 {badge.earnedAt}
                                    </p>
                                ) : null}
                            </article>
                        ))}
                    </section>
                )}

                <section className="rounded-xl border border-slate-200 bg-white px-6 py-5 shadow-sm dark:border-slate-700 dark:bg-[#151E32]">
                    <h2 className="text-base font-semibold">다른 챌린지 메뉴</h2>
                    <div className="mt-3 grid gap-2 sm:grid-cols-2">
                        <Link href="/challenge" className="inline-flex h-11 items-center justify-center rounded-md border border-slate-300 bg-white px-3 text-sm font-medium text-slate-700 hover:bg-slate-50 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-100">
                            챌린지 홈
                        </Link>
                        <Link href="/challenge/missions" className="inline-flex h-11 items-center justify-center rounded-md border border-slate-300 bg-white px-3 text-sm font-medium text-slate-700 hover:bg-slate-50 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-100">
                            오늘의 미션
                        </Link>
                        <Link href="/challenge/ranking?tab=all" className="inline-flex h-11 items-center justify-center rounded-md border border-slate-300 bg-white px-3 text-sm font-medium text-slate-700 hover:bg-slate-50 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-100">
                            전체 리더보드
                        </Link>
                        <Link href="/learning" className="inline-flex h-11 items-center justify-center rounded-md border border-slate-300 bg-white px-3 text-sm font-medium text-slate-700 hover:bg-slate-50 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-100">
                            학습 센터
                        </Link>
                    </div>
                </section>
            </div>
        </main>
    );
}
