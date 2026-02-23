import {
    executePaidFeatureWithRepository,
    type ExecutePaidFeatureInput,
    type ExecutePaidFeatureResult,
    type PaidFeatureRepository,
    PaidFeatureExecutionFailedError,
    PaidFeatureIdempotencyConflictError,
    PaidFeatureInsufficientPointsError,
} from './paid-feature-service';

function stableSerializeForTest(value: unknown): string {
    if (Array.isArray(value)) {
        return `[${value.map((item) => stableSerializeForTest(item)).join(',')}]`;
    }

    if (value && typeof value === 'object') {
        const record = value as Record<string, unknown>;
        const keys = Object.keys(record).sort();
        return `{${keys
            .map((key) => `${JSON.stringify(key)}:${stableSerializeForTest(record[key])}`)
            .join(',')}}`;
    }

    const serialized = JSON.stringify(value);
    return serialized ?? 'null';
}

class InMemoryPaidFeatureRepository implements PaidFeatureRepository {
    pointBalance = 1000;
    plan: 'free' | 'pro' | 'business' = 'pro';
    usageCount = 0;
    nextExecutionId = 1;
    executions = new Map<
        string,
        {
            id: string;
            status: string;
            resultData: Record<string, unknown> | null;
            idempotencyKey: string;
            userId: string;
            featureType: 'ai_report' | 'participant_stats' | 'similar_rate_stats' | 'qualification_calc';
            targetId: string;
            pricingMode: 'subscription' | 'points';
            inputParams: Record<string, unknown>;
            createdAt: string;
        }
    >();
    pointTransactions: Array<{ type: string; amount: number; executionId: string }> = [];

    async findExecutionByIdempotency(userId: string, idempotencyKey: string) {
        const found = [...this.executions.values()].find(
            (item) => item.userId === userId && item.idempotencyKey === idempotencyKey
        );
        if (!found) {
            return null;
        }
        return {
            id: found.id,
            status: found.status,
            resultData: found.resultData,
        };
    }

    async findRecentCompletedExecutionByParams(args: {
        userId: string;
        featureType: 'ai_report' | 'participant_stats' | 'similar_rate_stats' | 'qualification_calc';
        targetId: string;
        pricingMode: 'subscription' | 'points';
        inputParams: Record<string, unknown>;
        cacheStartIso: string;
    }) {
        const requestedKey = stableSerializeForTest(args.inputParams);
        const matched = [...this.executions.values()]
            .filter(
                (item) =>
                    item.userId === args.userId &&
                    item.status === 'completed' &&
                    item.featureType === args.featureType &&
                    item.targetId === args.targetId &&
                    item.pricingMode === args.pricingMode &&
                    item.createdAt >= args.cacheStartIso &&
                    stableSerializeForTest(item.inputParams) === requestedKey
            )
            .sort((a, b) => b.createdAt.localeCompare(a.createdAt))[0];

        if (!matched) {
            return null;
        }

        return {
            id: matched.id,
            status: matched.status,
            resultData: matched.resultData,
        };
    }

    async readPlanKey() {
        return this.plan;
    }

    async countSubscriptionUsageInMonth() {
        return this.usageCount;
    }

    async createPendingExecution(args: {
        userId: string;
        featureType: 'ai_report' | 'participant_stats' | 'similar_rate_stats' | 'qualification_calc';
        targetId: string;
        pricingMode: 'subscription' | 'points';
        idempotencyKey: string;
        inputParams: Record<string, unknown>;
    }) {
        const id = `exec-${this.nextExecutionId++}`;
        this.executions.set(id, {
            id,
            status: 'pending',
            resultData: null,
            idempotencyKey: args.idempotencyKey,
            userId: args.userId,
            featureType: args.featureType,
            targetId: args.targetId,
            pricingMode: args.pricingMode,
            inputParams: args.inputParams,
            createdAt: new Date().toISOString(),
        });
        return { id };
    }

