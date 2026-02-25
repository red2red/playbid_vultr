import Link from 'next/link';
import { getLearningOverviewData } from '@/lib/learning/learning-query';

export default async function LearningPage() {
    const data = await getLearningOverviewData();

    if (data.authRequired) {
        return (
            <main className="min-h-screen bg-slate-50 px-4 py-6 text-slate-900 md:px-6 lg:px-8 dark:bg-[#0B1121] dark:text-slate-100">
                <div className="mx-auto max-w-[960px]">
                    <section className="rounded-xl border border-amber-200 bg-amber-50 px-5 py-4 text-sm text-amber-900 dark:border-amber-900 dark:bg-amber-950/40 dark:text-amber-100">
                        로그인 정보가 필요합니다.
                        <div className="mt-3">
                            <Link
                                href="/login?returnTo=%2Flearning"
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
                    <div className="mb-1 text-sm text-slate-500 dark:text-slate-400">홈 &gt; 학습</div>
                    <h1 className="text-2xl font-bold">학습 센터</h1>
                    <p className="mt-2 text-sm text-slate-600 dark:text-slate-300">
                        카테고리별 콘텐츠, 퀴즈, 플래시카드를 통해 입찰 역량을 높이세요.
                    </p>
                </header>

                <section className="grid gap-3 sm:grid-cols-2">
                    {data.categories.map((category) => (
                        <article key={category.id} className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-700 dark:bg-[#151E32]">
                            <div className="flex items-center gap-2">
                                <span className="text-2xl">{category.icon}</span>
                                <h2 className="font-semibold">{category.name}</h2>
                            </div>
                            <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">
                                콘텐츠 {category.contentCount}개
                            </p>
                        </article>
                    ))}
                </section>

                <section className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-700 dark:bg-[#151E32]">
                    <div className="flex items-center justify-between gap-3">
                        <h2 className="text-base font-semibold">추천 학습 콘텐츠</h2>
                        <Link href="/learning/flashcard" className="text-sm font-semibold text-blue-700 hover:text-blue-800 dark:text-blue-300">
                            플래시카드 보기
                        </Link>
                    </div>
                    {data.featuredContents.length === 0 ? (
                        <p className="mt-3 text-sm text-slate-500 dark:text-slate-400">추천 콘텐츠가 없습니다.</p>
                    ) : (
                        <ul className="mt-3 space-y-2">
                            {data.featuredContents.map((content) => (
                                <li key={content.id} className="rounded-lg border border-slate-200 px-3 py-2 dark:border-slate-700">
                                    <p className="text-sm font-medium">{content.title}</p>
                                    <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
                                        {content.categoryName} · {content.type} · {content.difficulty}
                                    </p>
                                </li>
                            ))}
                        </ul>
                    )}
                </section>

                <section className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-700 dark:bg-[#151E32]">
                    <div className="flex items-center justify-between gap-3">
                        <h2 className="text-base font-semibold">오늘 풀어볼 퀴즈</h2>
                        <Link href="/learning/quiz" className="text-sm font-semibold text-blue-700 hover:text-blue-800 dark:text-blue-300">
                            퀴즈 전체 보기
                        </Link>
                    </div>
                    {data.quizPreview.length === 0 ? (
                        <p className="mt-3 text-sm text-slate-500 dark:text-slate-400">퀴즈가 없습니다.</p>
                    ) : (
                        <ol className="mt-3 space-y-2">
                            {data.quizPreview.map((quiz, index) => (
                                <li key={quiz.id} className="rounded-lg border border-slate-200 px-3 py-2 text-sm dark:border-slate-700">
                                    <p className="font-medium">
                                        Q{index + 1}. {quiz.question}
                                    </p>
                                    <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
                                        {quiz.categoryName} · {quiz.difficulty} · 보상 {quiz.xpReward} XP
                                    </p>
                                </li>
                            ))}
                        </ol>
                    )}
                </section>

                <section className="rounded-xl border border-slate-200 bg-white px-6 py-5 shadow-sm dark:border-slate-700 dark:bg-[#151E32]">
                    <h2 className="text-base font-semibold">바로가기</h2>
                    <div className="mt-3 grid gap-2 sm:grid-cols-2">
                        <Link href="/learning/quiz" className="inline-flex h-11 items-center justify-center rounded-md border border-slate-300 bg-white px-3 text-sm font-medium text-slate-700 hover:bg-slate-50 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-100">
                            학습 퀴즈
                        </Link>
                        <Link href="/learning/flashcard" className="inline-flex h-11 items-center justify-center rounded-md border border-slate-300 bg-white px-3 text-sm font-medium text-slate-700 hover:bg-slate-50 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-100">
                            플래시카드
                        </Link>
                        <Link href="/challenge" className="inline-flex h-11 items-center justify-center rounded-md border border-slate-300 bg-white px-3 text-sm font-medium text-slate-700 hover:bg-slate-50 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-100">
                            챌린지 홈
                        </Link>
                        <Link href="/challenge/ranking?tab=weekly" className="inline-flex h-11 items-center justify-center rounded-md border border-slate-300 bg-white px-3 text-sm font-medium text-slate-700 hover:bg-slate-50 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-100">
                            주간 리더보드
                        </Link>
                    </div>
                </section>
            </div>
        </main>
    );
}
