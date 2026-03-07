import Link from 'next/link';
import { getChallengeRankingData, type RankingTab } from '@/lib/challenge/challenge-query';

type ChallengeRankingPageProps = {
    searchParams?: Promise<Record<string, string | string[] | undefined>>;
};

const numberFormatter = new Intl.NumberFormat('ko-KR');

const TAB_ITEMS: Array<{ key: RankingTab; label: string }> = [
    { key: 'weekly', label: '주간' },
    { key: 'monthly', label: '월간' },
    { key: 'all', label: '전체' },
];

export default async function ChallengeRankingPage({ searchParams }: ChallengeRankingPageProps) {
    const resolvedSearchParams = (await searchParams) ?? {};
    const data = await getChallengeRankingData(resolvedSearchParams.tab);

    if (data.authRequired) {
        return (
            <main className="min-h-screen bg-slate-50 px-4 py-6 text-slate-900 md:px-6 lg:px-8 dark:bg-[#0B1121] dark:text-slate-100">
                <div className="mx-auto max-w-[960px]">
                    <section className="rounded-xl border border-amber-200 bg-amber-50 px-5 py-4 text-sm text-amber-900 dark:border-amber-900 dark:bg-amber-950/40 dark:text-amber-100">
                        로그인 정보가 필요합니다.
                        <div className="mt-3">
                            <Link
                                href="/login?returnTo=%2Fchallenge%2Franking%3Ftab%3Dweekly"
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
                    <div className="mb-1 text-sm text-slate-500 dark:text-slate-400">홈 &gt; 챌린지 &gt; 리더보드</div>
                    <h1 className="text-2xl font-bold">챌린지 리더보드</h1>
                    <p className="mt-2 text-sm text-slate-600 dark:text-slate-300">
                        주간/월간/전체 순위를 확인할 수 있습니다.
                    </p>
                </header>

                <section className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-700 dark:bg-[#151E32]">
                    <div className="grid grid-cols-3 gap-2">
                        {TAB_ITEMS.map((tab) => (
                            <Link
                                key={tab.key}
                                href={`/challenge/ranking?tab=${tab.key}`}
                                className={`inline-flex h-11 items-center justify-center rounded-md border text-sm font-semibold transition ${data.selectedTab === tab.key
                                    ? 'border-blue-600 bg-blue-600 text-white'
                                    : 'border-slate-300 bg-white text-slate-700 hover:bg-slate-50 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-100'
                                    }`}
                            >
                                {tab.label}
                            </Link>
                        ))}
                    </div>

                    {data.leaderboard.length === 0 ? (
                        <p className="mt-4 text-sm text-slate-500 dark:text-slate-400">리더보드 데이터가 없습니다.</p>
                    ) : (
                        <ol className="mt-4 space-y-2">
                            {data.leaderboard.map((entry) => (
                                <li key={entry.id} className="flex items-center gap-3 rounded-lg border border-slate-200 px-4 py-3 dark:border-slate-700">
                                    <span className={`inline-flex h-8 w-8 items-center justify-center rounded-full text-sm font-bold ${entry.rank === 1
                                        ? 'bg-amber-400 text-white'
                                        : entry.rank === 2
                                            ? 'bg-slate-300 text-slate-800'
                                            : entry.rank === 3
                                                ? 'bg-amber-700 text-white'
                                                : 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-100'
                                        }`}>
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
                </section>

                <section className="rounded-xl border border-slate-200 bg-white px-6 py-5 shadow-sm dark:border-slate-700 dark:bg-[#151E32]">
                    <h2 className="text-base font-semibold">바로가기</h2>
                    <div className="mt-3 grid gap-2 sm:grid-cols-2">
                        <Link href="/challenge" className="inline-flex h-11 items-center justify-center rounded-md border border-slate-300 bg-white px-3 text-sm font-medium text-slate-700 hover:bg-slate-50 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-100">
                            챌린지 홈
                        </Link>
                        <Link href="/challenge/missions" className="inline-flex h-11 items-center justify-center rounded-md border border-slate-300 bg-white px-3 text-sm font-medium text-slate-700 hover:bg-slate-50 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-100">
                            오늘의 미션
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
