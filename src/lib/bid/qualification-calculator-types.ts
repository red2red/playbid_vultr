export type QualificationCategory = 'construction' | 'service' | 'goods';

export interface QualificationPerfMultiplierRule {
    minAmount: number;
    maxAmount: number | null;
    multiplier: number;
    description: string | null;
}

export interface QualificationSignalBonusConfig {
    womanEnterprise: number;
    disabledEnterprise: number;
    socialEnterprise: number;
    jobCreation: number;
    smallEnterprise: number;
    maxBonus: number;
}

export interface QualificationRuleConfig {
    perfScore: number;
    mgmtScore: number;
    priceScore: number;
    priceCoef: number;
    lowerLimit: number;
    passingScore: number;
    useAValue: boolean;
    techScore: number;
    maxStartScore: number;
    priceParams: Record<string, unknown> | null;
    perfMultiplier: number;
    perfMultiplierRules: QualificationPerfMultiplierRule[];
    signalBonus: QualificationSignalBonusConfig | null;
}

export interface QualificationReviewMaster {
    id: string;
    agencyName: string;
    reviewName: string;
    category: string;
    minAmount: number;
    maxAmount: number | null;
    parentType: string;
    priority: number;
    ruleConfig: QualificationRuleConfig | null;
}

export interface QualificationCalculatorNoticePrefill {
    noticeId: string | null;
    noticeNumber: string | null;
    noticeOrder: string | null;
    noticeName: string;
    category: QualificationCategory;
    lowerLimit: number | null;
    baseAmount: number | null;
    aValue: number | null;
    bidMethodName: string | null;
    agencyName: string | null;
}

export interface QualificationCalculatorPageData {
    prefill: QualificationCalculatorNoticePrefill;
    availableRules: QualificationReviewMaster[];
    selectedRuleId: string | null;
}

export type QualificationCreditRatingCode =
    | 'AAA'
    | 'AA+'
    | 'AA'
    | 'AA-'
    | 'A+'
    | 'A'
    | 'A-'
    | 'BBB+'
    | 'BBB'
    | 'BBB-'
    | 'BB+'
    | 'BB'
    | 'BB-'
    | 'B+'
    | 'B'
    | 'B-'
    | 'C'
    | 'D';

export interface QualificationCreditRatingOption {
    code: QualificationCreditRatingCode;
    score: number;
}

export interface QualificationSignalBonusFlags {
    womanEnterprise: boolean;
    disabledEnterprise: boolean;
    socialEnterprise: boolean;
    jobCreation: boolean;
    smallEnterprise: boolean;
}

export interface QualificationCalculationInput {
    category: QualificationCategory;
    customLowerLimit: number | null;
    baseAmount: number | null;
    aValue: number;
    performanceAmount: number;
    creditRatingScore: number;
    techScore: number;
    disqualificationScore: number;
    signalFlags: QualificationSignalBonusFlags;
    selectedRuleConfig: QualificationRuleConfig | null;
}

export type QualificationResultStatus = 'success' | 'warning' | 'error';

export interface QualificationCalculationResult {
    status: QualificationResultStatus;
    message: string;
    capabilityScore: number;
    signalScore: number;
    requiredPriceScore: number;
    effectiveLowerLimit: number;
    priceMaxScore: number;
    passingScore: number;
    finalBidRate: number;
    rawOptimalBidRate: number;
    targetAmount: number | null;
    totalScoreAtLowerLimit: number;
    priceScoreAtLowerLimit: number;
    priceCoefFactor: number;
}

export interface QualificationCalculationSavePayload {
    noticeId: string | null;
    noticeNumber: string | null;
    category: QualificationCategory;
    reviewMasterId: string | null;
    input: QualificationCalculationInput;
    result: QualificationCalculationResult;
}
