import Link from 'next/link';
import { getLearningFlashcardData, type LearningFlashcardFilter } from '@/lib/learning/learning-query';

type LearningFlashcardPageProps = {
    searchParams?: Promise<Record<string, string | string[] | undefined>>;
};

const FILTER_ITEMS: Array<{ key: LearningFlashcardFilter; label: string }> = [
    { key: 'all', label: '전체' },
    { key: 'term', label: '용어' },
    { key: 'concept', label: '개념' },
    { key: 'law', label: '법령' },
    { key: 'tip', label: '팁' },
];

export default async function LearningFlashcardPage({ searchParams }: LearningFlashcardPageProps) {
    const resolvedSearchParams = (await searchParams) ?? {};
    const data = await getLearningFlashcardData(resolvedSearchParams.type);

    if (data.authRequired) {
        return (
            <main className="min-h-screen bg-slate-50 px-4 py-6 text-slate-900 md:px-6 lg:px-8 dark:bg-[#0B1121] dark:text-slate-100">
                <div className="mx-auto max-w-[960px]">
                    <section className="rounded-xl border border-amber-200 bg-amber-50 px-5 py-4 text-sm text-amber-900 dark:border-amber-900 dark:bg-amber-950/40 dark:text-amber-100">
                        로그인 정보가 필요합니다.
                        <div className="mt-3">
                            <Link
                                href="/login?returnTo=%2Flearning%2Fflashcard"
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
                    <div className="mb-1 text-sm text-slate-500 dark:text-slate-400">홈 &gt; 학습 &gt; 플래시카드</div>
                    <h1 className="text-2xl font-bold">학습 플래시카드</h1>
                    <p className="mt-2 text-sm text-slate-600 dark:text-slate-300">
                        카드형 학습으로 핵심 개념을 빠르게 복습하세요.
                    </p>
                </header>

                <section className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-700 dark:bg-[#151E32]">
                    <div className="grid grid-cols-3 gap-2 sm:grid-cols-5">
                        {FILTER_ITEMS.map((item) => (
                            <Link
                                key={item.key}
                                href={`/learning/flashcard?type=${item.key}`}
                                className={`inline-flex h-11 items-center justify-center rounded-md border text-sm font-semibold transition ${data.selectedFilter === item.key
                                    ? 'border-blue-600 bg-blue-600 text-white'
                                    : 'border-slate-300 bg-white text-slate-700 hover:bg-slate-50 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-100'
                                    }`}
                            >
                                {item.label}
                            </Link>
                        ))}
                    </div>

                    {data.cards.length === 0 ? (
                        <p className="mt-4 text-sm text-slate-500 dark:text-slate-400">표시할 카드가 없습니다.</p>
                    ) : (
                        <div className="mt-4 grid gap-3 sm:grid-cols-2">
                            {data.cards.map((card) => (
                                <article key={card.id} className="rounded-xl border border-slate-200 p-4 dark:border-slate-700">
                                    <div className="flex flex-wrap items-center gap-2 text-xs">
                                        <span className="rounded-full bg-blue-100 px-2 py-1 font-semibold text-blue-700 dark:bg-blue-900/40 dark:text-blue-200">
                                            {card.type}
                                        </span>
                                        <span className="rounded-full bg-slate-100 px-2 py-1 font-semibold text-slate-700 dark:bg-slate-800 dark:text-slate-200">
                                            {card.categoryName}
                                        </span>
                                        <span className="rounded-full bg-emerald-100 px-2 py-1 font-semibold text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-200">
                                            {card.difficulty}
                                        </span>
                                    </div>
                                    <h2 className="mt-2 font-semibold">{card.title}</h2>
                                    <p className="mt-2 text-sm text-slate-600 dark:text-slate-300">{card.description}</p>
                                    {card.example ? (
                                        <p className="mt-2 rounded-md bg-slate-100 px-3 py-2 text-xs text-slate-600 dark:bg-slate-800 dark:text-slate-300">
                                            예시: {card.example}
                                        </p>
                                    ) : null}
                                    {card.tags.length > 0 ? (
                                        <p className="mt-2 text-xs text-slate-500 dark:text-slate-400">
                                            태그: {card.tags.join(', ')}
                                        </p>
                                    ) : null}
                                </article>
                            ))}
                        </div>
                    )}
                </section>

                <section className="rounded-xl border border-slate-200 bg-white px-6 py-5 shadow-sm dark:border-slate-700 dark:bg-[#151E32]">
                    <h2 className="text-base font-semibold">바로가기</h2>
                    <div className="mt-3 grid gap-2 sm:grid-cols-2">
                        <Link href="/learning" className="inline-flex h-11 items-center justify-center rounded-md border border-slate-300 bg-white px-3 text-sm font-medium text-slate-700 hover:bg-slate-50 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-100">
                            학습 홈
                        </Link>
                        <Link href="/learning/quiz" className="inline-flex h-11 items-center justify-center rounded-md border border-slate-300 bg-white px-3 text-sm font-medium text-slate-700 hover:bg-slate-50 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-100">
                            학습 퀴즈
                        </Link>
                        <Link href="/challenge" className="inline-flex h-11 items-center justify-center rounded-md border border-slate-300 bg-white px-3 text-sm font-medium text-slate-700 hover:bg-slate-50 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-100">
                            챌린지 홈
                        </Link>
                        <Link href="/challenge/ranking?tab=all" className="inline-flex h-11 items-center justify-center rounded-md border border-slate-300 bg-white px-3 text-sm font-medium text-slate-700 hover:bg-slate-50 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-100">
                            전체 리더보드
                        </Link>
                    </div>
                </section>
            </div>
        </main>
    );
}
