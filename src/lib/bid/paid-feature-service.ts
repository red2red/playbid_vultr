import { createClient } from '@/lib/supabase/server';

export type PaidFeatureType =
    | 'ai_report'
    | 'participant_stats'
    | 'similar_rate_stats'
    | 'qualification_calc';

export type PaidPricingMode = 'subscription' | 'points';

export interface ExecutePaidFeatureInput {
    featureType: PaidFeatureType;
    targetId: string;
    pricingMode: PaidPricingMode;
    idempotencyKey: string;
    requestMeta: Record<string, unknown>;
    inputParams: Record<string, unknown>;
}

export interface ExecutePaidFeatureResult {
    executionId: string;
    billingResult: {
        mode: PaidPricingMode;
        consumedUnits: number;
        consumedPoints: number;
    };
    remainingBalance: {
        subscriptionUnits: number | null;
        points: number;
    };
    resultRef: string;
    errorCode: null;
}

export type PaidPlanKey = 'free' | 'pro' | 'business';

interface ExistingExecution {
    id: string;
    status: string;
    resultData: Record<string, unknown> | null;
}

interface PendingExecution {
    id: string;
}

interface FeatureExecutionPayload {
    resultRef: string;
    resultData: Record<string, unknown>;
    modelVersion: string;
}

interface PricingResolution {
    billingMode: PaidPricingMode;
    featureCost: number;
    consumedUnits: number;
    consumedPoints: number;
    subscriptionUnitsRemaining: number | null;
}

export interface PaidFeatureRepository {
    findExecutionByIdempotency(userId: string, idempotencyKey: string): Promise<ExistingExecution | null>;
    findRecentCompletedExecutionByParams(args: {
        userId: string;
        featureType: PaidFeatureType;
        targetId: string;
        pricingMode: PaidPricingMode;
        inputParams: Record<string, unknown>;
        cacheStartIso: string;
    }): Promise<ExistingExecution | null>;
    readPlanKey(userId: string): Promise<PaidPlanKey>;
    countSubscriptionUsageInMonth(userId: string, featureType: PaidFeatureType, monthStartIso: string): Promise<number>;
    createPendingExecution(args: {
        userId: string;
        featureType: PaidFeatureType;
        targetId: string;
        pricingMode: PaidPricingMode;
        idempotencyKey: string;
        cost: number;
        requestMeta: Record<string, unknown>;
        inputParams: Record<string, unknown>;
    }): Promise<PendingExecution>;
    completeExecution(
        executionId: string,
        payload: {
            output: ExecutePaidFeatureResult;
            featureResult: FeatureExecutionPayload;
            requestMeta: Record<string, unknown>;
            inputParams: Record<string, unknown>;
        }
    ): Promise<void>;
    markExecutionFailed(executionId: string, message: string): Promise<void>;
    markExecutionRefunded(executionId: string, message: string): Promise<void>;
    reservePoints(userId: string, amount: number, executionId: string): Promise<number>;
    refundPoints(userId: string, amount: number, executionId: string, reason: string): Promise<number>;
    readPointBalance(userId: string): Promise<number>;
    executeFeature(args: {
        executionId: string;
        featureType: PaidFeatureType;
        targetId: string;
        requestMeta: Record<string, unknown>;
        inputParams: Record<string, unknown>;
    }): Promise<FeatureExecutionPayload>;
}

const FEATURE_POINT_COSTS: Record<PaidFeatureType, number> = {
    ai_report: 300,
    participant_stats: 180,
    similar_rate_stats: 220,
    qualification_calc: 120,
};

const PLAN_ALLOWANCES: Record<'pro' | 'business', Record<PaidFeatureType, number>> = {
    pro: {
        ai_report: 8,
        participant_stats: 20,
        similar_rate_stats: 20,
        qualification_calc: 30,
    },
    business: {
        ai_report: 30,
        participant_stats: 80,
        similar_rate_stats: 80,
        qualification_calc: 120,
    },
};

const REACCESS_CACHE_WINDOW_MS = 24 * 60 * 60 * 1000;

