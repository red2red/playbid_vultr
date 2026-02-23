import type {
    QualificationCalculationInput,
    QualificationCalculationResult,
    QualificationCategory,
    QualificationCreditRatingOption,
    QualificationRuleConfig,
    QualificationSignalBonusFlags,
} from './qualification-calculator-types';

const DEFAULT_SIGNAL_BONUS = {
    womanEnterprise: 1.0,
    disabledEnterprise: 1.0,
    socialEnterprise: 0.5,
    jobCreation: 0.5,
    smallEnterprise: 0.5,
    maxBonus: 3.0,
} as const;

const CATEGORY_FALLBACK_LOWER_LIMIT: Record<QualificationCategory, number> = {
    goods: 84.245,
    service: 84.245,
    construction: 89.745,
};

export const QUALIFICATION_CREDIT_RATINGS: QualificationCreditRatingOption[] = [
    { code: 'AAA', score: 20.0 },
    { code: 'AA+', score: 19.8 },
    { code: 'AA', score: 19.6 },
    { code: 'AA-', score: 19.4 },
    { code: 'A+', score: 19.2 },
    { code: 'A', score: 19.0 },
    { code: 'A-', score: 18.8 },
    { code: 'BBB+', score: 18.6 },
    { code: 'BBB', score: 18.4 },
    { code: 'BBB-', score: 18.2 },
    { code: 'BB+', score: 18.0 },
    { code: 'BB', score: 17.8 },
    { code: 'BB-', score: 17.6 },
    { code: 'B+', score: 19.0 },
    { code: 'B', score: 18.0 },
    { code: 'B-', score: 17.0 },
    { code: 'C', score: 16.0 },
    { code: 'D', score: 15.0 },
];

export const DEFAULT_SIGNAL_FLAGS: QualificationSignalBonusFlags = {
    womanEnterprise: false,
    disabledEnterprise: false,
    socialEnterprise: false,
    jobCreation: false,
    smallEnterprise: false,
};

function clamp(value: number, min: number, max: number): number {
    return Math.min(Math.max(value, min), max);
}

function resolvePriceCoefFactor(ruleConfig: QualificationRuleConfig | null, priceMaxScore: number): number {
    const fromConfig = ruleConfig?.priceParams?.factor;
    if (typeof fromConfig === 'number' && Number.isFinite(fromConfig) && fromConfig > 0) {
        return fromConfig;
    }
    return priceMaxScore >= 60 ? 4.0 : 2.0;
}

function resolveEffectiveLowerLimit(input: QualificationCalculationInput): number {
    return (
        input.customLowerLimit ??
        input.selectedRuleConfig?.lowerLimit ??
        CATEGORY_FALLBACK_LOWER_LIMIT[input.category]
    );
}

function resolvePerformanceMultiplier(input: QualificationCalculationInput, baseAmount: number): number {
    const ruleConfig = input.selectedRuleConfig;
    if (ruleConfig) {
        if (ruleConfig.perfMultiplierRules.length > 0) {
            let multiplier = ruleConfig.perfMultiplier > 0 ? ruleConfig.perfMultiplier : 1.0;

            for (const rule of ruleConfig.perfMultiplierRules) {
                const isAboveMin = baseAmount >= rule.minAmount;
                const isBelowMax = rule.maxAmount === null || baseAmount < rule.maxAmount;

                if (isAboveMin && isBelowMax) {
                    multiplier = rule.multiplier;
                    break;
                }
            }

            return multiplier;
        }

        if (ruleConfig.perfMultiplier > 0) {
            return ruleConfig.perfMultiplier;
        }

        return 1.0;
    }

    if (input.category === 'construction') {
        if (baseAmount >= 100000000000) return 2.0;
        if (baseAmount >= 5000000000) return 2.0;
        if (baseAmount >= 1000000000) return 1.0;
        if (baseAmount >= 300000000) return 0.5;
        if (baseAmount >= 200000000) return 0.5;
        return 0.0;
    }

    if (input.category === 'service') {
        if (baseAmount >= 500000000) return 1.0;
        if (baseAmount >= 100000000) return 0.5;
        return 0.0;
    }

    if (baseAmount >= 100000000) return 1.0;
    if (baseAmount >= 50000000) return 1.0;
    return 0.0;
}

function calculatePerformanceScore(input: QualificationCalculationInput): number {
    const baseAmount = input.baseAmount ?? 0;
    if (baseAmount <= 0) {
        return 0;
    }

    const multiplier = resolvePerformanceMultiplier(input, baseAmount);
    const requiredAmount = baseAmount * multiplier;

    if (requiredAmount <= 0) {
        return 0;
    }

    return clamp((input.performanceAmount / requiredAmount) * 10.0, 0, 10);
}

