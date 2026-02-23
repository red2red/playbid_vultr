import Link from 'next/link';

interface LearningPlaceholderPageProps {
    breadcrumb: string;
    title: string;
    description: string;
}

export function LearningPlaceholderPage({ breadcrumb, title, description }: LearningPlaceholderPageProps) {
    return (
        <main className="min-h-screen bg-slate-50 px-4 py-6 text-slate-900 md:px-6 lg:px-8 dark:bg-[#0B1121] dark:text-slate-100">
            <div className="mx-auto max-w-[960px] space-y-4">
                <header className="rounded-xl border border-slate-200 bg-white px-6 py-5 shadow-sm dark:border-slate-700 dark:bg-[#151E32]">
                    <div className="mb-1 text-sm text-slate-500 dark:text-slate-400">{breadcrumb}</div>
                    <h1 className="text-2xl font-bold">{title}</h1>
                    <p className="mt-2 text-sm text-slate-600 dark:text-slate-300">{description}</p>
                </header>

                <section className="rounded-xl border border-slate-200 bg-white px-6 py-5 shadow-sm dark:border-slate-700 dark:bg-[#151E32]">
                    <h2 className="text-base font-semibold">바로가기</h2>
                    <div className="mt-3 flex flex-wrap gap-2">
                        <Link
                            href="/learning"
                            className="inline-flex h-9 items-center rounded-md border border-slate-300 bg-white px-3 text-sm font-medium text-slate-700 hover:bg-slate-50 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-100"
                        >
                            학습 홈
                        </Link>
                        <Link
                            href="/learning/quiz"
                            className="inline-flex h-9 items-center rounded-md border border-slate-300 bg-white px-3 text-sm font-medium text-slate-700 hover:bg-slate-50 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-100"
                        >
                            퀴즈
                        </Link>
                        <Link
                            href="/learning/flashcard"
                            className="inline-flex h-9 items-center rounded-md border border-slate-300 bg-white px-3 text-sm font-medium text-slate-700 hover:bg-slate-50 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-100"
                        >
                            플래시카드
                        </Link>
                    </div>
                </section>
            </div>
        </main>
    );
}
