'use client';

import Link from 'next/link';
import { useMemo, useState, useTransition } from 'react';
import { createClient } from '@/lib/supabase/client';
import { buildOAuthBrokerStartUrl } from '@/lib/auth/oauth-broker';
import {
    buildOAuthCallbackUrl,
    getLoginErrorMessage,
    getOAuthProviderLabel,
    type OAuthProviderId,
} from '@/lib/auth/oauth-flow';

interface OAuthButtonDefinition {
    id: OAuthProviderId;
    label: string;
    className: string;
    iconText: string;
    deferred?: boolean;
}

const OAUTH_BUTTONS: OAuthButtonDefinition[] = [
    {
        id: 'apple',
        label: 'Apple로 계속하기',
        className:
            'bg-black text-white hover:bg-black/90 focus-visible:outline-black',
        iconText: 'A',
        deferred: true,
    },
    {
        id: 'google',
        label: 'Google로 계속하기',
        className:
            'border border-[#4285F4] bg-white text-slate-900 hover:bg-slate-50 focus-visible:outline-[#4285F4]',
        iconText: 'G',
    },
    {
        id: 'kakao',
        label: '카카오로 계속하기',
        className:
            'bg-[#FEE500] text-[#191919] hover:bg-[#ffe500] focus-visible:outline-[#191919]',
        iconText: 'K',
    },
    {
        id: 'naver',
        label: '네이버로 계속하기',
        className:
            'bg-[#03C75A] text-white hover:bg-[#02b551] focus-visible:outline-[#03C75A]',
        iconText: 'N',
    },
];

interface OAuthLoginCardProps {
    returnTo: string;
    initialErrorCode?: string | null;
    initialProvider?: string | null;
}

export function OAuthLoginCard({ returnTo, initialErrorCode, initialProvider }: OAuthLoginCardProps) {
    const supabase = useMemo(() => createClient(), []);
    const [currentProvider, setCurrentProvider] = useState<OAuthProviderId | null>(null);
    const [errorMessage, setErrorMessage] = useState<string | null>(
        getLoginErrorMessage(initialErrorCode, initialProvider)
    );
    const [isPending, startTransition] = useTransition();
    const deferredProviders = OAUTH_BUTTONS.filter((provider) => provider.deferred).map((provider) =>
        getOAuthProviderLabel(provider.id)
    );

    const startOAuth = (providerId: OAuthProviderId) => {
        setErrorMessage(null);
        setCurrentProvider(providerId);

        startTransition(async () => {
            if (providerId === 'naver') {
                const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;

                if (!supabaseUrl) {
                    setCurrentProvider(null);
                    setErrorMessage(
                        '네이버 로그인 설정이 올바르지 않습니다. 관리자에게 문의해 주세요.'
                    );
                    return;
                }

                try {
                    const brokerStartUrl = buildOAuthBrokerStartUrl({
                        supabaseUrl,
                        provider: 'naver',
                        webOrigin: window.location.origin,
                        returnTo,
                    });

                    window.location.assign(brokerStartUrl);
                    return;
                } catch (error) {
                    const message = error instanceof Error ? error.message : String(error);
                    setCurrentProvider(null);
                    setErrorMessage(
                        `네이버 로그인 연결에 실패했습니다. ${message}`
                    );
                    return;
                }
            }

            const redirectTo = buildOAuthCallbackUrl(window.location.origin, returnTo, providerId);
            const provider = providerId as Parameters<typeof supabase.auth.signInWithOAuth>[0]['provider'];

            const { error } = await supabase.auth.signInWithOAuth({
                provider,
                options: {
                    redirectTo,
                },
            });

            if (error) {
                setCurrentProvider(null);
                setErrorMessage(
                    `${getOAuthProviderLabel(providerId)} 로그인 연결에 실패했습니다. ${error.message}`
                );
            }
        });
    };

    return (
        <div className="w-full max-w-[420px] rounded-2xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-700 dark:bg-[#151E32]">
            <h1 className="text-3xl font-bold text-slate-900 dark:text-slate-50">로그인</h1>
            <p className="mt-2 text-sm text-slate-600 dark:text-slate-300">PlayBid 계정으로 계속하기</p>

            <div className="mt-6 space-y-3">
                {OAUTH_BUTTONS.map((provider) => {
                    const isDeferred = provider.deferred === true;
                    const loading = !isDeferred && isPending && currentProvider === provider.id;
                    const disabled = isDeferred || isPending;
                    const label = isDeferred ? `${provider.label} (보류)` : provider.label;
                    return (
                        <button
                            key={provider.id}
                            type="button"
                            aria-label={label}
                            disabled={disabled}
                            onClick={() => {
                                if (isDeferred) {
                                    return;
                                }
                                startOAuth(provider.id);
                            }}
                            className={`inline-flex h-12 w-full items-center justify-center gap-3 rounded-xl text-sm font-semibold transition duration-200 ease-out hover:scale-[1.02] hover:shadow-md disabled:cursor-not-allowed disabled:opacity-70 ${provider.className} ${
                                isDeferred ? 'grayscale-[0.25]' : ''
                            }`}
                        >
                            <span
                                aria-hidden="true"
                                className="inline-flex h-6 w-6 items-center justify-center rounded-full border border-current text-xs"
                            >
                                {provider.iconText}
                            </span>
                            {loading ? `${provider.label}...` : label}
                        </button>
                    );
                })}
            </div>
            {deferredProviders.length > 0 ? (
                <p className="mt-2 text-xs text-slate-500 dark:text-slate-400">
                    {deferredProviders.join(', ')} 로그인은 현재 보류 상태입니다.
                </p>
            ) : null}

            <div className="my-5 flex items-center gap-3">
                <div className="h-px flex-1 bg-slate-200 dark:bg-slate-700" />
                <span className="text-xs text-slate-500 dark:text-slate-400">또는</span>
                <div className="h-px flex-1 bg-slate-200 dark:bg-slate-700" />
            </div>

            <Link
                href={returnTo}
                className="inline-flex h-10 items-center justify-center rounded-md px-3 text-sm font-medium text-blue-700 underline-offset-2 transition hover:text-blue-800 hover:underline dark:text-blue-300 dark:hover:text-blue-200"
            >
                둘러보기
            </Link>

            {errorMessage ? (
                <p
                    role="alert"
                    className="mt-4 rounded-md border border-rose-200 bg-rose-50 px-3 py-2 text-xs text-rose-700 dark:border-rose-900/60 dark:bg-rose-950/40 dark:text-rose-200"
                >
                    {errorMessage}
                </p>
            ) : null}

            <p className="mt-5 text-xs text-slate-500 dark:text-slate-400">
                로그인 시 이용약관 및 개인정보처리방침에 동의하게 됩니다.
            </p>
        </div>
    );
}