    async completeExecution(
        executionId: string,
        payload: { output: ExecutePaidFeatureResult; featureResult: { resultRef: string } }
    ) {
        const found = this.executions.get(executionId);
        if (!found) throw new Error('execution not found');
        found.status = 'completed';
        found.resultData = {
            output: payload.output,
            result_ref: payload.featureResult.resultRef,
        };
    }

    async markExecutionFailed(executionId: string) {
        const found = this.executions.get(executionId);
        if (!found) return;
        found.status = 'failed';
    }

    async markExecutionRefunded(executionId: string) {
        const found = this.executions.get(executionId);
        if (!found) return;
        found.status = 'refunded';
    }

    async reservePoints(_: string, amount: number, executionId: string) {
        if (this.pointBalance < amount) {
            throw new PaidFeatureInsufficientPointsError();
        }
        this.pointBalance -= amount;
        this.pointTransactions.push({
            type: 'deduction',
            amount: -amount,
            executionId,
        });
        return this.pointBalance;
    }

    async refundPoints(_: string, amount: number, executionId: string) {
        this.pointBalance += amount;
        this.pointTransactions.push({
            type: 'refund',
            amount,
            executionId,
        });
        return this.pointBalance;
    }

    async readPointBalance() {
        return this.pointBalance;
    }

    async executeFeature(args: {
        executionId: string;
        requestMeta: Record<string, unknown>;
        targetId: string;
        featureType: 'ai_report' | 'participant_stats' | 'similar_rate_stats' | 'qualification_calc';
    }) {
        if (args.requestMeta.simulateExecutionFailure === true) {
            throw new PaidFeatureExecutionFailedError('execution failed');
        }
        return {
            resultRef: `mock:${args.featureType}:${args.targetId}:${args.executionId}`,
            modelVersion: 'mock',
            resultData: {},
        };
    }
}

function makeInput(overrides: Partial<ExecutePaidFeatureInput> = {}): ExecutePaidFeatureInput {
    return {
        featureType: 'ai_report',
        targetId: 'notice-1',
        pricingMode: 'points',
        idempotencyKey: `idem-${Math.random().toString(36).slice(2, 8)}`,
        requestMeta: {},
        inputParams: {},
        ...overrides,
    };
}

