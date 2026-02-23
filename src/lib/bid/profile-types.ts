export type SubscriptionStatus = 'active' | 'expired' | 'trial' | 'free' | 'unknown';

export type PointTransactionType = 'purchase' | 'deduction' | 'refund' | 'other';

export interface NotificationPreferencesInfo {
    pushEnabled: boolean;
    bidNew: boolean;
    bidDeadline: boolean;
    bidDeadlineOption: string;
    bidResult: boolean;
    aiAnalysis: boolean;
    levelUp: boolean;
    badge: boolean;
    dailyMission: boolean;
    rankingChange: boolean;
    promotion: boolean;
    appUpdate: boolean;
    quietHoursEnabled: boolean;
    quietHoursStart: string;
    quietHoursEnd: string;
    weekendEnabled: boolean;
    hasPreferenceTable: boolean;
}

export interface NotificationPreferencesUpdateInput {
    pushEnabled?: boolean;
    bidNew?: boolean;
    bidDeadline?: boolean;
    bidDeadlineOption?: string;
    bidResult?: boolean;
    aiAnalysis?: boolean;
    levelUp?: boolean;
    badge?: boolean;
    dailyMission?: boolean;
    rankingChange?: boolean;
    promotion?: boolean;
    appUpdate?: boolean;
    quietHoursEnabled?: boolean;
    quietHoursStart?: string;
    quietHoursEnd?: string;
    weekendEnabled?: boolean;
}

export interface ProfileOverview {
    userId: string;
    name: string;
    email: string;
    nickname?: string;
    company?: string;
    position?: string;
    phone?: string;
    avatarUrl?: string;
    joinedAtIso?: string;
    joinedAtLabel: string;
}

export interface SubscriptionInfo {
    planKey: string;
    planLabel: string;
    status: SubscriptionStatus;
    statusLabel: string;
    expiresAtIso?: string;
    expiresAtLabel?: string;
    daysRemaining: number | null;
    paymentMethod: string;
    paymentMethodLabel: string;
}

export interface PointTransactionItem {
    id: string;
    type: PointTransactionType;
    typeRaw: string;
    typeLabel: string;
    amount: number;
    amountLabel: string;
    balanceAfter: number | null;
    balanceAfterLabel: string;
    description: string;
    createdAtIso: string;
    createdAtLabel: string;
}

export interface PointsInfo {
    balance: number;
    balanceLabel: string;
    recentTransactions: PointTransactionItem[];
    hasTransactionTable: boolean;
}

export interface ProfileUsageStats {
    bookmarkCount: number;
    mockBidCount: number;
    unreadNotificationCount: number;
    premiumExecutionCount: number;
}

export interface ProfileDataError {
    requestId: string;
    code: string;
    message: string;
    suggestion: string;
}

export interface ProfileOverviewData {
    profile: ProfileOverview;
    subscription: SubscriptionInfo;
    points: PointsInfo;
    notificationPreferences: NotificationPreferencesInfo;
    usageStats: ProfileUsageStats;
    error?: ProfileDataError;
}

export interface PointHistoryFilters {
    type: 'all' | 'purchase' | 'deduction' | 'refund';
    page: number;
    pageSize: number;
}

export interface PointHistoryData {
    filters: PointHistoryFilters;
    items: PointTransactionItem[];
    totalCount: number;
    totalPages: number;
    page: number;
    pageSize: number;
    balance: number;
    balanceLabel: string;
    hasTransactionTable: boolean;
    error?: ProfileDataError;
}
