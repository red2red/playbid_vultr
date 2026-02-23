export type NoticeCategory = 'construction' | 'service' | 'product' | 'goods' | 'unknown';

export type NoticeStatus = 'open' | 'closing_soon' | 'closed';

export type NoticeTimelineStatus = 'completed' | 'current' | 'upcoming';

export interface NoticeTimelineItem {
    key: 'published' | 'start' | 'deadline' | 'opening';
    label: string;
    dateTime: string;
    status: NoticeTimelineStatus;
}

export interface NoticeDetailSections {
    overview: string;
    qualification: string;
    documents: string;
    etc: string;
}

export interface NoticeDetail {
    id: string;
    noticeNumber: string;
    noticeOrder?: string;
    title: string;
    organization: string;
    demander?: string;
    displayCategory: NoticeCategory;
    queryCategory: NoticeCategory;
    status: NoticeStatus;
    publishedAt: string;
    publishedAtIso: string;
    bidStartAt: string;
    bidStartAtIso: string;
    bidDeadlineAt: string;
    bidDeadlineAtIso: string;
    openingAt: string;
    openingAtIso: string;
    budget: number;
    estimatedPrice: number;
    bidMethod: string;
    contractMethod: string;
    qualificationSummary: string;
    views: number;
    sourceUrl: string;
    qualificationRequired: boolean;
    timeline: NoticeTimelineItem[];
    detailSections: NoticeDetailSections;
}

export interface NoticeAttachment {
    id: string;
    name: string;
    sizeLabel: string;
    url: string;
}

export interface SimilarNotice {
    id: string;
    noticeNumber: string;
    title: string;
    organization: string;
    budgetLabel: string;
    deadlineAt: string;
    status: NoticeStatus;
    category: NoticeCategory;
}

export interface PremiumPreviewStats {
    averageParticipants: number;
    averageSuccessRate: number;
    similarRateTrend: number[];
    isLocked: boolean;
}

export interface NoticeErrorPayload {
    requestId: string;
    code: string;
    message: string;
    suggestion: string;
}

export interface NoticeDetailPageData {
    notice: NoticeDetail;
    attachments: NoticeAttachment[];
    similarNotices: SimilarNotice[];
    premiumPreview: PremiumPreviewStats;
    isBookmarked: boolean;
    error?: NoticeErrorPayload;
}
