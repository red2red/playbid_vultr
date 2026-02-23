export type BidHistoryStatusFilter = 'all' | 'success' | 'fail' | 'pending' | 'void';

export type BidHistoryStatus = 'success' | 'fail' | 'pending' | 'void' | 'unknown';

export type BidHistorySortOption =
    | 'latest'
    | 'oldest'
    | 'bid_amount_desc'
    | 'bid_amount_asc'
    | 'confidence_desc'
    | 'deviation_asc';

export interface BidHistoryFilters {
    status: BidHistoryStatusFilter;
    datePreset: 'all' | '1m' | '3m' | '6m' | 'custom';
    dateFrom?: string;
    dateTo?: string;
    organization: string;
    category: string;
    query: string;
    onlyWithResult: boolean;
    sort: BidHistorySortOption;
    page: number;
    pageSize: number;
}

export interface BidHistoryError {
    requestId: string;
    code: string;
    message: string;
    suggestion: string;
}

export interface BidHistoryListItem {
    id: string;
    bidNoticeId?: string;
    bidNoticeNo: string;
    bidNoticeOrd?: string;
    title: string;
    organization: string;
    demandOrganization?: string;
    category: string;
    categoryLabel: string;
    status: BidHistoryStatus;
    statusRaw?: string;
    predictionMadeAtIso: string;
    predictionMadeAtLabel: string;
    predictedPrice: number;
    predictedPriceLabel: string;
    predictedRate: number | null;
    predictedRateLabel: string;
    confidenceLevel: number | null;
    confidenceLabel: string;
    virtualRank: number | null;
    totalParticipants: number | null;
    predictedRankLabel: string;
    hasResult: boolean;
    winningAmount: number | null;
    winningAmountLabel: string;
    winningRate: number | null;
    winningRateLabel: string;
    deviationPercent: number | null;
    deviationPercentLabel: string;
    differenceAmount: number | null;
    differenceAmountLabel: string;
    actualWinner: string | null;
    accuracyRate: number | null;
    accuracyRateLabel: string;
    bidResultId?: string;
}

export interface BidHistorySummary {
    totalCount: number;
    successCount: number;
    failCount: number;
    pendingCount: number;
    voidCount: number;
    withResultCount: number;
    successRate: number | null;
    averageDeviationPercent: number | null;
    averageBidRate: number | null;
}

export interface BidHistoryCategoryStat {
    category: string;
    categoryLabel: string;
    totalCount: number;
    successCount: number;
    successRate: number | null;
    averageBidRate: number | null;
}

export interface BidHistoryMonthlyTrend {
    monthKey: string;
    monthLabel: string;
    totalCount: number;
    successCount: number;
    successRate: number | null;
}

export interface BidHistoryListData {
    filters: BidHistoryFilters;
    summary: BidHistorySummary;
    categoryStats: BidHistoryCategoryStat[];
    monthlyTrends: BidHistoryMonthlyTrend[];
    organizationOptions: string[];
    items: BidHistoryListItem[];
    totalCount: number;
    totalPages: number;
    page: number;
    pageSize: number;
    error?: BidHistoryError;
}

export interface BidHistoryParticipant {
    rank: number;
    companyName: string;
    bidAmount: number | null;
    bidAmountLabel: string;
    bidRate: number | null;
    bidRateLabel: string;
    isWinner: boolean;
}

export interface BidHistoryComparison {
    myBidAmount: number;
    myBidAmountLabel: string;
    myBidRate: number | null;
    myBidRateLabel: string;
    winningAmount: number | null;
    winningAmountLabel: string;
    winningRate: number | null;
    winningRateLabel: string;
    amountGap: number | null;
    amountGapLabel: string;
    rateGap: number | null;
    rateGapLabel: string;
    insight: string;
}

export interface BidHistoryAnalysisDetail extends BidHistoryListItem {
    predictionReason: string | null;
    note: string | null;
    resultNotice: string | null;
    participantCount: number | null;
    participantCountLabel: string;
    participants: BidHistoryParticipant[];
    bidNoticeHref: string;
    openingResultHref?: string;
}

export interface BidHistoryAnalysisData {
    detail: BidHistoryAnalysisDetail | null;
    comparison: BidHistoryComparison | null;
    error?: BidHistoryError;
}

export interface BidHistoryCsvPayload {
    filename: string;
    csv: string;
    error?: BidHistoryError;
}
