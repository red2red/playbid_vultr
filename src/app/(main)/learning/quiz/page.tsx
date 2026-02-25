import Link from 'next/link';
import { getLearningQuizData } from '@/lib/learning/learning-query';

const questionTypeLabel: Record<string, string> = {
    multipleChoice: '객관식',
    trueFalse: 'OX',
    fillBlank: '주관식',
};

export default async function LearningQuizPage() {
    const data = await getLearningQuizData();

    if (data.authRequired) {
        return (
            <main className="min-h-screen bg-slate-50 px-4 py-6 text-slate-900 md:px-6 lg:px-8 dark:bg-[#0B1121] dark:text-slate-100">
                <div className="mx-auto max-w-[960px]">
                    <section className="rounded-xl border border-amber-200 bg-amber-50 px-5 py-4 text-sm text-amber-900 dark:border-amber-900 dark:bg-amber-950/40 dark:text-amber-100">
                        로그인 정보가 필요합니다.
                        <div className="mt-3">
                            <Link
                                href="/login?returnTo=%2Flearning%2Fquiz"
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
                    <div className="mb-1 text-sm text-slate-500 dark:text-slate-400">홈 &gt; 학습 &gt; 퀴즈</div>
                    <h1 className="text-2xl font-bold">학습 퀴즈</h1>
                    <p className="mt-2 text-sm text-slate-600 dark:text-slate-300">
                        카테고리별 문제를 풀고 XP를 획득하세요.
                    </p>
                </header>

                {data.quizzes.length === 0 ? (
                    <section className="rounded-xl border border-slate-200 bg-white p-5 text-sm text-slate-500 shadow-sm dark:border-slate-700 dark:bg-[#151E32] dark:text-slate-300">
                        표시할 퀴즈가 없습니다.
                    </section>
                ) : (
                    <section className="space-y-3">
                        {data.quizzes.map((quiz, index) => (
                            <article key={quiz.id} className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-700 dark:bg-[#151E32]">
                                <div className="flex flex-wrap items-center gap-2 text-xs">
                                    <span className="rounded-full bg-blue-100 px-2 py-1 font-semibold text-blue-700 dark:bg-blue-900/40 dark:text-blue-200">
                                        {questionTypeLabel[quiz.questionType] ?? quiz.questionType}
                                    </span>
                                    <span className="rounded-full bg-slate-100 px-2 py-1 font-semibold text-slate-700 dark:bg-slate-800 dark:text-slate-200">
                                        {quiz.categoryName}
                                    </span>
                                    <span className="rounded-full bg-emerald-100 px-2 py-1 font-semibold text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-200">
                                        {quiz.difficulty}
                                    </span>
                                    <span className="rounded-full bg-amber-100 px-2 py-1 font-semibold text-amber-700 dark:bg-amber-900/40 dark:text-amber-200">
                                        +{quiz.xpReward} XP
                                    </span>
                                </div>
                                <h2 className="mt-2 font-semibold">
                                    Q{index + 1}. {quiz.question}
                                </h2>
                                {quiz.explanation ? (
                                    <p className="mt-2 text-sm text-slate-600 dark:text-slate-300">
                                        해설: {quiz.explanation}
                                    </p>
                                ) : null}
                            </article>
                        ))}
                    </section>
                )}

                <section className="rounded-xl border border-slate-200 bg-white px-6 py-5 shadow-sm dark:border-slate-700 dark:bg-[#151E32]">
                    <h2 className="text-base font-semibold">바로가기</h2>
                    <div className="mt-3 grid gap-2 sm:grid-cols-2">
                        <Link href="/learning" className="inline-flex h-11 items-center justify-center rounded-md border border-slate-300 bg-white px-3 text-sm font-medium text-slate-700 hover:bg-slate-50 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-100">
                            학습 홈
                        </Link>
                        <Link href="/learning/flashcard" className="inline-flex h-11 items-center justify-center rounded-md border border-slate-300 bg-white px-3 text-sm font-medium text-slate-700 hover:bg-slate-50 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-100">
                            플래시카드
                        </Link>
                        <Link href="/challenge/missions" className="inline-flex h-11 items-center justify-center rounded-md border border-slate-300 bg-white px-3 text-sm font-medium text-slate-700 hover:bg-slate-50 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-100">
                            오늘의 미션
                        </Link>
                        <Link href="/challenge/ranking?tab=monthly" className="inline-flex h-11 items-center justify-center rounded-md border border-slate-300 bg-white px-3 text-sm font-medium text-slate-700 hover:bg-slate-50 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-100">
                            월간 리더보드
                        </Link>
                    </div>
                </section>
            </div>
        </main>
    );
}
