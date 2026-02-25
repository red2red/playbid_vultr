import Link from 'next/link';
import { getChallengeOverviewData } from '@/lib/challenge/challenge-query';

const numberFormatter = new Intl.NumberFormat('ko-KR');

const missionTypeLabel: Record<string, string> = {
    daily: '일일',
    weekly: '주간',
    achievement: '업적',
};

const difficultyLabel: Record<string, string> = {
    easy: '쉬움',
    medium: '보통',
    hard: '어려움',
};

export default async function ChallengePage() {
    const data = await getChallengeOverviewData();

    if (data.authRequired) {
        return (
            <main className="min-h-screen bg-slate-50 px-4 py-6 text-slate-900 md:px-6 lg:px-8 dark:bg-[#0B1121] dark:text-slate-100">
                <div className="mx-auto max-w-[960px]">
                    <section className="rounded-xl border border-amber-200 bg-amber-50 px-5 py-4 text-sm text-amber-900 dark:border-amber-900 dark:bg-amber-950/40 dark:text-amber-100">
                        로그인 상태가 만료되었습니다. 다시 로그인해 주세요.
                        <div className="mt-3">
                            <Link
                                href="/login?returnTo=%2Fchallenge"
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

    const missionCompletedCount = data.todayMissions.filter((mission) => mission.isCompleted).length;
    const badgeUnlockedCount = data.badges.filter((badge) => badge.isUnlocked).length;

    return (
        <main className="min-h-screen bg-slate-50 px-4 py-6 text-slate-900 md:px-6 lg:px-8 dark:bg-[#0B1121] dark:text-slate-100">
            <div className="mx-auto max-w-[960px] space-y-4">
                <header className="rounded-xl border border-slate-200 bg-white px-6 py-5 shadow-sm dark:border-slate-700 dark:bg-[#151E32]">
                    <div className="mb-1 text-sm text-slate-500 dark:text-slate-400">홈 &gt; 챌린지</div>
                    <h1 className="text-2xl font-bold">챌린지</h1>
                    <p className="mt-2 text-sm text-slate-600 dark:text-slate-300">
                        레벨, 미션, 뱃지, 리더보드를 한 번에 확인하세요.
                    </p>
                </header>

                <section className="grid gap-3 md:grid-cols-3">
                    <article className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm md:col-span-2 dark:border-slate-700 dark:bg-[#151E32]">
                        <p className="text-sm font-semibold text-slate-600 dark:text-slate-300">현재 레벨</p>
                        <p className="mt-2 text-3xl font-bold text-blue-700 dark:text-blue-300">
                            Lv. {numberFormatter.format(data.levelSummary.currentLevel)}
                        </p>
                        <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
                            누적 XP {numberFormatter.format(data.levelSummary.totalXp)} / 다음 레벨 기준 {numberFormatter.format(data.levelSummary.nextLevelXp)}
                        </p>
                        <div className="mt-3 h-2 overflow-hidden rounded-full bg-slate-200 dark:bg-slate-700">
                            <div
                                className="h-full rounded-full bg-blue-600 dark:bg-blue-400"
                                style={{ width: `${data.levelSummary.levelProgress}%` }}
                            />
                        </div>
                    </article>

                    <article className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-700 dark:bg-[#151E32]">
                        <p className="text-sm font-semibold text-slate-600 dark:text-slate-300">오늘 진행 현황</p>
                        <dl className="mt-3 space-y-2 text-sm">
                            <div className="flex items-center justify-between">
                                <dt>미션 완료</dt>
                                <dd className="font-semibold text-slate-900 dark:text-white">
                                    {missionCompletedCount}/{data.todayMissions.length}
                                </dd>
                            </div>
                            <div className="flex items-center justify-between">
                                <dt>해금 뱃지</dt>
                                <dd className="font-semibold text-slate-900 dark:text-white">
                                    {badgeUnlockedCount}/{data.badges.length}
                                </dd>
                            </div>
                            <div className="flex items-center justify-between">
                                <dt>기준일</dt>
                                <dd className="font-semibold text-slate-900 dark:text-white">
                                    {data.todayMissionDate ?? '-'}
                                </dd>
                            </div>
                        </dl>
                    </article>
                </section>

                <section className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-700 dark:bg-[#151E32]">
                    <div className="flex items-center justify-between gap-3">
                        <h2 className="text-base font-semibold">오늘의 미션</h2>
                        <Link href="/challenge/missions" className="text-sm font-semibold text-blue-700 hover:text-blue-800 dark:text-blue-300">
                            전체 보기
                        </Link>
                    </div>
                    {data.todayMissions.length === 0 ? (
                        <p className="mt-3 text-sm text-slate-500 dark:text-slate-400">표시할 미션이 없습니다.</p>
                    ) : (
                        <div className="mt-3 space-y-3">
                            {data.todayMissions.slice(0, 3).map((mission) => {
                                const progress = Math.min(100, Math.round((mission.currentProgress / mission.targetCount) * 100));
                                return (
                                    <article key={mission.id} className="rounded-lg border border-slate-200 p-4 dark:border-slate-700">
                                        <div className="flex flex-wrap items-center gap-2 text-xs">
                                            <span className="rounded-full bg-blue-100 px-2 py-1 font-semibold text-blue-700 dark:bg-blue-900/40 dark:text-blue-200">
                                                {missionTypeLabel[mission.type] ?? mission.type}
                                            </span>
                                            <span className="rounded-full bg-slate-100 px-2 py-1 font-semibold text-slate-700 dark:bg-slate-800 dark:text-slate-200">
                                                {difficultyLabel[mission.difficulty] ?? mission.difficulty}
                                            </span>
                                            <span className="rounded-full bg-amber-100 px-2 py-1 font-semibold text-amber-700 dark:bg-amber-900/40 dark:text-amber-200">
                                                +{numberFormatter.format(mission.rewardXp)} XP
                                            </span>
                                        </div>
                                        <h3 className="mt-2 font-semibold">{mission.title}</h3>
                                        <p className="mt-1 text-sm text-slate-600 dark:text-slate-300">{mission.description}</p>
                                        <p className="mt-2 text-xs text-slate-500 dark:text-slate-400">
                                            진행 {mission.currentProgress}/{mission.targetCount} ({progress}%)
                                        </p>
                                        <div className="mt-2 h-2 overflow-hidden rounded-full bg-slate-200 dark:bg-slate-700">
                                            <div className="h-full rounded-full bg-emerald-500" style={{ width: `${progress}%` }} />
                                        </div>
                                    </article>
                                );
                            })}
                        </div>
                    )}
                </section>

                <section className="grid gap-4 md:grid-cols-2">
                    <article className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-700 dark:bg-[#151E32]">
                        <div className="flex items-center justify-between gap-3">
                            <h2 className="text-base font-semibold">리더보드 TOP 5</h2>
                            <Link href="/challenge/ranking?tab=weekly" className="text-sm font-semibold text-blue-700 hover:text-blue-800 dark:text-blue-300">
                                전체 랭킹
                            </Link>
                        </div>
                        {data.leaderboardPreview.length === 0 ? (
                            <p className="mt-3 text-sm text-slate-500 dark:text-slate-400">리더보드 데이터가 없습니다.</p>
                        ) : (
                            <ol className="mt-3 space-y-2">
                                {data.leaderboardPreview.map((entry) => (
                                    <li key={entry.id} className="flex items-center gap-3 rounded-lg border border-slate-200 px-3 py-2 dark:border-slate-700">
                                        <span className="inline-flex h-7 w-7 items-center justify-center rounded-full bg-slate-100 text-sm font-bold text-slate-700 dark:bg-slate-800 dark:text-slate-100">
                                            {entry.rank}
                                        </span>
                                        <span className="flex-1 truncate text-sm font-medium">{entry.username}</span>
                                        <span className="text-sm font-semibold text-amber-600 dark:text-amber-300">
                                            {numberFormatter.format(entry.totalXp)} XP
                                        </span>
                                    </li>
                                ))}
                            </ol>
                        )}
                    </article>

                    <article className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-700 dark:bg-[#151E32]">
                        <div className="flex items-center justify-between gap-3">
                            <h2 className="text-base font-semibold">학습 추천</h2>
                            <Link href="/learning" className="text-sm font-semibold text-blue-700 hover:text-blue-800 dark:text-blue-300">
                                학습 홈
                            </Link>
                        </div>
                        {data.learningPreview.length === 0 ? (
                            <p className="mt-3 text-sm text-slate-500 dark:text-slate-400">학습 콘텐츠가 없습니다.</p>
                        ) : (
                            <ul className="mt-3 space-y-2">
                                {data.learningPreview.map((item) => (
                                    <li key={item.id} className="rounded-lg border border-slate-200 px-3 py-2 text-sm dark:border-slate-700">
                                        <p className="font-medium">{item.title}</p>
                                        <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
                                            {item.categoryName} · {item.type} · {item.difficulty}
                                        </p>
                                    </li>
                                ))}
                            </ul>
                        )}
                    </article>
                </section>

                <section className="rounded-xl border border-slate-200 bg-white px-6 py-5 shadow-sm dark:border-slate-700 dark:bg-[#151E32]">
                    <h2 className="text-base font-semibold">바로가기</h2>
                    <div className="mt-3 grid gap-2 sm:grid-cols-2">
                        <Link
                            href="/challenge/missions"
                            className="inline-flex h-11 items-center justify-center rounded-md border border-slate-300 bg-white px-3 text-sm font-medium text-slate-700 hover:bg-slate-50 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-100"
                        >
                            오늘의 미션
                        </Link>
                        <Link
                            href="/challenge/badges"
                            className="inline-flex h-11 items-center justify-center rounded-md border border-slate-300 bg-white px-3 text-sm font-medium text-slate-700 hover:bg-slate-50 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-100"
                        >
                            뱃지 컬렉션
                        </Link>
                        <Link
                            href="/challenge/ranking?tab=weekly"
                            className="inline-flex h-11 items-center justify-center rounded-md border border-slate-300 bg-white px-3 text-sm font-medium text-slate-700 hover:bg-slate-50 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-100"
                        >
                            주간 리더보드
                        </Link>
                        <Link
                            href="/learning"
                            className="inline-flex h-11 items-center justify-center rounded-md border border-slate-300 bg-white px-3 text-sm font-medium text-slate-700 hover:bg-slate-50 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-100"
                        >
                            학습 센터
                        </Link>
                    </div>
                </section>
            </div>
        </main>
    );
}
