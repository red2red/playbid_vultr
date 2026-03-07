import type {
    MockBidEvaluationInput,
    MockBidEvaluationOutcome,
    MockBidEstimateItem,
    MockBidNoticeInput,
    MockBidStep1Data,
    MockBidStep1Options,
} from './mock-bid-types';

const DEFAULT_ESTIMATE_COUNT = 15;
const DEFAULT_RANGE_PERCENT = 2;
const DEFAULT_AMOUNT_ROUND_UNIT = 1000;
const REQUIRED_SELECTION_COUNT = 4;
export const DEFAULT_ADJUSTMENT_RATE_MIN = 87.745;
export const DEFAULT_ADJUSTMENT_RATE_MAX = 100;
export const DEFAULT_LOWER_LIMIT_RATE = 87.745;

const moneyFormatter = new Intl.NumberFormat('ko-KR');

function normalizePositiveInteger(value: number, fallback: number): number {
    if (!Number.isFinite(value) || value <= 0) {
        return fallback;
    }
    return Math.floor(value);
}

function roundToUnit(value: number, unit: number): number {
    return Math.round(value / unit) * unit;
}

function formatMoney(value: number): string {
    return `${moneyFormatter.format(Math.max(0, Math.floor(value)))}원`;
}

function normalizeSelectionIndices(indices: number[]): number[] {
    return [...new Set(indices.filter((index) => Number.isInteger(index) && index >= 0))];
}

function normalizeRangePercent(value: number | undefined, fallback: number): number {
    if (!Number.isFinite(value ?? NaN)) {
        return fallback;
    }
    return Math.max(0.1, Math.abs(value ?? fallback));
}

export function clampAdjustmentRate(
    rate: number,
    min = DEFAULT_ADJUSTMENT_RATE_MIN,
    max = DEFAULT_ADJUSTMENT_RATE_MAX
): number {
    if (!Number.isFinite(rate)) {
        return min;
    }
    return Math.min(Math.max(rate, min), max);
}

export function calculateLowerBidPrice(
    basicAmount: number,
    lowerLimitRate = DEFAULT_LOWER_LIMIT_RATE
): number {
    if (!Number.isFinite(basicAmount) || basicAmount <= 0) {
        return 0;
    }
    const normalizedLowerLimit = Math.max(0, lowerLimitRate);
    return Math.floor(basicAmount * (normalizedLowerLimit / 100));
}

export function calculateBidAmountByAdjustmentRate(args: {
    basicAmount: number;
    adjustmentRate: number;
    lowerLimitRate?: number;
}): number {
    const basicAmount = Number.isFinite(args.basicAmount) ? Math.max(0, args.basicAmount) : 0;
    const adjustmentRate = clampAdjustmentRate(args.adjustmentRate);
    const lowerLimitRate = args.lowerLimitRate ?? DEFAULT_LOWER_LIMIT_RATE;

    const calculated = basicAmount * (adjustmentRate / 100) * (Math.max(0, lowerLimitRate) / 100);
    return Math.floor(calculated);
}

export function calculateBidRateAgainstBasic(
    bidAmount: number,
    basicAmount: number
): number {
    if (!Number.isFinite(basicAmount) || basicAmount <= 0) {
        return 0;
    }
    if (!Number.isFinite(bidAmount) || bidAmount <= 0) {
        return 0;
    }

    return (bidAmount / basicAmount) * 100;
}

function clampInteger(value: number, min: number, max: number): number {
    return Math.min(Math.max(Math.round(value), min), max);
}

export function evaluateMockBidOutcome(
    input: MockBidEvaluationInput
): MockBidEvaluationOutcome {
    const basicAmount = Math.max(1, Math.floor(input.basicAmount));
    const bidAmount = Math.max(0, Math.floor(input.bidAmount));
    const lowerLimitRate = Math.max(0, input.lowerLimitRate);

    const plannedPrice = input.plannedPrice && input.plannedPrice > 0
        ? Math.floor(input.plannedPrice)
        : calculateLowerBidPrice(basicAmount, lowerLimitRate + 0.45);

    const winningRateRaw = calculateBidRateAgainstBasic(plannedPrice, basicAmount);
    const winningRate = Number(clampAdjustmentRate(winningRateRaw, lowerLimitRate, 100).toFixed(3));

    const myBidRate = calculateBidRateAgainstBasic(bidAmount, basicAmount);
    const rateGap = Math.abs(myBidRate - winningRate);

    const totalParticipants = clampInteger(48 + (basicAmount % 20), 30, 99);
    const rank = clampInteger(1 + Math.floor(rateGap * 7), 1, totalParticipants);
    const resultType = rank <= 3 ? 'success' : 'fail';

    const rankPercentile = Number((((totalParticipants - rank + 1) / totalParticipants) * 100).toFixed(2));
    const confidenceLevel = clampInteger(100 - rateGap * 10, 30, 99);
    const score = clampInteger((confidenceLevel * 0.65) + (rankPercentile * 0.35), 0, 100);

    const baseXp = 10;
    const rankBonus = resultType === 'success'
        ? 20
        : Math.max(0, 12 - Math.floor((rank - 1) / 4));
    const scoreBonus = Math.floor(score / 18);
    const xpGained = clampInteger(baseXp + rankBonus + scoreBonus, 10, 50);

    const actualPrice = plannedPrice;
    const priceDifference = bidAmount - actualPrice;
    const priceDifferencePercent = actualPrice > 0
        ? Number(((priceDifference / actualPrice) * 100).toFixed(4))
        : 0;

    return {
        resultType,
        rank,
        totalParticipants,
        score,
        xpGained,
        confidenceLevel,
        actualPrice,
        priceDifference,
        priceDifferencePercent,
        winningRate,
        rankPercentile,
    };
}