export class PaidFeatureError extends Error {
    readonly code: string;
    readonly status: number;

    constructor(code: string, status: number, message: string) {
        super(message);
        this.code = code;
        this.status = status;
        this.name = 'PaidFeatureError';
    }
}

export class PaidFeatureAuthError extends PaidFeatureError {
    constructor(message = '로그인이 필요합니다.') {
        super('AUTH_REQUIRED', 401, message);
        this.name = 'PaidFeatureAuthError';
    }
}

export class PaidFeaturePlanRequiredError extends PaidFeatureError {
    constructor(message = '구독 또는 포인트가 필요합니다.') {
        super('PLAN_REQUIRED', 403, message);
        this.name = 'PaidFeaturePlanRequiredError';
    }
}

export class PaidFeatureInsufficientPointsError extends PaidFeatureError {
    constructor(message = '포인트가 부족합니다.') {
        super('INSUFFICIENT_POINTS', 402, message);
        this.name = 'PaidFeatureInsufficientPointsError';
    }
}

export class PaidFeatureIdempotencyConflictError extends PaidFeatureError {
    constructor(message = '이미 처리된 요청 키입니다.') {
        super('IDEMPOTENCY_CONFLICT', 409, message);
        this.name = 'PaidFeatureIdempotencyConflictError';
    }
}

export class PaidFeatureExecutionFailedError extends PaidFeatureError {
    constructor(message = '유료 기능 실행에 실패했습니다.') {
        super('EXECUTION_FAILED', 500, message);
        this.name = 'PaidFeatureExecutionFailedError';
    }
}

export class PaidFeatureUnavailableError extends PaidFeatureError {
    constructor(message = '유료 기능 실행 환경이 준비되지 않았습니다.') {
        super('FEATURE_UNAVAILABLE', 503, message);
        this.name = 'PaidFeatureUnavailableError';
    }
}

function toError(value: unknown): PaidFeatureError {
    if (value instanceof PaidFeatureError) {
        return value;
    }

    if (value instanceof Error) {
        return new PaidFeatureExecutionFailedError(value.message);
    }

    return new PaidFeatureExecutionFailedError('알 수 없는 오류가 발생했습니다.');
}

function normalizePlanKey(rawPlan: string | null): PaidPlanKey {
    const plan = rawPlan?.toLowerCase().trim() ?? '';
    if (plan.includes('business')) {
        return 'business';
    }
    if (plan.includes('pro') || plan.includes('premium') || plan.includes('paid')) {
        return 'pro';
    }
    return 'free';
}

function getMonthStartIso(now: Date): string {
    const utc = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 1, 0, 0, 0, 0));
    return utc.toISOString();
}

function getReaccessCacheStartIso(now: Date): string {
    return new Date(now.getTime() - REACCESS_CACHE_WINDOW_MS).toISOString();
}

function getFeatureResultPrefix(featureType: PaidFeatureType): string {
    if (featureType === 'ai_report') {
        return 'ai_reports';
    }
    if (featureType === 'participant_stats') {
        return 'bid_participant_stats';
    }
    if (featureType === 'similar_rate_stats') {
        return 'similar_bid_rate_stats';
    }
    return 'qualification_calculations';
}

function shouldSimulate(requestMeta: Record<string, unknown>, key: string): boolean {
    const value = requestMeta[key];
    return value === true || value === 'true' || value === 1 || value === '1';
}

