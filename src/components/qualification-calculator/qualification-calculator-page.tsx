'use client';

import { useEffect, useMemo, useState } from 'react';
import { useAuthAction } from '@/hooks/use-auth-action';
import {
    calculateQualificationResult,
    createDefaultRuleConfig,
    DEFAULT_SIGNAL_FLAGS,
    QUALIFICATION_CREDIT_RATINGS,
} from '@/lib/bid/qualification-calculator-core';
import type {
    QualificationCalculationInput,
    QualificationCalculationResult,
    QualificationCalculationSavePayload,
    QualificationCalculatorPageData,
    QualificationCategory,
    QualificationReviewMaster,
    QualificationResultStatus,
    QualificationSignalBonusFlags,
} from '@/lib/bid/qualification-calculator-types';

interface QualificationCalculatorPageProps {
    data: QualificationCalculatorPageData;
}

interface HistoryItem {
    id: string;
    createdAt: string | null;
    noticeName: string | null;
    noticeNumber: string | null;
    finalBidRate: number | null;
    targetAmount: number | null;
    status: QualificationResultStatus | null;
    message: string | null;
    source: 'server' | 'local';
}

interface CalculationApiResponse {
    ok?: boolean;
    code?: string;
    message?: string;
    saved?: {
        id?: string | null;
        createdAt?: string | null;
    };
}

interface CalculationHistoryApiResponse {
    ok?: boolean;
    code?: string;
    message?: string;
    history?: Array<{
        id?: string;
        createdAt?: string | null;
        noticeName?: string | null;
        noticeNumber?: string | null;
        finalBidRate?: number | null;
        targetAmount?: number | null;
        status?: QualificationResultStatus | null;
        message?: string | null;
    }>;
}

const LOCAL_HISTORY_KEY = 'playbid.qualification.history.v1';

function getCategoryLabel(category: QualificationCategory): string {
    if (category === 'construction') return '공사';
    if (category === 'service') return '용역';
    return '물품';
}

function parseAmount(value: string): number {
    const normalized = value.replace(/,/g, '').trim();
    if (!normalized) {
        return 0;
    }
    const parsed = Number(normalized);
    return Number.isFinite(parsed) ? parsed : 0;
}

function formatInteger(value: number): string {
    return Math.trunc(value).toLocaleString('ko-KR');
}

function formatAmount(value: number | null): string {
    if (value === null || !Number.isFinite(value)) {
        return '-';
    }
    return `${Math.trunc(value).toLocaleString('ko-KR')}원`;
}

function formatDateTimeLabel(value: string | null): string {
    if (!value) {
        return '-';
    }

    const parsed = new Date(value);
    if (Number.isNaN(parsed.getTime())) {
        return value;
    }

    return new Intl.DateTimeFormat('ko-KR', {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit',
        hour12: false,
    })
        .format(parsed)
        .replace(/\./g, '.')
        .trim();
}

function buildRuleAmountLabel(rule: QualificationReviewMaster): string {
    if (rule.maxAmount === null) {
        return `${formatInteger(rule.minAmount)}원 이상`;
    }
    if (rule.minAmount === 0) {
        return `${formatInteger(rule.maxAmount)}원 미만`;
    }
    return `${formatInteger(rule.minAmount)}원 ~ ${formatInteger(rule.maxAmount)}원`;
}

function getStatusStyle(status: QualificationResultStatus) {
    if (status === 'error') {
        return 'border-rose-200 bg-rose-50 text-rose-700 dark:border-rose-900 dark:bg-rose-950/20 dark:text-rose-300';
    }
    if (status === 'warning') {
        return 'border-amber-200 bg-amber-50 text-amber-700 dark:border-amber-900 dark:bg-amber-950/20 dark:text-amber-300';
    }
    return 'border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-emerald-900 dark:bg-emerald-950/20 dark:text-emerald-300';
}

