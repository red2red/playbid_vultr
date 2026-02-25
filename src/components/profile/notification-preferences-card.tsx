'use client';

import { useEffect, useMemo, useState } from 'react';
import { buildLoginRedirectHref, useAuthAction } from '@/hooks/use-auth-action';
import { AuthorizedFetchAuthError, authorizedFetch } from '@/lib/api/authorized-fetch';
import type {
    NotificationPreferencesInfo,
    NotificationPreferencesUpdateInput,
} from '@/lib/bid/profile-types';
import { createClient } from '@/lib/supabase/client';

interface NotificationPreferencesCardProps {
    initialPreferences: NotificationPreferencesInfo;
}

interface PreferenceApiResponse {
    ok?: boolean;
    code?: string;
    message?: string;
    preferences?: NotificationPreferencesInfo;
}

function buildUpdatePayload(
    preferences: NotificationPreferencesInfo
): NotificationPreferencesUpdateInput {
    return {
        pushEnabled: preferences.pushEnabled,
        bidNew: preferences.bidNew,
        bidDeadline: preferences.bidDeadline,
        bidDeadlineOption: preferences.bidDeadlineOption,
        bidResult: preferences.bidResult,
        aiAnalysis: preferences.aiAnalysis,
        levelUp: preferences.levelUp,
        badge: preferences.badge,
        dailyMission: preferences.dailyMission,
        rankingChange: preferences.rankingChange,
        promotion: preferences.promotion,
        appUpdate: preferences.appUpdate,
        quietHoursEnabled: preferences.quietHoursEnabled,
        quietHoursStart: preferences.quietHoursStart,
        quietHoursEnd: preferences.quietHoursEnd,
        weekendEnabled: preferences.weekendEnabled,
    };
}

function ToggleRow({
    label,
    checked,
    disabled,
    onChange,
}: {
    label: string;
    checked: boolean;
    disabled?: boolean;
    onChange: (checked: boolean) => void;
}) {
    return (
        <label className="flex items-center justify-between gap-2 rounded-md bg-slate-100 px-3 py-2 text-sm dark:bg-slate-800">
            <span>{label}</span>
            <input
                type="checkbox"
                checked={checked}
                disabled={disabled}
                onChange={(event) => onChange(event.target.checked)}
                className="h-4 w-4 rounded border-slate-300"
            />
        </label>
    );
}