function extractCachedOutput(resultData: Record<string, unknown> | null): ExecutePaidFeatureResult | null {
    if (!resultData) {
        return null;
    }

    const maybeOutput = resultData.output;
    if (!maybeOutput || typeof maybeOutput !== 'object' || Array.isArray(maybeOutput)) {
        return null;
    }

    const output = maybeOutput as Record<string, unknown>;
    const executionId = typeof output.executionId === 'string' ? output.executionId : null;
    const resultRef = typeof output.resultRef === 'string' ? output.resultRef : null;
    const billing = output.billingResult;
    const remaining = output.remainingBalance;

    if (
        !executionId ||
        !resultRef ||
        !billing ||
        typeof billing !== 'object' ||
        Array.isArray(billing) ||
        !remaining ||
        typeof remaining !== 'object' ||
        Array.isArray(remaining)
    ) {
        return null;
    }

    const billingRecord = billing as Record<string, unknown>;
    const remainingRecord = remaining as Record<string, unknown>;
    const mode = billingRecord.mode;
    const consumedUnits = billingRecord.consumedUnits;
    const consumedPoints = billingRecord.consumedPoints;
    const subscriptionUnits = remainingRecord.subscriptionUnits;
    const points = remainingRecord.points;

    if (mode !== 'subscription' && mode !== 'points') {
        return null;
    }

    if (
        typeof consumedUnits !== 'number' ||
        typeof consumedPoints !== 'number' ||
        typeof points !== 'number'
    ) {
        return null;
    }

    if (subscriptionUnits !== null && typeof subscriptionUnits !== 'number') {
        return null;
    }

    return {
        executionId,
        billingResult: {
            mode,
            consumedUnits,
            consumedPoints,
        },
        remainingBalance: {
            subscriptionUnits,
            points,
        },
        resultRef,
        errorCode: null,
    };
}

async function resolvePricing(
    repository: PaidFeatureRepository,
    args: {
        userId: string;
        featureType: PaidFeatureType;
        pricingMode: PaidPricingMode;
        now: Date;
    }
): Promise<PricingResolution> {
    const { userId, featureType, pricingMode, now } = args;
    const featureCost = FEATURE_POINT_COSTS[featureType];
    if (!featureCost) {
        throw new PaidFeatureExecutionFailedError('지원하지 않는 기능 타입입니다.');
    }

    const planKey = await repository.readPlanKey(userId);
    const allowancePerMonth =
        planKey === 'pro' || planKey === 'business'
            ? PLAN_ALLOWANCES[planKey][featureType]
            : 0;
    const usageCount =
        planKey === 'pro' || planKey === 'business'
            ? await repository.countSubscriptionUsageInMonth(userId, featureType, getMonthStartIso(now))
            : 0;
    const remainingAllowance = allowancePerMonth - usageCount;

    if (pricingMode === 'subscription') {
        if (planKey === 'free') {
            throw new PaidFeaturePlanRequiredError('구독 플랜 사용자만 구독 차감 모드를 사용할 수 있습니다.');
        }
        if (remainingAllowance <= 0) {
            throw new PaidFeaturePlanRequiredError(
                '이번 달 구독 포함량을 모두 사용했습니다. 포인트 모드로 이용해 주세요.'
            );
        }

        return {
            billingMode: 'subscription',
            featureCost,
            consumedUnits: 1,
            consumedPoints: 0,
            subscriptionUnitsRemaining: Math.max(remainingAllowance - 1, 0),
        };
    }

    return {
        billingMode: 'points',
        featureCost,
        consumedUnits: 0,
        consumedPoints: featureCost,
        subscriptionUnitsRemaining:
            planKey === 'free' ? null : Math.max(remainingAllowance, 0),
    };
}