function mapHistoryItem(
    item: NonNullable<CalculationHistoryApiResponse['history']>[number]
): HistoryItem {
    return {
        id: item.id ?? `${Date.now()}`,
        createdAt: item.createdAt ?? null,
        noticeName: item.noticeName ?? null,
        noticeNumber: item.noticeNumber ?? null,
        finalBidRate: typeof item.finalBidRate === 'number' ? item.finalBidRate : null,
        targetAmount: typeof item.targetAmount === 'number' ? item.targetAmount : null,
        status:
            item.status === 'success' || item.status === 'warning' || item.status === 'error'
                ? item.status
                : null,
        message: item.message ?? null,
        source: 'server',
    };
}

function readLocalHistory(): HistoryItem[] {
    try {
        const raw = localStorage.getItem(LOCAL_HISTORY_KEY);
        if (!raw) {
            return [];
        }
        const parsed = JSON.parse(raw);
        if (!Array.isArray(parsed)) {
            return [];
        }

        const mapped = parsed.map((item): HistoryItem | null => {
            if (!item || typeof item !== 'object') {
                return null;
            }
            const record = item as Record<string, unknown>;
            const status = record.status;

            return {
                id: typeof record.id === 'string' ? record.id : `${Date.now()}`,
                createdAt: typeof record.createdAt === 'string' ? record.createdAt : null,
                noticeName: typeof record.noticeName === 'string' ? record.noticeName : null,
                noticeNumber: typeof record.noticeNumber === 'string' ? record.noticeNumber : null,
                finalBidRate:
                    typeof record.finalBidRate === 'number' && Number.isFinite(record.finalBidRate)
                        ? record.finalBidRate
                        : null,
                targetAmount:
                    typeof record.targetAmount === 'number' && Number.isFinite(record.targetAmount)
                        ? record.targetAmount
                        : null,
                status: status === 'success' || status === 'warning' || status === 'error' ? status : null,
                message: typeof record.message === 'string' ? record.message : null,
                source: 'local',
            };
        });

        return mapped.filter((item): item is HistoryItem => item !== null);
    } catch {
        return [];
    }
}

function writeLocalHistory(items: HistoryItem[]) {
    try {
        localStorage.setItem(LOCAL_HISTORY_KEY, JSON.stringify(items.slice(0, 10)));
    } catch {
        // localStorage가 불가능한 환경에서는 무시한다.
    }
}