export function NotificationPreferencesCard({ initialPreferences }: NotificationPreferencesCardProps) {
    const { runWithAuth } = useAuthAction();
    const supabase = useMemo(() => createClient(), []);
    const [preferences, setPreferences] = useState<NotificationPreferencesInfo>(initialPreferences);
    const [isPending, setIsPending] = useState(false);
    const [errorMessage, setErrorMessage] = useState<string | null>(null);
    const [successMessage, setSuccessMessage] = useState<string | null>(null);

    useEffect(() => {
        setPreferences(initialPreferences);
        setIsPending(false);
        setErrorMessage(null);
        setSuccessMessage(null);
    }, [initialPreferences]);

    const isUnavailable = !preferences.hasPreferenceTable;

    const handleSave = async () => {
        if (isPending || isUnavailable) {
            return;
        }

        setErrorMessage(null);
        setSuccessMessage(null);

        await runWithAuth(async () => {
            setIsPending(true);
            try {
                const response = await authorizedFetch('/api/notification-preferences', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({ preferences: buildUpdatePayload(preferences) }),
                }, {
                    refreshSession: async () => supabase.auth.refreshSession(),
                    onAuthFailure: () => {
                        const search = window.location.search.replace(/^\?/, '');
                        window.location.assign(buildLoginRedirectHref(window.location.pathname, search));
                    },
                });

                const payload = (await response.json()) as PreferenceApiResponse;
                if (!response.ok || !payload.ok || !payload.preferences) {
                    setErrorMessage(payload.message ?? '알림 설정 저장에 실패했습니다.');
                    return;
                }

                setPreferences(payload.preferences);
                setSuccessMessage('알림 설정이 저장되었습니다.');
            } catch (error) {
                if (error instanceof AuthorizedFetchAuthError) {
                    return;
                }
                setErrorMessage('네트워크 오류로 저장하지 못했습니다.');
            } finally {
                setIsPending(false);
            }
        });
    };

    return (
        <section className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-700 dark:bg-[#151E32]">
            <h2 className="mb-3 text-base font-semibold">알림 설정</h2>

            {isUnavailable ? (
                <p className="mb-3 rounded-md border border-amber-300 bg-amber-50 px-3 py-2 text-xs text-amber-700 dark:border-amber-900 dark:bg-amber-950/30 dark:text-amber-300">
                    현재 환경에서는 알림 설정 테이블을 찾지 못해 저장 기능이 비활성화되었습니다.
                </p>
            ) : null}

            {errorMessage ? (
                <p className="mb-3 rounded-md border border-rose-300 bg-rose-50 px-3 py-2 text-xs text-rose-700 dark:border-rose-900 dark:bg-rose-950/30 dark:text-rose-300">
                    {errorMessage}
                </p>
            ) : null}

            {successMessage ? (
                <p className="mb-3 rounded-md border border-emerald-300 bg-emerald-50 px-3 py-2 text-xs text-emerald-700 dark:border-emerald-900 dark:bg-emerald-950/30 dark:text-emerald-300">
                    {successMessage}
                </p>
            ) : null}

            <div className="space-y-2">
                <ToggleRow
                    label="푸시 알림"
                    checked={preferences.pushEnabled}
                    disabled={isPending || isUnavailable}
                    onChange={(checked) => setPreferences((prev) => ({ ...prev, pushEnabled: checked }))}
                />
                <ToggleRow
                    label="마감 임박 알림"
                    checked={preferences.bidDeadline}
                    disabled={isPending || isUnavailable}
                    onChange={(checked) => setPreferences((prev) => ({ ...prev, bidDeadline: checked }))}
                />
                <ToggleRow
                    label="개찰 결과 알림"
                    checked={preferences.bidResult}
                    disabled={isPending || isUnavailable}
                    onChange={(checked) => setPreferences((prev) => ({ ...prev, bidResult: checked }))}
                />
                <ToggleRow
                    label="시스템 공지"
                    checked={preferences.appUpdate}
                    disabled={isPending || isUnavailable}
                    onChange={(checked) => setPreferences((prev) => ({ ...prev, appUpdate: checked }))}
                />
                <ToggleRow
                    label="마케팅 수신"
                    checked={preferences.promotion}
                    disabled={isPending || isUnavailable}
                    onChange={(checked) => setPreferences((prev) => ({ ...prev, promotion: checked }))}
                />
                <ToggleRow
                    label="주말 알림"
                    checked={preferences.weekendEnabled}
                    disabled={isPending || isUnavailable}
                    onChange={(checked) => setPreferences((prev) => ({ ...prev, weekendEnabled: checked }))}
                />
            </div>

            <div className="mt-3 rounded-md border border-slate-200 bg-slate-50 px-3 py-3 dark:border-slate-700 dark:bg-slate-900">
                <label className="mb-2 flex items-center justify-between gap-2 text-sm">
                    <span>방해금지 시간</span>
                    <input
                        type="checkbox"
                        checked={preferences.quietHoursEnabled}
                        disabled={isPending || isUnavailable}
                        onChange={(event) =>
                            setPreferences((prev) => ({
                                ...prev,
                                quietHoursEnabled: event.target.checked,
                            }))
                        }
                        className="h-4 w-4 rounded border-slate-300"
                    />
                </label>

                <div className="grid grid-cols-2 gap-2">
                    <input
                        type="time"
                        value={preferences.quietHoursStart}
                        disabled={isPending || isUnavailable || !preferences.quietHoursEnabled}
                        onChange={(event) =>
                            setPreferences((prev) => ({
                                ...prev,
                                quietHoursStart: event.target.value,
                            }))
                        }
                        className="h-9 rounded-md border border-slate-300 bg-white px-2 text-xs dark:border-slate-600 dark:bg-slate-800"
                    />
                    <input
                        type="time"
                        value={preferences.quietHoursEnd}
                        disabled={isPending || isUnavailable || !preferences.quietHoursEnabled}
                        onChange={(event) =>
                            setPreferences((prev) => ({
                                ...prev,
                                quietHoursEnd: event.target.value,
                            }))
                        }
                        className="h-9 rounded-md border border-slate-300 bg-white px-2 text-xs dark:border-slate-600 dark:bg-slate-800"
                    />
                </div>
            </div>

            <button
                type="button"
                disabled={isPending || isUnavailable}
                onClick={() => void handleSave()}
                className="mt-3 inline-flex h-10 w-full items-center justify-center rounded-md bg-blue-600 px-4 text-sm font-semibold text-white hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-60"
            >
                {isPending ? '저장중...' : '설정 저장'}
            </button>
        </section>
    );
}