export async function executePaidFeatureWithRepository(
    repository: PaidFeatureRepository,
    params: ExecutePaidFeatureInput & { userId: string; now?: Date }
): Promise<ExecutePaidFeatureResult> {
    const now = params.now ?? new Date();
    const { userId, featureType, targetId, pricingMode, idempotencyKey, requestMeta, inputParams } = params;

    const existing = await repository.findExecutionByIdempotency(userId, idempotencyKey);
    if (existing) {
        if (existing.status === 'completed') {
            const cached = extractCachedOutput(existing.resultData);
            if (cached) {
                return cached;
            }
        }
        throw new PaidFeatureIdempotencyConflictError('동일 idempotency_key 요청이 이미 처리되었습니다.');
    }

    const recentCached = await repository.findRecentCompletedExecutionByParams({
        userId,
        featureType,
        targetId,
        pricingMode,
        inputParams,
        cacheStartIso: getReaccessCacheStartIso(now),
    });
    if (recentCached) {
        const cached = extractCachedOutput(recentCached.resultData);
        if (cached) {
            return cached;
        }
    }

    const pricing = await resolvePricing(repository, {
        userId,
        featureType,
        pricingMode,
        now,
    });

    const pending = await repository.createPendingExecution({
        userId,
        featureType,
        targetId,
        pricingMode: pricing.billingMode,
        idempotencyKey,
        cost: pricing.featureCost,
        requestMeta,
        inputParams,
    });

    let committed = false;
    let compensated = false;
    let pointsCharged = 0;
    let pointsBalanceAfterCharge = await repository.readPointBalance(userId);

    try {
        if (pricing.billingMode === 'points') {
            pointsBalanceAfterCharge = await repository.reservePoints(userId, pricing.consumedPoints, pending.id);
            pointsCharged = pricing.consumedPoints;
        }

        const featureResult = await repository.executeFeature({
            executionId: pending.id,
            featureType,
            targetId,
            requestMeta,
            inputParams,
        });

        const output: ExecutePaidFeatureResult = {
            executionId: pending.id,
            billingResult: {
                mode: pricing.billingMode,
                consumedUnits: pricing.consumedUnits,
                consumedPoints: pricing.consumedPoints,
            },
            remainingBalance: {
                subscriptionUnits: pricing.subscriptionUnitsRemaining,
                points:
                    pricing.billingMode === 'points'
                        ? pointsBalanceAfterCharge
                        : await repository.readPointBalance(userId),
            },
            resultRef: featureResult.resultRef,
            errorCode: null,
        };

        await repository.completeExecution(pending.id, {
            output,
            featureResult,
            requestMeta,
            inputParams,
        });
        committed = true;

        const hasPostCommitFailure =
            shouldSimulate(requestMeta, 'simulatePostCommitFailure') ||
            shouldSimulate(requestMeta, 'simulate_post_commit_failure');

        if (hasPostCommitFailure) {
            if (pointsCharged > 0) {
                await repository.refundPoints(
                    userId,
                    pointsCharged,
                    pending.id,
                    '사후 실패 보상 트랜잭션'
                );
            }
            await repository.markExecutionRefunded(
                pending.id,
                '커밋 이후 오류 감지로 보상 트랜잭션을 수행했습니다.'
            );
            compensated = true;
            throw new PaidFeatureExecutionFailedError(
                '커밋 이후 오류가 감지되어 자동 환불 처리되었습니다.'
            );
        }

        return output;
    } catch (error) {
        const paidError = toError(error);

        if (!committed) {
            if (pointsCharged > 0) {
                try {
                    await repository.refundPoints(
                        userId,
                        pointsCharged,
                        pending.id,
                        '커밋 전 실패 롤백'
                    );
                } catch {
                    // 환불 실패는 원래 오류를 우선 반환하고 상태 기록만 진행한다.
                }
            }

            try {
                if (pointsCharged > 0) {
                    await repository.markExecutionRefunded(
                        pending.id,
                        `실행 실패 롤백: ${paidError.message}`
                    );
                } else {
                    await repository.markExecutionFailed(
                        pending.id,
                        `실행 실패: ${paidError.message}`
                    );
                }
            } catch {
                // 상태 기록 실패는 원래 오류 흐름을 유지한다.
            }
        } else if (!compensated && pointsCharged > 0) {
            try {
                await repository.refundPoints(
                    userId,
                    pointsCharged,
                    pending.id,
                    '커밋 후 예외 보상'
                );
                await repository.markExecutionRefunded(
                    pending.id,
                    `커밋 후 예외 보상 처리: ${paidError.message}`
                );
            } catch {
                // 보상 실패는 로깅 대상이며, 호출자에는 실행 실패를 전달한다.
            }
        }

        throw paidError;
    }
}

function asRecord(value: unknown): Record<string, unknown> | null {
    if (!value || typeof value !== 'object' || Array.isArray(value)) {
        return null;
    }
    return value as Record<string, unknown>;
}