function calculateSignalScore(input: QualificationCalculationInput): number {
    const config = input.selectedRuleConfig?.signalBonus;
    const flags = input.signalFlags;

    let score = 0;

    if (config) {
        if (flags.womanEnterprise) score += config.womanEnterprise;
        if (flags.disabledEnterprise) score += config.disabledEnterprise;
        if (flags.socialEnterprise) score += config.socialEnterprise;
        if (flags.jobCreation) score += config.jobCreation;
        if (flags.smallEnterprise) score += config.smallEnterprise;

        return Math.min(score, config.maxBonus);
    }

    if (flags.womanEnterprise) score += DEFAULT_SIGNAL_BONUS.womanEnterprise;
    if (flags.disabledEnterprise) score += DEFAULT_SIGNAL_BONUS.disabledEnterprise;
    if (flags.socialEnterprise) score += DEFAULT_SIGNAL_BONUS.socialEnterprise;
    if (flags.jobCreation) score += DEFAULT_SIGNAL_BONUS.jobCreation;
    if (flags.smallEnterprise) score += DEFAULT_SIGNAL_BONUS.smallEnterprise;

    const maxBonus = input.selectedRuleConfig?.maxStartScore ?? DEFAULT_SIGNAL_BONUS.maxBonus;
    if (maxBonus > 0 && score > maxBonus) {
        return maxBonus;
    }

    return score;
}

function buildResultMessage(params: {
    capabilityScore: number;
    signalScore: number;
    requiredPriceScore: number;
    rawOptimalBidRate: number;
    finalOptimalBidRate: number;
    effectiveLowerLimit: number;
    passingScore: number;
    priceMaxScore: number;
    totalScoreAtLowerLimit: number;
    disqualificationScore: number;
    techMaxScore: number;
}): { status: 'success' | 'warning' | 'error'; message: string } {
    const {
        capabilityScore,
        signalScore,
        requiredPriceScore,
        rawOptimalBidRate,
        finalOptimalBidRate,
        effectiveLowerLimit,
        passingScore,
        priceMaxScore,
        totalScoreAtLowerLimit,
        disqualificationScore,
        techMaxScore,
    } = params;

    const capabilityDeficit = 30.0 - capabilityScore;

    if (requiredPriceScore > priceMaxScore) {
        const minCapability =
            passingScore - priceMaxScore - signalScore - techMaxScore + disqualificationScore;

        return {
            status: 'error',
            message:
                `❌ 입찰 불가 (수행능력 부족)\n` +
                `가격점수 만점(${priceMaxScore.toFixed(0)}점)으로도 통과 불가\n` +
                `최소 수행능력: ${minCapability.toFixed(1)}점 필요\n` +
                `현재 수행능력: ${capabilityScore.toFixed(1)}점`,
        };
    }

    if (totalScoreAtLowerLimit < passingScore) {
        const shortfall = passingScore - totalScoreAtLowerLimit;
        return {
            status: 'warning',
            message:
                `⚠️ 낙찰 어려움 (하한율 투찰로도 ${shortfall.toFixed(1)}점 부족)\n` +
                `하한율(${effectiveLowerLimit.toFixed(3)}%) 투찰 시 예상 점수: ${totalScoreAtLowerLimit.toFixed(1)}점\n` +
                `통과 기준: ${passingScore.toFixed(0)}점\n\n` +
                `💡 수행능력을 높이거나, 다른 공고를 검토하세요.`,
        };
    }

    if (rawOptimalBidRate < effectiveLowerLimit) {
        if (capabilityDeficit <= 0) {
            return {
                status: 'success',
                message:
                    `✅ 수행능력 만점! 최적 투찰 조건\n` +
                    `하한율(${effectiveLowerLimit.toFixed(3)}%) 근처 투찰 권장\n` +
                    `예상 종합점수: ${totalScoreAtLowerLimit.toFixed(1)}점`,
            };
        }

        return {
            status: 'success',
            message:
                `✅ 낙찰 가능권 (하한율 투찰 가능)\n` +
                `하한율(${effectiveLowerLimit.toFixed(3)}%) 투찰 시\n` +
                `예상 종합점수: ${totalScoreAtLowerLimit.toFixed(1)}점`,
        };
    }

    const rateAboveLowerLimit = finalOptimalBidRate - effectiveLowerLimit;
    return {
        status: 'warning',
        message:
            `⚠️ 수행능력 ${capabilityDeficit.toFixed(1)}점 부족\n` +
            `만회를 위해 목표 투찰률 ${finalOptimalBidRate.toFixed(3)}% 권장\n` +
            `(하한율 대비 +${rateAboveLowerLimit.toFixed(3)}%p)\n\n` +
            `💡 경쟁이 치열하면 낙찰 확률이 낮습니다.`,
    };
}

