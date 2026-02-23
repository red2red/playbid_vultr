import { redirect } from 'next/navigation';
import { OAuthLoginCard } from '@/components/auth/oauth-login-card';
import {
    asSingleParamValue,
    sanitizeReturnTo,
} from '@/lib/auth/oauth-flow';
import { createClient } from '@/lib/supabase/server';

interface LoginPageProps {
    searchParams?: Promise<Record<string, string | string[] | undefined>>;
}

export default async function LoginPage({ searchParams }: LoginPageProps) {
    const resolvedSearchParams = (await searchParams) ?? {};
    const returnTo = sanitizeReturnTo(asSingleParamValue(resolvedSearchParams.returnTo), '/bid_notice');
    const errorCode = asSingleParamValue(resolvedSearchParams.error);
    const provider = asSingleParamValue(resolvedSearchParams.provider);

    const supabase = await createClient();
    const {
        data: { user },
    } = await supabase.auth.getUser();

    if (user) {
        redirect(returnTo);
    }

    return (
        <main className="grid min-h-screen lg:grid-cols-2">
            <section className="relative hidden overflow-hidden bg-gradient-to-br from-[#0F172A] to-[#1E293B] px-12 py-12 text-white lg:block">
                <div className="flex h-full flex-col justify-between">
                    <div className="text-3xl font-black tracking-tight">PlayBid</div>
                    <div className="max-w-md space-y-6">
                        <h2 className="text-4xl font-bold leading-tight">입찰 실무의 새로운 기준</h2>
                        <p className="text-lg text-white/90">나라장터 입찰 데이터 분석 및 모의입찰 플랫폼</p>
                        <ul className="space-y-4 text-base text-white/80">
                            <li>실시간 공고 검색</li>
                            <li>AI 기반 분석</li>
                            <li>모의입찰 시뮬레이션</li>
                        </ul>
                    </div>
                    <p className="text-xs text-white/70">returnTo: {returnTo}</p>
                </div>
            </section>

            <section className="flex items-center justify-center bg-slate-50 px-4 py-8 dark:bg-[#0B1121] sm:px-6">
                <OAuthLoginCard
                    returnTo={returnTo}
                    initialErrorCode={errorCode}
                    initialProvider={provider}
                />
            </section>
        </main>
    );
}