function asString(value: unknown): string | null {
    if (typeof value === 'string') {
        const trimmed = value.trim();
        return trimmed.length > 0 ? trimmed : null;
    }
    if (typeof value === 'number' && Number.isFinite(value)) {
        return String(value);
    }
    return null;
}

function asNumber(value: unknown): number | null {
    if (typeof value === 'number' && Number.isFinite(value)) {
        return value;
    }
    if (typeof value === 'string') {
        const parsed = Number(value);
        if (Number.isFinite(parsed)) {
            return parsed;
        }
    }
    return null;
}

function isMissingRelationError(error: unknown): boolean {
    const record = asRecord(error);
    if (!record) {
        return false;
    }
    const code = asString(record.code);
    if (code === '42P01' || code === '42703') {
        return true;
    }
    const message = asString(record.message)?.toLowerCase();
    return Boolean(message?.includes('does not exist') || message?.includes('relation'));
}

function isUniqueViolationError(error: unknown): boolean {
    const record = asRecord(error);
    return asString(record?.code) === '23505';
}

function parseResultData(value: unknown): Record<string, unknown> | null {
    return asRecord(value);
}

function pickComparableInputParams(value: unknown): Record<string, unknown> | null {
    const inputPayload = asRecord(value);
    if (!inputPayload) {
        return null;
    }
    const nested = asRecord(inputPayload.input_params);
    return nested ?? inputPayload;
}

function stableSerialize(value: unknown): string {
    if (Array.isArray(value)) {
        return `[${value.map((item) => stableSerialize(item)).join(',')}]`;
    }

    if (value && typeof value === 'object') {
        const record = value as Record<string, unknown>;
        const keys = Object.keys(record).sort();
        return `{${keys
            .map((key) => `${JSON.stringify(key)}:${stableSerialize(record[key])}`)
            .join(',')}}`;
    }

    const serialized = JSON.stringify(value);
    return serialized ?? 'null';
}

function parseExecutionRow(value: unknown): ExistingExecution | null {
    const row = asRecord(value);
    if (!row) {
        return null;
    }

    const id = asString(row.id);
    const status = asString(row.status);
    if (!id || !status) {
        return null;
    }

    return {
        id,
        status,
        resultData: parseResultData(row.result_data),
    };
}

function getMockFeatureResult(args: {
    executionId: string;
    featureType: PaidFeatureType;
    targetId: string;
    requestMeta: Record<string, unknown>;
    inputParams: Record<string, unknown>;
}): FeatureExecutionPayload {
    const hasExecutionFailure =
        shouldSimulate(args.requestMeta, 'simulateExecutionFailure') ||
        shouldSimulate(args.requestMeta, 'simulate_execution_failure');

    if (hasExecutionFailure) {
        throw new PaidFeatureExecutionFailedError('기능 실행 단계에서 실패가 발생했습니다.');
    }

    const generatedAt = new Date().toISOString();
    const prefix = getFeatureResultPrefix(args.featureType);
    const resultRef = `${prefix}:${args.targetId}:${args.executionId}`;

    return {
        resultRef,
        modelVersion: 'mock-web-v1',
        resultData: {
            generatedAt,
            featureType: args.featureType,
            targetId: args.targetId,
            summary: 'Mock execution result for web expansion transaction flow.',
            requestMeta: args.requestMeta,
            inputParams: args.inputParams,
        },
    };
}

