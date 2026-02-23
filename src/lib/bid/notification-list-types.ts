export type NotificationType = 'deadline' | 'result' | 'system' | 'premium';

export type NotificationTypeFilter = NotificationType | 'all';

export type NotificationReadFilter = 'all' | 'unread';

export type NotificationSortOption = 'latest' | 'oldest';

export interface NotificationListFilters {
    type: NotificationTypeFilter;
    read: NotificationReadFilter;
    query: string;
    sort: NotificationSortOption;
    page: number;
    pageSize: number;
}

export interface NotificationListItem {
    id: string;
    type: NotificationType;
    typeRaw: string;
    title: string;
    body: string;
    isRead: boolean;
    createdAtIso: string;
    createdAtLabel: string;
    relativeTimeLabel: string;
    bidHistoryId?: string;
    actionHref?: string;
    actionLabel?: string;
    data: Record<string, unknown>;
}

export interface NotificationTypeCounts {
    all: number;
    deadline: number;
    result: number;
    system: number;
    premium: number;
}

export interface NotificationSummary {
    totalCount: number;
    unreadCount: number;
    typeCounts: NotificationTypeCounts;
}

export interface NotificationListError {
    requestId: string;
    code: string;
    message: string;
    suggestion: string;
}

export interface NotificationListData {
    filters: NotificationListFilters;
    summary: NotificationSummary;
    items: NotificationListItem[];
    totalCount: number;
    totalPages: number;
    page: number;
    pageSize: number;
    error?: NotificationListError;
}