export function toggleEstimateSelection(
    selectedIndices: number[],
    targetIndex: number,
    maxSelection = REQUIRED_SELECTION_COUNT
): number[] {
    const normalized = normalizeSelectionIndices(selectedIndices);
    const existingIndex = normalized.indexOf(targetIndex);

    if (existingIndex >= 0) {
        return normalized.filter((index) => index !== targetIndex);
    }

    if (normalized.length >= Math.max(1, maxSelection)) {
        return normalized;
    }

    return [...normalized, targetIndex];
}

export function calculatePlannedPrice(
    estimates: MockBidEstimateItem[],
    selectedIndices: number[],
    requiredSelectionCount = REQUIRED_SELECTION_COUNT
): number | null {
    const normalized = normalizeSelectionIndices(selectedIndices)
        .filter((index) => index < estimates.length);

    if (normalized.length !== Math.max(1, requiredSelectionCount)) {
        return null;
    }

    const total = normalized.reduce((sum, index) => sum + estimates[index].amount, 0);
    return Math.floor(total / normalized.length);
}

export function buildMockBidStep1Data(
    input: MockBidNoticeInput,
    options: MockBidStep1Options = {}
): MockBidStep1Data {
    const estimateCount = normalizePositiveInteger(
        options.estimateCount ?? DEFAULT_ESTIMATE_COUNT,
        DEFAULT_ESTIMATE_COUNT
    );
    const rangePercent = normalizeRangePercent(options.rangePercent, DEFAULT_RANGE_PERCENT);
    const rangeBeginPercent = normalizeRangePercent(options.rangeBeginPercent, rangePercent);
    const rangeEndPercent = normalizeRangePercent(options.rangeEndPercent, rangePercent);
    const amountRoundUnit = normalizePositiveInteger(
        options.amountRoundUnit ?? DEFAULT_AMOUNT_ROUND_UNIT,
        DEFAULT_AMOUNT_ROUND_UNIT
    );

    const basicAmount = Math.max(1, Math.floor(input.basicAmount));
    const lowerLimitRate = Number.isFinite(input.lowerLimitRate)
        ? Math.max(0, input.lowerLimitRate ?? DEFAULT_LOWER_LIMIT_RATE)
        : DEFAULT_LOWER_LIMIT_RATE;
    const ratioStep = estimateCount > 1 ? (rangeBeginPercent + rangeEndPercent) / (estimateCount - 1) : 0;

    const estimates: MockBidEstimateItem[] = Array.from({ length: estimateCount }).map((_, index) => {
        const ratioPercent = Number((-rangeBeginPercent + ratioStep * index).toFixed(3));
        const amount = roundToUnit(basicAmount * (1 + ratioPercent / 100), amountRoundUnit);

        return {
            id: `estimate-${index + 1}`,
            order: index + 1,
            ratioPercent,
            amount,
            amountLabel: formatMoney(amount),
        };
    });

    const estimateMinAmount = estimates.length > 0 ? estimates[0].amount : basicAmount;
    const estimateMaxAmount = estimates.length > 0 ? estimates[estimates.length - 1].amount : basicAmount;

    return {
        notice: {
            id: input.id,
            noticeNumber: input.noticeNumber,
            title: input.title,
            organization: input.organization,
            basicAmount,
            basicAmountLabel: formatMoney(basicAmount),
            priceRangeLabel: `-${rangeBeginPercent.toFixed(1)}% ~ +${rangeEndPercent.toFixed(1)}%`,
            estimateMinAmount,
            estimateMaxAmount,
            estimateMinAmountLabel: formatMoney(estimateMinAmount),
            estimateMaxAmountLabel: formatMoney(estimateMaxAmount),
            lowerLimitRate,
        },
        estimates,
    };
}

export function buildOfficialMockBidStep1Data(
    input: MockBidNoticeInput,
    options: MockBidStep1Options = {}
): MockBidStep1Data {
    if (
        options.rangeBeginPercent === undefined ||
        options.rangeEndPercent === undefined ||
        !Number.isFinite(input.lowerLimitRate ?? Number.NaN)
    ) {
        throw new Error('Official range data is required');
    }

    return buildMockBidStep1Data(input, options);
}