export function QualificationCalculatorPage({ data }: QualificationCalculatorPageProps) {
    const { runWithAuth } = useAuthAction();
    const [selectedCategory, setSelectedCategory] = useState<QualificationCategory>(data.prefill.category);
    const [selectedRuleId, setSelectedRuleId] = useState<string | null>(data.selectedRuleId);
    const [baseAmountInput, setBaseAmountInput] = useState(
        data.prefill.baseAmount && data.prefill.baseAmount > 0 ? formatInteger(data.prefill.baseAmount) : ''
    );
    const [aValueInput, setAValueInput] = useState(
        data.prefill.aValue && data.prefill.aValue > 0 ? formatInteger(data.prefill.aValue) : ''
    );
    const [performanceAmountInput, setPerformanceAmountInput] = useState('');
    const [creditRatingCode, setCreditRatingCode] = useState('B+');
    const [techScore, setTechScore] = useState(0);
    const [disqualificationScore, setDisqualificationScore] = useState(0);
    const [signalFlags, setSignalFlags] = useState<QualificationSignalBonusFlags>(DEFAULT_SIGNAL_FLAGS);
    const [isSaving, setIsSaving] = useState(false);
    const [saveMessage, setSaveMessage] = useState<string | null>(null);
    const [saveError, setSaveError] = useState<string | null>(null);
    const [serverHistory, setServerHistory] = useState<HistoryItem[]>([]);
    const [localHistory, setLocalHistory] = useState<HistoryItem[]>([]);
    const [isHistoryLoading, setIsHistoryLoading] = useState(false);
    const [historyInfoMessage, setHistoryInfoMessage] = useState<string | null>(null);

    const filteredRules = useMemo(
        () =>
            data.availableRules.filter((rule) => {
                if (selectedCategory === 'goods') {
                    return (
                        rule.category.toLowerCase() === 'goods' ||
                        rule.category.toLowerCase() === 'purchase'
                    );
                }
                return rule.category.toLowerCase() === selectedCategory;
            }),
        [data.availableRules, selectedCategory]
    );

    const selectedRule = useMemo(
        () => filteredRules.find((rule) => rule.id === selectedRuleId) ?? null,
        [filteredRules, selectedRuleId]
    );

    const creditRatingScore = useMemo(() => {
        const found = QUALIFICATION_CREDIT_RATINGS.find((item) => item.code === creditRatingCode);
        return found?.score ?? 19.0;
    }, [creditRatingCode]);

    const effectiveRuleConfig = selectedRule?.ruleConfig ?? createDefaultRuleConfig(selectedCategory);
    const techScoreMax = Math.max(0, effectiveRuleConfig.techScore);

    const calculationInput = useMemo(
        () =>
            ({
                category: selectedCategory,
                customLowerLimit: data.prefill.lowerLimit,
                baseAmount: parseAmount(baseAmountInput) > 0 ? parseAmount(baseAmountInput) : null,
                aValue: parseAmount(aValueInput),
                performanceAmount: parseAmount(performanceAmountInput),
                creditRatingScore,
                techScore,
                disqualificationScore,
                signalFlags,
                selectedRuleConfig: selectedRule?.ruleConfig ?? null,
            }) satisfies QualificationCalculationInput,
        [
            selectedCategory,
            data.prefill.lowerLimit,
            baseAmountInput,
            aValueInput,
            performanceAmountInput,
            creditRatingScore,
            techScore,
            disqualificationScore,
            signalFlags,
            selectedRule,
        ]
    );

    const calculationResult = useMemo(
        () => calculateQualificationResult(calculationInput),
        [calculationInput]
    );

    const visibleHistory = serverHistory.length > 0 ? serverHistory : localHistory;

    useEffect(() => {
        setLocalHistory(readLocalHistory());
    }, []);

    useEffect(() => {
        if (filteredRules.length === 0) {
            setSelectedRuleId(null);
            return;
        }

        const exists = filteredRules.some((rule) => rule.id === selectedRuleId);
        if (!exists) {
            setSelectedRuleId(filteredRules[0].id);
        }
    }, [filteredRules, selectedRuleId]);

    useEffect(() => {
        if (techScore > techScoreMax) {
            setTechScore(techScoreMax);
        }
    }, [techScore, techScoreMax]);

    const pushLocalHistory = (result: QualificationCalculationResult) => {
        const next: HistoryItem = {
            id: `local-${Date.now()}`,
            createdAt: new Date().toISOString(),
            noticeName: data.prefill.noticeName,
            noticeNumber: data.prefill.noticeNumber,
            finalBidRate: result.finalBidRate,
            targetAmount: result.targetAmount,
            status: result.status,
            message: result.message,
            source: 'local',
        };

        setLocalHistory((prev) => {
            const updated = [next, ...prev].slice(0, 10);
            writeLocalHistory(updated);
            return updated;
        });
    };

    const loadServerHistory = async () => {
        setIsHistoryLoading(true);
        setHistoryInfoMessage(null);

        try {
            const response = await fetch('/api/qualification-calculations', {
                method: 'GET',
                cache: 'no-store',
            });

            const payload = (await response.json()) as CalculationHistoryApiResponse;
            if (!response.ok || !payload.ok) {
                if (payload.code === 'FEATURE_UNAVAILABLE') {
                    setHistoryInfoMessage(
                        '서버 저장소가 아직 준비되지 않아 브라우저 로컬 이력만 제공합니다.'
                    );
                    return;
                }
                setHistoryInfoMessage(payload.message ?? '저장 이력을 불러오지 못했습니다.');
                return;
            }

            const history = Array.isArray(payload.history) ? payload.history.map(mapHistoryItem) : [];
            setServerHistory(history);
            setHistoryInfoMessage(history.length === 0 ? '저장된 서버 이력이 없습니다.' : null);
        } catch {
            setHistoryInfoMessage('네트워크 오류로 저장 이력을 확인하지 못했습니다.');
        } finally {
            setIsHistoryLoading(false);
        }
    };

    const handleSave = async () => {
        if (isSaving) {
            return;
        }

        setSaveMessage(null);
        setSaveError(null);

        await runWithAuth(async () => {
            setIsSaving(true);

            try {
                const payload: QualificationCalculationSavePayload = {
                    noticeId: data.prefill.noticeId,
                    noticeNumber: data.prefill.noticeNumber,
                    category: selectedCategory,
                    reviewMasterId: selectedRule?.id ?? null,
                    input: calculationInput,
                    result: calculationResult,
                };

                const response = await fetch('/api/qualification-calculations', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify(payload),
                });

                const responsePayload = (await response.json()) as CalculationApiResponse;
                pushLocalHistory(calculationResult);

                if (!response.ok || !responsePayload.ok) {
                    if (responsePayload.code === 'FEATURE_UNAVAILABLE') {
                        setSaveMessage('서버 저장소 미지원 상태입니다. 현재 브라우저에만 저장했습니다.');
                    } else {
                        setSaveError(responsePayload.message ?? '저장 중 오류가 발생했습니다.');
                    }
                    return;
                }

                setSaveMessage('계산 결과를 저장했습니다.');
                await loadServerHistory();
            } catch {
                pushLocalHistory(calculationResult);
                setSaveError('네트워크 오류로 서버 저장에 실패했습니다. 브라우저에 임시 저장했습니다.');
            } finally {
                setIsSaving(false);
            }
        });
    };

    return (
        <main className="min-h-screen bg-slate-50 px-4 py-6 text-slate-900 md:px-6 lg:px-8 dark:bg-[#0B1121] dark:text-slate-100">
            <div className="mx-auto max-w-[1120px] space-y-4">
                <header className="rounded-xl border border-slate-200 bg-white px-6 py-5 shadow-sm dark:border-slate-700 dark:bg-[#151E32]">
                    <div className="mb-1 text-sm text-slate-500 dark:text-slate-400">홈 &gt; 적격심사 계산기</div>
                    <h1 className="text-2xl font-bold">적격심사 계산기</h1>
                    <p className="mt-2 text-sm text-slate-600 dark:text-slate-300">{data.prefill.noticeName}</p>
                    {data.prefill.noticeNumber ? (
                        <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
                            공고번호: {data.prefill.noticeNumber}
                        </p>
                    ) : null}
                </header>

                <section className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-700 dark:bg-[#151E32]">
                    <h2 className="text-lg font-semibold">심사 기준</h2>
                    <div className="mt-3 grid grid-cols-1 gap-3 md:grid-cols-[1fr_2fr]">
                        <div className="grid grid-cols-3 gap-2">
                            {(['construction', 'service', 'goods'] as QualificationCategory[]).map((category) => (
                                <button
                                    key={category}
                                    type="button"
                                    onClick={() => setSelectedCategory(category)}
                                    className={`h-10 rounded-md text-sm font-semibold ${
                                        selectedCategory === category
                                            ? 'bg-blue-600 text-white'
                                            : 'border border-slate-300 bg-white text-slate-700 hover:bg-slate-50 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-100'
                                    }`}
                                >
                                    {getCategoryLabel(category)}
                                </button>
                            ))}
                        </div>
                        <select
                            value={selectedRuleId ?? ''}
                            onChange={(event) => setSelectedRuleId(event.target.value || null)}
                            className="h-10 rounded-md border border-slate-300 bg-white px-3 text-sm dark:border-slate-600 dark:bg-slate-800"
                        >
                            {filteredRules.length === 0 ? (
                                <option value="">등록된 DB 심사기준 없음 (기본값 사용)</option>
                            ) : null}
                            {filteredRules.map((rule) => (
                                <option key={rule.id} value={rule.id}>
                                    {rule.agencyName} · {rule.reviewName} · {buildRuleAmountLabel(rule)}
                                </option>
                            ))}
                        </select>
                    </div>
                </section>

                <section className="grid grid-cols-1 gap-4 lg:grid-cols-2">
                    <article className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-700 dark:bg-[#151E32]">
                        <h2 className="text-lg font-semibold">입력값</h2>
                        <div className="mt-3 space-y-3">
                            <label className="block">
                                <span className="mb-1 block text-xs text-slate-500">기초금액(예정가격)</span>
                                <input
                                    value={baseAmountInput}
                                    onChange={(event) => setBaseAmountInput(event.target.value)}
                                    onBlur={() => {
                                        const amount = parseAmount(baseAmountInput);
                                        setBaseAmountInput(amount > 0 ? formatInteger(amount) : '');
                                    }}
                                    placeholder="금액 입력"
                                    className="h-10 w-full rounded-md border border-slate-300 bg-white px-3 text-sm dark:border-slate-600 dark:bg-slate-800"
                                />
                            </label>

                            <label className="block">
                                <span className="mb-1 block text-xs text-slate-500">A값</span>
                                <input
                                    value={aValueInput}
                                    onChange={(event) => setAValueInput(event.target.value)}
                                    onBlur={() => {
                                        const amount = parseAmount(aValueInput);
                                        setAValueInput(amount > 0 ? formatInteger(amount) : '');
                                    }}
                                    placeholder="공사 공고일 때 입력"
                                    disabled={selectedCategory !== 'construction'}
                                    className="h-10 w-full rounded-md border border-slate-300 bg-white px-3 text-sm disabled:cursor-not-allowed disabled:opacity-60 dark:border-slate-600 dark:bg-slate-800"
                                />
                            </label>

                            <label className="block">
                                <span className="mb-1 block text-xs text-slate-500">보유 실적 금액</span>
                                <input
                                    value={performanceAmountInput}
                                    onChange={(event) => setPerformanceAmountInput(event.target.value)}
                                    onBlur={() => {
                                        const amount = parseAmount(performanceAmountInput);
                                        setPerformanceAmountInput(amount > 0 ? formatInteger(amount) : '');
                                    }}
                                    placeholder="최근 3년/5년 실적"
                                    className="h-10 w-full rounded-md border border-slate-300 bg-white px-3 text-sm dark:border-slate-600 dark:bg-slate-800"
                                />
                            </label>

                            <label className="block">
                                <span className="mb-1 block text-xs text-slate-500">신용등급</span>
                                <select
                                    value={creditRatingCode}
                                    onChange={(event) => setCreditRatingCode(event.target.value)}
                                    className="h-10 w-full rounded-md border border-slate-300 bg-white px-3 text-sm dark:border-slate-600 dark:bg-slate-800"
                                >
                                    {QUALIFICATION_CREDIT_RATINGS.map((option) => (
                                        <option key={option.code} value={option.code}>
                                            {option.code} ({option.score.toFixed(1)}점)
                                        </option>
                                    ))}
                                </select>
                            </label>
                        </div>
                    </article>

                    <article className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-700 dark:bg-[#151E32]">
                        <h2 className="text-lg font-semibold">가점/감점</h2>
                        <div className="mt-3 space-y-3">
                            <label className="block">
                                <span className="mb-1 block text-xs text-slate-500">
                                    기술능력 점수 (최대 {techScoreMax.toFixed(1)})
                                </span>
                                <input
                                    type="number"
                                    min={0}
                                    max={techScoreMax}
                                    step={0.1}
                                    value={techScore}
                                    onChange={(event) => {
                                        const next = Number(event.target.value);
                                        if (!Number.isFinite(next)) return;
                                        setTechScore(Math.max(0, Math.min(next, techScoreMax)));
                                    }}
                                    className="h-10 w-full rounded-md border border-slate-300 bg-white px-3 text-sm dark:border-slate-600 dark:bg-slate-800"
                                />
                            </label>

                            <label className="block">
                                <span className="mb-1 block text-xs text-slate-500">결격 감점 ({disqualificationScore.toFixed(1)}점)</span>
                                <input
                                    type="range"
                                    min={0}
                                    max={10}
                                    step={0.5}
                                    value={disqualificationScore}
                                    onChange={(event) => setDisqualificationScore(Number(event.target.value))}
                                    className="w-full"
                                />
                            </label>

                            <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
                                <label className="flex items-center gap-2 rounded-md bg-slate-100 px-3 py-2 text-sm dark:bg-slate-800">
                                    <input
                                        type="checkbox"
                                        checked={signalFlags.womanEnterprise}
                                        onChange={(event) =>
                                            setSignalFlags((prev) => ({
                                                ...prev,
                                                womanEnterprise: event.target.checked,
                                            }))
                                        }
                                    />
                                    여성기업
                                </label>
                                <label className="flex items-center gap-2 rounded-md bg-slate-100 px-3 py-2 text-sm dark:bg-slate-800">
                                    <input
                                        type="checkbox"
                                        checked={signalFlags.disabledEnterprise}
                                        onChange={(event) =>
                                            setSignalFlags((prev) => ({
                                                ...prev,
                                                disabledEnterprise: event.target.checked,
                                            }))
                                        }
                                    />
                                    장애인기업
                                </label>
                                <label className="flex items-center gap-2 rounded-md bg-slate-100 px-3 py-2 text-sm dark:bg-slate-800">
                                    <input
                                        type="checkbox"
                                        checked={signalFlags.socialEnterprise}
                                        onChange={(event) =>
                                            setSignalFlags((prev) => ({
                                                ...prev,
                                                socialEnterprise: event.target.checked,
                                            }))
                                        }
                                    />
                                    사회적기업
                                </label>
                                <label className="flex items-center gap-2 rounded-md bg-slate-100 px-3 py-2 text-sm dark:bg-slate-800">
                                    <input
                                        type="checkbox"
                                        checked={signalFlags.jobCreation}
                                        onChange={(event) =>
                                            setSignalFlags((prev) => ({
                                                ...prev,
                                                jobCreation: event.target.checked,
                                            }))
                                        }
                                    />
                                    일자리창출
                                </label>
                                <label className="flex items-center gap-2 rounded-md bg-slate-100 px-3 py-2 text-sm dark:bg-slate-800 sm:col-span-2">
                                    <input
                                        type="checkbox"
                                        checked={signalFlags.smallEnterprise}
                                        onChange={(event) =>
                                            setSignalFlags((prev) => ({
                                                ...prev,
                                                smallEnterprise: event.target.checked,
                                            }))
                                        }
                                    />
                                    중소기업
                                </label>
                            </div>
                        </div>
                    </article>
                </section>

                <section className={`rounded-xl border p-5 shadow-sm ${getStatusStyle(calculationResult.status)}`}>
                    <h2 className="text-lg font-semibold">계산 결과</h2>
                    <p className="mt-3 whitespace-pre-line text-sm">{calculationResult.message}</p>
                    <div className="mt-4 grid grid-cols-1 gap-2 text-sm md:grid-cols-2">
                        <div className="rounded-md bg-white/70 px-3 py-2 dark:bg-slate-900/40">
                            수행능력: <span className="font-semibold">{calculationResult.capabilityScore.toFixed(1)}점</span>
                        </div>
                        <div className="rounded-md bg-white/70 px-3 py-2 dark:bg-slate-900/40">
                            신인도: <span className="font-semibold">{calculationResult.signalScore.toFixed(1)}점</span>
                        </div>
                        <div className="rounded-md bg-white/70 px-3 py-2 dark:bg-slate-900/40">
                            필요 가격점수:{' '}
                            <span className="font-semibold">
                                {calculationResult.requiredPriceScore.toFixed(1)}점 / {calculationResult.priceMaxScore.toFixed(1)}점
                            </span>
                        </div>
                        <div className="rounded-md bg-white/70 px-3 py-2 dark:bg-slate-900/40">
                            적용 하한율: <span className="font-semibold">{calculationResult.effectiveLowerLimit.toFixed(3)}%</span>
                        </div>
                        <div className="rounded-md bg-white/70 px-3 py-2 dark:bg-slate-900/40">
                            목표 투찰률: <span className="font-semibold">{calculationResult.finalBidRate.toFixed(5)}%</span>
                        </div>
                        <div className="rounded-md bg-white/70 px-3 py-2 dark:bg-slate-900/40">
                            목표 투찰금액: <span className="font-semibold">{formatAmount(calculationResult.targetAmount)}</span>
                        </div>
                    </div>
                </section>

                <section className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-700 dark:bg-[#151E32]">
                    <div className="flex flex-wrap items-center gap-2">
                        <button
                            type="button"
                            onClick={() => void handleSave()}
                            disabled={isSaving}
                            className="inline-flex h-10 items-center rounded-md bg-blue-600 px-4 text-sm font-semibold text-white hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-60"
                        >
                            {isSaving ? '저장중...' : '계산 결과 저장'}
                        </button>
                        <button
                            type="button"
                            onClick={() => void runWithAuth(loadServerHistory)}
                            disabled={isHistoryLoading}
                            className="inline-flex h-10 items-center rounded-md border border-slate-300 bg-white px-4 text-sm font-semibold text-slate-700 hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-60 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-100 dark:hover:bg-slate-700"
                        >
                            {isHistoryLoading ? '조회중...' : '저장 이력 조회'}
                        </button>
                    </div>

                    {saveMessage ? (
                        <p className="mt-3 rounded-md border border-emerald-200 bg-emerald-50 px-3 py-2 text-xs text-emerald-700 dark:border-emerald-900 dark:bg-emerald-950/20 dark:text-emerald-300">
                            {saveMessage}
                        </p>
                    ) : null}
                    {saveError ? (
                        <p className="mt-3 rounded-md border border-rose-200 bg-rose-50 px-3 py-2 text-xs text-rose-700 dark:border-rose-900 dark:bg-rose-950/20 dark:text-rose-300">
                            {saveError}
                        </p>
                    ) : null}
                    {historyInfoMessage ? (
                        <p className="mt-3 rounded-md border border-amber-200 bg-amber-50 px-3 py-2 text-xs text-amber-700 dark:border-amber-900 dark:bg-amber-950/20 dark:text-amber-300">
                            {historyInfoMessage}
                        </p>
                    ) : null}

                    <div className="mt-4 space-y-2">
                        <h3 className="text-sm font-semibold">최근 저장 이력</h3>
                        {visibleHistory.length === 0 ? (
                            <p className="text-xs text-slate-500 dark:text-slate-400">
                                아직 저장된 계산 이력이 없습니다.
                            </p>
                        ) : (
                            <ul className="space-y-2">
                                {visibleHistory.slice(0, 5).map((item) => (
                                    <li
                                        key={item.id}
                                        className="rounded-md border border-slate-200 bg-slate-50 px-3 py-2 text-xs dark:border-slate-700 dark:bg-slate-900"
                                    >
                                        <div className="flex flex-wrap items-center justify-between gap-2">
                                            <span className="font-semibold">
                                                {item.noticeName ?? data.prefill.noticeName}
                                            </span>
                                            <span className="text-slate-500 dark:text-slate-400">
                                                {formatDateTimeLabel(item.createdAt)}
                                            </span>
                                        </div>
                                        <div className="mt-1 flex flex-wrap gap-3 text-slate-600 dark:text-slate-300">
                                            <span>투찰률 {item.finalBidRate?.toFixed(5) ?? '-'}%</span>
                                            <span>투찰금액 {formatAmount(item.targetAmount)}</span>
                                            <span>{item.source === 'server' ? '서버저장' : '로컬저장'}</span>
                                        </div>
                                    </li>
                                ))}
                            </ul>
                        )}
                    </div>
                </section>
            </div>
        </main>
    );
}
