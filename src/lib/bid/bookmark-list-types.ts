export type BookmarkDeadlineFilter = 'all' | 'urgent' | 'week';

export type BookmarkSortOption =
    | 'saved_latest'
    | 'saved_oldest'
    | 'deadline_soon'
    | 'price_desc'
    | 'title_asc';

export interface BookmarkListFilters {
    category: string;
    deadline: BookmarkDeadlineFilter;
    query: string;
    sort: BookmarkSortOption;
    page: number;
    pageSize: number;
}

export interface BookmarkListError {
    requestId: string;
    code: string;
    message: string;
    suggestion: string;
}

export interface BookmarkListItem {
    scrapId: string;
    noticeId: string;
    noticeNumber: string;
    noticeOrder?: string;
    title: string;
    organization: string;
    demandOrganization?: string;
    category: string;
    categoryLabel: string;
    estimatedPrice: number | null;
    estimatedPriceLabel: string;
    deadlineAtIso: string | null;
    deadlineAtLabel: string;
    isDeadlineSoon: boolean;
    isClosed: boolean;
    savedAtIso: string;
    savedAtLabel: string;
}

export interface BookmarkSummary {
    totalCount: number;
    urgentCount: number;
    closedCount: number;
}

export interface BookmarkListData {
    filters: BookmarkListFilters;
    summary: BookmarkSummary;
    items: BookmarkListItem[];
    totalCount: number;
    totalPages: number;
    page: number;
    pageSize: number;
    error?: BookmarkListError;
}
