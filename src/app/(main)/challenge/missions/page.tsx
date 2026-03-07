import Link from 'next/link';
import { getChallengeMissionsData } from '@/lib/challenge/challenge-query';

const numberFormatter = new Intl.NumberFormat('ko-KR');

const missionTypeLabel: Record<string, string> = {
    daily: '일일',
    weekly: '주간',
    achievement: '업적',
};

export default async function ChallengeMissionsPage() {
    const data = await getChallengeMissionsData();

    if (data.authRequired) {
        return (
            <main className="min-h-screen bg-slate-50 px-4 py-6 text-slate-900 md:px-6 lg:px-8 dark:bg-[#0B1121] dark:text-slate-100">
                <div className="mx-auto max-w-[960px]">
                    <section className="rounded-xl border border-amber-200 bg-amber-50 px-5 py-4 text-sm text-amber-900 dark:border-amber-900 dark:bg-amber-950/40 dark:text-amber-100">
                        로그인 정보가 필요합니다.
                        <div className="mt-3">
                            <Link
                                href="/login?returnTo=%2Fchallenge%2Fmissions"
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

    return (
        <main className="min-h-screen bg-slate-50 px-4 py-6 text-slate-900 md:px-6 lg:px-8 dark:bg-[#0B1121] dark:text-slate-100">
            <div className="mx-auto max-w-[960px] space-y-4">
                <header className="rounded-xl border border-slate-200 bg-white px-6 py-5 shadow-sm dark:border-slate-700 dark:bg-[#151E32]">
                    <div className="mb-1 text-sm text-slate-500 dark:text-slate-400">홈 &gt; 챌린지 &gt; 미션</div>
                    <h1 className="text-2xl font-bold">오늘의 미션</h1>
                    <p className="mt-2 text-sm text-slate-600 dark:text-slate-300">
                        기준일 {data.todayMissionDate ?? '-'} · 완료 후 보상 수령 여부를 확인하세요.
                    </p>
                </header>

                {data.missions.length === 0 ? (
                    <section className="rounded-xl border border-slate-200 bg-white p-5 text-sm text-slate-500 shadow-sm dark:border-slate-700 dark:bg-[#151E32] dark:text-slate-300">
                        표시할 미션이 없습니다.
                    </section>
                ) : (
                    <section className="space-y-3">
                        {data.missions.map((mission) => {
                            const progress = Math.min(100, Math.round((mission.currentProgress / mission.targetCount) * 100));
                            return (
                                <article key={mission.id} className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-700 dark:bg-[#151E32]">
                                    <div className="flex flex-wrap items-center gap-2 text-xs">
                                        <span className="rounded-full bg-blue-100 px-2 py-1 font-semibold text-blue-700 dark:bg-blue-900/40 dark:text-blue-200">
                                            {missionTypeLabel[mission.type] ?? mission.type}
                                        </span>
                                        <span className="rounded-full bg-amber-100 px-2 py-1 font-semibold text-amber-700 dark:bg-amber-900/40 dark:text-amber-200">
                                            +{numberFormatter.format(mission.rewardXp)} XP
                                        </span>
                                        {mission.isCompleted ? (
                                            <span className="rounded-full bg-emerald-100 px-2 py-1 font-semibold text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-200">
                                                완료
                                            </span>
                                        ) : null}
                                        {mission.rewardClaimed ? (
                                            <span className="rounded-full bg-violet-100 px-2 py-1 font-semibold text-violet-700 dark:bg-violet-900/40 dark:text-violet-200">
                                                보상 수령
                                            </span>
                                        ) : null}
                                    </div>

                                    <h2 className="mt-2 text-lg font-semibold">{mission.title}</h2>
                                    <p className="mt-1 text-sm text-slate-600 dark:text-slate-300">{mission.description}</p>

                                    <div className="mt-3 flex items-center justify-between text-sm">
                                        <span className="text-slate-600 dark:text-slate-300">
                                            진행 {mission.currentProgress}/{mission.targetCount}
                                        </span>
                                        <span className="font-semibold">{progress}%</span>
                                    </div>
                                    <div className="mt-2 h-2 overflow-hidden rounded-full bg-slate-200 dark:bg-slate-700">
                                        <div className="h-full rounded-full bg-blue-600 dark:bg-blue-400" style={{ width: `${progress}%` }} />
                                    </div>
                                </article>
                            );
                        })}
                    </section>
                )}

                <section className="rounded-xl border border-slate-200 bg-white px-6 py-5 shadow-sm dark:border-slate-700 dark:bg-[#151E32]">
                    <h2 className="text-base font-semibold">다른 챌린지 메뉴</h2>
                    <div className="mt-3 grid gap-2 sm:grid-cols-2">
                        <Link href="/challenge" className="inline-flex h-11 items-center justify-center rounded-md border border-slate-300 bg-white px-3 text-sm font-medium text-slate-700 hover:bg-slate-50 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-100">
                            챌린지 홈
                        </Link>
                        <Link href="/challenge/ranking?tab=weekly" className="inline-flex h-11 items-center justify-center rounded-md border border-slate-300 bg-white px-3 text-sm font-medium text-slate-700 hover:bg-slate-50 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-100">
                            리더보드
                        </Link>
                        <Link href="/challenge/badges" className="inline-flex h-11 items-center justify-center rounded-md border border-slate-300 bg-white px-3 text-sm font-medium text-slate-700 hover:bg-slate-50 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-100">
                            뱃지 컬렉션
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