function createSupabaseRepository() {
    return {
        async findExecutionByIdempotency(userId: string, idempotencyKey: string): Promise<ExistingExecution | null> {
            const supabase = await createClient();
            const { data, error } = await supabase
                .from('paid_feature_executions')
                .select('id,status,result_data')
                .eq('user_id', userId)
                .eq('idempotency_key', idempotencyKey)
                .limit(1);

            if (error) {
                if (isMissingRelationError(error)) {
                    throw new PaidFeatureUnavailableError(
                        'paid_feature_executions 테이블이 없어 유료 기능을 실행할 수 없습니다.'
                    );
                }
                throw new PaidFeatureExecutionFailedError('중복 실행 키 검증에 실패했습니다.');
            }

            if (!data || data.length === 0) {
                return null;
            }

            return parseExecutionRow(data[0]);
        },

        async findRecentCompletedExecutionByParams(args): Promise<ExistingExecution | null> {
            const supabase = await createClient();
            const { data, error } = await supabase
                .from('paid_feature_executions')
                .select('id,status,result_data,input_params,created_at')
                .eq('user_id', args.userId)
                .eq('feature_type', args.featureType)
                .eq('target_id', args.targetId)
                .eq('payment_method', args.pricingMode)
                .eq('status', 'completed')
                .gte('created_at', args.cacheStartIso)
                .order('created_at', { ascending: false })
                .limit(20);

            if (error) {
                if (isMissingRelationError(error)) {
                    throw new PaidFeatureUnavailableError(
                        'paid_feature_executions 테이블이 없어 재접근 캐시를 조회할 수 없습니다.'
                    );
                }
                throw new PaidFeatureExecutionFailedError('최근 실행 이력 조회에 실패했습니다.');
            }

            const requestedInputKey = stableSerialize(args.inputParams);
            for (const item of data ?? []) {
                const row = asRecord(item);
                if (!row) {
                    continue;
                }

                const comparableInput = pickComparableInputParams(row.input_params);
                if (!comparableInput) {
                    continue;
                }

                if (stableSerialize(comparableInput) !== requestedInputKey) {
                    continue;
                }

                const parsed = parseExecutionRow(row);
                if (parsed) {
                    return parsed;
                }
            }

            return null;
        },

        async readPlanKey(userId: string): Promise<PaidPlanKey> {
            const supabase = await createClient();
            const profileRes = await supabase
                .from('profiles')
                .select('subscription')
                .eq('id', userId)
                .limit(1);

            if (profileRes.error && !isMissingRelationError(profileRes.error)) {
                throw new PaidFeatureExecutionFailedError('구독 상태를 확인하지 못했습니다.');
            }

            const profileRow = asRecord(profileRes.data?.[0]);
            const fromProfile = normalizePlanKey(asString(profileRow?.subscription));
            if (fromProfile !== 'free') {
                return fromProfile;
            }

            const userProfileRes = await supabase
                .from('user_profiles')
                .select('preferences')
                .eq('user_id', userId)
                .limit(1);
            const userProfileRow = asRecord(userProfileRes.data?.[0]);
            const preferences = asRecord(userProfileRow?.preferences);
            const fromPreferences = normalizePlanKey(
                asString(preferences?.subscription_plan) ??
                    asString(preferences?.subscription) ??
                    asString(preferences?.plan)
            );
            return fromPreferences;
        },

        async countSubscriptionUsageInMonth(
            userId: string,
            featureType: PaidFeatureType,
            monthStartIso: string
        ): Promise<number> {
            const supabase = await createClient();
            const { count, error } = await supabase
                .from('paid_feature_executions')
                .select('id', { count: 'exact', head: true })
                .eq('user_id', userId)
                .eq('feature_type', featureType)
                .eq('payment_method', 'subscription')
                .eq('status', 'completed')
                .gte('created_at', monthStartIso);

            if (error) {
                if (isMissingRelationError(error)) {
                    throw new PaidFeatureUnavailableError(
                        'paid_feature_executions 테이블이 없어 구독 사용량을 계산할 수 없습니다.'
                    );
                }
                throw new PaidFeatureExecutionFailedError('구독 사용량 조회에 실패했습니다.');
            }

            return count ?? 0;
        },

        async createPendingExecution(args): Promise<PendingExecution> {
            const supabase = await createClient();
            const payload = {
                user_id: args.userId,
                feature_type: args.featureType,
                target_id: args.targetId,
                input_params: {
                    request_meta: args.requestMeta,
                    input_params: args.inputParams,
                },
                result_data: null,
                cost: args.cost,
                payment_method: args.pricingMode,
                model_version: 'mock-web-v1',
                idempotency_key: args.idempotencyKey,
                status: 'pending',
            };

            const { data, error } = await supabase
                .from('paid_feature_executions')
                .insert(payload)
                .select('id')
                .limit(1);

            if (error) {
                if (isUniqueViolationError(error)) {
                    throw new PaidFeatureIdempotencyConflictError(
                        '동일 idempotency_key 요청이 이미 존재합니다.'
                    );
                }
                if (isMissingRelationError(error)) {
                    throw new PaidFeatureUnavailableError(
                        'paid_feature_executions 테이블이 없어 실행 이력을 저장할 수 없습니다.'
                    );
                }
                throw new PaidFeatureExecutionFailedError('실행 이력 생성에 실패했습니다.');
            }

            const id = asString(asRecord(data?.[0])?.id);
            if (!id) {
                throw new PaidFeatureExecutionFailedError('실행 이력 ID를 확인하지 못했습니다.');
            }

            return { id };
        },

        async completeExecution(executionId, payload): Promise<void> {
            const supabase = await createClient();
            const { error } = await supabase
                .from('paid_feature_executions')
                .update({
                    status: 'completed',
                    result_data: {
                        output: payload.output,
                        feature_result: payload.featureResult,
                        request_meta: payload.requestMeta,
                        input_params: payload.inputParams,
                        generated_at: new Date().toISOString(),
                    },
                    completed_at: new Date().toISOString(),
                })
                .eq('id', executionId);

            if (error) {
                throw new PaidFeatureExecutionFailedError('실행 결과 저장 단계에서 실패했습니다.');
            }
        },

        async markExecutionFailed(executionId: string, message: string): Promise<void> {
            const supabase = await createClient();
            await supabase
                .from('paid_feature_executions')
                .update({
                    status: 'failed',
                    result_data: {
                        error: message,
                        updated_at: new Date().toISOString(),
                    },
                    completed_at: new Date().toISOString(),
                })
                .eq('id', executionId);
        },

        async markExecutionRefunded(executionId: string, message: string): Promise<void> {
            const supabase = await createClient();
            await supabase
                .from('paid_feature_executions')
                .update({
                    status: 'refunded',
                    result_data: {
                        compensation: message,
                        updated_at: new Date().toISOString(),
                    },
                    completed_at: new Date().toISOString(),
                })
                .eq('id', executionId);
        },

        async reservePoints(userId: string, amount: number, executionId: string): Promise<number> {
            const supabase = await createClient();

            for (let attempt = 0; attempt < 3; attempt += 1) {
                const { data, error } = await supabase
                    .from('point_wallets')
                    .select('balance')
                    .eq('user_id', userId)
                    .limit(1);

                if (error) {
                    if (isMissingRelationError(error)) {
                        throw new PaidFeatureUnavailableError(
                            'point_wallets 테이블이 없어 포인트 차감을 진행할 수 없습니다.'
                        );
                    }
                    throw new PaidFeatureExecutionFailedError('포인트 잔액 조회에 실패했습니다.');
                }

                const row = asRecord(data?.[0]);
                const currentBalance = asNumber(row?.balance) ?? 0;
                if (currentBalance < amount) {
                    throw new PaidFeatureInsufficientPointsError();
                }

                const nextBalance = currentBalance - amount;
                const updateRes = await supabase
                    .from('point_wallets')
                    .update({
                        balance: nextBalance,
                        updated_at: new Date().toISOString(),
                    })
                    .eq('user_id', userId)
                    .eq('balance', currentBalance)
                    .select('balance')
                    .limit(1);

                if (updateRes.error) {
                    throw new PaidFeatureExecutionFailedError('포인트 차감 중 오류가 발생했습니다.');
                }

                if ((updateRes.data ?? []).length === 0) {
                    continue;
                }

                const finalBalance = asNumber(asRecord(updateRes.data?.[0])?.balance) ?? nextBalance;
                const txRes = await supabase.from('point_transactions').insert({
                    user_id: userId,
                    amount: -amount,
                    transaction_type: 'deduction',
                    reference_id: executionId,
                    description: `유료 기능 실행 차감 (${executionId})`,
                    balance_after: finalBalance,
                });

                if (txRes.error) {
                    if (isMissingRelationError(txRes.error)) {
                        throw new PaidFeatureUnavailableError(
                            'point_transactions 테이블이 없어 포인트 원장 기록을 저장할 수 없습니다.'
                        );
                    }
                    throw new PaidFeatureExecutionFailedError('포인트 원장 기록 저장에 실패했습니다.');
                }

                return finalBalance;
            }

            throw new PaidFeatureExecutionFailedError('포인트 동시성 충돌로 차감에 실패했습니다.');
        },

        async refundPoints(
            userId: string,
            amount: number,
            executionId: string,
            reason: string
        ): Promise<number> {
            const supabase = await createClient();

            for (let attempt = 0; attempt < 3; attempt += 1) {
                const { data, error } = await supabase
                    .from('point_wallets')
                    .select('balance')
                    .eq('user_id', userId)
                    .limit(1);

                if (error) {
                    if (isMissingRelationError(error)) {
                        throw new PaidFeatureUnavailableError(
                            'point_wallets 테이블이 없어 환불 처리를 진행할 수 없습니다.'
                        );
                    }
                    throw new PaidFeatureExecutionFailedError('환불 잔액 조회에 실패했습니다.');
                }

                const row = asRecord(data?.[0]);
                const currentBalance = asNumber(row?.balance) ?? 0;
                const nextBalance = currentBalance + amount;

                const updateRes = await supabase
                    .from('point_wallets')
                    .update({
                        balance: nextBalance,
                        updated_at: new Date().toISOString(),
                    })
                    .eq('user_id', userId)
                    .eq('balance', currentBalance)
                    .select('balance')
                    .limit(1);

                if (updateRes.error) {
                    throw new PaidFeatureExecutionFailedError('환불 잔액 업데이트에 실패했습니다.');
                }

                if ((updateRes.data ?? []).length === 0) {
                    continue;
                }

                const finalBalance = asNumber(asRecord(updateRes.data?.[0])?.balance) ?? nextBalance;
                const txRes = await supabase.from('point_transactions').insert({
                    user_id: userId,
                    amount,
                    transaction_type: 'refund',
                    reference_id: executionId,
                    description: reason,
                    balance_after: finalBalance,
                });

                if (txRes.error) {
                    throw new PaidFeatureExecutionFailedError('환불 원장 기록 저장에 실패했습니다.');
                }

                return finalBalance;
            }

            throw new PaidFeatureExecutionFailedError('환불 동시성 충돌이 발생했습니다.');
        },

        async readPointBalance(userId: string): Promise<number> {
            const supabase = await createClient();
            const { data, error } = await supabase
                .from('point_wallets')
                .select('balance')
                .eq('user_id', userId)
                .limit(1);

            if (error) {
                if (isMissingRelationError(error)) {
                    return 0;
                }
                return 0;
            }

            const row = asRecord(data?.[0]);
            return asNumber(row?.balance) ?? 0;
        },

        async executeFeature(args): Promise<FeatureExecutionPayload> {
            return getMockFeatureResult(args);
        },
    } satisfies PaidFeatureRepository;
}

async function getCurrentUserId(): Promise<string | null> {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

    if (!supabaseUrl || !supabaseAnonKey) {
        return null;
    }

    try {
        const supabase = await createClient();
        const {
            data: { user },
        } = await supabase.auth.getUser();
        return user?.id ?? null;
    } catch {
        return null;
    }
}

export async function executePaidFeatureForCurrentUser(
    input: ExecutePaidFeatureInput
): Promise<ExecutePaidFeatureResult> {
    const userId = await getCurrentUserId();
    if (!userId) {
        throw new PaidFeatureAuthError();
    }

    const repository = createSupabaseRepository();
    return executePaidFeatureWithRepository(repository, {
        ...input,
        userId,
    });
}
