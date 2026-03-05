export interface MockBidNoticeInput {
    id: string;
    noticeNumber?: string;
    title: string;
    organization: string;
    basicAmount: number;
    lowerLimitRate?: number;
}

export interface MockBidEstimateItem {
    id: string;
    order: number;
    ratioPercent: number;
    amount: number;
    amountLabel: string;
}

export interface MockBidNoticeSummary extends MockBidNoticeInput {
    basicAmountLabel: string;
    priceRangeLabel: string;
    estimateMinAmount: number;
    estimateMaxAmount: number;
    estimateMinAmountLabel: string;
    estimateMaxAmountLabel: string;
    lowerLimitRate: number;
}

export interface MockBidStep1Data {
    notice: MockBidNoticeSummary;
    estimates: MockBidEstimateItem[];
}

export interface MockBidStep1Options {
    estimateCount?: number;
    rangePercent?: number;
    rangeBeginPercent?: number;
    rangeEndPercent?: number;
    amountRoundUnit?: number;
}

export type MockBidResultType = 'success' | 'fail' | 'pending' | 'void';

export interface MockBidEvaluationInput {
    basicAmount: number;
    bidAmount: number;
    lowerLimitRate: number;
    plannedPrice?: number | null;
}

export interface MockBidEvaluationOutcome {
    resultType: MockBidResultType;
    rank: number;
    totalParticipants: number;
    score: number;
    xpGained: number;
    confidenceLevel: number;
    actualPrice: number;
    priceDifference: number;
    priceDifferencePercent: number;
    winningRate: number;
    rankPercentile: number;
}