export function calculateQualificationResult(
    input: QualificationCalculationInput
): QualificationCalculationResult {
    const ruleConfig = input.selectedRuleConfig;
    const passingScore = ruleConfig?.passingScore ?? 85.0;
    const priceMaxScore = ruleConfig?.priceScore ?? 70.0;
    const priceCoef = ruleConfig?.priceCoef ?? 88.0;
    const techMaxScore = ruleConfig?.techScore ?? 0.0;
    const priceCoefFactor = resolvePriceCoefFactor(ruleConfig, priceMaxScore);

    const performanceScore = calculatePerformanceScore(input);
    const signalScore = calculateSignalScore(input);

    const capabilityScore =
        performanceScore +
        input.creditRatingScore +
        input.techScore +
        signalScore -
        input.disqualificationScore;

    const effectiveLowerLimit = resolveEffectiveLowerLimit(input);

    const priceScoreAtLowerLimit =
        priceMaxScore - priceCoefFactor * Math.abs(priceCoef - effectiveLowerLimit);

    // Flutter 앱 로직과 동일하게 신인도 점수를 총점 계산에 한 번 더 반영한다.
    const totalScoreAtLowerLimit = capabilityScore + signalScore + priceScoreAtLowerLimit;
    const requiredPriceScore = passingScore - capabilityScore - signalScore;
    const rawOptimalBidRate =
        priceCoef - (priceMaxScore - requiredPriceScore) / priceCoefFactor;

    const finalOptimalBidRate =
        rawOptimalBidRate < effectiveLowerLimit ? effectiveLowerLimit : rawOptimalBidRate;

    const baseAmount = input.baseAmount ?? 0;
    let targetAmount: number | null = null;
    let finalBidRate = finalOptimalBidRate;

    if (baseAmount > 0) {
        targetAmount = Math.floor((baseAmount - input.aValue) * (finalBidRate / 100.0) + input.aValue);
        if (targetAmount > 0) {
            finalBidRate = (targetAmount / baseAmount) * 100.0;
        }
    }

    const resultMessage = buildResultMessage({
        capabilityScore,
        signalScore,
        requiredPriceScore,
        rawOptimalBidRate,
        finalOptimalBidRate,
        effectiveLowerLimit,
        passingScore,
        priceMaxScore,
        totalScoreAtLowerLimit,
        disqualificationScore: input.disqualificationScore,
        techMaxScore,
    });

    return {
        status: resultMessage.status,
        message: resultMessage.message,
        capabilityScore,
        signalScore,
        requiredPriceScore,
        effectiveLowerLimit,
        priceMaxScore,
        passingScore,
        finalBidRate,
        rawOptimalBidRate,
        targetAmount,
        totalScoreAtLowerLimit,
        priceScoreAtLowerLimit,
        priceCoefFactor,
    };
}

export function createDefaultRuleConfig(category: QualificationCategory): QualificationRuleConfig {
    if (category === 'construction') {
        return {
            perfScore: 10,
            mgmtScore: 19,
            priceScore: 70,
            priceCoef: 88,
            lowerLimit: 89.745,
            passingScore: 85,
            useAValue: true,
            techScore: 0,
            maxStartScore: 0,
            priceParams: null,
            perfMultiplier: 1,
            perfMultiplierRules: [],
            signalBonus: null,
        };
    }

    if (category === 'service') {
        return {
            perfScore: 0,
            mgmtScore: 30,
            priceScore: 70,
            priceCoef: 88,
            lowerLimit: 87.745,
            passingScore: 85,
            useAValue: false,
            techScore: 0,
            maxStartScore: 0,
            priceParams: null,
            perfMultiplier: 1,
            perfMultiplierRules: [],
            signalBonus: null,
        };
    }

    return {
        perfScore: 0,
        mgmtScore: 30,
        priceScore: 70,
        priceCoef: 88,
        lowerLimit: 84.245,
        passingScore: 85,
        useAValue: false,
        techScore: 0,
        maxStartScore: 0,
        priceParams: null,
        perfMultiplier: 1,
        perfMultiplierRules: [],
        signalBonus: null,
    };
}
