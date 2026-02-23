export type OpeningStatusFilter = 'all' | 'awarded' | 'failed' | 'rebid';

export type OpeningStatus = 'awarded' | 'failed' | 'rebid' | 'unknown';

export interface OpeningResultFilters {
    status: OpeningStatusFilter;
    datePreset: 'all' | 'today' | 'week' | 'month';
    dateFrom?: string;
    dateTo?: string;
    category: string;
    query: string;
    page: number;
    pageSize: number;
}

export interface OpeningResultListItem {
    id: string;
    bidNoticeNo: string;
    bidNoticeOrd?: string;
    title: string;
    organization: string;
    demandOrganization?: string;
    bidCategory: string;
    openingAtIso: string;
    openingAtLabel: string;
    openingDateShort: string;
    status: OpeningStatus;
    statusRaw?: string;
    participantCount: number | null;
    winningCompany: string | null;
    winningAmount: number | null;
    winningAmountLabel: string;
    winningRate: number | null;
    winningRateLabel: string;
    adjustmentRate: number | null;
    deviation: number | null;
    deviationLabel: string;
    hasMyBid: boolean;
    bidNoticeId?: string;
}

export interface OpeningSummary {
    totalCount: number;
    awardedCount: number;
    failedCount: number;
    rebidCount: number;
    averageWinningRate: number | null;
    averageParticipantCount: number | null;
    myParticipatedCount: number;
}

export interface OpeningListError {
    requestId: string;
    code: string;
    message: string;
    suggestion: string;
}

export interface OpeningResultsListData {
    filters: OpeningResultFilters;
    summary: OpeningSummary;
    items: OpeningResultListItem[];
    totalCount: number;
    totalPages: number;
    page: number;
    pageSize: number;
    error?: OpeningListError;
}

export interface OpeningParticipantItem {
    rank: number;
    companyName: string;
    bidAmount: number | null;
    bidAmountLabel: string;
    bidRate: number | null;
    bidRateLabel: string;
    isWinner: boolean;
}

export interface OpeningMyComparison {
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
    suggestedMessage: string;
}

export interface OpeningResultDetail {
    id: string;
    bidNoticeNo: string;
    bidNoticeOrd?: string;
    title: string;
    organization: string;
    demandOrganization?: string;
    bidCategory: string;
    status: OpeningStatus;
    statusRaw?: string;
    openingAtIso: string;
    openingAtLabel: string;
    resultNotice?: string;
    participantCount: number | null;
    participantCountLabel: string;
    winningCompany: string | null;
    winningAmount: number | null;
    winningAmountLabel: string;
    winningRate: number | null;
    winningRateLabel: string;
    adjustmentRate: number | null;
    adjustmentRateLabel: string;
    deviation: number | null;
    deviationLabel: string;
    participants: OpeningParticipantItem[];
    myComparison: OpeningMyComparison | null;
    bidNoticeId?: string;
}

export interface OpeningResultDetailData {
    detail: OpeningResultDetail | null;
    error?: OpeningListError;
}