describe('executePaidFeatureWithRepository', () => {
    it('포인트 모드 성공 시 차감 후 완료 상태를 남긴다', async () => {
        const repo = new InMemoryPaidFeatureRepository();
        repo.pointBalance = 1000;

        const output = await executePaidFeatureWithRepository(repo, {
            userId: 'user-1',
            ...makeInput({
                pricingMode: 'points',
                featureType: 'qualification_calc',
            }),
        });

        expect(output.billingResult.mode).toBe('points');
        expect(output.billingResult.consumedPoints).toBe(120);
        expect(repo.pointBalance).toBe(880);
        expect([...repo.executions.values()][0]?.status).toBe('completed');
    });

    it('커밋 전 실패 시 차감분을 롤백한다', async () => {
        const repo = new InMemoryPaidFeatureRepository();
        repo.pointBalance = 500;

        await expect(
            executePaidFeatureWithRepository(repo, {
                userId: 'user-1',
                ...makeInput({
                    requestMeta: {
                        simulateExecutionFailure: true,
                    },
                }),
            })
        ).rejects.toThrow(PaidFeatureExecutionFailedError);

        expect(repo.pointBalance).toBe(500);
        expect(repo.pointTransactions.map((item) => item.type)).toEqual(['deduction', 'refund']);
        expect([...repo.executions.values()][0]?.status).toBe('refunded');
    });

    it('커밋 후 실패가 감지되면 보상 트랜잭션을 수행한다', async () => {
        const repo = new InMemoryPaidFeatureRepository();
        repo.pointBalance = 1000;

        await expect(
            executePaidFeatureWithRepository(repo, {
                userId: 'user-1',
                ...makeInput({
                    requestMeta: {
                        simulatePostCommitFailure: true,
                    },
                    featureType: 'participant_stats',
                }),
            })
        ).rejects.toThrow(PaidFeatureExecutionFailedError);

        expect(repo.pointBalance).toBe(1000);
        expect(repo.pointTransactions.map((item) => item.type)).toEqual(['deduction', 'refund']);
        expect([...repo.executions.values()][0]?.status).toBe('refunded');
    });

    it('같은 idempotency_key가 완료 상태면 캐시 결과를 반환한다', async () => {
        const repo = new InMemoryPaidFeatureRepository();
        const sharedKey = 'idem-same';
        const input = makeInput({
            idempotencyKey: sharedKey,
            featureType: 'qualification_calc',
        });

        const first = await executePaidFeatureWithRepository(repo, {
            userId: 'user-1',
            ...input,
        });
        const second = await executePaidFeatureWithRepository(repo, {
            userId: 'user-1',
            ...input,
        });

        expect(second).toEqual(first);
        expect(repo.pointTransactions.filter((item) => item.type === 'deduction')).toHaveLength(1);
    });

    it('동일 키가 완료 외 상태면 idempotency conflict를 반환한다', async () => {
        const repo = new InMemoryPaidFeatureRepository();
        repo.executions.set('exec-conflict', {
            id: 'exec-conflict',
            status: 'pending',
            resultData: null,
            idempotencyKey: 'idem-conflict',
            userId: 'user-1',
            featureType: 'ai_report',
            targetId: 'notice-1',
            pricingMode: 'points',
            inputParams: {},
            createdAt: new Date().toISOString(),
        });

        await expect(
            executePaidFeatureWithRepository(repo, {
                userId: 'user-1',
                ...makeInput({
                    idempotencyKey: 'idem-conflict',
                }),
            })
        ).rejects.toThrow(PaidFeatureIdempotencyConflictError);
    });

    it('동일 파라미터 재요청(24시간 이내)은 캐시를 반환하고 재과금하지 않는다', async () => {
        const repo = new InMemoryPaidFeatureRepository();
        repo.pointBalance = 1000;
        const now = new Date();

        const first = await executePaidFeatureWithRepository(repo, {
            userId: 'user-1',
            ...makeInput({
                idempotencyKey: 'idem-cache-1',
                featureType: 'ai_report',
                inputParams: {
                    locale: 'ko',
                    mode: 'brief',
                },
            }),
            now,
        });

        const second = await executePaidFeatureWithRepository(repo, {
            userId: 'user-1',
            ...makeInput({
                idempotencyKey: 'idem-cache-2',
                featureType: 'ai_report',
                inputParams: {
                    mode: 'brief',
                    locale: 'ko',
                },
                requestMeta: {
                    source: 'retry',
                },
            }),
            now: new Date(now.getTime() + 60 * 60 * 1000),
        });

        expect(second).toEqual(first);
        expect(repo.pointBalance).toBe(700);
        expect(repo.pointTransactions.filter((item) => item.type === 'deduction')).toHaveLength(1);
    });

    it('동일 파라미터라도 24시간 초과 시 새 실행으로 과금된다', async () => {
        const repo = new InMemoryPaidFeatureRepository();
        repo.pointBalance = 1000;
        const now = new Date();

        const first = await executePaidFeatureWithRepository(repo, {
            userId: 'user-1',
            ...makeInput({
                idempotencyKey: 'idem-expire-1',
                featureType: 'ai_report',
                inputParams: {
                    locale: 'ko',
                },
            }),
            now,
        });

        const second = await executePaidFeatureWithRepository(repo, {
            userId: 'user-1',
            ...makeInput({
                idempotencyKey: 'idem-expire-2',
                featureType: 'ai_report',
                inputParams: {
                    locale: 'ko',
                },
            }),
            now: new Date(now.getTime() + 24 * 60 * 60 * 1000 + 60 * 1000),
        });

        expect(second.executionId).not.toBe(first.executionId);
        expect(repo.pointBalance).toBe(400);
        expect(repo.pointTransactions.filter((item) => item.type === 'deduction')).toHaveLength(2);
    });
});
